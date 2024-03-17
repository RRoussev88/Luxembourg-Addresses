import { and, eq, ilike, inArray, type SQLWrapper } from "drizzle-orm";
import { Hono } from "hono";

import { db } from "../database";
import { luxembourgMunicipalities } from "../schema";
import { getAllItems, getItemById } from "../utils";

export const municipalitiesRoute = new Hono();

municipalitiesRoute.get("/:id", (context) =>
  getItemById(context, async (id: number) =>
    (
      await db
        .select()
        .from(luxembourgMunicipalities)
        .where(eq(luxembourgMunicipalities.id, Number(id)))
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
  const nameQuery = context.req.query("name");
  const nameContainsQuery = context.req.query("nameContains");
  const filters: SQLWrapper[] = [];

  if (idQuery?.length) filters.push(inArray(luxembourgMunicipalities.id, idQuery));
  if (calcrIdQuery?.length)
    filters.push(inArray(luxembourgMunicipalities.calcrId, calcrIdQuery));
  if (!!nameQuery) filters.push(ilike(luxembourgMunicipalities.name, nameQuery));
  if (!!nameContainsQuery)
    filters.push(ilike(luxembourgMunicipalities.name, `%${nameContainsQuery}%`));

  return getAllItems(context, luxembourgMunicipalities, and(...filters));
});
