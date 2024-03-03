import { Hono } from "hono";

import {
  addressesRoute,
  calcrRoute,
  communesRoute,
  localitiesRoute,
  postalCodesRoute,
  streetsRoute,
} from "./routes";

const app = new Hono();
app.route("/addresses_georeferences", calcrRoute);
app.route("/addresses", addressesRoute);
app.route("/municipalities", communesRoute);
app.route("/localities", localitiesRoute);
app.route("/postal_codes", postalCodesRoute);
app.route("/streets", streetsRoute);

Bun.serve({ fetch: app.fetch, port: process.env.PORT });
