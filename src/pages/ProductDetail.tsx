import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ArrowLeft, Leaf, Check, Info, Star, Truck, Shield, RefreshCw, Share2, ZoomIn, Loader2, Users, AlertCircle } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { formatPrice } from "@/data/products";
import { dataService, Product as FirestoreProduct } from "@/services/dataService";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import ProductCard from "@/components/product/ProductCard";
import ProductReviews from "@/components/product/ProductReviews";
import { Skeleton } from "@/components/ui/skeleton";
import { Analytics } from "@/lib/analytics";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<FirestoreProduct | null>(null);
  const [related, setRelated] = useState<FirestoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();

  const [selectedVariant, setSelectedVariant] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const isWishlisted = product ? isInWishlist(product.id) : false;
  const [justAdded, setJustAdded] = useState(false);
  const [activeTab, setActiveTab] = useState<"description" | "reviews">("description");
  
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const imageRef = useRef<HTMLDivElement>(null);
  // Must be declared before any early returns to satisfy Rules of Hooks
  const [currentUrl, setCurrentUrl] = useState("");
  const [viewCount] = useState(() => Math.floor(Math.random() * 18) + 5); // Social proof

  useEffect(() => {
    if (!id) return;
    
    setLoading(true);
    dataService.products.getById(id).then(data => {
      if (data) {
        setProduct(data);
        Analytics.productView({ product_id: data.id, price: data.price, currency: "INR" });
        
        // Fetch related
        dataService.products.getByCategory(data.category, 5).then(relatedProducts => {
          setRelated(relatedProducts.filter(p => p.id !== data.id).slice(0, 4));
        });
      } else {
        toast.error("Product not found");
        navigate("/shop");
      }
    }).catch(err => {
      console.error("Product fetch error:", err);
      toast.error("Failed to load product");
    }).finally(() => {
      setLoading(false);
    });

    window.scrollTo(0, 0);
  }, [id, navigate]);

  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  if (loading) {
    return (
      <main className="pt-24 min-h-screen">
        <div className="container py-6">
          <Skeleton className="h-4 w-24 rounded-lg" />
        </div>
        <div className="container pb-16">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 lg:gap-16">
            <Skeleton className="aspect-[3/4] w-full rounded-[2.5rem]" />
            <div className="space-y-6">
              <Skeleton className="h-4 w-20 rounded-lg" />
              <Skeleton className="h-12 w-3/4 rounded-xl" />
              <Skeleton className="h-8 w-32 rounded-lg" />
              <div className="space-y-4 pt-8">
                <Skeleton className="h-4 w-full rounded-lg" />
                <Skeleton className="h-4 w-5/6 rounded-lg" />
              </div>
              <div className="flex gap-4 pt-12">
                <Skeleton className="h-14 flex-1 rounded-2xl" />
                <Skeleton className="h-14 w-14 rounded-2xl" />
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="pt-24">
        <div className="container py-20 text-center">
          <p className="text-muted-foreground">Product not found.</p>
          <Link to="/shop" className="text-sm text-primary underline mt-4 inline-block">Back to Shop</Link>
        </div>
      </main>
    );
  }

  // Fallback for variants if database structure has evolved or empty arrays exist
  const variant = product.variants?.[selectedVariant] || product.variants?.[0] || { color: "Standard", colorHex: "#000000", sizes: ["OS"], stock: 1 };
  const allImages = product.images && product.images.length > 0 ? product.images : [product.image];

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.error("Please select a size", { description: "Choose your size before adding to bag." });
      return;
    }
    const success = addItem(product, variant.color, selectedSize);
    if (success) {
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2000);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;
    const { left, top, width, height } = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setMousePos({ x, y });
  };


  const handleShare = () => {
    const url = currentUrl || window.location.href;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  return (
    <div className="min-h-screen pt-24 pb-12 selection:bg-primary/20">
      <Helmet>
        <title>{product.name} | LYRA Style Hub</title>
        <meta name="description" content={product.description || `Shop the ${product.name} at LYRA. High-quality fashion luxury.`} />
        <meta property="og:title" content={`${product.name} | LYRA`} />
        <meta property="og:description" content={product.description || `Shop the ${product.name} at LYRA. High-quality fashion luxury.`} />
        <meta property="og:image" content={allImages[0]} />
        <meta property="og:url" content={currentUrl || "https://lyra-stylehub.vercel.app"} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={product.name} />
        <meta name="twitter:description" content={product.description || `Discover ${product.name} at LYRA`} />
        <meta name="twitter:image" content={allImages[0]} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": product.name,
            "image": allImages,
            "description": product.description || `Shop the ${product.name} at LYRA. High-quality fashion luxury.`,
            "brand": {
              "@type": "Brand",
              "name": product.brand || "LYRA"
            },
            "offers": {
              "@type": "Offer",
              "url": currentUrl || "https://lyra-stylehub.vercel.app",
              "priceCurrency": "INR",
              "price": product.price,
              "itemCondition": "https://schema.org/NewCondition",
              "availability": product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
            }
          })}
        </script>
      </Helmet>
      
      <div className="container">
        <Breadcrumbs 
          items={[
            { label: "Shop", href: "/shop" },
            { label: product.category || "Collection", href: `/shop?category=${product.category}` },
            { label: product.name }
          ]} 
        />
        
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Scrolling Gallery Container */}
          <div className="space-y-6">
            <div className="relative group overflow-hidden rounded-[2.5rem] glass-strong shadow-2xl aspect-[3/4]">
              {/* Horizontal Scroll Area */}
              <div 
                className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide h-full w-full"
                onScroll={(e) => {
                  const scrollLeft = (e.target as HTMLDivElement).scrollLeft;
                  const width = (e.target as HTMLDivElement).offsetWidth;
                  setSelectedImage(Math.round(scrollLeft / width));
                }}
              >
                {allImages.map((img, i) => (
                  <div 
                    key={i} 
                    className="flex-shrink-0 w-full h-full snap-center relative cursor-zoom-in overflow-hidden"
                    onMouseEnter={() => setIsZoomed(true)}
                    onMouseLeave={() => setIsZoomed(false)}
                    onMouseMove={handleMouseMove}
                    ref={i === selectedImage ? imageRef : null}
                  >
                     <motion.img 
                      src={img} 
                      alt={`${product.name} ${i + 1}`} 
                      className="w-full h-full object-cover transition-transform duration-200 ease-out"
                      style={{
                        transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
                        scale: isZoomed ? 2.5 : 1,
                      }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    />
                    
                    {/* Visual Zoom Indicator */}
                    {!isZoomed && (
                      <div className="absolute top-4 right-4 p-2 rounded-full glass-strong text-white/70 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ZoomIn className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Snap Indicator Dots */}
              {allImages.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                  {allImages.map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        selectedImage === i ? "w-6 bg-primary" : "w-1.5 bg-white/40"
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Status Badges */}
              <div className="absolute top-6 left-6 z-20 flex flex-col gap-2">
                {product.isNew && (
                  <span className="px-4 py-2 rounded-xl gradient-primary text-white text-[10px] font-black uppercase tracking-widest shadow-xl backdrop-blur-md">New Collection</span>
                )}
                {product.isBestseller && (
                  <span className="px-4 py-2 rounded-xl bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest shadow-xl backdrop-blur-md">Bestseller</span>
                )}
              </div>
            </div>

            {/* Selection Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-4 px-1 scrollbar-hide">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      const container = document.querySelector('.snap-x');
                      if (container) {
                        container.scrollTo({ left: i * (container as HTMLElement).offsetWidth, behavior: 'smooth' });
                      }
                      setSelectedImage(i);
                    }}
                    className={`w-20 h-24 rounded-2xl overflow-hidden flex-shrink-0 border-2 transition-all duration-500 scale-100 active:scale-95 ${
                      selectedImage === i ? "border-primary shadow-xl ring-4 ring-primary/10" : "border-transparent opacity-40 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">{product.brand}</span>
              <button 
                onClick={handleShare}
                className="p-2 rounded-xl glass hover:text-primary transition-all active:scale-95"
                title="Share product"
              >
                <Share2 className="w-[18px] h-[18px]" />
              </button>
            </div>
            
            <div className="space-y-1 mb-8">
              <div className="flex items-center gap-2 mb-2">
                {product.isNew && <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-primary text-primary-foreground rounded-full">New Arrival</span>}
                <div className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground uppercase tracking-widest bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full">
                  <Users className="w-3 h-3" /> {viewCount} people are viewing
                </div>
              </div>
              <h1 className="font-heading text-4xl lg:text-5xl font-bold tracking-tight text-foreground">{product.name}</h1>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-[0.2em]">{product.brand}</p>
            </div>
            
            <div className="flex items-center gap-4 mb-3">
              <span className="font-heading text-3xl font-bold text-primary">{formatPrice(product.price)}</span>
              {product.originalPrice && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground line-through text-lg">{formatPrice(product.originalPrice)}</span>
                  <span className="text-xs font-bold text-white bg-destructive px-2 py-1 rounded-lg shadow-sm">
                    {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                  </span>
                </div>
              )}
            </div>

            {/* Scarcity Badge */}
            <AnimatePresence>
              {variant.stock > 0 && variant.stock <= 5 && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6"
                >
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                      Limited Selection: Only {variant.stock} units remaining
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Selection Sections */}
            <div className="space-y-8 mb-10">
              {/* Color Selection */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center justify-between">
                  Color <span>{variant.color}</span>
                </p>
                <div className="flex gap-3">
                  {product.variants.map((v, i) => (
                    <button
                      key={v.color}
                      onClick={() => { setSelectedVariant(i); setSelectedSize(""); }}
                      className={`w-10 h-10 rounded-2xl border-2 transition-all duration-300 ${
                        i === selectedVariant ? "border-primary scale-110 shadow-xl ring-4 ring-primary/10" : "border-transparent hover:border-muted-foreground/30"
                      }`}
                      style={{ backgroundColor: v.colorHex }}
                      title={v.color}
                    />
                  ))}
                </div>
              </div>

              {/* Size Selection */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-bold uppercase tracking-widest">Size Selection</p>
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="text-[11px] font-bold text-primary flex items-center gap-1.5 hover:opacity-80 transition-opacity uppercase tracking-tighter">
                        <Info className="w-3.5 h-3.5" /> Size Guide
                      </button>
                    </DialogTrigger>
                    <DialogContent className="glass-strong border-0 max-w-md">
                      <DialogHeader>
                        <DialogTitle className="font-heading">Size Guide</DialogTitle>
                        <DialogDescription>Measurements in inches for a perfect fit.</DialogDescription>
                      </DialogHeader>
                      <table className="w-full text-sm mt-4">
                        <thead className="bg-secondary/50 text-muted-foreground uppercase text-[10px] font-bold">
                          <tr><th className="px-4 py-3 text-left">Size</th><th className="px-4 py-3">Bust</th><th className="px-4 py-3">Waist</th><th className="px-4 py-3">Hip</th></tr>
                        </thead>
                        <tbody>
                          {[["XS","32","24","34"],["S","34","26","36"],["M","36","28","38"],["L","38","30","40"],["XL","40","32","42"]].map(([s,b,w,h]) => (
                            <tr key={s} className="border-b border-border/30 hover:bg-white/5 transition-colors"><td className="px-4 py-3.5 font-bold">{s}</td><td className="px-4 py-3.5 text-center">{b}</td><td className="px-4 py-3.5 text-center">{w}</td><td className="px-4 py-3.5 text-center">{h}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {variant.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[54px] h-11 px-4 text-sm font-bold transition-all duration-300 rounded-xl ${
                        selectedSize === size
                          ? "gradient-primary text-primary-foreground shadow-lg scale-105"
                          : "glass text-foreground hover:border-primary/50 hover:bg-white/10"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mb-8">
              <Button
                className={`flex-1 h-14 font-heading font-bold rounded-2xl shadow-2xl transition-all duration-500 overflow-hidden relative group ${
                  justAdded ? "bg-emerald-500 hover:bg-emerald-500" : "gradient-primary hover:opacity-90"
                }`}
                onClick={handleAddToCart}
                disabled={!selectedSize}
              >
                <AnimatePresence mode="wait">
                  {justAdded ? (
                    <motion.span key="added" initial={{ y: 20 }} animate={{ y: 0 }} className="flex items-center gap-2">
                      <Check className="w-5 h-5" /> Added to Bag
                    </motion.span>
                  ) : (
                    <motion.span key="add" initial={{ y: -20 }} animate={{ y: 0 }}>
                      {selectedSize ? "Add to Bag" : "Choose a Size"}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
              <button
                onClick={() => {
                  if (isWishlisted) {
                    removeFromWishlist(product.id);
                  } else {
                    addToWishlist(product);
                  }
                }}
                className={`w-14 h-14 rounded-2xl glass-strong flex items-center justify-center transition-all duration-300 group ${isWishlisted ? "text-destructive shadow-inner" : "hover:text-primary"}`}
              >
                <Heart className={`w-6 h-6 transition-transform duration-300 group-active:scale-150 ${isWishlisted ? "fill-destructive" : "group-hover:scale-110"}`} />
              </button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 p-4 glass rounded-2xl mb-10 border border-white/10">
              {[{ icon: Truck, label: "Free Shipping" }, { icon: Shield, label: "Verified Quality" }, { icon: RefreshCw, label: "Easy Returns" }].map(({ icon: Icon, label }) => (
                <div key={label} className="text-center">
                  <Icon className="w-5 h-5 text-primary mx-auto mb-2" />
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">{label}</p>
                </div>
              ))}
            </div>

            {/* Product Details Tabs */}
            <div className="border-t border-border/20 pt-8">
              <div className="flex gap-10 mb-6">
                {(["description", "reviews"] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`text-sm font-bold uppercase tracking-widest pb-3 border-b-2 transition-all ${
                      activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  {activeTab === "description" ? (
                    <div className="space-y-6">
                      <p className="text-sm text-muted-foreground leading-loose">{product.description}</p>
                      <div className="grid grid-cols-2 gap-8">
                        {product.material && (
                          <div>
                            <p className="text-[10px] font-bold uppercase text-primary tracking-widest mb-2">Composition</p>
                            <p className="text-sm font-medium">{product.material}</p>
                          </div>
                        )}
                        {product.ecoLabels && product.ecoLabels.length > 0 && (
                          <div>
                            <p className="text-[10px] font-bold uppercase text-emerald-500 tracking-widest mb-2 flex items-center gap-1.5">
                              <Leaf className="w-3.5 h-3.5" /> Conscious
                            </p>
                            <div className="flex flex-wrap gap-2 text-sm font-medium">
                              {product.ecoLabels.join(", ")}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <ProductReviews productId={product.id} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Suggested Section */}
      {related.length > 0 && (
        <section className="container pb-24 border-t border-border/20 pt-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-heading text-2xl font-bold">Complete the Look</h2>
            <Link to="/shop" className="text-xs font-bold text-primary uppercase tracking-widest hover:underline">View All</Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {related.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </section>
      )}
    </div>
  );
}
