import type { IJWTToken } from '@/utils/tokens/jwtTokens';

declare global {
  namespace Express {
    interface Request {
      user?: IJWTToken;
      validatedQuery?: unknown;
      validatedParams?: unknown;
      rateLimit?: {
        limit: number;
        current: number;
        remaining: number;
        resetTime?: Date;
      };
    }
  }
}

declare module 'socket.io' {
  interface Socket {
    user: IJWTToken;
  }
}
