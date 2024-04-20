import { Hono } from "hono";
import { logger } from "hono/logger";

import { sql } from "drizzle-orm";
import { db } from "./database";

import { getLastSynchronizationTime } from "./middlewares";
import {
  addressesRoute,
  calcrRoute,
  municipalitiesRoute,
  geocodeRoute,
  localitiesRoute,
  postalCodesRoute,
  streetsRoute,
} from "./routes";

const app = new Hono();

app.use(logger());
app.get("/ping", async (context) => {
  const isHealthy = !!(await db.execute(sql`SELECT 1;`))?.pop();
  return context.body(isHealthy.toString());
});
app.route("/addresses_georeferences", calcrRoute);
app.route("/geocode", geocodeRoute);

app.use(getLastSynchronizationTime);

app.route("/addresses", addressesRoute);
app.route("/localities", localitiesRoute);
app.route("/municipalities", municipalitiesRoute);
app.route("/postal_codes", postalCodesRoute);
app.route("/streets", streetsRoute);

Bun.serve({ fetch: app.fetch, port: process.env.PORT });
