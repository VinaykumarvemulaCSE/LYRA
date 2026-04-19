import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendStoreEmail } from "./utils/email.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method Not Allowed" });

  const { type, ...data } = req.body;

  try {
    if (type === "contact" || req.url?.includes("contact")) {
      const { name, email, subject, message } = data;
      
      // 1. Notify Admin
      await sendStoreEmail({
        to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER || "",
        subject: `[Contact Form] ${subject || "New Inquiry"}`,
        template: "order_confirmation", // Using confirmation template layout for now
        data: {
          orderId: "Contact Form",
          customerName: name,
          totalAmount: 0,
          items: [{ name: "Subject", quantity: 1, price: 0, selectedColor: subject, selectedSize: "N/A" }],
          shippingAddress: `Message: ${message}\nFrom: ${email}`
        }
      });

      // 2. Auto-reply to user
      await sendStoreEmail({
        to: email,
        subject: "Message Received | LYRA Style Hub",
        template: "welcome",
        data: { customerName: name }
      });

      return res.status(200).json({ status: "success", message: "Inquiry sent" });
    }

    if (type === "welcome") {
      await sendStoreEmail({
        to: data.email,
        subject: "Welcome to LYRA | Your Luxury Journey Begins",
        template: "welcome",
        data: { customerName: data.name }
      });
      return res.status(200).json({ status: "success" });
    }

    if (type === "shipping") {
       await sendStoreEmail({
        to: data.email,
        subject: `Your Order #${data.orderId} has been Shipped!`,
        template: "shipping_update",
        data: {
          orderId: data.orderId,
          customerName: data.name,
          trackingNumber: data.trackingNumber,
          trackingUrl: data.trackingUrl
        }
      });
      return res.status(200).json({ status: "success" });
    }

    return res.status(400).json({ message: "Invalid email type" });
  } catch (err: any) {
    return res.status(500).json({ message: "Email failed", error: err.message });
  }
}
