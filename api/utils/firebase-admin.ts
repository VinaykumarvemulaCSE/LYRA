import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

let adminDbCache: any = null;

export const getAdminDb = () => {
  if (!adminDbCache) {
    if (getApps().length === 0) {
      const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
      let serviceAccount;

      if (serviceAccountJson && serviceAccountJson.trim().startsWith("{")) {
        serviceAccount = JSON.parse(serviceAccountJson);
      } else if (process.env.FB_PROJECT_ID && process.env.FB_CLIENT_EMAIL && process.env.FB_PRIVATE_KEY) {
        serviceAccount = {
          projectId: process.env.FB_PROJECT_ID,
          clientEmail: process.env.FB_CLIENT_EMAIL,
          privateKey: process.env.FB_PRIVATE_KEY.replace(/\\n/g, '\n'),
        };
      } else {
        throw new Error("Missing Firebase credentials in Environment.");
      }
      
      initializeApp({ credential: cert(serviceAccount) });
    }
    adminDbCache = getFirestore();
  }
  return adminDbCache;
};
