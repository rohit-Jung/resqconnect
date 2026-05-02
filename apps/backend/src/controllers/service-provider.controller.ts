import {
  type TServiceProvider,
  organization,
  serviceProvider,
  verifyDocumentsSchema,
} from '@repo/db/schemas';
import { organizationEntitlementsSnapshot } from '@repo/db/schemas';

import bcrypt from 'bcryptjs';
import { and, count, desc, eq, or, sql } from 'drizzle-orm';
import type { Request, Response } from 'express';
import { latLngToCell } from 'h3-js';

import {
  deleteImage,
  extractPublicIdFromUrl,
  generateUploadSignature,
  isCloudinaryConfigured,
} from '@/config/cloudinary.config';
import { ServiceTypeEnum } from '@/constants/enums.constants';
import { SocketEvents, SocketRoom } from '@/constants/socket.constants';
import db from '@/db';
import {
  clearLoginFailures,
  isLoginLocked,
  recordLoginFailure,
} from '@/services/failed-login-lockout.service';
import { getIo } from '@/socket';
import ApiError from '@/utils/api/ApiError';
import ApiResponse from '@/utils/api/ApiResponse';
import { asyncHandler } from '@/utils/api/asyncHandler';
import { calculateDistance } from '@/utils/maps';
import { sendOTP } from '@/utils/services/email';
import { generateJWT } from '@/utils/tokens/jwtTokens';

// Utility to recursively convert BigInt values to strings
function bigIntToString(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(bigIntToString);
  } else if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, bigIntToString(v)])
    );
  } else if (typeof obj === 'bigint') {
    return obj.toString();
  }
  return obj;
}

const registerServiceProvider = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      name,
      age,
      email,
      phoneNumber,
      primaryAddress,
      password,
      serviceType,
      organizationId,
      panCardUrl,
      citizenshipUrl,
    } = req.body;

    // Validate required fields early so bad requests return 400 before DB lookups.
    if (
      !name ||
      age === undefined ||
      !email ||
      !password ||
      phoneNumber === undefined ||
      !serviceType ||
      !organizationId
    ) {
      throw ApiError.badRequest('Missing required fields');
    }

    if (typeof email !== 'string' || !email.includes('@')) {
      throw ApiError.badRequest('Invalid email format');
    }

    // Tests sometimes pass phone/serviceType as strings. Normalize/validate.
    const normalizedPhoneNumber =
      typeof phoneNumber === 'string' ? Number(phoneNumber) : phoneNumber;
    if (!Number.isFinite(normalizedPhoneNumber)) {
      throw ApiError.badRequest('Invalid phone number');
    }

    if (!Object.values(ServiceTypeEnum).includes(serviceType as any)) {
      throw ApiError.badRequest('Invalid service type');
    }

    const existingServiceProvider = await db.query.serviceProvider.findFirst({
      where: or(
        eq(serviceProvider.phoneNumber, normalizedPhoneNumber as any),
        eq(serviceProvider.email, email)
      ),
    });

    if (existingServiceProvider) {
      throw ApiError.badRequest(
        'Service Provider with this email or phone number already exists'
      );
    }

    const existingOrganization = await db.query.organization.findFirst({
      where: eq(organization.id, organizationId),
    });

    if (!existingOrganization) {
      throw ApiError.notFound('Organization not found');
    }

    if (existingOrganization.serviceCategory !== serviceType) {
      throw ApiError.badRequest(
        'Service Type does not match with organization service category'
      );
    }

    // Enforce provider_count_limit for self-registration flows too.
    const latestEnt = await db.query.organizationEntitlementsSnapshot.findFirst(
      {
        where: eq(
          organizationEntitlementsSnapshot.organizationId,
          organizationId
        ),
        columns: { entitlements: true },
        orderBy: [desc(organizationEntitlementsSnapshot.version)],
      }
    );
    const entRaw = (latestEnt?.entitlements ?? {}) as Record<string, unknown>;
    const limit = Number(entRaw.provider_count_limit ?? 0) || 0;
    if (limit <= 0) {
      throw ApiError.forbidden(
        'Provider registration is not enabled for this organization'
      );
    }
    const rows = await db
      .select({ c: count() })
      .from(serviceProvider)
      .where(eq(serviceProvider.organizationId, organizationId));
    const current = rows[0]?.c ?? 0;
    if (current >= limit) {
      throw ApiError.forbidden(`Provider limit reached (${limit})`);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newServiceProvider = await db
      .insert(serviceProvider)
      .values({
        name,
        age,
        email,
        phoneNumber: normalizedPhoneNumber as any,
        primaryAddress,
        password: hashedPassword,
        serviceType,
        organizationId,
        lastLocation: sql`ST_SetSRID(ST_MakePoint(85.3240, 27.7172), 4326)`,
        h3Index: BigInt('0'),
        currentLocation: {
          latitude: '27.7172',
          longitude: '85.3240',
        },
        // Set document status based on whether documents were provided
        documentStatus:
          panCardUrl || citizenshipUrl ? 'pending' : 'not_submitted',
        ...(panCardUrl && {
          panCardUrl,
        }),
        ...(citizenshipUrl && {
          citizenshipUrl,
        }),
      } as any)
      .returning({
        name: serviceProvider.name,
        age: serviceProvider.age,
        phoneNumber: serviceProvider.phoneNumber,
        email: serviceProvider.email,
        primaryAddress: serviceProvider.primaryAddress,
        serviceType: serviceProvider.serviceType,
      });

    if (!newServiceProvider) {
      throw ApiError.badRequest('Failed to register serviceProvider');
    }

    res.status(201).json(
      new ApiResponse(201, 'serviceProvider registered successfully', {
        serviceProvider: newServiceProvider[0],
      })
    );
  }
);

