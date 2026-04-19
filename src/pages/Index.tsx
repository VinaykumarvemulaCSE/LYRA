import { Link } from "react-router-dom";
import { useRef, useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { dataService, Product as FirestoreProduct } from "@/services/dataService";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ArrowRight, Truck, Shield, RefreshCw, Star, ChevronLeft, ChevronRight, Leaf, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/product/ProductCard";

import useEmblaCarousel from "embla-carousel-react";

const heroSlides = [
  {
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1920",
    title: "Spring Collection",
    subtitle: "Discover the new season",
  },
  {
    image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1920",
    title: "Minimal Luxury",
    subtitle: "Effortless elegance",
  },
  {
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1920",
    title: "New Arrivals",
    subtitle: "Fresh styles weekly",
  },
  {
    image: "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1920",
    title: "Streetwear Edit",
    subtitle: "Bold & comfortable",
  },
  {
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?q=80&w=1920",
    title: "Summer Essentials",
    subtitle: "Beat the heat in style",
  },
];

const AUTO_PLAY_INTERVAL = 6000;

const collections = [
  { title: "Men's Collection", image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=800", href: "/shop?category=Men" },
  { title: "Women's Collection", image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800", href: "/shop?category=Women" },
  { title: "Kids' Collection", image: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?q=80&w=800", href: "/shop?category=Kids" },
];

const perks = [
  { icon: Truck, title: "Free Shipping", desc: "On orders above ₹999" },
  { icon: Shield, title: "Premium Quality", desc: "Ethically sourced" },
  { icon: RefreshCw, title: "Easy Returns", desc: "14-day hassle-free" },
  { icon: Star, title: "Top Rated", desc: "4.8 average rating" },
];

export default function Index() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 30, skipSnaps: false });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [featuredProducts, setFeaturedProducts] = useState<FirestoreProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch live products for the homepage
    dataService.products.getAll().then(data => {
      setFeaturedProducts(data.slice(0, 8));
      setIsLoading(false);
    }).catch(console.error);
  }, []);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi, setSelectedIndex]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  const [isHovered, setIsHovered] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!emblaApi || isHovered || shouldReduceMotion) return;
    const intervalId = setInterval(() => emblaApi.scrollNext(), AUTO_PLAY_INTERVAL);
    return () => clearInterval(intervalId);
  }, [emblaApi, isHovered, shouldReduceMotion]);

  return (
    <main>
      {/* Hero Section */}
      <section 
        className="relative pt-[72px] group/hero"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="overflow-hidden cursor-grab active:cursor-grabbing" ref={emblaRef}>
          <div className="flex touch-pan-y">
            {heroSlides.map((slide, i) => (
              <div key={i} className="relative flex-[0_0_100%] min-w-0 h-[85vh] min-h-[500px] transform-gpu backface-hidden bg-zinc-200 animate-pulse">
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none transition-opacity duration-1000"
                  loading={i === 0 ? "eager" : "lazy"}
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    img.parentElement?.classList.remove('animate-pulse', 'bg-zinc-200');
                  }}
                />
                <div className="absolute inset-0 bg-black/40 bg-gradient-to-r from-black/60 via-transparent to-transparent" />

                <div className="relative h-full flex items-center">
                  <div className="container">
                    <motion.div
                      key={selectedIndex === i ? "active" : "inactive"}
                      initial={{ opacity: 0, x: -50 }}
                      animate={selectedIndex === i ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="max-w-2xl"
                    >
                      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl glass text-white text-[10px] font-bold uppercase tracking-[0.2em] mb-6 shadow-xl border border-white/10">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
                        {slide.subtitle}
                      </span>
                      <h1 className="font-heading text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-white leading-[1.1] mb-6 sm:mb-8 tracking-tighter drop-shadow-2xl overflow-hidden">
                        {slide.title.split(" ").map((word, wordIdx) => (
                          <span key={wordIdx} className="inline-block sm:whitespace-nowrap mr-[0.2em] last:mr-0">
                            {word.split("").map((letter, letterIdx) => (
                              <motion.span
                                key={letterIdx}
                                initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                                animate={selectedIndex === i ? { opacity: 1, y: 0, filter: "blur(0px)" } : { opacity: 0, y: 20, filter: "blur(10px)" }}
                                transition={{ 
                                  duration: 0.5, 
                                  delay: (wordIdx * 0.1) + (letterIdx * 0.03) + 0.2,
                                  ease: [0.215, 0.61, 0.355, 1]
                                }}
                                className="inline-block"
                              >
                                {letter}
                              </motion.span>
                            ))}
                          </span>
                        ))}
                      </h1>
                      <div className="flex flex-wrap gap-4">
                        <Link to="/shop">
                          <Button size="lg" className="h-14 px-10 font-heading font-black rounded-2xl gradient-primary border-0 shadow-2xl hover:scale-105 active:scale-95 transition-all">
                            Shop Now <ArrowRight className="w-5 h-5 ml-2" />
                          </Button>
                        </Link>
                        <Link to="/lookbook">
                          <Button variant="outline" size="lg" className="h-14 px-10 font-heading font-black rounded-2xl bg-white/5 backdrop-blur-md border border-white/20 text-white hover:bg-white/10 hover:border-white/40 transition-all">
                            Explore More
                          </Button>
                        </Link>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="absolute top-1/2 -translate-y-1/2 left-4 right-4 flex justify-between pointer-events-none opacity-0 group-hover/hero:opacity-100 transition-opacity duration-500 max-w-[1600px] mx-auto hidden md:flex">
          <button
            onClick={scrollPrev}
            className="w-14 h-14 rounded-2xl glass-strong flex items-center justify-center text-white pointer-events-auto hover:bg-primary transition-all hover:scale-105 active:scale-95 shadow-2xl"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={scrollNext}
            className="w-14 h-14 rounded-2xl glass-strong flex items-center justify-center text-white pointer-events-auto hover:bg-primary transition-all hover:scale-105 active:scale-95 shadow-2xl"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Pagination Dots */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-10">
          {heroSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              className={`h-1.5 rounded-full transition-all duration-500 overflow-hidden relative ${selectedIndex === i ? "w-10 bg-primary shadow-[0_0_12px_rgba(var(--primary),0.6)]" : "w-2 bg-white/30 hover:bg-white/50"
                }`}
            >
              {selectedIndex === i && (
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: "0%" }}
                  transition={{ duration: AUTO_PLAY_INTERVAL / 1000, ease: "linear" }}
                  className="absolute inset-0 bg-white/40"
                />
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Perks */}
      <section className="py-6 border-b border-border/30">
        <div className="container">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {perks.map((perk, i) => (
              <motion.div
                key={perk.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.08 }}
                className="flex items-center gap-3 p-3 rounded-xl glass-subtle hover:bg-white/5 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                  <perk.icon className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-heading text-sm font-bold">{perk.title}</p>
                  <p className="text-xs text-muted-foreground">{perk.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Philosophy Section */}
      <section className="py-24 md:py-32 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="container relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="text-xs font-bold text-primary uppercase tracking-[0.3em]"
            >
              The Lyra Philosophy
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="font-heading text-4xl md:text-5xl font-black mt-6 mb-8 tracking-tighter"
            >
              Defining the future of <span className="gradient-text">Conscious Luxury</span>.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-muted-foreground leading-relaxed"
            >
              We believe that true style should transcend time and trends, built on a foundation of ethical craftsmanship and uncompromised quality.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Leaf,
                title: "Ethical Sourcing",
                desc: "Every fiber is traced back to its origin. We partner with artisans who share our commitment to fair wages and carbon-neutral production.",
                color: "emerald"
              },
              {
                icon: Shield,
                title: "Heirloom Quality",
                desc: "Designed to last generations, not just seasons. Our garments feature reinforced stitching and premium natural fabrics for unmatched longevity.",
                color: "blue"
              },
              {
                icon: Globe,
                title: "Global Impact",
                desc: "We ship worldwide with 100% recycled packaging. 1% of every purchase supports ocean conservation and reforestation projects.",
                color: "cyan"
              }
            ].map((pillar, i) => (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.2 }}
                className="relative p-8 md:p-10 rounded-[32px] glass-strong border border-border/10 hover:border-primary/20 transition-all duration-500 group overflow-hidden shadow-2xl"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-${pillar.color}-500/10 blur-[60px] translate-x-10 -translate-y-10 group-hover:scale-150 transition-transform duration-700`} />
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-8 border border-white/5 group-hover:bg-primary group-hover:text-white transition-all duration-500 group-hover:scale-110 shadow-xl">
                    <pillar.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-heading text-xl font-bold mb-4 tracking-tight group-hover:text-primary transition-colors">{pillar.title}</h3>
                  <p className="text-muted-foreground leading-loose text-sm">{pillar.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Collections */}
      <section className="py-16">
        <div className="container">
          <div className="text-center mb-10">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Explore</span>
            <h2 className="font-heading text-3xl font-bold mt-1">Shop by Collection</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {collections.map((col, i) => (
              <motion.div
                key={col.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <Link to={col.href} className="group block relative overflow-hidden rounded-2xl aspect-[3/4]">
                  <img src={col.image} alt={col.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-foreground/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="glass rounded-xl p-4 flex items-center justify-between">
                      <h3 className="font-heading text-lg font-bold text-white">{col.title}</h3>
                      <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="pb-16">
        <div className="container">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Curated for you</span>
              <h2 className="font-heading text-3xl font-bold mt-1">Trending Now</h2>
            </div>
            <Link to="/shop" className="text-sm text-primary font-semibold flex items-center gap-1 group hover:opacity-80 transition-opacity">
              View All <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {isLoading ? (
              <div className="col-span-full py-20 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : featuredProducts.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16">
        <div className="container">
          <div className="glass-strong rounded-3xl p-8 md:p-16 text-center max-w-3xl mx-auto">
            <h2 className="font-heading text-3xl font-bold mb-3">Stay in the Loop</h2>
            <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">
              Get early access to new drops, exclusive deals, and styling inspiration.
            </p>
            <form className="flex gap-3 max-w-md mx-auto" onSubmit={(e) => {
              e.preventDefault();
              toast.success("Welcome to LYRA", { description: "You're on the list. Check your email for a 10% welcome discount." });
              (e.target as HTMLFormElement).reset();
            }}>
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 h-12 px-5 glass rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                required
              />
              <Button type="submit" className="h-12 px-6 font-heading font-bold rounded-xl gradient-primary border-0">
                Subscribe
              </Button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
