import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendStoreEmail } from "./utils/email";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { email, orderId, trackingNumber, carrier = "BlueDart Express" } = req.body;

  if (!email || !orderId || !trackingNumber) {
    return res.status(400).json({ message: "Missing required fields (email, orderId, trackingNumber)" });
  }

  try {
    const htmlContent = `
      <h1 style="text-align: center; font-size: 24px; margin-bottom: 24px;">Your Order is on its Way!</h1>
      <p>Hi there,</p>
      <p>Great news! Your order <strong>#${orderId.substring(0, 8).toUpperCase()}</strong> has been shipped and is currently on its way to you.</p>
      
      <div style="text-align: center; margin: 32px 0; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px; backgroundColor: #f9fafb;">
        <p style="text-transform: uppercase; font-size: 10px; font-weight: bold; color: #6b7280; letter-spacing: 1px; margin-bottom: 8px;">Tracking Number</p>
        <p style="font-family: monospace; font-size: 18px; font-weight: bold; margin-bottom: 16px;">${trackingNumber}</p>
        <p style="font-size: 14px; color: #4b5563; margin-bottom: 24px;">Carrier: ${carrier}</p>
        <a href="https://www.bluedart.com/tracking" style="background-color: #000; color: #fff; padding: 12px 32px; text-decoration: none; font-weight: bold; font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">Track Package</a>
      </div>
      
      <p style="text-align: center; font-size: 12px; color: #9ca3af;">Please note that it may take up to 24 hours for tracking information to be updated on the carrier's website.</p>
    `;

    await sendStoreEmail(email, `Shipping Update: Order #${orderId.substring(0, 8).toUpperCase()} is out!`, htmlContent);

    return res.status(200).json({ success: true, message: "Shipping notification sent" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Shipping Email Error:", message);
    return res.status(500).json({ success: false, message: "Failed to send shipping email" });
  }
}
