import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Trash2, Loader2 } from "lucide-react";
import { dataService, Product as FirestoreProduct } from "@/services/dataService";
import ProductCard from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";

export default function Wishlist() {
  const [wishlistItems, setWishlistItems] = useState<FirestoreProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a fully featured app, this would query based on a Wishlist Context or LocalStorage IDs.
    // For now, loading dynamic items to populate the UI.
    dataService.products.getAll().then(data => {
      setWishlistItems(data.slice(2, 5));
      setIsLoading(false);
    }).catch(console.error);
  }, []);

  return (
    <main className="pt-24 pb-16 min-h-screen">
      <div className="container max-w-6xl">
        <h1 className="font-heading text-3xl font-bold mb-8">Your Wishlist</h1>
        {isLoading ? (
          <div className="text-center py-20 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : wishlistItems.length === 0 ? (
          <div className="text-center py-20 glass-strong rounded-2xl">
            <h2 className="text-xl font-bold mb-4">Your wishlist is empty</h2>
            <p className="text-muted-foreground mb-8">Save items you love.</p>
            <Button asChild className="gradient-primary border-0 rounded-xl"><Link to="/shop">Discover Collection</Link></Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
              {wishlistItems.map((product, i) => (
                <div key={product.id} className="relative group">
                  <ProductCard product={product} index={i} />
                  <button className="absolute top-4 right-4 z-10 w-8 h-8 glass rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive" aria-label="Remove from wishlist">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <Link to="/shop" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="w-4 h-4" /> Continue Shopping
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
