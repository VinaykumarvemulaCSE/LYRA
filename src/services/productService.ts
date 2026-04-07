import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  query, 
  where, 
  limit,
  orderBy,
  addDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product } from "@/types/product";

const COLLECTION_NAME = "products";

export const productService = {
  // Get all products
  async getAllProducts(): Promise<Product[]> {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Product[];
  },

  // Get products by category (Men, Women, Kids, etc)
  async getProductsByCategory(category: string): Promise<Product[]> {
    const q = query(
      collection(db, COLLECTION_NAME), 
      where("category", "==", category),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Product[];
  },

  // Get a single product by ID
  async getProductById(id: string): Promise<Product | null> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Product;
    }
    return null;
  },

  // Get new arrivals (limit 4)
  async getNewArrivals(count: number = 4): Promise<Product[]> {
    const q = query(
      collection(db, COLLECTION_NAME), 
      where("isNew", "==", true),
      limit(count)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Product[];
  },

  // Seed the database with initial items (One-time use)
  async seedStore(initialProducts: Omit<Product, 'id'>[]) {
    const batch = initialProducts.map(async (p) => {
      await addDoc(collection(db, COLLECTION_NAME), {
        ...p,
        createdAt: new Date()
      });
    });
    await Promise.all(batch);
    console.log("Store seeded successfully!");
  }
};
