import { and, eq, ilike, inArray, type SQLWrapper } from "drizzle-orm";
import { Hono } from "hono";

import { db } from "../database";
import {
  luxembourgMunicipalities,
  luxembourgLocalities,
  luxembourgPostalCodes,
  luxembourgStreets,
  luxembourgAddressLines,
} from "../schema";
import { getAllItems, getItemById } from "../utils";

export const addressesRoute = new Hono();

addressesRoute.get("/:id", (context) =>
  getItemById(
    context,
    async (id: number) =>
      await db
        .select({
          id: luxembourgAddressLines.id,
          calcrId: luxembourgAddressLines.calcrId,
          municipalityId: luxembourgMunicipalities.id,
          idGeoportail: luxembourgAddressLines.idGeoportal,
          line: luxembourgAddressLines.line,
          latitude: luxembourgAddressLines.latitude,
          longitude: luxembourgAddressLines.longitude,
          postalCode: {
            id: luxembourgPostalCodes.id,
            code: luxembourgPostalCodes.code,
          },
          street: {
            id: luxembourgStreets.id,
            name: luxembourgStreets.name,
            calcrId: luxembourgStreets.calcrId,
          },
          locality: {
            id: luxembourgLocalities.id,
            name: luxembourgLocalities.name,
            municipality: {
              id: luxembourgMunicipalities.id,
              // @ts-ignore
              name: luxembourgMunicipalities.name,
              calcrId: luxembourgMunicipalities.calcrId,
            },
          },
        })
        .from(luxembourgAddressLines)
        .innerJoin(
          luxembourgPostalCodes,
          eq(luxembourgAddressLines.postalCodeId, luxembourgPostalCodes.id)
        )
        .innerJoin(
          luxembourgStreets,
          eq(luxembourgAddressLines.streetId, luxembourgStreets.id)
        )
        .innerJoin(
          luxembourgLocalities,
          eq(luxembourgStreets.localityId, luxembourgLocalities.id)
        )
        .innerJoin(
          luxembourgMunicipalities,
          eq(luxembourgLocalities.municipalityId, luxembourgMunicipalities.id)
        )
        .where(eq(luxembourgStreets.id, Number(id)))
        .limit(1)
  )
);

addressesRoute.get("/", (context) => {
  const idQuery = context.req
    .queries("id")
    ?.filter((id) => !isNaN(Number(id)))
    .map(Number);
  const calcrIdQuery = context.req
    .queries("calcrId")
    ?.filter((id) => !isNaN(Number(id)))
    .map(Number);
  const streetIdQuery = context.req
    .queries("streetId")
    ?.filter((id) => !isNaN(Number(id)))
    .map(Number);
  const postalCodeIdQuery = context.req
    .queries("postalCodeId")
    ?.filter((id) => !isNaN(Number(id)))
    .map(Number);
  const latitudeQuery = context.req
    .queries("latitude")
    ?.filter((lat) => !isNaN(Number(lat)))
    .map(Number);
  const longitudeQuery = context.req
    .queries("longitude")
    ?.filter((lon) => !isNaN(Number(lon)))
    .map(Number);
  const lineQuery = context.req.query("line");
  const lineContainsQuery = context.req.query("lineContains");
  const idGeoportalQuery = context.req.query("idGeoportal");
  const idGeoportalContainsQuery = context.req.query("idGeoportalContains");
  const filters: SQLWrapper[] = [];

  if (idQuery?.length)
    filters.push(inArray(luxembourgAddressLines.id, idQuery));
  if (calcrIdQuery?.length)
    filters.push(inArray(luxembourgAddressLines.calcrId, calcrIdQuery));
  if (streetIdQuery?.length)
    filters.push(inArray(luxembourgAddressLines.streetId, streetIdQuery));
  if (postalCodeIdQuery?.length)
    filters.push(
      inArray(luxembourgAddressLines.postalCodeId, postalCodeIdQuery)
    );
  if (latitudeQuery?.length)
    filters.push(inArray(luxembourgAddressLines.latitude, latitudeQuery));
  if (longitudeQuery?.length)
    filters.push(inArray(luxembourgAddressLines.longitude, longitudeQuery));
  if (!!lineQuery) filters.push(ilike(luxembourgAddressLines.line, lineQuery));
  if (!!lineContainsQuery)
    filters.push(ilike(luxembourgAddressLines.line, `%${lineContainsQuery}%`));
  if (!!idGeoportalQuery)
    filters.push(ilike(luxembourgAddressLines.idGeoportal, idGeoportalQuery));
  if (!!idGeoportalContainsQuery)
    filters.push(
      ilike(
        luxembourgAddressLines.idGeoportal,
        `%${idGeoportalContainsQuery}%`
      )
    );

  return getAllItems(context, luxembourgAddressLines, and(...filters));
});
