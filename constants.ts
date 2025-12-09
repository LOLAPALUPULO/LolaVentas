import { UserLevel } from './types';

/**
 * Firebase configuration for the project.
 * NOTE: In a production environment, API keys and other sensitive information
 * should be managed securely (e.g., environment variables, server-side).
 */
export const FIREBASE_CONFIG = {
  projectId: "lolaventas-5a9fa",
  // Add other Firebase config fields if necessary, e.g.:
  // apiKey: "YOUR_API_KEY",
  // authDomain: "lolaventas-5a9fa.firebaseapp.com",
  // storageBucket: "lolaventas-5a9fa.appspot.com",
  // messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  // appId: "YOUR_APP_ID"
};

/**
 * Firestore collection names.
 */
export const COLLECTIONS = {
  FERIA_CONFIG: 'feriaConfig',
  SALES: 'sales',
};

/**
 * Default user accounts for different access levels.
 * (Simplified for this application as per prompt, no actual password management).
 */
export const USERS = {
  ADMIN_USER: 'regis',
  VENTA_USER: 'lol',
};

/**
 * Base64 encoded audio data for "beep" sounds.
 * These are extremely short, simple square wave sounds.
 * In a real application, you might use more sophisticated sounds or external files.
 *
 * NOTE: Generating complex audio from scratch in base64 is hard.
 * These are placeholders that represent the *concept* of embedded sounds.
 * Actual data would come from encoding a small .wav file.
 */
export const DIGITAL_BEEP_SOUND = 'data:audio/wav;base64,UklGRlYAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABlGFwAEABlGFwAAZGF0YRIAAABAAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQ=';
export const BILLETE_BEEP_SOUND = 'data:audio/wav;base64,UklGRlYAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABlGFwAEABlGFwAAZGF0YRIAAABQAP//AP//AP//AP//AP//AP//AP//AP//AP//AP//AP//AP//AP//AP//AP//AP8=';
