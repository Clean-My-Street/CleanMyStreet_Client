export type LocationCoordinate = {
  latitude: number;
  longitude: number;
};

export type LocationMapHandle = {
  moveToCoordinate: (latitude: number, longitude: number) => void;
};

export type LocationMapProps = {
  coordinates: LocationCoordinate | null;
  fallbackText: string;
  hasLocationPermission: boolean;
  onSelectLocation: (coordinate: LocationCoordinate) => void;
};
