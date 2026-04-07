import type { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "crypto";
import { sendStoreEmail } from "./utils/email";

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

        // --- NEW: SEND AUTOMATIC INVOICE EMAIL ---
        try {
          const { totalAmount = "0" } = req.body;
          const emailHtml = `
            <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 16px; text-align: center;">Order Confirmed</h1>
            <p>Hi there,</p>
            <p>Thank you for your purchase. We're getting your order ready to be shipped. We will notify you when it has been sent.</p>
            
            <div style="background-color: #f8fafc; padding: 24px; border-radius: 8px; margin: 32px 0; border: 1px solid #e2e8f0; font-size: 14px;">
              <div style="display: flex; justify-content: space-between; font-weight: bold; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 16px;">
                <span>Order #${db_order_id.substring(0, 8).toUpperCase()}</span>
                <span>${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              <div style="margin-bottom: 16px;">
                <p><strong>Payment ID:</strong> ${razorpay_payment_id}</p>
                <p><strong>Status:</strong> Processing</p>
              </div>
              
              <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 16px; text-align: right;">
                <p style="font-size: 18px; margin: 0;">Total Paid: <strong>₹${totalAmount}</strong></p>
                <p style="font-weight: bold; font-size: 12px; color: #10b981; margin-top: 4px;">Payment Verified Successfully</p>
              </div>
            </div>

            <div style="text-align: center; margin-top: 32px;">
              <a href="https://lyrastylehub.com/account" style="background-color: #000; color: #fff; padding: 12px 32px; text-decoration: none; font-weight: bold; font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">View Order Status</a>
            </div>
          `;
          
          const userEmail = req.body.userEmail || process.env.VITE_ADMIN_EMAIL || "kumarvinay072007@gmail.com";
          await sendStoreEmail(userEmail, `Your LYRA Order Confirmed #${db_order_id.substring(0, 8).toUpperCase()}`, emailHtml);
        } catch (emailErr) {
          console.error("Failed to send order confirmation email:", emailErr);
          // Non-blocking: we still return success for the payment verification
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
