import type { TUser } from "@/models";

declare global {
  namespace Express {
    interface Request {
      user: Partial<TUser>;
    }
  }
}