const loginServiceProvider = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, password, currentLocation } = req.body;

    if (!email || !password) {
      throw ApiError.badRequest('Email and password are required');
    }

    if (typeof email !== 'string' || !email.includes('@')) {
      throw ApiError.badRequest('Invalid email format');
    }

    if (await isLoginLocked(email)) {
      throw ApiError.tooManyRequest(
        'Too many failed login attempts. Try again later.'
      );
    }

    const existingServiceProvider = await db.query.serviceProvider.findFirst({
      where: eq(serviceProvider.email, email),
    });

    if (!existingServiceProvider) {
      await recordLoginFailure(email);
      throw ApiError.notFound(
        'ServiceProvider not found with given credentials'
      );
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      existingServiceProvider.password
    );

    if (!isPasswordValid) {
      await recordLoginFailure(email);
      throw ApiError.badRequest('Invalid Credentials Provided');
    }

    await clearLoginFailures(email);

    if (existingServiceProvider && !existingServiceProvider.isVerified) {
      const otpToken = await sendOTP(existingServiceProvider.email);

      if (!otpToken) {
        throw ApiError.serviceUnavailable(
          'Error Sending OTP token. Please try again'
        );
      }

      const tokenExpiry = new Date(Date.now() + 10 * 60 * 1000);

      const servicePerson = await db
        .update(serviceProvider)
        .set({
          verificationToken: otpToken,
          tokenExpiry: tokenExpiry.toISOString(),
        })
        .where(eq(serviceProvider.id, existingServiceProvider.id));

      if (!servicePerson) {
        throw ApiError.badRequest('Error setting verfication token');
      }

      return res.status(200).json(
        new ApiResponse(200, 'OTP sent to serviceProvider for verification', {
          serviceProviderId: existingServiceProvider.id,
          otpToken,
        })
      );
    }

    // Check document verification status
    const documentStatus = existingServiceProvider.documentStatus;

    if (documentStatus === 'not_submitted') {
      const token = generateJWT({
        ...existingServiceProvider,
        kind: 'service_provider',
      } as any);

      return res.status(403).json(
        new ApiResponse(403, 'Documents required for verification', {
          code: 'DOCUMENTS_REQUIRED',
          serviceProviderId: existingServiceProvider.id,
          token,
          message:
            'Please upload your PAN card and citizenship documents for verification.',
        })
      );
    }

    if (documentStatus === 'pending') {
      return res.status(403).json(
        new ApiResponse(403, 'Documents pending verification', {
          code: 'VERIFICATION_PENDING',
          serviceProviderId: existingServiceProvider.id,
          message:
            'Your documents are being reviewed. Please wait for approval.',
        })
      );
    }

    if (documentStatus === 'rejected') {
      return res.status(403).json(
        new ApiResponse(403, 'Documents rejected', {
          code: 'DOCUMENTS_REJECTED',
          serviceProviderId: existingServiceProvider.id,
          rejectionReason: existingServiceProvider.rejectionReason,
          message:
            'Your documents were rejected. Please re-upload with valid documents.',
        })
      );
    }

    // documentStatus === 'approved' - allow login
    // Update location if provided during login (optional).
    if (
      currentLocation?.latitude !== undefined ||
      currentLocation?.longitude !== undefined
    ) {
      const latitude = Number(currentLocation?.latitude);
      const longitude = Number(currentLocation?.longitude);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        throw ApiError.badRequest('Invalid location');
      }
      if (
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
      ) {
        throw ApiError.badRequest('Invalid location');
      }

      const locationPoint = `POINT(${longitude} ${latitude})`;
      const h3Index = latLngToCell(latitude, longitude, 8);
      const h3IndexBigInt = BigInt(`0x${h3Index}`);

      await db
        .update(serviceProvider)
        .set({
          currentLocation: {
            latitude: latitude.toString(),
            longitude: longitude.toString(),
          },
          lastLocation: sql`ST_SetSRID(ST_GeomFromText(${locationPoint}), 4326)`,
          h3Index: h3IndexBigInt,
        })
        .where(eq(serviceProvider.id, existingServiceProvider.id));

      existingServiceProvider.currentLocation = {
        latitude: latitude.toString(),
        longitude: longitude.toString(),
      };
    }

    // Enforce org lifecycle restrictions: allow login but issue restricted JWT if org isn't active.
    // If org lookup fails for some reason, default to restrictive.
    const orgRow = await db.query.organization.findFirst({
      where: eq(organization.id, existingServiceProvider.organizationId as any),
      columns: { lifecycleStatus: true },
    });

    const lifecycle = orgRow?.lifecycleStatus?.toString() ?? 'unknown';
    const isRestricted = lifecycle !== 'active';

    const token = generateJWT(
      {
        ...existingServiceProvider,
        kind: 'service_provider',
      } as any,
      {
        restricted: isRestricted,
        orgStatus: lifecycle,
      }
    );

    const loggedInServiceProvider: Partial<TServiceProvider> = bigIntToString(
      existingServiceProvider
    );
    delete loggedInServiceProvider.password;

    let warnings: string[] = [];
    if (isRestricted) {
      warnings = [
        `Organization status is '${lifecycle}'. Access is restricted until status becomes 'active'.`,
      ];
    }

    res
      .status(200)
      .cookie('token', token)
      .json(
        new ApiResponse(200, 'ServiceProvider logged in successfully', {
          token,
          user: loggedInServiceProvider,
          warnings,
        })
      );
  }
);

