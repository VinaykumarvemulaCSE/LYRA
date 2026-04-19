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

async function checkAdmin() {
  const email = "kumarvinay072007@gmail.com";
  try {
    const user = await auth.getUserByEmail(email);
    console.log(`USER_FOUND: ${user.uid} | EMAIL: ${user.email}`);
  } catch (err: any) {
    if (err.code === 'auth/user-not-found') {
      console.log("USER_NOT_FOUND");
    } else {
      console.error(err);
    }
  }
}

checkAdmin();
