import type { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "crypto";
import { serialize } from "cookie";

/**
 * Validates the CSRF token from the x-csrf-token header against the secure HTTPOnly cookie
 */
export function verifyCsrfToken(req: VercelRequest): boolean {
  const headerToken = req.headers["x-csrf-token"];
  const cookieToken = req.cookies["csrf_token"];

  if (!headerToken || !cookieToken) {
    return false;
  }

  // Use timing-safe equal to prevent timing attacks
  try {
    return crypto.timingSafeEqual(Buffer.from(headerToken as string), Buffer.from(cookieToken));
  } catch (e) {
    return false;
  }
}

/**
 * Sets a new CSRF token in the response cookie
 */
export function setCsrfToken(res: VercelResponse): string {
  const token = crypto.randomBytes(32).toString("hex");
  
  const cookie = serialize("csrf_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 2 // 2 hours
  });
  
  res.setHeader("Set-Cookie", cookie);
  return token;
}
