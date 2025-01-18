import { env } from "node:process";

export const clerkEnv = {
  publishableKey: env.CLERK_PUBLISHABLE_KEY,
  secretKey: env.CLERK_SECRET_KEY,
};
