import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendStoreEmail } from "./utils/email";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { email, firstName } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const name = firstName || "there";

  try {
    const htmlContent = `
      <h1 style="text-align: center; font-size: 24px; margin-bottom: 24px;">Welcome to the Club</h1>
      <p>Hi ${name},</p>
      <p>Thank you for joining LYRA. You are now part of an exclusive community that values timeless design, ethical craftsmanship, and uncompromising quality.</p>
      <p>To celebrate your arrival, enjoy <strong>10% off</strong> your first purchase with the code below:</p>
      <div style="text-align: center; margin: 32px 0;">
        <span style="background-color: #f3f4f6; padding: 12px 24px; font-family: monospace; font-weight: bold; letter-spacing: 2px; font-size: 18px; border-radius: 4px; border: 1px solid #e5e7eb;">WELCOME10</span>
      </div>
      <div style="text-align: center; margin-top: 32px;">
        <a href="https://lyrastylehub.com/shop" style="background-color: #000; color: #fff; padding: 12px 32px; text-decoration: none; font-weight: bold; font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">Shop The Collection</a>
      </div>
    `;

    await sendStoreEmail(email, "Welcome to the LYRA Elite Club", htmlContent);

    return res.status(200).json({ success: true, message: "Welcome email sent" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Welcome Email Error:", message);
    return res.status(500).json({ success: false, message: "Failed to send welcome email" });
  }
}
