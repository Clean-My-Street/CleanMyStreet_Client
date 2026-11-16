import { useEffect } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { Report } from "../services/api";

type WebMapProps = {
  reports: Report[];
  onMarkerPress: (report: Report) => void;
};

export default function WebMap({
  reports,
  onMarkerPress,
}: WebMapProps) {
  useEffect(() => {
    if (Platform.OS !== "web") return;

    import("leaflet/dist/leaflet.css");
  }, []);

  if (Platform.OS !== "web") {
    return (
      <View style={styles.placeholder}>
        <Text>Map is available on the web version.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text>Map component loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 245,
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
  },
  placeholder: {
    height: 245,
    alignItems: "center",
    justifyContent: "center",
  },
});