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
  serverTimestamp,
  getCountFromServer,
  onSnapshot
} from "firebase/firestore";
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

export interface Promotion {
  id: string;
  code: string;
  discountPercent: number;
  discountFlat: number;
  maxUses: number;
  usedCount: number;
  active: boolean;
  expiresAt: any;
  createdAt: any;
}

// --- STATIC INVENTORY FALLBACK ---
import localProducts from "@/data/inventory/products.json";

// Helper for fetching remote inventory
const getInventory = async (): Promise<Product[]> => {
  const remoteUrl = import.meta.env.VITE_GITHUB_INVENTORY_URL;
  if (remoteUrl) {
    try {
      const resp = await fetch(remoteUrl);
      if (resp.ok) return await resp.json();
    } catch (e) {
      console.warn("[Inventory] Remote fetch failed, using local fallback.", e);
    }
  }
  return localProducts as Product[];
};

// --- DATA SERVICE HUB ---

export const dataService = {

  // 1. PRODUCTS COLLECTION (Hybrid: GitHub CDN / Local JSON / Firestore Fallback)
  products: {
    async getAll(pageSize: number = 100): Promise<Product[]> {
      try {
        const inventory = await getInventory();
        return inventory.slice(0, pageSize);
      } catch (e) {
        // Ultimate fallback to Firestore if static methods fail
        const q = query(collection(db, "products"), orderBy("createdAt", "desc"), limit(pageSize));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
      }
    },
    async getByCategory(category: string, pageSize: number = 50): Promise<Product[]> {
      const all = await this.getAll();
      return all.filter(p => p.category === category).slice(0, pageSize);
    },
    async searchProducts(searchTerm: string, pageSize: number = 10): Promise<Product[]> {
      const all = await this.getAll();
      const term = searchTerm.toLowerCase();
      return all.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        p.subCategory?.toLowerCase().includes(term) ||
        p.brand?.toLowerCase().includes(term)
      ).slice(0, pageSize);
    },
    async getById(id: string) {
      const all = await this.getAll();
      const found = all.find(p => p.id === id);
      if (found) return found;
      // Fetch from Firestore as a deep fallback
      const ref = doc(db, "products", id);
      const snap = await getDoc(ref);
      if (snap.exists()) return { id: snap.id, ...snap.data() } as Product;
      return null;
    },
    // Keep Admin operations pointing to Firestore for now
    async add(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) {
      return await addDoc(collection(db, "products"), {
        ...product,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
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
    },
    async count(): Promise<number> {
      // Direct Firestore count for Admin analytics
      const snap = await getCountFromServer(collection(db, "products"));
      return snap.data().count;
    },
    async getInventoryCount(): Promise<number> {
      const all = await this.getAll();
      return all.length;
    },
    subscribe(callback: (products: Product[]) => void, pageSize: number = 100) {
      // For subscription, we poll the inventory or use Firestore as a live source
      const q = query(collection(db, "products"), orderBy("createdAt", "desc"), limit(pageSize));
      return onSnapshot(q, (snap) => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
      });
    }
  },

  // 2. USERS COLLECTION
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
    },
    async getAll(pageSize: number = 100): Promise<UserProfile[]> {
      const q = query(collection(db, "users"), orderBy("createdAt", "desc"), limit(pageSize));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile));
    },
    async updateRole(uid: string, role: 'admin' | 'user' | 'vip') {
      const ref = doc(db, "users", uid);
      return await updateDoc(ref, { role });
    },
    async updateWishlist(uid: string, wishlist: any[]) {
      const ref = doc(db, "users", uid);
      return await updateDoc(ref, { wishlist, updatedAt: serverTimestamp() });
    },
    async updateProfile(uid: string, updates: Partial<UserProfile>) {
      const ref = doc(db, "users", uid);
      return await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
    },
    subscribe(callback: (users: UserProfile[]) => void, pageSize: number = 100) {
      const q = query(collection(db, "users"), orderBy("createdAt", "desc"), limit(pageSize));
      return onSnapshot(q, (snap) => {
        callback(snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile)));
      });
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
    async getById(id: string) {
      const snap = await getDoc(doc(db, "orders", id));
      return snap.exists() ? ({ id: snap.id, ...snap.data() } as Order) : null;
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
    async getAll(pageSize: number = 100): Promise<Order[]> {
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(pageSize));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
    },
    async updateStatus(orderId: string, status: string) {
      const ref = doc(db, "orders", orderId);
      return await updateDoc(ref, { status, updatedAt: serverTimestamp() });
    },
    async updateTracking(orderId: string, trackingNumber: string) {
      const ref = doc(db, "orders", orderId);
      return await updateDoc(ref, { trackingNumber, updatedAt: serverTimestamp() });
    },
    subscribe(callback: (orders: Order[]) => void, pageSize: number = 100) {
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(pageSize));
      return onSnapshot(q, (snap) => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
      });
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
  },

  // 5. PROMOTIONS COLLECTION
  promotions: {
    async getAll(): Promise<Promotion[]> {
      const q = query(collection(db, "promotions"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Promotion));
    },
    async create(promo: Omit<Promotion, 'id' | 'createdAt'>) {
      return await addDoc(collection(db, "promotions"), {
        ...promo,
        createdAt: serverTimestamp()
      });
    },
    async toggle(id: string, active: boolean) {
      return await updateDoc(doc(db, "promotions", id), { active });
    },
    async delete(id: string) {
      return await deleteDoc(doc(db, "promotions", id));
    }
  },

  // 6. BLOGS COLLECTION
  blogs: {
    async getAll(): Promise<any[]> {
      const q = query(collection(db, "blogs"), orderBy("date", "desc"));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },
    async getById(id: string) {
      const snap = await getDoc(doc(db, "blogs", id));
      return snap.exists() ? ({ id: snap.id, ...snap.data() }) : null;
    }
  },

  // 7. SETTINGS COLLECTION
  settings: {
    async get() {
      const ref = doc(db, "settings", "global");
      const snap = await getDoc(ref);
      return snap.exists() ? snap.data() : { storeName: "LYRA", supportEmail: "hello@lyrastylehub.com" };
    },
    async update(updates: any) {
      const ref = doc(db, "settings", "global");
      return await setDoc(ref, updates, { merge: true });
    }
  }
}
