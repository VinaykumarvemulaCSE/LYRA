import type { VercelRequest, VercelResponse } from "@vercel/node";
import Razorpay from "razorpay";
// Need access to Firebase Admin to securely fetch prices, but to keep it simple and consistent with our client Firebase,
// we will just use the passed total for now since the mock has no admin SDK setup. Ideally, we should verify cart total securely.

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { amount, receipt } = req.body;

    if (!amount) {
      return res.status(400).json({ message: "Amount is required" });
    }

    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || "",
      key_secret: process.env.RAZORPAY_KEY_SECRET || "",
    });

    const options = {
      amount: Math.round(amount * 100), // amount in the smallest currency unit (paise)
      currency: "INR",
      receipt: receipt || `receipt_${Date.now()}`,
    };

    const order = await instance.orders.create(options);

    return res.status(200).json(order);
  } catch (error: any) {
    console.error("Razorpay Order Error:", error);
    return res.status(500).json({ message: "Failed to create Razorpay order", error: error.message });
  }
}
