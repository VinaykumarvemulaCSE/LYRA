import { Router, Request, Response } from "express";
import { protectAdmin } from "../middleware/auth";
import { getAdminDb } from "../utils/firebase";

const router = Router();

/**
 * Consolidated Admin Router
 * Supports both /api/admin?action=diagnostics (GET/POST) 
 * and specific maintenance tasks (POST).
 */
router.all("/", protectAdmin, async (req: Request, res: Response) => {
  const action = req.query.action || req.body.action;

  // 1. DIAGNOSTICS (Handle both GET and POST with action=diagnostics)
  if (req.method === "GET" || action === "diagnostics") {
    const vars = [
      "FB_PROJECT_ID", "FB_CLIENT_EMAIL", "FB_PRIVATE_KEY",
      "RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET",
      "EMAIL_USER", "EMAIL_APP_PASSWORD",
      "GITHUB_TOKEN", "ADMIN_EMAIL"
    ];
    const results = vars.map(v => ({ name: v, set: !!process.env[v] }));
    
    // Test Database connection
    let dbStatus = "unknown";
    try {
        const db = getAdminDb();
        const snap = await db.collection("products").limit(1).get();
        dbStatus = `connected (${snap.size} products)`;
    } catch(e: any) {
        dbStatus = `error: ${e.message}`;
    }

    return res.json({ 
        status: "ok", 
        environment: results, 
        database: dbStatus,
        timestamp: new Date().toISOString() 
    });
  }

  // 2. MAINTENANCE ACTIONS (POST only)
  if (req.method === "POST") {
    const db = getAdminDb();
    
    if (action === "purge_orders") {
        const orders = await db.collection("orders").get();
        const batch = db.batch();
        orders.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        return res.json({ message: `Purged ${orders.size} orders` });
    }

    if (action === "purge_reviews") {
        const reviews = await db.collection("reviews").get();
        const batch = db.batch();
        reviews.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        return res.json({ message: `Purged ${reviews.size} reviews` });
    }

    if (action === "sync_stock") {
        const products = await db.collection("products").get();
        const batch = db.batch();
        products.forEach(doc => {
            const data = doc.data();
            if (data.variants) {
                const updated = data.variants.map((v: any) => ({ ...v, stock: 10 }));
                batch.update(doc.ref, { variants: updated, inStock: true });
            }
        });
        await batch.commit();
        return res.json({ message: "Stock levels reset for production" });
    }
  }

  res.status(400).json({ error: "Invalid action or method" });
});

export default router;
