import bcrypt from 'bcryptjs';
import { and, count, desc, eq, or, sql } from 'drizzle-orm';
import type { Request, Response } from 'express';

import db from '@/db';
import {
  type TOrganization,
  emergencyRequest,
  emergencyResponse,
  loginUserSchema,
  newOrganizationSchema,
  newServiceProviderSchema,
  organization,
  serviceProvider,
  user,
} from '@/models';
import ApiError from '@/utils/api/ApiError';
import ApiResponse from '@/utils/api/ApiResponse';
import { asyncHandler } from '@/utils/api/asyncHandler';
import { sendOTP } from '@/utils/services/email';
import { generateJWT } from '@/utils/tokens/jwtTokens';

const registerOrganization = asyncHandler(
  async (req: Request, res: Response) => {
    const parsedValues = newOrganizationSchema.safeParse(req.body);

    if (!parsedValues.success) {
      const validationError = new ApiError(
        400,
        'Error validating data',
        parsedValues.error.issues.map(
          issue => `${issue.path.join('.')} : ${issue.message}`
        )
      );

      return res.status(400).json(validationError);
    }

    const existingOrganization = await db.query.organization.findFirst({
      where: and(
        eq(organization.name, parsedValues.data.name),
        eq(organization.serviceCategory, parsedValues.data.serviceCategory)
      ),
    });

    if (existingOrganization) {
      throw new ApiError(400, 'Organization already exists');
    }

    const hashedPassword = await bcrypt.hash(parsedValues.data.password, 10);
    const newOrganization = await db
      .insert(organization)
      .values({ ...parsedValues.data, password: hashedPassword })
      .returning({
        id: organization.id,
        name: organization.name,
        serviceCategory: organization.serviceCategory,
        generalNumber: organization.generalNumber,
      });

    if (!newOrganization) {
      throw new ApiError(500, 'Error creating organization');
    }

    res.status(201).json(
      new ApiResponse(201, 'Organization created', {
        organization: newOrganization[0],
      })
    );
  }
);

const getAllOrganizations = asyncHandler(
  async (req: Request, res: Response) => {
    const loggedInUser = req.user;

    if (!loggedInUser || loggedInUser.role !== 'admin' || !loggedInUser.id) {
      throw new ApiError(401, 'Unauthorized to perform this action');
    }

    const organizations = await db.query.organization.findMany();

    res
      .status(200)
      .json(new ApiResponse(200, 'Organizations retrieved', organizations));
  }
);

const getOrganizationById = asyncHandler(
  async (req: Request, res: Response) => {
    const loggedInUser = req.user;

    if (!loggedInUser || !loggedInUser.id) {
      throw new ApiError(401, 'Unauthorized to perform this action');
    }

    const organizationId = req.params.id;

    if (!organizationId) {
      throw new ApiError(401, 'Organiztion Id required in params');
    }

    const organizationDetails = await db.query.organization.findFirst({
      where: eq(organization.id, organizationId),
    });

    if (!organizationDetails) {
      throw new ApiError(404, 'Organization not found');
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          'Organization details retrieved',
          organizationDetails
        )
      );
  }
);

const deleteOrganization = asyncHandler(async (req: Request, res: Response) => {
  const loggedInUser = req.user;

  if (!loggedInUser || loggedInUser.role !== 'admin' || !loggedInUser.id) {
    throw new ApiError(401, 'Unauthorized to perform this action');
  }

  const organizationId = req.params.id;

  if (!organizationId) {
    throw new ApiError(401, 'Organiztion Id required in params');
  }

  const organizationDetails = await db.query.organization.findFirst({
    where: eq(organization.id, organizationId),
  });

  if (!organizationDetails) {
    throw new ApiError(404, 'Organization not found');
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
    throw new ApiError(500, 'Error deleting organization');
  }

  res.status(200).json(
    new ApiResponse(200, 'Organization deleted', {
      organization: deletedOrganization[0],
    })
  );
});

