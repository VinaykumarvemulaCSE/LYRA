import { Router } from "express";
import { sendStoreEmail } from "../utils/email";

const router = Router();

router.post("/contact", async (req, res) => {
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
    `;

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) return res.status(500).json({ message: "Admin email not set" });
    
    await sendStoreEmail(adminEmail, `[Contact Form] ${subject || "No Subject"}`, htmlContent);
    return res.status(200).json({ status: "success" });
  } catch (error: any) {
    return res.status(500).json({ message: "Failed", error: error.message });
  }
});

router.post("/welcome", async (req, res) => {
    try {
        const { email, userName } = req.body;
        if (!email) return res.status(400).json({ message: "Email is required" });

        const html = `
            <h1>Welcome to LYRA, ${userName || "there"}!</h1>
            <p>We're thrilled to have you here. Discover our latest collections.</p>
        `;
        await sendStoreEmail(email, "Welcome to LYRA Style Hub", html);
        return res.status(200).json({ status: "success" });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

router.post("/shipping", async (req, res) => {
    try {
        const { email, orderId, trackingNum } = req.body;
        if (!email || !orderId) return res.status(400).json({ message: "Order ID and email are required" });

        const html = `
            <h2>Your Order #${orderId.substring(0,8).toUpperCase()} has Shipped!</h2>
            <p>Tracking Number: ${trackingNum || "Awaiting Update"}</p>
        `;
        await sendStoreEmail(email, "Your LYRA Order is on its way", html);
        return res.status(200).json({ status: "success" });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

router.post("/test", async (req, res) => {
    try {
        const { email } = req.body;
        await sendStoreEmail(email || process.env.ADMIN_EMAIL!, "LYRA System Test", "This is a test email from the Render backend.");
        return res.status(200).json({ message: "Sent" });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

export default router;
