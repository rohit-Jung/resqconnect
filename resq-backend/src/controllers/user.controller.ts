import { HttpStatusCode } from 'axios';
import bcrypt from 'bcryptjs';
import { eq, or, sql } from 'drizzle-orm';
import type { Request, Response } from 'express';
import { latLngToCell } from 'h3-js';

import { UserRoles, adminEmails, phoneRegex } from '@/constants';
import db from '@/db';
import { type TUser, loginUserSchema, newUserSchema, user } from '@/models';
import { capitalizeFirstLetter } from '@/utils';
import ApiError from '@/utils/api/ApiError';
import ApiResponse from '@/utils/api/ApiResponse';
import { asyncHandler } from '@/utils/api/asyncHandler';
import { sendOTP } from '@/utils/services/email';
import { generateJWT } from '@/utils/tokens/jwtTokens';

// Default location (Kathmandu, Nepal) if user doesn't provide location
const DEFAULT_LATITUDE = 27.7172;
const DEFAULT_LONGITUDE = 85.324;
const H3_RESOLUTION = 8; // Resolution 7-8 is best for city-wide emergency dispatch

const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const parsedValues = newUserSchema.safeParse(req.body);
  if (!parsedValues.success) {
    return res.status(HttpStatusCode.BadRequest).json(ApiError.validationError(parsedValues.error));
  }

  const { phoneNumber, email, password, role, latitude, longitude } = parsedValues.data;
  if (role && role == UserRoles.ADMIN && !adminEmails.includes(email)) {
    throw new ApiError(HttpStatusCode.Unauthorized, 'Admin email not authorized');
  }

  if (phoneNumber && phoneRegex.exec(phoneNumber.toString()) === null) {
    throw new ApiError(HttpStatusCode.BadRequest, 'Invalid phone number');
  }

  const existingUser = await db.query.user.findFirst({
    where: or(eq(user.phoneNumber, phoneNumber), eq(user.email, email)),
  });

  if (existingUser) {
    console.log('User with this email or phone number already exists');
    throw new ApiError(400, 'User with this email or phone number already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Use provided location or default to Kathmandu
  const userLatitude = latitude ?? DEFAULT_LATITUDE;
  const userLongitude = longitude ?? DEFAULT_LONGITUDE;

  // Convert latitude/longitude to H3 index for fast spatial lookups
  const h3Index = latLngToCell(userLatitude, userLongitude, H3_RESOLUTION);
  // Convert H3 index string to BigInt for database storage
  const h3IndexBigInt = BigInt(`0x${h3Index}`);

  // Create PostGIS POINT geometry string for exact location storage
  // Format: POINT(longitude latitude) - Note: PostGIS uses lng,lat order
  const locationPoint = `POINT(${userLongitude} ${userLatitude})`;

  // Remove latitude/longitude from data before insert (they're not in the table schema)
  const { latitude: _lat, longitude: _lng, ...userDataWithoutCoords } = parsedValues.data;

  const newUser = await db
    .insert(user)
    .values({
      ...userDataWithoutCoords,
      password: hashedPassword,
      h3Index: h3IndexBigInt,
      location: sql`ST_SetSRID(ST_GeomFromText(${locationPoint}), 4326)`,
      currentLocation: {
        latitude: userLatitude.toString(),
        longitude: userLongitude.toString(),
      },
    })
    .returning({
      name: user.name,
      age: user.age,
      phoneNumber: user.phoneNumber,
      email: user.email,
      primaryAddress: user.primaryAddress,
    });

  if (!newUser) {
    console.log('Error registering user. Please try again');
    throw new ApiError(400, 'Error registering user. Please try again');
  }

  res.status(201).json(
    new ApiResponse(201, 'User registered successfully', {
      user: newUser[0],
    })
  );
});

