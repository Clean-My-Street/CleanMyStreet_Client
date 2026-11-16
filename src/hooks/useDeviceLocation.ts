import * as ExpoLocation from "expo-location";
import { useEffect, useState } from "react";
import type { Coordinates } from "../utils/distance";

export type DeviceLocationState = {
  location: Coordinates | null;
  // "denied" covers both a refused permission and a failed GPS fix.
  status: "loading" | "ready" | "denied";
};

// The device's current position, used to show how far away sites are.
// Asks for foreground location permission if it hasn't been answered yet.
export function useDeviceLocation(): DeviceLocationState {
  const [state, setState] = useState<DeviceLocationState>({
    location: null,
    status: "loading",
  });

  useEffect(() => {
    let isActive = true;

    const resolve = async () => {
      try {
        let permission = await ExpoLocation.getForegroundPermissionsAsync();
        if (permission.status !== "granted" && permission.canAskAgain) {
          permission = await ExpoLocation.requestForegroundPermissionsAsync();
        }
        if (permission.status !== "granted") {
          if (isActive) setState({ location: null, status: "denied" });
          return;
        }

        const position =
          (await ExpoLocation.getLastKnownPositionAsync()) ??
          (await ExpoLocation.getCurrentPositionAsync({
            accuracy: ExpoLocation.Accuracy.Balanced,
          }));
        if (isActive) {
          setState({
            location: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
            status: "ready",
          });
        }
      } catch (error) {
        console.warn("Could not get the device location.", error);
        if (isActive) setState({ location: null, status: "denied" });
      }
    };

    void resolve();
    return () => {
      isActive = false;
    };
  }, []);

  return state;
}
