import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  setDoc,
  updateDoc,
  deleteDoc,
  query, 
  where, 
  limit,
  orderBy,
  addDoc,
  Timestamp,
  serverTimestamp
} from "firebase/firestore";
import { products as staticProducts } from "@/data/products";
import { db } from "@/lib/firebase";

// --- TYPE DEFINITIONS ---
import { Product } from "@/types/product";
export type { Product };

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  role: 'admin' | 'user' | 'vip';
  addresses: any[];
  orderHistory: string[];
  createdAt: any;
}

export interface Order {
  id: string;
  userId: string;
  items: any[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed';
  shippingAddress: any;
  trackingNumber?: string;
  createdAt: any;
}

// --- DATA SERVICE HUB ---

export const dataService = {
  
  // 1. PRODUCTS COLLECTION
  products: {
    async getAll(pageSize: number = 50): Promise<Product[]> {
      try {
        const q = query(collection(db, "products"), orderBy("createdAt", "desc"), limit(pageSize));
        const snap = await getDocs(q);
        if (snap.docs.length > 0) return snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
      } catch { /* fall through to static */ }
      return staticProducts as Product[];
    },
    async getByCategory(category: string, pageSize: number = 50): Promise<Product[]> {
      try {
        const q = query(
          collection(db, "products"), 
          where("category", "==", category),
          orderBy("createdAt", "desc"),
          limit(pageSize)
        );
        const snap = await getDocs(q);
        if (snap.docs.length > 0) return snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
      } catch { /* fall through to static */ }
      return (staticProducts as Product[]).filter(p => p.category === category);
    },
    async searchProducts(searchTerm: string, pageSize: number = 10): Promise<Product[]> {
      try {
        const q = query(
          collection(db, "products"),
          where("name", ">=", searchTerm),
          where("name", "<=", searchTerm + "\uf8ff"),
          limit(pageSize)
        );
        const snap = await getDocs(q);
        if (snap.docs.length > 0) return snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
      } catch { /* fall through to static */ }
      const term = searchTerm.toLowerCase();
      return (staticProducts as Product[]).filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        p.subCategory?.toLowerCase().includes(term) ||
        p.brand?.toLowerCase().includes(term)
      ).slice(0, pageSize);
    },
    async add(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) {
      return await addDoc(collection(db, "products"), {
        ...product,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    },
    async getById(id: string) {
      try {
        const ref = doc(db, "products", id);
        const snap = await getDoc(ref);
        if (snap.exists()) return { id: snap.id, ...snap.data() } as Product;
      } catch { /* fall through to static */ }
      // Fallback to static mock data
      return (staticProducts as Product[]).find(p => p.id === id) ?? null;
    },
    async update(id: string, updates: Partial<Product>) {
      const ref = doc(db, "products", id);
      return await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
    },
    async addWithId(id: string, product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) {
      const ref = doc(db, "products", id);
      return await setDoc(ref, {
        ...product,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
    },
    async forceUpdate(id: string, product: any) {
      const ref = doc(db, "products", id);
      return await setDoc(ref, {
        ...product,
        updatedAt: serverTimestamp()
      }, { merge: true });
    },
    async delete(id: string) {
      return await deleteDoc(doc(db, "products", id));
    }
  },

  // 2. USERS COLLECTION (Profile Management)
  users: {
    async createProfile(uid: string, profile: Partial<UserProfile>) {
      const ref = doc(db, "users", uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          uid,
          role: 'user',
          addresses: [],
          orderHistory: [],
          createdAt: serverTimestamp(),
          ...profile
        });
      }
    },
    async getProfile(uid: string): Promise<UserProfile | null> {
      const snap = await getDoc(doc(db, "users", uid));
      return snap.exists() ? (snap.data() as UserProfile) : null;
    }
  },

  // 3. ORDERS COLLECTION
  orders: {
    async create(orderData: Omit<Order, 'id' | 'createdAt'>) {
      return await addDoc(collection(db, "orders"), {
        ...orderData,
        createdAt: serverTimestamp()
      });
    },
    async getByUser(userId: string): Promise<Order[]> {
      const q = query(
        collection(db, "orders"), 
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
    },
    async updateStatus(orderId: string, status: string) {
      const ref = doc(db, "orders", orderId);
      return await updateDoc(ref, { status, updatedAt: serverTimestamp() });
    }
  },

  // 4. CARTS COLLECTION
  carts: {
    async sync(userId: string, items: any[]) {
      const ref = doc(db, "carts", userId);
      return await setDoc(ref, {
        userId,
        items,
        updatedAt: serverTimestamp()
      }, { merge: true });
    },
    async get(userId: string) {
      const ref = doc(db, "carts", userId);
      const snap = await getDoc(ref);
      return snap.exists() ? snap.data().items || [] : [];
    }
  }
};
