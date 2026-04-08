import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Product } from "@/types/product";
import { useAuth } from "./AuthContext";
import { dataService } from "@/services/dataService";

interface WishlistContextType {
  items: Product[];
  isLoading: boolean;
  addToWishlist: (product: Product) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const isSyncing = useRef(false);

  // Load wishlist from localStorage initially
  useEffect(() => {
    const saved = localStorage.getItem("lyra_wishlist");
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse wishlist", e);
      }
    }
    setIsLoading(false);
  }, []);

  // Sync with Firestore when user logs in
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const syncWishlist = async () => {
      try {
        isSyncing.current = true;
        // Get server wishlist
        const userProfile = await dataService.users.getProfile(user.uid);
        if (userProfile?.wishlist && Array.isArray(userProfile.wishlist)) {
          // Merge with local (server takes precedence)
          setItems(userProfile.wishlist);
          localStorage.setItem("lyra_wishlist", JSON.stringify(userProfile.wishlist));
        }
      } catch (err) {
        console.error("Failed to sync wishlist", err);
      } finally {
        isSyncing.current = false;
        setIsLoading(false);
      }
    };

    syncWishlist();
  }, [user]);

  // Persist to localStorage immediately
  useEffect(() => {
    if (!isSyncing.current) {
      localStorage.setItem("lyra_wishlist", JSON.stringify(items));
    }
  }, [items]);

  // Debounced sync to Firestore
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (!user || isSyncing.current) return;

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(async () => {
      try {
        await (dataService.users as any).updateWishlist?.(user.uid, items);
      } catch (err) {
        console.error("Failed to sync wishlist to server", err);
      }
    }, 2000);

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [items, user]);

  const addToWishlist = useCallback(async (product: Product) => {
    if (items.some(item => item.id === product.id)) {
      toast.info("Already in your wishlist");
      return;
    }
    setItems(prev => [...prev, product]);
    toast.success("Added to wishlist");
  }, [items]);

  const removeFromWishlist = useCallback(async (productId: string) => {
    setItems(prev => prev.filter(item => item.id !== productId));
    toast.success("Removed from wishlist");
  }, []);

  const isInWishlist = useCallback((productId: string) => {
    return items.some(item => item.id === productId);
  }, [items]);

  const clearWishlist = useCallback(async () => {
    setItems([]);
    toast.success("Wishlist cleared");
  }, []);

  return (
    <WishlistContext.Provider value={{
      items,
      isLoading,
      addToWishlist,
      removeFromWishlist,
      isInWishlist,
      clearWishlist
    }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
