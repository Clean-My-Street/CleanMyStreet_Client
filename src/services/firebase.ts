import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import {
    getAuth,
    initializeAuth,
} from "firebase/auth";

// @ts-expect-error Firebase React Native export is missing from some type declarations
import { getReactNativePersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAPfQFpcxHi0uwUnhrVN8V34caCK8Uxeq0",
  authDomain: "cleanmystreetapp.firebaseapp.com",
  projectId: "cleanmystreetapp",
  storageBucket: "cleanmystreetapp.firebasestorage.app",
  messagingSenderId: "141316227408",
  appId: "1:141316227408:web:5ca64baa0d371cf88a2c55",
};

const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApp();

let auth: Auth;

try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {

  auth = getAuth(app);
}

export { app, auth };