const logoutServiceProvider = asyncHandler(
  async (req: Request, res: Response) => {
    const loggedInServiceProvider = req.user;

    if (!loggedInServiceProvider || !loggedInServiceProvider.id) {
      throw ApiError.unauthorized('Unauthorized');
    }

    const existingServiceProvider = await db.query.serviceProvider.findFirst({
      where: eq(serviceProvider.id, loggedInServiceProvider.id),
      columns: {
        id: true,
        name: true,
        phoneNumber: true,
        email: true,
        age: true,
        primaryAddress: true,
      },
    });

    if (!existingServiceProvider) {
      throw ApiError.unauthorized('Unauthorized Service Provider');
    }

    // Set status to off_duty when logging out
    await db
      .update(serviceProvider)
      .set({
        serviceStatus: 'off_duty',
        statusUpdatedAt: new Date().toISOString(),
      })
      .where(eq(serviceProvider.id, loggedInServiceProvider.id));

    res
      .status(200)
      .clearCookie('token')
      .json(
        new ApiResponse(200, 'Service Provider logged out successfully', {})
      );
  }
);

const verifyServiceProvider = asyncHandler(
  async (req: Request, res: Response) => {
    const { otpToken, providerId } = req.body;

    const existingServiceProvider = await db.query.serviceProvider.findFirst({
      where: eq(serviceProvider.id, providerId),
      columns: {
        password: false,
      },
    });

    if (!existingServiceProvider) {
      throw ApiError.badRequest('ServiceProvider not found');
    }

    if (
      !existingServiceProvider.verificationToken ||
      !existingServiceProvider.tokenExpiry
    ) {
      throw ApiError.badRequest('Verification token not found');
    }

    if (!existingServiceProvider.tokenExpiry) {
      throw ApiError.badRequest(
        'Verification token expiry not registered. Please verify again.'
      );
    }

    const tokenExpiryStr = existingServiceProvider.tokenExpiry;
    const tokenExpiry = new Date(tokenExpiryStr + 'Z');
    const currentTime = new Date();

    if (currentTime.getTime() > tokenExpiry.getTime()) {
      console.log('Verification token expired');
      throw ApiError.badRequest('Verification token expired');
    }

    if (otpToken !== existingServiceProvider.verificationToken) {
      throw ApiError.badRequest('Invalid OTP');
    }

    const updatedServiceProvider = await db
      .update(serviceProvider)
      .set({
        isVerified: true,
        verificationToken: null,
        tokenExpiry: null,
      })
      .returning({
        id: serviceProvider.id,
        name: serviceProvider.name,
        phoneNumber: serviceProvider.phoneNumber,
        isVerified: serviceProvider.isVerified,
      });

    if (!updatedServiceProvider.length) {
      throw ApiError.internalServerError('Failed to verify serviceProvider');
    }

    res.status(200).json(
      new ApiResponse(200, 'ServiceProvider verified successfully', {
        serviceProvider: updatedServiceProvider[0],
      })
    );
  }
);

const resendServiceProviderVerificationOTP = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body as { email: string };

    const existingServiceProvider = await db.query.serviceProvider.findFirst({
      where: eq(serviceProvider.email, email),
      columns: {
        id: true,
        email: true,
        isVerified: true,
      },
    });

    // Avoid leaking whether an email exists.
    if (!existingServiceProvider) {
      return res
        .status(200)
        .json(new ApiResponse(200, 'OTP sent if account exists', {}));
    }

    if (existingServiceProvider.isVerified) {
      return res
        .status(200)
        .json(new ApiResponse(200, 'Account already verified', {}));
    }

    const otpToken = await sendOTP(existingServiceProvider.email);
    if (!otpToken) {
      throw ApiError.internalServerError(
        'Error sending OTP token. Please try again'
      );
    }

    const tokenExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await db
      .update(serviceProvider)
      .set({
        verificationToken: otpToken,
        tokenExpiry: tokenExpiry.toISOString(),
      })
      .where(eq(serviceProvider.id, existingServiceProvider.id));

    return res.status(200).json(
      new ApiResponse(200, 'OTP sent to serviceProvider for verification', {
        serviceProviderId: existingServiceProvider.id,
      })
    );
  }
);

const updateServiceProvider = asyncHandler(
  async (req: Request, res: Response) => {
    const loggedInServiceProvider = req.user;

    if (!loggedInServiceProvider || !loggedInServiceProvider.id) {
      throw ApiError.unauthorized('Unauthorized');
    }

    const body = req.body;
    if (!body || Object.keys(body).length === 0) {
      throw ApiError.badRequest('No data to update');
    }

    const existingServiceProvider = await db.query.serviceProvider.findFirst({
      where: eq(serviceProvider.id, loggedInServiceProvider.id),
    });

    if (!existingServiceProvider) {
      throw ApiError.unauthorized('Unauthorized');
    }

    const {
      name,
      age,
      email,
      phoneNumber,
      primaryAddress,
      profilePicture,
      serviceArea,
      vehicleInformation,
    } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (age !== undefined) updateData.age = age;
    if (email !== undefined) updateData.email = email;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (primaryAddress !== undefined)
      updateData.primaryAddress = primaryAddress;
    if (profilePicture !== undefined)
      updateData.profilePicture = profilePicture;
    if (serviceArea !== undefined) updateData.serviceArea = serviceArea;
    if (vehicleInformation !== undefined)
      updateData.vehicleInformation = vehicleInformation;

    if (Object.keys(updateData).length === 0) {
      throw ApiError.badRequest('No data to update');
    }

    const updatedServiceProvider = await db
      .update(serviceProvider)
      .set(updateData)
      .where(eq(serviceProvider.id, existingServiceProvider.id))
      .returning({
        id: serviceProvider.id,
        name: serviceProvider.name,
        age: serviceProvider.age,
        email: serviceProvider.email,
        phoneNumber: serviceProvider.phoneNumber,
        primaryAddress: serviceProvider.primaryAddress,
        profilePicture: serviceProvider.profilePicture,
        serviceArea: serviceProvider.serviceArea,
        serviceType: serviceProvider.serviceType,
        isVerified: serviceProvider.isVerified,
        vehicleInformation: serviceProvider.vehicleInformation,
      });

    if (!updatedServiceProvider.length) {
      throw ApiError.internalServerError('Failed to update serviceProvider');
    }

    res.status(200).json(
      new ApiResponse(200, 'ServiceProvider updated successfully', {
        serviceProvider: updatedServiceProvider[0],
      })
    );
  }
);

