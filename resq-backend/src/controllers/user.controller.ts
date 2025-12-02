import bcrypt from "bcryptjs";
import { eq, or } from "drizzle-orm";
import type { Request, Response } from "express";

import { adminEmails } from "@/constants";
import db from "@/db";
import { type TUser, loginUserSchema, newUserSchema, user } from "@/models";
import { capitalizeFirstLetter } from "@/utils";
import ApiError from "@/utils/api/ApiError";
import ApiResponse from "@/utils/api/ApiResponse";
import { asyncHandler } from "@/utils/api/asyncHandler";
import { sendOTP } from "@/utils/services/email";
import { generateJWT } from "@/utils/tokens/jwtTokens";

const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const { name, phoneNumber, age, email, password, primaryAddress, role } =
    req.body;

  const parsedValues = newUserSchema.safeParse({
    name,
    phoneNumber,
    age,
    email,
    password,
    primaryAddress,
  });

  if (role && role == "admin" && !adminEmails.includes(email)) {
    console.log("Admin email not authorized");
    throw new ApiError(401, "Admin email not authorized");
  }

  if (phoneNumber && /^[0-9]{10}$/.exec(phoneNumber) === null) {
    console.log("Invalid phone number");
    throw new ApiError(400, "Invalid phone number");
  }

  if (!parsedValues.success) {
    const validationError = new ApiError(
      400,
      "Error validating data",
      parsedValues.error.issues.map(
        (issue) => `${issue.path.join(".")} : ${issue.message}`,
      ),
    );
    console.log("Validation error", validationError);
    return res.status(400).json(validationError);
  }

  const existingUser = await db.query.user.findFirst({
    where: or(eq(user.phoneNumber, phoneNumber), eq(user.email, email)),
  });

  if (existingUser) {
    console.log("User with this email or phone number already exists");
    throw new ApiError(
      400,
      "User with this email or phone number already exists",
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await db
    .insert(user)
    .values({ ...parsedValues.data, password: hashedPassword })
    .returning({
      name: user.name,
      age: user.age,
      phoneNumber: user.phoneNumber,
      email: user.email,
      primaryAddress: user.primaryAddress,
    });

  if (!newUser) {
    console.log("Error registering user. Please try again");
    throw new ApiError(400, "Error registering user. Please try again");
  }

  res.status(201).json(
    new ApiResponse(201, "User registered successfully", {
      user: newUser[0],
    }),
  );
});

const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { phoneNumber, email, password } = req.body;
  console.log(req.body);

  // TODO: check the validation schema
  const parsedValues = loginUserSchema.safeParse(req.body);

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

  const existingUser = await db.query.user.findFirst({
    where: or(eq(user.phoneNumber, phoneNumber), eq(user.email, email)),
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
    console.log("User not found");
    throw new ApiError(400, "User not found");
  }

  const isPasswordValid = await bcrypt.compare(password, existingUser.password);

  if (!isPasswordValid) {
    console.log("Invalid credentials");
    throw new ApiError(400, "Invalid credentials");
  }

  if (!existingUser.isVerified) {
    const otpToken = await sendOTP(existingUser.email);

    if (!otpToken) {
      console.log("Error Sending OTP token. Please try again");
      throw new ApiError(300, "Error Sending OTP token. Please try again");
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
      console.log("Error Updating user. Please try again");
      throw new ApiError(400, "Error Updating user. Please try again");
    }

    console.log("OTP sent to user for verification", {
      userId: existingUser.id,
      otpToken,
    });

    return res.status(200).json(
      new ApiResponse(200, "OTP sent to user for verification", {
        userId: existingUser.id,
        otpToken,
      }),
    );
  }

  const token = generateJWT(existingUser);
  const loggedInUser: Partial<TUser> = JSON.parse(JSON.stringify(existingUser));
  delete loggedInUser.password;

  res
    .status(200)
    .cookie("token", token)
    .json(
      new ApiResponse(
        200,
        `${capitalizeFirstLetter(
          loggedInUser.role?.toString() ?? "user",
        )} logged in successfully`,
        {
          user: loggedInUser,
          token,
        },
      ),
    );
});

