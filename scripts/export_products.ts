import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

const serviceAccount = {
  projectId: process.env.FB_PROJECT_ID,
  clientEmail: process.env.FB_CLIENT_EMAIL,
  privateKey: process.env.FB_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

initializeApp({ credential: cert(serviceAccount as any) });
const db = getFirestore();

async function exportProducts() {
  console.log("Fetching products from Firestore...");
  const snapshot = await db.collection("products").get();
  const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

  const outDir = path.join(process.cwd(), "src", "data", "inventory");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const outFile = path.join(outDir, "products.json");
  fs.writeFileSync(outFile, JSON.stringify(products, null, 2));

  console.log(`Successfully exported ${products.length} products to ${outFile}`);
}

exportProducts();
