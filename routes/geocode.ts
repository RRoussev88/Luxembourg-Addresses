import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

export const geocodeRoute = new Hono();

geocodeRoute.get("/search", async (context) => {
  const geocodeUrl = process.env.GEOCODE_URL;
  if (!geocodeUrl) {
    throw new HTTPException(404, { message: "URL is not set" });
  }

  const url = new URL(`${geocodeUrl}/search`);
  const params = new URLSearchParams(context.req.query());
  url.search = params.toString();

  const response = await fetch(url);
  if (response.ok) {
    const data = await response.json();
    // TODO: Fix the response a bit. Make it all camelCase.
    return context.json(data);
  }

  throw new HTTPException(500, { message: "Geocode search API unavailable" });
});

geocodeRoute.get("/reverse", async (context) => {
  const geocodeUrl = process.env.GEOCODE_URL;
  if (!geocodeUrl) {
    throw new HTTPException(404, { message: "URL is not set" });
  }

  const url = new URL(`${geocodeUrl}/reverse`);
  const params = new URLSearchParams(context.req.query());
  url.search = params.toString();

  const response = await fetch(url);
  if (response.ok) {
    const data = await response.json();
    // TODO: Fix the response a bit. Make it all camelCase.
    return context.json(data);
  }

  throw new HTTPException(500, { message: "Geocode reverse API unavailable" });
});
