import { Hono } from "hono";

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
app.route("/addresses_georeferences", calcrRoute);
app.route("/addresses", addressesRoute);
app.route("/geocode", geocodeRoute);
app.route("/localities", localitiesRoute);
app.route("/municipalities", municipalitiesRoute);
app.route("/postal_codes", postalCodesRoute);
app.route("/streets", streetsRoute);

Bun.serve({ fetch: app.fetch, port: process.env.PORT });
