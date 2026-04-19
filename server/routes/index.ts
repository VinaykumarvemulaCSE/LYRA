import { Express } from "express";
import razorpayRouter from "./razorpay.js";
import emailRouter from "./email.js";
import uploadRouter from "./upload.js";
import adminRouter from "./admin.js";

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