const deleteServiceProvider = asyncHandler(
  async (_req: Request, _res: Response) => {
    // Not yet implemented
  }
);

const forgotServiceProviderPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, phoneNumber } = req.body;

    // Tests expect 400 if missing phone number.
    if (!email && !phoneNumber) {
      throw ApiError.badRequest('Phone number or email is required');
    }

    const whereClause = email
      ? eq(serviceProvider.email, email)
      : eq(serviceProvider.phoneNumber, Number(phoneNumber));

    const existingServiceProvider = await db.query.serviceProvider.findFirst({
      where: whereClause,
    });

    if (!existingServiceProvider) {
      throw ApiError.notFound('ServiceProvider not found with given email');
    }

    const otpToken = await sendOTP(existingServiceProvider.email);

    if (!otpToken) {
      throw ApiError.serviceUnavailable(
        'Error Sending OTP token. Please try again'
      );
    }

    const tokenExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const servicePerson = await db.update(serviceProvider).set({
      resetPasswordToken: otpToken,
      resetPasswordTokenExpiry: tokenExpiry.toISOString(),
    });

    if (!servicePerson) {
      throw ApiError.badRequest('Error setting reset password token');
    }

    res.status(200).json(
      new ApiResponse(200, 'OTP sent to serviceProvider for verification', {
        serviceProviderId: existingServiceProvider.id,
        otpToken,
      })
    );
  }
);

const resetServiceProviderPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { otpToken, providerId, password } = req.body;

    const existingServiceProvider = await db.query.serviceProvider.findFirst({
      where: eq(serviceProvider.id, providerId),
      columns: {
        password: false,
      },
    });

    if (!existingServiceProvider) {
      throw ApiError.badRequest('ServiceProvider not found');
    }

    if (
      !existingServiceProvider.resetPasswordToken ||
      !existingServiceProvider.resetPasswordTokenExpiry
    ) {
      throw ApiError.badRequest('Reset password token not found');
    }

    if (!existingServiceProvider.resetPasswordTokenExpiry) {
      throw ApiError.badRequest(
        'Reset password token expiry not registered. Please verify again.'
      );
    }

    const tokenExpiry = new Date(
      existingServiceProvider.resetPasswordTokenExpiry
    );
    const currentTime = new Date(Date.now()).toISOString();

    if (new Date(currentTime) < tokenExpiry) {
      throw ApiError.badRequest('Reset password token expired');
    }

    if (otpToken !== existingServiceProvider.resetPasswordToken) {
      throw ApiError.badRequest('Invalid OTP');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const updatedServiceProvider = await db
      .update(serviceProvider)
      .set({
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordTokenExpiry: null,
      })
      .returning({
        id: serviceProvider.id,
        name: serviceProvider.name,
        phoneNumber: serviceProvider.phoneNumber,
      });

    if (!updatedServiceProvider.length) {
      throw ApiError.internalServerError('Failed to reset password');
    }

    res.status(200).json(
      new ApiResponse(200, 'Password reset successfully', {
        serviceProvider: updatedServiceProvider[0],
      })
    );
  }
);

const getServiceProviderProfile = asyncHandler(
  async (req: Request, res: Response) => {
    console.log('hitting');
    const loggedInServiceProvider = req.user;

    if (!loggedInServiceProvider || !loggedInServiceProvider.id) {
      throw ApiError.unauthorized('Unauthorized');
    }

    const existingServiceProvider = await db.query.serviceProvider.findFirst({
      where: eq(serviceProvider.id, loggedInServiceProvider.id),
    });

    if (!existingServiceProvider) {
      throw ApiError.notFound('Service Provider not found');
    }

    res.status(200).json(
      new ApiResponse(200, 'Service Provider found successfully', {
        user: existingServiceProvider,
      })
    );
  }
);

const getServiceProvider = asyncHandler(async (req: Request, res: Response) => {
  const rawId = (req.params as any)?.id as unknown;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const loggedInServiceProvider = req.user;

  if (
    !loggedInServiceProvider ||
    !loggedInServiceProvider.id ||
    loggedInServiceProvider.role !== 'admin'
  ) {
    throw ApiError.unauthorized('Unauthorized');
  }

  if (!id || typeof id !== 'string') {
    throw ApiError.badRequest('Service Provider ID is required');
  }

  const existingServiceProvider = await db.query.serviceProvider.findFirst({
    where: eq(serviceProvider.id, id),
  });

  if (!existingServiceProvider) {
    throw ApiError.notFound('Service Provider not found');
  }

  res.status(200).json(
    new ApiResponse(200, 'Service Provider found successfully', {
      serviceProvider: existingServiceProvider,
    })
  );
});

const updateServiceProviderStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const loggedInUser = req.user;
    const { serviceStatus } = req.body;

    if (!loggedInUser || !loggedInUser.id) {
      throw ApiError.badRequest('Please login to perform this action');
    }

    if (!serviceStatus) {
      throw ApiError.badRequest('Status is required');
    }

    // Check for cooldown (30 seconds)
    const STATUS_COOLDOWN_MS = 30000; // 30 seconds
    const existingProvider = await db.query.serviceProvider.findFirst({
      where: eq(serviceProvider.id, loggedInUser.id),
      columns: {
        id: true,
        serviceStatus: true,
        statusUpdatedAt: true,
      },
    });

    if (!existingProvider) {
      throw ApiError.notFound('Service provider not found');
    }

    // If same status, no need to update
    if (existingProvider.serviceStatus === serviceStatus) {
      return res.status(200).json(
        new ApiResponse(200, 'Status unchanged', {
          serviceProvider: existingProvider,
        })
      );
    }

    // Check cooldown - only enforce for status changes, not first time
    if (existingProvider.statusUpdatedAt) {
      const lastUpdate = new Date(existingProvider.statusUpdatedAt).getTime();
      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdate;

      if (timeSinceLastUpdate < STATUS_COOLDOWN_MS) {
        const remainingSeconds = Math.ceil(
          (STATUS_COOLDOWN_MS - timeSinceLastUpdate) / 1000
        );
        throw ApiError.tooManyRequest(
          `Please wait ${remainingSeconds} seconds before changing status again`
        );
      }
    }

    // Update service provider status with timestamp
    const updatedProvider = await db
      .update(serviceProvider)
      .set({
        serviceStatus,
        statusUpdatedAt: new Date().toISOString(),
      })
      .where(eq(serviceProvider.id, loggedInUser.id))
      .returning();

    if (!updatedProvider || updatedProvider.length === 0) {
      throw ApiError.notFound('Service provider not found');
    }

    // Emit socket event for status update
    const io = getIo();
    if (io && updatedProvider[0]) {
      io.to(SocketRoom.PROVIDER(updatedProvider[0].id)).emit(
        SocketEvents.NOTIFICATION_RECEIVED,
        {
          type: SocketEvents.UDPATE_STATUS,
          status: updatedProvider[0].serviceStatus,
        }
      );
    }

    res.status(200).json(
      new ApiResponse(200, 'Service provider status updated', {
        serviceProvider: updatedProvider[0],
      })
    );
  }
);

const getNearbyProviders = asyncHandler(async (req: Request, res: Response) => {
  const { latitude, longitude, serviceType } = req.query;
  if (!latitude || !longitude || !serviceType) {
    throw ApiError.badRequest(
      'latitude, longitude, and serviceType are required'
    );
  }

  // Find all available providers of the requested type
  const serviceTypeMap: Record<string, ServiceTypeEnum> = {
    ambulance: ServiceTypeEnum.AMBULANCE,
    police: ServiceTypeEnum.POLICE,
    rescue_team: ServiceTypeEnum.RESCUE_TEAM,
    fire_truck: ServiceTypeEnum.FIRE_TRUCK,
  };

  const serviceTypeValue = serviceTypeMap[serviceType as string];
  if (!serviceTypeValue) {
    throw ApiError.badRequest('Invalid service type');
  }

  const providers = await db.query.serviceProvider.findMany({
    where: and(
      eq(serviceProvider.serviceStatus, 'available'),
      eq(serviceProvider.serviceType, serviceTypeValue)
    ),
    columns: {
      id: true,
      name: true,
      serviceType: true,
      currentLocation: true,
    },
  });

  // Calculate distance and sort
  const userLoc = {
    latitude: parseFloat(latitude as string),
    longitude: parseFloat(longitude as string),
  };
  const withDistance = providers
    .filter(
      p =>
        p.currentLocation &&
        p.currentLocation.latitude &&
        p.currentLocation.longitude
    )
    .map(p => ({
      ...p,
      distance: calculateDistance(userLoc, {
        latitude: parseFloat(p.currentLocation!.latitude),
        longitude: parseFloat(p.currentLocation!.longitude),
      }),
    }))
    .sort((a, b) => a.distance - b.distance);

  res.status(200).json({ providers: withDistance });
});

const changeProviderPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const loggedInProvider = req.user;

    if (!loggedInProvider || !loggedInProvider.id) {
      console.log('Unauthorized');
      throw ApiError.unauthorized('Unauthorized');
    }

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword) {
      throw ApiError.badRequest('Old password is required');
    }

    if (!newPassword) {
      throw ApiError.badRequest('New password is required');
    }

    const existingProvider = await db.query.serviceProvider.findFirst({
      where: eq(serviceProvider.id, loggedInProvider.id),
      columns: {
        id: true,
        name: true,
        phoneNumber: true,
        email: true,
        age: true,
        primaryAddress: true,
        password: true,
        isVerified: true,
      },
    });

    if (!existingProvider) {
      console.log('Unauthorized');
      throw ApiError.unauthorized('Unauthorized');
    }

    const isPasswordValid = await bcrypt.compare(
      oldPassword,
      existingProvider.password
    );

    if (!isPasswordValid) {
      console.log('Invalid credentials');
      throw ApiError.badRequest('Invalid credentials');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedProvider = await db
      .update(serviceProvider)
      .set({
        password: hashedPassword,
      })
      .where(eq(serviceProvider.id, loggedInProvider.id))
      .returning({
        id: serviceProvider.id,
        name: serviceProvider.name,
        phoneNumber: serviceProvider.phoneNumber,
        email: serviceProvider.email,
        age: serviceProvider.age,
        primaryAddress: serviceProvider.primaryAddress,
        isVerified: serviceProvider.isVerified,
      });

    if (!updatedProvider.length) {
      throw ApiError.internalServerError('Failed to update user');
    }

    res.status(200).json(
      new ApiResponse(200, 'Password updated successfully', {
        user: updatedProvider[0],
      })
    );
  }
);

