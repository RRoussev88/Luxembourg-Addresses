import { and, eq, ilike, inArray, sql, type SQLWrapper } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { Hono } from "hono";

import { db } from "../database";
import {
  luxembourgMunicipalities,
  luxembourgLocalities,
  luxembourgPostalCodes,
  luxembourgStreets,
  luxembourgAddressLines,
} from "../schema";
import { getAllItems, getItemById, NO_RSULT_IDS } from "../utils";

export const addressesRoute = new Hono();

const addressMunicipalities = alias(
  luxembourgMunicipalities,
  "addressMunicipalities"
);

const addressLocalities = alias(luxembourgLocalities, "addressLocalities");

addressesRoute.get("/:id", (context) =>
  getItemById(context, async (id: number) =>
    (
      await db
        .select({
          id: luxembourgAddressLines.id,
          calcrId: luxembourgAddressLines.calcrId,
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
            locality: {
              id: luxembourgLocalities.id,
              // @ts-ignore
              name: luxembourgLocalities.name,
              municipality: {
                id: luxembourgMunicipalities.id,
                // @ts-ignore
                name: luxembourgMunicipalities.name,
                calcrId: luxembourgMunicipalities.calcrId,
              },
            },
          },
          locality: {
            id: addressLocalities.id,
            name: addressLocalities.name,
            municipalityId: addressLocalities.municipalityId,
          },
          municipality: {
            id: addressMunicipalities.id,
            name: addressMunicipalities.name,
            calcrId: addressMunicipalities.calcrId,
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
        .innerJoin(
          addressLocalities,
          eq(luxembourgAddressLines.localityId, addressLocalities.id)
        )
        .innerJoin(
          addressMunicipalities,
          eq(luxembourgAddressLines.municipalityId, addressMunicipalities.id)
        )
        .where(eq(luxembourgAddressLines.id, Number(id)))
        .limit(1)
    ).pop()
  )
);

addressesRoute.get("/", async (context) => {
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
  const localityIdQuery = context.req
    .queries("localityId")
    ?.filter((id) => !isNaN(Number(id)))
    .map(Number);
  const municipalityIdQuery = context.req
    .queries("municipalityId")
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
  const streetQuery = context.req.queries("street");
  const postalCodeQuery = context.req.queries("postalCode");
  const localityQuery = context.req.queries("locality");
  const municipalityQuery = context.req.queries("municipality");
  const lineQuery = context.req.queries("line");
  const idGeoportalQuery = context.req.queries("idGeoportal");
  const lineContainsQuery = context.req.query("lineContains");
  const idGeoportalContainsQuery = context.req.query("idGeoportalContains");
  const filters: SQLWrapper[] = [];

  if (idQuery?.length) {
    filters.push(inArray(luxembourgAddressLines.id, idQuery));
  }
  if (calcrIdQuery?.length) {
    filters.push(inArray(luxembourgAddressLines.calcrId, calcrIdQuery));
  }
  if (streetIdQuery?.length) {
    filters.push(inArray(luxembourgAddressLines.streetId, streetIdQuery));
  }
  if (streetQuery?.length) {
    const addresses = await db
      .selectDistinct({ id: luxembourgAddressLines.id })
      .from(luxembourgAddressLines)
      .innerJoin(
        luxembourgStreets,
        eq(luxembourgAddressLines.streetId, luxembourgStreets.id)
      )
      .where(
        sql`UPPER(${luxembourgStreets.name}) IN ${streetQuery.map((street) => street.toUpperCase())}`
      );

    filters.push(
      inArray(
        luxembourgAddressLines.id,
        addresses.length ? addresses.map((addr) => addr.id) : NO_RSULT_IDS
      )
    );
  }
  if (postalCodeIdQuery?.length) {
    filters.push(
      inArray(luxembourgAddressLines.postalCodeId, postalCodeIdQuery)
    );
  }
  if (postalCodeQuery?.length) {
    const addresses = await db
      .selectDistinct({ id: luxembourgAddressLines.id })
      .from(luxembourgAddressLines)
      .innerJoin(
        luxembourgPostalCodes,
        eq(luxembourgAddressLines.postalCodeId, luxembourgPostalCodes.id)
      )
      .where(inArray(luxembourgPostalCodes.code, postalCodeQuery));

    filters.push(
      inArray(
        luxembourgAddressLines.id,
        addresses.length ? addresses.map((addr) => addr.id) : NO_RSULT_IDS
      )
    );
  }
  if (localityIdQuery?.length) {
    filters.push(inArray(luxembourgAddressLines.localityId, localityIdQuery));
  }
  if (localityQuery?.length) {
    const addresses = await db
      .selectDistinct({ id: luxembourgAddressLines.id })
      .from(luxembourgAddressLines)
      .innerJoin(
        luxembourgLocalities,
        eq(luxembourgAddressLines.localityId, luxembourgLocalities.id)
      )
      .where(inArray(luxembourgLocalities.name, localityQuery));

    filters.push(
      inArray(
        luxembourgAddressLines.id,
        addresses.length ? addresses.map((addr) => addr.id) : NO_RSULT_IDS
      )
    );
  }
  if (municipalityQuery?.length) {
    const addresses = await db
      .selectDistinct({ id: luxembourgAddressLines.id })
      .from(luxembourgAddressLines)
      .innerJoin(
        luxembourgMunicipalities,
        eq(luxembourgAddressLines.municipalityId, luxembourgMunicipalities.id)
      )
      .where(inArray(luxembourgMunicipalities.name, municipalityQuery));

    filters.push(
      inArray(
        luxembourgAddressLines.id,
        addresses.length ? addresses.map((addr) => addr.id) : NO_RSULT_IDS
      )
    );
  }
  if (municipalityIdQuery?.length) {
    filters.push(
      inArray(luxembourgAddressLines.municipalityId, municipalityIdQuery)
    );
  }
  if (latitudeQuery?.length) {
    filters.push(inArray(luxembourgAddressLines.latitude, latitudeQuery));
  }
  if (longitudeQuery?.length) {
    filters.push(inArray(luxembourgAddressLines.longitude, longitudeQuery));
  }
  if (!!lineQuery) {
    filters.push(
      inArray(
        sql`UPPER(${luxembourgAddressLines.line})`,
        lineQuery.map((name) => name.toUpperCase())
      )
    );
  }
  if (!!idGeoportalQuery) {
    filters.push(
      inArray(
        sql`UPPER(${luxembourgAddressLines.idGeoportal})`,
        idGeoportalQuery.map((name) => name.toUpperCase())
      )
    );
  }
  if (!!lineContainsQuery) {
    filters.push(ilike(luxembourgAddressLines.line, `%${lineContainsQuery}%`));
  }
  if (!!idGeoportalContainsQuery) {
    filters.push(
      ilike(luxembourgAddressLines.idGeoportal, `%${idGeoportalContainsQuery}%`)
    );
  }

  return getAllItems(context, luxembourgAddressLines, and(...filters));
});
