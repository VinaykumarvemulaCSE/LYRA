import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, Loader2 } from "lucide-react";
import { dataService, Product as FirestoreProduct } from "@/services/dataService";
import ProductCard from "@/components/product/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState<FirestoreProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    dataService.products.getAll().then(data => {
      const filtered = data.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.category?.toLowerCase().includes(query.toLowerCase()) ||
          (p.brand && p.brand.toLowerCase().includes(query.toLowerCase())) ||
          (p.description && p.description.toLowerCase().includes(query.toLowerCase()))
      );
      setResults(filtered);
      setIsLoading(false);
    }).catch(console.error);
  }, [query]);

  return (
    <main className="pt-24 pb-16 min-h-screen">
      <div className="container max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <h1 className="font-heading text-3xl font-bold">Results for "{query}"</h1>
          <form className="relative max-w-sm w-full" action="/search">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" name="q" defaultValue={query} placeholder="Search products..." className="w-full h-11 pl-11 pr-4 glass rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </form>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4 rounded-lg" />
                  <Skeleton className="h-4 w-1/4 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-20 glass-strong rounded-2xl">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h2 className="text-xl font-bold mb-2">No results found</h2>
            <p className="text-muted-foreground mb-6">Try different keywords.</p>
            <Link to="/shop" className="text-sm font-bold text-primary underline">Browse All Products</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {results.map((product, i) => <ProductCard key={product.id} product={product} index={i} />)}
          </div>
        )}
      </div>
    </main>
  );
}