const updateServiceProviderLocation = asyncHandler(
  async (req: Request, res: Response) => {
    const loggedInProvider = req.user;

    if (!loggedInProvider || !loggedInProvider.id) {
      throw ApiError.unauthorized('Unauthorized');
    }

    // Tests send `{ currentLocation: { latitude, longitude } }`.
    const body = req.body || {};
    const loc = body.currentLocation ?? body;
    const latitude = loc?.latitude;
    const longitude = loc?.longitude;

    if (latitude === undefined || longitude === undefined) {
      throw ApiError.badRequest('Location data is required');
    }

    const latNum = Number(latitude);
    const lngNum = Number(longitude);
    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
      throw ApiError.badRequest('Invalid location');
    }
    if (latNum < -90 || latNum > 90) {
      throw ApiError.badRequest('Invalid latitude');
    }
    if (lngNum < -180 || lngNum > 180) {
      throw ApiError.badRequest('Invalid longitude');
    }

    // Create PostGIS POINT geometry string
    const locationPoint = `POINT(${lngNum} ${latNum})`;

    // Compute H3 index for this location (resolution 8)
    const H3_RESOLUTION = 8;
    const h3Index = latLngToCell(latNum, lngNum, H3_RESOLUTION);
    const h3IndexBigInt = BigInt(`0x${h3Index}`);

    const [updatedProvider] = await db
      .update(serviceProvider)
      .set({
        currentLocation: {
          latitude: latNum.toString(),
          longitude: lngNum.toString(),
        },
        lastLocation: sql`ST_SetSRID(ST_GeomFromText(${locationPoint}), 4326)`,
        h3Index: h3IndexBigInt,
      })
      .where(eq(serviceProvider.id, loggedInProvider.id))
      .returning({
        id: serviceProvider.id,
        name: serviceProvider.name,
        currentLocation: serviceProvider.currentLocation,
      });

    if (!updatedProvider) {
      throw ApiError.internalServerError('Failed to update location');
    }

    // Recursively convert BigInt fields to string for JSON serialization
    const safeProvider = bigIntToString(updatedProvider);
    res.status(200).json(
      new ApiResponse(200, 'Location updated successfully', {
        provider: safeProvider,
      })
    );
  }
);

const uploadVerificationDocuments = asyncHandler(
  async (req: Request, res: Response) => {
    const loggedInProvider = req.user;

    if (!loggedInProvider || !loggedInProvider.id) {
      throw ApiError.unauthorized('Unauthorized');
    }

    const { panCardUrl, citizenshipUrl } = (req.body ?? {}) as Partial<{
      panCardUrl: string;
      citizenshipUrl: string;
    }>;

    if (!panCardUrl || typeof panCardUrl !== 'string') {
      throw ApiError.badRequest('PAN card URL is required');
    }
    if (!citizenshipUrl || typeof citizenshipUrl !== 'string') {
      throw ApiError.badRequest('Citizenship URL is required');
    }

    // Basic sanity check: enforce Cloudinary URLs for documents as well
    if (!panCardUrl.includes('cloudinary.com')) {
      throw ApiError.badRequest('Invalid PAN card URL');
    }
    if (!citizenshipUrl.includes('cloudinary.com')) {
      throw ApiError.badRequest('Invalid citizenship URL');
    }

    // update provider with document urls and set status to pending
    const [updatedProvider] = await db
      .update(serviceProvider)
      .set({
        panCardUrl,
        citizenshipUrl,
        documentStatus: 'pending',
        rejectionReason: null,
      })
      .where(eq(serviceProvider.id, loggedInProvider.id))
      .returning({
        id: serviceProvider.id,
        name: serviceProvider.name,
        documentStatus: serviceProvider.documentStatus,
      });

    if (!updatedProvider) {
      throw ApiError.internalServerError('Failed to upload documents');
    }

    res.status(200).json(
      new ApiResponse(
        200,
        'Documents uploaded successfully. Pending verification.',
        {
          provider: updatedProvider,
        }
      )
    );
  }
);

const getDocumentUploadSignatures = asyncHandler(
  async (req: Request, res: Response) => {
    const loggedInProvider = req.user;

    if (!loggedInProvider?.id) {
      throw ApiError.unauthorized('Unauthorized');
    }

    if (!isCloudinaryConfigured()) {
      throw ApiError.serviceUnavailable(
        'Document upload service is not configured'
      );
    }

    // Use predictable public IDs so re-uploads replace the same asset.
    // Provider ID is included to prevent collisions across providers.
    const panCardPublicId = `provider_${loggedInProvider.id}_panCard`;
    const citizenshipPublicId = `provider_${loggedInProvider.id}_citizenship`;

    const panCard = generateUploadSignature(
      'document-verification',
      panCardPublicId
    );
    const citizenship = generateUploadSignature(
      'document-verification',
      citizenshipPublicId
    );

    res.status(200).json(
      new ApiResponse(
        200,
        'Document upload signatures generated successfully',
        {
          panCard: {
            ...panCard,
            uploadUrl: `https://api.cloudinary.com/v1_1/${panCard.cloudName}/auto/upload`,
          },
          citizenship: {
            ...citizenship,
            uploadUrl: `https://api.cloudinary.com/v1_1/${citizenship.cloudName}/auto/upload`,
          },
        }
      )
    );
  }
);

