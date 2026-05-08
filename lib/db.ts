import * as schema from "@/drizzle/schema";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

const sql = neon(
  process.env.DATABASE_URL || "postgresql://noop:noop@localhost:5432/noop"
);

export const db = drizzle(sql, { schema });
