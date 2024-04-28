import {
  and,
  eq,
  gte,
  ilike,
  inArray,
  sql,
  type SQLWrapper,
} from "drizzle-orm";
import { Hono } from "hono";

import { db } from "../database";
import {
  localitiesToPostalCodes,
  luxembourgLocalities,
  luxembourgMunicipalities,
  luxembourgPostalCodes,
} from "../schema";
import { type VerifiedRouter } from "../types";
import { NO_RSULT_IDS, getAllItems, getItemById } from "../utils";

export const localitiesRoute = new Hono<VerifiedRouter>();

localitiesRoute.get("/:id", (context) =>
  getItemById(context, async (id: number) =>
    (
      await db
        .select({
          id: luxembourgLocalities.id,
          name: luxembourgLocalities.name,
          municipality: {
            id: luxembourgMunicipalities.id,
            name: luxembourgMunicipalities.name,
            calcrId: luxembourgMunicipalities.calcrId,
          },
        })
        .from(luxembourgLocalities)
        .innerJoin(
          luxembourgMunicipalities,
          eq(luxembourgLocalities.municipalityId, luxembourgMunicipalities.id)
        )
        .where(
          and(
            !!context.var.lastSyncTime
              ? gte(luxembourgLocalities.verifiedAt, context.var.lastSyncTime)
              : eq(luxembourgLocalities.id, Number(id)),
            eq(luxembourgLocalities.id, Number(id))
          )
        )
        .limit(1)
    ).pop()
  )
);

localitiesRoute.get("/", async (context) => {
  const idQuery = context.req
    .queries("id")
    ?.filter((id) => !isNaN(Number(id)))
    .map(Number);
  const municipalityIdQuery = context.req
    .queries("municipalityId")
    ?.filter((id) => !isNaN(Number(id)))
    .map(Number);
  const municipalityQuery = context.req.queries("municipality");
  const postalCodeIdQuery = context.req
    .queries("postalCodeId")
    ?.filter((id) => !isNaN(Number(id)))
    .map(Number);
  const postalCodeQuery = context.req.queries("postalCode");
  const nameQuery = context.req.queries("name");
  const nameContainsQuery = context.req.query("nameContains");
  const filters: SQLWrapper[] = [];

  if (idQuery?.length) filters.push(inArray(luxembourgLocalities.id, idQuery));
  if (municipalityIdQuery?.length) {
    filters.push(
      inArray(luxembourgLocalities.municipalityId, municipalityIdQuery)
    );
  }
  if (municipalityQuery?.length) {
    const localities = await db
      .selectDistinct({ id: luxembourgLocalities.id })
      .from(luxembourgLocalities)
      .innerJoin(
        luxembourgMunicipalities,
        eq(luxembourgLocalities.municipalityId, luxembourgMunicipalities.id)
      )
      .where(
        sql`UPPER(${luxembourgMunicipalities.name}) IN ${municipalityQuery.map((loc) => loc.toUpperCase())}`
      );

    filters.push(
      inArray(
        luxembourgLocalities.id,
        localities.length ? localities.map((loc) => loc.id) : NO_RSULT_IDS
      )
    );
  }
  if (postalCodeIdQuery?.length) {
    const localities = await db
      .selectDistinct({ id: luxembourgLocalities.id })
      .from(localitiesToPostalCodes)
      .innerJoin(
        luxembourgLocalities,
        eq(localitiesToPostalCodes.localityId, luxembourgLocalities.id)
      )
      .where(inArray(localitiesToPostalCodes.postalCodeId, postalCodeIdQuery));

    filters.push(
      inArray(
        luxembourgLocalities.id,
        localities.length
          ? localities.map((postalCode) => postalCode.id)
          : NO_RSULT_IDS
      )
    );
  }
  if (postalCodeQuery?.length) {
    const localities = await db
      .selectDistinct({ id: luxembourgLocalities.id })
      .from(localitiesToPostalCodes)
      .innerJoin(
        luxembourgPostalCodes,
        eq(localitiesToPostalCodes.postalCodeId, luxembourgPostalCodes.id)
      )
      .innerJoin(
        luxembourgLocalities,
        eq(localitiesToPostalCodes.localityId, luxembourgLocalities.id)
      )
      .where(inArray(luxembourgPostalCodes.code, postalCodeQuery));

    filters.push(
      inArray(
        luxembourgLocalities.id,
        localities.length
          ? localities.map((postalCode) => postalCode.id)
          : NO_RSULT_IDS
      )
    );
  }
  if (!!nameQuery) {
    filters.push(
      inArray(
        sql`UPPER(${luxembourgLocalities.name})`,
        nameQuery.map((name) => name.toUpperCase())
      )
    );
  }
  if (!!nameContainsQuery) {
    filters.push(ilike(luxembourgLocalities.name, `%${nameContainsQuery}%`));
  }

  if (!!context.var.lastSyncTime) {
    filters.push(
      gte(luxembourgLocalities.verifiedAt, context.var.lastSyncTime)
    );
  }

  return getAllItems(context, luxembourgLocalities, and(...filters));
});
