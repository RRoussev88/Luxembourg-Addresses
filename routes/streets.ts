import { and, eq, ilike, inArray, type SQLWrapper } from "drizzle-orm";
import { Hono } from "hono";

import { db } from "../database";
import {
  luxembourgMunicipalities,
  luxembourgLocalities,
  luxembourgStreets,
} from "../schema";
import { getAllItems, getItemById } from "../utils";

export const streetsRoute = new Hono();

streetsRoute.get("/:id", (context) =>
  getItemById(context, async (id: number) =>
    (
      await db
        .select({
          id: luxembourgStreets.id,
          name: luxembourgStreets.name,
          calcrId: luxembourgStreets.calcrId,
          localityId: luxembourgStreets.localityId,
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

streetsRoute.get("/", (context) => {
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
  const nameQuery = context.req.query("name");
  const nameContainsQuery = context.req.query("nameContains");
  const filters: SQLWrapper[] = [];

  if (idQuery?.length) filters.push(inArray(luxembourgStreets.id, idQuery));
  if (calcrIdQuery?.length)
    filters.push(inArray(luxembourgStreets.calcrId, calcrIdQuery));
  if (localityIdQuery?.length)
    filters.push(inArray(luxembourgStreets.localityId, localityIdQuery));
  if (!!nameQuery) filters.push(ilike(luxembourgStreets.name, nameQuery));
  if (!!nameContainsQuery)
    filters.push(ilike(luxembourgStreets.name, `%${nameContainsQuery}%`));

  return getAllItems(context, luxembourgStreets, and(...filters));
});
