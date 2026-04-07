import type { VercelRequest, VercelResponse } from "@vercel/node";
import Razorpay from "razorpay";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Health check
  if (req.method === "GET") {
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    return res.status(200).json({ 
      status: "ok", 
      hasKeyId: !!keyId,
      hasKeySecret: !!keySecret
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { amount, receipt } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Valid amount is required" });
    }

    const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error("Razorpay credentials missing. KeyId:", !!keyId, "Secret:", !!keySecret);
      return res.status(500).json({ message: "Payment gateway not configured" });
    }

    const instance = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const order = await instance.orders.create({
      amount: Math.round(amount * 100), // Razorpay needs paise (1 INR = 100 paise)
      currency: "INR",
      receipt: receipt || `lyra_${Date.now()}`,
    });

    console.log("Razorpay order created:", order.id, "Amount (paise):", order.amount);
    return res.status(200).json(order);
  } catch (error: any) {
    console.error("Razorpay Order Error:", error.error || error.message);
    return res.status(500).json({ 
      message: "Failed to create Razorpay order", 
      error: error?.error?.description || error.message 
    });
  }
}
