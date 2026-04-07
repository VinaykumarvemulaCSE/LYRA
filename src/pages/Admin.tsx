import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  LayoutDashboard, ShoppingBag, PackageSearch, ClipboardList, Users, BarChart3, Tags, Settings, LogOut, TrendingUp, CreditCard, Plus, Search, Edit2, Trash2, Eye, Package, ArrowUpRight, ArrowDownRight, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/data/products";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { seedService } from "@/services/seedService";
import { dataService, Product as FirestoreProduct } from "@/services/dataService";
import { githubService } from "@/services/githubService";

export default function Admin() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();
  const [dbProducts, setDbProducts] = useState<FirestoreProduct[]>([]);
  const [dbOrders, setDbOrders] = useState<any[]>([]);
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState("");
  
  // Form State
  const [newProduct, setNewProduct] = useState({
    name: "",
    brand: "LYRA Core",
    price: 0,
    originalPrice: 0,
    category: "Men",
    subCategory: "Essentials",
    description: "",
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=1974",
    sizes: "S, M, L, XL",
    colors: "#000000, #FFFFFF",
  });
  const [gallery, setGallery] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isCover = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!newProduct.name) {
      toast.error("Set Name First", { description: "Please enter a product name before uploading images." });
      return;
    }

    try {
      setIsUploading(true);
      const newUrls: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const path = githubService.generatePath(file.name, newProduct.name);
        const url = await githubService.uploadImage(file, path);
        newUrls.push(url);
      }

      if (isCover) {
        setNewProduct(prev => ({ ...prev, image: newUrls[0] }));
      } else {
        setGallery(prev => [...prev, ...newUrls]);
      }
      toast.success("Image Uploaded", { description: `${newUrls.length} image(s) processed by Cloud CMS.` });
    } catch (err: any) {
      toast.error("Upload Failed", { description: err.message });
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    if (isLoading || loading) return; // Wait for auth initialization
    if (!user) {
      toast.error("Unauthenticated access", { description: "Please sign in to access the admin panel." });
      navigate("/auth");
      return;
    }

    const adminEmails = [
      import.meta.env.VITE_ADMIN_EMAIL || "kumarvinay072007@gmail.com",
    ];
    if (!adminEmails.includes(user.email || "")) {
      toast.error("Access Restricted", { description: "This area is only for store administrators." });
      navigate("/");
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      try {
        if (activeTab === "products" || activeTab === "dashboard") {
          const data = await dataService.products.getAll();
          setDbProducts(data);
        }
        if (activeTab === "orders" || activeTab === "dashboard") {
          try {
            const { getDocs, collection, orderBy, query, limit } = await import("firebase/firestore");
            const { db } = await import("@/lib/firebase");
            const q = query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(50));
            const snap = await getDocs(q);
            setDbOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          } catch {
            setDbOrders([]);
          }
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, [activeTab]);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this exquisite piece from the collection?")) {
      await dataService.products.delete(id);
      setDbProducts(prev => prev.filter(p => p.id !== id));
      toast.success("Product removed from collection");
    }
  };

  const handleSaveProduct = async () => {
    try {
      setIsLoading(true);
      const productData = {
        ...newProduct,
        price: Number(newProduct.price),
        originalPrice: Number(newProduct.originalPrice) || null,
        sizes: newProduct.sizes.split(",").map(s => s.trim()),
        colors: newProduct.colors.split(",").map(c => c.trim()),
        image: newProduct.image,
        images: gallery.length > 0 ? [newProduct.image, ...gallery] : [newProduct.image],
        inStock: true,
        variants: newProduct.colors.split(",").map(c => ({
          color: "Standard",
          colorHex: c.trim(),
          sizes: newProduct.sizes.split(",").map(s => s.trim())
        }))
      };
      
      const id = newProduct.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      await dataService.products.addWithId(id, productData as any);
      
      toast.success("New masterpiece added to store!");
      setShowAddProduct(false);
      // Refresh list
      const data = await dataService.products.getAll();
      setDbProducts(data);
    } catch (err) {
      toast.error("Failed to save product");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const sidebarLinks = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "products", label: "Products", icon: ShoppingBag },
    { id: "orders", label: "Orders", icon: ClipboardList },
    { id: "customers", label: "Customers", icon: Users },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "promotions", label: "Promotions", icon: Tags },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const activeOrdersCount = dbOrders.filter(o => o.status === 'pending' || o.status === 'processing').length;
  const totalRevenue = dbOrders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const uniqueCustomers = new Set(dbOrders.map(o => o.userId)).size;

  const stats = [
    { label: "Total Revenue", value: formatPrice(totalRevenue), change: "+12%", up: true, icon: CreditCard },
    { label: "Active Orders", value: activeOrdersCount.toString(), change: "+5%", up: true, icon: ClipboardList },
    { label: "Total Customers", value: uniqueCustomers.toString(), change: "+18%", up: true, icon: Users },
    { label: "Conversion Rate", value: "2.40%", change: "-0.5%", up: false, icon: TrendingUp },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 glass-strong flex flex-col pt-20 flex-shrink-0 fixed top-0 left-0 bottom-0 z-40">
        <div className="p-6 flex-1">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Admin Panel</p>
          <nav className="space-y-1">
            {sidebarLinks.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === id ? "gradient-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </nav>
        </div>
        <div className="p-6 border-t border-border/30">
          <Link to="/" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-xl hover:bg-secondary">
            <LayoutDashboard className="w-4 h-4" /> Back to Store
          </Link>
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-xl transition-colors mt-1">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-64 p-8 pt-24 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {isLoading ? (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex justify-between items-center">
                <Skeleton className="h-10 w-48 rounded-xl" />
                <Skeleton className="h-10 w-32 rounded-xl" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(idx => (
                  <Skeleton key={idx} className="h-32 rounded-2xl" />
                ))}
              </div>
              <div className="grid lg:grid-cols-3 gap-6">
                <Skeleton className="lg:col-span-2 h-[350px] rounded-2xl" />
                <Skeleton className="h-[350px] rounded-2xl" />
              </div>
            </div>
          ) : (
            <>
          {/* Dashboard */}
          {activeTab === "dashboard" && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h1 className="font-heading text-3xl font-bold">Dashboard</h1>
                <Button onClick={() => toast.success("Analytics report requested", { description: "Download will begin shortly." })} className="gradient-primary border-0 rounded-xl">Download Report</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map(({ label, value, change, up, icon: Icon }) => (
                  <div key={label} className="glass-strong rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground"><Icon className="w-5 h-5" /></div>
                      <span className={`text-xs font-bold flex items-center gap-0.5 px-2 py-1 rounded-lg ${up ? "text-emerald-600 bg-emerald-50" : "text-red-600 bg-red-50"}`}>
                        {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />} {change}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="font-heading text-2xl font-bold">{value}</p>
                  </div>
                ))}
              </div>

              {/* Charts placeholder + Recent Orders */}
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass-strong rounded-2xl p-6 min-h-[350px]">
                  <h3 className="font-heading font-bold mb-4">Revenue Overview</h3>
                  <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Revenue chart visualization</p>
                      <p className="text-xs">Connect backend for live data</p>
                    </div>
                  </div>
                </div>
                <div className="glass-strong rounded-2xl p-6">
                  <h3 className="font-heading font-bold mb-4">Recent Orders (Live)</h3>
                  <div className="space-y-4">
                    {dbOrders.length === 0 ? (
                      <p className="text-muted-foreground text-sm text-center py-6">No recent orders found.</p>
                    ) : (
                      dbOrders.slice(0, 5).map((order) => (
                        <div key={order.id} className="flex justify-between items-center text-sm border-b border-border/30 pb-3 last:border-0 last:pb-0">
                          <div>
                            <p className="font-bold">{order.id}</p>
                            <p className="text-muted-foreground text-xs">{order.userId}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">₹{order.totalAmount}</p>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded text-primary bg-primary/10`}>{order.status}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Top Products */}
              <div className="glass-strong rounded-2xl p-6">
                <h3 className="font-heading font-bold mb-4">Top Selling Products</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {dbProducts.slice(0, 4).map((p, i) => (
                    <div key={p.id} className="flex items-center gap-3 glass-subtle rounded-xl p-3">
                      <div className="w-12 h-14 rounded-lg overflow-hidden flex-shrink-0">
                        <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs truncate">{p.name}</p>
                        <p className="text-[10px] text-primary font-bold">In Stock</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Products */}
          {activeTab === "products" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h1 className="font-heading text-3xl font-bold">Products</h1>
                <Button onClick={() => setShowAddProduct(!showAddProduct)} className="gap-2 gradient-primary border-0 rounded-xl"><Plus className="w-4 h-4" /> Add Product</Button>
              </div>

              {showAddProduct && (
                <div className="glass-strong rounded-2xl p-6 space-y-4">
                  <h3 className="font-heading font-bold text-lg">Add New Product</h3>
                  <div className="grid md:grid-cols-3 gap-6">
                    {/* Media Upload Section */}
                    <div className="md:col-span-1 space-y-4">
                      <div>
                        <label className="text-xs font-black uppercase tracking-widest mb-3 block text-primary">Cover Image</label>
                        <div className="relative group/upload h-48 rounded-2xl border-2 border-dashed border-border/50 hover:border-primary/50 transition-all bg-white/5 flex flex-col items-center justify-center cursor-pointer overflow-hidden backdrop-blur-sm">
                          {newProduct.image && !newProduct.image.includes("unsplash") ? (
                             <img src={newProduct.image} className="absolute inset-0 w-full h-full object-cover z-0" alt="Cover" />
                          ) : (
                            <div className="text-center group-hover/upload:scale-110 transition-transform duration-500">
                              <Plus className="w-8 h-8 mx-auto mb-2 text-primary/50" />
                              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover/upload:text-primary transition-colors">Drag & Drop Cover</p>
                            </div>
                          )}
                          <input type="file" onChange={(e) => handleFileUpload(e, true)} disabled={isUploading} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                          {isUploading && (
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-20">
                              <Loader2 className="w-6 h-6 text-white animate-spin" />
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-xs font-black uppercase tracking-widest mb-3 block text-primary font-heading">Gallery ({gallery.length})</label>
                        <div className="grid grid-cols-2 gap-2">
                          {gallery.map((url, i) => (
                            <div key={i} className="h-20 rounded-xl overflow-hidden relative group/item">
                              <img src={url} className="w-full h-full object-cover" alt={`Gallery ${i}`} />
                              <button 
                                onClick={() => setGallery(prev => prev.filter((_, idx) => idx !== i))}
                                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center scale-0 group-hover/item:scale-100 transition-transform"
                                >&times;</button>
                            </div>
                          ))}
                          <div className="h-20 rounded-xl border-2 border-dashed border-border/30 hover:border-primary/30 bg-white/5 flex items-center justify-center cursor-pointer group/gall transition-all relative">
                             <input type="file" multiple onChange={(e) => handleFileUpload(e)} disabled={isUploading} className="absolute inset-0 opacity-0 cursor-pointer" />
                             <Plus className="w-4 h-4 text-muted-foreground group-hover/gall:text-primary transition-colors" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Form Fields */}
                    <div className="md:col-span-2 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Product Name</label>
                          <input 
                            type="text" 
                            className="w-full h-11 px-4 glass rounded-[14px] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 border-0" 
                            placeholder="e.g. Essential Hoodie" 
                            value={newProduct.name}
                            onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Brand</label>
                          <input 
                            type="text" 
                            className="w-full h-11 px-4 glass rounded-[14px] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 border-0" 
                            placeholder="e.g. LYRA Core" 
                            value={newProduct.brand}
                            onChange={(e) => setNewProduct({...newProduct, brand: e.target.value})}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Price (₹)</label>
                          <input 
                            type="number" 
                            className="w-full h-11 px-4 glass rounded-[14px] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 border-0" 
                            placeholder="0" 
                            value={newProduct.price}
                            onChange={(e) => setNewProduct({...newProduct, price: Number(e.target.value)})}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Category</label>
                          <select 
                            className="w-full h-11 px-4 glass rounded-[14px] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 border-0"
                            value={newProduct.category}
                            onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                          >
                            <option>Men</option>
                            <option>Women</option>
                            <option>Kids</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Description</label>
                        <textarea 
                          className="w-full h-24 px-4 py-3 glass rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none border-0" 
                          placeholder="Product story and technical details..." 
                          value={newProduct.description}
                          onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Sizes</label>
                          <input 
                            type="text" 
                            className="w-full h-11 px-4 glass rounded-[14px] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 border-0" 
                            placeholder="S, M, L, XL" 
                            value={newProduct.sizes}
                            onChange={(e) => setNewProduct({...newProduct, sizes: e.target.value})}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Colors (Hex)</label>
                          <input 
                            type="text" 
                            className="w-full h-11 px-4 glass rounded-[14px] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 border-0" 
                            placeholder="#000000, #FFFFFF" 
                            value={newProduct.colors}
                            onChange={(e) => setNewProduct({...newProduct, colors: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 pt-6 border-t border-white/5">
                    <Button 
                      disabled={isLoading}
                      onClick={handleSaveProduct} 
                      className="h-12 px-8 gradient-primary border-0 rounded-xl font-bold text-sm shadow-xl hover:scale-105 active:scale-95 transition-all"
                    >
                      {isLoading ? "Saving..." : "Save Product"}
                    </Button>
                    <Button variant="outline" className="h-12 px-8 rounded-xl border-white/10 glass-subtle text-foreground hover:bg-white/10" onClick={() => setShowAddProduct(false)}>Cancel</Button>
                  </div>
                </div>
              )}

              {/* Search */}
              <div className="relative max-w-sm">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full h-11 pl-11 pr-4 glass rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="glass-strong rounded-2xl overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-secondary/50 text-muted-foreground text-xs uppercase font-bold">
                    <tr><th className="px-6 py-4">Product</th><th className="px-6 py-4">Category</th><th className="px-6 py-4">Stock</th><th className="px-6 py-4">Price</th><th className="px-6 py-4 text-right">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {dbProducts
                      .filter(p => !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.brand?.toLowerCase().includes(productSearch.toLowerCase()))
                      .map((p) => (
                      <tr key={p.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-12 rounded-lg overflow-hidden flex-shrink-0"><img src={p.image} alt="" className="w-full h-full object-cover" /></div>
                            <div><p className="font-bold">{p.name}</p><p className="text-xs text-muted-foreground">{p.brand}</p></div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">{p.category}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-lg text-xs font-bold ${p.inStock ? "text-emerald-600 bg-emerald-50" : "text-red-600 bg-red-50"}`}>
                            {p.inStock ? "In Stock" : "Out of Stock"}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium">{formatPrice(p.price)}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => toast.info(`Viewing details for ${p.name}`)} className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-primary"><Eye className="w-4 h-4" /></button>
                            <button onClick={() => toast.info(`Editing ${p.name}`)} className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-primary"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => handleDelete(p.id)} className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Orders */}
          {activeTab === "orders" && (
            <div className="space-y-6">
              <h1 className="font-heading text-3xl font-bold">Orders</h1>
              <div className="glass-strong rounded-2xl overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-secondary/50 text-muted-foreground text-xs uppercase font-bold">
                    <tr><th className="px-6 py-4">Order</th><th className="px-6 py-4">Date</th><th className="px-6 py-4">Customer</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Total</th></tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {dbOrders.length === 0 ? (
                       <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No orders in database.</td></tr>
                    ) : (
                      dbOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-secondary/30 transition-colors">
                          <td className="px-6 py-4 font-bold">{order.id}</td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {order.createdAt?.seconds
                              ? new Date(order.createdAt.seconds * 1000).toLocaleDateString()
                              : order.createdAt instanceof Date
                              ? order.createdAt.toLocaleDateString()
                              : "—"}
                          </td>
                          <td className="px-6 py-4">{order.userId}</td>
                          <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-lg text-xs font-bold bg-primary/10 text-primary`}>{order.status}</span></td>
                          <td className="px-6 py-4 text-right font-medium">₹{order.totalAmount}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Customers */}
          {activeTab === "customers" && (
            <div className="space-y-6">
              <h1 className="font-heading text-3xl font-bold">Customers</h1>
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                {[{ label: "Total Customers", value: "8,459" }, { label: "New This Month", value: "342" }, { label: "Returning Rate", value: "64%" }].map(s => (
                  <div key={s.label} className="glass-strong rounded-2xl p-5">
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                    <p className="font-heading text-2xl font-bold">{s.value}</p>
                  </div>
                ))}
              </div>
              <div className="glass-strong rounded-2xl overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-secondary/50 text-muted-foreground text-xs uppercase font-bold">
                    <tr><th className="px-6 py-4">Customer</th><th className="px-6 py-4">Email</th><th className="px-6 py-4">Orders</th><th className="px-6 py-4">Total Spent</th></tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {[{ name: "Emily Carter", email: "emily@example.com", orders: 12, spent: "₹1,24,500" }, { name: "James Smith", email: "james@example.com", orders: 8, spent: "₹89,200" }, { name: "Priya Sharma", email: "priya@example.com", orders: 5, spent: "₹45,000" }].map(c => (
                      <tr key={c.email} className="hover:bg-secondary/30 transition-colors">
                        <td className="px-6 py-4 font-bold">{c.name}</td>
                        <td className="px-6 py-4 text-muted-foreground">{c.email}</td>
                        <td className="px-6 py-4">{c.orders}</td>
                        <td className="px-6 py-4 font-medium">{c.spent}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Analytics */}
          {activeTab === "analytics" && (
            <div className="space-y-6">
              <h1 className="font-heading text-3xl font-bold">Analytics</h1>
              <div className="grid md:grid-cols-2 gap-6">
                {["Revenue by Category", "Traffic Sources", "Conversion Funnel", "Customer Demographics"].map(title => (
                  <div key={title} className="glass-strong rounded-2xl p-6 min-h-[250px]">
                    <h3 className="font-heading font-bold mb-4">{title}</h3>
                    <div className="flex items-center justify-center h-[180px] text-muted-foreground">
                      <div className="text-center">
                        <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-20" />
                        <p className="text-xs">Connect backend for live data</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Promotions */}
          {activeTab === "promotions" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h1 className="font-heading text-3xl font-bold">Promotions</h1>
                <Button onClick={() => toast.info("Promotion engine requires backend initialization")} className="gap-2 gradient-primary border-0 rounded-xl"><Plus className="w-4 h-4" /> Create Promotion</Button>
              </div>
              <div className="space-y-4">
                {[{ code: "WELCOME20", discount: "20% off", status: "Active", uses: "1,234" }, { code: "SUMMER10", discount: "₹500 off", status: "Expired", uses: "892" }].map(promo => (
                  <div key={promo.code} className="glass-strong rounded-2xl p-5 flex items-center justify-between">
                    <div>
                      <p className="font-heading font-bold text-lg">{promo.code}</p>
                      <p className="text-sm text-muted-foreground">{promo.discount} · {promo.uses} uses</p>
                    </div>
                    <span className={`px-3 py-1 rounded-xl text-xs font-bold ${promo.status === "Active" ? "text-emerald-600 bg-emerald-50" : "text-muted-foreground bg-secondary"}`}>{promo.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Settings */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <h1 className="font-heading text-3xl font-bold">Settings</h1>
              <div className="glass-strong rounded-2xl p-6 space-y-6">
                <div>
                  <h3 className="font-heading font-bold mb-4">Store Information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div><label className="text-xs font-bold uppercase tracking-wider mb-1 block">Store Name</label><input type="text" defaultValue="LYRA" className="w-full h-11 px-4 glass rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
                    <div><label className="text-xs font-bold uppercase tracking-wider mb-1 block">Support Email</label><input type="email" defaultValue="kumarvinay072007@gmail.com" className="w-full h-11 px-4 glass rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
                  </div>
                </div>
                <div>
                  <h3 className="font-heading font-bold mb-4">Database & Migration</h3>
                  <div className="p-6 border-2 border-dashed border-primary/20 rounded-2xl bg-primary/5">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <p className="font-bold text-sm">Sync Local Products to Cloud</p>
                        <p className="text-xs text-muted-foreground mt-1">Push the 20 new generated products into your Firebase database.</p>
                      </div>
                      <Button 
                        disabled={isLoading}
                        onClick={async () => {
                          setIsLoading(true);
                          try {
                            const { seedService } = await import('@/services/seedService');
                            await seedService.runMigration();
                          } catch (e) { console.error(e); }
                          setIsLoading(false);
                        }}
                        className="gradient-primary border-0 rounded-xl"
                      >
                        {isLoading ? "Migrating..." : "Sync Store to Firestore"}
                      </Button>
                    </div>
                  </div>
                </div>
                <Button onClick={() => toast.success("Settings saved globally")} className="gradient-primary border-0 rounded-xl">Save Changes</Button>
              </div>
            </div>
          )}
          </>
          )}
        </div>
      </main>
    </div>
  );
}
