import type { VercelRequest, VercelResponse } from "@vercel/node";
import { setCsrfToken } from "./utils/csrf.js";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  // Generate and set the HttpOnly cookie, getting the token value back
  const token = setCsrfToken(res);

  // Return the token to the client so it can attach it as a header on subsequent requests
  return res.status(200).json({ token });
}
