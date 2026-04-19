import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { User as UserIcon, MapPin, Package, LogOut, Heart, Bell, ChevronRight, Edit2, Loader2, Mail, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { dataService, Order, UserProfile } from "@/services/dataService";
import { formatPrice } from "@/data/products";

export default function Account() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setIsLoadingData(true);
      try {
        const [userOrders, userProfile] = await Promise.all([
          dataService.orders.getByUser(user.uid),
          dataService.users.getProfile(user.uid)
        ]);
        setOrders(userOrders);
        setProfile(userProfile);
      } catch (err) {
        console.error("Failed to fetch account data:", err);
      } finally {
        setIsLoadingData(false);
      }
    };

    if (user) fetchData();
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab && ["dashboard", "orders", "addresses", "notifications"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [location]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    navigate("/");
  };

  if (authLoading || (isLoadingData && !profile)) {
    return (
      <main className="pt-24 pb-16 min-h-screen">
        <div className="container max-w-6xl">
          <Skeleton className="h-10 w-48 mb-8 rounded-xl" />
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-64 space-y-3">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
            </div>
            <div className="flex-1 glass-strong rounded-3xl p-8 min-h-[500px]">
              <div className="flex flex-col sm:flex-row items-center gap-6 mb-12">
                <Skeleton className="w-24 h-24 rounded-3xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-8 w-64 rounded-lg" />
                  <Skeleton className="h-4 w-48 rounded-lg" />
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-4 mb-12">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
              </div>
              <div className="space-y-4">
                <Skeleton className="h-6 w-32 rounded-lg" />
                <Skeleton className="h-48 w-full rounded-2xl" />
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: UserIcon },
    { id: "orders", label: "My Orders", icon: Package },
    { id: "addresses", label: "Addresses", icon: MapPin },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  const stats = [
    { label: "Total Orders", value: orders.length.toString() },
    { label: "Member Level", value: profile?.role?.toUpperCase() || "USER" },
    { label: "Account Status", value: "Verified" }
  ];

  return (
    <main className="pt-24 pb-16 min-h-screen">
      <div className="container max-w-6xl">
        <h1 className="font-heading text-3xl font-bold mb-8">My Account</h1>
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-64 flex-shrink-0 space-y-2">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === id ? "gradient-primary text-primary-foreground shadow-md" : "glass-subtle hover:bg-secondary text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" /> {label}
                <ChevronRight className="w-4 h-4 ml-auto" />
              </button>
            ))}
            <Link to="/wishlist" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium glass-subtle hover:bg-secondary text-foreground">
              <Heart className="w-4 h-4" /> Wishlist <ChevronRight className="w-4 h-4 ml-auto" />
            </Link>
            <button 
              onClick={handleSignOut} 
              disabled={isSigningOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 mt-4 transition-colors disabled:opacity-50"
            >
              {isSigningOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />} Sign Out
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 glass-strong rounded-2xl p-6 md:p-8 min-h-[500px]">
            {activeTab === "dashboard" && (
              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row items-center gap-6 pb-8 border-b border-border/30">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-3xl overflow-hidden glass-strong border-2 border-primary/20 shadow-xl transition-transform group-hover:scale-105 duration-300">
                      {user?.photoURL ? (
                        <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary">
                          <UserIcon className="w-10 h-10" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-center sm:text-left flex-1">
                    <h2 className="font-heading text-3xl font-bold mb-1">
                      Welcome back, {user?.displayName?.split(' ')[0] || (user?.email ? "Fashionista" : "User")}!
                    </h2>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold ring-1 ring-primary/20">
                        {user?.email ? <Mail className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />}
                        {user?.email || user?.phoneNumber}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  {stats.map(stat => (
                    <div key={stat.label} className="p-5 glass-subtle rounded-2xl hover:border-primary/20 transition-colors border border-transparent">
                      <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">{stat.label}</p>
                      <p className="font-heading text-2xl font-bold">{stat.value}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-4 pt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading font-bold text-lg">Personal Journey</h3>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-6 p-6 glass-subtle rounded-2xl">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Display Name</label>
                      <p className="font-bold">{user?.displayName || "Not specified"}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Email Identity</label>
                      <p className="font-bold">{user?.email || "No email linked"}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Order Status</label>
                      <p className="font-bold">{orders.length > 0 ? "Active Shopper" : "Beginner"}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Last Activity</label>
                      <p className="font-bold flex items-center gap-2">
                        Just Now
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "orders" && (
              <div>
                <h2 className="font-heading text-2xl font-bold mb-6">Order History</h2>
                <div className="space-y-4">
                  {orders.length === 0 ? (
                    <div className="text-center py-20 glass-subtle rounded-3xl border border-dashed border-border/50">
                      <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-muted-foreground">You haven't placed any orders yet.</p>
                      <Link to="/shop" className="text-primary font-bold hover:underline mt-4 inline-block">Start Shopping</Link>
                    </div>
                  ) : (
                    orders.map(order => (
                      <Link key={order.id} to={`/order-tracking?order=${order.id}`} className="flex items-center justify-between p-4 glass-subtle rounded-xl hover:bg-secondary/50 transition-colors group">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground"><Package className="w-5 h-5" /></div>
                          <div>
                            <p className="font-heading font-bold">#{order.id.substring(0,8).toUpperCase()}</p>
                            <p className="text-xs text-muted-foreground">
                              {order.createdAt instanceof Date ? order.createdAt.toLocaleDateString() : (order.createdAt?.toDate?.()?.toLocaleDateString() || "Recently")} · {order.items?.length || 0} items
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-4">
                          <div className="hidden sm:block">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${
                              order.status === 'delivered' ? "text-emerald-600 bg-emerald-50" : "text-primary bg-primary/10"
                            }`}>{order.status}</span>
                            <p className="font-bold text-sm mt-1">{formatPrice(order.totalAmount)}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === "addresses" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-heading text-2xl font-bold">Saved Addresses</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {profile?.addresses?.length === 0 ? (
                    <div className="col-span-2 text-center py-10 glass-subtle rounded-xl">
                      <p className="text-sm text-muted-foreground">No addresses saved yet. They will appear here when you checkout.</p>
                    </div>
                  ) : (
                    profile?.addresses?.map((addr: any, i: number) => (
                      <div key={i} className="glass-subtle rounded-xl p-5 relative border border-border/10">
                        {i === 0 && <span className="absolute top-3 right-3 text-[9px] font-black gradient-primary text-primary-foreground px-2 py-0.5 rounded uppercase tracking-widest">Primary</span>}
                        <h3 className="font-heading font-bold mb-2">Address {i + 1}</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                          {addr.firstName} {addr.lastName}<br />
                          {addr.address}<br />
                          {addr.city}, {addr.state} {addr.postalCode}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div>
                <h2 className="font-heading text-2xl font-bold mb-6">Notifications</h2>
                <div className="space-y-3">
                  <div className="text-center py-20 opacity-40">
                    <Bell className="w-12 h-12 mx-auto mb-4" />
                    <p className="text-sm">No new notifications</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

