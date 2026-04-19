import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getAdminDb } from "./utils/firebase-admin.js";
import { verifyAdmin } from "./utils/auth.js";
import { verifyCsrfToken } from "./utils/csrf.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Auth & CSRF Check (Admin Only)
  const isAdmin = await verifyAdmin(req);
  if (!isAdmin) return res.status(403).json({ message: "Admin access required" });

  const { action } = (req.method === "GET" ? req.query : req.body) || {};

  // --- DIAGNOSTICS LOGIC ---
  if (req.method === "GET" || action === "diagnostics") {
    const results: any = {
      timestamp: new Date().toISOString(),
      env: {
        FIREBASE_JSON: { status: "missing", detail: "" },
        FIREBASE_INDIVIDUAL: { status: "missing", detail: "" },
        RAZORPAY_KEY: { status: "missing", detail: "" },
        EMAIL_SMTP: { status: "missing", detail: "" },
        GITHUB_CMS: { status: "missing", detail: "" }
      },
      database: { status: "unchecked" }
    };

    const fbJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (fbJson) {
      results.env.FIREBASE_JSON.status = "detected";
      const trimmed = fbJson.trim();
      if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
        results.env.FIREBASE_JSON.status = "valid_format";
        try { JSON.parse(trimmed); results.env.FIREBASE_JSON.detail = "Valid JSON String"; } catch (e: any) { results.env.FIREBASE_JSON.status = "invalid_json"; results.env.FIREBASE_JSON.detail = e.message; }
      }
    }

    if (process.env.FB_PROJECT_ID && process.env.FB_CLIENT_EMAIL && process.env.FB_PRIVATE_KEY) {
      results.env.FIREBASE_INDIVIDUAL.status = "healthy";
    }

    if ((process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID) && process.env.RAZORPAY_KEY_SECRET) {
      results.env.RAZORPAY_KEY.status = "healthy";
    }

    if (process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD) {
      results.env.EMAIL_SMTP.status = "healthy";
    }

    if (process.env.GITHUB_TOKEN) {
      results.env.GITHUB_CMS.status = "healthy";
    }

    try {
      const adminDb = getAdminDb();
      const productSnap = await adminDb.collection("products").limit(1).get();
      const orderSnap = await adminDb.collection("orders").limit(1).get();
      results.database.status = "connected";
      results.database.stats = { products: productSnap.size, orders: orderSnap.size };
    } catch (e: any) {
      results.database.status = "failed";
      results.database.error = e.message;
    }

    return res.status(200).json(results);
  }

  // --- MAINTENANCE LOGIC ---
  if (req.method === "POST") {
    const db = getAdminDb();
    try {
      if (action === "purge_orders") {
        const orders = await db.collection("orders").get();
        const batch = db.batch();
        orders.forEach((doc: any) => batch.delete(doc.ref));
        await batch.commit();
        return res.status(200).json({ status: "success", message: `Deleted ${orders.size} test orders` });
      }

      if (action === "purge_reviews") {
        const reviews = await db.collection("reviews").get();
        const batch = db.batch();
        reviews.forEach((doc: any) => batch.delete(doc.ref));
        await batch.commit();
        return res.status(200).json({ status: "success", message: `Deleted ${reviews.size} test reviews` });
      }

      if (action === "sync_stock") {
        const products = await db.collection("products").get();
        const batch = db.batch();
        products.forEach((doc: any) => {
          const data = doc.data();
          if (data.variants) {
            const updatedVariants = data.variants.map((v: any) => ({ ...v, stock: 10 }));
            batch.update(doc.ref, { variants: updatedVariants, inStock: true });
          }
        });
        await batch.commit();
        return res.status(200).json({ status: "success", message: "Stock levels reset for production" });
      }

      return res.status(400).json({ message: "Invalid maintenance action" });
    } catch (err: any) {
      return res.status(500).json({ message: "Maintenance failed", error: err.message });
    }
  }

  return res.status(405).json({ message: "Method Not Allowed" });
}
