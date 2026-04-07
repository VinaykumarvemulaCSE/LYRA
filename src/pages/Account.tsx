import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { User as UserIcon, MapPin, Package, LogOut, Heart, Bell, ChevronRight, Edit2, Loader2, Mail, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Account() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

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

  if (loading) {
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
                    <button className="absolute -bottom-2 -right-2 p-2 rounded-xl gradient-primary text-primary-foreground shadow-lg hover:scale-110 transition-transform">
                      <Edit2 className="w-3 h-3" />
                    </button>
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
                      <span className="text-xs text-muted-foreground font-medium">• Member since 2024</span>
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  {[{ label: "Total Orders", value: "12" }, { label: "Wishlisted", value: "4" }, { label: "Rewards", value: "850 pts" }].map(stat => (
                    <div key={stat.label} className="p-5 glass-subtle rounded-2xl hover:border-primary/20 transition-colors border border-transparent">
                      <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">{stat.label}</p>
                      <p className="font-heading text-2xl font-bold">{stat.value}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-4 pt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading font-bold text-lg">Profile Information</h3>
                    <Button variant="ghost" size="sm" className="text-primary font-bold hover:bg-primary/5">Manage Security</Button>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-6 p-6 glass-subtle rounded-2xl">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Full Name</label>
                      <p className="font-bold">{user?.displayName || "Not specified"}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Email Address</label>
                      <p className="font-bold">{user?.email || "No email linked"}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Phone Number</label>
                      <p className="font-bold">{user?.phoneNumber || "No phone linked"}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Login Method</label>
                      <p className="font-bold flex items-center gap-2">
                        {user?.providerData?.[0]?.providerId === 'google.com' ? 'Google Account' : 
                         user?.phoneNumber ? 'Phone OTP' : 'Email & Password'}
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
                  {[
                    { id: "ORD-839210", date: "Oct 24, 2024", status: "Delivered", statusColor: "text-emerald-600 bg-emerald-50", total: "₹24,500", items: "3 items" },
                    { id: "ORD-472918", date: "Sep 12, 2024", status: "Delivered", statusColor: "text-emerald-600 bg-emerald-50", total: "₹12,000", items: "2 items" },
                    { id: "ORD-183729", date: "Aug 5, 2024", status: "Returned", statusColor: "text-orange-600 bg-orange-50", total: "₹8,500", items: "1 item" },
                  ].map(order => (
                    <Link key={order.id} to={`/order-tracking?order=${order.id}`} className="flex items-center justify-between p-4 glass-subtle rounded-xl hover:bg-secondary/50 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground"><Package className="w-5 h-5" /></div>
                        <div>
                          <p className="font-heading font-bold">{order.id}</p>
                          <p className="text-xs text-muted-foreground">{order.date} · {order.items}</p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <div>
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${order.statusColor}`}>{order.status}</span>
                          <p className="font-bold text-sm mt-1">{order.total}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "addresses" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-heading text-2xl font-bold">Saved Addresses</h2>
                  <Button className="font-bold gradient-primary border-0 rounded-xl">Add New</Button>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="glass-subtle rounded-xl p-5 relative border-2 border-primary/20">
                    <span className="absolute top-3 right-3 text-[10px] font-bold gradient-primary text-primary-foreground px-2 py-1 rounded-lg">Default</span>
                    <h3 className="font-heading font-bold mb-2">Home</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">Emily Carter<br />123 Luxury Lane, Apt 4B<br />Mumbai, Maharashtra 400001</p>
                    <div className="flex gap-3">
                      <button className="text-sm font-bold text-primary hover:underline">Edit</button>
                      <button className="text-sm font-bold text-destructive hover:underline">Delete</button>
                    </div>
                  </div>
                  <div className="glass-subtle rounded-xl p-5">
                    <h3 className="font-heading font-bold mb-2">Office</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">Emily Carter<br />456 Business Park, Tower B<br />Bangalore, Karnataka 560001</p>
                    <div className="flex gap-3">
                      <button className="text-sm font-bold text-primary hover:underline">Edit</button>
                      <button className="text-sm font-bold text-destructive hover:underline">Delete</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div>
                <h2 className="font-heading text-2xl font-bold mb-6">Notifications</h2>
                <div className="space-y-3">
                  {[
                    { icon: Package, title: "Order Delivered", desc: "Your order #ORD-839210 has been delivered.", time: "2 hours ago", unread: true },
                    { icon: Heart, title: "Wishlist Restock", desc: "Vintage Wash Straight Jeans is back in stock.", time: "1 day ago", unread: true },
                    { icon: Bell, title: "Flash Sale", desc: "Up to 50% off on selected items. Ends tonight!", time: "2 days ago", unread: false },
                  ].map((notif, i) => (
                    <div key={i} className={`flex gap-4 p-4 rounded-xl transition-colors ${notif.unread ? "glass border-primary/20" : "glass-subtle"}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${notif.unread ? "gradient-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                        <notif.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm">{notif.title}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">{notif.desc}</p>
                        <p className="text-xs text-muted-foreground mt-1.5 font-medium">{notif.time}</p>
                      </div>
                      {notif.unread && <div className="w-2 h-2 rounded-full gradient-primary flex-shrink-0 mt-2" />}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
