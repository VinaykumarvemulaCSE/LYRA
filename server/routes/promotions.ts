import { Router, Request, Response } from "express";
import { getAdminDb } from "../utils/firebase";

const router = Router();

router.post("/validate", async (req: Request, res: Response) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Promo code is required" });
    }

    const db = getAdminDb();

    // Query for the active promo code
    const promoQuery = await db.collection("promotions")
      .where("code", "==", code.toUpperCase())
      .where("active", "==", true)
      .limit(1)
      .get();

    if (promoQuery.empty) {
      return res.status(404).json({ message: "Invalid or expired promo code" });
    }

    const promoData = promoQuery.docs[0].data();
    
    // Check expiration date if it exists
    if (promoData.expiresAt) {
      const expires = promoData.expiresAt.toDate();
      if (expires < new Date()) {
        return res.status(404).json({ message: "This promo code has expired" });
      }
    }

    // Check usage limits
    if (promoData.maxUses && promoData.usedCount >= promoData.maxUses) {
      return res.status(404).json({ message: "This promo code has reached its usage limit" });
    }

    // Return the discount info
    return res.status(200).json({
      code: promoData.code,
      discountPercent: promoData.discountPercent || 0,
      discountFlat: promoData.discountFlat || 0
    });

  } catch (error) {
    console.error("[PROMO ERROR]", error);
    res.status(500).json({ message: "Error validating promo code" });
  }
});

export default router;
