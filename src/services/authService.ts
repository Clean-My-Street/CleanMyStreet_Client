
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
} from "firebase/auth";

import {
    doc,
    serverTimestamp,
    setDoc,
} from "firebase/firestore";

import { auth, db } from "./firebase";

// Register a new user
export async function registerWithEmail(
  fullName: string,
  email: string,
  password: string
) {
  const trimmedName = fullName.trim();
  const trimmedEmail = email.trim().toLowerCase();

  // 1. Create the account in Firebase Authentication
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    trimmedEmail,
    password
  );

  const user = userCredential.user;

  // 2. Save the user's name in Firebase Authentication
  await updateProfile(user, {
    displayName: trimmedName,
  });

  // 3. Create the user's profile document in Firestore
  const userRef = doc(db, "users", user.uid);

  await setDoc(userRef, {
    uid: user.uid,
    fullName: trimmedName,
    email: trimmedEmail,
    phoneNumber: "",
    bio: "",
    profilePictureUrl: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return user;
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
