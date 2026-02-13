import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

import { env } from "~/env";
import { db } from "~/server/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  socialProviders: {
    discord: {
      clientId: env.BETTER_AUTH_DISCORD_CLIENT_ID,
      clientSecret: env.BETTER_AUTH_DISCORD_CLIENT_SECRET,
      redirectURI: `${env.NEXT_PUBLIC_BASE_URL}/api/auth/callback/discord`,
    },
  },
  cookies: {
    secure: true,
    sameSite: "lax",
  },
  plugins: [nextCookies()],
  trustedOrigins: ["*"],
  user: {
    additionalFields: {
      linearApiKey: {
        type: "string",
        input: true,
        required: false,
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
