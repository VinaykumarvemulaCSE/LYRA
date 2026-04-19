import { Request, Response, NextFunction } from "express";
import { adminAuth, adminDb } from "../utils/firebase";

export const protectAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const token = authHeader.split("Bearer ")[1];
    if (!adminAuth) {
      return res.status(500).json({ message: "Auth system offline" });
    }

    // 1. Verify the Token
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // 2. Check Role in Firestore OR check against ADMIN_EMAIL env var
    if (!adminDb) {
      return res.status(500).json({ message: "Database system offline" });
    }
    
    const userDoc = await adminDb.collection("users").doc(uid).get();
    const userData = userDoc.data();
    const userEmail = decodedToken.email?.toLowerCase();
    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();

    const isRoleAdmin = userData?.role === "admin";
    const isEmailAdmin = adminEmail && userEmail === adminEmail;

    if (!isRoleAdmin && !isEmailAdmin) {
      console.warn(`[SECURITY] Unauthorized admin attempt by Email: ${userEmail}`);
      return res.status(403).json({ message: "Access denied: Admins only" });
    }

    // Success - user is an admin
    (req as any).user = decodedToken;
    next();
  } catch (error) {
    console.error("[AUTH ERROR]", error);
    res.status(403).json({ message: "Invalid or expired token" });
  }
};
