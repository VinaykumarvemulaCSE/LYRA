import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

let adminDbCache: any = null;

const getAdminDb = () => {
    if (!adminDbCache) {
        if (getApps().length === 0) {
            let serviceAccount;
            if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
                serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
            } else if (process.env.FB_PROJECT_ID) {
                serviceAccount = {
                    projectId: process.env.FB_PROJECT_ID,
                    clientEmail: process.env.FB_CLIENT_EMAIL,
                    privateKey: process.env.FB_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                };
            }
            if (!serviceAccount) throw new Error("Firebase Admin Credentials Missing");
            initializeApp({ credential: cert(serviceAccount) });
        }
        adminDbCache = getFirestore();
    }
    return adminDbCache;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method Not Allowed" });

  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Promo code is required" });
    }

    const db = getAdminDb();

    // Query for the active promo code
    const promoQuery = await db.collection("promotions")
      .where("code", "==", String(code).toUpperCase())
      .where("active", "==", true)
      .limit(1)
      .get();

    if (promoQuery.empty) {
      return res.status(404).json({ message: "Invalid or expired promo code" });
    }

    const promoData = promoQuery.docs[0].data();
    
    // Check expiration date if it exists
    if (promoData.expiresAt) {
      // Handle both Firestore Timestamp and string formats safely
      let expiresDate: Date;
      if (typeof promoData.expiresAt.toDate === 'function') {
        expiresDate = promoData.expiresAt.toDate();
      } else {
        expiresDate = new Date(promoData.expiresAt);
      }
      
      if (expiresDate < new Date()) {
        return res.status(404).json({ message: "This promo code has expired" });
      }
    }

    // Check usage limits
    if (promoData.maxUses && promoData.usedCount >= promoData.maxUses) {
      return res.status(404).json({ message: "Usage limit reached for this code" });
    }

    // Return the custom discount info
    return res.status(200).json({
      code: promoData.code,
      discountPercent: promoData.discountPercent || 0,
      discountFlat: promoData.discountFlat || 0
    });

  } catch (err: any) {
    console.error("[PROMO ERROR]", err);
    res.status(500).json({ message: "Error validating promo code", error: err.message });
  }
}