const updateOrganization = asyncHandler(async (req: Request, res: Response) => {
  const loggedInUser = req.user;

  if (!loggedInUser || loggedInUser.role !== 'admin' || !loggedInUser.id) {
    throw new ApiError(401, 'Unauthorized to perform this action');
  }

  const organizationId = req.params.id;

  if (!organizationId) {
    throw new ApiError(401, 'Organiztion Id required in params');
  }

  const organizationDetails = await db.query.organization.findFirst({
    where: eq(organization.id, organizationId),
  });

  if (!organizationDetails) {
    throw new ApiError(404, 'Organization not found');
  }

  const updateData = req.body;

  if (Object.keys(updateData).length === 0) {
    throw new ApiError(400, 'No data to update');
  }

  const invalidKeys = Object.keys(updateData).filter(
    key => !Object.keys(organization).includes(key)
  );

  if (invalidKeys.length > 0) {
    throw new ApiError(
      400,
      `Invalid data to update. Invalid keys: ${invalidKeys}`
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
    throw new ApiError(500, 'Error updating organization');
  }

  res.status(200).json(
    new ApiResponse(200, 'Organization updated', {
      organization: updatedOrganization[0],
    })
  );
});

const loginOrganization = asyncHandler(async (req: Request, res: Response) => {
  const parsedValues = loginUserSchema.safeParse(req.body);

  if (!parsedValues.success) {
    const validationError = new ApiError(
      400,
      'Error validating data',
      parsedValues.error.issues.map(
        issue => `${issue.path.join('.')} : ${issue.message}`
      )
    );

    return res.status(400).json(validationError);
  }

  const { email, password } = parsedValues.data;
  const existingOrg = await db.query.organization.findFirst({
    where: eq(organization.email, email),
    columns: {
      id: true,
      name: true,
      email: true,
      password: true,
      isVerified: true,
    },
  });

  if (!existingOrg) {
    console.log('User not found');
    throw new ApiError(400, 'User not found');
  }

  const isPasswordValid = await bcrypt.compare(password, existingOrg.password);

  if (!isPasswordValid) {
    console.log('Invalid credentials');
    throw new ApiError(400, 'Invalid credentials');
  }

  if (!existingOrg.isVerified) {
    const otpToken = await sendOTP(existingOrg.email);

    if (!otpToken) {
      console.log('Error Sending OTP token. Please try again');
      throw new ApiError(300, 'Error Sending OTP token. Please try again');
    }

    const tokenExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const updatedOrg = await db
      .update(organization)
      .set({
        verificationToken: otpToken,
        tokenExpiry: tokenExpiry.toISOString(),
      })
      .where(eq(organization.id, existingOrg.id));

    if (!updatedOrg) {
      console.log('Error Updating user. Please try again');
      throw new ApiError(400, 'Error Updating user. Please try again');
    }

    console.log('OTP sent to user for verification', {
      userId: existingOrg.id,
      otpToken,
    });

    return res.status(200).json(
      new ApiResponse(200, 'OTP sent to user for verification', {
        userId: existingOrg.id,
        // otpToken,
      })
    );
  }

  const token = generateJWT(existingOrg);
  const loggedInOrg: Partial<TOrganization> = JSON.parse(
    JSON.stringify(existingOrg)
  );
  delete loggedInOrg.password;

  res
    .status(200)
    .cookie('token', token)
    .json(
      new ApiResponse(200, `Organization logged in successfully.`, {
        user: loggedInOrg,
        token,
      })
    );
});

const verifyOrgOTP = asyncHandler(async (req: Request, res: Response) => {
  const { otpToken, userId } = req.body;

  if (!otpToken) {
    console.log('Please provide OTP');
    throw new ApiError(400, 'Please provide OTP');
  }

  if (!userId) {
    console.log('Please provide user ID');
    throw new ApiError(400, 'Please provide user ID');
  }

  const existingUser = await db.query.organization.findFirst({
    where: eq(organization.id, userId),
    columns: {
      password: false,
    },
  });

  if (!existingUser) {
    console.log('User not found');
    throw new ApiError(400, 'User not found');
  }

  if (!organization.verificationToken || !organization.tokenExpiry) {
    console.log('Verification token not found');
    throw new ApiError(400, 'Verification token not found');
  }

  if (!existingUser.tokenExpiry) {
    console.log(
      'Verification token expiry not registered. Please verify again.'
    );
    throw new ApiError(
      400,
      'Verification token expiry not registered. Please verify again.'
    );
  }

  const tokenExpiry = new Date(existingUser.tokenExpiry);
  const currentTime = new Date(Date.now()).toISOString();

  if (new Date(currentTime) > tokenExpiry) {
    console.log('Verification token expired');
    throw new ApiError(400, 'Verification token expired');
  }

  if (otpToken !== existingUser.verificationToken) {
    console.log('Invalid OTP');
    throw new ApiError(400, 'Invalid OTP');
  }

  const updatedUser = await db
    .update(organization)
    .set({
      isVerified: true,
      verificationToken: null,
      tokenExpiry: null,
    })
    .returning({
      id: organization.id,
      name: organization.name,
      generalNumber: organization.generalNumber,
      isVerified: organization.isVerified,
    });

  if (
    !Array.isArray(updatedUser) ||
    (updatedUser[0] && !updatedUser[0].isVerified)
  ) {
    console.log('Failed to verify user');
    throw new ApiError(500, 'Failed to verify user');
  }

  res.status(200).json(
    new ApiResponse(200, 'User verified successfully', {
      user: updatedUser[0],
    })
  );
});

const getOrgProfile = asyncHandler(async (req: Request, res: Response) => {
  const loggedInOrg = req.user;

  if (!loggedInOrg || !loggedInOrg.id) {
    console.log('Unauthorized');
    throw new ApiError(401, 'Unauthorized');
  }

  const existingOrg = await db.query.organization.findFirst({
    where: eq(organization.id, loggedInOrg.id),
    columns: {
      password: false,
      verificationToken: false,
      tokenExpiry: false,
    },
  });

  if (!existingOrg) {
    console.log('User not found');
    throw new ApiError(404, 'User not found');
  }

  res
    .status(200)
    .json(new ApiResponse(200, 'User found', { user: existingOrg }));
});

// Update organization's own profile
const updateOrgProfile = asyncHandler(async (req: Request, res: Response) => {
  const loggedInOrg = req.user;

  if (!loggedInOrg || !loggedInOrg.id) {
    throw new ApiError(401, 'Unauthorized');
  }

  const { name, generalNumber } = req.body;

  if (!name && !generalNumber) {
    throw new ApiError(400, 'At least one field is required to update');
  }

  const updateData: Record<string, unknown> = {};
  if (name) updateData.name = name;
  if (generalNumber) updateData.generalNumber = generalNumber;

  const updatedOrg = await db
    .update(organization)
    .set(updateData)
    .where(eq(organization.id, loggedInOrg.id))
    .returning({
      id: organization.id,
      name: organization.name,
      email: organization.email,
      serviceCategory: organization.serviceCategory,
      generalNumber: organization.generalNumber,
    });

  if (!updatedOrg || updatedOrg.length === 0) {
    throw new ApiError(500, 'Error updating organization profile');
  }

  res.status(200).json(
    new ApiResponse(200, 'Organization profile updated', {
      organization: updatedOrg[0],
    })
  );
});

// Public endpoint to list organizations for service provider registration
const listOrganizationsPublic = asyncHandler(
  async (req: Request, res: Response) => {
    const organizations = await db.query.organization.findMany({
      columns: {
        id: true,
        name: true,
        email: true,
        serviceCategory: true,
      },
      where: eq(organization.isVerified, true),
    });

    res
      .status(200)
      .json(new ApiResponse(200, 'Organizations retrieved', organizations));
  }
);

//   Organization Service Provider Management

// Get all service providers for the organization
const getOrgServiceProviders = asyncHandler(
  async (req: Request, res: Response) => {
    const loggedInOrg = req.user;

    if (!loggedInOrg || !loggedInOrg.id) {
      throw new ApiError(401, 'Unauthorized');
    }

    const providers = await db.query.serviceProvider.findMany({
      where: eq(serviceProvider.organizationId, loggedInOrg.id),
      columns: {
        password: false,
        verificationToken: false,
        tokenExpiry: false,
      },
    });

    res
      .status(200)
      .json(new ApiResponse(200, 'Service providers retrieved', providers));
  }
);

// Get single service provider by ID
const getOrgServiceProviderById = asyncHandler(
  async (req: Request, res: Response) => {
    const loggedInOrg = req.user;
    const { id } = req.params;

    if (!loggedInOrg || !loggedInOrg.id) {
      throw new ApiError(401, 'Unauthorized');
    }

    if (!id) {
      throw new ApiError(400, 'Provider ID is required');
    }

    const provider = await db.query.serviceProvider.findFirst({
      where: and(
        eq(serviceProvider.id, id),
        eq(serviceProvider.organizationId, loggedInOrg.id)
      ),
      columns: {
        password: false,
        verificationToken: false,
        tokenExpiry: false,
      },
    });

    if (!provider) {
      throw new ApiError(404, 'Service provider not found');
    }

    res
      .status(200)
      .json(new ApiResponse(200, 'Service provider retrieved', provider));
  }
);

// Register a new service provider for the organization
const registerOrgServiceProvider = asyncHandler(
  async (req: Request, res: Response) => {
    const loggedInOrg = req.user;

    if (!loggedInOrg || !loggedInOrg.id) {
      throw new ApiError(401, 'Unauthorized');
    }

    const parsedValues = newServiceProviderSchema.safeParse({
      ...req.body,
      organizationId: loggedInOrg.id,
    });

    if (!parsedValues.success) {
      throw new ApiError(
        400,
        'Error validating data',
        parsedValues.error.issues.map(
          issue => `${issue.path.join('.')} : ${issue.message}`
        )
      );
    }

    // Validate service type matches organization category
    const org = await db.query.organization.findFirst({
      where: eq(organization.id, loggedInOrg.id),
    });

    if (!org) {
      throw new ApiError(404, 'Organization not found');
    }

    if (org.serviceCategory !== parsedValues.data.serviceType) {
      throw new ApiError(
        400,
        `Service type must match organization category: ${org.serviceCategory}`
      );
    }

    // Check for existing provider
    const existingProvider = await db.query.serviceProvider.findFirst({
      where: or(
        eq(serviceProvider.phoneNumber, parsedValues.data.phoneNumber),
        eq(serviceProvider.email, parsedValues.data.email)
      ),
    });

    if (existingProvider) {
      throw new ApiError(
        400,
        'Service provider with this email or phone number already exists'
      );
    }

    const hashedPassword = await bcrypt.hash(parsedValues.data.password, 10);

    const newProvider = await db
      .insert(serviceProvider)
      .values({
        ...parsedValues.data,
        password: hashedPassword,
        organizationId: loggedInOrg.id,
        // Default location values - will be updated when provider logs in from mobile
        lastLocation: sql`ST_SetSRID(ST_MakePoint(85.3240, 27.7172), 4326)`,
        h3Index: BigInt(0),
      })
      .returning({
        id: serviceProvider.id,
        name: serviceProvider.name,
        email: serviceProvider.email,
        phoneNumber: serviceProvider.phoneNumber,
        serviceType: serviceProvider.serviceType,
      });

    res.status(201).json(
      new ApiResponse(201, 'Service provider registered successfully', {
        provider: newProvider[0],
      })
    );
  }
);

// Update a service provider
const updateOrgServiceProvider = asyncHandler(
  async (req: Request, res: Response) => {
    const loggedInOrg = req.user;
    const { id } = req.params;

    if (!loggedInOrg || !loggedInOrg.id) {
      throw new ApiError(401, 'Unauthorized');
    }

    if (!id) {
      throw new ApiError(400, 'Provider ID is required');
    }

    const existingProvider = await db.query.serviceProvider.findFirst({
      where: and(
        eq(serviceProvider.id, id),
        eq(serviceProvider.organizationId, loggedInOrg.id)
      ),
    });

    if (!existingProvider) {
      throw new ApiError(404, 'Service provider not found');
    }

    const { name, age, primaryAddress, serviceArea, vehicleInformation } =
      req.body;

    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name;
    if (age) updateData.age = age;
    if (primaryAddress) updateData.primaryAddress = primaryAddress;
    if (serviceArea) updateData.serviceArea = serviceArea;
    if (vehicleInformation) updateData.vehicleInformation = vehicleInformation;

    const updatedProvider = await db
      .update(serviceProvider)
      .set(updateData)
      .where(eq(serviceProvider.id, id))
      .returning({
        id: serviceProvider.id,
        name: serviceProvider.name,
        email: serviceProvider.email,
        phoneNumber: serviceProvider.phoneNumber,
        serviceType: serviceProvider.serviceType,
      });

    res.status(200).json(
      new ApiResponse(200, 'Service provider updated successfully', {
        provider: updatedProvider[0],
      })
    );
  }
);

// Delete a service provider
const deleteOrgServiceProvider = asyncHandler(
  async (req: Request, res: Response) => {
    const loggedInOrg = req.user;
    const { id } = req.params;

    if (!loggedInOrg || !loggedInOrg.id) {
      throw new ApiError(401, 'Unauthorized');
    }

    if (!id) {
      throw new ApiError(400, 'Provider ID is required');
    }

    const existingProvider = await db.query.serviceProvider.findFirst({
      where: and(
        eq(serviceProvider.id, id),
        eq(serviceProvider.organizationId, loggedInOrg.id)
      ),
    });

    if (!existingProvider) {
      throw new ApiError(404, 'Service provider not found');
    }

    await db.delete(serviceProvider).where(eq(serviceProvider.id, id));

    res
      .status(200)
      .json(new ApiResponse(200, 'Service provider deleted successfully', {}));
  }
);

// Verify a service provider manually
const verifyOrgServiceProvider = asyncHandler(
  async (req: Request, res: Response) => {
    const loggedInOrg = req.user;
    const { id } = req.params;

    if (!loggedInOrg || !loggedInOrg.id) {
      throw new ApiError(401, 'Unauthorized');
    }

    if (!id) {
      throw new ApiError(400, 'Provider ID is required');
    }

    const existingProvider = await db.query.serviceProvider.findFirst({
      where: and(
        eq(serviceProvider.id, id),
        eq(serviceProvider.organizationId, loggedInOrg.id)
      ),
    });

    if (!existingProvider) {
      throw new ApiError(404, 'Service provider not found');
    }

    await db
      .update(serviceProvider)
      .set({ isVerified: true })
      .where(eq(serviceProvider.id, id));

    res
      .status(200)
      .json(new ApiResponse(200, 'Service provider verified successfully', {}));
  }
);

// Organization Dashboard Analytics
const getOrgDashboardAnalytics = asyncHandler(
  async (req: Request, res: Response) => {
    const loggedInOrg = req.user;

    if (!loggedInOrg || !loggedInOrg.id) {
      throw new ApiError(401, 'Unauthorized');
    }

    const orgId = loggedInOrg.id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59
    );

    // Get organization's service type
    const org = await db.query.organization.findFirst({
      where: eq(organization.id, orgId),
    });

    if (!org) {
      throw new ApiError(404, 'Organization not found');
    }

    // Get service providers for this organization
    const [
      totalProviders,
      providersThisMonth,
      providersLastMonth,
      availableProviders,
      recentProviders,
    ] = await Promise.all([
      // Total providers
      db
        .select({ count: count() })
        .from(serviceProvider)
        .where(eq(serviceProvider.organizationId, orgId)),
      // Providers created this month
      db
        .select({ count: count() })
        .from(serviceProvider)
        .where(
          and(
            eq(serviceProvider.organizationId, orgId),
            sql`${serviceProvider.createdAt} >= ${startOfMonth.toISOString()}`
          )
        ),
      // Providers created last month
      db
        .select({ count: count() })
        .from(serviceProvider)
        .where(
          and(
            eq(serviceProvider.organizationId, orgId),
            sql`${serviceProvider.createdAt} >= ${startOfLastMonth.toISOString()}`,
            sql`${serviceProvider.createdAt} <= ${endOfLastMonth.toISOString()}`
          )
        ),
      // Available providers
      db
        .select({ count: count() })
        .from(serviceProvider)
        .where(
          and(
            eq(serviceProvider.organizationId, orgId),
            eq(serviceProvider.serviceStatus, 'available')
          )
        ),
      // Recent providers (last 5)
      db
        .select({
          id: serviceProvider.id,
          name: serviceProvider.name,
          email: serviceProvider.email,
          serviceStatus: serviceProvider.serviceStatus,
          isVerified: serviceProvider.isVerified,
          createdAt: serviceProvider.createdAt,
        })
        .from(serviceProvider)
        .where(eq(serviceProvider.organizationId, orgId))
        .orderBy(desc(serviceProvider.createdAt))
        .limit(5),
    ]);

    // Get emergency requests/responses related to this organization's service type
    // We need to join emergency_response with service_provider to filter by organization
    const [
      totalEmergencyResponses,
      responsesThisMonth,
      responsesLastMonth,
      recentEmergencyResponses,
    ] = await Promise.all([
      // Total emergency responses by org's providers
      db
        .select({ count: count() })
        .from(emergencyResponse)
        .innerJoin(
          serviceProvider,
          eq(emergencyResponse.serviceProviderId, serviceProvider.id)
        )
        .where(eq(serviceProvider.organizationId, orgId)),
      // Responses this month
      db
        .select({ count: count() })
        .from(emergencyResponse)
        .innerJoin(
          serviceProvider,
          eq(emergencyResponse.serviceProviderId, serviceProvider.id)
        )
        .where(
          and(
            eq(serviceProvider.organizationId, orgId),
            sql`${emergencyResponse.createdAt} >= ${startOfMonth.toISOString()}`
          )
        ),
      // Responses last month
      db
        .select({ count: count() })
        .from(emergencyResponse)
        .innerJoin(
          serviceProvider,
          eq(emergencyResponse.serviceProviderId, serviceProvider.id)
        )
        .where(
          and(
            eq(serviceProvider.organizationId, orgId),
            sql`${emergencyResponse.createdAt} >= ${startOfLastMonth.toISOString()}`,
            sql`${emergencyResponse.createdAt} <= ${endOfLastMonth.toISOString()}`
          )
        ),
      // Recent emergency responses (last 10)
      db
        .select({
          id: emergencyResponse.id,
          statusUpdate: emergencyResponse.statusUpdate,
          respondedAt: emergencyResponse.respondedAt,
          providerName: serviceProvider.name,
          createdAt: emergencyResponse.createdAt,
        })
        .from(emergencyResponse)
        .innerJoin(
          serviceProvider,
          eq(emergencyResponse.serviceProviderId, serviceProvider.id)
        )
        .where(eq(serviceProvider.organizationId, orgId))
        .orderBy(desc(emergencyResponse.createdAt))
        .limit(10),
    ]);

    // Get emergency requests by service type (matching org's category)
    const [
      totalEmergencyRequests,
      requestsThisMonth,
      pendingRequests,
      completedRequests,
      recentEmergencyRequestsRaw,
    ] = await Promise.all([
      // Total emergency requests for this service type
      db
        .select({ count: count() })
        .from(emergencyRequest)
        .where(eq(emergencyRequest.serviceType, org.serviceCategory)),
      // Requests this month
      db
        .select({ count: count() })
        .from(emergencyRequest)
        .where(
          and(
            eq(emergencyRequest.serviceType, org.serviceCategory),
            sql`${emergencyRequest.createdAt} >= ${startOfMonth.toISOString()}`
          )
        ),
      // Pending requests
      db
        .select({ count: count() })
        .from(emergencyRequest)
        .where(
          and(
            eq(emergencyRequest.serviceType, org.serviceCategory),
            eq(emergencyRequest.requestStatus, 'pending')
          )
        ),
      // Completed requests
      db
        .select({ count: count() })
        .from(emergencyRequest)
        .where(
          and(
            eq(emergencyRequest.serviceType, org.serviceCategory),
            eq(emergencyRequest.requestStatus, 'completed')
          )
        ),
      // Recent emergency requests (last 10) - will be enriched below
      db
        .select({
          id: emergencyRequest.id,
          serviceType: emergencyRequest.serviceType,
          requestStatus: emergencyRequest.requestStatus,
          description: emergencyRequest.description,
          location: emergencyRequest.location,
          createdAt: emergencyRequest.createdAt,
          userId: emergencyRequest.userId,
        })
        .from(emergencyRequest)
        .where(eq(emergencyRequest.serviceType, org.serviceCategory))
        .orderBy(desc(emergencyRequest.createdAt))
        .limit(10),
    ]);

    // Enrich emergency requests with user and provider data
    const recentEmergencyRequests = await Promise.all(
      recentEmergencyRequestsRaw.map(async request => {
        // Get requester (user) info
        const requesterData = await db.query.user.findFirst({
          where: eq(user.id, request.userId),
          columns: {
            id: true,
            name: true,
            phoneNumber: true,
          },
        });

        // Get provider info if request is assigned/completed
        let providerData = null;
        if (
          request.requestStatus === 'assigned' ||
          request.requestStatus === 'completed' ||
          request.requestStatus === 'in_progress'
        ) {
          const emergencyResp = await db.query.emergencyResponse.findFirst({
            where: eq(emergencyResponse.emergencyRequestId, request.id),
          });

          if (emergencyResp) {
            const provider = await db.query.serviceProvider.findFirst({
              where: eq(serviceProvider.id, emergencyResp.serviceProviderId),
              columns: {
                id: true,
                name: true,
                phoneNumber: true,
              },
            });
            providerData = provider;
          }
        }

        return {
          ...request,
          requester: requesterData
            ? {
                id: requesterData.id,
                name: requesterData.name,
                phoneNumber: requesterData.phoneNumber?.toString(),
              }
            : undefined,
          provider: providerData
            ? {
                id: providerData.id,
                name: providerData.name,
                phoneNumber: providerData.phoneNumber?.toString(),
              }
            : undefined,
        };
      })
    );

    // Calculate provider availability percentage
    const totalProvidersCount = totalProviders[0]?.count ?? 0;
    const availableProvidersCount = availableProviders[0]?.count ?? 0;
    const availabilityPercentage =
      totalProvidersCount > 0
        ? Math.round((availableProvidersCount / totalProvidersCount) * 100)
        : 0;

    // Monthly trend data (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTrend = await db
      .select({
        month: sql<string>`to_char(${emergencyRequest.createdAt}, 'Mon YYYY')`,
        count: count(),
      })
      .from(emergencyRequest)
      .where(
        and(
          eq(emergencyRequest.serviceType, org.serviceCategory),
          sql`${emergencyRequest.createdAt} >= ${sixMonthsAgo.toISOString()}`
        )
      )
      .groupBy(
        sql`to_char(${emergencyRequest.createdAt}, 'Mon YYYY'), date_trunc('month', ${emergencyRequest.createdAt})`
      )
      .orderBy(sql`date_trunc('month', ${emergencyRequest.createdAt})`);

    res.status(200).json(
      new ApiResponse(200, 'Organization dashboard analytics retrieved', {
        organization: {
          id: org.id,
          name: org.name,
          serviceCategory: org.serviceCategory,
        },
        providers: {
          total: totalProvidersCount,
          thisMonth: providersThisMonth[0]?.count ?? 0,
          lastMonth: providersLastMonth[0]?.count ?? 0,
          available: availableProvidersCount,
          availabilityPercentage,
          recent: recentProviders,
        },
        emergencyRequests: {
          total: totalEmergencyRequests[0]?.count ?? 0,
          thisMonth: requestsThisMonth[0]?.count ?? 0,
          pending: pendingRequests[0]?.count ?? 0,
          completed: completedRequests[0]?.count ?? 0,
          recent: recentEmergencyRequests,
          monthlyTrend: monthlyTrend.map(item => ({
            month: item.month,
            count: Number(item.count),
          })),
        },
        emergencyResponses: {
          total: totalEmergencyResponses[0]?.count ?? 0,
          thisMonth: responsesThisMonth[0]?.count ?? 0,
          lastMonth: responsesLastMonth[0]?.count ?? 0,
          recent: recentEmergencyResponses,
        },
      })
    );
  }
);

export {
  registerOrganization,
  verifyOrgOTP,
  getOrgProfile,
  getAllOrganizations,
  getOrganizationById,
  deleteOrganization,
  updateOrganization,
  updateOrgProfile,
  loginOrganization,
  listOrganizationsPublic,

  // Service Provider Management
  getOrgServiceProviders,
  getOrgServiceProviderById,
  registerOrgServiceProvider,
  updateOrgServiceProvider,
  deleteOrgServiceProvider,
  verifyOrgServiceProvider,

  // Dashboard Analytics
  getOrgDashboardAnalytics,
};
