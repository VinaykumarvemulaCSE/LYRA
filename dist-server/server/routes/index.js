"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoutes = void 0;
const razorpay_1 = __importDefault(require("./razorpay"));
const email_1 = __importDefault(require("./email"));
const upload_1 = __importDefault(require("./upload"));
const admin_1 = __importDefault(require("./admin"));
const registerRoutes = (app) => {
    app.use("/api/razorpay", razorpay_1.default);
    app.use("/api/email", email_1.default);
    app.use("/api/upload", upload_1.default);
    app.use("/api/admin", admin_1.default);
    // Legacy alias: /api/contact → /api/email/contact
    app.post("/api/contact", (req, res, next) => {
        req.url = "/contact";
        (0, email_1.default)(req, res, next);
    });
};
exports.registerRoutes = registerRoutes;
