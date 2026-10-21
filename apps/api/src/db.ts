import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@logd/db/schema";

export type Bindings = {
  // The existing LOGD Worker is a development environment. Production will
  // use a separate deployment and cannot silently fall back to these secrets.
  APP_ENV?: "development" | "production";
  DATABASE_URL_DEV?: string;
  DATABASE_URL?: string;
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
  ALLOWED_WEB_ORIGINS?: string;
  OPENAI_API_KEY?: string;
};

export function activeDatabaseUrl(env: Bindings): string | undefined {
  return env.APP_ENV === "production" ? env.DATABASE_URL : env.DATABASE_URL_DEV;
}

export function getDb(env: Bindings) {
  const url = activeDatabaseUrl(env);
  if (!url) throw new Error("DATABASE_NOT_CONFIGURED");
  return drizzle(neon(url), { schema });
}
