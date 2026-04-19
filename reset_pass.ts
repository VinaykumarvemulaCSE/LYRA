import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import * as dotenv from "dotenv";
dotenv.config();

const serviceAccount = {
  projectId: process.env.FB_PROJECT_ID,
  clientEmail: process.env.FB_CLIENT_EMAIL,
  privateKey: process.env.FB_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

initializeApp({ credential: cert(serviceAccount as any) });
const auth = getAuth();

async function resetPassword() {
  const email = "kumarvinay072007@gmail.com";
  const newPassword = "Vinay@123";
  try {
    const user = await auth.getUserByEmail(email);
    await auth.updateUser(user.uid, {
      password: newPassword
    });
    console.log(`SUCCESS: Password updated for ${email}`);
  } catch (err: any) {
    console.error("FAILED:", err.message);
  }
}

resetPassword();
