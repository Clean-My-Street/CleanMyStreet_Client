
import { useEffect, useMemo, useRef, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { Report } from "../services/api";

type WebMapProps = {
  reports: Report[];
  selectedReport: Report | null;
  onMarkerPress: (report: Report) => void;
};

export default function WebMap({
  reports,
  selectedReport,
  onMarkerPress,
}: WebMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const [mapReady, setMapReady] = useState(false);

  const validReports = useMemo(
    () =>
      reports.filter(
        (report) =>
          typeof report.latitude === "number" &&
          typeof report.longitude === "number" &&
          Number.isFinite(report.latitude) &&
          Number.isFinite(report.longitude) &&
          report.latitude >= -90 &&
          report.latitude <= 90 &&
          report.longitude >= -180 &&
          report.longitude <= 180
      ),
    [reports]
  );

  // Initialise the Leaflet map.
  useEffect(() => {
    if (Platform.OS !== "web" || !mapContainerRef.current) return;

    let cancelled = false;

    async function initialiseMap() {
      await import("leaflet/dist/leaflet.css");
      const L = await import("leaflet");

      if (cancelled || !mapContainerRef.current || mapRef.current) {
        return;
      }

      leafletRef.current = L;

      const map = L.map(mapContainerRef.current).setView(
        [-29.8587, 31.0218],
        12
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
      setMapReady(true);
    }

    initialiseMap().catch((error) => {
      console.error("Could not initialise the map:", error);
    });

    return () => {
      cancelled = true;

      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      leafletRef.current = null;
      setMapReady(false);
    };
  }, []);

  // Add or refresh report markers.
  useEffect(() => {
    const map = mapRef.current;
    const L = leafletRef.current;

    if (!mapReady || !map || !L) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    validReports.forEach((report) => {
      const marker = L.marker([
        report.latitude!,
        report.longitude!,
      ]).addTo(map);

      const safeDescription = report.description
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      marker.bindPopup(
        `<strong>Dumping Report</strong><br/>${safeDescription}`
      );

      marker.on("click", () => {
        onMarkerPress(report);
      });

      markersRef.current.push(marker);
    });

    if (!selectedReport && validReports.length > 0) {
      const bounds = L.latLngBounds(
        validReports.map((report) => [
          report.latitude!,
          report.longitude!,
        ])
      );

      map.fitBounds(bounds, {
        padding: [30, 30],
        maxZoom: 15,
      });
    }
  }, [validReports, onMarkerPress, selectedReport, mapReady]);

  // Zoom to the selected report.
  useEffect(() => {
    const map = mapRef.current;

    if (
      !mapReady ||
      !map ||
      !selectedReport ||
      typeof selectedReport.latitude !== "number" ||
      typeof selectedReport.longitude !== "number"
    ) {
      return;
    }

    map.setView(
      [selectedReport.latitude, selectedReport.longitude],
      17,
      { animate: true }
    );
  }, [selectedReport, mapReady]);

  if (Platform.OS !== "web") {
    return (
      <View style={styles.placeholder}>
        <Text>Map is available on the web version.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <div
        ref={mapContainerRef}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 12,
        }}
      />
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
