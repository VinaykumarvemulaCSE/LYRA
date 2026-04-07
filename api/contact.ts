import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendStoreEmail } from "./utils/email";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { firstName, lastName, email, subject, message } = req.body;

    if (!firstName || !email || !message) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const htmlContent = `
      <h1 style="font-size: 20px; font-weight: bold; margin-bottom: 24px; text-align: center;">New Contact Form Submission</h1>
      
      <div style="background-color: #f8fafc; padding: 24px; border-radius: 8px; font-size: 14px; line-height: 1.6;">
        <p><strong>From:</strong> ${firstName} ${lastName} (${email})</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
        <p><strong>Message:</strong></p>
        <p style="white-space: pre-wrap;">${message}</p>
      </div>
      
      <div style="text-align: center; margin-top: 32px;">
        <a href="mailto:${email}" style="display: inline-block; background-color: #000; color: #fff; text-decoration: none; padding: 12px 24px; font-weight: bold; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">Reply to Customer</a>
      </div>
    `;

    // Send it to the store admin (or the user who submitted it if you want to send a receipt)
    const adminEmail = process.env.VITE_ADMIN_EMAIL || "kumarvinay072007@gmail.com";
    const previewUrl = await sendStoreEmail(adminEmail, `[Contact Form] ${subject}`, htmlContent);

    return res.status(200).json({ status: "success", previewUrl });
  } catch (error: any) {
    console.error("Contact Form Error:", error);
    return res.status(500).json({ message: "Failed to send message", error: error.message });
  }
}
