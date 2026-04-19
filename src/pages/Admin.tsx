import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, ShoppingBag, ClipboardList, Users, BarChart3, Tags, Settings, LogOut, 
  Plus, Search, Edit2, Trash2, Eye, Package, Loader2, Rocket, RefreshCw, Check, X, 
  TrendingUp, CreditCard, ArrowUpRight, ChevronDown, ToggleLeft, ToggleRight, Upload,
  ShieldCheck, AlertCircle, Terminal, Cloud, Database, Hammer, Wrench, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/data/products";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { dataService, Product as FirestoreProduct, Order, UserProfile, Promotion } from "@/services/dataService";
import { isUserAdmin } from "@/lib/constants";
import { githubService } from "@/services/githubService";
import { products as staticProducts } from "@/data/products";
import { API_ROUTES, csrfToken } from "@/lib/api-config";
import { withRetry } from "@/lib/utils";

// ─── TYPES ────────────────────────────────────
interface EditingProduct extends Partial<FirestoreProduct> { _isNew?: boolean; }

// ─── MAIN COMPONENT ──────────────────────────
export default function Admin() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();

  // Data states
  const [dbProducts, setDbProducts] = useState<FirestoreProduct[]>([]);
  const [dbOrders, setDbOrders] = useState<Order[]>([]);
  const [dbUsers, setDbUsers] = useState<UserProfile[]>([]);
  const [dbPromos, setDbPromos] = useState<Promotion[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [orderFilter, setOrderFilter] = useState("all");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Edit states
  const [editingProduct, setEditingProduct] = useState<EditingProduct | null>(null);
  const [gallery, setGallery] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [newPromo, setNewPromo] = useState({ code: "", discountPercent: 0, discountFlat: 0, maxUses: 100, active: true, expiresAt: "" });
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [storeSettings, setStoreSettings] = useState({ storeName: "LYRA", supportEmail: "" });
  const [dbProductCount, setDbProductCount] = useState(0);
  const [isDeploying, setIsDeploying] = useState(false);
  const [diagResults, setDiagResults] = useState<any>(null);
  const [isCheckingDiag, setIsCheckingDiag] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isMaintenanceRunning, setIsMaintenanceRunning] = useState(false);

  // Auth guard - WARNING: Client-side only, bypassable. 
  // TODO: Implement Firebase Security Rules or server-side admin verification
  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/auth"); return; }
    if (!isUserAdmin(user.email)) {
      console.warn("Admin access denied - client side check only");
      toast.error("Access Restricted"); navigate("/");
    }
  }, [user, loading, navigate]);

  // Real-time subscriptions
  useEffect(() => {
    if (loading || !user) return;
    
    const unsubProducts = dataService.products.subscribe(setDbProducts);
    const unsubOrders = dataService.orders.subscribe(setDbOrders);
    const unsubUsers = dataService.users.subscribe(setDbUsers);
    
    // Promotions still use fetch on tab change for now, or we could subscribe too
    if (activeTab === "promotions") {
      dataService.promotions.getAll().then(setDbPromos);
    }
    
    if (activeTab === "settings") {
      dataService.settings.get().then(setStoreSettings as any);
    }

    return () => {
      unsubProducts();
      unsubOrders();
      unsubUsers();
    };
  }, [user, loading, activeTab]);

  // Data fetcher for manual refresh and initial load
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [products, orders, users, fsCount] = await Promise.all([
        withRetry(() => dataService.products.getAll(), 3, 500),
        withRetry(() => dataService.orders.getAll(), 2, 500),
        withRetry(() => dataService.users.getAll(), 2, 500),
        withRetry(() => dataService.products.count(), 2, 500)
      ]);
      setDbProducts(products);
      setDbOrders(orders);
      setDbUsers(users);
      setDbProductCount(fsCount);

      if (activeTab === "promotions") {
        const promos = await dataService.promotions.getAll();
        setDbPromos(promos);
      }
      if (activeTab === "settings") {
        const cfg = await dataService.settings.get();
        setStoreSettings(cfg as any);
      }
      if (activeTab === "diagnostics") {
        await runDiagnostics();
      }
    } catch (err) { console.error("Admin fetch error:", err); }
    finally { setIsLoading(false); }
  }, [activeTab]);

  // ─── PRODUCT HANDLERS ──────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isCover = false) => {
    const files = e.target.files;
    if (!files || !files.length) return;
    if (!editingProduct?.name) { toast.error("Set product name first"); return; }
    setIsUploading(true);
    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const path = githubService.generatePath(files[i].name, editingProduct.name);
        const url = await githubService.uploadImage(files[i], path);
        urls.push(url);
      }
      if (isCover) setEditingProduct(prev => prev ? { ...prev, image: urls[0] } : null);
      else setGallery(prev => [...prev, ...urls]);
      toast.success(`${urls.length} image(s) uploaded`);
    } catch (err: any) { toast.error("Upload failed: " + err.message); }
    finally { setIsUploading(false); }
  };

  const openNewProduct = () => {
    setEditingProduct({
      _isNew: true, name: "", brand: "LYRA", price: 0, originalPrice: 0,
      category: "Men", subCategory: "", description: "", material: "", careInstructions: "",
      image: "", inStock: true, isNew: true, isBestseller: false,
      variants: [{ color: "Standard", colorHex: "#000000", sizes: ["S","M","L","XL"], stock: 10 }],
      ecoLabels: []
    });
    setGallery([]);
  };

  const openEditProduct = (p: FirestoreProduct) => {
    setEditingProduct({ ...p, _isNew: false });
    setGallery(p.images?.slice(1) || []);
  };

  const handleSaveProduct = async () => {
    if (!editingProduct?.name || !editingProduct.price) { toast.error("Name and Price required"); return; }
    setIsLoading(true);
    try {
      const data: any = { ...editingProduct };
      delete data._isNew; delete data.id;
      data.images = data.image ? [data.image, ...gallery] : gallery;
      data.price = Number(data.price);
      data.originalPrice = Number(data.originalPrice) || null;

      if (editingProduct._isNew) {
        const id = editingProduct.name!.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/,'');
        await dataService.products.addWithId(id, data);
        toast.success("Product created!");
      } else {
        await dataService.products.update(editingProduct.id!, data);
        toast.success("Product updated!");
      }
      setEditingProduct(null);
    } catch (err: any) { toast.error(err.message); }
    finally { setIsLoading(false); }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}" permanently?`)) return;
    await dataService.products.delete(id);
    setDbProducts(prev => prev.filter(p => p.id !== id));
    toast.success("Product removed");
  };

  const handleToggleStock = async (id: string, current: boolean) => {
    await dataService.products.update(id, { inStock: !current });
    setDbProducts(prev => prev.map(p => p.id === id ? { ...p, inStock: !current } : p));
    toast.success(!current ? "Marked in stock" : "Marked out of stock");
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedProductIds.length} products permanently?`)) return;
    setIsLoading(true);
    try {
      await Promise.all(selectedProductIds.map(id => dataService.products.delete(id)));
      setDbProducts(prev => prev.filter(p => !selectedProductIds.includes(p.id)));
      setSelectedProductIds([]);
      toast.success("Bulk deletion successful");
    } catch (err: any) { toast.error("Bulk delete failed: " + err.message); }
    finally { setIsLoading(false); }
  };

  const handleBulkStock = async (inStock: boolean) => {
    setIsLoading(true);
    try {
      await Promise.all(selectedProductIds.map(id => dataService.products.update(id, { inStock })));
      setDbProducts(prev => prev.map(p => selectedProductIds.includes(p.id) ? { ...p, inStock } : p));
      setSelectedProductIds([]);
      toast.success(`Bulk updated ${selectedProductIds.length} products`);
    } catch (err: any) { toast.error("Bulk update failed: " + err.message); }
    finally { setIsLoading(false); }
  };

  // ─── ORDER HANDLERS ────────────────────────
  const handleOrderStatus = async (orderId: string, status: string) => {
    await dataService.orders.updateStatus(orderId, status);
    const order = dbOrders.find(o => o.id === orderId);
    
    if (status === "shipped" && order?.trackingNumber && order?.shippingAddress?.email) {
      fetch(API_ROUTES.SHIPPING_EMAIL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
           email: order.shippingAddress.email,
           orderId: orderId,
           trackingNumber: order.trackingNumber
        })
      }).catch(err => console.warn("Shipping email failed:", err));
      toast.success(`Order → ${status} & Email Sent`);
    } else {
      toast.success(`Order → ${status}`);
    }
    
    setDbOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: status as any } : o));
  };

  const handleSaveTracking = async (orderId: string, tracking: string) => {
    await dataService.orders.updateTracking(orderId, tracking);
    const order = dbOrders.find(o => o.id === orderId);
    
    if (order?.status === "shipped" && order?.shippingAddress?.email) {
      fetch(API_ROUTES.SHIPPING_EMAIL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
           email: order.shippingAddress.email,
           orderId: orderId,
           trackingNumber: tracking
        })
      }).catch(err => console.warn("Shipping email failed:", err));
      toast.success("Tracking saved & Email sent");
    } else {
      toast.success("Tracking saved");
    }
  };

  // ─── PROMO HANDLERS ────────────────────────
  const handleCreatePromo = async () => {
    if (!newPromo.code) { toast.error("Code is required"); return; }
    await dataService.promotions.create({ ...newPromo, usedCount: 0, expiresAt: newPromo.expiresAt || null } as any);
    toast.success("Promo created"); setShowPromoForm(false);
    setNewPromo({ code: "", discountPercent: 0, discountFlat: 0, maxUses: 100, active: true, expiresAt: "" });
  };

  // ─── DEPLOY HANDLER ─────────────────────────
  const handleDeploy = async () => {
    if (!confirm("Deploy all static products to Firestore? This will merge with existing data.")) return;
    setIsDeploying(true);
    try {
      let count = 0;
      for (const p of staticProducts) {
        const { id, ...data } = p as any;
        await dataService.products.addWithId(id, data);
        count++;
      }
      toast.success(`Deployed ${count} products to store!`);
    } catch (err: any) { toast.error(err.message); }
    finally { setIsDeploying(false); }
  };

  const handleSignOut = async () => { await signOut(); navigate("/auth"); };

  const runDiagnostics = async () => {
    setIsCheckingDiag(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch(API_ROUTES.DIAGNOSTICS, {
        headers: { 
          "Authorization": `Bearer ${token}`,
          "x-csrf-token": csrfToken
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Diagnostics failed");
      setDiagResults(data);
      toast.success("Systems check complete");
    } catch (err: any) {
      toast.error("Diagnostic failure", { description: err.message });
      setDiagResults(null);
    } finally {
      setIsCheckingDiag(false);
    }
  };

  const handleMaintenance = async (action: string) => {
    if (!confirm(`Are you sure you want to run: ${action.replace('_', ' ')}? This action is permanent.`)) return;
    setIsMaintenanceRunning(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch(API_ROUTES.MAINTENANCE, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "x-csrf-token": csrfToken
        },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success(data.message || "Action successful");
      await fetchData();
    } catch (err: any) {
      toast.error("Maintenance Error", { description: err.message });
    } finally {
      setIsMaintenanceRunning(false);
    }
  };

  // ─── COMPUTED ───────────────────────────────
  const activeOrders = dbOrders.filter(o => o.status === 'pending' || o.status === 'processing');
  const totalRevenue = dbOrders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.totalAmount || 0), 0);
  const uniqueCustomers = new Set(dbOrders.map(o => o.userId)).size;
  const filteredOrders = orderFilter === "all" ? dbOrders : dbOrders.filter(o => o.status === orderFilter);

  const statusColors: Record<string, string> = {
    pending: "text-yellow-700 bg-yellow-100", processing: "text-blue-700 bg-blue-100",
    shipped: "text-purple-700 bg-purple-100", delivered: "text-emerald-700 bg-emerald-100",
    cancelled: "text-red-700 bg-red-100"
  };

  const formatDate = (ts: any) => {
    if (!ts) return "—";
    // Handle Firestore Timestamp, structured JSON (_seconds), or JS Date
    const seconds = ts.seconds || ts._seconds;
    const d = seconds ? new Date(seconds * 1000) : (ts instanceof Date ? ts : (typeof ts === 'string' ? new Date(ts) : null));
    return d && !isNaN(d.getTime()) ? d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
  };

  // Revenue by category for analytics
  const revByCategory: Record<string, number> = {};
  dbOrders.forEach(o => { if (o.items) o.items.forEach((item: any) => { revByCategory[item.category || "Other"] = (revByCategory[item.category || "Other"] || 0) + (item.price || 0) * (item.quantity || 1); }); });
  const maxCatRev = Math.max(...Object.values(revByCategory), 1);

  // ─── SIDEBAR ────────────────────────────────
  const sidebarLinks = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "products", label: "Products", icon: ShoppingBag },
    { id: "orders", label: "Orders", icon: ClipboardList },
    { id: "customers", label: "Customers", icon: Users },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "promotions", label: "Promotions", icon: Tags },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "diagnostics", label: "Diagnostics", icon: ShieldCheck },
    { id: "maintenance", label: "Maintenance", icon: Hammer },
    { id: "deploy", label: "Deploy / DB", icon: Rocket },
  ];

  // ═══════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════
  return (
    <div className="flex min-h-screen">
      {/* Mobile Sidebar Toggle - Positioned better relative to Navbar */}
      <div className="lg:hidden fixed bottom-24 right-6 z-50">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="w-14 h-14 rounded-full shadow-2xl bg-primary text-primary-foreground border-0 hover:bg-primary/90"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <LayoutDashboard className="w-6 h-6" />}
        </Button>
      </div>

      {/* Sidebar - Responsive */}
      <aside className={`
        fixed top-0 left-0 bottom-0 z-40 w-64 glass-strong flex flex-col pt-20 transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <div className="p-6 flex-1 overflow-y-auto">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Admin Panel</p>
          <nav className="space-y-1">
            {sidebarLinks.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => { setActiveTab(id); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === id ? "gradient-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}>
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </nav>
        </div>
        <div className="p-6 border-t border-border/30">
          <Link to="/" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-xl hover:bg-secondary">
            <LayoutDashboard className="w-4 h-4" /> Back to Store
          </Link>
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-xl mt-1">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Main */}
      <main className="flex-1 w-full lg:ml-64 p-4 md:p-8 pt-24 overflow-y-auto min-h-screen">
        <div className="max-w-6xl mx-auto">
          {isLoading && !editingProduct ? (
            <div className="space-y-8">
              <Skeleton className="h-10 w-48 rounded-xl" />
              <div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>
              <Skeleton className="h-[350px] rounded-2xl" />
            </div>
          ) : (
            <>

          {/* ── DASHBOARD ──────────────────────── */}
          {activeTab === "dashboard" && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h1 className="font-heading text-3xl font-bold">Dashboard</h1>
                <Button onClick={fetchData} variant="outline" className="gap-2 rounded-xl"><RefreshCw className="w-4 h-4" /> Refresh</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Total Revenue", value: formatPrice(totalRevenue), icon: CreditCard },
                  { label: "Active Orders", value: activeOrders.length.toString(), icon: ClipboardList },
                  { label: "Products", value: dbProducts.length.toString(), icon: ShoppingBag },
                  { label: "Customers", value: uniqueCustomers.toString(), icon: Users },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="glass-strong rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground"><Icon className="w-5 h-5" /></div>
                    </div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="font-heading text-2xl font-bold">{value}</p>
                  </div>
                ))}
              </div>
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass-strong rounded-2xl p-6">
                  <h3 className="font-heading font-bold mb-4">Recent Orders</h3>
                  <div className="space-y-3">
                    {dbOrders.length === 0 ? <p className="text-muted-foreground text-sm text-center py-6">No orders yet. Products need to be deployed first.</p> :
                      dbOrders.slice(0, 8).map(order => (
                        <div key={order.id} className="flex justify-between items-center text-sm border-b border-border/20 pb-3 last:border-0">
                          <div><p className="font-bold truncate max-w-[180px]">{order.id}</p><p className="text-muted-foreground text-xs">{formatDate(order.createdAt)}</p></div>
                          <div className="text-right"><p className="font-medium">{formatPrice(order.totalAmount)}</p>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${statusColors[order.status] || "bg-secondary"}`}>{order.status}</span>
                          </div>
                        </div>
                    ))}
                  </div>
                </div>
                <div className="glass-strong rounded-2xl p-6">
                  <h3 className="font-heading font-bold mb-4">Top Products</h3>
                  <div className="space-y-3">
                    {dbProducts.slice(0, 5).map(p => (
                      <div key={p.id} className="flex items-center gap-3">
                        <div className="w-10 h-12 rounded-lg overflow-hidden flex-shrink-0"><img src={p.image} alt="" className="w-full h-full object-cover" /></div>
                        <div className="min-w-0"><p className="font-bold text-xs truncate">{p.name}</p><p className="text-[10px] text-primary font-bold">{formatPrice(p.price)}</p></div>
                      </div>
                    ))}
                    {dbProducts.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">No products. Go to Deploy tab.</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── PRODUCTS ───────────────────────── */}
          {activeTab === "products" && !editingProduct && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h1 className="font-heading text-3xl font-bold">Products ({dbProducts.length})</h1>
                <Button onClick={openNewProduct} className="gap-2 gradient-primary border-0 rounded-xl"><Plus className="w-4 h-4" /> Add Product</Button>
              </div>
              <div className="relative max-w-sm">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="text" placeholder="Search products..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full h-11 pl-11 pr-4 glass rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div className="flex justify-between items-center bg-secondary/20 p-4 rounded-xl border border-border/10 empty:hidden">
                {selectedProductIds.length > 0 && (
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-primary">{selectedProductIds.length} selected</span>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest"
                      onClick={handleBulkDelete}
                    >
                      Delete Selected
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest glass"
                      onClick={() => handleBulkStock(true)}
                    >
                      Set In Stock
                    </Button>
                  </div>
                )}
              </div>

              {dbProducts.length === 0 ? (
                <div className="text-center py-20 glass-strong rounded-3xl border border-border/10">
                  <Package className="w-16 h-16 mx-auto mb-4 text-primary opacity-20" />
                  <p className="text-xl font-bold mb-2">No products found</p>
                  <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto">Your store catalog is empty. You can add products manually or deploy the initial collection.</p>
                  <div className="flex justify-center gap-4">
                    <Button onClick={openNewProduct} className="gradient-primary border-0 rounded-xl h-12 px-6">Add Manually</Button>
                    <Button variant="outline" onClick={() => setActiveTab("deploy")} className="glass rounded-xl h-12 px-6">Go to Deploy</Button>
                  </div>
                </div>
              ) : (
                <div className="glass-strong rounded-2xl overflow-hidden border border-border/10 shadow-sm">
                  <div className="overflow-x-auto scrollbar-hide">
                    <table className="w-full text-sm text-left border-collapse min-w-[800px]">
                      <thead className="bg-secondary/50 text-muted-foreground text-[10px] uppercase font-black tracking-widest border-b border-border/10">
                        <tr>
                          <th className="px-6 py-4 w-10">
                            <input 
                              type="checkbox" 
                              checked={selectedProductIds.length === dbProducts.length && dbProducts.length > 0}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedProductIds(dbProducts.map(p => p.id));
                                else setSelectedProductIds([]);
                              }}
                              className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                            />
                          </th>
                          <th className="px-6 py-4">Product</th>
                          <th className="px-6 py-4">Category</th>
                          <th className="px-6 py-4">Stock</th>
                          <th className="px-6 py-4">Price</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/10">
                        {dbProducts.filter(p => !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.brand?.toLowerCase().includes(productSearch.toLowerCase()))
                          .map(p => (
                          <tr key={p.id} className="group hover:bg-secondary/20 transition-colors">
                            <td className="px-6 py-4">
                              <input 
                                type="checkbox" 
                                checked={selectedProductIds.includes(p.id)}
                                onChange={() => {
                                  setSelectedProductIds(prev => 
                                    prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id]
                                  );
                                }}
                                className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-muted border border-border/10">
                                  <img src={p.image} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold truncate max-w-[200px]">{p.name}</p>
                                  <p className="text-[10px] text-muted-foreground font-medium">{p.brand}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-muted-foreground font-medium">{p.category}</td>
                            <td className="px-6 py-4">
                              <button 
                                onClick={() => handleToggleStock(p.id, p.inStock)} 
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${
                                  p.inStock 
                                    ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20" 
                                    : "bg-destructive/10 text-destructive hover:bg-destructive/20"
                                }`}
                              >
                                {p.inStock ? "Live" : "Sold Out"}
                              </button>
                            </td>
                            <td className="px-6 py-4 font-black">{formatPrice(p.price)}</td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button onClick={() => openEditProduct(p)} className="p-2 rounded-xl hover:bg-primary/10 text-primary transition-all active:scale-95"><Edit2 className="w-4 h-4" /></button>
                                <button onClick={() => handleDeleteProduct(p.id, p.name)} className="p-2 rounded-xl hover:bg-destructive/10 text-destructive transition-all active:scale-95"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── PRODUCT FORM (Add/Edit) ────────── */}
          {activeTab === "products" && editingProduct && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="font-heading text-3xl font-bold">{editingProduct._isNew ? "New Product" : `Editing: ${editingProduct.name}`}</h1>
                <Button variant="ghost" onClick={() => setEditingProduct(null)}><X className="w-5 h-5" /></Button>
              </div>
              <div className="glass-strong rounded-2xl p-6 space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Images Col */}
                  <div className="space-y-4">
                    <label className="text-xs font-black uppercase tracking-widest text-primary block">Cover Image</label>
                    <div className="relative h-48 rounded-2xl border-2 border-dashed border-border/50 hover:border-primary/50 transition-all bg-white/5 flex items-center justify-center overflow-hidden">
                      {editingProduct.image ? <img src={editingProduct.image} className="absolute inset-0 w-full h-full object-cover" alt="Cover" /> :
                        <div className="text-center"><Upload className="w-8 h-8 mx-auto mb-2 text-primary/50" /><p className="text-[10px] font-bold uppercase text-muted-foreground">Upload Cover</p></div>}
                      <input type="file" onChange={e => handleFileUpload(e, true)} disabled={isUploading} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                      {isUploading && <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20"><Loader2 className="w-6 h-6 text-white animate-spin" /></div>}
                    </div>
                    <label className="text-xs font-black uppercase tracking-widest text-primary block">Gallery ({gallery.length})</label>
                    <div className="grid grid-cols-2 gap-2">
                      {gallery.map((url, i) => (
                        <div key={i} className="h-20 rounded-xl overflow-hidden relative group">
                          <img src={url} className="w-full h-full object-cover" alt="" />
                          <button onClick={() => setGallery(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center scale-0 group-hover:scale-100 transition-transform">&times;</button>
                        </div>
                      ))}
                      <div className="h-20 rounded-xl border-2 border-dashed border-border/30 hover:border-primary/30 bg-white/5 flex items-center justify-center relative">
                        <input type="file" multiple onChange={e => handleFileUpload(e)} disabled={isUploading} className="absolute inset-0 opacity-0 cursor-pointer" />
                        <Plus className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                  {/* Form Fields */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: "Product Name", key: "name", type: "text", placeholder: "Essential Hoodie" },
                        { label: "Brand", key: "brand", type: "text", placeholder: "LYRA" },
                        { label: "Price (₹)", key: "price", type: "number", placeholder: "0" },
                        { label: "Original Price (₹)", key: "originalPrice", type: "number", placeholder: "0" },
                      ].map(f => (
                        <div key={f.key} className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">{f.label}</label>
                          <input type={f.type} placeholder={f.placeholder} value={(editingProduct as any)[f.key] || ""} onChange={e => setEditingProduct(prev => prev ? { ...prev, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value } : null)}
                            className="w-full h-11 px-4 glass rounded-[14px] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 border-0" />
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Category</label>
                        <select value={editingProduct.category || "Men"} onChange={e => setEditingProduct(prev => prev ? { ...prev, category: e.target.value } : null)}
                          className="w-full h-11 px-4 glass rounded-[14px] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 border-0">
                          <option>Men</option><option>Women</option><option>Kids</option><option>Accessories</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Sub Category</label>
                        <input type="text" placeholder="e.g. Outerwear" value={editingProduct.subCategory || ""} onChange={e => setEditingProduct(prev => prev ? { ...prev, subCategory: e.target.value } : null)}
                          className="w-full h-11 px-4 glass rounded-[14px] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 border-0" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Description</label>
                      <textarea placeholder="Product story..." value={editingProduct.description || ""} onChange={e => setEditingProduct(prev => prev ? { ...prev, description: e.target.value } : null)}
                        className="w-full h-24 px-4 py-3 glass rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none border-0" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Material</label>
                        <input type="text" placeholder="e.g. 100% Cotton" value={editingProduct.material || ""} onChange={e => setEditingProduct(prev => prev ? { ...prev, material: e.target.value } : null)}
                          className="w-full h-11 px-4 glass rounded-[14px] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 border-0" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Care Instructions</label>
                        <input type="text" placeholder="e.g. Dry clean only" value={editingProduct.careInstructions || ""} onChange={e => setEditingProduct(prev => prev ? { ...prev, careInstructions: e.target.value } : null)}
                          className="w-full h-11 px-4 glass rounded-[14px] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 border-0" />
                      </div>
                    </div>
                    <div className="flex gap-6 pt-2">
                      {[
                        { label: "New Arrival", key: "isNew" },
                        { label: "Bestseller", key: "isBestseller" },
                        { label: "In Stock", key: "inStock" },
                      ].map(toggle => (
                        <button key={toggle.key} onClick={() => setEditingProduct(prev => prev ? { ...prev, [toggle.key]: !(prev as any)[toggle.key] } : null)}
                          className={`flex items-center gap-2 text-sm font-bold transition-colors ${(editingProduct as any)[toggle.key] ? "text-primary" : "text-muted-foreground"}`}>
                          {(editingProduct as any)[toggle.key] ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />} {toggle.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 pt-4 border-t border-white/5">
                  <Button disabled={isLoading} onClick={async () => {
                    await handleSaveProduct();
                    setActiveTab("products");
                  }} className="h-12 px-8 gradient-primary border-0 rounded-xl font-bold shadow-xl">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-2" /> Save Product</>}
                  </Button>
                  <Button variant="outline" className="h-12 px-8 rounded-xl glass-subtle" onClick={() => setEditingProduct(null)}>Cancel</Button>
                </div>
              </div>
            </div>
          )}

          {/* ── ORDERS ─────────────────────────── */}
          {activeTab === "orders" && (
            <div className="space-y-6">
              <h1 className="font-heading text-3xl font-bold">Orders ({dbOrders.length})</h1>
              <div className="flex gap-2 flex-wrap">
                {["all","pending","processing","shipped","delivered","cancelled"].map(s => (
                  <button key={s} onClick={() => setOrderFilter(s)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all capitalize ${orderFilter === s ? "gradient-primary text-primary-foreground shadow-md" : "glass hover:bg-secondary"}`}>
                    {s} {s !== "all" && `(${dbOrders.filter(o => o.status === s).length})`}
                  </button>
                ))}
              </div>
              {filteredOrders.length === 0 ? (
                <div className="text-center py-16 glass-strong rounded-2xl"><p className="text-muted-foreground">No orders found.</p></div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map(order => (
                    <div key={order.id} className="glass-strong rounded-2xl p-5">
                      <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                        <div>
                          <p className="font-heading font-bold text-sm">{order.id}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)} · {order.userId?.slice(0, 12)}...</p>
                        </div>
                        <p className="font-heading font-bold text-lg">{formatPrice(order.totalAmount)}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <select value={order.status} onChange={e => handleOrderStatus(order.id, e.target.value)}
                          className="h-9 px-3 glass rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/30">
                          {["pending","processing","shipped","delivered","cancelled"].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <input type="text" placeholder="Tracking #..." defaultValue={order.trackingNumber || ""} onBlur={e => e.target.value && handleSaveTracking(order.id, e.target.value)}
                          className="h-9 px-3 glass rounded-lg text-xs font-medium flex-1 min-w-[150px] focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${statusColors[order.status] || "bg-secondary"}`}>{order.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── CUSTOMERS ──────────────────────── */}
          {activeTab === "customers" && (
            <div className="space-y-6">
              <h1 className="font-heading text-3xl font-bold">Customers ({dbUsers.length})</h1>
              {dbUsers.length === 0 ? (
                <div className="text-center py-16 glass-strong rounded-2xl"><p className="text-muted-foreground">No users found in database.</p></div>
              ) : (
                <div className="glass-strong rounded-2xl overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-secondary/50 text-muted-foreground text-xs uppercase font-bold">
                      <tr><th className="px-6 py-4">Customer</th><th className="px-6 py-4">Email</th><th className="px-6 py-4">Role</th><th className="px-6 py-4">Joined</th></tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {dbUsers.map(u => (
                        <tr key={u.uid} className="hover:bg-secondary/30 whitespace-nowrap lg:whitespace-normal">
                          <td className="px-6 py-4"><div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary flex-shrink-0">{u.displayName?.[0] || 'U'}</div>
                            <span className="font-bold">{u.displayName || "Anonymous"}</span>
                          </div></td>
                          <td className="px-6 py-4 text-muted-foreground">{u.email || "—"}</td>
                          <td className="px-6 py-4">
                            <select value={u.role || "user"} onChange={e => { dataService.users.updateRole(u.uid, e.target.value as any); setDbUsers(prev => prev.map(x => x.uid === u.uid ? { ...x, role: e.target.value as any } : x)); toast.success("Role updated"); }}
                              className="h-8 px-2 glass rounded-lg text-xs font-bold focus:outline-none">
                              <option value="user">User</option><option value="vip">VIP</option><option value="admin">Admin</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">{u.createdAt ? formatDate(u.createdAt) : "Recently"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── ANALYTICS ──────────────────────── */}
          {activeTab === "analytics" && (
            <div className="space-y-6">
              <h1 className="font-heading text-3xl font-bold">Analytics</h1>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="glass-strong rounded-2xl p-6">
                  <h3 className="font-heading font-bold mb-6">Revenue by Category</h3>
                  {Object.keys(revByCategory).length === 0 ? <p className="text-muted-foreground text-sm text-center py-8">No order data yet.</p> :
                    <div className="space-y-4">
                      {Object.entries(revByCategory).sort(([,a],[,b]) => b - a).map(([cat, val]) => (
                        <div key={cat}>
                          <div className="flex justify-between text-sm mb-1"><span className="font-bold">{cat}</span><span className="text-muted-foreground">{formatPrice(val)}</span></div>
                          <div className="h-3 bg-white/5 rounded-full overflow-hidden"><div className="h-full gradient-primary rounded-full transition-all duration-700" style={{ width: `${(val / maxCatRev) * 100}%` }} /></div>
                        </div>
                      ))}
                    </div>
                  }
                </div>
                <div className="glass-strong rounded-2xl p-6">
                  <h3 className="font-heading font-bold mb-6">Order Status Distribution</h3>
                  {dbOrders.length === 0 ? <p className="text-muted-foreground text-sm text-center py-8">No orders yet.</p> : (
                    <div className="space-y-3">
                      {["pending","processing","shipped","delivered","cancelled"].map(s => {
                        const count = dbOrders.filter(o => o.status === s).length;
                        const pct = Math.round((count / dbOrders.length) * 100);
                        return (
                          <div key={s} className="flex items-center gap-3">
                            <span className={`w-20 text-xs font-bold capitalize ${statusColors[s]?.split(' ')[0] || ""}`}>{s}</span>
                            <div className="flex-1 h-2.5 bg-white/5 rounded-full overflow-hidden"><div className="h-full gradient-primary rounded-full" style={{ width: `${pct}%` }} /></div>
                            <span className="text-xs font-bold w-12 text-right">{count} ({pct}%)</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              <div className="glass-strong rounded-2xl p-6">
                <h3 className="font-heading font-bold mb-4">Activity Feed</h3>
                <div className="space-y-3">
                  {dbOrders.slice(0, 6).map(o => (
                    <div key={o.id} className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full gradient-primary flex-shrink-0" />
                      <p className="text-muted-foreground"><strong className="text-foreground">{formatPrice(o.totalAmount)}</strong> order <span className={`font-bold ${statusColors[o.status]?.split(' ')[0]}`}>{o.status}</span> · {formatDate(o.createdAt)}</p>
                    </div>
                  ))}
                  {dbOrders.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">No activity yet.</p>}
                </div>
              </div>
            </div>
          )}

          {/* ── PROMOTIONS ─────────────────────── */}
          {activeTab === "promotions" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h1 className="font-heading text-3xl font-bold">Promotions</h1>
                <Button onClick={() => setShowPromoForm(!showPromoForm)} className="gap-2 gradient-primary border-0 rounded-xl"><Plus className="w-4 h-4" /> Create Promo</Button>
              </div>
              {showPromoForm && (
                <div className="glass-strong rounded-2xl p-6 space-y-4">
                  <h3 className="font-heading font-bold">New Promo Code</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-muted-foreground">Code</label>
                      <input type="text" placeholder="WELCOME20" value={newPromo.code} onChange={e => setNewPromo(p => ({ ...p, code: e.target.value.toUpperCase() }))} className="w-full h-11 px-4 glass rounded-[14px] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 border-0 font-mono" /></div>
                    <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-muted-foreground">Discount %</label>
                      <input type="number" placeholder="20" value={newPromo.discountPercent} onChange={e => setNewPromo(p => ({ ...p, discountPercent: Number(e.target.value) }))} className="w-full h-11 px-4 glass rounded-[14px] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 border-0" /></div>
                    <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-muted-foreground">Flat ₹ Off</label>
                      <input type="number" placeholder="500" value={newPromo.discountFlat} onChange={e => setNewPromo(p => ({ ...p, discountFlat: Number(e.target.value) }))} className="w-full h-11 px-4 glass rounded-[14px] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 border-0" /></div>
                    <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-muted-foreground">Max Uses</label>
                      <input type="number" placeholder="100" value={newPromo.maxUses} onChange={e => setNewPromo(p => ({ ...p, maxUses: Number(e.target.value) }))} className="w-full h-11 px-4 glass rounded-[14px] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 border-0" /></div>
                  </div>
                  <div className="flex gap-4">
                    <Button onClick={handleCreatePromo} className="gradient-primary border-0 rounded-xl"><Check className="w-4 h-4 mr-2" /> Save</Button>
                    <Button variant="outline" className="rounded-xl glass-subtle" onClick={() => setShowPromoForm(false)}>Cancel</Button>
                  </div>
                </div>
              )}
              <div className="space-y-4">
                {dbPromos.length === 0 ? <div className="text-center py-16 glass-strong rounded-2xl"><p className="text-muted-foreground">No promotions yet.</p></div> :
                  dbPromos.map(promo => (
                    <div key={promo.id} className="glass-strong rounded-2xl p-5 flex items-center justify-between">
                      <div>
                        <p className="font-heading font-bold text-lg font-mono">{promo.code}</p>
                        <p className="text-sm text-muted-foreground">
                          {promo.discountPercent > 0 ? `${promo.discountPercent}% off` : `₹${promo.discountFlat} off`} · {promo.usedCount || 0}/{promo.maxUses} uses
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={async () => { await dataService.promotions.toggle(promo.id, !promo.active); setDbPromos(prev => prev.map(p => p.id === promo.id ? { ...p, active: !p.active } : p)); }}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors ${promo.active ? "text-emerald-600 bg-emerald-50" : "text-muted-foreground bg-secondary"}`}>
                          {promo.active ? "Active" : "Inactive"}
                        </button>
                        <button onClick={async () => { if (confirm("Delete this promo?")) { await dataService.promotions.delete(promo.id); setDbPromos(prev => prev.filter(p => p.id !== promo.id)); toast.success("Promo deleted"); }}}
                          className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          )}

          {/* ── SETTINGS ───────────────────────── */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <h1 className="font-heading text-3xl font-bold">Settings</h1>
              <div className="glass-strong rounded-2xl p-6 space-y-6">
                <h3 className="font-heading font-bold">Store Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div><label className="text-xs font-bold uppercase tracking-wider mb-1 block">Store Name</label>
                    <input type="text" value={storeSettings.storeName} onChange={e => setStoreSettings(p => ({ ...p, storeName: e.target.value }))} className="w-full h-11 px-4 glass rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
                  <div><label className="text-xs font-bold uppercase tracking-wider mb-1 block">Support Email</label>
                    <input type="email" value={storeSettings.supportEmail} onChange={e => setStoreSettings(p => ({ ...p, supportEmail: e.target.value }))} className="w-full h-11 px-4 glass rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
                </div>
                <Button disabled={isLoading} onClick={async () => { 
                  setIsLoading(true);
                  try {
                    await dataService.settings.update(storeSettings); 
                    toast.success("Settings saved"); 
                  } catch (err) {
                    toast.error("Failed to save settings");
                  } finally {
                    setIsLoading(false);
                  }
                }} className="h-12 px-8 gradient-primary border-0 rounded-xl font-bold">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                </Button>
              </div>
            </div>
          )}

          {/* ── DIAGNOSTICS ────────────────────── */}
          {activeTab === "diagnostics" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h1 className="font-heading text-3xl font-bold">System Diagnostics</h1>
                <Button onClick={runDiagnostics} disabled={isCheckingDiag} className="gap-2 gradient-primary border-0 rounded-xl">
                  {isCheckingDiag ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Run Check
                </Button>
              </div>

              {!diagResults && !isCheckingDiag && (
                <div className="glass-strong rounded-3xl p-12 text-center">
                  <ShieldCheck className="w-16 h-16 mx-auto mb-4 text-primary opacity-20" />
                  <h3 className="text-xl font-bold mb-2">Ready to Scan</h3>
                  <p className="text-muted-foreground mb-6">Verify your Firebase, Razorpay, and Email configurations.</p>
                  <Button onClick={runDiagnostics} className="gradient-primary border-0 rounded-xl px-8 h-12">Start Diagnostic Scan</Button>
                </div>
              )}

              {diagResults && (
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Environment Column */}
                  <div className="space-y-6">
                    <div className="glass-strong rounded-2xl p-6">
                      <h3 className="font-heading font-bold mb-4 flex items-center gap-2"><Terminal className="w-4 h-4 text-primary" /> Environment Variables</h3>
                      <div className="space-y-4">
                        {[
                          { name: "FIREBASE_JSON", status: diagResults.env?.FIREBASE_JSON?.status || 'missing', detail: diagResults.env?.FIREBASE_JSON?.detail, advice: diagResults.env?.FIREBASE_JSON?.advice },
                          { name: "FIREBASE_INDIVIDUAL", status: diagResults.env?.FIREBASE_INDIVIDUAL?.status || 'missing', detail: diagResults.env?.FIREBASE_INDIVIDUAL?.detail, advice: diagResults.env?.FIREBASE_INDIVIDUAL?.advice },
                          { name: "RAZORPAY_KEYS", status: diagResults.env?.RAZORPAY_KEY?.status || 'missing', detail: diagResults.env?.RAZORPAY_KEY?.detail, advice: diagResults.env?.RAZORPAY_KEY?.advice },
                          { name: "EMAIL_SMTP", status: diagResults.env?.EMAIL_SMTP?.status || 'missing', detail: diagResults.env?.EMAIL_SMTP?.detail, advice: diagResults.env?.EMAIL_SMTP?.advice }
                        ].map(v => (
                          <div key={v.name} className={`p-4 rounded-xl border-l-4 ${v.status === 'valid_format' || v.status === 'present' ? 'bg-emerald-500/5 border-emerald-500' : 'bg-destructive/5 border-destructive'}`}>
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{v.name}</span>
                              {v.status === 'valid_format' || v.status === 'present' ? <Check className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-destructive" />}
                            </div>
                            <p className="text-sm font-bold capitalize">{v.status.replace(/_/g, ' ')}</p>
                            {v.detail && <p className="text-xs text-muted-foreground mt-1 font-mono break-all">{v.detail}</p>}
                            {v.advice && (
                              <div className="mt-3 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                                <p className="text-[10px] font-bold text-destructive uppercase mb-1">Recommended Fix:</p>
                                <p className="text-xs text-destructive/80 leading-relaxed font-medium">{v.advice}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Connection Column */}
                  <div className="space-y-6">
                    <div className="glass-strong rounded-2xl p-6">
                      <h3 className="font-heading font-bold mb-4 flex items-center gap-2"><Cloud className="w-4 h-4 text-primary" /> Service Connectivity</h3>
                      <div className={`p-6 rounded-2xl text-center border-2 border-dashed ${diagResults?.database?.status === 'connected' ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-destructive/30 bg-destructive/5'}`}>
                        <Database className={`w-12 h-12 mx-auto mb-3 ${diagResults?.database?.status === 'connected' ? 'text-emerald-500' : 'text-destructive'}`} />
                        <h4 className="font-bold text-lg">Firebase Database</h4>
                        <p className="text-sm text-muted-foreground mb-4">Real-time connection test result</p>
                        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${diagResults?.database?.status === 'connected' ? 'bg-emerald-500 text-white' : 'bg-destructive text-white'}`}>
                          {diagResults?.database?.status === 'connected' ? <><Check className="w-3 h-3" /> Online</> : <><X className="w-3 h-3" /> Offline</>}
                        </div>
                        {diagResults?.database?.error && (
                          <p className="mt-4 text-[10px] font-mono p-3 bg-black/20 rounded-lg text-destructive-foreground/70 break-all">{diagResults.database.error}</p>
                        )}
                        {diagResults?.database?.status === 'connected' && (
                          <p className="mt-4 text-xs font-bold text-emerald-600">Successfully verified {diagResults.database.stats?.products} products and {diagResults.database.stats?.orders} orders.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── DEPLOY / DB TOOLS ──────────────── */}
          {activeTab === "deploy" && (
            <div className="space-y-6">
              <h1 className="font-heading text-3xl font-bold">Deploy Catalog</h1>
              <div className="glass-strong rounded-2xl p-8">
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-primary-foreground"><Rocket className="w-8 h-8" /></div>
                  <div>
                    <h3 className="font-heading font-bold text-xl">Database Sync</h3>
                    <p className="text-sm text-muted-foreground">Force push the localized product catalog to Firestore.</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="glass-subtle rounded-xl p-4 text-center">
                    <p className="text-3xl font-heading font-bold text-primary">{dbProductCount}</p>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">In Live Database</p>
                  </div>
                  <div className="glass-subtle rounded-xl p-4 text-center">
                    <p className="text-3xl font-heading font-bold">{staticProducts.length}</p>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">In Static Repo</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Button onClick={handleDeploy} disabled={isDeploying} className="h-14 px-8 gradient-primary border-0 rounded-xl font-bold text-base shadow-xl">
                    {isDeploying ? "Deploying..." : "Sync Database"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ── MAINTENANCE / CLEANUP ──────────── */}
          {activeTab === "maintenance" && (
            <div className="space-y-6">
              <h1 className="font-heading text-3xl font-bold">Maintenance Mode</h1>
              <p className="text-muted-foreground">Powerful tools to prepare your store for a clean production launch.</p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="glass-strong rounded-2xl p-6 border-l-4 border-destructive">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center"><Trash2 className="w-5 h-5" /></div>
                    <h3 className="font-bold">Purge Test Orders</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-6">Wipe every order in Firestore. Use this once you are done testing payments to have a clean Order ID sequence for real customers.</p>
                  <Button 
                    onClick={() => handleMaintenance("purge_orders")} 
                    disabled={isMaintenanceRunning}
                    variant="destructive" 
                    className="w-full rounded-xl font-bold uppercase tracking-widest text-[10px]"
                  >
                    Nuke Order History
                  </Button>
                </div>

                <div className="glass-strong rounded-2xl p-6 border-l-4 border-primary">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><RefreshCw className="w-5 h-5" /></div>
                    <h3 className="font-bold">Reset Stock Levels</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-6">Resets all products to "In Stock" with a default quantity of 10. Perfect for ensuring your first real customers don't see "Sold Out" from your testing.</p>
                  <Button 
                    onClick={() => handleMaintenance("sync_stock")} 
                    disabled={isMaintenanceRunning}
                    variant="outline" 
                    className="w-full rounded-xl font-bold uppercase tracking-widest text-[10px] border-primary text-primary"
                  >
                    Reset Inventory to Stock
                  </Button>
                </div>

                <div className="glass-strong rounded-2xl p-6 border-l-4 border-amber-500">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center"><Star className="w-5 h-5" /></div>
                    <h3 className="font-bold">Clear Test Reviews</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-6">Remove all customer reviews from the database. Clean the slate so only real customer feedback is displayed on product pages.</p>
                  <Button 
                    onClick={() => handleMaintenance("purge_reviews")} 
                    disabled={isMaintenanceRunning}
                    className="w-full bg-amber-500 hover:bg-amber-600 border-0 rounded-xl font-bold uppercase tracking-widest text-[10px] text-white"
                  >
                    Wipe Reviews
                  </Button>
                </div>
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
