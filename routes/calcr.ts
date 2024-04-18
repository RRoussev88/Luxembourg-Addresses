import { and, count, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { db } from "../database";
import {
  calcrFeature,
  localitiesToPostalCodes,
  luxembourgAddressLines,
  luxembourgLocalities,
  luxembourgMunicipalities,
  luxembourgPostalCodes,
  luxembourgStreets,
  synchronization,
} from "../schema";
import type { Feature } from "../types";
import { getDateTimeNow } from "../utils";

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

const getOrCreateMunicipality = async (name: string, calcrId: string) => {
  const existingMunicipalities = await db
    .select()
    .from(luxembourgMunicipalities)
    .where(eq(luxembourgMunicipalities.calcrId, Number(calcrId)));

  const newDate = getDateTimeNow();
  if (existingMunicipalities.length) {
    const municipality = existingMunicipalities.pop();
    const municipalityId = municipality?.id ?? -1;

    if (municipality?.name !== name) {
      await db
        .update(luxembourgMunicipalities)
        .set({ name, updatedAt: newDate, verifiedAt: newDate })
        .where(eq(luxembourgMunicipalities.id, municipalityId));
    } else {
      await db
        .update(luxembourgMunicipalities)
        .set({ verifiedAt: newDate })
        .where(eq(luxembourgMunicipalities.id, municipalityId));
    }

    return municipalityId;
  }

  const newMunicipalities = await db
    .insert(luxembourgMunicipalities)
    .values({ name, calcrId: Number(calcrId) })
    .onConflictDoUpdate({
      target: luxembourgMunicipalities.calcrId,
      set: { name, updatedAt: newDate },
    })
    .returning({ id: luxembourgMunicipalities.id });

  console.log("newMunicipalities: ", newMunicipalities);
  return newMunicipalities.pop()?.id ?? -1;
};

const getOrCreateLocality = async (name: string, municipalityId: number) => {
  const existingMunicipalityId = (
    await db
      .select({ munId: luxembourgMunicipalities.id })
      .from(calcrFeature)
      .innerJoin(
        luxembourgMunicipalities,
        eq(luxembourgMunicipalities.calcrId, calcrFeature.lau)
      )
      .where(eq(calcrFeature.localite, name))
      .groupBy(calcrFeature.lau, luxembourgMunicipalities.id)
      .orderBy(desc(count(calcrFeature.lau)))
      .limit(1)
  ).pop()?.munId;

  const newLocalities = await db
    .insert(luxembourgLocalities)
    .values({ name, municipalityId: existingMunicipalityId ?? municipalityId })
    .onConflictDoUpdate({
      target: [luxembourgLocalities.name, luxembourgLocalities.municipalityId],
      set: { verifiedAt: getDateTimeNow() },
    })
    .returning({ id: luxembourgLocalities.id });

  console.log("newLocalities: ", newLocalities);
  return newLocalities.pop()?.id ?? -1;
};

const getOrCreatePostalCode = async (code: string, localityId: number) => {
  const existingPostalCodes = await db
    .select()
    .from(luxembourgPostalCodes)
    .where(eq(luxembourgPostalCodes.code, code));

  const newDate = getDateTimeNow();
  if (existingPostalCodes.length) {
    const postalCodeId = existingPostalCodes.pop()?.id ?? -1;

    await db
      .update(luxembourgPostalCodes)
      .set({ verifiedAt: newDate })
      .where(eq(luxembourgPostalCodes.id, postalCodeId));

    await db
      .insert(localitiesToPostalCodes)
      .values({ localityId, postalCodeId })
      .onConflictDoNothing();

    return postalCodeId;
  }

  const newPostCodes = await db
    .insert(luxembourgPostalCodes)
    .values({ code })
    .onConflictDoUpdate({
      target: luxembourgPostalCodes.code,
      set: { verifiedAt: newDate },
    })
    .returning({ id: luxembourgPostalCodes.id });

  const newPostalCodeId = newPostCodes.pop()?.id ?? -1;
  await db
    .insert(localitiesToPostalCodes)
    .values({ localityId, postalCodeId: newPostalCodeId })
    .onConflictDoNothing();

  console.log("newPostCodes: ", newPostCodes);
  return newPostalCodeId;
};

const getOrCreateStreet = async (
  name: string,
  calcrId: string,
  localityId: number
) => {
  const existingLocalityId = (
    await db
      .select({ locId: luxembourgLocalities.id })
      .from(calcrFeature)
      .innerJoin(
        luxembourgLocalities,
        eq(luxembourgLocalities.name, calcrFeature.localite)
      )
      .where(eq(calcrFeature.idCaclrRue, Number(calcrId)))
      .groupBy(calcrFeature.localite, luxembourgLocalities.id)
      .orderBy(desc(count(calcrFeature.localite)))
      .limit(1)
  ).pop()?.locId;

  const existingStreets = await db
    .select()
    .from(luxembourgStreets)
    .where(eq(luxembourgStreets.calcrId, Number(calcrId)));

  const newDate = getDateTimeNow();
  if (existingStreets.length) {
    const street = existingStreets.pop();
    const streetId = street?.id ?? -1;

    if (street?.name !== name || street.localityId !== localityId) {
      await db
        .update(luxembourgStreets)
        .set({
          name,
          localityId: existingLocalityId ?? localityId,
          updatedAt: newDate,
          verifiedAt: newDate,
        })
        .where(eq(luxembourgStreets.id, streetId));
    } else {
      await db
        .update(luxembourgStreets)
        .set({
          localityId: existingLocalityId ?? localityId,
          verifiedAt: newDate,
        })
        .where(eq(luxembourgStreets.id, streetId));
    }

    return streetId;
  }

  const newStreets = await db
    .insert(luxembourgStreets)
    .values({ name, calcrId: Number(calcrId), localityId })
    .onConflictDoUpdate({
      target: luxembourgStreets.calcrId,
      set: {
        name,
        localityId: existingLocalityId ?? localityId,
        updatedAt: newDate,
        verifiedAt: newDate,
      },
    })
    .returning({ id: luxembourgStreets.id });

  console.log("newStreets: ", newStreets);
  return newStreets.pop()?.id ?? -1;
};

const getOrCreateAddressLine = async (
  line: string,
  calcrId: string,
  idGeoportal: string,
  latitude: number,
  longitude: number,
  streetId: number,
  postalCodeId: number,
  locality: string,
  municipalityCalcrId: string
) => {
  const existingAddressLines = await db
    .select()
    .from(luxembourgAddressLines)
    .where(eq(luxembourgAddressLines.calcrId, Number(calcrId)));

  const localityId =
    (
      await db
        .select({ id: luxembourgLocalities.id })
        .from(luxembourgLocalities)
        .where(eq(luxembourgLocalities.name, locality))
    ).pop()?.id ?? -1;

  const municipalityId =
    (
      await db
        .select({ id: luxembourgMunicipalities.id })
        .from(luxembourgMunicipalities)
        .where(
          eq(luxembourgMunicipalities.calcrId, Number(municipalityCalcrId))
        )
    ).pop()?.id ?? -1;

  const newDate = getDateTimeNow();
  if (existingAddressLines.length) {
    const addressLine = existingAddressLines.pop();
    const addressLineId = addressLine?.id ?? -1;

    if (
      addressLine?.line !== line ||
      addressLine.idGeoportal !== idGeoportal ||
      addressLine.latitude !== latitude ||
      addressLine.longitude !== longitude ||
      addressLine.streetId !== streetId ||
      addressLine.postalCodeId !== postalCodeId ||
      addressLine.localityId !== localityId ||
      addressLine.municipalityId !== municipalityId
    ) {
      await db
        .update(luxembourgAddressLines)
        .set({
          line,
          idGeoportal,
          latitude,
          longitude,
          streetId,
          postalCodeId,
          localityId,
          municipalityId,
          updatedAt: newDate,
          verifiedAt: newDate,
        })
        .where(eq(luxembourgAddressLines.id, addressLineId));
    } else {
      await db
        .update(luxembourgAddressLines)
        .set({ verifiedAt: newDate })
        .where(eq(luxembourgAddressLines.id, addressLineId));
    }

    return addressLineId;
  }

  const newAddressLines = await db
    .insert(luxembourgAddressLines)
    .values({
      line,
      calcrId: Number(calcrId),
      idGeoportal,
      latitude,
      longitude,
      streetId,
      postalCodeId,
      localityId,
      municipalityId,
    })
    .onConflictDoUpdate({
      target: luxembourgAddressLines.calcrId,
      set: {
        line,
        idGeoportal,
        latitude,
        longitude,
        streetId,
        postalCodeId,
        updatedAt: newDate,
        verifiedAt: newDate,
      },
    })
    .returning({ id: luxembourgAddressLines.id });

  console.log("newAddressLines: ", newAddressLines);
  return newAddressLines.pop()?.id ?? -1;
};

calcrRoute.get("/", async (context) => {
  const url = process.env.GEOREFERENCED_ADDRESSES_URL;
  if (!url) {
    throw new HTTPException(404, { message: "URL is not set" });
  }

  const startSyncTime = getDateTimeNow();
  const response = await fetch(url);
  const data: { features: Feature[] } = await response.json();
  console.log("DATA: " + data.features.length);

  for (const feature of data.features) {
    await getOrCreateFeature(feature);

    const { geometry, properties } = feature;

    const newMunicipalityId = await getOrCreateMunicipality(
      properties.commune,
      properties.lau2
    );

    const newLocalityId = await getOrCreateLocality(
      properties.localite,
      newMunicipalityId
    );

    const newPostCodeId = await getOrCreatePostalCode(
      properties.code_postal,
      newLocalityId
    );

    const newStreetId = await getOrCreateStreet(
      properties.rue,
      properties.id_caclr_rue,
      newLocalityId
    );

    await getOrCreateAddressLine(
      properties.numero,
      properties.id_caclr_bat,
      properties.id_geoportail,
      geometry.coordinates[0],
      geometry.coordinates[1],
      newStreetId,
      newPostCodeId,
      properties.localite,
      properties.lau2
    );
  }

  await db.insert(synchronization).values({ startedAt: startSyncTime });

  return context.json({ total: data.features?.length ?? 0 });
});
