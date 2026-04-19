import type { VercelRequest, VercelResponse } from "@vercel/node";
import Razorpay from "razorpay";
import { getAdminDb } from "./utils/firebase-admin.js";
import { verifyCsrfToken } from "./utils/csrf.js";

const MAX_AMOUNT_INR = 500000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  // Verify CSRF Protection
  if (!verifyCsrfToken(req)) {
    return res.status(403).json({ message: "CSRF token missing or invalid." });
  }

  try {
    const { receipt, items, promoCode } = req.body;

    if (!receipt || !items || !Array.isArray(items)) {
      return res.status(400).json({ message: "Order ID and items are required." });
    }

    const adminDb = getAdminDb();
    
    // 1. Re-calculate price on server
    let calculatedSubtotal = 0;
    for (const item of items) {
      const productSnap = await adminDb.collection("products").doc(item.id).get();
      if (!productSnap.exists) {
        return res.status(400).json({ message: `Product ${item.id} not found.` });
      }
      const productData = productSnap.data();
      calculatedSubtotal += (productData.price * item.quantity);
    }

    let discount = 0;
    if (promoCode) {
      const promoSnap = await adminDb.collection("promotions").where("code", "==", promoCode).limit(1).get();
      if (!promoSnap.empty) {
        const promo = promoSnap.docs[0].data();
        if (promo.active) {
          discount = promo.discountFlat > 0 
            ? promo.discountFlat 
            : (calculatedSubtotal * (promo.discountPercent / 100));
        }
      }
    }

    const shipping = calculatedSubtotal > 5000 ? 0 : 500;
    const verifiedTotal = Math.max(0, calculatedSubtotal + shipping - discount);

    if (verifiedTotal > MAX_AMOUNT_INR) {
      return res.status(400).json({ message: "Order exceeds limit." });
    }

    // 2. Update the Firestore Order doc with the verified amount to ensure consistency
    await adminDb.collection("orders").doc(receipt).update({
      totalAmount: verifiedTotal,
      subTotal: calculatedSubtotal,
      discountAmount: discount,
      updatedAt: new Date()
    });

    // 3. Create Razorpay order
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return res.status(500).json({ message: "Gateway config error." });
    }

    const instance = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const order = await instance.orders.create({
      amount: Math.round(verifiedTotal * 100),
      currency: "INR",
      receipt: receipt,
    });

    console.log(`[SecureOrder] Verified: ${verifiedTotal} | Receipt: ${receipt}`);
    return res.status(200).json(order);

  } catch (error: any) {
    console.error("[SecureOrder] Error:", error.message);
    return res.status(500).json({ message: "Payment order creation failed.", error: error.message });
  }
}
