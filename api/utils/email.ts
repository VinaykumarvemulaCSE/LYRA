import nodemailer from "nodemailer";

// Using env or ethereal email for testing
const getTransporter = async () => {
    // If user provided real gmail credentials
    const user = process.env.VITE_EMAIL_USER || process.env.EMAIL_USER;
    const pass = process.env.VITE_EMAIL_APP_PASSWORD || process.env.EMAIL_APP_PASSWORD;

    console.log("Email Utility Init - User:", user ? "FOUND" : "MISSING");
    console.log("Email Utility Init - Pass:", pass ? "FOUND" : "MISSING");

    if (user && pass) {
        console.log("Using GMAIL SMTP Service...");
        return nodemailer.createTransport({
            service: "gmail",
            auth: { user, pass }
        });
    }

    console.log("Falling back to ETHEREAL Mock Service...");

    // Fallback to free ethereal email for easy debugging if user didn't set up gmail yet.
    // It captures emails and generates a preview URL.
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: testAccount.user, // generated ethereal user
            pass: testAccount.pass, // generated ethereal password
        },
    });
};

// Standard LYRA store styling matching the EmailPreviews.tsx
export const sendStoreEmail = async (to: string, subject: string, htmlContent: string) => {
    const transporter = await getTransporter();

    const layout = `
    <div style="max-width: 600px; margin: 0 auto; font-family: Helvetica, sans-serif; color: #000; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #09090b; color: #fff; padding: 32px; text-align: center;">
            <h2 style="margin: 0; font-size: 24px; letter-spacing: 4px;">LYRA</h2>
        </div>
        <div style="padding: 32px;">
            ${htmlContent}
        </div>
        <div style="border-top: 1px solid #eaeaea; padding: 24px; text-align: center; color: #64748b; font-size: 12px;">
            <p style="margin: 0;">© 2024 LYRA Style Hub. All rights reserved.</p>
            <p style="margin: 8px 0 0;">123 Luxury Lane, Bandra West, Mumbai 400050</p>
        </div>
    </div>
    `;

    try {
        const info = await transporter.sendMail({
            from: '"LYRA Support" <hello@lyrastylehub.com>', 
            to: to,
            subject: subject,
            html: layout,
        });

        console.log("Message sent to", to, " | ID:", info.messageId);
        
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
            console.log("Preview URL: %s", previewUrl);
        }
        
        return previewUrl; 
    } catch (err: any) {
        console.error("Critical: Nodemailer failed to send email to", to);
        console.error("Error details:", err);
        throw err;
    }
}