const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const parsedValues = loginUserSchema.safeParse(req.body);

  if (!parsedValues.success) {
    const validationError = new ApiError(
      400,
      'Error validating data',
      parsedValues.error.issues.map(issue => `${issue.path.join('.')} : ${issue.message}`)
    );

    return res.status(400).json(validationError);
  }

  const { email, password } = parsedValues.data;
  const existingUser = await db.query.user.findFirst({
    where: eq(user.email, email),
    columns: {
      id: true,
      name: true,
      phoneNumber: true,
      email: true,
      age: true,
      primaryAddress: true,
      role: true,
      password: true,
      isVerified: true,
    },
  });

  if (!existingUser) {
    console.log('User not found');
    throw new ApiError(400, 'User not found');
  }

  const isPasswordValid = await bcrypt.compare(password, existingUser.password);

  if (!isPasswordValid) {
    console.log('Invalid credentials');
    throw new ApiError(400, 'Invalid credentials');
  }

  if (!existingUser.isVerified) {
    const otpToken = await sendOTP(existingUser.email);

    if (!otpToken) {
      console.log('Error Sending OTP token. Please try again');
      throw new ApiError(300, 'Error Sending OTP token. Please try again');
    }

    const tokenExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const updatedUser = await db
      .update(user)
      .set({
        verificationToken: otpToken,
        tokenExpiry: tokenExpiry.toISOString(),
      })
      .where(eq(user.id, existingUser.id));

    if (!updatedUser) {
      console.log('Error Updating user. Please try again');
      throw new ApiError(400, 'Error Updating user. Please try again');
    }

    console.log('OTP sent to user for verification', {
      userId: existingUser.id,
      otpToken,
    });

    return res.status(200).json(
      new ApiResponse(200, 'OTP sent to user for verification', {
        userId: existingUser.id,
        otpToken,
      })
    );
  }

  const token = generateJWT(existingUser);
  const loggedInUser: Partial<TUser> = JSON.parse(JSON.stringify(existingUser));
  delete loggedInUser.password;

  res
    .status(200)
    .cookie('token', token)
    .json(
      new ApiResponse(
        200,
        `${capitalizeFirstLetter(loggedInUser.role?.toString() ?? 'user')} logged in successfully`,
        {
          user: loggedInUser,
          token,
        }
      )
    );
});

const logoutUser = asyncHandler(async (req: Request, res: Response) => {
  const loggedInUser = req.user;

  if (!loggedInUser || !loggedInUser.id) {
    console.log('Unauthorized');
    throw new ApiError(401, 'Unauthorized');
  }

  console.log(loggedInUser);

  const existingUser = await db.query.user.findFirst({
    where: eq(user.id, loggedInUser.id),
    columns: {
      id: true,
      name: true,
      phoneNumber: true,
      email: true,
      age: true,
      primaryAddress: true,
    },
  });

  if (!existingUser) {
    console.log('Unauthorized User');
    throw new ApiError(401, 'Unauthorized User');
  }

  res
    .status(200)
    .clearCookie('token')
    .json(
      new ApiResponse(200, 'User logged out successfully', {
        user: existingUser,
      })
    );
});

const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const loggedInUser = req.user;

  if (!loggedInUser || !loggedInUser.id) {
    console.log('Unauthorized');
    throw new ApiError(401, 'Unauthorized');
  }

  const existingUser = await db.query.user.findFirst({
    where: eq(user.id, loggedInUser.id),
  });

  if (!existingUser) {
    console.log('Unauthorized');
    throw new ApiError(401, 'Unauthorized');
  }
  const updateData = req.body;

  if (Object.keys(updateData).length === 0) {
    console.log('No data to update');
    throw new ApiError(400, 'No data to update');
  }

  const invalidKeys = Object.keys(updateData).filter(key => !Object.keys(user).includes(key));

  if (invalidKeys.length > 0) {
    console.log(`Invalid data to update. Invalid keys: ${invalidKeys}`);
    throw new ApiError(400, `Invalid data to update. Invalid keys: ${invalidKeys}`);
  }

  const updatedUser = await db
    .update(user)
    .set(updateData)
    .where(eq(user.id, loggedInUser.id))
    .returning({
      id: user.id,
      name: user.name,
      phoneNumber: user.phoneNumber,
      age: user.age,
      email: user.email,
      primaryAddress: user.primaryAddress,
    });

  if (!updatedUser.length) {
    console.log('Failed to update user');
    throw new ApiError(500, 'Failed to update user');
  }

  res.status(200).json(
    new ApiResponse(200, 'User updated successfully', {
      user: updatedUser[0],
    })
  );
});

const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const loggedInUser = req.user;

  if (!loggedInUser || !loggedInUser.id) {
    console.log('Unauthorized');
    throw new ApiError(401, 'Unauthorized');
  }

  const existingUser = await db.query.user.findFirst({
    where: eq(user.id, loggedInUser.id),
    columns: {
      password: false,
      verificationToken: false,
      tokenExpiry: false,
    },
  });

  if (!existingUser) {
    console.log('User not found');
    throw new ApiError(404, 'User not found');
  }

  res.status(200).json(new ApiResponse(200, 'User found', { user: existingUser }));
});

const getUser = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  if (!userId) {
    return new ApiResponse(401, 'User Id not passed', {});
  }

  const loggedInUser = req.user;

  if (!loggedInUser || loggedInUser.role !== 'admin') {
    console.log('User not authorized');
    throw new ApiError(401, 'User not authorized');
  }

  const existingUser = await db.query.user.findFirst({
    where: eq(user.id, userId),
    columns: {
      password: false,
      verificationToken: false,
      tokenExpiry: false,
    },
  });

  if (!existingUser) {
    console.log('User not found');
    throw new ApiError(404, 'User not found');
  }

  res.status(200).json(new ApiResponse(200, 'User fetched successfully', { user: existingUser }));
});

