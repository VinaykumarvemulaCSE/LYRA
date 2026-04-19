import admin from "firebase-admin";

// In production (Render), we use environment variables
// In local dev, you'd use a serviceAccountKey.json, but for this setup 
// we assume the environment variables are set.

if (!admin.apps.length) {
  try {
    const serviceAccount = process.env.FIREBASE_ADMIN_SDK 
      ? JSON.parse(process.env.FIREBASE_ADMIN_SDK) 
      : null;

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log("[LYRA] Firebase Admin Initialized");
    } else {
      console.warn("[LYRA] FIREBASE_ADMIN_SDK missing. Auth middleware will fail.");
    }
  } catch (error) {
    console.error("[LYRA] Firebase Admin Init Error:", error);
  }
}

export const adminDb = admin.apps.length ? admin.firestore() : null;
export const adminAuth = admin.apps.length ? admin.auth() : null;
