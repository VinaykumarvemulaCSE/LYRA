import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as crypto from "crypto";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { sendStoreEmail } from "./utils/email.js";

let adminDbCache: any = null;

const getAdminDb = () => {
    if (!adminDbCache) {
      if (getApps().length === 0) {
        const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
        let serviceAccount;

        if (serviceAccountJson && serviceAccountJson.trim().startsWith("{")) {
          serviceAccount = JSON.parse(serviceAccountJson);
        } else if (process.env.FB_PROJECT_ID && process.env.FB_CLIENT_EMAIL && process.env.FB_PRIVATE_KEY) {
          serviceAccount = {
            projectId: process.env.FB_PROJECT_ID,
            clientEmail: process.env.FB_CLIENT_EMAIL,
            privateKey: process.env.FB_PRIVATE_KEY.replace(/\\n/g, '\n'),
          };
        } else {
          throw new Error("Missing Firebase credentials (FB_PROJECT_ID, FB_CLIENT_EMAIL, FB_PRIVATE_KEY) in Vercel Environment.");
        }
        
        initializeApp({ credential: cert(serviceAccount) });
      }
      adminDbCache = getFirestore();
    }
    return adminDbCache;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ message: "Method Not Allowed" });
    }

    const { db_order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, userEmail } = req.body;

    if (!db_order_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ status: "failure", message: "Required fields are missing." });
    }

    // 1. Initialize Firestore Database (with cache and dynamic vars)
    const adminDb = getAdminDb();

    // 2. HMAC Verification 
    const secret = process.env.RAZORPAY_KEY_SECRET?.trim();
    if (!secret) {
      throw new Error("Razorpay secret (RAZORPAY_KEY_SECRET) is missing in Vercel.");
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.warn(`[Verify] Signature mismatch for Order: ${razorpay_order_id}`);
      return res.status(400).json({ status: "failure", message: "Invalid payment signature." });
    }

    // 3. Update Database
    const orderRef = adminDb.collection("orders").doc(db_order_id);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return res.status(404).json({ status: "error", message: "Order not found in database." });
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

    // 4. Send Email
    // 4. Send Emails
    let previewUrl = null;
    const recipient = userEmail || orderData.shippingAddress?.email;
    const adminEmail = process.env.ADMIN_EMAIL;
    const shortOrderId = db_order_id.substring(0, 8).toUpperCase();

    if (recipient) {
      try {
        const orderDate = new Date().toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' });
        
        // Build items HTML for email
        const itemsHtml = items.map((item: any) => `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #f1f5f9;">
            <div style="flex: 1;">
              <p style="margin: 0; font-weight: bold; font-size: 14px;">${item.name}</p>
              <p style="margin: 4px 0 0; color: #64748b; font-size: 12px;">Size: ${item.size} | Color: ${item.color} | Qty: ${item.quantity}</p>
            </div>
            <p style="margin: 0; font-weight: bold; font-size: 14px;">₹${(item.price * item.quantity).toLocaleString("en-IN")}</p>
          </div>
        `).join("");

        const userHtml = `
          <h1 style="text-align: center; font-size: 24px; margin-bottom: 8px;">Order Confirmed</h1>
          <p style="text-align: center; color: #64748b; margin-bottom: 32px;">Thank you for your purchase. We're getting your order ready.</p>
          
          <div style="background-color: #f8fafc; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; font-weight: bold; border-bottom: 1px solid #e2e8f0; pb: 12px; margin-bottom: 16px;">
              <span style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Order #${shortOrderId}</span>
              <span style="font-size: 12px; color: #64748b;">${orderDate}</span>
            </div>
            
            ${itemsHtml}
            
            <div style="padding-top: 16px; text-align: right;">
              <p style="margin: 0; font-size: 18px; font-weight: bold;">Total: ₹${orderData.totalAmount?.toLocaleString("en-IN") || orderData.price?.toLocaleString("en-IN")}</p>
            </div>
          </div>

          <div style="margin-bottom: 32px;">
            <p style="font-weight: bold; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 12px;">Shipping Address</p>
            <p style="margin: 0; font-size: 14px; color: #475569;">${orderData.shippingAddress?.fullName || 'Valued Customer'}</p>
            <p style="margin: 4px 0 0; font-size: 14px; color: #475569;">${orderData.shippingAddress?.addressLine1}</p>
            <p style="margin: 4px 0 0; font-size: 14px; color: #475569;">${orderData.shippingAddress?.city}, ${orderData.shippingAddress?.state} - ${orderData.shippingAddress?.pincode}</p>
          </div>

          <div style="text-align: center;">
            <a href="https://lyrastylehub.com/profile" style="background-color: #000; color: #fff; padding: 12px 32px; text-decoration: none; font-weight: bold; font-size: 12px; letter-spacing: 1px; text-transform: uppercase; display: inline-block;">View Order Status</a>
          </div>
        `;

        previewUrl = await sendStoreEmail({
          to: recipient,
          subject: `Your LYRA Order Confirmed #${shortOrderId}`,
          html: userHtml
        });

        // 5. Notify Admin of Sale
        if (adminEmail) {
          const adminHtml = `
            <h1 style="font-size: 20px; font-weight: bold; margin-bottom: 24px; text-align: center;">New Sale - ₹${orderData.totalAmount?.toLocaleString("en-IN")}</h1>
            <div style="background-color: #f0fdf4; border: 1px solid #bcf0da; padding: 24px; border-radius: 8px; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
              <p><strong>Order ID:</strong> ${shortOrderId}</p>
              <p><strong>Customer:</strong> ${orderData.shippingAddress?.fullName} (${recipient})</p>
              <p><strong>Amount:</strong> ₹${orderData.totalAmount?.toLocaleString("en-IN")}</p>
            </div>
            <div style="background-color: #f8fafc; padding: 24px; border-radius: 8px; font-size: 14px;">
              <p style="font-weight: bold; margin-bottom: 12px;">Items Subscribed:</p>
              ${itemsHtml}
            </div>
            <div style="text-align: center; margin-top: 32px;">
              <a href="https://lyrastylehub.com/admin" style="display: inline-block; background-color: #000; color: #fff; text-decoration: none; padding: 12px 24px; font-weight: bold; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">Open Admin Panel</a>
            </div>
          `;
          await sendStoreEmail({
            to: adminEmail,
            subject: `[New Sale] Order #${shortOrderId} - ₹${orderData.totalAmount?.toLocaleString("en-IN")}`,
            html: adminHtml
          });
        }

      } catch (err) {
        console.error("[Email Error]:", err);
      }
    }

    return res.status(200).json({ 
      status: "success", 
      message: "Payment verified successfully.",
      previewUrl
    });

  } catch (error: any) {
    console.error("[Fatal Handler Error]:", error.stack || error.message);
    return res.status(500).json({ status: "error", message: error.message });
  }
}
