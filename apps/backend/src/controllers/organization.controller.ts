import {
  type TOrganization,
  emergencyRequest,
  emergencyResponse,
  organization,
  serviceProvider,
  user,
} from '@repo/db/schemas';
import { registerOrganizationSchema } from '@repo/types/validations';

import bcrypt from 'bcryptjs';
import { and, count, desc, eq, or, sql } from 'drizzle-orm';
import type { Request, Response } from 'express';
import { latLngToCell } from 'h3-js';

import { H3_RESOLUTION } from '@/constants';
import db from '@/db';
import { getLatestOrgEntitlements } from '@/services/entitlements.service';
import {
  clearLoginFailures,
  isLoginLocked,
  recordLoginFailure,
} from '@/services/failed-login-lockout.service';
import ApiError from '@/utils/api/ApiError';
import ApiResponse from '@/utils/api/ApiResponse';
import { asyncHandler } from '@/utils/api/asyncHandler';
import { sendOTP } from '@/utils/services/email';
import { generateJWT } from '@/utils/tokens/jwtTokens';

const registerOrganization = asyncHandler(
  async (req: Request, res: Response) => {
    const parsed = registerOrganizationSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(
        400,
        'Validation error',
        parsed.error.issues.map(i => i.message)
      );
    }

    // Check if the user is a super admin
    const loggedInUser = req.user;

    if (!loggedInUser || loggedInUser.role !== 'admin' || !loggedInUser.id) {
      throw new ApiError(
        401,
        'Unauthorized: Only super admins can register organizations'
      );
    }

    const { name, email, serviceCategory, generalNumber, password } =
      parsed.data;

    const existingOrganization = await db.query.organization.findFirst({
      where: and(
        eq(organization.name, name),
        eq(organization.serviceCategory, serviceCategory)
      ),
    });

    if (existingOrganization) {
      throw new ApiError(400, 'Organization already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newOrganization = await db
      .insert(organization)
      .values({
        name,
        email,
        serviceCategory,
        generalNumber,
        password: hashedPassword,
        lifecycleStatus: 'pending_approval',
      })
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

    const rawOrganizationId = (req.params as any)?.id as unknown;
    const organizationId = Array.isArray(rawOrganizationId)
      ? rawOrganizationId[0]
      : rawOrganizationId;

    if (!organizationId || typeof organizationId !== 'string') {
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

  const rawOrganizationId = (req.params as any)?.id as unknown;
  const organizationId = Array.isArray(rawOrganizationId)
    ? rawOrganizationId[0]
    : rawOrganizationId;

  if (!organizationId || typeof organizationId !== 'string') {
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

  const rawOrganizationId = (req.params as any)?.id as unknown;
  const organizationId = Array.isArray(rawOrganizationId)
    ? rawOrganizationId[0]
    : rawOrganizationId;

  if (!organizationId || typeof organizationId !== 'string') {
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
  const { email, password } = req.body;

  if (typeof email === 'string' && email.includes('@')) {
    if (await isLoginLocked(email)) {
      throw new ApiError(
        429,
        'Too many failed login attempts. Try again later.'
      );
    }
  }

  const existingOrg = await db.query.organization.findFirst({
    where: eq(organization.email, email),
    columns: {
      id: true,
      name: true,
      email: true,
      password: true,
      isVerified: true,
      lifecycleStatus: true,
    },
  });

  if (!existingOrg) {
    console.log('User not found');
    if (typeof email === 'string') await recordLoginFailure(email);
    throw new ApiError(400, 'User not found');
  }

  const isPasswordValid = await bcrypt.compare(password, existingOrg.password);

  if (!isPasswordValid) {
    console.log('Invalid credentials');
    if (typeof email === 'string') await recordLoginFailure(email);
    throw new ApiError(400, 'Invalid credentials');
  }

  if (typeof email === 'string') await clearLoginFailures(email);

  if (!existingOrg.isVerified) {
    throw new ApiError(
      403,
      'Super admin has not verified your organization yet. Please contact support.'
    );
  }

  const isRestricted = existingOrg.lifecycleStatus !== 'active';
  // Ensure JWT role is set to 'organization' (generateJWT relies on `kind`).
  const token = generateJWT(
    { ...existingOrg, kind: 'organization' },
    {
      restricted: isRestricted,
      orgStatus: existingOrg.lifecycleStatus,
    }
  );

  let warnings: string[] = [];
  if (isRestricted) {
    // Friendly, status-specific message for the frontend.
    switch (existingOrg.lifecycleStatus) {
      case 'pending_approval':
        warnings = [
          'Your organization is pending approval. Access is restricted until approval is granted.',
        ];
        break;
      case 'suspended':
        warnings = [
          'Your organization is suspended. Please contact support or check billing to restore access.',
        ];
        break;
      case 'trial_expired':
        warnings = [
          'Your trial has expired. Please subscribe to restore full access.',
        ];
        break;
      default:
        warnings = [
          `Organization status is '${existingOrg.lifecycleStatus}'. Access is restricted until status becomes 'active'.`,
        ];
    }
  }
  const loggedInOrg: Partial<TOrganization> = JSON.parse(
    JSON.stringify(existingOrg)
  );
  delete loggedInOrg.password;

  // Avoid leaking internal lifecycle status under the legacy `user` object.
  delete (loggedInOrg as any).lifecycleStatus;

  res
    .status(200)
    .cookie('token', token)
    .json(
      new ApiResponse(200, `Organization logged in successfully.`, {
        user: loggedInOrg,
        token,
        warnings,
      })
    );
});

const verifyOrgOTP = asyncHandler(async (req: Request, res: Response) => {
  const { otpToken, organizationId } = req.body;

  const existingUser = await db.query.organization.findFirst({
    where: eq(organization.id, organizationId),
    columns: {
      password: false,
    },
  });

  if (!existingUser) {
    console.log('User not found');
    throw new ApiError(400, 'User not found');
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

  const tokenExpiryStr = existingUser.tokenExpiry;
  const tokenExpiry = new Date(tokenExpiryStr + 'Z');
  const currentTime = new Date();

  if (currentTime.getTime() > tokenExpiry.getTime()) {
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

const resendOrganizationVerificationOTP = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body as { email: string };

    const existingOrg = await db.query.organization.findFirst({
      where: eq(organization.email, email),
      columns: {
        id: true,
        email: true,
        isVerified: true,
      },
    });

    // Avoid leaking whether an email exists.
    if (!existingOrg) {
      return res
        .status(200)
        .json(new ApiResponse(200, 'OTP sent if account exists', {}));
    }

    if (existingOrg.isVerified) {
      return res
        .status(200)
        .json(new ApiResponse(200, 'Account already verified', {}));
    }

    const otpToken = await sendOTP(existingOrg.email);
    if (!otpToken) {
      throw new ApiError(500, 'Error sending OTP token. Please try again');
    }

    const tokenExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await db
      .update(organization)
      .set({
        verificationToken: otpToken,
        tokenExpiry: tokenExpiry.toISOString(),
      })
      .where(eq(organization.id, existingOrg.id));

    return res.status(200).json(
      new ApiResponse(200, 'OTP sent to organization for verification', {
        organizationId: existingOrg.id,
      })
    );
  }
);

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

  const entitlements = await getLatestOrgEntitlements(loggedInOrg.id);
  const entitlementsData = entitlements?.entitlements ?? {
    provider_count_limit: 0,
    api_rate_limit_tier: 15000,
    notification_fallback_quota: 0,
    analytics_enabled: false,
  };

  res.status(200).json(
    new ApiResponse(200, 'User found', {
      user: existingOrg,
      entitlements: entitlementsData,
    })
  );
});

// Update organization's own profile
const updateOrgProfile = asyncHandler(async (req: Request, res: Response) => {
  const loggedInOrg = req.user;

  if (!loggedInOrg || !loggedInOrg.id) {
    throw new ApiError(401, 'Unauthorized');
  }

  const { name, email, serviceCategory, generalNumber } = req.body;

  const updateData: Record<string, unknown> = {};
  if (name) updateData.name = name;
  if (email) updateData.email = email;
  if (serviceCategory) updateData.serviceCategory = serviceCategory;
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
    const rawId = (req.params as any)?.id as unknown;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!loggedInOrg || !loggedInOrg.id) {
      throw new ApiError(401, 'Unauthorized');
    }

    if (!id || typeof id !== 'string') {
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

    const {
      name,
      age,
      email,
      phoneNumber,
      primaryAddress,
      password,
      serviceType,
      currentLocation,
      vehicleInformation,
      panCardUrl,
      citizenshipUrl,
    } = req.body;

    // Validate service type matches organization category
    const org = await db.query.organization.findFirst({
      where: eq(organization.id, loggedInOrg.id),
    });

    if (!org) {
      throw new ApiError(404, 'Organization not found');
    }

    if (org.serviceCategory !== serviceType) {
      throw new ApiError(
        400,
        `Service type must match organization category: ${org.serviceCategory}`
      );
    }

    // Check for existing provider
    const existingProvider = await db.query.serviceProvider.findFirst({
      where: or(
        eq(serviceProvider.phoneNumber, phoneNumber),
        eq(serviceProvider.email, email)
      ),
    });

    if (existingProvider) {
      throw new ApiError(
        400,
        'Service provider with this email or phone number already exists'
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Org portal doesn't capture GPS at registration time.
    // Default to Kathmandu so the record is valid; provider app will update location later.
    const latitude = Number(currentLocation?.latitude ?? 27.7172);
    const longitude = Number(currentLocation?.longitude ?? 85.324);
    const h3Index = latLngToCell(latitude, longitude, H3_RESOLUTION);
    const h3IndexBigInt = BigInt(`0x${h3Index}`);
    const locationPoint = `POINT(${longitude} ${latitude})`;

    const newProvider = await db
      .insert(serviceProvider)
      .values({
        name,
        age,
        email,
        phoneNumber,
        primaryAddress,
        password: hashedPassword,
        serviceType,
        organizationId: loggedInOrg.id,
        lastLocation: sql`ST_SetSRID(ST_GeomFromText(${locationPoint}), 4326)`,
        h3Index: h3IndexBigInt,
        currentLocation: {
          latitude: latitude.toString(),
          longitude: longitude.toString(),
        },
        vehicleInformation: vehicleInformation || {
          type: 'Not filled',
          number: 'Not filled',
          model: 'Not filled',
          color: 'Not filled',
        },
        documentStatus:
          panCardUrl || citizenshipUrl ? 'pending' : 'not_submitted',
        ...(panCardUrl ? { panCardUrl } : {}),
        ...(citizenshipUrl ? { citizenshipUrl } : {}),
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
    const rawId = (req.params as any)?.id as unknown;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!loggedInOrg || !loggedInOrg.id) {
      throw new ApiError(401, 'Unauthorized');
    }

    if (!id || typeof id !== 'string') {
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
    const rawId = (req.params as any)?.id as unknown;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!loggedInOrg || !loggedInOrg.id) {
      throw new ApiError(401, 'Unauthorized');
    }

    if (!id || typeof id !== 'string') {
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
    const rawId = (req.params as any)?.id as unknown;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!loggedInOrg || !loggedInOrg.id) {
      throw new ApiError(401, 'Unauthorized');
    }

    if (!id || typeof id !== 'string') {
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
        let providerData: {
          id: string;
          name: string;
          phoneNumber: number;
        } | null = null;
        if (
          request.requestStatus === 'assigned' ||
          request.requestStatus === 'completed' ||
          request.requestStatus === 'in_progress'
        ) {
          const emergencyResp = await db.query.emergencyResponse.findFirst({
            where: eq(emergencyResponse.emergencyRequestId, request.id),
          });

          if (emergencyResp?.serviceProviderId) {
            const provider = await db.query.serviceProvider.findFirst({
              where: eq(serviceProvider.id, emergencyResp.serviceProviderId),
              columns: {
                id: true,
                name: true,
                phoneNumber: true,
              },
            });
            providerData = provider ?? null;
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

const organizationController = {
  registerOrganization,
  verifyOrgOTP,
  resendOrganizationVerificationOTP,
  getOrgProfile,
  getAllOrganizations,
  getOrganizationById,
  deleteOrganization,
  updateOrganization,
  updateOrgProfile,
  loginOrganization,
  listOrganizationsPublic,
  getOrgServiceProviders,
  getOrgServiceProviderById,
  registerOrgServiceProvider,
  updateOrgServiceProvider,
  deleteOrgServiceProvider,
  verifyOrgServiceProvider,
  getOrgDashboardAnalytics,
} as const;

export default organizationController;

export {
  registerOrganization,
  verifyOrgOTP,
  resendOrganizationVerificationOTP,
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
