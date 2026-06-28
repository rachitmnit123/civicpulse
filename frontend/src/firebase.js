import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyBw-PXyEHmSpDjZgXFcDYIPeXqufLEfcmI",
    authDomain: "civic-pulse-vibe-d4a34.firebaseapp.com",
    projectId: "civic-pulse-vibe-d4a34",
    storageBucket: "civic-pulse-vibe-d4a34.firebasestorage.app",
    messagingSenderId: "52981256820",
    appId: "1:52981256820:web:56311ce2ff54b3da323721",
    measurementId: "G-N2NN11ENQW"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export default app;