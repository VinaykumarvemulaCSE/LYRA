"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoutes = void 0;
const razorpay_js_1 = __importDefault(require("./razorpay.js"));
const email_js_1 = __importDefault(require("./email.js"));
const upload_js_1 = __importDefault(require("./upload.js"));
const admin_js_1 = __importDefault(require("./admin.js"));
const registerRoutes = (app) => {
    app.use("/api/razorpay", razorpay_js_1.default);
    app.use("/api/email", email_js_1.default);
    app.use("/api/upload", upload_js_1.default);
    app.use("/api/admin", admin_js_1.default);
    // Legacy support for single-file API paths if needed
    app.post("/api/contact", (req, res, next) => {
        // Forward to email router contact path
        req.url = "/contact";
        (0, email_js_1.default)(req, res, next);
    });
};
exports.registerRoutes = registerRoutes;
