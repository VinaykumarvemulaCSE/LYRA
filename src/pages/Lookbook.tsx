import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ArrowRight, ShoppingBag, Loader2 } from "lucide-react";
import { formatPrice } from "@/data/products";
import { dataService, Product as FirestoreProduct } from "@/services/dataService";

const staticLooks = [
  { 
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1962", 
    title: "Summer Minimal",
    hotspots: [
      { x: "45%", y: "40%", productId: "prod_w_dress_02" }
    ]
  },
  { image: "https://images.unsplash.com/photo-1434389677669-e08b4cda3a95?q=80&w=2068", title: "Modern Tailoring", hotspots: [] },
  { 
    image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1974", 
    title: "Urban Context",
    hotspots: [
      { x: "50%", y: "30%", productId: "prod_m_jacket_01" }
    ]
  },
  { image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070", title: "Silk & Shadow", hotspots: [] },
  { 
    image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1920", 
    title: "The Signature Edit",
    hotspots: [
      { x: "55%", y: "60%", productId: "prod_w_jacket_08" }
    ]
  },
  { image: "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1920", title: "Ethereal Layers", hotspots: [] },
];

export default function Lookbook() {
  const [activeHotspot, setActiveHotspot] = useState<{lookIndex: number, hotspotIndex: number} | null>(null);
  const [products, setProducts] = useState<FirestoreProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dataService.products.getAll().then(data => {
      setProducts(data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <main className="pt-32 pb-24 min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </main>
    );
  }

  return (
    <main className="pt-24 pb-0 bg-background/50">
      <div className="container max-w-7xl text-center mb-20">
        <motion.span 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[10px] font-black text-primary uppercase tracking-[0.4em]"
        >
          Visual Editorial
        </motion.span>
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-heading text-5xl md:text-6xl mt-4 font-black mb-6 tracking-tighter"
        >
          Series 01: <span className="gradient-text">SS25</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed"
        >
          A study in contrast: fluid silks against structured wool, deep shadows meeting warm light. Designed for the modern wanderer.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-24 container max-w-[1400px] pb-32">
        {staticLooks.map((look, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className={i % 2 === 1 ? "md:mt-32" : ""}
          >
            <div className="group relative aspect-[3/4] overflow-hidden rounded-[40px] shadow-2xl bg-secondary/20 border border-border/10">
              <img 
                src={look.image} 
                alt={look.title} 
                className="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-110 grayscale-[0.2] group-hover:grayscale-0" 
                loading="lazy" 
              />
              
              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              {/* Hotspots */}
              {look.hotspots.map((spot, spotIdx) => {
                const product = products.find(p => p.id === spot.productId);
                if (!product) return null;
                
                const isActive = activeHotspot?.lookIndex === i && activeHotspot?.hotspotIndex === spotIdx;

                return (
                  <div 
                    key={spotIdx} 
                    className="absolute z-20" 
                    style={{ left: spot.x, top: spot.y }}
                  >
                    <button
                      onMouseEnter={() => setActiveHotspot({ lookIndex: i, hotspotIndex: spotIdx })}
                      onMouseLeave={() => setActiveHotspot(null)}
                      className="relative w-8 h-8 flex items-center justify-center group/dot"
                      aria-label={`View ${product.name}`}
                    >
                      <span className="absolute inset-0 bg-primary/40 rounded-full animate-ping scale-150" />
                      <span className="w-4 h-4 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.8)] border-4 border-primary group-hover/dot:scale-125 transition-transform" />
                    </button>

                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.9 }}
                          animate={{ opacity: 1, y:-10, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.9 }}
                          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-48 glass-strong p-3 rounded-2xl shadow-2xl border border-white/20 pointer-events-none"
                        >
                          <div className="flex gap-3">
                            <div className="w-12 h-16 rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
                              <img src={product.image} className="w-full h-full object-cover" alt="" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-black text-primary uppercase tracking-tighter truncate">{product.name}</p>
                              <p className="text-xs font-black text-white mt-1">{formatPrice(product.price)}</p>
                              <div className="mt-2 flex items-center gap-1 text-[9px] font-bold text-white/60">
                                View Item <ArrowRight className="w-2.5 h-2.5" />
                              </div>
                            </div>
                          </div>
                          <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 glass shadow-2xl rotate-45 border-r border-b border-white/20" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}

              <div className="absolute bottom-10 left-10 right-10 flex items-center justify-between pointer-events-none translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-700">
                <h3 className="font-heading text-xl font-bold text-white tracking-tight">{look.title}</h3>
                <Link to="/shop" className="pointer-events-auto px-6 py-3 glass-strong text-white text-[11px] font-bold rounded-2xl hover:bg-primary shadow-2xl transition-all uppercase tracking-widest flex items-center gap-2">
                  Shop All <ShoppingBag className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </main>
  );
}
