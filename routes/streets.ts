import { and, eq, ilike, inArray, sql, type SQLWrapper } from "drizzle-orm";
import { Hono } from "hono";

import { db } from "../database";
import {
  luxembourgMunicipalities,
  luxembourgLocalities,
  luxembourgStreets,
} from "../schema";
import { getAllItems, getItemById, NO_RSULT_IDS } from "../utils";

export const streetsRoute = new Hono();

streetsRoute.get("/:id", (context) =>
  getItemById(context, async (id: number) =>
    (
      await db
        .select({
          id: luxembourgStreets.id,
          name: luxembourgStreets.name,
          calcrId: luxembourgStreets.calcrId,
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
        .from(luxembourgStreets)
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
    ).pop()
  )
);

streetsRoute.get("/", async (context) => {
  const idQuery = context.req
    .queries("id")
    ?.filter((id) => !isNaN(Number(id)))
    .map(Number);
  const calcrIdQuery = context.req
    .queries("calcrId")
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
  const localityQuery = context.req.queries("locality");
  const municipalityQuery = context.req.queries("municipality");
  const nameQuery = context.req.queries("name");
  const nameContainsQuery = context.req.query("nameContains");
  const filters: SQLWrapper[] = [];

  if (idQuery?.length) filters.push(inArray(luxembourgStreets.id, idQuery));
  if (calcrIdQuery?.length) {
    filters.push(inArray(luxembourgStreets.calcrId, calcrIdQuery));
  }
  if (localityIdQuery?.length) {
    filters.push(inArray(luxembourgStreets.localityId, localityIdQuery));
  }
  if (!!nameQuery) {
    filters.push(
      inArray(
        sql`UPPER(${luxembourgStreets.name})`,
        nameQuery.map((name) => name.toUpperCase())
      )
    );
  }
  if (localityQuery?.length) {
    const streets = await db
      .selectDistinct({ id: luxembourgStreets.id })
      .from(luxembourgStreets)
      .innerJoin(
        luxembourgLocalities,
        eq(luxembourgStreets.localityId, luxembourgLocalities.id)
      )
      .where(
        sql`UPPER(${luxembourgLocalities.name}) IN ${localityQuery.map((loc) => loc.toUpperCase())}`
      );

    filters.push(
      inArray(
        luxembourgStreets.id,
        streets.length ? streets.map((street) => street.id) : NO_RSULT_IDS
      )
    );
  }
  if (!!nameContainsQuery) {
    filters.push(ilike(luxembourgStreets.name, `%${nameContainsQuery}%`));
  }
  if (municipalityIdQuery?.length) {
    const streets = await db
      .selectDistinct({ id: luxembourgStreets.id })
      .from(luxembourgStreets)
      .innerJoin(
        luxembourgLocalities,
        eq(luxembourgStreets.localityId, luxembourgLocalities.id)
      )
      .innerJoin(
        luxembourgMunicipalities,
        eq(luxembourgLocalities.municipalityId, luxembourgMunicipalities.id)
      )
      .where(inArray(luxembourgMunicipalities.id, municipalityIdQuery));

    filters.push(
      inArray(
        luxembourgStreets.id,
        streets.length
          ? streets.map((postalCode) => postalCode.id)
          : NO_RSULT_IDS
      )
    );
  }
  if (municipalityQuery?.length) {
    const streets = await db
      .selectDistinct({ id: luxembourgStreets.id })
      .from(luxembourgStreets)
      .innerJoin(
        luxembourgLocalities,
        eq(luxembourgStreets.localityId, luxembourgLocalities.id)
      )
      .innerJoin(
        luxembourgMunicipalities,
        eq(luxembourgLocalities.municipalityId, luxembourgMunicipalities.id)
      )
      .where(
        sql`UPPER(${luxembourgMunicipalities.name}) IN ${municipalityQuery.map((loc) => loc.toUpperCase())}`
      );

    filters.push(
      inArray(
        luxembourgStreets.id,
        streets.length ? streets.map((street) => street.id) : NO_RSULT_IDS
      )
    );
  }

  return getAllItems(context, luxembourgStreets, and(...filters));
});
