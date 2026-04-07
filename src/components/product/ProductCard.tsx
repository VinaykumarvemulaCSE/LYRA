import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShoppingBag, Check } from "lucide-react";
import { formatPrice } from "@/data/products";
import { Product as FirestoreProduct } from "@/services/dataService";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ProductCardProps {
  product: FirestoreProduct;
  index?: number;
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  // Guard BEFORE hooks — satisfies Rules of Hooks
  // (component must always render with same hook count, so we return null here
  //  only after all hooks have been called below)
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const { addItem } = useCart();

  if (!product) return null;

  const secondaryImage = (product?.images && Array.isArray(product.images) && product.images.length > 1) ? product.images[1] : (product?.image || "");
  const primaryColor = (product?.variants && Array.isArray(product.variants) && product.variants.length > 0 && product.variants[0]?.colorHex) ? product.variants[0].colorHex : "#000000";

  const handleQuickAdd = (size: string) => {
    // Using the first variant's color as default for quick-add
    const variantColor = (product?.variants && Array.isArray(product.variants) && product.variants.length > 0) ? product.variants[0].color : "Default";
    addItem(product, variantColor || "Default", size);
    setJustAdded(true);
    setTimeout(() => {
      setJustAdded(false);
      setShowQuickAdd(false);
    }, 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setShowQuickAdd(false); }}
    >
      <div className="relative overflow-hidden rounded-2xl bg-card aspect-[3/4] shadow-sm group-hover:shadow-xl transition-all duration-500 border border-border/10">
        <Link to={`/product/${product.id}`} className="block h-full relative">
          <img
            src={product.image}
            alt={product.name}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${isHovered ? "opacity-0" : "opacity-100"}`}
            loading="lazy"
          />
          <img
            src={secondaryImage}
            alt={`${product.name} alternate`}
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 scale-105 group-hover:scale-100 ${isHovered ? "opacity-100" : "opacity-0"}`}
            loading="lazy"
          />
        </Link>

        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {product.isNew && (
            <span className="px-3 py-1 text-[10px] font-bold tracking-widest uppercase bg-primary text-primary-foreground rounded-lg shadow-lg">
              New
            </span>
          )}
          {product.originalPrice && (
            <span className="px-3 py-1 text-[10px] font-bold tracking-widest uppercase bg-destructive text-white rounded-lg shadow-lg">
              -{Math.round((1 - product.price / product.originalPrice) * 100)}%
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button
          onClick={(e) => {
            e.preventDefault();
            setIsWishlisted(!isWishlisted);
            const action = !isWishlisted ? "added to" : "removed from";
            toast.success("Wishlist Updated", {
              description: `Successfully ${action} your luxury favorites.`,
              duration: 2000
            });
          }}
          className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-xl glass-strong opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-90"
          aria-label="Add to wishlist"
        >
          <Heart className={`w-5 h-5 transition-colors ${isWishlisted ? "fill-destructive text-destructive" : "text-white"}`} />
        </button>

        {/* Quick Add Overlay */}
        <div className="absolute inset-x-4 bottom-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 z-20">
          {!showQuickAdd ? (
            <Button
              onClick={() => setShowQuickAdd(true)}
              style={{ backgroundColor: isHovered ? `${primaryColor}CC` : undefined }}
              className="w-full h-12 glass shadow-2xl text-white font-bold text-xs uppercase tracking-widest rounded-xl border border-white/20 hover:brightness-110 transition-all active:scale-95"
            >
              <ShoppingBag className="w-4 h-4 mr-2" /> Quick Add
            </Button>
          ) : null}
        </div>
        
        {/* Quick Add Overlay */}
        <AnimatePresence>
          {showQuickAdd && product?.variants && Array.isArray(product.variants) && product.variants.length > 0 && product.variants[0]?.sizes && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-4 left-0 right-0 px-4"
            >
              <div className="glass-strong rounded-xl p-3 shadow-2xl backdrop-blur-md">
                <p className="text-[10px] font-bold text-center mb-2 uppercase tracking-wider text-muted-foreground">Select Size</p>
                <div className="flex gap-2 justify-center">
                  {product.variants[0].sizes.map((size: string) => (
                    <button
                      key={size}
                      onClick={(e) => {
                        e.preventDefault();
                        handleQuickAdd(size);
                      }}
                      disabled={justAdded}
                      className="w-10 h-10 rounded-lg text-xs font-black shadow bg-card text-foreground hover:bg-primary hover:text-white transition-all border border-border/20 disabled:opacity-50"
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-4 space-y-1.5 px-1">
        <div className="flex justify-between items-start gap-2">
          <Link to={`/product/${product.id}`} className="flex-1">
            <h3 className="font-heading text-sm font-bold text-foreground hover:text-primary transition-colors truncate">
              {product.name}
            </h3>
            <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-tighter">{product.brand}</p>
          </Link>
          <div className="text-right">
            <p className="text-sm font-black text-primary">{formatPrice(product.price)}</p>
            {product.originalPrice && (
              <p className="text-[10px] text-muted-foreground line-through">{formatPrice(product.originalPrice)}</p>
            )}
          </div>
        </div>

        {/* Color swatches */}
        <div className="flex gap-2 pt-1">
          {product.variants?.map((v) => (
            <span
              key={v.color}
              className="w-4 h-4 rounded-full border border-white/10 shadow-sm ring-1 ring-border group-hover:ring-primary/30 transition-all"
              style={{ backgroundColor: v.colorHex }}
              title={v.color}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
