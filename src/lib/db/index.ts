import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

function createDb() {
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const client = postgres(connectionString, { prepare: false });
  return drizzle(client, { schema });
}

let db: ReturnType<typeof createDb> | undefined;

export function getDb() {
  if (!db) {
    db = createDb();
  }
  return db;
}

export { schema };
