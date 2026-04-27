import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";
import { mockAuth, mockDb } from "./mock-service";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Check if variables are still placeholders
export const isFirebaseConfigured = !!(firebaseConfig.apiKey && firebaseConfig.apiKey !== "your_api_key");

if (!isFirebaseConfigured && typeof window !== 'undefined') {
    console.warn("⚠️ Firebase is not configured! Switching to Local Storage Mode (Mock).");
}

// Initialize Firebase only if keys are present
const app = (isFirebaseConfigured && getApps().length === 0)
    ? initializeApp(firebaseConfig)
    : (getApps().length > 0 ? getApp() : null);

export const auth = (isFirebaseConfigured && app) ? getAuth(app) : mockAuth as any;
export const db = (isFirebaseConfigured && app) ? getFirestore(app) : mockDb as any;

// Initialize Analytics only if app exists and in browser
export const analytics = (typeof window !== "undefined" && app)
    ? isSupported().then(yes => yes ? getAnalytics(app) : null)
    : null;
