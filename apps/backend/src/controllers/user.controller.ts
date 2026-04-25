import { type TUser, user } from '@repo/db/schemas';

import { HttpStatusCode } from 'axios';
import bcrypt from 'bcryptjs';
import { eq, or, sql } from 'drizzle-orm';
import type { Request, Response } from 'express';
import { latLngToCell } from 'h3-js';

import {
  DEFAULT_LATITUDE,
  DEFAULT_LONGITUDE,
  H3_RESOLUTION,
  UserRoles,
  adminEmails,
  phoneRegex,
} from '@/constants';
import db from '@/db';
import {
  clearLoginFailures,
  isLoginLocked,
  recordLoginFailure,
} from '@/services/failed-login-lockout.service';
import { capitalizeFirstLetter } from '@/utils';
import ApiError from '@/utils/api/ApiError';
import ApiResponse from '@/utils/api/ApiResponse';
import { asyncHandler } from '@/utils/api/asyncHandler';
import { sendOTP } from '@/utils/services/email';
import { generateJWT } from '@/utils/tokens/jwtTokens';

const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const { phoneNumber, email, password, role, latitude, longitude } = req.body;

  // Validate required fields first so tests (and mocks) don't hit bcrypt/db.
  if (!req.body?.name || !email || !password || !phoneNumber) {
    throw new ApiError(HttpStatusCode.BadRequest, 'Missing required fields');
  }

  if (typeof email !== 'string' || !email.includes('@')) {
    throw new ApiError(HttpStatusCode.BadRequest, 'Invalid email format');
  }

  if (role && role == UserRoles.ADMIN && !adminEmails.includes(email)) {
    throw new ApiError(
      HttpStatusCode.Unauthorized,
      'Admin email not authorized'
    );
  }

  if (phoneNumber && phoneRegex.exec(phoneNumber.toString()) === null) {
    throw new ApiError(HttpStatusCode.BadRequest, 'Invalid phone number');
  }

  const existingUser = await db.query.user.findFirst({
    where: or(eq(user.phoneNumber, phoneNumber), eq(user.email, email)),
  });

  if (existingUser) {
    console.log('User with this email or phone number already exists');
    throw new ApiError(
      400,
      'User with this email or phone number already exists'
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const userLatitude = latitude ?? DEFAULT_LATITUDE;
  const userLongitude = longitude ?? DEFAULT_LONGITUDE;

  const h3Index = latLngToCell(userLatitude, userLongitude, H3_RESOLUTION);
  const h3IndexBigInt = BigInt(`0x${h3Index}`);

  const locationPoint = `POINT(${userLongitude} ${userLatitude})`;

  const {
    latitude: _lat,
    longitude: _lng,
    ...userDataWithoutCoords
  } = req.body;

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

  console.log('User registered');
  res.status(201).json(
    new ApiResponse(201, 'User registered successfully', {
      user: newUser[0],
    })
  );
});

const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(
      HttpStatusCode.BadRequest,
      'Email and password are required'
    );
  }

  if (typeof email !== 'string' || !email.includes('@')) {
    throw new ApiError(HttpStatusCode.BadRequest, 'Invalid email format');
  }

  if (await isLoginLocked(email)) {
    throw new ApiError(429, 'Too many failed login attempts. Try again later.');
  }

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
    await recordLoginFailure(email);
    throw new ApiError(400, 'User not found');
  }

  const isPasswordValid = await bcrypt.compare(password, existingUser.password);

  if (!isPasswordValid) {
    console.log('Invalid credentials');
    await recordLoginFailure(email);
    throw new ApiError(400, 'Invalid credentials');
  }

  await clearLoginFailures(email);

  if (!existingUser.isVerified) {
    const otpToken = await sendOTP(existingUser.email);

    if (!otpToken) {
      console.log('Error Sending OTP token. Please try again');
      throw new ApiError(300, 'Error Sending OTP token. Please try again');
    }

    const tokenExpiry = new Date(Date.now() + 10 * 60 * 1000);

    console.log('Setting token expiry:', {
      tokenExpiry: tokenExpiry.toISOString(),
      currentTime: new Date().toISOString(),
    });

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

  const token = generateJWT({ ...existingUser, kind: 'user' });
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

const resendUserVerificationOTP = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body as { email: string };

    const existingUser = await db.query.user.findFirst({
      where: eq(user.email, email),
      columns: {
        id: true,
        email: true,
        isVerified: true,
      },
    });

    // Avoid leaking whether an email exists.
    if (!existingUser) {
      return res
        .status(200)
        .json(new ApiResponse(200, 'OTP sent if account exists', {}));
    }

    if (existingUser.isVerified) {
      return res
        .status(200)
        .json(new ApiResponse(200, 'Account already verified', {}));
    }

    const otpToken = await sendOTP(existingUser.email);
    if (!otpToken) {
      throw new ApiError(500, 'Error sending OTP token. Please try again');
    }

    const tokenExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await db
      .update(user)
      .set({
        verificationToken: otpToken,
        tokenExpiry: tokenExpiry.toISOString(),
      })
      .where(eq(user.id, existingUser.id));

    return res.status(200).json(
      new ApiResponse(200, 'OTP sent to user for verification', {
        userId: existingUser.id,
      })
    );
  }
);

const logoutUser = asyncHandler(async (req: Request, res: Response) => {
  const loggedInUser = req.user;

  if (!loggedInUser || !loggedInUser.id) {
    console.log('Unauthorized');
    throw new ApiError(401, 'Unauthorized');
  }

  res
    .status(200)
    .clearCookie('token')
    .json(
      new ApiResponse(200, 'User logged out successfully', {
        user: loggedInUser,
      })
    );
});

