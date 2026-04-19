"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminDb = void 0;
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
let adminDbCache = null;
const getAdminDb = () => {
    if (!adminDbCache) {
        if ((0, app_1.getApps)().length === 0) {
            const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
            let serviceAccount;
            if (serviceAccountJson && serviceAccountJson.trim().startsWith("{")) {
                serviceAccount = JSON.parse(serviceAccountJson);
            }
            else if (process.env.FB_PROJECT_ID && process.env.FB_CLIENT_EMAIL && process.env.FB_PRIVATE_KEY) {
                serviceAccount = {
                    projectId: process.env.FB_PROJECT_ID,
                    clientEmail: process.env.FB_CLIENT_EMAIL,
                    privateKey: process.env.FB_PRIVATE_KEY.replace(/\\n/g, '\n'),
                };
            }
            else {
                throw new Error("Missing Firebase credentials (FB_PROJECT_ID, FB_CLIENT_EMAIL, FB_PRIVATE_KEY) in environment.");
            }
            (0, app_1.initializeApp)({ credential: (0, app_1.cert)(serviceAccount) });
        }
        adminDbCache = (0, firestore_1.getFirestore)();
    }
    return adminDbCache;
};
exports.getAdminDb = getAdminDb;
