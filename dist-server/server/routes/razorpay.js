"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const razorpay_1 = __importDefault(require("razorpay"));
const crypto_1 = __importDefault(require("crypto"));
const firestore_1 = require("firebase-admin/firestore");
const firebase_1 = require("../utils/firebase");
const email_1 = require("../utils/email");
const router = (0, express_1.Router)();
const MAX_AMOUNT_INR = 500000;
router.post("/order", async (req, res) => {
    try {
        const { amount, receipt } = req.body;
        if (!amount || typeof amount !== "number" || amount <= 0) {
            return res.status(400).json({ message: "A valid positive amount is required." });
        }
        if (amount > MAX_AMOUNT_INR) {
            return res.status(400).json({ message: `Order amount exceeds the maximum of ₹${MAX_AMOUNT_INR}.` });
        }
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!keyId || !keySecret) {
            return res.status(500).json({ message: "Payment gateway not configured." });
        }
        const instance = new razorpay_1.default({ key_id: keyId, key_secret: keySecret });
        const order = await instance.orders.create({
            amount: Math.round(amount * 100),
            currency: "INR",
            receipt: receipt || `lyra_${Date.now()}`,
        });
        console.log(`[Razorpay] Order created: ${order.id}`);
        return res.status(200).json(order);
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        console.error("[Razorpay] Order failed:", msg);
        return res.status(500).json({ message: "Failed to create payment order.", error: msg });
    }
});
router.post("/verify", async (req, res) => {
    try {
        const { db_order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, userEmail, } = req.body;
        if (!db_order_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ status: "failure", message: "Missing required payment fields." });
        }
        const secret = process.env.RAZORPAY_KEY_SECRET?.trim();
        if (!secret) {
            return res.status(500).json({ status: "error", message: "Payment gateway secret not configured." });
        }
        // 1. Verify signature
        const expectedSignature = crypto_1.default
            .createHmac("sha256", secret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");
        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ status: "failure", message: "Invalid payment signature. Possible fraud attempt." });
        }
        // 2. Update order in Firestore
        const adminDb = (0, firebase_1.getAdminDb)();
        const orderRef = adminDb.collection("orders").doc(db_order_id);
        const orderSnap = await orderRef.get();
        if (!orderSnap.exists) {
            return res.status(404).json({ status: "error", message: "Order not found in database." });
        }
        const orderData = orderSnap.data() || {};
        const items = orderData.items ?? [];
        await orderRef.update({
            status: "processing",
            paymentStatus: "paid",
            paymentId: razorpay_payment_id,
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        });
        // 3. Decrement stock
        try {
            const batch = adminDb.batch();
            for (const item of items) {
                const productRef = adminDb.collection("products").doc(item.id);
                const productSnap = await productRef.get();
                if (productSnap.exists) {
                    const product = productSnap.data();
                    const variants = product.variants ?? [];
                    const variantIdx = variants.findIndex((v) => v.color === item.color);
                    if (variantIdx > -1) {
                        variants[variantIdx].stock = Math.max(0, variants[variantIdx].stock - item.quantity);
                        batch.update(productRef, { variants, updatedAt: firestore_1.FieldValue.serverTimestamp() });
                    }
                }
            }
            await batch.commit();
        }
        catch (stockErr) {
            // Non-critical — log but don't fail the response
            console.error("[Razorpay] Stock update failed (non-critical):", stockErr instanceof Error ? stockErr.message : stockErr);
        }
        // 4. Send confirmation email (fire and forget)
        const recipient = userEmail || orderData.shippingAddress?.email;
        if (recipient) {
            const shortId = String(db_order_id).substring(0, 8).toUpperCase();
            const html = `
        <h2>Order Confirmed! 🎉</h2>
        <p>Thank you for your purchase. Your order <strong>#${shortId}</strong> has been successfully paid.</p>
        <p>We are now processing your order and will notify you when it ships.</p>
      `;
            (0, email_1.sendStoreEmail)(recipient, `Your LYRA Order #${shortId} is Confirmed`, html)
                .catch((err) => console.error("[Email] Confirmation failed:", err instanceof Error ? err.message : err));
        }
        return res.status(200).json({ status: "success", message: "Payment verified and order confirmed." });
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        console.error("[Razorpay] Verify failed:", msg);
        return res.status(500).json({ status: "error", message: msg });
    }
});
exports.default = router;
