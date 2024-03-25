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

const geocodeSearch = {
  name: "8A , Rue de l'Eglise 5355 Oetrange",
  accuracy: 8,
  address: "8A, Rue de l'Eglise 5355 Oetrange",
  "matching street": "Rue de l'Eglise",
  ratio: 0.42857142857142855,
  easting: 86755.6978000002,
  northing: 73841.26589954617,
  geom: { type: "Point", coordinates: [86755.6978, 73841.265899546] },
  geomlonlat: { type: "Point", coordinates: [6.261574525, 49.599172874] },
  AddressDetails: {
    postnumber: "8A",
    street: "Rue de l'Eglise",
    zip: "5355",
    locality: "Oetrange",
    id_caclr_street: "2640",
    id_caclr_building: "99700",
    id_caclr_locality: "91",
  },
};

const geocodeReverse = {
  id_caclr_locality: "1",
  id_caclr_street: "11",
  id_caclr_bat: "253",
  street: "Avenue de la Faïencerie",
  number: "145",
  locality: "Luxembourg",
  postal_code: "1511",
  country: "Luxembourg",
  country_code: "lu",
  distance: 5.93773922157227,
  contributor: "ACT",
  geom: { type: "Point", coordinates: [75983.5639, 76344.669599546] },
  geomlonlat: { type: "Point", coordinates: [6.112537711, 49.621706525] },
};

export type Feature = typeof exampleFeature;

type GeocodeSearch = typeof geocodeSearch;
export type GeocodeSearchResponse = {
  success: boolean;
  count: number;
  request:
    | {
        zip: string;
        locality: string;
        country: string;
        street: string;
        num: string;
      }
    | string;
  results: GeocodeSearch[];
};

type GeocodeReverse = typeof geocodeReverse;
export type GeocodeReverseResponse = {
  count: number;
  results: GeocodeReverse[];
};

export const toNumSafe = (numString?: unknown) =>
  isNaN(Number(numString)) || [null, undefined].includes(numString as null)
    ? numString
    : Number(numString);

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

  const excludeColumns = ["createdAt", "updatedAt", "verifiedAt"];
  const tableSelect = Object.keys(table).reduce(
    (acc, key) =>
      excludeColumns.includes(key)
        ? acc
        : { ...acc, [key]: table[key as keyof typeof table] },
    {}
  );

  const query = db.select(tableSelect).from(table).$dynamic();
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

export const NO_RSULT_IDS = [-1];
