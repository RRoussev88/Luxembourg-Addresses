import { and, eq, ilike, inArray, type SQLWrapper } from "drizzle-orm";
import { Hono } from "hono";

import { db } from "../database";
import { luxembourgCommunes, luxembourgLocalites } from "../schema";
import { getAllItems, getItemById } from "../utils";

export const localitiesRoute = new Hono();

localitiesRoute.get("/:id", (context) =>
  getItemById(context, async (id: number) =>
    (
      await db
        .select({
          id: luxembourgLocalites.id,
          name: luxembourgLocalites.name,
          communeId: luxembourgCommunes.id,
          commune: {
            id: luxembourgCommunes.id,
            name: luxembourgCommunes.name,
            calcrId: luxembourgCommunes.calcrId,
          },
        })
        .from(luxembourgLocalites)
        .innerJoin(
          luxembourgCommunes,
          eq(luxembourgLocalites.communeId, luxembourgCommunes.id)
        )
        .where(eq(luxembourgLocalites.id, Number(id)))
        .limit(1)
    ).pop()
  )
);

localitiesRoute.get("/", (context) => {
  const idQuery = context.req
    .queries("id")
    ?.filter((id) => !isNaN(Number(id)))
    .map(Number);
  const communeIdQuery = context.req
    .queries("communeId")
    ?.filter((id) => !isNaN(Number(id)))
    .map(Number);
  const nameQuery = context.req.query("name");
  const nameContainsQuery = context.req.query("nameContains");
  const filters: SQLWrapper[] = [];

  if (idQuery?.length) filters.push(inArray(luxembourgLocalites.id, idQuery));
  if (communeIdQuery?.length)
    filters.push(inArray(luxembourgLocalites.communeId, communeIdQuery));
  if (!!nameQuery) filters.push(ilike(luxembourgLocalites.name, nameQuery));
  if (!!nameContainsQuery)
    filters.push(ilike(luxembourgLocalites.name, `%${nameContainsQuery}%`));

  return getAllItems(context, luxembourgLocalites, and(...filters));
});
