import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
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

app.use(helmet());
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

app.get("/", (_req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>LYRA | API Server</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
        <style>
            :root { --bg: #09090b; --primary: #ffffff; --accent: #3b82f6; --muted: #71717a; }
            body { 
                margin: 0; padding: 0; 
                background-color: var(--bg); 
                color: var(--primary); 
                font-family: 'Inter', sans-serif;
                display: flex; align-items: center; justify-content: center;
                height: 100vh; overflow: hidden;
            }
            .container { text-align: center; max-width: 600px; padding: 20px; }
            .logo { font-size: 4rem; font-weight: 900; letter-spacing: -2px; margin-bottom: 10px; background: linear-gradient(to bottom right, #fff, #71717a); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
            .status { display: inline-flex; align-items: center; gap: 8px; background: rgba(34, 197, 94, 0.1); color: #22c55e; padding: 6px 14px; border-radius: 99px; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; border: 1px solid rgba(34, 197, 94, 0.2); }
            .pulse { width: 8px; height: 8px; background: #22c55e; border-radius: 50%; box-shadow: 0 0 0 rgba(34, 197, 94, 0.4); animation: pulse 2s infinite; }
            @keyframes pulse { 0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); } 70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); } 100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); } }
            h1 { font-size: 1.5rem; margin: 20px 0 10px 0; font-weight: 700; }
            p { color: var(--muted); font-size: 0.95rem; line-height: 1.6; }
            .glass { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); padding: 30px; border-radius: 24px; backdrop-filter: blur(10px); }
            footer { margin-top: 40px; font-size: 0.75rem; color: #3f3f46; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="glass">
                <div class="logo">LYRA</div>
                <div class="status">
                    <div class="pulse"></div>
                    Backend Operational
                </div>
                <h1>Style Hub API Server</h1>
                <p>This server provides real-time e-commerce processing, secure payments via Razorpay, and automated communications for LYRA.</p>
            </div>
            <footer>Production Environment</footer>
        </div>
    </body>
    </html>
  `);
});


app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`[LYRA] Server running on port ${PORT}`);
});