const verifyUser = asyncHandler(async (req: Request, res: Response) => {
  const { otpToken, userId } = req.body;

  if (!otpToken) {
    console.log('Please provide OTP');
    throw new ApiError(400, 'Please provide OTP');
  }

  if (!userId) {
    console.log('Please provide user ID');
    throw new ApiError(400, 'Please provide user ID');
  }

  const existingUser = await db.query.user.findFirst({
    where: eq(user.id, userId),
    columns: {
      password: false,
    },
  });

  if (!existingUser) {
    console.log('User not found');
    throw new ApiError(400, 'User not found');
  }

  if (!user.verificationToken || !user.tokenExpiry) {
    console.log('Verification token not found');
    throw new ApiError(400, 'Verification token not found');
  }

  if (!existingUser.tokenExpiry) {
    console.log('Verification token expiry not registered. Please verify again.');
    throw new ApiError(400, 'Verification token expiry not registered. Please verify again.');
  }

  const tokenExpiry = new Date(existingUser.tokenExpiry);
  const currentTime = new Date(Date.now()).toISOString();

  if (new Date(currentTime) < tokenExpiry) {
    console.log('Verification token expired');
    throw new ApiError(400, 'Verification token expired');
  }

  if (otpToken !== existingUser.verificationToken) {
    console.log('Invalid OTP');
    throw new ApiError(400, 'Invalid OTP');
  }

  const updatedUser = await db
    .update(user)
    .set({
      isVerified: true,
      verificationToken: null,
      tokenExpiry: null,
    })
    .returning({
      id: user.id,
      name: user.name,
      phoneNumber: user.phoneNumber,
      isVerified: user.isVerified,
    });

  if (!Array.isArray(updatedUser) || (updatedUser[0] && !updatedUser[0].isVerified)) {
    console.log('Failed to verify user');
    throw new ApiError(500, 'Failed to verify user');
  }

  res.status(200).json(
    new ApiResponse(200, 'User verified successfully', {
      user: updatedUser[0],
    })
  );
});

const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email, phoneNumber } = req.body;

  if (!email && !phoneNumber) {
    console.log('Please provide email or phone number');
    throw new ApiError(400, 'Please provide email or phone number');
  }

  const existingUser = await db.query.user.findFirst({
    where: or(eq(user.email, email), eq(user.phoneNumber, phoneNumber)),
  });

  if (!existingUser) {
    console.log('User not found with given email or phone');
    throw new ApiError(404, 'User not found with given email or phone');
  }

  const otpToken = await sendOTP(String(existingUser.email));

  if (!otpToken) {
    console.log('Error Sending OTP token. Please try again');
    throw new ApiError(300, 'Error Sending OTP token. Please try again');
  }

  const tokenExpiry = new Date(Date.now() + 10 * 60 * 1000);

  const updatedUser = await db
    .update(user)
    .set({
      resetPasswordToken: otpToken,
      resetPasswordTokenExpiry: tokenExpiry.toISOString(),
    })
    .where(eq(user.id, existingUser.id));

  if (!updatedUser) {
    console.log('Error setting verfication token');
    throw new ApiError(400, 'Error setting verfication token');
  }

  res.status(200).json(
    new ApiResponse(200, 'OTP sent to user for verification', {
      userId: existingUser.id,
      otpToken,
    })
  );
});

const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  // TODO: Need to refactor this
  const { otpToken, userId, password } = req.body;

  if (!otpToken) {
    console.log('Please provide OTP');
    throw new ApiError(400, 'Please provide OTP');
  }

  if (!userId) {
    console.log('Please provide user ID');
    throw new ApiError(400, 'Please provide user ID');
  }

  if (!password) {
    console.log('Please provide new password');
    throw new ApiError(400, 'Please provide new password');
  }

  const existingUser = await db.query.user.findFirst({
    where: eq(user.id, userId),
  });

  if (!existingUser) {
    console.log('User not found');
    throw new ApiError(400, 'User not found');
  }

  if (!existingUser.resetPasswordToken || !existingUser.resetPasswordTokenExpiry) {
    console.log('Reset Password token not found');
    throw new ApiError(400, 'Reset Password token not found');
  }

  if (!existingUser.resetPasswordTokenExpiry) {
    console.log('Verification token expiry not registered. Please verify again.');
    throw new ApiError(400, 'Verification token expiry not registered. Please verify again.');
  }

  const tokenExpiry = new Date(existingUser.resetPasswordTokenExpiry);
  const currentTime = new Date(Date.now()).toISOString();

  if (new Date(currentTime) < tokenExpiry) {
    console.log('Verification token expired');
    throw new ApiError(400, 'Verification token expired');
  }

  if (otpToken !== existingUser.resetPasswordToken) {
    console.log('Invalid OTP');
    throw new ApiError(400, 'Invalid OTP');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const updatedUser = await db
    .update(user)
    .set({
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordTokenExpiry: null,
    })
    .returning({
      id: user.id,
      name: user.name,
      phoneNumber: user.phoneNumber,
      email: user.email,
    });

  if (!updatedUser.length) {
    console.log('Failed to update user');
    throw new ApiError(500, 'Failed to update user');
  }

  res.status(200).json(
    new ApiResponse(200, 'Password reset successfully', {
      user: updatedUser[0],
    })
  );
});

