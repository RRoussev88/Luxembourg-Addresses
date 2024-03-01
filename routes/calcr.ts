import { and, eq } from "drizzle-orm";
import { Hono } from "hono";

import { db } from "../database";
import {
  calcrFeature,
  luxembourgAddressLines,
  luxembourgCommunes,
  luxembourgLocalites,
  luxembourgPostalCodes,
  luxembourgStreets,
} from "../schema";
import { GEOREFERENCED_ADDRESSES_URL, type Feature } from "../utils";

export const calcrRoute = new Hono();

const getOrCreateFeature = async (feature: Feature) => {
  const { geometry, properties } = feature;

  const existingFeatures = await db
    .select()
    .from(calcrFeature)
    .where(
      and(
        eq(calcrFeature.rue, properties.rue),
        eq(calcrFeature.numero, properties.numero),
        eq(calcrFeature.localite, properties.localite),
        eq(calcrFeature.codePostal, Number(properties.code_postal)),
        eq(calcrFeature.idCaclrRue, Number(properties.id_caclr_rue)),
        eq(calcrFeature.idCaclrBat, Number(properties.id_caclr_bat)),
        eq(calcrFeature.idGeoportail, properties.id_geoportail),
        eq(calcrFeature.commune, properties.commune),
        eq(calcrFeature.lau, Number(properties.lau2)),
        eq(calcrFeature.latitude, geometry.coordinates[0]),
        eq(calcrFeature.longitude, geometry.coordinates[1])
      )
    );

  console.log("existingFeatures: ", existingFeatures);
  if (existingFeatures.length) return existingFeatures.pop();

  const featureRecord = await db
    .insert(calcrFeature)
    .values({
      rue: properties.rue,
      numero: properties.numero,
      localite: properties.localite,
      codePostal: Number(properties.code_postal),
      idCaclrRue: Number(properties.id_caclr_rue),
      idCaclrBat: Number(properties.id_caclr_bat),
      idGeoportail: properties.id_geoportail,
      commune: properties.commune,
      lau: Number(properties.lau2),
      latitude: geometry.coordinates[0],
      longitude: geometry.coordinates[1],
    })
    .returning();
  console.log("featureRecord: ", featureRecord);
};

const getOrCreateCommune = async (name: string, calcrId: string) => {
  const existingCommunes = await db
    .select({ id: luxembourgCommunes.id })
    .from(luxembourgCommunes)
    .where(eq(luxembourgCommunes.calcrId, Number(calcrId)));

  console.log("existingCommunes: ", existingCommunes);
  if (existingCommunes.length) return existingCommunes.pop()?.id ?? -1;

  const newCommunes = await db
    .insert(luxembourgCommunes)
    .values({
      name,
      calcrId: Number(calcrId),
    })
    .onConflictDoUpdate({
      target: luxembourgCommunes.calcrId,
      set: { name },
    })
    .returning({ id: luxembourgCommunes.id });

  console.log("newCommunes: ", newCommunes);
  return newCommunes.pop()?.id ?? -1;
};

const getOrCreateLocalite = async (name: string, communeId: number) => {
  const existingLocalites = await db
    .select({ id: luxembourgLocalites.id })
    .from(luxembourgLocalites)
    .where(
      and(
        eq(luxembourgLocalites.name, name),
        eq(luxembourgLocalites.communeId, communeId)
      )
    );

  console.log("existingLocalites: ", existingLocalites);
  if (existingLocalites.length) return existingLocalites.pop()?.id ?? -1;

  const newLocalites = await db
    .insert(luxembourgLocalites)
    .values({ name, communeId })
    .onConflictDoUpdate({
      target: [luxembourgLocalites.name, luxembourgLocalites.communeId],
      set: { communeId },
    })
    .returning({ id: luxembourgLocalites.id });

  console.log("newLocalites: ", newLocalites);
  return newLocalites.pop()?.id ?? -1;
};

