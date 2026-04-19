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

    const adminEmail = process.env.ADMIN_EMAIL;
    
    // 1. Send Notification to Admin
    const adminHtml = `
      <h1 style="font-size: 20px; font-weight: bold; margin-bottom: 24px; text-align: center;">New Contact Form Submission</h1>
      <div style="background-color: #f8fafc; padding: 24px; border-radius: 8px; font-size: 14px; line-height: 1.6;">
        <p><strong>From:</strong> ${firstName} ${lastName || ""} (${email})</p>
        <p><strong>Subject:</strong> ${subject || "No Subject"}</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
        <p><strong>Message:</strong></p>
        <p style="white-space: pre-wrap;">${message}</p>
      </div>
      <div style="text-align: center; margin-top: 32px;">
        <a href="mailto:${email}" style="display: inline-block; background-color: #000; color: #fff; text-decoration: none; padding: 12px 24px; font-weight: bold; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">Reply to Customer</a>
      </div>
    `;

    if (adminEmail) {
      await sendStoreEmail(adminEmail, `[Contact Form] ${subject || "No Subject"}`, adminHtml);
    }

    // 2. Send Confirmation to User
    const userHtml = `
      <h1 style="text-align: center; font-size: 24px; margin-bottom: 24px;">Message Received</h1>
      <p>Hi ${firstName},</p>
      <p>Thank you for reaching out to us. We've received your message regarding "<strong>${subject || "General Inquiry"}</strong>" and our team will get back to you as soon as possible (usually within 24 hours).</p>
      <div style="background-color: #f9fafb; padding: 24px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 32px 0;">
        <p style="text-transform: uppercase; font-size: 10px; font-weight: bold; color: #6b7280; letter-spacing: 1px; margin-bottom: 12px;">Your Message Preview</p>
        <p style="font-style: italic; color: #4b5563;">"${message.length > 150 ? message.substring(0, 150) + "..." : message}"</p>
      </div>
      <p>In the meantime, feel free to browse our latest collection.</p>
      <div style="text-align: center; margin-top: 32px;">
        <a href="https://lyrastylehub.com/shop" style="background-color: #000; color: #fff; padding: 12px 32px; text-decoration: none; font-weight: bold; font-size: 12px; letter-spacing: 1px; text-transform: uppercase; display: inline-block;">Browse Collection</a>
      </div>
    `;

    const previewUrl = await sendStoreEmail(email, "We've received your message - LYRA Support", userHtml);

    return res.status(200).json({ status: "success", previewUrl });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Contact Form Error:", message);
    return res.status(500).json({ message: "Failed to send message", error: message });
  }
}
