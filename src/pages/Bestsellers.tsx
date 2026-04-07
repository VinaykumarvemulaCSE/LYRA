import { useState, useEffect } from "react";
import ProductCard from "@/components/product/ProductCard";
import { dataService, Product as FirestoreProduct } from "@/services/dataService";
import { Loader2 } from "lucide-react";

export default function Bestsellers() {
  const [bestsellerProducts, setBestsellerProducts] = useState<FirestoreProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    dataService.products.getAll().then(data => {
      // Create dynamic bestsellers by sorting items with highest rating/reviews
      const sorted = [...data].sort((a: any, b: any) => (b.reviewCount || 0) - (a.reviewCount || 0));
      setBestsellerProducts(sorted.slice(0, 12));
      setIsLoading(false);
    }).catch(console.error);
  }, []);

  return (
    <main className="pt-32 pb-24 min-h-screen bg-background">
      <div className="container max-w-7xl">
        <div className="mb-12 border-b border-border/50 pb-8">
          <h1 className="font-heading text-4xl md:text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">Bestsellers</h1>
          <p className="text-muted-foreground text-lg">Our most loved and highly rated pieces. Get them before they sell out again.</p>
        </div>

        {isLoading ? (
          <div className="text-center py-20 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : bestsellerProducts.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">No bestsellers found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
            {bestsellerProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
