import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getAdminDb } from "../utils/firebase-admin";
import { verifyAdmin } from "../utils/auth";
import { verifyCsrfToken } from "../utils/csrf";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method Not Allowed" });

  // 1. Security
  const isAdmin = await verifyAdmin(req);
  if (!isAdmin) return res.status(403).json({ message: "Admin access required" });
  if (!verifyCsrfToken(req)) return res.status(403).json({ message: "CSRF token invalid" });

  const { action } = req.body;
  const db = getAdminDb();

  try {
    if (action === "purge_orders") {
      const orders = await db.collection("orders").get();
      const batch = db.batch();
      orders.forEach((doc: any) => batch.delete(doc.ref));
      await batch.commit();
      return res.status(200).json({ status: "success", message: `Deleted ${orders.size} test orders` });
    }

    if (action === "purge_reviews") {
      const reviews = await db.collection("reviews").get();
      const batch = db.batch();
      reviews.forEach((doc: any) => batch.delete(doc.ref));
      await batch.commit();
      return res.status(200).json({ status: "success", message: `Deleted ${reviews.size} test reviews` });
    }

    if (action === "sync_stock") {
      // Logic to reset all stock to default (example 10)
      const products = await db.collection("products").get();
      const batch = db.batch();
      products.forEach((doc: any) => {
        const data = doc.data();
        if (data.variants) {
           const updatedVariants = data.variants.map((v: any) => ({ ...v, stock: 10 }));
           batch.update(doc.ref, { variants: updatedVariants, inStock: true });
        }
      });
      await batch.commit();
      return res.status(200).json({ status: "success", message: "Stock levels reset for production" });
    }

    return res.status(400).json({ message: "Invalid maintenance action" });
  } catch (err: any) {
    return res.status(500).json({ message: "Maintenance failed", error: err.message });
  }
}
