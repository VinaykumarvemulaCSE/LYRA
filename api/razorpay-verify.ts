import type { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "crypto";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { sendStoreEmail } from "./utils/email";

// --- Lazy Initializer ---
const getAdminDb = () => {
  try {
    if (getApps().length === 0) {
      const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
      let serviceAccount;

      if (serviceAccountJson && serviceAccountJson.trim().startsWith("{")) {
        serviceAccount = JSON.parse(serviceAccountJson);
      } else if (process.env.FB_PROJECT_ID && process.env.FB_CLIENT_EMAIL && process.env.FB_PRIVATE_KEY) {
        serviceAccount = {
          projectId: process.env.FB_PROJECT_ID,
          clientEmail: process.env.FB_CLIENT_EMAIL,
          // Replace escaped newlines if they exist
          privateKey: process.env.FB_PRIVATE_KEY.replace(/\\n/g, '\n'),
        };
      } else {
        throw new Error("Missing Firebase credentials. Provide either FIREBASE_SERVICE_ACCOUNT_JSON or FB_PROJECT_ID/FB_CLIENT_EMAIL/FB_PRIVATE_KEY.");
      }
      
      initializeApp({ credential: cert(serviceAccount) });
    }
    return getFirestore();
  } catch (error: any) {
    console.error("[Firebase Admin Error]:", error.message);
    return null;
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { db_order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, userEmail } = req.body;

  // 1. Basic check
  if (!db_order_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ status: "failure", message: "Required fields are missing." });
  }

  // 2. Initialize Firestore
  const adminDb = getAdminDb();
  if (!adminDb) {
    return res.status(500).json({ status: "error", message: "Database initialization failed. Check server logs." });
  }

  // 3. HMAC Verification 
  const secret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!secret) {
    return res.status(500).json({ status: "error", message: "Razorpay secret missing." });
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    console.warn(`[Verify] Signature mismatch for Order: ${razorpay_order_id}`);
    return res.status(400).json({ status: "failure", message: "Invalid payment signature." });
  }

  try {
    const orderRef = adminDb.collection("orders").doc(db_order_id);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return res.status(404).json({ status: "error", message: "Order not found in database." });
    }

    const orderData = orderSnap.data() || {};
    const totalAmount = orderData.totalAmount ?? 0;
    const items = orderData.items ?? [];

    // Atomically Update Status
    await orderRef.update({
      status: "processing",
      paymentStatus: "paid",
      paymentId: razorpay_payment_id,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Stock decrement 
    const batch = adminDb.batch();
    for (const item of items) {
      const productRef = adminDb.collection("products").doc(item.id);
      const productSnap = await productRef.get();
      if (productSnap.exists) {
        const product = productSnap.data()!;
        const variants = product.variants ?? [];
        const variantIdx = variants.findIndex((v: any) => v.color === item.color);
        if (variantIdx > -1) {
          variants[variantIdx].stock = Math.max(0, variants[variantIdx].stock - item.quantity);
          batch.update(productRef, { variants, updatedAt: FieldValue.serverTimestamp() });
        }
      }
    }
    await batch.commit();

    // Send confirmation
    const recipient = userEmail || orderData.shippingAddress?.email;
    if (recipient) {
      const shortId = db_order_id.substring(0, 8).toUpperCase();
      sendStoreEmail(recipient, `Your LYRA Order Confirmed #${shortId}`, "Your payment has been successfully verified.")
        .catch(err => console.error("[Email Error]:", err.message));
    }

    return res.status(200).json({ status: "success", message: "Payment verified." });

  } catch (error: any) {
    console.error("[Verify Handler Error]:", error.message);
    return res.status(500).json({ status: "error", message: "Internal server error during order update." });
  }
}
