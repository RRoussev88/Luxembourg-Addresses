import { and, eq, ilike, inArray, type SQLWrapper } from "drizzle-orm";
import { Hono } from "hono";

import { db } from "../database";
import { luxembourgCommunes } from "../schema";
import { getAllItems, getItemById } from "../utils";

export const communesRoute = new Hono();

communesRoute.get("/:id", (context) =>
  getItemById(context, async (id: number) =>
    (
      await db
        .select()
        .from(luxembourgCommunes)
        .where(eq(luxembourgCommunes.id, Number(id)))
        .limit(1)
    ).pop()
  )
);

communesRoute.get("/", (context) => {
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

  if (idQuery?.length) filters.push(inArray(luxembourgCommunes.id, idQuery));
  if (calcrIdQuery?.length)
    filters.push(inArray(luxembourgCommunes.calcrId, calcrIdQuery));
  if (!!nameQuery) filters.push(ilike(luxembourgCommunes.name, nameQuery));
  if (!!nameContainsQuery)
    filters.push(ilike(luxembourgCommunes.name, `%${nameContainsQuery}%`));

  return getAllItems(context, luxembourgCommunes, and(...filters));
});
