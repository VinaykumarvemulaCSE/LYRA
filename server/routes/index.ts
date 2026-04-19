import { Express, Request, Response, NextFunction } from "express";
import razorpayRouter from "./razorpay";
import emailRouter from "./email";
import uploadRouter from "./upload";
import adminRouter from "./admin";

export const registerRoutes = (app: Express): void => {
  // Support both flat paths (Vercel style) and nested paths (Legacy style)
  
  // 1. ADMIN
  app.use("/api/admin", adminRouter);

  // 5. SCRF (Render provides a dummy for cross-domain peace of mind)
  app.get("/api/csrf-token", (req: Request, res: Response) => {
      res.json({ token: "render_auth_verified_via_jwt" });
  });

  // 2. EMAIL
  app.use("/api/email", emailRouter);
  app.post("/api/contact", (req, res, next) => { req.query.type = "contact"; emailRouter(req, res, next); });

  // 3. RAZORPAY
  // Map flat Vercel-style routes to specific Router methods
  app.post("/api/razorpay-order", (req, res, next) => { req.url = "/order"; razorpayRouter(req, res, next); });
  app.post("/api/razorpay-verify", (req, res, next) => { req.url = "/verify"; razorpayRouter(req, res, next); });
  app.use("/api/razorpay", razorpayRouter);

  // 4. UPLOAD
  app.use("/api/upload", uploadRouter);
};
