// authentication service for handling user login, logout, and token management

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
} from "firebase/auth";

import { auth } from "./firebase";

// Register a new user
export async function registerWithEmail(
  fullName: string,
  email: string,
  password: string
) {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email.trim(),
    password
  );

  // Save the user's name in their Firebase Authentication profile.
  await updateProfile(userCredential.user, {
    displayName: fullName.trim(),
  });

  return userCredential.user;
}

// Log in an existing user
export async function loginWithEmail(
  email: string,
  password: string
) {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email.trim(),
    password
  );

  return userCredential.user;
}

// Log out the current user
export async function logoutUser() {
  await signOut(auth);
}