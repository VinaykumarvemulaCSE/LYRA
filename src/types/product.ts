import type { Timestamp, FieldValue } from "firebase/firestore";

export interface ProductVariant {
  color: string;
  colorHex: string;
  sizes: string[];
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  category: string;
  subCategory: string;
  description: string;
  material?: string;
  careInstructions?: string;
  ecoLabels?: string[];
  inStock: boolean;
  isNew?: boolean;
  isBestseller?: boolean;
  image: string;
  images: string[];
  variants: ProductVariant[];

  // Timestamps — Firestore Timestamp, FieldValue (serverTimestamp), or plain Date
  createdAt?: Timestamp | FieldValue | Date | null;
  updatedAt?: Timestamp | FieldValue | Date | null;

  // Legacy flat fields for backward compatibility
  sizes?: string[];
  colors?: string[];
}
