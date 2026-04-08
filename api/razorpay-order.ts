import type { VercelRequest, VercelResponse } from "@vercel/node";
import Razorpay from "razorpay";

// Maximum order value: ₹5,00,000 (5 lakh INR) — adjust per business rules
const MAX_AMOUNT_INR = 500000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { amount, receipt } = req.body;

    // --- Input validation ---
    if (!amount || typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({ message: "A valid positive amount is required." });
    }
    if (amount > MAX_AMOUNT_INR) {
      return res.status(400).json({ message: `Order amount exceeds the maximum allowed value of ₹${MAX_AMOUNT_INR}.` });
    }

    // Server-only credentials — never use VITE_ prefix for secrets
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error("[RazorpayOrder] Credentials missing. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
      return res.status(500).json({ message: "Payment gateway not configured. Contact support." });
    }

    const instance = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const order = await instance.orders.create({
      amount: Math.round(amount * 100), // Convert INR → paise
      currency: "INR",
      receipt: receipt || `lyra_${Date.now()}`,
    });

    console.log(`[RazorpayOrder] Created: ${order.id} | Amount: ₹${amount}`);
    return res.status(200).json(order);

  } catch (error: unknown) {
    const razorpayError = error as { error?: { description: string }; message?: string };
    const description = razorpayError?.error?.description || razorpayError?.message || "Unknown error";
    console.error("[RazorpayOrder] Failed to create order:", description);
    return res.status(500).json({
      message: "Failed to create payment order.",
      error: description,
    });
  }
}
