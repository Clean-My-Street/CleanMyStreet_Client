import { createElement, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { Report } from "../services/api";

import "leaflet/dist/leaflet.css";

declare const require: (moduleName: string) => any;

type WebMapProps = {
  reports: Report[];
  onMarkerPress: (report: Report) => void;
};

export default function WebMap({
  reports,
  onMarkerPress,
}: WebMapProps) {
  const [mapComponents, setMapComponents] = useState<any>(null);

  useEffect(() => {
    try {
      // Load Leaflet only after the browser has rendered the component.
      require("leaflet");

      const reactLeaflet = require("react-leaflet");

      setMapComponents({
        MapContainer: reactLeaflet.MapContainer,
        TileLayer: reactLeaflet.TileLayer,
        CircleMarker: reactLeaflet.CircleMarker,
        Popup: reactLeaflet.Popup,
      });
    } catch (error) {
      console.error("Could not load map:", error);
    }
  }, []);

  const reportsWithCoordinates = reports.filter(
    (report) =>
      typeof report.latitude === "number" &&
      Number.isFinite(report.latitude) &&
      typeof report.longitude === "number" &&
      Number.isFinite(report.longitude),
  );

  const center: [number, number] =
    reportsWithCoordinates.length > 0
      ? [
          reportsWithCoordinates.reduce(
            (total, report) => total + report.latitude!,
            0,
          ) / reportsWithCoordinates.length,

          reportsWithCoordinates.reduce(
            (total, report) => total + report.longitude!,
            0,
          ) / reportsWithCoordinates.length,
        ]
      : [-29.8587, 31.0218];

  if (!mapComponents) {
    return (
      <View style={styles.placeholder}>
        <Text>Loading map...</Text>
      </View>
    );
  }

  const {
    MapContainer,
    TileLayer,
    CircleMarker,
    Popup,
  } = mapComponents;

  return (
    <View style={styles.container}>
      {createElement(
        MapContainer,
        {
          center,
          zoom: 13,
          scrollWheelZoom: true,
          style: {
            height: "245px",
            width: "100%",
          },
        },
        createElement(TileLayer, {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        }),

        ...reportsWithCoordinates.map((report) =>
          createElement(
            CircleMarker,
            {
              key: report.id,
              center: [
                report.latitude!,
                report.longitude!,
              ],
              radius: 9,
              pathOptions: {
                color: "#1E3A8A",
                fillColor: "#36B86B",
                fillOpacity: 1,
              },
              eventHandlers: {
                click: () => onMarkerPress(report),
              },
            },
            createElement(
              Popup,
              null,
              createElement(
                "strong",
                null,
                report.wasteType || "Dumping Site",
              ),
              createElement("br"),
              report.description,
            ),
          ),
        ),
      )}
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
    backgroundColor: "#E3E3E3",
    borderRadius: 12,
  },
});