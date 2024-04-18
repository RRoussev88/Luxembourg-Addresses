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