const logoutUser = asyncHandler(async (req: Request, res: Response) => {
  const loggedInUser = req.user;

  if (!loggedInUser || !loggedInUser.id) {
    console.log("Unauthorized");
    throw new ApiError(401, "Unauthorized");
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
    console.log("Unauthorized User");
    throw new ApiError(401, "Unauthorized User");
  }

  res
    .status(200)
    .clearCookie("token")
    .json(
      new ApiResponse(200, "User logged out successfully", {
        user: existingUser,
      }),
    );
});

const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const loggedInUser = req.user;

  if (!loggedInUser || !loggedInUser.id) {
    console.log("Unauthorized");
    throw new ApiError(401, "Unauthorized");
  }

  const existingUser = await db.query.user.findFirst({
    where: eq(user.id, loggedInUser.id),
  });

  if (!existingUser) {
    console.log("Unauthorized");
    throw new ApiError(401, "Unauthorized");
  }
  const updateData = req.body;

  if (Object.keys(updateData).length === 0) {
    console.log("No data to update");
    throw new ApiError(400, "No data to update");
  }

  const invalidKeys = Object.keys(updateData).filter(
    (key) => !Object.keys(user).includes(key),
  );

  if (invalidKeys.length > 0) {
    console.log(`Invalid data to update. Invalid keys: ${invalidKeys}`);
    throw new ApiError(
      400,
      `Invalid data to update. Invalid keys: ${invalidKeys}`,
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
    console.log("Failed to update user");
    throw new ApiError(500, "Failed to update user");
  }

  res.status(200).json(
    new ApiResponse(200, "User updated successfully", {
      user: updatedUser[0],
    }),
  );
});

const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const loggedInUser = req.user;

  if (!loggedInUser || !loggedInUser.id) {
    console.log("Unauthorized");
    throw new ApiError(401, "Unauthorized");
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
    console.log("User not found");
    throw new ApiError(404, "User not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, "User found", { user: existingUser }));
});

const getUser = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const loggedInUser = req.user;

  if (!loggedInUser || loggedInUser.role !== "admin") {
    console.log("User not authorized");
    throw new ApiError(401, "User not authorized");
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
    console.log("User not found");
    throw new ApiError(404, "User not found");
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, "User fetched successfully", { user: existingUser }),
    );
});

const verifyUser = asyncHandler(async (req: Request, res: Response) => {
  const { otpToken, userId } = req.body;

  if (!otpToken) {
    console.log("Please provide OTP");
    throw new ApiError(400, "Please provide OTP");
  }

  if (!userId) {
    console.log("Please provide user ID");
    throw new ApiError(400, "Please provide user ID");
  }

  const existingUser = await db.query.user.findFirst({
    where: eq(user.id, userId),
    columns: {
      password: false,
    },
  });

  if (!existingUser) {
    console.log("User not found");
    throw new ApiError(400, "User not found");
  }

  if (!user.verificationToken || !user.tokenExpiry) {
    console.log("Verification token not found");
    throw new ApiError(400, "Verification token not found");
  }

  if (!existingUser.tokenExpiry) {
    console.log(
      "Verification token expiry not registered. Please verify again.",
    );
    throw new ApiError(
      400,
      "Verification token expiry not registered. Please verify again.",
    );
  }

  const tokenExpiry = new Date(existingUser.tokenExpiry);
  const currentTime = new Date(Date.now()).toISOString();

  if (new Date(currentTime) < tokenExpiry) {
    console.log("Verification token expired");
    throw new ApiError(400, "Verification token expired");
  }

  if (otpToken !== existingUser.verificationToken) {
    console.log("Invalid OTP");
    throw new ApiError(400, "Invalid OTP");
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

  if (!updatedUser.length || !updatedUser[0].isVerified) {
    console.log("Failed to verify user");
    throw new ApiError(500, "Failed to verify user");
  }

  res.status(200).json(
    new ApiResponse(200, "User verified successfully", {
      user: updatedUser[0],
    }),
  );
});

const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email, phoneNumber } = req.body;

  if (!email && !phoneNumber) {
    console.log("Please provide email or phone number");
    throw new ApiError(400, "Please provide email or phone number");
  }

  const existingUser = await db.query.user.findFirst({
    where: or(eq(user.email, email), eq(user.phoneNumber, phoneNumber)),
  });

  if (!existingUser) {
    console.log("User not found with given email or phone");
    throw new ApiError(404, "User not found with given email or phone");
  }

  const otpToken = await sendOTP(String(existingUser.email));

  if (!otpToken) {
    console.log("Error Sending OTP token. Please try again");
    throw new ApiError(300, "Error Sending OTP token. Please try again");
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
    console.log("Error setting verfication token");
    throw new ApiError(400, "Error setting verfication token");
  }

  res.status(200).json(
    new ApiResponse(200, "OTP sent to user for verification", {
      userId: existingUser.id,
      otpToken,
    }),
  );
});

