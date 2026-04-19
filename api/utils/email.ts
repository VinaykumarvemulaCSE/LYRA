import * as nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

/**
 * Standard LYRA store email service.
 */

interface EmailOptions {
  to: string;
  subject: string;
  template?: "welcome" | "order_confirmation" | "shipping_update";
  data?: any;
  html?: string;
}

export const sendStoreEmail = async (options: EmailOptions): Promise<string | null> => {
    let transporter: Transporter;
    let isEthereal = false;

    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_APP_PASSWORD;

    if (user && pass) {
        transporter = nodemailer.createTransport({
            service: "gmail",
            auth: { user, pass },
        });
    } else {
        const account = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: account.smtp.host,
            port: account.smtp.port,
            secure: account.smtp.secure,
            auth: { user: account.user, pass: account.pass },
        });
        isEthereal = true;
    }

    // Logic to generate HTML from templates if provided
    let finalHtml = options.html || "";
    
    if (options.template === "welcome") {
      finalHtml = `
        <h1 style="font-size: 20px; font-weight: bold;">Welcome, ${options.data?.customerName || 'Luxury Explorer'}!</h1>
        <p>Your journey into minimal luxury starts here. Thank you for joining the LYRA community.</p>
        <div style="margin-top: 24px;">
          <a href="https://lyra-style-hub.vercel.app/shop" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Explore Collection</a>
        </div>
      `;
    } else if (options.template === "order_confirmation") {
      const itemsHtml = options.data?.items?.map((item: any) => `
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${item.name} (${item.quantity})</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">₹${item.price}</td>
        </tr>
      `).join("");

      finalHtml = `
        <h3>Order Confirmation: #${options.data?.orderId}</h3>
        <p>Hi ${options.data?.customerName}, we've received your order and are preparing it for shipment.</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          ${itemsHtml}
          <tr>
            <td style="padding: 16px 0; border-top: 2px solid #000; font-weight: bold;">TOTAL</td>
            <td style="padding: 16px 0; border-top: 2px solid #000; text-align: right; font-weight: bold;">₹${options.data?.totalAmount}</td>
          </tr>
        </table>
        <p style="margin-top: 24px; font-size: 13px; color: #666;">Shipping to: ${options.data?.shippingAddress}</p>
      `;
    }

    const layout = `
    <div style="max-width: 600px; margin: 0 auto; font-family: sans-serif; color: #000; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #000; color: #fff; padding: 24px; text-align: center;">
            <h2 style="margin: 0; font-size: 20px; letter-spacing: 4px;">LYRA</h2>
        </div>
        <div style="padding: 32px;">
            ${finalHtml}
        </div>
        <div style="background-color: #f9f9f9; padding: 24px; text-align: center; color: #999; font-size: 11px;">
            <p>© ${new Date().getFullYear()} LYRA Style Hub. All rights reserved.</p>
        </div>
    </div>
    `;

    const info = await transporter.sendMail({
        from: '"LYRA Support" <hello@lyrastylehub.com>',
        to: options.to,
        subject: options.subject,
        html: layout,
    });

    if (isEthereal) {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        return previewUrl ? (previewUrl as string) : null;
    }

    return null;
};
