"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendStoreEmail = void 0;
const nodemailer = __importStar(require("nodemailer"));
/**
 * Creates a Nodemailer transporter using server-only Gmail credentials.
 */
const getTransporter = () => {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_APP_PASSWORD;
    if (!user || !pass) {
        throw new Error("Email credentials not configured. " +
            "Set EMAIL_USER and EMAIL_APP_PASSWORD in environment variables.");
    }
    return nodemailer.createTransport({
        service: "gmail",
        auth: { user, pass },
    });
};
// Standard LYRA store email layout
const sendStoreEmail = async (to, subject, htmlContent) => {
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
exports.sendStoreEmail = sendStoreEmail;
