import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { X, Plus, Minus, ShoppingBag, Truck, ArrowRight, Zap } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/data/products";
import { Button } from "@/components/ui/button";
import { dataService, Product as FirestoreProduct } from "@/services/dataService";
import { useState, useEffect } from "react";

export default function CartDrawer() {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, totalPrice, totalItems, clearCart } = useCart();
  const [trendingProducts, setTrendingProducts] = useState<FirestoreProduct[]>([]);
  
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const products = await dataService.products.getAll(3);
        setTrendingProducts(products.slice(0, 3));
      } catch (err) {
        console.error("Failed to fetch trending products", err);
      }
    };
    if (isOpen) fetchTrending();
  }, [isOpen]);
  
  const shippingThreshold = 5000;
  const shippingProgress = Math.min((totalPrice / shippingThreshold) * 100, 100);
  const remainingForFreeShipping = shippingThreshold - totalPrice;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-background border-l border-border flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="font-heading text-lg font-bold">Your Bag</h2>
                <div className="flex items-center gap-3">
                  <p className="text-xs text-muted-foreground">{totalItems} {totalItems === 1 ? "item" : "items"}</p>
                  {items.length > 0 && (
                    <button 
                      onClick={() => { if(confirm("Clear your luxury selection?")) clearCart(); }}
                      className="text-[10px] font-bold text-destructive/60 hover:text-destructive uppercase tracking-widest transition-colors"
                    >
                      &middot; Clear Bag
                    </button>
                  )}
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 rounded-xl hover:bg-secondary transition-colors" aria-label="Close cart">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Shipping Progress */}
            <div className="px-6 py-4 bg-secondary/30 border-b border-border/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${shippingProgress === 100 ? "bg-emerald-500 text-white" : "bg-primary/10 text-primary"}`}>
                    <Truck className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {shippingProgress === 100 ? "You've unlocked free shipping!" : "Free shipping progress"}
                  </span>
                </div>
                {shippingProgress < 100 && (
                  <span className="text-[10px] font-black text-primary">₹{remainingForFreeShipping} to go</span>
                )}
              </div>
              <div className="h-1.5 w-full bg-border/50 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${shippingProgress}%` }}
                  className={`h-full transition-all duration-500 ${shippingProgress === 100 ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" : "bg-primary"}`}
                />
              </div>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
              {items.length === 0 ? (
                <div className="flex flex-col h-full">
                  <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center py-10 opacity-60">
                    <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center">
                      <ShoppingBag className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                    <div>
                      <p className="font-heading font-black text-lg">Your bag is empty</p>
                      <p className="text-sm text-muted-foreground max-w-[200px] mx-auto mt-1">Looks like you haven't added anything to your bag yet.</p>
                    </div>
                    <Button variant="outline" className="rounded-xl border-border/50 font-bold text-xs uppercase tracking-widest px-8" onClick={() => setIsOpen(false)}>
                      Shop All
                    </Button>
                  </div>

                  {/* Trending section within empty state */}
                  <div className="mt-auto border-t border-border/30 pt-8 pb-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 fill-primary" /> Trending Now
                      </h3>
                      <Link to="/shop" onClick={() => setIsOpen(false)} className="text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                        View More <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {trendingProducts.map((product) => (
                        <Link 
                          key={product.id} 
                          to={`/product/${product.id}`}
                          onClick={() => setIsOpen(false)} 
                          className="group"
                        >
                          <div className="aspect-[3/4] rounded-xl overflow-hidden glass-strong mb-2">
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                          </div>
                          <p className="text-[9px] font-bold truncate group-hover:text-primary transition-colors">{product.name}</p>
                          <p className="text-[9px] text-muted-foreground">{formatPrice(product.price)}</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {items.map((item) => (
                    <motion.div
                      key={`${item.product.id}-${item.selectedColor}-${item.selectedSize}`}
                      layout
                      exit={{ opacity: 0, x: 50 }}
                      className="flex gap-5 group"
                    >
                      <Link to={`/product/${item.product.id}`} onClick={() => setIsOpen(false)} className="w-24 h-32 rounded-2xl overflow-hidden glass-strong border border-border/10 flex-shrink-0">
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          loading="lazy"
                        />
                      </Link>
                      <div className="flex-1 flex flex-col min-w-0 py-1">
                        <div className="flex justify-between items-start gap-2">
                          <Link to={`/product/${item.product.id}`} onClick={() => setIsOpen(false)}>
                            <h3 className="font-heading text-sm font-black truncate hover:text-primary transition-colors">{item.product.name}</h3>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter mt-0.5">
                              {item.selectedColor} &middot; {item.selectedSize}
                            </p>
                          </Link>
                          <button
                            onClick={() => removeItem(item.product.id, item.selectedColor, item.selectedSize)}
                            className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                            aria-label="Remove item"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between mt-auto">
                          <p className="text-sm font-black">{formatPrice(item.product.price)}</p>
                          <div className="flex items-center glass rounded-xl overflow-hidden border border-border/30">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.selectedColor, item.selectedSize, item.quantity - 1)}
                              className="w-8 h-8 flex items-center justify-center hover:bg-primary hover:text-white transition-all"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-[11px] font-black w-8 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.selectedColor, item.selectedSize, item.quantity + 1)}
                              className="w-8 h-8 flex items-center justify-center hover:bg-primary hover:text-white transition-all"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-6 glass-strong border-t border-border/30 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-heading text-sm font-black uppercase tracking-widest text-muted-foreground">Subtotal</span>
                  <span className="font-heading text-xl font-black">{formatPrice(totalPrice)}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 pb-2">
                  <div className="p-3 bg-secondary/50 rounded-xl">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Shipping</p>
                    <p className="text-xs font-black">{totalPrice >= 2000 ? "FREE" : "Calculated next"}</p>
                  </div>
                  <div className="p-3 bg-secondary/50 rounded-xl">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Taxes</p>
                    <p className="text-xs font-black">Included</p>
                  </div>
                </div>
                <Link
                  to="/checkout"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center w-full h-14 font-heading font-black text-sm rounded-2xl gradient-primary text-white shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Proceed to Checkout <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center text-[11px] font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
