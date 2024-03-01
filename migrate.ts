import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

import * as schema from "./schema";

// for migrations
const migrationClient = postgres(process.env.DATABASE_URL as string, {
  max: 1,
});

// This will run migrations on the database, skipping the ones already applied
const db = drizzle(migrationClient, { schema });
await migrate(db, { migrationsFolder: "./drizzle" });

await migrationClient.end();
