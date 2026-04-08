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
      FIREBASE_INDIVIDUAL: { status: "missing", detail: "" },
      RAZORPAY_KEY: { status: "missing", detail: "" },
      EMAIL_SMTP: { status: "missing", detail: "" }
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
        results.env.FIREBASE_JSON.advice = "Your JSON is cut off. Switch to using FB_PROJECT_ID, FB_CLIENT_EMAIL, and FB_PRIVATE_KEY instead.";
      }
    }
  }

  // 1.5 Check Firebase Individual Variables
  const fbProjectId = process.env.FB_PROJECT_ID;
  const fbClientEmail = process.env.FB_CLIENT_EMAIL;
  const fbPrivateKey = process.env.FB_PRIVATE_KEY;
  if (fbProjectId && fbClientEmail && fbPrivateKey) {
    results.env.FIREBASE_INDIVIDUAL.status = "present";
    results.env.FIREBASE_INDIVIDUAL.detail = `ID: ${fbProjectId}, Email: ${fbClientEmail}, Key length: ${fbPrivateKey.length}`;
  } else if (fbProjectId || fbClientEmail || fbPrivateKey) {
    results.env.FIREBASE_INDIVIDUAL.status = "partial";
    results.env.FIREBASE_INDIVIDUAL.detail = `Missing pieces. ID: ${!!fbProjectId}, Email: ${!!fbClientEmail}, Key: ${!!fbPrivateKey}`;
    results.env.FIREBASE_INDIVIDUAL.advice = "You must provide all 3: FB_PROJECT_ID, FB_CLIENT_EMAIL, and FB_PRIVATE_KEY";
  }

  // 2. Check Razorpay
  const rpId = process.env.RAZORPAY_KEY_ID;
  const rpSecret = process.env.RAZORPAY_KEY_SECRET;
  if (rpId && rpSecret) {
    results.env.RAZORPAY_KEY.status = "present";
    results.env.RAZORPAY_KEY.detail = `Both keys present. ID starts with ${rpId.substring(0, 8)}`;
  } else {
    results.env.RAZORPAY_KEY.detail = `Missing pieces. ID: ${!!rpId}, Secret: ${!!rpSecret}`;
    if (!rpId || !rpSecret) results.env.RAZORPAY_KEY.advice = "Ensure both RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are set.";
  }

  // 3. Check Email SMTP
  const emUser = process.env.EMAIL_USER;
  const emPass = process.env.EMAIL_APP_PASSWORD;
  if (emUser && emPass) {
    results.env.EMAIL_SMTP.status = "present";
    results.env.EMAIL_SMTP.detail = `User: ${emUser}`;
  } else {
    results.env.EMAIL_SMTP.detail = `Missing pieces. User: ${!!emUser}, Password: ${!!emPass}`;
    if (!emUser || !emPass) results.env.EMAIL_SMTP.advice = "Ensure both EMAIL_USER and EMAIL_APP_PASSWORD are set.";
  }

  // 4. Test Firebase Connection
  try {
    if (getApps().length === 0) {
      if (fbJson && fbJson.trim().startsWith("{")) {
        const serviceAccount = JSON.parse(fbJson);
        initializeApp({ credential: cert(serviceAccount) });
      } else if (fbProjectId && fbClientEmail && fbPrivateKey) {
        initializeApp({ credential: cert({
          projectId: fbProjectId,
          clientEmail: fbClientEmail,
          privateKey: fbPrivateKey.replace(/\\n/g, '\n'),
        }) });
      }
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
