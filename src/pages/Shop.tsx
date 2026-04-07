import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, ChevronDown, Filter, X, Loader2 } from "lucide-react";
import ProductCard from "@/components/product/ProductCard";
import { categories, getPriceRange, products as staticProducts } from "@/data/products";
import { dataService, Product as FirestoreProduct } from "@/services/dataService";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

export default function Shop() {
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get("category") || "All";
  
  const [activeCategory, setActiveCategory] = useState(categoryParam);
  const [activeSubCategories, setActiveSubCategories] = useState<string[]>([]);
  const [activeMaterials, setActiveMaterials] = useState<string[]>([]);
  const { min: minLimit, max: maxLimit } = getPriceRange();
  const [priceRange, setPriceRange] = useState([minLimit, maxLimit]);
  const [sortBy, setSortBy] = useState("featured");
  // Start with static products so the page is never empty on first render
  const [dbProducts, setDbProducts] = useState<FirestoreProduct[]>(staticProducts as FirestoreProduct[]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await dataService.products.getAll();
        if (data.length > 0) setDbProducts(data);
      } catch (error) {
        console.error("Shop fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const subCategories = useMemo(() => {
    const subs = new Set<string>();
    dbProducts.forEach(p => {
      if (activeCategory === "All" || p.category === activeCategory) {
        if (p.subCategory) subs.add(p.subCategory);
      }
    });
    return Array.from(subs).sort();
  }, [dbProducts, activeCategory]);

  const materials = useMemo(() => {
    const mats = new Set<string>();
    dbProducts.forEach(p => {
      if (p.material) mats.add(p.material);
    });
    return Array.from(mats).sort();
  }, [dbProducts]);

  const filtered = useMemo(() => {
    let result = activeCategory === "All"
      ? dbProducts
      : dbProducts.filter((p) => p.category === activeCategory);

    if (activeSubCategories.length > 0) {
      result = result.filter(p => activeSubCategories.includes(p.subCategory));
    }

    if (activeMaterials.length > 0) {
      result = result.filter(p => p.material && activeMaterials.includes(p.material));
    }

    result = result.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    if (sortBy === "price-low") result = [...result].sort((a, b) => a.price - b.price);
    if (sortBy === "price-high") result = [...result].sort((a, b) => b.price - a.price);
    if (sortBy === "newest") result = [...result].sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    
    return result;
  }, [activeCategory, activeSubCategories, activeMaterials, priceRange, sortBy]);

  const toggleSubCategory = (sub: string) => {
    setActiveSubCategories(prev => 
      prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub]
    );
  };

  const toggleMaterial = (mat: string) => {
    setActiveMaterials(prev => 
      prev.includes(mat) ? prev.filter(m => m !== mat) : [...prev, mat]
    );
  };

  const clearFilters = () => {
    setActiveSubCategories([]);
    setActiveMaterials([]);
    setPriceRange([minLimit, maxLimit]);
  };

  const FilterContent = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider">Filters</h3>
        {(activeSubCategories.length > 0 || activeMaterials.length > 0 || priceRange[0] !== minLimit || priceRange[1] !== maxLimit) && (
          <button onClick={clearFilters} className="text-xs text-primary font-semibold hover:underline">Clear All</button>
        )}
      </div>

      <Accordion type="multiple" defaultValue={["categories", "price", "materials"]}>
        <AccordionItem value="categories" className="border-border/30">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline">Category & Sub-category</AccordionTrigger>
          <AccordionContent className="pt-2">
            <div className="flex flex-wrap gap-2 mb-4">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setActiveCategory(cat); setActiveSubCategories([]); }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    activeCategory === cat
                      ? "gradient-primary text-primary-foreground shadow-sm"
                      : "glass-subtle text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="space-y-2 mt-4 ml-1">
              {subCategories.map(sub => (
                <div key={sub} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`sub-${sub}`} 
                    checked={activeSubCategories.includes(sub)}
                    onCheckedChange={() => toggleSubCategory(sub)}
                  />
                  <label htmlFor={`sub-${sub}`} className="text-sm font-medium leading-none cursor-pointer hover:text-primary transition-colors">
                    {sub}
                  </label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="price" className="border-border/30">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline">Price Range</AccordionTrigger>
          <AccordionContent className="pt-4 px-1">
            <Slider
              defaultValue={[minLimit, maxLimit]}
              value={priceRange}
              min={minLimit}
              max={maxLimit}
              step={100}
              onValueChange={setPriceRange}
              className="mb-4"
            />
            <div className="flex justify-between text-xs font-bold text-muted-foreground">
              <span>₹{priceRange[0]}</span>
              <span>₹{priceRange[1]}</span>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="materials" className="border-border/30">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline">Materials</AccordionTrigger>
          <AccordionContent className="pt-2 ml-1">
            <div className="space-y-2">
              {materials.map(mat => (
                <div key={mat} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`mat-${mat}`} 
                    checked={activeMaterials.includes(mat)}
                    onCheckedChange={() => toggleMaterial(mat)}
                  />
                  <label htmlFor={`mat-${mat}`} className="text-sm font-medium leading-none cursor-pointer hover:text-primary transition-colors">
                    {mat}
                  </label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );

  return (
    <main className="pt-24 min-h-screen">
      <div className="container py-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Browse</span>
            <h1 className="font-heading text-3xl md:text-4xl font-bold mt-1">Shop Collections</h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              Discover our curated collection of minimal, sustainable fashion.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-10 pl-4 pr-10 glass rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none cursor-pointer"
              >
                <option value="featured">Featured</option>
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="md:hidden glass rounded-xl h-10 gap-2 font-bold border-border/30">
                  <Filter className="w-4 h-4" /> Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="glass-strong border-0 w-[300px]">
                <SheetHeader className="mb-6">
                  <SheetTitle className="font-heading">Personalize View</SheetTitle>
                  <SheetDescription>Refine the collection to your style</SheetDescription>
                </SheetHeader>
                <FilterContent />
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <div className="sticky top-28 glass-strong rounded-2xl p-6 border border-border/20 shadow-sm">
              <FilterContent />
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <p className="text-xs text-muted-foreground font-medium">
                Showing {filtered.length} {filtered.length === 1 ? "product" : "products"}
              </p>
            </div>

            <AnimatePresence mode="popLayout">
              {loading ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="space-y-4">
                      <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-3/4 rounded-lg" />
                        <Skeleton className="h-4 w-1/4 rounded-lg" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <motion.div 
                  layout 
                  className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
                >
                  {filtered.map((product, i) => (
                    <ProductCard key={product.id} product={product} index={i} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {filtered.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="text-center py-24 glass rounded-3xl border border-dashed border-border/50"
              >
                <SlidersHorizontal className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <p className="text-muted-foreground font-medium">No products match your current filters.</p>
                <Button variant="link" onClick={clearFilters} className="mt-2 text-primary">Clear all filters</Button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
