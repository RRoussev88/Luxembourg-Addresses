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
import { luxembourgMunicipalities } from "../schema";
import { type VerifiedRouter } from "../types";
import { getAllItems, getItemById } from "../utils";

export const municipalitiesRoute = new Hono<VerifiedRouter>();

municipalitiesRoute.get("/:id", (context) =>
  getItemById(context, async (id: number) =>
    (
      await db
        .select({
          id: luxembourgMunicipalities.id,
          name: luxembourgMunicipalities.name,
          calcrId: luxembourgMunicipalities.calcrId,
        })
        .from(luxembourgMunicipalities)
        .where(
          and(
            !!context.var.lastSyncTime
              ? gte(
                  luxembourgMunicipalities.verifiedAt,
                  context.var.lastSyncTime
                )
              : eq(luxembourgMunicipalities.id, Number(id)),
            eq(luxembourgMunicipalities.id, Number(id))
          )
        )
        .limit(1)
    ).pop()
  )
);

municipalitiesRoute.get("/", (context) => {
  const idQuery = context.req
    .queries("id")
    ?.filter((id) => !isNaN(Number(id)))
    .map(Number);
  const calcrIdQuery = context.req
    .queries("calcrId")
    ?.filter((id) => !isNaN(Number(id)))
    .map(Number);
  const nameQuery = context.req.queries("name");
  const nameContainsQuery = context.req.query("nameContains");
  const filters: SQLWrapper[] = [];

  if (idQuery?.length)
    filters.push(inArray(luxembourgMunicipalities.id, idQuery));
  if (calcrIdQuery?.length) {
    filters.push(inArray(luxembourgMunicipalities.calcrId, calcrIdQuery));
  }
  if (!!nameQuery) {
    filters.push(
      inArray(
        sql`UPPER(${luxembourgMunicipalities.name})`,
        nameQuery.map((name) => name.toUpperCase())
      )
    );
  }
  if (!!nameContainsQuery) {
    filters.push(
      ilike(luxembourgMunicipalities.name, `%${nameContainsQuery}%`)
    );
  }

  if (!!context.var.lastSyncTime) {
    filters.push(
      gte(luxembourgMunicipalities.verifiedAt, context.var.lastSyncTime)
    );
  }

  return getAllItems(context, luxembourgMunicipalities, and(...filters));
});
