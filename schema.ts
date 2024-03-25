import {
  doublePrecision,
  integer,
  pgTable,
  primaryKey,
  serial,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const luxembourgMunicipalities = pgTable(
  "luxembourg_municipalities",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 50 }),
    calcrId: integer("calcr_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    verifiedAt: timestamp("verified_at").notNull().defaultNow(),
  },
  (munic) => ({
    calcrIndex: uniqueIndex("municipality_calcr_idx").on(munic.calcrId),
  })
);

export const luxembourgLocalities = pgTable(
  "luxembourg_localities",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 50 }),
    municipalityId: integer("municipality_id")
      .notNull()
      .references(() => luxembourgMunicipalities.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    verifiedAt: timestamp("verified_at").notNull().defaultNow(),
  },
  (locality) => ({
    nameMunicipalityIndex: uniqueIndex("locality_name_municipality_idx").on(
      locality.name,
      locality.municipalityId
    ),
  })
);

export const luxembourgPostalCodes = pgTable(
  "luxembourg_postal_codes",
  {
    id: serial("id").primaryKey(),
    code: varchar("code", { length: 10 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    verifiedAt: timestamp("verified_at").notNull().defaultNow(),
  },
  (postCode) => ({
    postCodeIndex: uniqueIndex("post_code_idx").on(postCode.code),
  })
);

export const localitiesToPostalCodes = pgTable(
  "localities_to_postal_codes",
  {
    localityId: integer("locality_id")
      .notNull()
      .references(() => luxembourgLocalities.id),
    postalCodeId: integer("postal_code_id")
      .notNull()
      .references(() => luxembourgPostalCodes.id),
  },
  (record) => ({
    pk: primaryKey({
      name: "composite_key",
      columns: [record.localityId, record.postalCodeId],
    }),
  })
);

export const luxembourgStreets = pgTable(
  "luxembourg_streets",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 50 }),
    calcrId: integer("calcr_id"),
    localityId: integer("locality_id")
      .notNull()
      .references(() => luxembourgLocalities.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    verifiedAt: timestamp("verified_at").notNull().defaultNow(),
  },
  (street) => ({
    calcrIndex: uniqueIndex("street_calcr_idx").on(street.calcrId),
  })
);

export const luxembourgAddressLines = pgTable(
  "luxembourg_address_lines",
  {
    id: serial("id").primaryKey(),
    line: varchar("line", { length: 10 }),
    calcrId: integer("calcr_id"),
    idGeoportal: varchar("id_geoportal", { length: 50 }),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    streetId: integer("street_id")
      .notNull()
      .references(() => luxembourgStreets.id),
    postalCodeId: integer("postal_code_id")
      .notNull()
      .references(() => luxembourgPostalCodes.id),
    localityId: integer("locality_id")
      .notNull()
      .references(() => luxembourgLocalities.id),
    municipalityId: integer("municipality_id")
      .notNull()
      .references(() => luxembourgMunicipalities.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    verifiedAt: timestamp("verified_at").notNull().defaultNow(),
  },
  (addressLine) => ({
    calcrIndex: uniqueIndex("address_line_calcr_idx").on(addressLine.calcrId),
  })
);

export const calcrFeature = pgTable("calcr_feature", {
  id: serial("id").primaryKey(),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  rue: varchar("rue", { length: 50 }),
  numero: varchar("numero", { length: 10 }),
  localite: varchar("localite", { length: 30 }),
  codePostal: integer("code_postal"),
  idCaclrRue: integer("id_caclr_rue"),
  idCaclrBat: integer("id_caclr_bat"),
  idGeoportail: varchar("id_geoportail", { length: 50 }),
  commune: varchar("commune", { length: 30 }),
  lau: integer("lau"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type LuxembourgMunicipality =
  typeof luxembourgMunicipalities.$inferSelect;
export type LuxembourgLocality = typeof luxembourgLocalities.$inferSelect;
export type LuxembourgPostalCode = typeof luxembourgPostalCodes.$inferSelect;
export type LuxembourgStreet = typeof luxembourgStreets.$inferSelect;
export type LuxembourgAddressLine = typeof luxembourgAddressLines.$inferSelect;
export type LuxembourgSchemaTable =
  | typeof luxembourgMunicipalities
  | typeof luxembourgLocalities
  | typeof luxembourgPostalCodes
  | typeof luxembourgStreets
  | typeof luxembourgAddressLines;
