import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

/**
 * Creates a Nodemailer transporter using server-only Gmail credentials.
 *
 * IMPORTANT: Never read VITE_ prefixed variables here — those are baked
 * into the client bundle by Vite and are visible to anyone in DevTools.
 * Only read plain server-side env vars: EMAIL_USER, EMAIL_APP_PASSWORD.
 *
 * Throws a clear error if credentials are missing instead of silently
 * falling back to Ethereal (which would swallow production emails).
 */
const getTransporter = (): Transporter => {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_APP_PASSWORD;

    if (!user || !pass) {
        throw new Error(
            "Email credentials not configured. " +
            "Set EMAIL_USER and EMAIL_APP_PASSWORD in Vercel environment variables."
        );
    }

    return nodemailer.createTransport({
        service: "gmail",
        auth: { user, pass },
    });
};

// Standard LYRA store email layout
export const sendStoreEmail = async (to: string, subject: string, htmlContent: string): Promise<void> => {
    const transporter = getTransporter();

    const layout = `
    <div style="max-width: 600px; margin: 0 auto; font-family: Helvetica, sans-serif; color: #000; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #09090b; color: #fff; padding: 32px; text-align: center;">
            <h2 style="margin: 0; font-size: 24px; letter-spacing: 4px;">LYRA</h2>
        </div>
        <div style="padding: 32px;">
            ${htmlContent}
        </div>
        <div style="border-top: 1px solid #eaeaea; padding: 24px; text-align: center; color: #64748b; font-size: 12px;">
            <p style="margin: 0;">© ${new Date().getFullYear()} LYRA Style Hub. All rights reserved.</p>
            <p style="margin: 8px 0 0;">Mumbai, India</p>
        </div>
    </div>
    `;

    const info = await transporter.sendMail({
        from: '"LYRA Support" <hello@lyrastylehub.com>',
        to,
        subject,
        html: layout,
    });

    console.log(`[Email] Sent to ${to} | ID: ${info.messageId}`);
};
