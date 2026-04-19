import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getAdminDb } from "../utils/firebase-admin";
import { verifyAdmin } from "../utils/auth";
import { verifyCsrfToken } from "../utils/csrf";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Auth & CSRF Check
  const isAdmin = await verifyAdmin(req);
  if (!isAdmin) return res.status(403).json({ message: "Admin access required" });

  if (!verifyCsrfToken(req)) return res.status(403).json({ message: "CSRF token invalid" });

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

  // 1. Check Firebase JSON
  const fbJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (fbJson) {
    results.env.FIREBASE_JSON.status = "detected";
    const trimmed = fbJson.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      results.env.FIREBASE_JSON.status = "valid_format";
      try {
        JSON.parse(trimmed);
        results.env.FIREBASE_JSON.detail = "Valid JSON String";
      } catch (e: any) {
        results.env.FIREBASE_JSON.status = "invalid_json";
        results.env.FIREBASE_JSON.detail = e.message;
      }
    } else {
      results.env.FIREBASE_JSON.status = "malformed";
      results.env.FIREBASE_JSON.detail = `Truncation suspected. Ends with ${trimmed.slice(-1)}. Length: ${trimmed.length}`;
    }
  }

  // 1.5 Check Firebase Individual Variables
  const fbProjectId = process.env.FB_PROJECT_ID;
  const fbClientEmail = process.env.FB_CLIENT_EMAIL;
  const fbPrivateKey = process.env.FB_PRIVATE_KEY;
  if (fbProjectId && fbClientEmail && fbPrivateKey) {
    results.env.FIREBASE_INDIVIDUAL.status = "healthy";
    results.env.FIREBASE_INDIVIDUAL.detail = `Client: ${fbClientEmail}`;
  }

  // 2. Check Razorpay
  const rpId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
  const rpSecret = process.env.RAZORPAY_KEY_SECRET;
  if (rpId && rpSecret) {
    results.env.RAZORPAY_KEY.status = "healthy";
    results.env.RAZORPAY_KEY.detail = `ID: ${rpId.substring(0, 10)}...`;
  }

  // 3. Check Email SMTP
  const emUser = process.env.EMAIL_USER;
  const emPass = process.env.EMAIL_APP_PASSWORD;
  if (emUser && emPass) {
    results.env.EMAIL_SMTP.status = "healthy";
  }

  // 4. Check GitHub CMS
  const ghToken = process.env.GITHUB_TOKEN;
  if (ghToken) {
    results.env.GITHUB_CMS.status = "healthy";
    results.env.GITHUB_CMS.detail = `Target: ${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}`;
  }

  // 5. Test Database Connection
  try {
    const adminDb = getAdminDb();
    const productSnap = await adminDb.collection("products").limit(1).get();
    const orderSnap = await adminDb.collection("orders").limit(1).get();
    
    results.database.status = "connected";
    results.database.stats = {
      products: productSnap.size,
      orders: orderSnap.size
    };
  } catch (e: any) {
    results.database.status = "failed";
    results.database.error = e.message;
  }

  return res.status(200).json(results);
}
