import { Express, Request, Response, NextFunction } from "express";
import razorpayRouter from "./razorpay";
import emailRouter from "./email";
import uploadRouter from "./upload";
import adminRouter from "./admin";

export const registerRoutes = (app: Express): void => {
  app.use("/api/razorpay", razorpayRouter);
  app.use("/api/email", emailRouter);
  app.use("/api/upload", uploadRouter);
  app.use("/api/admin", adminRouter);

  // Legacy alias: /api/contact → /api/email/contact
  app.post("/api/contact", (req: Request, res: Response, next: NextFunction) => {
    req.url = "/contact";
    emailRouter(req, res, next);
  });
};
