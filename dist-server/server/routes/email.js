"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const email_1 = require("../utils/email");
const router = (0, express_1.Router)();
router.post("/contact", async (req, res) => {
    try {
        const { firstName, lastName, email, subject, message } = req.body;
        if (!firstName || !email || !message) {
            return res.status(400).json({ message: "Missing required fields: firstName, email, message" });
        }
        const adminEmail = process.env.ADMIN_EMAIL;
        if (!adminEmail)
            return res.status(500).json({ message: "Admin email not configured on server." });
        const html = `
      <h2>New Contact Form Submission</h2>
      <p><strong>From:</strong> ${firstName} ${lastName} &lt;${email}&gt;</p>
      <p><strong>Subject:</strong> ${subject || "No Subject"}</p>
      <hr/>
      <p><strong>Message:</strong></p>
      <p>${String(message).replace(/\n/g, "<br/>")}</p>
    `;
        await (0, email_1.sendStoreEmail)(adminEmail, `[Contact] ${subject || "Message from " + firstName}`, html);
        return res.status(200).json({ status: "success" });
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        return res.status(500).json({ message: "Failed to send email", error: msg });
    }
});
router.post("/welcome", async (req, res) => {
    try {
        const { email, userName } = req.body;
        if (!email)
            return res.status(400).json({ message: "Email is required" });
        const html = `
      <h1>Welcome to LYRA, ${userName || "there"}!</h1>
      <p>We're thrilled to have you. Discover our latest collections and enjoy exclusive member benefits.</p>
    `;
        await (0, email_1.sendStoreEmail)(email, "Welcome to LYRA Style Hub", html);
        return res.status(200).json({ status: "success" });
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        return res.status(500).json({ error: msg });
    }
});
router.post("/shipping", async (req, res) => {
    try {
        const { email, orderId, trackingNum } = req.body;
        if (!email || !orderId)
            return res.status(400).json({ message: "Order ID and email are required" });
        const html = `
      <h2>Your Order #${String(orderId).substring(0, 8).toUpperCase()} has Shipped!</h2>
      <p>Tracking Number: <strong>${trackingNum || "Awaiting Update"}</strong></p>
    `;
        await (0, email_1.sendStoreEmail)(email, "Your LYRA Order is on its way 🚚", html);
        return res.status(200).json({ status: "success" });
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        return res.status(500).json({ error: msg });
    }
});
router.post("/test", async (req, res) => {
    try {
        const { email } = req.body;
        const recipient = email || process.env.ADMIN_EMAIL;
        if (!recipient)
            return res.status(400).json({ message: "No recipient email provided" });
        await (0, email_1.sendStoreEmail)(recipient, "LYRA Backend Test Email", "<p>✅ Email system is working correctly from Render.</p>");
        return res.status(200).json({ message: "Test email sent successfully" });
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        return res.status(500).json({ error: msg });
    }
});
exports.default = router;
