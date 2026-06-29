import * as schema from "@suwa/db/schema/auth";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { expo } from "@better-auth/expo";
import { admin, multiSession } from "better-auth/plugins";

const auth = betterAuth({
  database: drizzleAdapter({} as any, {
    provider: "sqlite",
    schema: schema,
  }),
  plugins: [expo(), admin(), multiSession()],
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    },
  },

  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: true,
      },
    },
  },
  secret: "cli-only",
  baseURL: "http://localhost:3000",
});

export { auth };
