import { and, eq, ilike, inArray, type SQLWrapper } from "drizzle-orm";
import { Hono } from "hono";

import { db } from "../database";
import {
  luxembourgMunicipalities,
  luxembourgLocalities,
  luxembourgPostalCodes,
} from "../schema";
import { getAllItems, getItemById } from "../utils";

export const postalCodesRoute = new Hono();

postalCodesRoute.get("/:id", (context) =>
  getItemById(context, async (id: number) =>
    (
      await db
        .select({
          id: luxembourgPostalCodes.id,
          code: luxembourgPostalCodes.code,
          municipalityId: luxembourgPostalCodes.municipalityId,
          municipality: {
            id: luxembourgMunicipalities.id,
            name: luxembourgMunicipalities.name,
            calcrId: luxembourgMunicipalities.calcrId,
          },
        })
        .from(luxembourgPostalCodes)
        .innerJoin(
          luxembourgMunicipalities,
          eq(luxembourgLocalities.municipalityId, luxembourgMunicipalities.id)
        )
        .where(eq(luxembourgPostalCodes.id, Number(id)))
        .limit(1)
    ).pop()
  )
);

postalCodesRoute.get("/", (context) => {
  const idQuery = context.req
    .queries("id")
    ?.filter((id) => !isNaN(Number(id)))
    .map(Number);
  const municipalityIdQuery = context.req
    .queries("municipalityId")
    ?.filter((id) => !isNaN(Number(id)))
    .map(Number);
  const codeQuery = context.req.query("code");
  const codeContainsQuery = context.req.query("codeContains");
  const filters: SQLWrapper[] = [];

  if (idQuery?.length) filters.push(inArray(luxembourgPostalCodes.id, idQuery));
  if (municipalityIdQuery?.length)
    filters.push(
      inArray(luxembourgPostalCodes.municipalityId, municipalityIdQuery)
    );
  if (!!codeQuery) filters.push(ilike(luxembourgPostalCodes.code, codeQuery));
  if (!!codeContainsQuery)
    filters.push(ilike(luxembourgPostalCodes.code, `%${codeContainsQuery}%`));

  return getAllItems(context, luxembourgPostalCodes, and(...filters));
});
