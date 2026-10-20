import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@logd/db/schema";

export type Bindings = {
  DATABASE_URL?: string;
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
  ALLOWED_WEB_ORIGINS?: string;
  OPENAI_API_KEY?: string;
};

export function getDb(env: Bindings) {
  if (!env.DATABASE_URL) throw new Error("DATABASE_NOT_CONFIGURED");
  return drizzle(neon(env.DATABASE_URL), { schema });
}