const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const loggedInUser = req.user;

  if (!loggedInUser || !loggedInUser.id) {
    console.log('Unauthorized');
    throw new ApiError(401, 'Unauthorized');
  }

  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    console.log('Please provide old and new password');
    throw new ApiError(400, 'Please provide old and new password');
  }

  if (!loggedInUser || !loggedInUser.id) {
    console.log('Unauthorized');
    throw new ApiError(401, 'Unauthorized');
  }

  const existingUser = await db.query.user.findFirst({
    where: eq(user.id, loggedInUser.id),
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

  if (!existingUser) {
    console.log('Unauthorized');
    throw new ApiError(401, 'Unauthorized');
  }

  const isPasswordValid = await bcrypt.compare(oldPassword, existingUser.password);

  if (!isPasswordValid) {
    console.log('Invalid credentials');
    throw new ApiError(400, 'Invalid credentials');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const updatedUser = await db
    .update(user)
    .set({
      password: hashedPassword,
    })
    .where(eq(user.id, loggedInUser.id))
    .returning({
      id: user.id,
      name: user.name,
      phoneNumber: user.phoneNumber,
      email: user.email,
      age: user.age,
      primaryAddress: user.primaryAddress,
      isVerified: user.isVerified,
    });

  if (!updatedUser.length) {
    throw new ApiError(500, 'Failed to update user');
  }

  res.status(200).json(
    new ApiResponse(200, 'Password updated successfully', {
      user: updatedUser[0],
    })
  );
});

export const updatePushToken = asyncHandler(async (req: Request, res: Response) => {
  const { pushToken } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  const updatedUser = await db
    .update(user)
    .set({ pushToken })
    .where(eq(user.id, userId))
    .returning();

  if (!updatedUser) {
    throw new ApiError(404, 'User not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, 'Push token updated successfully', updatedUser[0]));
});

/**
 * Update emergency contact notification settings
 */
export const updateEmergencySettings = asyncHandler(async (req: Request, res: Response) => {
  const { notifyEmergencyContacts, emergencyNotificationMethod } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  // Validate notification method
  const validMethods = ['sms', 'push', 'both'];
  if (emergencyNotificationMethod && !validMethods.includes(emergencyNotificationMethod)) {
    throw new ApiError(
      400,
      `Invalid notification method. Must be one of: ${validMethods.join(', ')}`
    );
  }

  const updateData: Record<string, unknown> = {};
  if (typeof notifyEmergencyContacts === 'boolean') {
    updateData.notifyEmergencyContacts = notifyEmergencyContacts;
  }
  if (emergencyNotificationMethod) {
    updateData.emergencyNotificationMethod = emergencyNotificationMethod;
  }

  if (Object.keys(updateData).length === 0) {
    throw new ApiError(400, 'No valid settings to update');
  }

  const updatedUser = await db.update(user).set(updateData).where(eq(user.id, userId)).returning({
    id: user.id,
    notifyEmergencyContacts: user.notifyEmergencyContacts,
    emergencyNotificationMethod: user.emergencyNotificationMethod,
  });

  if (!updatedUser.length) {
    throw new ApiError(500, 'Failed to update settings');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, 'Emergency notification settings updated', updatedUser[0]));
});

/**
 * Get emergency contact notification settings
 */
export const getEmergencySettings = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  const userSettings = await db.query.user.findFirst({
    where: eq(user.id, userId),
    columns: {
      notifyEmergencyContacts: true,
      emergencyNotificationMethod: true,
    },
  });

  if (!userSettings) {
    throw new ApiError(404, 'User not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, 'Emergency notification settings retrieved', userSettings));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  updateUser,
  getUser,
  verifyUser,
  getProfile,
  forgotPassword,
  resetPassword,
  changePassword,
};
