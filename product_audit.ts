import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as dotenv from "dotenv";
dotenv.config();

const serviceAccount = {
  projectId: process.env.FB_PROJECT_ID,
  clientEmail: process.env.FB_CLIENT_EMAIL,
  privateKey: process.env.FB_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

initializeApp({ credential: cert(serviceAccount as any) });
const db = getFirestore();

async function auditProducts() {
  const snapshot = await db.collection("products").get();
  const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

  console.log(`--- PRODUCTS AUDIT (${products.length} items) ---`);
  
  const categories: Record<string, number> = {};
  const stockLevels: Record<string, number> = { "In Stock": 0, "Out of Stock": 0 };
  const issues: string[] = [];

  products.forEach(p => {
    // Category counts
    categories[p.category] = (categories[p.category] || 0) + 1;
    
    // Stock check
    let totalStock = 0;
    if (p.variants && Array.isArray(p.variants)) {
      p.variants.forEach((v: any) => totalStock += (v.stock || 0));
    }
    
    if (totalStock > 0) stockLevels["In Stock"]++;
    else stockLevels["Out of Stock"]++;

    // Data Quality Checks
    if (!p.image && (!p.images || p.images.length === 0)) issues.push(`[${p.id}] Missing all images: ${p.name}`);
    if (!p.variants || p.variants.length === 0) issues.push(`[${p.id}] Missing variants: ${p.name}`);
    if (p.price === undefined || p.price === null) issues.push(`[${p.id}] Missing price: ${p.name}`);
    if (p.price > 100000) issues.push(`[${p.id}] Ultra-Premium (>1L): ${p.name} (₹${p.price})`);
  });

  console.log("\n[1] CATEGORIES:");
  console.table(categories);

  console.log("\n[2] STOCK STATUS:");
  console.table(stockLevels);

  if (issues.length > 0) {
    console.log("\n[3] DATA ISSUES / NOTABLE ITEMS:");
    issues.forEach(iss => console.log(`- ${iss}`));
  } else {
    console.log("\n[3] DATA INTEGRITY: Perfect (No issues found)");
  }
}

auditProducts();
