import type { Config } from "drizzle-kit";

export default {
  schema: "./schema.ts",
  out: "./drizzle",
  driver: "pg",
  dbCredentials: {
    host: process.env.DATABASE_HOST as string,
    database: process.env.DATABASE_NAME as string,
    port: Number(process.env.DATABASE_PORT),
    user: process.env.DATABASE_USER as string,
    password: process.env.DATABASE_PASSWORD,
    connectionString: process.env.DATABASE_URL,
  },
} satisfies Config;
