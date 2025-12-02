import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
  JWT_EXPIRY: z.coerce.number().default(3600),
  OTP_SECRET: z.string(),

  GOOGLE_MAIL: z.string(),
  GOOGLE_PASS: z.string(),
});

function createEnvConfig() {
  const parsedEnv = envSchema.safeParse(process.env);

  if (!parsedEnv.success) {
    console.log("Invalid environment variables", parsedEnv.error.format());
    throw new Error("Invalid environment variables");
  }

  return {
    port: parsedEnv.data.PORT,
    database_url: parsedEnv.data.DATABASE_URL,
    jwt_secret: parsedEnv.data.JWT_SECRET,
    jwt_expiry: parsedEnv.data.JWT_EXPIRY,
    otp_secret: parsedEnv.data.OTP_SECRET,

    google_mail: parsedEnv.data.GOOGLE_MAIL,
    google_pass: parsedEnv.data.GOOGLE_PASS,
  };
}

export const envConfig = createEnvConfig();
export type TEnvConfig = z.infer<typeof envSchema>;
