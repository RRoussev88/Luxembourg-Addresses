import { and, eq, ilike, inArray, type SQLWrapper } from "drizzle-orm";
import { Hono } from "hono";

import { db } from "../database";
import { luxembourgMunicipalities, luxembourgLocalities } from "../schema";
import { getAllItems, getItemById } from "../utils";

export const localitiesRoute = new Hono();

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
        .where(eq(luxembourgLocalities.id, Number(id)))
        .limit(1)
    ).pop()
  )
);

localitiesRoute.get("/", (context) => {
  const idQuery = context.req
    .queries("id")
    ?.filter((id) => !isNaN(Number(id)))
    .map(Number);
  const municipalityIdQuery = context.req
    .queries("municipalityId")
    ?.filter((id) => !isNaN(Number(id)))
    .map(Number);
  const nameQuery = context.req.query("name");
  const nameContainsQuery = context.req.query("nameContains");
  const filters: SQLWrapper[] = [];

  if (idQuery?.length) filters.push(inArray(luxembourgLocalities.id, idQuery));
  if (municipalityIdQuery?.length)
    filters.push(
      inArray(luxembourgLocalities.municipalityId, municipalityIdQuery)
    );
  if (!!nameQuery) filters.push(ilike(luxembourgLocalities.name, nameQuery));
  if (!!nameContainsQuery)
    filters.push(ilike(luxembourgLocalities.name, `%${nameContainsQuery}%`));

  return getAllItems(context, luxembourgLocalities, and(...filters));
});
