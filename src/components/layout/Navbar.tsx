import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShoppingBag, Search, Heart, Menu, X, User, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatPrice } from "@/data/products";
import { dataService, Product as FirestoreProduct } from "@/services/dataService";
import { LogOut, Settings, User as UserIcon, Shield } from "lucide-react";

const navLinks = [
  { label: "Men", href: "/shop?category=Men" },
  { label: "Women", href: "/shop?category=Women" },
  { label: "Kids", href: "/shop?category=Kids" },
  { label: "Lookbook", href: "/lookbook" },
  { label: "About", href: "/about" },
];

export default function Navbar() {
  const { totalItems, setIsOpen } = useCart();
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<FirestoreProduct[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const location = useLocation();
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => { 
    setMobileOpen(false); 
    setSearchOpen(false); 
    setSearchQuery("");
    setSuggestions([]);
  }, [location]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      const timer = setTimeout(async () => {
        try {
          const results = await dataService.products.searchProducts(searchQuery, 5);
          setSuggestions(results);
        } catch (err) {
          console.error("Search error:", err);
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
    }
    setSelectedIndex(-1);
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      navigate(`/product/${suggestions[selectedIndex].id}`);
    } else if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      setSelectedIndex(prev => (prev > -1 ? prev - 1 : prev));
    } else if (e.key === "Escape") {
      setSearchOpen(false);
    }
  };

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled 
          ? "glass-strong shadow-lg" 
          : "bg-transparent"
      }`}>
        <div className="container flex items-center justify-between h-[72px]">
          <button
            className="md:hidden p-2 -ml-2 text-foreground hover:text-primary transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link to="/" className="font-heading text-2xl font-bold tracking-tight gradient-text">
            LYRA
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="font-body text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-200 relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 gradient-primary rounded-full transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setSearchOpen(!searchOpen)}
              className={`p-2.5 rounded-xl transition-all hover:scale-105 ${searchOpen ? "gradient-primary text-white" : "glass-subtle text-foreground hover:text-primary"}`} 
              aria-label="Search"
            >
              <Search className="w-[18px] h-[18px]" />
            </button>
            
            <div className="relative" ref={menuRef}>
              <button 
                onClick={() => user ? setMenuOpen(!menuOpen) : navigate("/auth")}
                className={`p-2.5 rounded-xl transition-all hover:scale-105 glass-subtle text-foreground hover:text-primary hidden sm:flex items-center gap-2 ${user ? "border border-primary/20" : ""}`}
              >
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="w-[18px] h-[18px] rounded-full object-cover" />
                ) : (
                  <UserIcon className="w-[18px] h-[18px]" />
                )}
                {user && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
              </button>

              <AnimatePresence>
                {menuOpen && user && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full mt-2 right-0 w-48 glass-strong border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50 p-2"
                  >
                    <div className="px-3 py-2 mb-2 border-b border-white/5">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate">{user.email || user.phoneNumber}</p>
                    </div>
                    <Link to="/account" className="flex items-center gap-2 w-full p-2 rounded-xl text-xs font-medium hover:bg-white/10 transition-colors">
                      <UserIcon className="w-3.5 h-3.5" /> Profile Settings
                    </Link>
                    {(user?.email === (import.meta.env.VITE_ADMIN_EMAIL || "kumarvinay072007@gmail.com")) && (
                      <Link to="/admin" className="flex items-center gap-2 w-full p-2 rounded-xl text-xs font-medium hover:bg-white/10 transition-colors border-t border-white/5 mt-1 pt-2">
                        <Shield className="w-3.5 h-3.5 text-primary" /> Admin Panel
                      </Link>
                    )}
                    <button 
                      onClick={() => { signOut(); setMenuOpen(false); }} 
                      className="flex items-center gap-2 w-full p-2 rounded-xl text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors mt-1"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link to="/wishlist" className="p-2.5 rounded-xl glass-subtle text-foreground hover:text-primary transition-all hover:scale-105 hidden sm:flex" aria-label="Wishlist">
              <Heart className="w-[18px] h-[18px]" />
            </Link>
            <button
              className="p-2.5 rounded-xl glass-subtle text-foreground hover:text-primary transition-all hover:scale-105 relative"
              onClick={() => setIsOpen(true)}
              aria-label="Cart"
            >
              <ShoppingBag className="w-[18px] h-[18px]" />
              {totalItems > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full gradient-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow-lg"
                >
                  {totalItems}
                </motion.span>
              )}
            </button>
          </div>
        </div>

        {/* Search Input and Suggestions */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden border-t border-border/30 glass-strong shadow-2xl"
              ref={searchRef}
            >
              <div className="container py-6">
                <div className="relative max-w-2xl mx-auto">
                  <div className="relative">
                    <form onSubmit={handleSearch} className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search for hoodies, shirts, or categories..."
                        className="w-full h-14 pl-12 pr-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30"
                        autoFocus
                      />
                      {searchQuery && (
                        <button 
                          type="button"
                          onClick={() => setSearchQuery("")}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          <X className="w-4 h-4 text-muted-foreground" />
                        </button>
                      )}
                    </form>

                    {/* Suggestions Dropdown */}
                    <AnimatePresence>
                      {suggestions.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute top-full mt-4 left-0 right-0 glass-strong border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50 p-2"
                        >
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-4 py-3 border-b border-white/5">Suggested Products</p>
                          <div className="flex flex-col">
                            {suggestions.map((product, index) => (
                              <Link
                                key={product.id}
                                to={`/product/${product.id}`}
                                className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-200 ${
                                  selectedIndex === index ? "bg-primary text-white shadow-lg scale-[1.02]" : "hover:bg-white/10"
                                }`}
                                onMouseEnter={() => setSelectedIndex(index)}
                              >
                                <div className="w-12 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-white/10">
                                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold truncate">{product.name}</p>
                                  <p className={`text-xs ${selectedIndex === index ? "text-white/80" : "text-muted-foreground"}`}>{product.brand} — {formatPrice(product.price)}</p>
                                </div>
                                <ArrowRight className={`w-4 h-4 transition-transform ${selectedIndex === index ? "translate-x-1 opacity-100" : "opacity-0"}`} />
                              </Link>
                            ))}
                          </div>
                          <button 
                            onClick={handleSearch}
                            className="w-full text-center py-3 text-xs font-bold text-primary hover:bg-primary/5 transition-colors mt-1"
                          >
                            View all results for "{searchQuery}"
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 top-[72px] z-40 glass"
          >
            <nav className="flex flex-col p-6 gap-6 h-full overflow-y-auto">
              <div className="space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Categories</p>
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    to={link.href}
                    className="block font-heading text-xl font-bold text-foreground hover:text-primary transition-colors py-2"
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              <div className="border-t border-border/50 pt-6 space-y-4 mt-auto mb-12">
                <Link to="/wishlist" className="flex items-center gap-3 font-bold" onClick={() => setMobileOpen(false)}>
                  <div className="w-10 h-10 rounded-xl glass-subtle flex items-center justify-center text-foreground">
                    <Heart className="w-5 h-5" />
                  </div>
                  <span className="text-sm">My Wishlist</span>
                </Link>
                <Link to={user ? "/account" : "/auth"} className="flex items-center gap-3 font-bold" onClick={() => setMobileOpen(false)}>
                  <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground overflow-hidden">
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm">{user ? (user.displayName || "My Account") : "Sign In / Create Account"}</span>
                    {user && <span className="text-[10px] text-muted-foreground font-medium truncate max-w-[150px]">{user.email || user.phoneNumber}</span>}
                  </div>
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