const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const loggedInUser = req.user;

  if (!loggedInUser || !loggedInUser.id) {
    console.log('Unauthorized');
    throw new ApiError(401, 'Unauthorized');
  }

  const updateData = req.body;
  if (!updateData || Object.keys(updateData).length === 0) {
    console.log('No data to update');
    throw new ApiError(400, 'No data to update');
  }

  const existingUser = await db.query.user.findFirst({
    where: eq(user.id, loggedInUser.id),
  });

  if (!existingUser) {
    console.log('Unauthorized');
    throw new ApiError(401, 'Unauthorized');
  }
  const invalidKeys = Object.keys(updateData).filter(
    key => !Object.keys(user).includes(key)
  );

  if (invalidKeys.length > 0) {
    console.log(`Invalid data to update. Invalid keys: ${invalidKeys}`);
    throw new ApiError(
      400,
      `Invalid data to update. Invalid keys: ${invalidKeys}`
    );
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

  res
    .status(200)
    .json(new ApiResponse(200, 'User found', { user: existingUser }));
});

const getUser = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.params.userId as string;
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

  res
    .status(200)
    .json(
      new ApiResponse(200, 'User fetched successfully', { user: existingUser })
    );
});

const verifyUser = asyncHandler(async (req: Request, res: Response) => {
  const { otpToken, userId } = req.body;

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
    .update(user)
    .set({
      isVerified: true,
      verificationToken: null,
      tokenExpiry: null,
    })
    .where(eq(user.id, userId))
    .returning({
      id: user.id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      isVerified: user.isVerified,
    });

  if (
    !Array.isArray(updatedUser) ||
    (updatedUser[0] && !updatedUser[0].isVerified)
  ) {
    console.log('Failed to verify user');
    throw new ApiError(500, 'Failed to verify user');
  }

  const verifiedUser = updatedUser[0];
  const token = generateJWT({ ...verifiedUser, kind: 'user' });

  res
    .status(200)
    .cookie('token', token)
    .json(
      new ApiResponse(200, 'User verified successfully', {
        user: verifiedUser,
        token,
      })
    );
});

const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email, phoneNumber } = req.body;

  if (!email && !phoneNumber) {
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
  const { otpToken, userId, password } = req.body;

  const existingUser = await db.query.user.findFirst({
    where: eq(user.id, userId),
  });

  if (!existingUser) {
    console.log('User not found');
    throw new ApiError(400, 'User not found');
  }

  if (
    !existingUser.resetPasswordToken ||
    !existingUser.resetPasswordTokenExpiry
  ) {
    console.log('Reset Password token not found');
    throw new ApiError(400, 'Reset Password token not found');
  }

  if (!existingUser.resetPasswordTokenExpiry) {
    console.log(
      'Verification token expiry not registered. Please verify again.'
    );
    throw new ApiError(
      400,
      'Verification token expiry not registered. Please verify again.'
    );
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

  if (!oldPassword) {
    throw new ApiError(400, 'Old password is required');
  }

  if (!newPassword) {
    throw new ApiError(400, 'New password is required');
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

  const isPasswordValid = await bcrypt.compare(
    oldPassword,
    existingUser.password
  );

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

export const updatePushToken = asyncHandler(
  async (req: Request, res: Response) => {
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
      .json(
        new ApiResponse(200, 'Push token updated successfully', updatedUser[0])
      );
  }
);

export const updateEmergencySettings = asyncHandler(
  async (req: Request, res: Response) => {
    const { notifyEmergencyContacts, emergencyNotificationMethod } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(401, 'Unauthorized');
    }

    const updateData: Record<string, unknown> = {};
    if (typeof notifyEmergencyContacts === 'boolean') {
      updateData.notifyEmergencyContacts = notifyEmergencyContacts;
    }
    if (emergencyNotificationMethod) {
      const valid = ['sms', 'push', 'both'];
      if (!valid.includes(emergencyNotificationMethod)) {
        throw new ApiError(400, 'Invalid notification method');
      }
      updateData.emergencyNotificationMethod = emergencyNotificationMethod;
    }

    if (Object.keys(updateData).length === 0) {
      throw new ApiError(400, 'No valid settings to update');
    }

    const updatedUser = await db
      .update(user)
      .set(updateData)
      .where(eq(user.id, userId))
      .returning({
        id: user.id,
        notifyEmergencyContacts: user.notifyEmergencyContacts,
        emergencyNotificationMethod: user.emergencyNotificationMethod,
      });

    if (!updatedUser.length) {
      throw new ApiError(500, 'Failed to update settings');
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          'Emergency notification settings updated',
          updatedUser[0]
        )
      );
  }
);

/**
 * Get emergency contact notification settings
 */
export const getEmergencySettings = asyncHandler(
  async (req: Request, res: Response) => {
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
      .json(
        new ApiResponse(
          200,
          'Emergency notification settings retrieved',
          userSettings
        )
      );
  }
);

const userController = {
  registerUser,
  loginUser,
  resendUserVerificationOTP,
  logoutUser,
  updateUser,
  getUser,
  verifyUser,
  getProfile,
  forgotPassword,
  resetPassword,
  changePassword,
  updatePushToken,
  updateEmergencySettings,
  getEmergencySettings,
} as const;

export default userController;

export {
  registerUser,
  loginUser,
  resendUserVerificationOTP,
  logoutUser,
  updateUser,
  getUser,
  verifyUser,
  getProfile,
  forgotPassword,
  resetPassword,
  changePassword,
};
