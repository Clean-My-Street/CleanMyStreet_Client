import Constants from "expo-constants";

const OVERPASS_ENDPOINT = "https://overpass-api.de/api/interpreter";
const GOOGLE_PLACES_ENDPOINT =
  "https://places.googleapis.com/v1/places:searchNearby";
const SEARCH_RADIUS_METERS = 25_000;
const MAX_GOOGLE_RESULTS = 20;

type Coordinates = {
  latitude: number;
  longitude: number;
};

type FacilitySource = "Google Places" | "OpenStreetMap";

export type NearbyWasteFacility = {
  id: string;
  name: string;
  category: string;
  address: string | null;
  latitude: number;
  longitude: number;
  distanceKm: number;
  phoneNumber: string | null;
  rating: number | null;
  source: FacilitySource | "Google Places and OpenStreetMap";
  mapsUrl: string;
};

export type NearbyWasteFacilitySearchResult = {
  facilities: NearbyWasteFacility[];
  errors: string[];
};

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function isValidCoordinates(coordinates: Coordinates): boolean {
  return (
    Number.isFinite(coordinates.latitude) &&
    coordinates.latitude >= -90 &&
    coordinates.latitude <= 90 &&
    Number.isFinite(coordinates.longitude) &&
    coordinates.longitude >= -180 &&
    coordinates.longitude <= 180
  );
}