const getDocumentStatus = asyncHandler(async (req: Request, res: Response) => {
  const loggedInProvider = req.user;

  if (!loggedInProvider || !loggedInProvider.id) {
    throw ApiError.unauthorized('Unauthorized');
  }

  const provider = await db.query.serviceProvider.findFirst({
    where: eq(serviceProvider.id, loggedInProvider.id),
    columns: {
      id: true,
      name: true,
      documentStatus: true,
      rejectionReason: true,
      verifiedAt: true,
    },
  });

  if (!provider) {
    throw ApiError.notFound('Service provider not found');
  }

  res.status(200).json(
    new ApiResponse(200, 'Document status retrieved', {
      documentStatus: provider.documentStatus,
      rejectionReason: provider.rejectionReason,
      verifiedAt: provider.verifiedAt,
    })
  );
});

// Provider profile picture upload helpers (direct-to-Cloudinary, then confirm URL)
const getProfilePictureUploadSignature = asyncHandler(
  async (req: Request, res: Response) => {
    const loggedInProvider = req.user;

    if (!loggedInProvider?.id) {
      throw ApiError.unauthorized('Unauthorized');
    }

    if (!isCloudinaryConfigured()) {
      throw ApiError.serviceUnavailable(
        'Image upload service is not configured'
      );
    }

    // Predictable public ID so new uploads replace the same asset.
    const publicId = `provider_${loggedInProvider.id}_profilePicture`;
    const signatureData = generateUploadSignature('profile-pictures', publicId);

    res.status(200).json(
      new ApiResponse(200, 'Upload signature generated successfully', {
        ...signatureData,
        uploadUrl: `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`,
      })
    );
  }
);

const updateProfilePicture = asyncHandler(
  async (req: Request, res: Response) => {
    const loggedInProvider = req.user;
    const { profilePictureUrl } = req.body as { profilePictureUrl: string };

    if (!loggedInProvider?.id) {
      throw ApiError.unauthorized('Unauthorized');
    }

    if (!profilePictureUrl || typeof profilePictureUrl !== 'string') {
      throw ApiError.badRequest('Profile picture URL is required');
    }

    if (!profilePictureUrl.includes('cloudinary.com')) {
      throw ApiError.badRequest('Invalid profile picture URL');
    }

    const existingProvider = await db.query.serviceProvider.findFirst({
      where: eq(serviceProvider.id, loggedInProvider.id),
      columns: {
        id: true,
        profilePicture: true,
      },
    });

    if (!existingProvider) {
      throw ApiError.notFound('Service provider not found');
    }

    // Delete old profile picture from Cloudinary if it exists.
    if (existingProvider.profilePicture) {
      const oldPublicId = extractPublicIdFromUrl(
        existingProvider.profilePicture
      );
      if (oldPublicId) {
        await deleteImage(oldPublicId);
      }
    }

    const [updatedProvider] = await db
      .update(serviceProvider)
      .set({ profilePicture: profilePictureUrl })
      .where(eq(serviceProvider.id, loggedInProvider.id))
      .returning({
        id: serviceProvider.id,
        name: serviceProvider.name,
        email: serviceProvider.email,
        phoneNumber: serviceProvider.phoneNumber,
        profilePicture: serviceProvider.profilePicture,
      });

    if (!updatedProvider) {
      throw ApiError.internalServerError('Failed to update profile picture');
    }

    res.status(200).json(
      new ApiResponse(200, 'Profile picture updated successfully', {
        serviceProvider: updatedProvider,
      })
    );
  }
);

const deleteProfilePicture = asyncHandler(
  async (req: Request, res: Response) => {
    const loggedInProvider = req.user;

    if (!loggedInProvider?.id) {
      throw ApiError.unauthorized('Unauthorized');
    }

    const existingProvider = await db.query.serviceProvider.findFirst({
      where: eq(serviceProvider.id, loggedInProvider.id),
      columns: {
        id: true,
        profilePicture: true,
      },
    });

    if (!existingProvider) {
      throw ApiError.notFound('Service provider not found');
    }

    if (!existingProvider.profilePicture) {
      throw ApiError.badRequest('No profile picture to delete');
    }

    const publicId = extractPublicIdFromUrl(existingProvider.profilePicture);
    if (publicId) {
      await deleteImage(publicId);
    }

    const [updatedProvider] = await db
      .update(serviceProvider)
      .set({ profilePicture: null })
      .where(eq(serviceProvider.id, loggedInProvider.id))
      .returning({
        id: serviceProvider.id,
        name: serviceProvider.name,
        email: serviceProvider.email,
        phoneNumber: serviceProvider.phoneNumber,
        profilePicture: serviceProvider.profilePicture,
      });

    if (!updatedProvider) {
      throw ApiError.internalServerError('Failed to delete profile picture');
    }

    res.status(200).json(
      new ApiResponse(200, 'Profile picture deleted successfully', {
        serviceProvider: updatedProvider,
      })
    );
  }
);

const getPendingVerifications = asyncHandler(
  async (req: Request, res: Response) => {
    const loggedInOrg = req.user;

    if (!loggedInOrg || !loggedInOrg.id) {
      throw ApiError.unauthorized('Unauthorized');
    }

    const pendingProviders = await db.query.serviceProvider.findMany({
      where: and(
        eq(serviceProvider.organizationId, loggedInOrg.id),
        eq(serviceProvider.documentStatus, 'pending')
      ),
      columns: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        serviceType: true,
        documentStatus: true,
        panCardUrl: true,
        citizenshipUrl: true,
        createdAt: true,
      },
    });

    res.status(200).json(
      new ApiResponse(200, 'Pending verifications retrieved', {
        providers: pendingProviders,
        count: pendingProviders.length,
      })
    );
  }
);

