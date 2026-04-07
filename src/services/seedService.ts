/**
 * Lyra Store Seeder
 * -----------------
 * A one-time utility to push all local mock products from data/products.ts
 * into your Cloud Firestore database.
 */

import { dataService } from "./dataService";
import { products } from "@/data/products";
import { toast } from "sonner";

export const seedService = {
  /**
   * Pushes all static products from local code to Firestore
   */
  async runMigration(): Promise<void> {
    try {
      console.log("Seeding started: Preparing to migrate styles...");
      
      console.log(`Seeding: Force-Syncing ${products.length} luxury styles to Cloud Firestore...`);

      // 3. Map local mock products to Firestore schema & Update (Idempotent)
      const migrationBatch = products.map(async (p) => {
        // Create a stable ID from the existing mock ID or a slug
        const dbId = p.id;
        
        // Extract unique sizes and colors from variants
        const allSizes = new Set<string>();
        const allColors = new Set<string>();
        
        if (p.variants) {
          p.variants.forEach(v => {
            v.sizes.forEach(s => allSizes.add(s));
            allColors.add(v.colorHex);
          });
        }

        const productData = {
          name: p.name,
          price: p.price,
          originalPrice: p.originalPrice || null,
          category: p.category,
          subCategory: p.subCategory || "Essentials",
          image: p.image,
          images: p.images || [p.image],
          description: p.description || "A luxury staple piece from the LYRA collection.",
          brand: p.brand || "LYRA",
          material: p.material || null,
          sizes: Array.from(allSizes),
          colors: Array.from(allColors),
          variants: p.variants || [],
          inStock: p.inStock ?? true,
          isNew: p.isNew || false,
          isBestseller: p.bestseller || false
        };

        return await dataService.products.addWithId(dbId, productData as any);
      });

      // 4. Execute the batch
      await Promise.all(migrationBatch);
      
      console.log("Seeding Successful: Your clothing inventory is now live in the cloud.");
      toast.success("Sync Successful", {
        description: `${products.length} luxury products have been updated in the cloud.`
      });
    } catch (error) {
      console.error("Migration Error:", error);
      toast.error("Migration Failed", {
        description: "Check your console for Firebase permission errors."
      });
      throw error;
    }
  }
};