function getGooglePlacesApiKey(): string | null {
  const value = Constants.expoConfig?.extra?.googlePlacesApiKey;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function isGooglePlacesConfigured(): boolean {
  return getGooglePlacesApiKey() !== null;
}

function distanceBetweenKm(
  first: Coordinates,
  second: Coordinates,
): number {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDifference = radians(second.latitude - first.latitude);
  const longitudeDifference = radians(second.longitude - first.longitude);
  const calculation =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(radians(first.latitude)) *
      Math.cos(radians(second.latitude)) *
      Math.sin(longitudeDifference / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(calculation), Math.sqrt(1 - calculation));
}

function osmCategory(tags: UnknownRecord): string {
  if (tags.landuse === "landfill" || tags.industrial === "landfill") {
    return "Landfill";
  }
  if (tags.amenity === "recycling") return "Recycling centre";
  if (tags.amenity === "waste_disposal" || tags.waste === "disposal") {
    return "Waste disposal site";
  }
  if (tags.waste === "transfer_station") return "Waste transfer station";
  return "Waste management facility";
}

function osmAddress(tags: UnknownRecord): string | null {
  if (typeof tags["addr:full"] === "string") return tags["addr:full"];
  const parts = [
    tags["addr:housenumber"],
    tags["addr:street"],
    tags["addr:suburb"],
    tags["addr:city"],
  ].filter((part): part is string => typeof part === "string" && !!part.trim());
  return parts.length ? parts.join(", ") : null;
}

function getOsmQuery(coordinates: Coordinates): string {
  const { latitude, longitude } = coordinates;
  return `[out:json][timeout:20];
(
  nwr(around:${SEARCH_RADIUS_METERS},${latitude},${longitude})["landuse"="landfill"];
  nwr(around:${SEARCH_RADIUS_METERS},${latitude},${longitude})["industrial"="landfill"];
  nwr(around:${SEARCH_RADIUS_METERS},${latitude},${longitude})["amenity"~"^(recycling|waste_disposal)$"];
  nwr(around:${SEARCH_RADIUS_METERS},${latitude},${longitude})["amenity"="waste_transfer_station"];
  nwr(around:${SEARCH_RADIUS_METERS},${latitude},${longitude})["waste"~"^(transfer_station|disposal|landfill)$"];
  nwr(around:${SEARCH_RADIUS_METERS},${latitude},${longitude})["industrial"="waste_transfer_station"];
  nwr(around:${SEARCH_RADIUS_METERS},${latitude},${longitude})["industrial"="waste"];
);
out center tags;`;
}

function parseOsmFacilities(
  payload: unknown,
  origin: Coordinates,
): NearbyWasteFacility[] {
  if (!isRecord(payload) || !Array.isArray(payload.elements)) {
    throw new Error("OpenStreetMap returned an unexpected response.");
  }

  return payload.elements.flatMap((element: unknown) => {
    if (!isRecord(element) || !isRecord(element.tags)) return [];
    const tags = element.tags;
    const center = isRecord(element.center) ? element.center : element;
    const latitude = center.lat;
    const longitude = center.lon;
    if (
      typeof element.id !== "number" ||
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      !isValidCoordinates({ latitude, longitude })
    ) {
      return [];
    }

    const category = osmCategory(tags);
    const name =
      (typeof tags.name === "string" && tags.name.trim()) ||
      (typeof tags.operator === "string" && tags.operator.trim()) ||
      category;
    const distanceKm = distanceBetweenKm(origin, { latitude, longitude });
    if (distanceKm > SEARCH_RADIUS_METERS / 1000) return [];

    return [
      {
        id: `osm-${String(element.type)}-${element.id}`,
        name,
        category,
        address: osmAddress(tags),
        latitude,
        longitude,
        distanceKm,
        phoneNumber:
          typeof tags.phone === "string"
            ? tags.phone
            : typeof tags["contact:phone"] === "string"
              ? tags["contact:phone"]
              : null,
        rating: null,
        source: "OpenStreetMap" as const,
        mapsUrl: `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`,
      },
    ];
  });
}

function googleCategory(types: unknown): string {
  if (Array.isArray(types) && types.includes("landfill")) return "Landfill";
  if (Array.isArray(types) && types.includes("recycling_center")) {
    return "Recycling centre";
  }
  return "Waste management facility";
}

function parseGoogleFacilities(
  payload: unknown,
  origin: Coordinates,
): NearbyWasteFacility[] {
  if (!isRecord(payload)) {
    throw new Error("Google Places returned an unexpected response.");
  }
  if (!Array.isArray(payload.places)) {
    if (payload.error && isRecord(payload.error)) {
      const message = payload.error.message;
      throw new Error(
        typeof message === "string"
          ? `Google Places: ${message}`
          : "Google Places could not complete the search.",
      );
    }
    return [];
  }

  return payload.places.flatMap((place: unknown) => {
    if (
      !isRecord(place) ||
      !isRecord(place.location) ||
      !isRecord(place.displayName)
    ) {
      return [];
    }
    const { latitude, longitude } = place.location;
    const name = place.displayName.text;
    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      !isValidCoordinates({ latitude, longitude }) ||
      typeof name !== "string" ||
      !name.trim()
    ) {
      return [];
    }

    const distanceKm = distanceBetweenKm(origin, { latitude, longitude });
    if (distanceKm > SEARCH_RADIUS_METERS / 1000) return [];

    return [
      {
        id:
          typeof place.id === "string"
            ? `google-${place.id}`
            : `google-${latitude}-${longitude}-${name}`,
        name: name.trim(),
        category: googleCategory(place.types),
        address:
          typeof place.formattedAddress === "string"
            ? place.formattedAddress
            : null,
        latitude,
        longitude,
        distanceKm,
        phoneNumber:
          typeof place.nationalPhoneNumber === "string"
            ? place.nationalPhoneNumber
            : null,
        rating: typeof place.rating === "number" ? place.rating : null,
        source: "Google Places" as const,
        mapsUrl:
          typeof place.googleMapsUri === "string"
            ? place.googleMapsUri
            : `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
      },
    ];
  });
}

function normalizedName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function combineFacilitySources(
  facilities: NearbyWasteFacility[],
): NearbyWasteFacility[] {
  const combined: NearbyWasteFacility[] = [];

  for (const facility of facilities) {
    const matchingIndex = combined.findIndex((candidate) => {
      if (normalizedName(candidate.name) !== normalizedName(facility.name)) {
        return false;
      }
      return (
        distanceBetweenKm(candidate, facility) <= 0.1 &&
        candidate.source !== facility.source
      );
    });

    if (matchingIndex === -1) {
      combined.push(facility);
      continue;
    }

    const existing = combined[matchingIndex];
    const googleFacility =
      facility.source === "Google Places" ? facility : existing;
    const osmFacility =
      facility.source === "OpenStreetMap" ? facility : existing;
    combined[matchingIndex] = {
      ...osmFacility,
      ...googleFacility,
      address: googleFacility.address ?? osmFacility.address,
      phoneNumber: googleFacility.phoneNumber ?? osmFacility.phoneNumber,
      rating: googleFacility.rating ?? osmFacility.rating,
      source: "Google Places and OpenStreetMap",
    };
  }

  return combined.sort((first, second) => first.distanceKm - second.distanceKm);
}

async function fetchOsmFacilities(
  coordinates: Coordinates,
  signal: AbortSignal,
): Promise<NearbyWasteFacility[]> {
  const body = new URLSearchParams({
    data: getOsmQuery(coordinates),
  }).toString();
  const response = await fetch(OVERPASS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal,
  });
  if (!response.ok) {
    throw new Error(`OpenStreetMap search failed (${response.status}).`);
  }
  return parseOsmFacilities(await response.json(), coordinates);
}

async function fetchGoogleFacilities(
  coordinates: Coordinates,
  apiKey: string,
  signal: AbortSignal,
): Promise<NearbyWasteFacility[]> {
  const response = await fetch(GOOGLE_PLACES_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.location,places.nationalPhoneNumber,places.rating,places.googleMapsUri,places.types",
    },
    body: JSON.stringify({
      includedTypes: ["landfill", "recycling_center"],
      maxResultCount: MAX_GOOGLE_RESULTS,
      locationRestriction: {
        circle: {
          center: {
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
          },
          radius: SEARCH_RADIUS_METERS,
        },
      },
      rankPreference: "DISTANCE",
    }),
    signal,
  });
  if (!response.ok) {
    throw new Error(`Google Places search failed (${response.status}).`);
  }
  return parseGoogleFacilities(await response.json(), coordinates);
}

export async function searchNearbyWasteFacilities(
  coordinates: Coordinates,
  signal: AbortSignal,
): Promise<NearbyWasteFacilitySearchResult> {
  if (!isValidCoordinates(coordinates)) {
    throw new Error("A valid location is required to search nearby facilities.");
  }

  const apiKey = getGooglePlacesApiKey();
  const requests = [
    {
      source: "OpenStreetMap" as const,
      promise: fetchOsmFacilities(coordinates, signal),
    },
    ...(apiKey
      ? [
          {
            source: "Google Places" as const,
            promise: fetchGoogleFacilities(coordinates, apiKey, signal),
          },
        ]
      : []),
  ];
  const results = await Promise.allSettled(requests.map(({ promise }) => promise));
  const errors: string[] = [];
  const facilities: NearbyWasteFacility[] = [];
  let successfulSources = 0;

  results.forEach((result, index) => {
    const source = requests[index].source;
    if (result.status === "fulfilled") {
      successfulSources += 1;
      facilities.push(...result.value);
    } else if (!signal.aborted) {
      const message =
        result.reason instanceof Error
          ? result.reason.message
          : "The search failed unexpectedly.";
      errors.push(`${source}: ${message}`);
    }
  });

  if (successfulSources === 0 && errors.length) {
    throw new Error(errors.join(" "));
  }

  return {
    facilities: combineFacilitySources(facilities),
    errors,
  };
}
