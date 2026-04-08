import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Simple check for Admin-only (optional, but good practice)
  // For now, keep it open for debugging until we fix the JSON
  
  const results: any = {
    timestamp: new Date().toISOString(),
    env: {
      FIREBASE_JSON: { status: "missing", detail: "" },
      RAZORPAY_KEY: { status: "missing" },
      EMAIL_USER: { status: "missing" }
    },
    database: { status: "unchecked" }
  };

  // 1. Check Firebase JSON
  const fbJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (fbJson) {
    results.env.FIREBASE_JSON.status = "detected";
    const trimmed = fbJson.trim();
    const start = trimmed.startsWith("{");
    const end = trimmed.endsWith("}");
    
    if (start && end) {
      results.env.FIREBASE_JSON.status = "valid_format";
      try {
        JSON.parse(trimmed);
        results.env.FIREBASE_JSON.detail = "Valid JSON";
      } catch (e: any) {
        results.env.FIREBASE_JSON.status = "invalid_json";
        results.env.FIREBASE_JSON.detail = e.message;
      }
    } else {
      results.env.FIREBASE_JSON.status = "truncated";
      results.env.FIREBASE_JSON.detail = `Starts with { (${start}), Ends with } (${end}). Length: ${trimmed.length}`;
      if (!end) {
        results.env.FIREBASE_JSON.advice = "Your JSON is cut off. Ensure it is wrapped in single quotes '' in your .env or pasted fully in Vercel.";
      }
    }
  }

  // 2. Check Razorpay
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    results.env.RAZORPAY_KEY.status = "present";
  }

  // 3. Test Firebase Connection
  try {
    if (getApps().length === 0 && fbJson) {
      const serviceAccount = JSON.parse(fbJson);
      initializeApp({ credential: cert(serviceAccount) });
    }
    const db = getFirestore();
    const testSnap = await db.collection("products").limit(1).get();
    results.database.status = "connected";
    results.database.count = testSnap.size;
  } catch (e: any) {
    results.database.status = "failed";
    results.database.error = e.message;
  }

  return res.status(200).json(results);
}
