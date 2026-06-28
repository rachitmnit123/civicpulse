import { auth } from "../firebase.js";
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { db } from "../firebase.js";
import { doc, setDoc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { getAuthorityConfig } from "../config/authorityConfig.js";

const provider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  const authorityConfig = getAuthorityConfig(user.email);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      role: authorityConfig ? authorityConfig.role : "CITIZEN",
      department: authorityConfig ? authorityConfig.department : null,
      state: authorityConfig ? authorityConfig.state : null,
      district: authorityConfig ? authorityConfig.district : null,
      jurisdiction: authorityConfig ? authorityConfig.jurisdiction : null,
      gamification: {
        xp: 0,
        level: 1,
        badges: [],
        reportsSubmitted: 0,
        verificationsGiven: 0,
        resolvedCount: 0,
      },
      createdAt: serverTimestamp(),
    });
  } else {
    if (authorityConfig) {
      await updateDoc(userRef, {
        role: authorityConfig.role,
        department: authorityConfig.department,
        state: authorityConfig.state,
        district: authorityConfig.district,
        jurisdiction: authorityConfig.jurisdiction,
        displayName: authorityConfig.displayName,
      });
    }
  }

  return user;
}

export async function signOutUser() {
  await signOut(auth);
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}
