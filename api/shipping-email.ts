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
    const shortOrderId = orderId.substring(0, 8).toUpperCase();
    
    const htmlContent = `
      <h1 style="text-align: center; font-size: 24px; margin-bottom: 8px;">Your Order is on its Way!</h1>
      <p style="text-align: center; color: #64748b; margin-bottom: 32px;">Great news! Your package has been handed over to our courier partner.</p>
      
      <div style="text-align: center; margin: 32px 0; padding: 32px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #f8fafc;">
        <p style="text-transform: uppercase; font-size: 10px; font-weight: bold; color: #64748b; letter-spacing: 2px; margin-bottom: 12px;">Tracking Number</p>
        <p style="font-family: monospace; font-size: 20px; font-weight: bold; margin-bottom: 16px; letter-spacing: 1px;">${trackingNumber}</p>
        <p style="font-size: 14px; color: #475569; margin-bottom: 24px;">Carrier: <strong>${carrier}</strong></p>
        <a href="https://www.bluedart.com/tracking" style="background-color: #000; color: #fff; padding: 12px 32px; text-decoration: none; font-weight: bold; font-size: 12px; letter-spacing: 1px; text-transform: uppercase; display: inline-block;">Track Package</a>
      </div>
      
      <div style="background-color: #fff9f0; padding: 16px; border-radius: 8px; border: 1px solid #ffedd5; margin-bottom: 24px;">
        <p style="text-align: center; font-size: 12px; color: #9a3412; margin: 0;">Please note that it may take up to 24 hours for tracking information to appear on the carrier's website.</p>
      </div>

      <p style="font-size: 14px; color: #475569;">Order Reference: <strong>#${shortOrderId}</strong></p>
    `;

    const previewUrl = await sendStoreEmail(email, `Shipping Update: Order #${shortOrderId} is out!`, htmlContent);

    return res.status(200).json({ success: true, message: "Shipping notification sent", previewUrl });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Shipping Email Error:", message);
    return res.status(500).json({ success: false, message: "Failed to send shipping email" });
  }
}
