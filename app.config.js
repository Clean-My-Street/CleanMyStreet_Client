function configuredApiKey(...values) {
  return values
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .find(
      (value) =>
        value.length > 0 &&
        !/^(your api key|google_maps_demo_key)$/i.test(value),
    );
}

const googleMapsApiKey = configuredApiKey(
  process.env.GOOGLE_MAPS_API_KEY,
  process.env.GOOGLE_MAPS_DEMO_KEY,
);
const googlePlacesApiKey = configuredApiKey(
  process.env.GOOGLE_PLACES_API_KEY,
  process.env.GOOGLE_MAPS_DEMO_KEY,
  process.env.GOOGLE_MAPS_API_KEY,
);

module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...(config.extra ?? {}),
    googlePlacesApiKey: googlePlacesApiKey ?? null,
    googleMapsApiKeyConfigured: Boolean(googleMapsApiKey),
  },
  plugins: [
    ...(config.plugins ?? []),
    ...(googleMapsApiKey
      ? [
          [
            "react-native-maps",
            { androidGoogleMapsApiKey: googleMapsApiKey },
          ],
        ]
      : []),
  ],
});
