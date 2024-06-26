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
  luxembourgPostalCodes,
} from "../schema";
import { type VerifiedRouter } from "../types";
import { NO_RSULT_IDS, getAllItems, getItemById } from "../utils";

export const postalCodesRoute = new Hono<VerifiedRouter>();

postalCodesRoute.get("/:id", (context) =>
  getItemById(context, async (id: number) =>
    (
      await db
        .select({
          id: luxembourgPostalCodes.id,
          code: luxembourgPostalCodes.code,
        })
        .from(luxembourgPostalCodes)
        .where(
          and(
            !!context.var.lastSyncTime
              ? gte(luxembourgPostalCodes.verifiedAt, context.var.lastSyncTime)
              : eq(luxembourgPostalCodes.id, Number(id)),
            eq(luxembourgPostalCodes.id, Number(id))
          )
        )
        .limit(1)
    ).pop()
  )
);

postalCodesRoute.get("/", async (context) => {
  const idQuery = context.req
    .queries("id")
    ?.filter((id) => !isNaN(Number(id)))
    .map(Number);
  const localityIdQuery = context.req
    .queries("localityId")
    ?.filter((id) => !isNaN(Number(id)))
    .map(Number);
  const localityQuery = context.req.queries("locality");
  const codeQuery = context.req.queries("code");
  const codeContainsQuery = context.req.query("codeContains");
  const filters: SQLWrapper[] = [];

  if (idQuery?.length) filters.push(inArray(luxembourgPostalCodes.id, idQuery));
  if (localityIdQuery?.length) {
    const postalCodes = await db
      .selectDistinct({ id: luxembourgPostalCodes.id })
      .from(localitiesToPostalCodes)
      .innerJoin(
        luxembourgPostalCodes,
        eq(localitiesToPostalCodes.postalCodeId, luxembourgPostalCodes.id)
      )
      .where(inArray(localitiesToPostalCodes.localityId, localityIdQuery));

    filters.push(
      inArray(
        luxembourgPostalCodes.id,
        postalCodes.length
          ? postalCodes.map((postalCode) => postalCode.id)
          : NO_RSULT_IDS
      )
    );
  }
  if (localityQuery?.length) {
    const postalCodes = await db
      .selectDistinct({ id: luxembourgPostalCodes.id })
      .from(localitiesToPostalCodes)
      .innerJoin(
        luxembourgPostalCodes,
        eq(localitiesToPostalCodes.postalCodeId, luxembourgPostalCodes.id)
      )
      .innerJoin(
        luxembourgLocalities,
        eq(localitiesToPostalCodes.localityId, luxembourgLocalities.id)
      )
      .where(
        sql`UPPER(${luxembourgLocalities.name}) IN ${localityQuery.map((loc) => loc.toUpperCase())}`
      );

    filters.push(
      inArray(
        luxembourgPostalCodes.id,
        postalCodes.length
          ? postalCodes.map((postalCode) => postalCode.id)
          : NO_RSULT_IDS
      )
    );
  }
  if (!!codeQuery) {
    filters.push(inArray(luxembourgPostalCodes.code, codeQuery));
  }
  if (!!codeContainsQuery) {
    filters.push(ilike(luxembourgPostalCodes.code, `%${codeContainsQuery}%`));
  }

  if (!!context.var.lastSyncTime) {
    filters.push(
      gte(luxembourgPostalCodes.verifiedAt, context.var.lastSyncTime)
    );
  }

  return getAllItems(context, luxembourgPostalCodes, and(...filters));
});
