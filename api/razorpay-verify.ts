import type { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "crypto";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { sendStoreEmail } from "./utils/email";

/**
 * Initializes Firebase Admin SDK once per cold start.
 * Uses FIREBASE_SERVICE_ACCOUNT_JSON (full service account JSON string) or
 * falls back to Application Default Credentials (works on GCP / when ADC is configured).
 */
try {
  if (getApps().length === 0) {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (serviceAccountJson) {
      const serviceAccount = JSON.parse(serviceAccountJson);
      initializeApp({ credential: cert(serviceAccount) });
    } else {
      console.warn("[Firebase] No service account JSON found. Backend will run in restricted mode.");
    }
  }
} catch (e) {
  console.error("[Firebase] Initialization error:", e);
}

const adminDb = getApps().length > 0 ? getFirestore() : null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { db_order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, userEmail } = req.body;

  // --- 1. Input Validation ---
  if (!db_order_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    console.error("[Verify] Missing required fields:", {
      db_order_id: !!db_order_id,
      razorpay_order_id: !!razorpay_order_id,
      razorpay_payment_id: !!razorpay_payment_id,
      razorpay_signature: !!razorpay_signature,
    });
    return res.status(400).json({ status: "failure", message: "Missing required verification fields" });
  }

  // --- 2. HMAC Signature Verification ---
  const secret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!secret) {
    console.error("[Verify] RAZORPAY_KEY_SECRET is not configured.");
    return res.status(500).json({ status: "error", message: "Server misconfigured." });
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    console.warn(`[Verify] Signature mismatch for Order: ${razorpay_order_id}`);
    return res.status(400).json({ status: "failure", message: "Payment signature is invalid." });
  }

  // --- 3. Signature is VALID — Update Firestore via Admin SDK ---
  console.log(`[Verify] Signature valid for order: ${db_order_id}`);

  try {
    if (!adminDb) {
      console.error("[Verify] Firebase Admin SDK not initialized. Check your environment variables.");
      return res.status(500).json({ status: "error", message: "Database system unavailable." });
    }
    const orderRef = adminDb.collection("orders").doc(db_order_id);

    // Fetch the order document to get the authoritative amount + items
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) {
      console.error(`[Verify] Order document ${db_order_id} not found in Firestore.`);
      return res.status(404).json({ status: "error", message: "Order not found." });
    }

    const orderData = orderSnap.data() || {};
    const totalAmount: number = orderData.totalAmount ?? 0;
    const items: Array<{ id: string; color: string; quantity: number; variants?: Array<{ color: string; stock: number }> }> = orderData.items ?? [];

    // --- 4. Update order status (atomic) ---
    await orderRef.update({
      status: "processing",
      paymentStatus: "paid",
      paymentId: razorpay_payment_id,
      updatedAt: FieldValue.serverTimestamp(),
    });
    console.log(`[Verify] Order ${db_order_id} marked as paid.`);

    // --- 5. Server-side stock decrement (previously done client-side — security fix) ---
    const batch = adminDb.batch();
    for (const item of items) {
      if (!item.id || !item.color || !item.quantity) continue;
      try {
        const productRef = adminDb.collection("products").doc(item.id);
        const productSnap = await productRef.get();
        if (!productSnap.exists) continue;

        const product = productSnap.data()!;
        const variants: Array<{ color: string; stock: number }> = product.variants ?? [];
        const variantIdx = variants.findIndex((v) => v.color === item.color);

        if (variantIdx > -1) {
          variants[variantIdx].stock = Math.max(0, variants[variantIdx].stock - item.quantity);
          batch.update(productRef, { variants, updatedAt: FieldValue.serverTimestamp() });
        }
      } catch (stockErr) {
        // Non-fatal: log but don't block the payment success response
        console.error(`[Verify] Stock update failed for product ${item.id}:`, stockErr);
      }
    }

    await batch.commit();
    console.log(`[Verify] Stock decremented for ${items.length} item(s).`);

    // --- 6. Send confirmation email (non-blocking) ---
    const recipientEmail = userEmail || orderData.shippingAddress?.email;
    if (recipientEmail) {
      const shortId = db_order_id.substring(0, 8).toUpperCase();
      const formattedDate = new Date().toLocaleDateString("en-IN", {
        day: "numeric", month: "long", year: "numeric",
      });

      const emailHtml = `
        <h1 style="font-size: 24px; font-weight: bold; text-align: center; margin-bottom: 16px;">Order Confirmed</h1>
        <p>Hi there,</p>
        <p>Thank you for your purchase! We're preparing your order for dispatch.</p>
        <div style="background-color: #f8fafc; padding: 24px; border-radius: 8px; margin: 32px 0; border: 1px solid #e2e8f0; font-size: 14px;">
          <div style="display: flex; justify-content: space-between; font-weight: bold; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 16px;">
            <span>Order #${shortId}</span>
            <span>${formattedDate}</span>
          </div>
          <p><strong>Payment ID:</strong> ${razorpay_payment_id}</p>
          <p><strong>Status:</strong> Processing</p>
          <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 16px; text-align: right;">
            <p style="font-size: 18px; margin: 0;">Total Paid: <strong>₹${totalAmount}</strong></p>
            <p style="font-weight: bold; font-size: 12px; color: #10b981; margin-top: 4px;">Payment Verified ✓</p>
          </div>
        </div>
        <div style="text-align: center; margin-top: 32px;">
          <a href="https://lyrastylehub.com/account" style="background-color: #000; color: #fff; padding: 12px 32px; text-decoration: none; font-weight: bold; font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">View Order</a>
        </div>
      `;

      sendStoreEmail(recipientEmail, `Your LYRA Order Confirmed #${shortId}`, emailHtml)
        .catch((err: Error) => console.error("[Verify] Confirmation email failed (non-critical):", err.message));
    }

    return res.status(200).json({ status: "success", message: "Payment verified and order updated." });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Verify] CRITICAL — Firestore update failed:", message);
    // Payment is verified but DB update failed — this needs alerting in production
    return res.status(500).json({
      status: "error",
      message: "Payment verified but order update failed. Please contact support.",
    });
  }
}
