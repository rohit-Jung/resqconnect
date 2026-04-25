export type Sector = 'fire' | 'hospital' | 'police';

export type SectorConfig = {
  sector: Sector;
  compliance: {
    hipaa: boolean;
    cjis: boolean;

    // Enforce a max session age (seconds) based on token iat.
    // This is independent of JWT exp and is meant for compliance.
    sessionTimeoutSeconds: number;

    // If true, requires a step-up MFA token for authenticated requests.
    // Fire sector keeps this off.
    mfaRequired: boolean;

    // Failed-login lockout (CJIS-style). Applies to login endpoints.
    failedLoginLockoutEnabled: boolean;
    failedLoginMaxAttempts: number;
    failedLoginWindowSeconds: number;
    failedLoginLockSeconds: number;
  };
};

export const baseSectorConfig: Omit<SectorConfig, 'sector'> = {
  compliance: {
    hipaa: false,
    cjis: false,

    sessionTimeoutSeconds: 3600,
    mfaRequired: false,

    failedLoginLockoutEnabled: false,
    failedLoginMaxAttempts: 5,
    failedLoginWindowSeconds: 600,
    failedLoginLockSeconds: 900,
  },
};

export const sectorOverrides: Record<Sector, Omit<SectorConfig, 'sector'>> = {
  fire: {
    compliance: {
      hipaa: false,
      cjis: false,

      sessionTimeoutSeconds: 3600,
      mfaRequired: false,

      failedLoginLockoutEnabled: false,
      failedLoginMaxAttempts: 5,
      failedLoginWindowSeconds: 600,
      failedLoginLockSeconds: 900,
    },
  },
  hospital: {
    compliance: {
      hipaa: true,
      cjis: false,

      sessionTimeoutSeconds: 1800,
      mfaRequired: true,

      failedLoginLockoutEnabled: false,
      failedLoginMaxAttempts: 5,
      failedLoginWindowSeconds: 600,
      failedLoginLockSeconds: 900,
    },
  },
  police: {
    compliance: {
      hipaa: false,
      cjis: true,

      sessionTimeoutSeconds: 900,
      mfaRequired: true,

      failedLoginLockoutEnabled: true,
      failedLoginMaxAttempts: 5,
      failedLoginWindowSeconds: 600,
      failedLoginLockSeconds: 900,
    },
  },
};
