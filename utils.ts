import { SQL, count } from "drizzle-orm";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";

import { db } from "./database";
import type { LuxembourgSchemaTable } from "./schema";

const exampleFeature = {
  type: "Feature",
  geometry: {
    type: "Point",
    coordinates: [6.062940933927628, 50.0948939650967],
  },
  properties: {
    rue: "Kaesfurterstrooss",
    numero: "20",
    localite: "Hupperdange",
    code_postal: "9755",
    id_caclr_rue: "7984",
    id_caclr_bat: "210309",
    id_geoportail: "058F00436002710_7984_20",
    commune: "Clervaux",
    lau2: "0501",
  },
};

export type Feature = typeof exampleFeature;

export const getLimit = (context: Context): number =>
  isNaN(Number(context.req.query("limit")))
    ? 25
    : Number(context.req.query("limit"));

export const getOffset = (context: Context): number =>
  isNaN(Number(context.req.query("offset")))
    ? 0
    : Number(context.req.query("offset"));

export const getItemById = async (
  context: Context,
  getItemFromDb: (id: number) => Promise<any>
) => {
  const id = context.req.param("id");
  if (isNaN(Number(id))) {
    throw new HTTPException(404, { message: "Invalid item ID" });
  }

  const item = await getItemFromDb(Number(id));

  if (!item) {
    throw new HTTPException(404, { message: "Resource is not found" });
  }

  return context.json(item);
};

export const getAllItems = async (
  context: Context,
  table: LuxembourgSchemaTable,
  sql?: SQL
) => {
  const limit = getLimit(context);
  const offset = getOffset(context);

  const totalQuery = db.select({ total: count() }).from(table).$dynamic();
  const query = db.select().from(table).$dynamic();
  if (sql) {
    query.where(sql);
    totalQuery.where(sql);
  }
  const total = (await totalQuery).pop()?.total ?? 0;
  const items = await query.limit(limit).offset(offset);

  return context.json({
    count: items.length,
    limit,
    offset,
    total,
    items,
  });
};
