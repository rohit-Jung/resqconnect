import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
  JWT_EXPIRY: z.coerce.number().default(3600),
  OTP_SECRET: z.string(),
  TWILIO_ACCOUNT_SID: z.string(),
  TWILIO_AUTH_TOKEN: z.string(),
  TWILIO_FROM_NUMBER: z.string().optional(),
  GALLI_MAPS_TOKEN: z.string(),
  MAILTRAP_USER: z.string(),
  MAILTRAP_PASS: z.string(),
  MAPBOX_ACCESS_TOKEN: z.string(),

  GOOGLE_MAIL: z.string(),
  GOOGLE_PASS: z.string(),
  TO_NUMBER: z.string(),
  EMERGENCY_PHONE_NUMBER: z.string().default('112'),

  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
});

function createEnvConfig() {
  const parsedEnv = envSchema.safeParse(process.env);

  if (!parsedEnv.success) {
    console.log('Invalid environment variables', parsedEnv.error.format());
    throw new Error('Invalid environment variables');
  }

  return {
    port: parsedEnv.data.PORT,
    database_url: parsedEnv.data.DATABASE_URL,
    jwt_secret: parsedEnv.data.JWT_SECRET,
    jwt_expiry: parsedEnv.data.JWT_EXPIRY,
    otp_secret: parsedEnv.data.OTP_SECRET,
    twilio_account_sid: parsedEnv.data.TWILIO_ACCOUNT_SID,
    twilio_auth_token: parsedEnv.data.TWILIO_AUTH_TOKEN,
    twilio_from_number: parsedEnv.data.TWILIO_FROM_NUMBER,
    galli_maps_token: parsedEnv.data.GALLI_MAPS_TOKEN,
    mailtrap_user: parsedEnv.data.MAILTRAP_USER,
    mailtrap_pass: parsedEnv.data.MAILTRAP_PASS,

    google_mail: parsedEnv.data.GOOGLE_MAIL,
    google_pass: parsedEnv.data.GOOGLE_PASS,
    mapbox_token: parsedEnv.data.MAPBOX_ACCESS_TOKEN,
    to_number: parsedEnv.data.TO_NUMBER,
    emergency_phone_number: parsedEnv.data.EMERGENCY_PHONE_NUMBER,

    cloudinary_cloud_name: parsedEnv.data.CLOUDINARY_CLOUD_NAME,
    cloudinary_api_key: parsedEnv.data.CLOUDINARY_API_KEY,
    cloudinary_api_secret: parsedEnv.data.CLOUDINARY_API_SECRET,
  };
}

export const envConfig = createEnvConfig();
export type TEnvConfig = z.infer<typeof envSchema>;
