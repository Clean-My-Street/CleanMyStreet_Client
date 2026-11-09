import { forwardRef, useImperativeHandle, useRef } from "react";
import Constants from "expo-constants";
import { Platform, StyleSheet, Text, View } from "react-native";
import MapView, {
  Marker,
  type MapPressEvent,
  type Region,
} from "react-native-maps";
import type {
  LocationMapHandle,
  LocationMapProps,
} from "./LocationMap.types";

const DEFAULT_MAP_REGION: Region = {
  latitude: -29.8587,
  longitude: 31.0218,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04,
};

const LocationMap = forwardRef<LocationMapHandle, LocationMapProps>(
  function LocationMap(
    { coordinates, hasLocationPermission, onSelectLocation },
    ref,
  ) {
    const mapRef = useRef<MapView | null>(null);

    useImperativeHandle(
      ref,
      () => ({
        moveToCoordinate(latitude, longitude) {
          mapRef.current?.animateToRegion(
            {
              latitude,
              longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            },
            400,
          );
        },
      }),
      [],
    );

    const selectMapLocation = ({ nativeEvent }: MapPressEvent) => {
      onSelectLocation(nativeEvent.coordinate);
    };

    if (
      Platform.OS === "android" &&
      Constants.expoConfig?.extra?.googleMapsApiKeyConfigured !== true
    ) {
      return (
        <View style={styles.fallback}>
          <Text style={styles.title}>Map is unavailable without an API key</Text>
          <Text style={styles.coordinates}>
            {coordinates
              ? `${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`
              : "Use your device location to set the report location."}
          </Text>
        </View>
      );
    }

    return (
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={DEFAULT_MAP_REGION}
        onPress={selectMapLocation}
        showsUserLocation={hasLocationPermission}
        showsMyLocationButton={false}
        toolbarEnabled
        accessibilityLabel="Select dumping site location on map"
      >
        {coordinates && (
          <Marker
            coordinate={coordinates}
            title="Dumping site location"
            description="Drag the marker or tap the map to adjust."
            draggable
            onDragEnd={({ nativeEvent }) =>
              onSelectLocation(nativeEvent.coordinate)
            }
          />
        )}
      </MapView>
    );
  },
);

const styles = StyleSheet.create({
  fallback: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: "#E5E5E5",
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

export default LocationMap;
