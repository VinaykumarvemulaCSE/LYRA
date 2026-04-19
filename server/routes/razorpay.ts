import { Router } from "express";
import Razorpay from "razorpay";
import * as crypto from "crypto";
import { getAdminDb } from "../utils/firebase";
import { FieldValue } from "firebase-admin/firestore";
import { sendStoreEmail } from "../utils/email";

const router = Router();
const MAX_AMOUNT_INR = 500000;

router.post("/order", async (req, res) => {
  try {
    const { amount, receipt } = req.body;

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({ message: "A valid positive amount is required." });
    }
    if (amount > MAX_AMOUNT_INR) {
      return res.status(400).json({ message: `Order amount exceeds the maximum allowed value of ₹${MAX_AMOUNT_INR}.` });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error("[RazorpayOrder] Credentials missing.");
      return res.status(500).json({ message: "Payment gateway not configured." });
    }

    const instance = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const order = await instance.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: receipt || `lyra_${Date.now()}`,
    });

    console.log(`[RazorpayOrder] Created: ${order.id}`);
    return res.status(200).json(order);

  } catch (error: any) {
    console.error("[RazorpayOrder] Failed:", error.message);
    return res.status(500).json({ message: "Failed to create order.", error: error.message });
  }
});

router.post("/verify", async (req, res) => {
  try {
    const { db_order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, userEmail } = req.body;

    if (!db_order_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ status: "failure", message: "Required fields are missing." });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET?.trim();
    if (!secret) {
      throw new Error("Razorpay secret missing.");
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ status: "failure", message: "Invalid signature." });
    }

    const adminDb = getAdminDb();
    const orderRef = adminDb.collection("orders").doc(db_order_id);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return res.status(404).json({ status: "error", message: "Order not found." });
    }

    const orderData = orderSnap.data() || {};
    const items = orderData.items ?? [];

    await orderRef.update({
      status: "processing",
      paymentStatus: "paid",
      paymentId: razorpay_payment_id,
      updatedAt: FieldValue.serverTimestamp(),
    });

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

    const recipient = userEmail || orderData.shippingAddress?.email;
    if (recipient) {
      const shortId = db_order_id.substring(0, 8).toUpperCase();
      sendStoreEmail(recipient, `Your LYRA Order Confirmed #${shortId}`, `Your payment has been successfully verified.`)
        .catch(err => console.error("[Email Error]:", err.message));
    }

    return res.status(200).json({ status: "success", message: "Verified." });

  } catch (error: any) {
    console.error("[Verify Error]:", error.message);
    return res.status(500).json({ status: "error", message: error.message });
  }
});

export default router;
