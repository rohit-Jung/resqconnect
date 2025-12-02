import jwt, { type JwtPayload } from "jsonwebtoken";

import { envConfig } from "@/config/env.config";
import type { TServiceProvider, TUser } from "@/models";

export interface IJWTToken extends JwtPayload {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  role: string;
  iat?: number;
  exp?: number;
}

const generateJWT = (user: Partial<TUser> | Partial<TServiceProvider>) => {
  if (!envConfig.jwt_secret) {
    throw new Error("JWT secret not found in environment variables");
  }

  const token = jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: (user as TUser).role ? (user as TUser).role : "service_provider",
    },
    envConfig.jwt_secret!,
    {
      expiresIn: envConfig.jwt_expiry,
    },
  );

  return token;
};

const verifyJWT = (token: string): IJWTToken => {
  if (!envConfig.jwt_secret) {
    throw new Error("JWT secret not found in environment variables");
  }

  const decoded = jwt.verify(token, envConfig.jwt_secret!) as IJWTToken;
  return decoded;
};

export { generateJWT, verifyJWT };
