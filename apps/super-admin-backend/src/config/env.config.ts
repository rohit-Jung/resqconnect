import z from 'zod';
import { type z as zType } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  // Bind all interfaces by default so Expo Go / physical devices can reach the dev server.
  DEV_IP: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string(),

  // Control-plane admin auth
  CONTROL_PLANE_ADMIN_EMAIL: z.email(),
  CONTROL_PLANE_ADMIN_PASSWORD: z.string().min(8),
  JWT_SECRET: z.string(),
  JWT_EXPIRY: z.coerce.number().int().positive().default(3600),

  // Billing (Khalti)
  KHALTI_SECRET_KEY: z.string(),
  KHALTI_BASE_URL: z.string().default('https://dev.khalti.com/api/v2'),
  KHALTI_RETURN_URL: z.string(),
  KHALTI_WEBSITE_URL: z.string(),

  // Silo auth
  INTERNAL_API_KEY: z.string(),
});

function createEnvConfig() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.log(parsed.error.issues);
    throw new Error('Invalid environment variables');
  }

  return {
    port: parsed.data.PORT,
    dev_ip: parsed.data.DEV_IP,
    database_url: parsed.data.DATABASE_URL,

    control_plane_admin_email: parsed.data.CONTROL_PLANE_ADMIN_EMAIL,
    control_plane_admin_password: parsed.data.CONTROL_PLANE_ADMIN_PASSWORD,
    jwt_secret: parsed.data.JWT_SECRET,
    jwt_expiry: parsed.data.JWT_EXPIRY,

    khalti_secret_key: parsed.data.KHALTI_SECRET_KEY,
    khalti_base_url: parsed.data.KHALTI_BASE_URL,
    khalti_return_url: parsed.data.KHALTI_RETURN_URL,
    khalti_website_url: parsed.data.KHALTI_WEBSITE_URL,

    internal_api_key: parsed.data.INTERNAL_API_KEY,
  };
}

export const envConfig = createEnvConfig();
export type TEnvConfig = zType.infer<typeof envSchema>;
