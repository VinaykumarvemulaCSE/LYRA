"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get("/diagnostics", (req, res) => {
    const vars = [
        "FIREBASE_SERVICE_ACCOUNT_JSON", "FB_PROJECT_ID", "RAZORPAY_KEY_ID",
        "EMAIL_USER", "GITHUB_TOKEN", "ADMIN_EMAIL"
    ];
    const results = vars.map(v => ({ name: v, set: !!process.env[v] }));
    res.json({ status: "ok", environment: results });
});
router.post("/seed", async (req, res) => {
    // Logic for seeding Firestore could go here
    res.json({ message: "Seed endpoint ready" });
});
exports.default = router;
