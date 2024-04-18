import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import type { GeocodeReverseResponse, GeocodeSearchResponse } from "../types";
import { toNumSafe } from "../utils";

export const geocodeRoute = new Hono();

geocodeRoute.get("/search", async (context) => {
  const geocodeUrl = process.env.GEOCODE_URL;
  if (!geocodeUrl) {
    throw new HTTPException(404, { message: "URL is not set" });
  }

  const url = new URL(`${geocodeUrl}/search`);
  const params = new URLSearchParams(context.req.query());
  params.delete("cb");
  url.search = params.toString();

  const response = await fetch(url);
  if (response.ok) {
    const data: GeocodeSearchResponse = await response.json();

    const cleanResults = data.results.map((result) => ({
      accuracy: result.accuracy,
      address: result.address,
      name: result.name,
      matchingStreet: result["matching street"],
      ratio: toNumSafe(result.ratio),
      easting: toNumSafe(result.easting),
      northing: toNumSafe(result.northing),
      geometry:
        !!result.geom && typeof result.geom === "object"
          ? {
              ...result.geom,
              coordinates: result.geom.coordinates?.map(toNumSafe),
            }
          : result.geom,
      geometryLonLat:
        !!result.geomlonlat && typeof result.geomlonlat === "object"
          ? {
              ...result.geomlonlat,
              coordinates: result.geomlonlat.coordinates?.map(toNumSafe),
            }
          : result.geomlonlat,
      addressDetails:
        !!result.AddressDetails && typeof result.AddressDetails === "object"
          ? {
              locality: result.AddressDetails.locality,
              localityCalcrId: toNumSafe(
                result.AddressDetails.id_caclr_locality
              ),
              street: result.AddressDetails.street,
              streetCalcrId: toNumSafe(result.AddressDetails.id_caclr_street),
              number: result.AddressDetails.postnumber,
              buildingCalcrId: toNumSafe(
                result.AddressDetails.id_caclr_building
              ),
              postalCode: result.AddressDetails.zip,
            }
          : result.AddressDetails,
    }));

    return context.json({ ...data, results: cleanResults });
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
    const data: GeocodeReverseResponse = await response.json();

    const cleanResults = data.results.map((result) => ({
      street: result.street,
      number: result.number,
      locality: result.locality,
      postalCode: result.postal_code,
      country: result.country,
      countryCode: result.country_code,
      distance: result.distance,
      contributor: result.contributor,
      localityCalcrId: toNumSafe(result.id_caclr_locality),
      streetCalcrId: toNumSafe(result.id_caclr_street),
      buildingCalcrId: toNumSafe(result.id_caclr_bat),
      geometry:
        !!result.geom && typeof result.geom === "object"
          ? {
              ...result.geom,
              coordinates: result.geom.coordinates?.map(toNumSafe),
            }
          : result.geom,
      geometryLonLat:
        !!result.geomlonlat && typeof result.geomlonlat === "object"
          ? {
              ...result.geomlonlat,
              coordinates: result.geomlonlat.coordinates?.map(toNumSafe),
            }
          : result.geomlonlat,
    }));

    return context.json({ count: data.count, results: cleanResults });
  }

  throw new HTTPException(500, { message: "Geocode reverse API unavailable" });
});
