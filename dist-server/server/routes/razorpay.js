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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const razorpay_1 = __importDefault(require("razorpay"));
const crypto = __importStar(require("crypto"));
const firebase_js_1 = require("../utils/firebase.js");
const firestore_1 = require("firebase-admin/firestore");
const email_js_1 = require("../utils/email.js");
const router = (0, express_1.Router)();
const MAX_AMOUNT_INR = 500000;
router.post("/order", async (req, res) => {
    try {
        const { amount, receipt } = req.body;
        if (!amount || typeof amount !== "number" || amount <= 0) {
            return res.status(400).json({ message: "A valid positive amount is required." });
        }
        if (amount > MAX_AMOUNT_INR) {
            return res.status(400).json({ message: `Order amount exceeds the maximum allowed value of ₹${MAX_AMOUNT_INR}.` });
        }
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!keyId || !keySecret) {
            console.error("[RazorpayOrder] Credentials missing.");
            return res.status(500).json({ message: "Payment gateway not configured." });
        }
        const instance = new razorpay_1.default({ key_id: keyId, key_secret: keySecret });
        const order = await instance.orders.create({
            amount: Math.round(amount * 100),
            currency: "INR",
            receipt: receipt || `lyra_${Date.now()}`,
        });
        console.log(`[RazorpayOrder] Created: ${order.id}`);
        return res.status(200).json(order);
    }
    catch (error) {
        const err = error;
        console.error("[RazorpayOrder] Failed:", err.message);
        return res.status(500).json({ message: "Failed to create order.", error: err.message });
    }
});
router.post("/verify", async (req, res) => {
    try {
        const { db_order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, userEmail } = req.body;
        if (!db_order_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ status: "failure", message: "Required fields are missing." });
        }
        const secret = process.env.RAZORPAY_KEY_SECRET?.trim();
        if (!secret) {
            throw new Error("Razorpay secret missing.");
        }
        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");
        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ status: "failure", message: "Invalid signature." });
        }
        const adminDb = (0, firebase_js_1.getAdminDb)();
        const orderRef = adminDb.collection("orders").doc(db_order_id);
        const orderSnap = await orderRef.get();
        if (!orderSnap.exists) {
            return res.status(404).json({ status: "error", message: "Order not found." });
        }
        const orderData = orderSnap.data() || {};
        const items = orderData.items ?? [];
        await orderRef.update({
            status: "processing",
            paymentStatus: "paid",
            paymentId: razorpay_payment_id,
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        });
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
        const recipient = userEmail || orderData.shippingAddress?.email;
        if (recipient) {
            const shortId = db_order_id.substring(0, 8).toUpperCase();
            (0, email_js_1.sendStoreEmail)(recipient, `Your LYRA Order Confirmed #${shortId}`, `Your payment has been successfully verified.`)
                .catch((err) => console.error("[Email Error]:", err.message));
        }
        return res.status(200).json({ status: "success", message: "Verified." });
    }
    catch (error) {
        const err = error;
        console.error("[Verify Error]:", err.message);
        return res.status(500).json({ status: "error", message: err.message });
    }
});
exports.default = router;
