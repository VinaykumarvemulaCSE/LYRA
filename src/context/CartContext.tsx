import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { toast } from "sonner";
import { Product } from "@/types/product";
import { useAuth } from "./AuthContext";
import { dataService } from "@/services/dataService";

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor: string;
  selectedSize: string;
}

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  addItem: (product: Product, color: string, size: string) => void;
  removeItem: (productId: string, color: string, size: string) => void;
  updateQuantity: (productId: string, color: string, size: string, quantity: number) => void;
  totalItems: number;
  totalPrice: number;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem("lyra_cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const [isCloudSynced, setIsCloudSynced] = useState(false);

  // 1. Initial Load: Merge Cloud Cart with Local Cart
  useEffect(() => {
    const fetchCloudCart = async () => {
      if (!user || isCloudSynced) return;
      try {
        const cloudItems = await dataService.carts.get(user.uid);
        if (cloudItems && cloudItems.length > 0) {
          // Priority to cloud logic implementation: replace local with cloud on fresh login
          setItems(cloudItems);
        }
        setIsCloudSynced(true);
      } catch (err) {
        console.error("Failed to sync cart from cloud", err);
      }
    };
    fetchCloudCart();
  }, [user, isCloudSynced]);

  // 2. Persist Local and Sync to Cloud on Changes
  useEffect(() => {
    localStorage.setItem("lyra_cart", JSON.stringify(items));
    if (user && isCloudSynced) {
       dataService.carts.sync(user.uid, items).catch(e => console.error("Cloud cart error", e));
    }
  }, [items, user, isCloudSynced]);

  const addItem = useCallback((product: Product, color: string, size: string) => {
    setItems((prev) => {
      const variant = product.variants?.find(v => v.color === color);
      const stock = variant ? variant.stock : 1;

      const existing = prev.find(
        (i) => i.product.id === product.id && i.selectedColor === color && i.selectedSize === size
      );
      if (existing) {
        if (existing.quantity >= stock) {
          toast.error("Stock Limit Reached", { description: "You cannot add more of this item." });
          return prev;
        }
        return prev.map((i) =>
          i.product.id === product.id && i.selectedColor === color && i.selectedSize === size
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }

      if (stock < 1) {
        toast.error("Out of Stock", { description: "This variant is currently out of stock." });
        return prev;
      }
      return [...prev, { product, quantity: 1, selectedColor: color, selectedSize: size }];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((productId: string, color: string, size: string) => {
    setItems((prev) => prev.filter(
      (i) => !(i.product.id === productId && i.selectedColor === color && i.selectedSize === size)
    ));
  }, []);

  const updateQuantity = useCallback((productId: string, color: string, size: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId, color, size);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.product.id === productId && i.selectedColor === color && i.selectedSize === size
          ? { ...i, quantity }
          : i
      )
    );
  }, [removeItem]);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, isOpen, setIsOpen, addItem, removeItem, updateQuantity, totalItems, totalPrice, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
