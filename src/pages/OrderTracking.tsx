import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, MapPin, Truck, CheckCircle2, Package, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { Order } from "@/services/dataService";

export default function OrderTracking() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    setLoading(true);
    const docRef = doc(db, "orders", orderId);
    
    // 3.1 Live Tracking Connection
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        setOrder({ id: snap.id, ...snap.data() } as Order);
      } else {
        setOrder(null);
      }
      setLoading(false);
    }, (err) => {
      console.error("Tracking Error:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [orderId]);

  const getStatusSteps = (status: string = "pending") => {
    const steps = [
      { id: "pending", title: "Order Confirmed", icon: <CheckCircle2 className="w-5 h-5" /> },
      { id: "processing", title: "Processing", icon: <Package className="w-5 h-5" /> },
      { id: "shipped", title: "Shipped", icon: <Truck className="w-5 h-5" /> },
      { id: "delivered", title: "Delivered", icon: <MapPin className="w-5 h-5" /> },
    ];

    const currentIdx = steps.findIndex(s => s.id === status);
    return steps.map((s, idx) => ({
      ...s,
      done: idx <= currentIdx,
      date: idx < currentIdx ? "Completed" : (idx === currentIdx ? "In Progress" : "Pending")
    }));
  };

  const steps = getStatusSteps(order?.status);

  return (
    <main className="pt-24 pb-16 min-h-screen">
      <div className="container max-w-3xl">
        <h1 className="font-heading text-3xl font-bold mb-8 text-center">Track Your Order</h1>
        {!orderId ? (
          <div className="glass-strong rounded-2xl p-8 mb-8">
            <h2 className="font-heading font-bold text-lg mb-4">Enter your tracking number</h2>
            <form className="flex gap-3" action="/order-tracking">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="text" name="order" placeholder="e.g. ORD-123456" className="w-full h-12 pl-11 pr-4 glass rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30" required />
              </div>
              <Button type="submit" className="h-12 px-8 font-bold gradient-primary border-0 rounded-xl">Track</Button>
            </form>
          </div>
        ) : (
          <div className="space-y-8">
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
            ) : !order ? (
              <div className="glass-strong rounded-2xl p-12 text-center">
                 <p className="text-muted-foreground font-heading">Order not found. Please double check the ID.</p>
              </div>
            ) : (
              <div className="glass-strong rounded-2xl p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-border/30">
                  <div>
                    <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Order Number</p>
                    <p className="font-heading font-bold text-xl">{orderId}</p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Status</p>
                    <p className="font-heading font-bold text-xl text-primary capitalize">{order.status}</p>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border/50 ml-[-1px] rounded" />
                  <div className="space-y-8 relative z-10">
                    {steps.map((status) => (
                      <div key={status.title} className="flex gap-6 items-start">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-700 ${status.done ? "gradient-primary text-primary-foreground shadow-md scale-110" : "glass-subtle text-muted-foreground"}`}>
                          {status.icon}
                        </div>
                        <div className="pt-3">
                          <h4 className={`font-bold text-base transition-colors duration-500 ${status.done ? "text-foreground" : "text-muted-foreground"}`}>{status.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">{status.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div className="text-center">
              <Button asChild variant="outline" className="font-bold rounded-xl border-primary text-primary">
                <Link to="/contact">Need Help?</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
