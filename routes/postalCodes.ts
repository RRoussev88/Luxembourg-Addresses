import { and, eq, ilike, inArray, type SQLWrapper } from "drizzle-orm";
import { Hono } from "hono";

import { db } from "../database";
import {
  luxembourgCommunes,
  luxembourgLocalites,
  luxembourgPostalCodes,
} from "../schema";
import { getAllItems, getItemById } from "../utils";

export const postalCodesRoute = new Hono();

postalCodesRoute.get("/:id", (context) =>
  getItemById(
    context,
    async (id: number) =>
      await db
        .select({
          id: luxembourgPostalCodes.id,
          code: luxembourgPostalCodes.code,
          localityId: luxembourgPostalCodes.localiteId,
          locality: {
            id: luxembourgLocalites.id,
            name: luxembourgLocalites.name,
            communeId: luxembourgCommunes.id,
            commune: {
              id: luxembourgCommunes.id,
              // @ts-ignore
              name: luxembourgCommunes.name,
              calcrId: luxembourgCommunes.calcrId,
            },
          },
        })
        .from(luxembourgPostalCodes)
        .innerJoin(
          luxembourgLocalites,
          eq(luxembourgPostalCodes.localiteId, luxembourgLocalites.id)
        )
        .innerJoin(
          luxembourgCommunes,
          eq(luxembourgLocalites.communeId, luxembourgCommunes.id)
        )
        .where(eq(luxembourgPostalCodes.id, Number(id)))
        .limit(1)
  )
);

postalCodesRoute.get("/", (context) => {
  const idQuery = context.req
    .queries("id")
    ?.filter((id) => !isNaN(Number(id)))
    .map(Number);
  const localityIdQuery = context.req
    .queries("localityId")
    ?.filter((id) => !isNaN(Number(id)))
    .map(Number);
  const codeQuery = context.req.query("code");
  const codeContainsQuery = context.req.query("codeContains");
  const filters: SQLWrapper[] = [];

  if (idQuery?.length) filters.push(inArray(luxembourgPostalCodes.id, idQuery));
  if (localityIdQuery?.length)
    filters.push(inArray(luxembourgPostalCodes.localiteId, localityIdQuery));
  if (!!codeQuery) filters.push(ilike(luxembourgPostalCodes.code, codeQuery));
  if (!!codeContainsQuery)
    filters.push(ilike(luxembourgPostalCodes.code, `%${codeContainsQuery}%`));

  return getAllItems(context, luxembourgPostalCodes, and(...filters));
});
