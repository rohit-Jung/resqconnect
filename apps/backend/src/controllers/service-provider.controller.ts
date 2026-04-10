import bcrypt from 'bcryptjs';
import { and, eq, or, sql } from 'drizzle-orm';
import type { Request, Response } from 'express';
import { latLngToCell } from 'h3-js';

import { ServiceTypeEnum } from '@/constants/enums.constants';
import { SocketEvents, SocketRoom } from '@/constants/socket.constants';
import db from '@/db';
import {
  type TServiceProvider,
  emergencyRequest,
  emergencyResponse,
  newServiceProviderSchema,
  organization,
  serviceProvider,
  verifyDocumentsSchema,
} from '@/models';
import {
  notifyServiceProvider,
  notifyUser,
} from '@/services/notification.service';
import { getIo } from '@/socket';
import ApiError from '@/utils/api/ApiError';
import ApiResponse from '@/utils/api/ApiResponse';
import { asyncHandler } from '@/utils/api/asyncHandler';
import { calculateDistance, getBestServiceProvider } from '@/utils/maps';
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
    const parsedValues = newServiceProviderSchema.safeParse(req.body);

    if (!parsedValues.success) {
      console.log('Parsing Error: ', parsedValues.error.issues);
      const validationError = new ApiError(
        400,
        'Error validating data',
        parsedValues.error.issues.map(
          issue => `${String(issue.path[0])} : ${issue.message} `
        )
      );

      return res.status(400).json(validationError);
    }

    if (
      parsedValues.data.phoneNumber &&
      /^[0-9]{10}$/.exec(parsedValues.data.phoneNumber.toString()) === null
    ) {
      throw new ApiError(400, 'Invalid phone number');
    }

    const existingServiceProvider = await db.query.serviceProvider.findFirst({
      where: or(
        eq(serviceProvider.phoneNumber, parsedValues.data.phoneNumber),
        eq(serviceProvider.email, parsedValues.data.email)
      ),
    });

    if (existingServiceProvider) {
      throw new ApiError(
        400,
        'Service Provider with this email or phone number already exists'
      );
    }

    const existingOrganization = await db.query.organization.findFirst({
      where: eq(organization.id, parsedValues.data.organizationId),
    });

    if (!existingOrganization) {
      throw new ApiError(404, 'Organization not found');
    }

    if (
      existingOrganization.serviceCategory !== parsedValues.data.serviceType
    ) {
      throw new ApiError(
        400,
        'Service Type does not match with organization service category'
      );
    }

    const hashedPassword = await bcrypt.hash(parsedValues.data.password, 10);

    const newServiceProvider = await db
      .insert(serviceProvider)
      .values({
        ...parsedValues.data,
        password: hashedPassword,
        lastLocation: sql`ST_SetSRID(ST_MakePoint(85.3240, 27.7172), 4326)`,
        h3Index: BigInt('0'),
      })
      .returning({
        name: serviceProvider.name,
        age: serviceProvider.age,
        phoneNumber: serviceProvider.phoneNumber,
        email: serviceProvider.email,
        primaryAddress: serviceProvider.primaryAddress,
        serviceType: serviceProvider.serviceType,
      });

    if (!newServiceProvider) {
      throw new ApiError(400, 'Failed to register serviceProvider');
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

    const existingServiceProvider = await db.query.serviceProvider.findFirst({
      where: eq(serviceProvider.email, email),
    });

    if (!existingServiceProvider) {
      throw new ApiError(
        404,
        'ServiceProvider not found with given credentials'
      );
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      existingServiceProvider.password
    );

    if (!isPasswordValid) {
      throw new ApiError(400, 'Invalid Credentials Provided');
    }

    if (existingServiceProvider && !existingServiceProvider.isVerified) {
      const otpToken = await sendOTP(existingServiceProvider.email);

      if (!otpToken) {
        throw new ApiError(300, 'Error Sending OTP token. Please try again');
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
        throw new ApiError(400, 'Error setting verfication token');
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
    // Update location if provided during login
    const { latitude, longitude } = currentLocation;
    console.log(latitude, longitude);
    const locationPoint = `POINT(${longitude} ${latitude})`;
    const h3Index = latLngToCell(Number(latitude), Number(longitude), 8);
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

    const token = generateJWT({
      ...existingServiceProvider,
      kind: 'service_provider',
    } as any);

    const loggedInServiceProvider: Partial<TServiceProvider> = bigIntToString(
      existingServiceProvider
    );
    delete loggedInServiceProvider.password;

    res
      .status(200)
      .cookie('token', token)
      .json(
        new ApiResponse(200, 'ServiceProvider logged in successfully', {
          token,
          user: loggedInServiceProvider,
        })
      );
  }
);

const logoutServiceProvider = asyncHandler(
  async (req: Request, res: Response) => {
    const loggedInServiceProvider = req.user;

    if (!loggedInServiceProvider || !loggedInServiceProvider.id) {
      throw new ApiError(401, 'Unauthorized');
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
      throw new ApiError(401, 'Unauthorized Service Provider');
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
    console.log('tokens ', req.body);
    const { otpToken, userId: serviceProviderId } = req.body;

    if (!otpToken) {
      throw new ApiError(400, 'Please provide OTP');
    }

    if (!serviceProviderId) {
      throw new ApiError(400, 'Please provide serviceProvider ID');
    }

    const existingServiceProvider = await db.query.serviceProvider.findFirst({
      where: eq(serviceProvider.id, serviceProviderId),
      columns: {
        password: false,
      },
    });

    if (!existingServiceProvider) {
      throw new ApiError(400, 'ServiceProvider not found');
    }

    if (
      !existingServiceProvider.verificationToken ||
      !existingServiceProvider.tokenExpiry
    ) {
      throw new ApiError(400, 'Verification token not found');
    }

    if (!existingServiceProvider.tokenExpiry) {
      throw new ApiError(
        400,
        'Verification token expiry not registered. Please verify again.'
      );
    }

    const tokenExpiry = new Date(existingServiceProvider.tokenExpiry);
    const currentTime = new Date(Date.now()).toISOString();

    if (new Date(currentTime) > tokenExpiry) {
      throw new ApiError(400, 'Verification token expired');
    }

    if (otpToken !== existingServiceProvider.verificationToken) {
      throw new ApiError(400, 'Invalid OTP');
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
      throw new ApiError(500, 'Failed to verify serviceProvider');
    }

    res.status(200).json(
      new ApiResponse(200, 'ServiceProvider verified successfully', {
        serviceProvider: updatedServiceProvider[0],
      })
    );
  }
);

const updateServiceProvider = asyncHandler(
  async (req: Request, res: Response) => {
    const loggedInServiceProvider = req.user;

    if (!loggedInServiceProvider || !loggedInServiceProvider.id) {
      throw new ApiError(401, 'Unauthorized');
    }

    const existingServiceProvider = await db.query.serviceProvider.findFirst({
      where: eq(serviceProvider.id, loggedInServiceProvider.id),
    });

    if (!existingServiceProvider) {
      throw new ApiError(401, 'Unauthorized');
    }

    const updateData = req.body;

    if (Object.keys(updateData).length === 0) {
      throw new ApiError(400, 'No data to update');
    }

    const invalidKeys = Object.keys(updateData).filter(
      key => !Object.keys(serviceProvider).includes(key)
    );

    if (invalidKeys.length > 0) {
      throw new ApiError(
        400,
        `Invalid data to update. Invalid keys: ${invalidKeys}`
      );
    }

    const updatedServiceProvider = await db
      .update(serviceProvider)
      .set(updateData)
      .where(eq(serviceProvider.id, existingServiceProvider.id))
      .returning();

    if (!updatedServiceProvider.length) {
      throw new ApiError(500, 'Failed to update serviceProvider');
    }

    const { password, ...safeProvider } = updatedServiceProvider[0];
    res.status(200).json(
      new ApiResponse(200, 'ServiceProvider updated successfully', {
        serviceProvider: safeProvider,
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
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      throw new ApiError(400, 'Please provide phone number');
    }

    const existingServiceProvider = await db.query.serviceProvider.findFirst({
      where: eq(serviceProvider.phoneNumber, phoneNumber),
    });

    if (!existingServiceProvider) {
      throw new ApiError(
        404,
        'ServiceProvider not found with given phone number'
      );
    }

    const otpToken = await sendOTP(existingServiceProvider.email);

    if (!otpToken) {
      throw new ApiError(300, 'Error Sending OTP token. Please try again');
    }

    const tokenExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const servicePerson = await db.update(serviceProvider).set({
      resetPasswordToken: otpToken,
      resetPasswordTokenExpiry: tokenExpiry.toISOString(),
    });

    if (!servicePerson) {
      throw new ApiError(400, 'Error setting reset password token');
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
    const { otpToken, serviceProviderId, password } = req.body;

    if (!otpToken) {
      throw new ApiError(400, 'Please provide OTP');
    }

    if (!serviceProviderId) {
      throw new ApiError(400, 'Please provide serviceProvider ID');
    }

    if (!password) {
      throw new ApiError(400, 'Please provide password');
    }

    const existingServiceProvider = await db.query.serviceProvider.findFirst({
      where: eq(serviceProvider.id, serviceProviderId),
      columns: {
        password: false,
      },
    });

    if (!existingServiceProvider) {
      throw new ApiError(400, 'ServiceProvider not found');
    }

    if (
      !existingServiceProvider.resetPasswordToken ||
      !existingServiceProvider.resetPasswordTokenExpiry
    ) {
      throw new ApiError(400, 'Reset password token not found');
    }

    if (!existingServiceProvider.resetPasswordTokenExpiry) {
      throw new ApiError(
        400,
        'Reset password token expiry not registered. Please verify again.'
      );
    }

    const tokenExpiry = new Date(
      existingServiceProvider.resetPasswordTokenExpiry
    );
    const currentTime = new Date(Date.now()).toISOString();

    if (new Date(currentTime) < tokenExpiry) {
      throw new ApiError(400, 'Reset password token expired');
    }

    if (otpToken !== existingServiceProvider.resetPasswordToken) {
      throw new ApiError(400, 'Invalid OTP');
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
      throw new ApiError(500, 'Failed to reset password');
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
      throw new ApiError(401, 'Unauthorized');
    }

    const existingServiceProvider = await db.query.serviceProvider.findFirst({
      where: eq(serviceProvider.id, loggedInServiceProvider.id),
    });

    if (!existingServiceProvider) {
      throw new ApiError(404, 'Service Provider not found');
    }

    res.status(200).json(
      new ApiResponse(200, 'Service Provider found successfully', {
        user: existingServiceProvider,
      })
    );
  }
);

const getServiceProvider = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const loggedInServiceProvider = req.user;

  if (
    !loggedInServiceProvider ||
    !loggedInServiceProvider.id ||
    loggedInServiceProvider.role !== 'admin'
  ) {
    throw new ApiError(401, 'Unauthorized');
  }

  if (!id) {
    throw new ApiError(400, 'Service Provider ID is required');
  }

  const existingServiceProvider = await db.query.serviceProvider.findFirst({
    where: eq(serviceProvider.id, id),
  });

  if (!existingServiceProvider) {
    throw new ApiError(404, 'Service Provider not found');
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
    const { status, emergencyResponseId } = req.body;

    if (!loggedInUser || !loggedInUser.id) {
      throw new ApiError(400, 'Please login to perform this action');
    }

    if (!status) {
      throw new ApiError(400, 'Status is required');
    }

    // Validate status value
    const validStatuses = ['available', 'assigned', 'off_duty'];
    if (!validStatuses.includes(status)) {
      throw new ApiError(400, 'Invalid status value');
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
      throw new ApiError(404, 'Service provider not found');
    }

    // If same status, no need to update
    if (existingProvider.serviceStatus === status) {
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
        throw new ApiError(
          429,
          `Please wait ${remainingSeconds} seconds before changing status again`
        );
      }
    }

    // Update service provider status with timestamp
    const updatedProvider = await db
      .update(serviceProvider)
      .set({
        serviceStatus: status,
        statusUpdatedAt: new Date().toISOString(),
      })
      .where(eq(serviceProvider.id, loggedInUser.id))
      .returning();

    if (!updatedProvider || updatedProvider.length === 0) {
      throw new ApiError(404, 'Service provider not found');
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

    // If there's an emergency response ID and status is "off_duty" or "unavailable"
    if (
      emergencyResponseId &&
      (status === 'off_duty' || status === 'unavailable')
    ) {
      // Get the emergency response details
      const emergencyResponseDetails =
        await db.query.emergencyResponse.findFirst({
          where: eq(emergencyResponse.id, emergencyResponseId),
        });

      if (
        emergencyResponseDetails &&
        emergencyResponseDetails.emergencyRequestId
      ) {
        // Get the emergency request details
        const emergencyRequestDetails =
          await db.query.emergencyRequest.findFirst({
            where: eq(
              emergencyRequest.id,
              emergencyResponseDetails.emergencyRequestId
            ),
          });

        if (emergencyRequestDetails && emergencyRequestDetails.location) {
          // Location is already number type from model
          const location = {
            latitude: emergencyRequestDetails.location.latitude,
            longitude: emergencyRequestDetails.location.longitude,
          };

          // Find the next best service provider
          const nextBestProvider = await getBestServiceProvider(
            location,
            emergencyRequestDetails.serviceType
          );

          if (nextBestProvider && nextBestProvider.id) {
            // Update the emergency response with the new provider
            const updatedResponse = await db
              .update(emergencyResponse)
              .set({
                serviceProviderId: nextBestProvider.id,
                statusUpdate: 'on_route' as const,
                updateDescription: `Reassigned to ${nextBestProvider.name} due to previous provider being ${status}`,
              })
              .where(eq(emergencyResponse.id, emergencyResponseId))
              .returning();

            // Update the new provider's status
            await db
              .update(serviceProvider)
              .set({
                serviceStatus: 'assigned',
              })
              .where(eq(serviceProvider.id, nextBestProvider.id));

            // Notify the new provider using notification service
            await notifyServiceProvider(nextBestProvider.id, {
              title: 'New Emergency Assignment',
              body: 'New emergency request assigned to you',
              data: {
                type: 'emergency',
                emergencyResponseId: updatedResponse[0]?.id,
              },
              priority: 'high',
            });

            // Notify the user about the reassignment
            await notifyUser(emergencyRequestDetails.userId, {
              title: 'Provider Reassigned',
              body: 'Service provider has been reassigned',
              data: {
                type: 'reassignment',
                emergencyResponseId: updatedResponse[0]?.id,
              },
            });
          } else {
            // If no other provider is available, update the emergency request status
            await db
              .update(emergencyRequest)
              .set({
                requestStatus: 'pending',
              })
              .where(
                eq(
                  emergencyRequest.id,
                  emergencyResponseDetails.emergencyRequestId
                )
              );

            // Notify the user that no provider is available
            await notifyUser(emergencyRequestDetails.userId, {
              title: 'No Provider Available',
              body: 'No service provider is currently available. Please try again later.',
              data: {
                type: 'no_provider',
              },
            });
          }
        }
      }
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
    throw new ApiError(
      400,
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
    throw new ApiError(400, 'Invalid service type');
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
      throw new ApiError(401, 'Unauthorized');
    }

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      console.log('Please provide old and new password');
      throw new ApiError(400, 'Please provide old and new password');
    }

    if (!loggedInProvider || !loggedInProvider.id) {
      console.log('Unauthorized');
      throw new ApiError(401, 'Unauthorized');
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
      throw new ApiError(401, 'Unauthorized');
    }

    const isPasswordValid = await bcrypt.compare(
      oldPassword,
      existingProvider.password
    );

    if (!isPasswordValid) {
      console.log('Invalid credentials');
      throw new ApiError(400, 'Invalid credentials');
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
      throw new ApiError(500, 'Failed to update user');
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
      throw new ApiError(401, 'Unauthorized');
    }

    const { currentLocation } = req.body;

    if (
      !currentLocation ||
      !currentLocation.latitude ||
      !currentLocation.longitude
    ) {
      throw new ApiError(
        400,
        'Invalid location data. Provide latitude and longitude'
      );
    }

    const { latitude, longitude } = currentLocation;

    // Validate coordinates
    if (
      typeof latitude !== 'number' ||
      typeof longitude !== 'number' ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      throw new ApiError(400, 'Invalid coordinates');
    }

    // Create PostGIS POINT geometry string
    const locationPoint = `POINT(${longitude} ${latitude})`;

    // Compute H3 index for this location (resolution 8)
    const H3_RESOLUTION = 8;
    const h3Index = latLngToCell(latitude, longitude, H3_RESOLUTION);
    const h3IndexBigInt = BigInt(`0x${h3Index}`);

    const [updatedProvider] = await db
      .update(serviceProvider)
      .set({
        currentLocation: {
          latitude: latitude.toString(),
          longitude: longitude.toString(),
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
      throw new ApiError(500, 'Failed to update location');
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
      throw new ApiError(401, 'Unauthorized');
    }

    // Get the uploaded files from multer
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (!files?.panCard?.[0] || !files?.citizenship?.[0]) {
      throw new ApiError(
        400,
        'Both PAN card and citizenship documents are required'
      );
    }

    const panCardUrl = (files.panCard[0] as any).path;
    const citizenshipUrl = (files.citizenship[0] as any).path;

    // Update provider with document URLs and set status to pending
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
      throw new ApiError(500, 'Failed to upload documents');
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

const getDocumentStatus = asyncHandler(async (req: Request, res: Response) => {
  const loggedInProvider = req.user;

  if (!loggedInProvider || !loggedInProvider.id) {
    throw new ApiError(401, 'Unauthorized');
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
    throw new ApiError(404, 'Service provider not found');
  }

  res.status(200).json(
    new ApiResponse(200, 'Document status retrieved', {
      documentStatus: provider.documentStatus,
      rejectionReason: provider.rejectionReason,
      verifiedAt: provider.verifiedAt,
    })
  );
});

const getPendingVerifications = asyncHandler(
  async (req: Request, res: Response) => {
    const loggedInOrg = req.user;

    if (!loggedInOrg || !loggedInOrg.id) {
      throw new ApiError(401, 'Unauthorized');
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
    const { providerId } = req.params;

    if (!loggedInOrg || !loggedInOrg.id) {
      throw new ApiError(401, 'Unauthorized');
    }

    if (!providerId) {
      throw new ApiError(400, 'Provider ID is required');
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
      throw new ApiError(
        404,
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
    const { providerId } = req.params;

    if (!loggedInOrg || !loggedInOrg.id) {
      throw new ApiError(401, 'Unauthorized');
    }

    if (!providerId) {
      throw new ApiError(400, 'Provider ID is required');
    }

    const parsedBody = verifyDocumentsSchema.safeParse(req.body);
    if (!parsedBody.success) {
      throw ApiError.validationError(parsedBody.error);
    }

    const { action, rejectionReason } = parsedBody.data;

    // Validate rejection reason is provided when rejecting
    if (action === 'reject' && !rejectionReason) {
      throw new ApiError(
        400,
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
      throw new ApiError(
        404,
        'Service provider not found or does not belong to your organization'
      );
    }

    if (existingProvider.documentStatus !== 'pending') {
      throw new ApiError(400, 'Documents are not pending verification');
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
      throw new ApiError(500, 'Failed to update document status');
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

export {
  registerServiceProvider,
  loginServiceProvider,
  logoutServiceProvider,
  verifyServiceProvider,
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
  getDocumentStatus,
  getPendingVerifications,
  getProviderDocuments,
  verifyProviderDocuments,
};
