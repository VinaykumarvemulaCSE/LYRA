import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendStoreEmail } from "./utils/email";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const testEmail = req.query.email as string || "kumarvinay072007@gmail.com";
  
  try {
    console.log("Starting email test to:", testEmail);
    const result = await sendStoreEmail(
      testEmail, 
      "LYRA Email System Test 🚀", 
      "<h1>Test Successful!</h1><p>If you are reading this, your Nodemailer serverless function is working perfectly with Gmail SMTP.</p>"
    );
    
    return res.status(200).json({ 
        success: true, 
        message: "Test email dispatched", 
        to: testEmail,
        preview: result || "Sent via SMTP"
    });
  } catch (error: any) {
    console.error("Email Test Error:", error);
    return res.status(500).json({ 
        success: false, 
        message: error.message,
        stack: error.stack
    });
  }
}
