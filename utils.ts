import { asc, desc, SQL, count } from "drizzle-orm";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";

import { db } from "./database";
import type { LuxembourgSchemaTable } from "./schema";

export const toNumSafe = (numString?: unknown) =>
  isNaN(Number(numString)) || [null, undefined].includes(numString as null)
    ? numString
    : Number(numString);

const getLimit = (context: Context): number =>
  isNaN(Number(context.req.query("limit")))
    ? 25
    : Number(context.req.query("limit"));

const getOffset = (context: Context): number =>
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

const getOrderingSql = (context: Context, table: object): SQL[] => {
  const orderingParams = context.req.queries("orderBy");
  const tableKeys = Object.keys(table);

  const allowedOrderingParams = orderingParams?.filter((par) =>
    par.startsWith("-")
      ? tableKeys.includes(par.slice(1))
      : tableKeys.includes(par)
  ) ?? ["id"];

  return allowedOrderingParams.map((par) =>
    par.startsWith("-")
      ? desc(table[par.slice(1) as keyof typeof table])
      : asc(table[par as keyof typeof table])
  );
};

export const getAllItems = async (
  context: Context,
  table: LuxembourgSchemaTable,
  sql?: SQL
) => {
  const limit = getLimit(context);
  const offset = getOffset(context);

  const totalQuery = db.select({ total: count() }).from(table).$dynamic();

  const excludeColumns = ["createdAt", "updatedAt", "verifiedAt"];
  const tableSelect = Object.keys(table).reduce(
    (acc, key) =>
      excludeColumns.includes(key)
        ? acc
        : { ...acc, [key]: table[key as keyof typeof table] },
    {}
  );
  const ordering: SQL[] = getOrderingSql(context, tableSelect);
  const query = db.select(tableSelect).from(table).$dynamic();
  if (sql) {
    query.where(sql);
    totalQuery.where(sql);
  }
  const total = (await totalQuery).pop()?.total ?? 0;
  const items = await query
    .limit(limit)
    .offset(offset)
    .orderBy(...ordering);

  return context.json({
    count: items.length,
    limit,
    offset,
    total,
    items,
  });
};

export const NO_RSULT_IDS = [-1];

export const getDateTimeNow = () => {
  const newDate = new Date();
  newDate.setTime(newDate.getTime() - newDate.getTimezoneOffset() * 60_000);

  return newDate;
};
