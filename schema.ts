import {
  doublePrecision,
  integer,
  pgTable,
  serial,
  varchar,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const luxembourgCommunes = pgTable(
  "luxembourg_communes",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }),
    calcrId: integer("calcr_id"),
  },
  (commune) => ({
    calcrIndex: uniqueIndex("commune_calcr_idx").on(commune.calcrId),
  })
);

export const luxembourgLocalites = pgTable(
  "luxembourg_localites",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }),
    communeId: integer("commune_id")
      .notNull()
      .references(() => luxembourgCommunes.id),
  },
  (localite) => ({
    nameCommuneIndex: uniqueIndex("localite_name_commune_idx").on(
      localite.name,
      localite.communeId
    ),
  })
);

export const luxembourgPostalCodes = pgTable(
  "luxembourg_postal_codes",
  {
    id: serial("id").primaryKey(),
    code: varchar("code", { length: 10 }),
    localiteId: integer("localite_id")
      .notNull()
      .references(() => luxembourgLocalites.id),
  },
  (postCode) => ({
    postCodeIndex: uniqueIndex("post_code_idx").on(postCode.code),
  })
);

export const luxembourgStreets = pgTable(
  "luxembourg_streets",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }),
    calcrId: integer("calcr_id"),
    localiteId: integer("localite_id")
      .notNull()
      .references(() => luxembourgLocalites.id),
  },
  (street) => ({
    calcrIndex: uniqueIndex("street_calcr_idx").on(street.calcrId),
  })
);

export const luxembourgAddressLines = pgTable(
  "luxembourg_address_lines",
  {
    id: serial("id").primaryKey(),
    line: varchar("line", { length: 100 }),
    calcrId: integer("calcr_id"),
    idGeoportail: varchar("id_geoportail", { length: 100 }),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    streetId: integer("street_id")
      .notNull()
      .references(() => luxembourgStreets.id),
    postalCodeId: integer("postal_code_id")
      .notNull()
      .references(() => luxembourgPostalCodes.id),
  },
  (addressLine) => ({
    calcrIndex: uniqueIndex("address_line_calcr_idx").on(addressLine.calcrId),
  })
);

export const calcrFeature = pgTable("calcr_feature", {
  id: serial("id").primaryKey(),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  rue: varchar("rue", { length: 100 }),
  numero: varchar("numero", { length: 10 }),
  localite: varchar("localite", { length: 50 }),
  codePostal: integer("code_postal"),
  idCaclrRue: integer("id_caclr_rue"),
  idCaclrBat: integer("id_caclr_bat"),
  idGeoportail: varchar("id_geoportail", { length: 100 }),
  commune: varchar("commune", { length: 50 }),
  lau: integer("lau"),
});

export type LuxembourgCommune = typeof luxembourgCommunes.$inferSelect;
export type LuxembourgLocalite = typeof luxembourgLocalites.$inferSelect;
export type LuxembourgPostalCode = typeof luxembourgPostalCodes.$inferSelect;
export type LuxembourgStreet = typeof luxembourgStreets.$inferSelect;
export type LuxembourgAddressLine = typeof luxembourgAddressLines.$inferSelect;
export type LuxembourgSchemaTable =
  | typeof luxembourgCommunes
  | typeof luxembourgLocalites
  | typeof luxembourgPostalCodes
  | typeof luxembourgStreets
  | typeof luxembourgAddressLines;
