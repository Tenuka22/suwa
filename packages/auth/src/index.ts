import { createDb } from "@suwa/db";
import * as schema from "@suwa/db/schema/auth";
import { env } from "@suwa/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { expo } from "@better-auth/expo";
import { admin, multiSession } from "better-auth/plugins";

export function createAuth() {
  const db = createDb();

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: schema,
    }),
    trustedOrigins: [
      ...env.CORS_ORIGIN.split(","),
      "suwa://",
      ...(process.env.NODE_ENV === "development" ? ["exp://", "exp://**"] : []),
    ],
    emailAndPassword: {
      enabled: true,
    },
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    advanced: {
      defaultCookieAttributes: {
        sameSite: "none",
        secure: true,
        httpOnly: true,
      },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            if (user.email === "admin@gmail.com") {
              return { data: { ...user, role: "admin" } };
            }
          },
        },
      },
    },
    plugins: [
      expo(),
      admin(),
      multiSession(),
    ],
  });
}