const getProviderDocuments = asyncHandler(
  async (req: Request, res: Response) => {
    const loggedInOrg = req.user;
    const rawProviderId = (req.params as any)?.providerId as unknown;
    const providerId = Array.isArray(rawProviderId)
      ? rawProviderId[0]
      : rawProviderId;

    if (!loggedInOrg || !loggedInOrg.id) {
      throw ApiError.unauthorized('Unauthorized');
    }

    if (!providerId || typeof providerId !== 'string') {
      throw ApiError.badRequest('Provider ID is required');
    }

    const provider = await db.query.serviceProvider.findFirst({
      where: and(
        eq(serviceProvider.id, providerId),
        eq(serviceProvider.organizationId, loggedInOrg.id)
      ),
      columns: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        serviceType: true,
        documentStatus: true,
        panCardUrl: true,
        citizenshipUrl: true,
        rejectionReason: true,
        verifiedAt: true,
        verifiedBy: true,
        createdAt: true,
      },
    });

    if (!provider) {
      throw ApiError.notFound(
        'Service provider not found or does not belong to your organization'
      );
    }

    res.status(200).json(
      new ApiResponse(200, 'Provider documents retrieved', {
        provider,
      })
    );
  }
);

const verifyProviderDocuments = asyncHandler(
  async (req: Request, res: Response) => {
    const loggedInOrg = req.user;
    const rawProviderId = (req.params as any)?.providerId as unknown;
    const providerId = Array.isArray(rawProviderId)
      ? rawProviderId[0]
      : rawProviderId;

    if (!loggedInOrg || !loggedInOrg.id) {
      throw ApiError.unauthorized('Unauthorized');
    }

    if (!providerId || typeof providerId !== 'string') {
      throw ApiError.badRequest('Provider ID is required');
    }

    const parsedBody = verifyDocumentsSchema.safeParse(req.body);
    if (!parsedBody.success) {
      throw ApiError.validationError(parsedBody.error);
    }

    const { action, rejectionReason } = parsedBody.data;

    // Validate rejection reason is provided when rejecting
    if (action === 'reject' && !rejectionReason) {
      throw ApiError.badRequest(
        'Rejection reason is required when rejecting documents'
      );
    }

    // Check if provider belongs to this organization
    const existingProvider = await db.query.serviceProvider.findFirst({
      where: and(
        eq(serviceProvider.id, providerId),
        eq(serviceProvider.organizationId, loggedInOrg.id)
      ),
    });

    if (!existingProvider) {
      throw ApiError.notFound(
        'Service provider not found or does not belong to your organization'
      );
    }

    if (existingProvider.documentStatus !== 'pending') {
      throw ApiError.badRequest('Documents are not pending verification');
    }

    // Update document status
    const [updatedProvider] = await db
      .update(serviceProvider)
      .set({
        documentStatus: action === 'approve' ? 'approved' : 'rejected',
        rejectionReason: action === 'reject' ? rejectionReason : null,
        verifiedAt: action === 'approve' ? new Date().toISOString() : null,
        verifiedBy: action === 'approve' ? loggedInOrg.id : null,
      })
      .where(eq(serviceProvider.id, providerId))
      .returning({
        id: serviceProvider.id,
        name: serviceProvider.name,
        documentStatus: serviceProvider.documentStatus,
        rejectionReason: serviceProvider.rejectionReason,
        verifiedAt: serviceProvider.verifiedAt,
      });

    if (!updatedProvider) {
      throw ApiError.internalServerError('Failed to update document status');
    }

    const message =
      action === 'approve'
        ? 'Provider documents approved successfully'
        : 'Provider documents rejected';

    res.status(200).json(
      new ApiResponse(200, message, {
        provider: updatedProvider,
      })
    );
  }
);

const serviceProviderController = {
  registerServiceProvider,
  loginServiceProvider,
  logoutServiceProvider,
  verifyServiceProvider,
  resendServiceProviderVerificationOTP,
  updateServiceProvider,
  deleteServiceProvider,
  resetServiceProviderPassword,
  forgotServiceProviderPassword,
  getServiceProviderProfile,
  getServiceProvider,
  updateServiceProviderStatus,
  changeProviderPassword,
  getNearbyProviders,
  updateServiceProviderLocation,
  uploadVerificationDocuments,
  getDocumentUploadSignatures,
  getDocumentStatus,
  getPendingVerifications,
  getProviderDocuments,
  verifyProviderDocuments,
  getProfilePictureUploadSignature,
  updateProfilePicture,
  deleteProfilePicture,
} as const;

export default serviceProviderController;

// Keep named exports for tests and legacy imports.
export {
  registerServiceProvider,
  loginServiceProvider,
  logoutServiceProvider,
  verifyServiceProvider,
  resendServiceProviderVerificationOTP,
  updateServiceProvider,
  deleteServiceProvider,
  resetServiceProviderPassword,
  forgotServiceProviderPassword,
  getServiceProviderProfile,
  getServiceProvider,
  updateServiceProviderStatus,
  changeProviderPassword,
  getNearbyProviders,
  updateServiceProviderLocation,
  uploadVerificationDocuments,
  getDocumentUploadSignatures,
  getDocumentStatus,
  getPendingVerifications,
  getProviderDocuments,
  verifyProviderDocuments,
  getProfilePictureUploadSignature,
  updateProfilePicture,
  deleteProfilePicture,
};
