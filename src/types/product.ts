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
  
  // Timestamps (could be Firestore Timestamp or Date)
  createdAt?: any;
  updatedAt?: any;
  
  // Legacy flat fields for backward compatibility, if needed
  sizes?: string[];
  colors?: string[];
}
