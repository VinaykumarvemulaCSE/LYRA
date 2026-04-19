import { Express } from "express";
import razorpayRouter from "./razorpay";
import emailRouter from "./email";
import uploadRouter from "./upload";
import adminRouter from "./admin";

export const registerRoutes = (app: Express) => {
  app.use("/api/razorpay", razorpayRouter);
  app.use("/api/email", emailRouter);
  app.use("/api/upload", uploadRouter);
  app.use("/api/admin", adminRouter);
  
  // Legacy support for single-file API paths if needed
  app.post("/api/contact", (req, res, next) => {
    // Forward to email router contact path
    req.url = "/contact";
    emailRouter(req, res, next);
  });
};
