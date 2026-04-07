import type { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "crypto";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { db_order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const secret = process.env.RAZORPAY_KEY_SECRET || process.env.VITE_RAZORPAY_KEY_SECRET; // Falling back if user hasn't fixed env yet
    if (!secret) throw new Error("Server secret key is not configured.");

    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature === razorpay_signature) {
      if (db_order_id) {
        // Update Firestore order status using unauth REST call or client SDK.
        // We will fetch the Firebase URL using standard REST to avoid importing client bundle here.
        const project = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
        if (project) {
          const fbEndpoint = `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/orders/${db_order_id}`;
          
          await fetch(`${fbEndpoint}?updateMask.fieldPaths=status&updateMask.fieldPaths=paymentStatus&updateMask.fieldPaths=paymentId`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fields: {
                status: { stringValue: "processing" },
                paymentStatus: { stringValue: "paid" },
                paymentId: { stringValue: razorpay_payment_id }
              }
            })
          }).catch(console.error); // Best effort, since public REST needs specific rules
        }
      }

      return res.status(200).json({ status: "success", message: "Payment verified successfully" });
    } else {
      return res.status(400).json({ status: "failure", message: "Invalid Signature" });
    }
  } catch (error: any) {
    console.error("Razorpay Verification Error:", error);
    return res.status(500).json({ message: "Server error during verification", error: error.message });
  }
}
