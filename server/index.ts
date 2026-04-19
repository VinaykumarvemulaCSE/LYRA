import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import fs from "fs";
import { registerRoutes } from "./routes";

// Load .env only in local development — Render injects env vars directly
try {
  const dotenv = require("dotenv");
  dotenv.config();
} catch {
  // dotenv not available in production — that's fine
}

const app = express();
const PORT = process.env.PORT || 3001;
console.log("[LYRA] Booting v2.0.1 (Express 5 Audited)...");

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      "default-src": ["'self'"],
      "connect-src": ["'self'", "https://*.googleapis.com", "https://*.firebaseio.com", "https://*.firebase.com", "https://*.cloudfunctions.net"],
      "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://*.googleapis.com", "https://*.firebase.com"],
      "img-src": ["'self'", "data:", "blob:", "https://firebasestorage.googleapis.com", "https://*.githubusercontent.com", "https://*.cloudinary.com", "https://*.google.com"],
      "frame-src": ["'self'", "https://*.firebaseapp.com", "https://*.firebase.com"],
      "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      "font-src": ["'self'", "https://fonts.gstatic.com"]
    }
  }
}));

app.use(cors({
  origin: process.env.CLIENT_URL || "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);

registerRoutes(app);

const distPath = path.join(process.cwd(), "dist");

if (fs.existsSync(distPath)) {
  console.log(`[LYRA] Serving static files from: ${distPath}`);
  app.use(express.static(distPath));
  
  // High-compatibility catch-all for SPA routing
  app.get(/.*/, (req: Request, res: Response, next: NextFunction) => {
    // If it's an API call that somehow reached here, 404 it
    if (req.path.startsWith("/api")) {
      return res.status(404).json({ error: "API Route Not Found" });
    }
    
    // Send index.html for all other routes (SPA)
    const indexPath = path.join(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      next();
    }
  });
} else {
  // Fallback if built incrementally 
  app.get("/", (_req: Request, res: Response) => {
    res.send("LYRA Production Server Running");
  });
}


app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`[LYRA] Server running on port ${PORT}`);
});
