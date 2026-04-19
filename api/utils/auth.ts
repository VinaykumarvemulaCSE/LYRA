import type { VercelRequest } from "@vercel/node";
import { getAuth } from "firebase-admin/auth";
import { getAdminDb } from "./firebase-admin.js";

/**
 * Validates a Firebase ID Token passed in the Authorization header.
 * @returns DecodedIdToken if valid, null otherwise
 */
export async function verifyAuth(req: VercelRequest) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }
    const token = authHeader.split("Bearer ")[1];
    
    // Ensure admin app is initialized (getAdminDb does this under the hood)
    getAdminDb();
    
    const decodedToken = await getAuth().verifyIdToken(token);
    return decodedToken;
  } catch (err) {
    console.error("[Auth] Verify token failed:", err);
    return null;
  }
}

/**
 * Centralized constant to match the frontend admin check.
 */
export function isUserAdmin(email?: string | null): boolean {
  if (!email) return false;
  const adminEmail = process.env.ADMIN_EMAIL || process.env.VITE_ADMIN_EMAIL;
  if (!adminEmail) return false;
  return email.toLowerCase() === adminEmail.toLowerCase();
}

/**
 * Convenience method to verify both auth and admin status.
 */
export async function verifyAdmin(req: VercelRequest) {
  const decoded = await verifyAuth(req);
  if (!decoded) return false;
  return isUserAdmin(decoded.email);
}
