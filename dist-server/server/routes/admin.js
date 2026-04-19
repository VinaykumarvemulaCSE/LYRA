"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get("/diagnostics", (_req, res) => {
    const vars = [
        "FB_PROJECT_ID", "FB_CLIENT_EMAIL", "FB_PRIVATE_KEY",
        "RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET",
        "EMAIL_USER", "EMAIL_APP_PASSWORD",
        "GITHUB_TOKEN", "ADMIN_EMAIL"
    ];
    const results = vars.map(v => ({ name: v, set: !!process.env[v] }));
    res.json({ status: "ok", environment: results, timestamp: new Date().toISOString() });
});
router.post("/seed", async (_req, res) => {
    res.json({ message: "Seed endpoint ready" });
});
exports.default = router;
