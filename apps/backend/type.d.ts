import type { IJWTToken } from '@/utils/tokens/jwtTokens';

declare global {
  namespace Express {
    interface Request {
      user?: IJWTToken;
    }
  }
}

declare module 'socket.io' {
  interface Socket {
    user: IJWTToken;
  }
}
