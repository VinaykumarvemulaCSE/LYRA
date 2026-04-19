import { Router, Request, Response } from "express";
import { sendStoreEmail } from "../utils/email";

const router = Router();

/**
 * Consolidated Email Router for Render Backend
 * Handles: contact, welcome, shipping, test
 */
router.all("/", async (req: Request, res: Response) => {
  const type = req.query.type || req.body.type;
  const data = req.body;

  try {
    if (type === "contact" || req.url?.includes("contact")) {
      const { firstName, lastName, email, subject, message } = data;
      const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
      if (!adminEmail) return res.status(500).json({ message: "Admin email not configured" });

      const html = `<h2>New Inquiry</h2><p>From: ${firstName} ${lastName} (${email})</p><p>Msg: ${message}</p>`;
      await sendStoreEmail(adminEmail, `[Contact] ${subject || "Inquiry"}`, html);
      return res.status(200).json({ status: "success" });
    }

    if (type === "welcome") {
      const { email, name } = data;
      await sendStoreEmail(email, "Welcome to LYRA", `<h1>Hi ${name || 'Explorer'}!</h1><p>Welcome.</p>`);
      return res.status(200).json({ status: "success" });
    }

    if (type === "shipping") {
      const { email, orderId, trackingNumber } = data;
      await sendStoreEmail(email, "Order Shipped", `<p>Order ${orderId} is on its way. Tracking: ${trackingNumber}</p>`);
      return res.status(200).json({ status: "success" });
    }

    res.status(400).json({ error: "Invalid email type" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Support legacy paths for some time
router.post("/contact", (req, res) => { req.query.type = "contact"; router(req, res, () => {}); });
router.post("/welcome", (req, res) => { req.query.type = "welcome"; router(req, res, () => {}); });
router.post("/shipping", (req, res) => { req.query.type = "shipping"; router(req, res, () => {}); });

export default router;
