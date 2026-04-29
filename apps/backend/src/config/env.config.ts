import { env } from 'node:process';

import z from 'zod';
import { type z as zType } from 'zod';

const envSchema = z.object({
  MODE: z.enum(['platform', 'silo']).default('silo'),
  DEV_IP: z.string().default('0.0.0.0'),
  ALLOWED_ORIGINS: z
    .string()
    .default('*')
    .transform(val =>
      val === '*' ? ['*'] : val.split(',').map(v => v.trim())
    ),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
  JWT_EXPIRY: z.coerce.number().default(3600),
  JWT_RESTRICTED_EXPIRY: z.coerce.number().default(900),
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

  // Khalti Payment Configuration
  KHALTI_SECRET_KEY: z.string(),
  KHALTI_BASE_URL: z.string().default('https://dev.khalti.com/api/v2'),
  KHALTI_RETURN_URL: z.string(),
  KHALTI_WEBSITE_URL: z.string(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // LOCAL SMS INFO
  SMS_URI: z.string(),
  SMS_USERNAME: z.string(),
  SMS_PASSWORD: z.string(),

  BACKEND_BASE_PATH: z.string(),

  // Platform <-> silo base URLs (internal docker network addresses)
  PLATFORM_BASE_URL: z.string().optional(),
  SILO_FIRE_BASE_URL: z.string().optional(),
  SILO_HOSPITAL_BASE_URL: z.string().optional(),
  SILO_POLICE_BASE_URL: z.string().optional(),

  // Internal incident bridge routing
  SILO_BASE_URL: z.string().optional(),
  SILO_NAME: z.enum(['fire', 'hospital', 'police']).optional(),

  // Control-plane -> silo internal API auth
  INTERNAL_API_KEY: z.string().optional(),

  // Platform dispatch config
  DISPATCH_TIMEOUT_MS: z.coerce.number().default(2000),
  DISPATCH_RETRIES: z.coerce.number().default(2),
  DISPATCH_BACKOFF_MS: z.coerce.number().default(500),

  // Infra (defaults match current local dev assumptions)
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  KAFKA_BROKERS: z.string().default('localhost:9092'),
});

function normalizeVars(
  env: z.infer<typeof envSchema>
): Record<string, string | number | string[]> {
  return Object.fromEntries(
    Object.entries(env).map(([key, val]) => [
      key.toLocaleLowerCase().trim(),
      val,
    ])
  );
}

function parseCliFlags(parsedEnv: z.infer<typeof envSchema>) {
  // apply cli overrides after parsing (cli args are in process.argv)
  for (let i = 1; i < process.argv.length; i++) {
    if (process.argv[i] === '--mode' && process.argv[i + 1]) {
      parsedEnv.MODE = process.argv[i + 1] as 'platform' | 'silo';
      i++;
    } else if (process.argv[i] === '--port' && process.argv[i + 1]) {
      parsedEnv.PORT = Number(process.argv[i + 1]) || 4000;
      i++;
    } else if (process.argv[i] === '--sector' && process.argv[i + 1]) {
      // parsedEnv.SECTOR = process.argv[i + 1] as string;
      i++;
    }
  }
}

function createEnvConfig() {
  const parsedEnv = envSchema.safeParse(process.env);

  if (!parsedEnv.success) {
    console.log('Invalid environment variables', parsedEnv.error.issues);
    throw new Error('Invalid environment variables');
  }

  parseCliFlags(parsedEnv.data);
  return normalizeVars(parsedEnv.data);
}

export const envConfig = createEnvConfig();

export const envConfigLower = envConfig as Record<
  string,
  string | number | string[] | undefined
>;
export type TEnvConfig = zType.infer<typeof envSchema>;

const SERVICE_TYPE_TO_SILO = {
  ambulance: 'SILO_HOSPITAL_BASE_URL',
  fire_truck: 'SILO_FIRE_BASE_URL',
  rescue_team: 'SILO_FIRE_BASE_URL',
  police: 'SILO_POLICE_BASE_URL',
} as const;

export function getSiloBaseUrl(emergencyType: string): string | undefined {
  const key =
    SERVICE_TYPE_TO_SILO[emergencyType as keyof typeof SERVICE_TYPE_TO_SILO];
  return key ? (envConfig[key] as string | undefined) : undefined;
}
