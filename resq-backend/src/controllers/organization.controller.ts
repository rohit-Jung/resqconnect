import { and, eq } from "drizzle-orm";
import type { Request, Response } from "express";

import db from "@/db";
import { newOrganizationSchema, organization } from "@/models";
import ApiError from "@/utils/api/ApiError";
import ApiResponse from "@/utils/api/ApiResponse";
import { asyncHandler } from "@/utils/api/asyncHandler";

const createOrganization = asyncHandler(async (req: Request, res: Response) => {
  const parsedValues = newOrganizationSchema.safeParse(req.body);

  if (!parsedValues.success) {
    const validationError = new ApiError(
      400,
      "Error validating data",
      parsedValues.error.issues.map(
        (issue) => `${issue.path.join(".")} : ${issue.message}`,
      ),
    );

    return res.status(400).json(validationError);
  }

  const existingOrganization = await db.query.organization.findFirst({
    where: and(
      eq(organization.name, parsedValues.data.name),
      eq(organization.serviceCategory, parsedValues.data.serviceCategory),
    ),
  });

  if (existingOrganization) {
    throw new ApiError(400, "Organization already exists");
  }

  const newOrganization = await db
    .insert(organization)
    .values(parsedValues.data)
    .returning({
      id: organization.id,
      name: organization.name,
      serviceCategory: organization.serviceCategory,
      generalNumber: organization.generalNumber,
    });

  if (!newOrganization) {
    throw new ApiError(500, "Error creating organization");
  }

  res.status(201).json(
    new ApiResponse(201, "Organization created", {
      organization: newOrganization[0],
    }),
  );
});

const getAllOrganizations = asyncHandler(
  async (req: Request, res: Response) => {
    const loggedInUser = req.user;

    if (!loggedInUser || loggedInUser.role !== "admin" || !loggedInUser.id) {
      throw new ApiError(401, "Unauthorized to perform this action");
    }

    const organizations = await db.query.organization.findMany();

    res
      .status(200)
      .json(new ApiResponse(200, "Organizations retrieved", organizations));
  },
);

const getOrganizationById = asyncHandler(
  async (req: Request, res: Response) => {
    const loggedInUser = req.user;

    if (!loggedInUser || !loggedInUser.id) {
      throw new ApiError(401, "Unauthorized to perform this action");
    }

    const organizationId = req.params.id;

    const organizationDetails = await db.query.organization.findFirst({
      where: eq(organization.id, organizationId),
    });

    if (!organizationDetails) {
      throw new ApiError(404, "Organization not found");
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "Organization details retrieved",
          organizationDetails,
        ),
      );
  },
);

const deleteOrganization = asyncHandler(async (req: Request, res: Response) => {
  const loggedInUser = req.user;

  if (!loggedInUser || loggedInUser.role !== "admin" || !loggedInUser.id) {
    throw new ApiError(401, "Unauthorized to perform this action");
  }

  const organizationId = req.params.id;

  const organizationDetails = await db.query.organization.findFirst({
    where: eq(organization.id, organizationId),
  });

  if (!organizationDetails) {
    throw new ApiError(404, "Organization not found");
  }

  const deletedOrganization = await db
    .delete(organization)
    .where(eq(organization.id, organizationId))
    .returning({
      id: organization.id,
      name: organization.name,
      serviceCategory: organization.serviceCategory,
      generalNumber: organization.generalNumber,
    });

  if (!deletedOrganization) {
    throw new ApiError(500, "Error deleting organization");
  }

  res.status(200).json(
    new ApiResponse(200, "Organization deleted", {
      organization: deletedOrganization[0],
    }),
  );
});

const updateOrganization = asyncHandler(async (req: Request, res: Response) => {
  const loggedInUser = req.user;

  if (!loggedInUser || loggedInUser.role !== "admin" || !loggedInUser.id) {
    throw new ApiError(401, "Unauthorized to perform this action");
  }

  const organizationId = req.params.id;

  const organizationDetails = await db.query.organization.findFirst({
    where: eq(organization.id, organizationId),
  });

  if (!organizationDetails) {
    throw new ApiError(404, "Organization not found");
  }

  const updateData = req.body;

  if (Object.keys(updateData).length === 0) {
    throw new ApiError(400, "No data to update");
  }

  const invalidKeys = Object.keys(updateData).filter(
    (key) => !Object.keys(organization).includes(key),
  );

  if (invalidKeys.length > 0) {
    throw new ApiError(
      400,
      `Invalid data to update. Invalid keys: ${invalidKeys}`,
    );
  }

  const updatedOrganization = await db
    .update(organization)
    .set(updateData)
    .where(eq(organization.id, organizationId))
    .returning({
      id: organization.id,
      name: organization.name,
      serviceCategory: organization.serviceCategory,
      generalNumber: organization.generalNumber,
    });

  if (!updatedOrganization) {
    throw new ApiError(500, "Error updating organization");
  }

  res.status(200).json(
    new ApiResponse(200, "Organization updated", {
      organization: updatedOrganization[0],
    }),
  );
});

export {
  createOrganization,
  getAllOrganizations,
  getOrganizationById,
  deleteOrganization,
  updateOrganization,
};
