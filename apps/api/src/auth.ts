import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from "@logd/db/schema";
import { activeDatabaseUrl, getDb, type Bindings } from "./db";

export function getAuth(env: Bindings) {
  if (!env.BETTER_AUTH_SECRET || !activeDatabaseUrl(env)) {
    throw new Error("AUTH_NOT_CONFIGURED");
  }

  const webOrigins = (env.ALLOWED_WEB_ORIGINS ?? "http://localhost:8081,http://localhost:19006")
    .split(",").map((origin) => origin.trim()).filter(Boolean);

  return betterAuth({
    appName: "LOGD",
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL ?? "https://logd.ricecloud.workers.dev",
    database: drizzleAdapter(getDb(env), { provider: "pg", schema }),
    emailAndPassword: { enabled: true },
    trustedOrigins: ["logd://", "logd://*", ...webOrigins],
    plugins: [expo()],
    advanced: {
      defaultCookieAttributes: {
        sameSite: "none",
        secure: true,
        httpOnly: true,
      },
    },
  });
}