const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  // TODO: Need to refactor this
  const { otpToken, userId, password } = req.body;

  if (!otpToken) {
    console.log("Please provide OTP");
    throw new ApiError(400, "Please provide OTP");
  }

  if (!userId) {
    console.log("Please provide user ID");
    throw new ApiError(400, "Please provide user ID");
  }

  if (!password) {
    console.log("Please provide new password");
    throw new ApiError(400, "Please provide new password");
  }

  const existingUser = await db.query.user.findFirst({
    where: eq(user.id, userId),
  });

  if (!existingUser) {
    console.log("User not found");
    throw new ApiError(400, "User not found");
  }

  if (
    !existingUser.resetPasswordToken ||
    !existingUser.resetPasswordTokenExpiry
  ) {
    console.log("Reset Password token not found");
    throw new ApiError(400, "Reset Password token not found");
  }

  if (!existingUser.resetPasswordTokenExpiry) {
    console.log(
      "Verification token expiry not registered. Please verify again.",
    );
    throw new ApiError(
      400,
      "Verification token expiry not registered. Please verify again.",
    );
  }

  const tokenExpiry = new Date(existingUser.resetPasswordTokenExpiry);
  const currentTime = new Date(Date.now()).toISOString();

  if (new Date(currentTime) < tokenExpiry) {
    console.log("Verification token expired");
    throw new ApiError(400, "Verification token expired");
  }

  if (otpToken !== existingUser.resetPasswordToken) {
    console.log("Invalid OTP");
    throw new ApiError(400, "Invalid OTP");
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
    console.log("Failed to update user");
    throw new ApiError(500, "Failed to update user");
  }

  res.status(200).json(
    new ApiResponse(200, "Password reset successfully", {
      user: updatedUser[0],
    }),
  );
});

const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const loggedInUser = req.user;

  if (!loggedInUser || !loggedInUser.id) {
    console.log("Unauthorized");
    throw new ApiError(401, "Unauthorized");
  }

  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    console.log("Please provide old and new password");
    throw new ApiError(400, "Please provide old and new password");
  }

  if (!loggedInUser || !loggedInUser.id) {
    console.log("Unauthorized");
    throw new ApiError(401, "Unauthorized");
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
    console.log("Unauthorized");
    throw new ApiError(401, "Unauthorized");
  }

  const isPasswordValid = await bcrypt.compare(
    oldPassword,
    existingUser.password,
  );

  if (!isPasswordValid) {
    console.log("Invalid credentials");
    throw new ApiError(400, "Invalid credentials");
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
    throw new ApiError(500, "Failed to update user");
  }

  res.status(200).json(
    new ApiResponse(200, "Password updated successfully", {
      user: updatedUser[0],
    }),
  );
});

export const updatePushToken = asyncHandler(
  async (req: Request, res: Response) => {
    const { pushToken } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(401, "Unauthorized");
    }

    const updatedUser = await db
      .update(user)
      .set({ pushToken })
      .where(eq(user.id, userId))
      .returning();

    if (!updatedUser) {
      throw new ApiError(404, "User not found");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, "Push token updated successfully", updatedUser[0]),
      );
  },
);

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
