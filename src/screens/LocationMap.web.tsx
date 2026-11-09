import type { Ref } from "react";
import { StyleSheet, Text, View } from "react-native";
import type {
  LocationMapHandle,
  LocationMapProps,
} from "./LocationMap.types";

type LocationMapWebProps = LocationMapProps & {
  ref?: Ref<LocationMapHandle>;
};

export default function LocationMap({ fallbackText }: LocationMapWebProps) {
  return (
    <View style={styles.fallback}>
      <Text style={styles.title}>Map is available in the mobile app</Text>
      <Text style={styles.coordinates}>{fallbackText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  title: {
    color: "#17201A",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  coordinates: {
    color: "#68706A",
    fontSize: 11,
    marginTop: 4,
    textAlign: "center",
  },
});