const getOrCreatePostalCode = async (code: string, localiteId: number) => {
  const existingPostalCodes = await db
    .select({ id: luxembourgPostalCodes.id })
    .from(luxembourgPostalCodes)
    .where(eq(luxembourgPostalCodes.code, code));

  console.log("existingPostalCodes: ", existingPostalCodes);
  if (existingPostalCodes.length) return existingPostalCodes.pop()?.id ?? -1;

  const newPostCodes = await db
    .insert(luxembourgPostalCodes)
    .values({ code, localiteId })
    .onConflictDoUpdate({
      target: luxembourgPostalCodes.code,
      set: { localiteId },
    })
    .returning({ id: luxembourgPostalCodes.id });

  console.log("newPostCodes: ", newPostCodes);
  return newPostCodes.pop()?.id ?? -1;
};

const getOrCreateStreet = async (
  name: string,
  calcrId: string,
  localiteId: number
) => {
  const existingStreets = await db
    .select({ id: luxembourgStreets.id })
    .from(luxembourgStreets)
    .where(eq(luxembourgStreets.calcrId, Number(calcrId)));

  console.log("luxembourgStreets: ", existingStreets);
  if (existingStreets.length) return existingStreets.pop()?.id ?? -1;

  const newStreets = await db
    .insert(luxembourgStreets)
    .values({
      name,
      calcrId: Number(calcrId),
      localiteId,
    })
    .onConflictDoUpdate({
      target: luxembourgStreets.calcrId,
      set: { name, localiteId },
    })
    .returning({ id: luxembourgStreets.id });

  console.log("newStreets: ", newStreets);
  return newStreets.pop()?.id ?? -1;
};

const getOrCreateAddressLine = async (
  line: string,
  calcrId: string,
  idGeoportail: string,
  latitude: number,
  longitude: number,
  streetId: number,
  postalCodeId: number
) => {
  const existingAddressLines = await db
    .select({ id: luxembourgAddressLines.id })
    .from(luxembourgAddressLines)
    .where(eq(luxembourgAddressLines.calcrId, Number(calcrId)));

  console.log("existingAddressLines: ", existingAddressLines);
  if (existingAddressLines.length) return existingAddressLines.pop()?.id ?? -1;

  const newAddressLines = await db
    .insert(luxembourgAddressLines)
    .values({
      line,
      calcrId: Number(calcrId),
      idGeoportail,
      latitude,
      longitude,
      streetId,
      postalCodeId,
    })
    .onConflictDoUpdate({
      target: luxembourgAddressLines.calcrId,
      set: {
        line,
        idGeoportail,
        latitude,
        longitude,
        streetId,
        postalCodeId,
      },
    })
    .returning({ id: luxembourgAddressLines.id });

  console.log("newAddressLines: ", newAddressLines);
  return newAddressLines.pop()?.id ?? -1;
};

calcrRoute.get("/", async (context) => {
  const response = await fetch(GEOREFERENCED_ADDRESSES_URL);
  const data: { features: Feature[] } = await response.json();
  console.log("DATA: " + data.features.length);

  for (const feature of data.features) {
    await getOrCreateFeature(feature);

    const { geometry, properties } = feature;

    const newCommuneId = await getOrCreateCommune(
      properties.commune,
      properties.lau2
    );

    const newLocaliteId = await getOrCreateLocalite(
      properties.localite,
      newCommuneId
    );

    const newPostCodeId = await getOrCreatePostalCode(
      properties.code_postal,
      newLocaliteId
    );

    const newStreetId = await getOrCreateStreet(
      properties.rue,
      properties.id_caclr_rue,
      newLocaliteId
    );

    await getOrCreateAddressLine(
      properties.numero,
      properties.id_caclr_bat,
      properties.id_geoportail,
      geometry.coordinates[0],
      geometry.coordinates[1],
      newStreetId,
      newPostCodeId
    );
  }

  return context.json({ total: data.features?.length ?? 0 });
});
