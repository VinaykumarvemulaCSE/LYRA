import admin from "firebase-admin";

// In production (Render/Vercel), we use environment variables
// This handler supports both the full JSON string and individual variables
// (Individual variables are safer to prevent truncation in shell environments)

if (!admin.apps.length) {
  try {
    let serviceAccount: any = null;

    // 1. Try FIREBASE_ADMIN_SDK or FIREBASE_SERVICE_ACCOUNT_JSON (Full JSON)
    const fbJson = process.env.FIREBASE_ADMIN_SDK || process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    
    if (fbJson) {
      try {
        serviceAccount = JSON.parse(fbJson);
        console.log("[LYRA] Initializing Firebase with JSON string");
      } catch (parseError) {
        console.error("[LYRA] Failed to parse Firebase JSON string:", parseError);
      }
    }

    // 2. Fallback to individual variables (More reliable)
    if (!serviceAccount && process.env.FB_PROJECT_ID && process.env.FB_CLIENT_EMAIL && process.env.FB_PRIVATE_KEY) {
      serviceAccount = {
        projectId: process.env.FB_PROJECT_ID,
        clientEmail: process.env.FB_CLIENT_EMAIL,
        privateKey: process.env.FB_PRIVATE_KEY.replace(/\\n/g, '\n'),
      };
      console.log("[LYRA] Initializing Firebase with individual variables");
    }

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log("[LYRA] Firebase Admin Initialized Successfully");
    } else {
      console.warn("[LYRA] CRITICAL: No Firebase credentials found (checked FIREBASE_ADMIN_SDK, FB_PROJECT_ID, etc)");
    }
  } catch (error) {
    console.error("[LYRA] Firebase Admin Init Error:", error);
  }
}

export const adminDb = admin.apps.length ? admin.firestore() : null;
export const adminAuth = admin.apps.length ? admin.auth() : null;

// Aliases for compatibility with existing routes
export const getAdminDb = () => {
  if (!adminDb) throw new Error("Firebase Admin DB not initialized. Check your environment variables.");
  return adminDb;
};

export const getAdminAuth = () => {
  if (!adminAuth) throw new Error("Firebase Admin Auth not initialized. Check your environment variables.");
  return adminAuth;
};
