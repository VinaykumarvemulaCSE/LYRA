import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Package, ArrowRight, Truck, MapPin, Receipt, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { dataService, Order } from "@/services/dataService";
import { formatPrice } from "@/data/products";

const Confetti = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {[...Array(50)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            top: "50%", 
            left: "50%", 
            scale: 0,
            rotate: 0 
          }}
          animate={{ 
            top: [`${50 + (Math.random() - 0.5) * 5}%`, `${Math.random() * 100}%`],
            left: [`${50 + (Math.random() - 0.5) * 5}%`, `${Math.random() * 100}%`],
            scale: [0, 1, 0],
            rotate: [0, 360],
            opacity: [1, 1, 0]
          }}
          transition={{ 
            duration: 2 + Math.random() * 2,
            ease: "easeOut",
            delay: Math.random() * 0.5 
          }}
          className="absolute w-2 h-2 rounded-full"
          style={{ 
            backgroundColor: ["#E4A853", "#FFFFFF", "#C29B40", "#F5D6A0"][Math.floor(Math.random() * 4)] 
          }}
        />
      ))}
    </div>
  );
};

export default function OrderConfirmation() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }
      try {
        const data = await dataService.orders.getById?.(orderId);
        if (data) {
          setOrder(data);
          setShowConfetti(true);
        }
      } catch (err) {
        console.error("Order fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <main className="pt-32 pb-24 min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="font-heading font-medium text-muted-foreground animate-pulse">Confirming your exquisite pieces...</p>
      </main>
    );
  }

  if (!order && orderId) {
     return (
        <main className="pt-32 pb-24 min-h-screen flex flex-col items-center justify-center container text-center">
           <h1 className="text-2xl font-black mb-4">Order Not Found</h1>
           <p className="mb-8 opacity-60">We couldn't find the details for order #{orderId.substring(0,8)}</p>
           <Button asChild className="gradient-primary"><Link to="/shop">Go Shopping</Link></Button>
        </main>
     );
  }

  const orderNumber = orderId ? orderId.substring(0, 8).toUpperCase() : "LYRA-ORDER";

  return (
    <main className="pt-32 pb-24 min-h-screen bg-background/50">
      {showConfetti && <Confetti />}
      <div className="container max-w-4xl px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="w-24 h-24 gradient-primary rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
            <CheckCircle2 className="w-12 h-12 text-primary-foreground" />
          </div>
          <p className="text-[10px] font-black uppercase text-primary tracking-[0.4em] mb-3">Transaction Successful</p>
          <h1 className="font-heading text-5xl font-black tracking-tighter mb-4">Thank you for your trust.</h1>
          <p className="text-lg text-muted-foreground font-medium max-w-lg mx-auto leading-relaxed">
            Order <strong className="text-foreground tracking-tight font-black">#{orderNumber}</strong> has been secured and is currently being curated for shipment.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-5 gap-8">
          {/* Order Summary */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="md:col-span-3 space-y-6">
            <div className="glass-strong rounded-[40px] p-8 border border-white/5 shadow-2xl overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 gradient-primary rounded-full blur-[80px] opacity-10 -mr-16 -mt-16" />
              
              <h2 className="font-heading font-black text-xl mb-8 flex items-center gap-3">
                <Package className="w-5 h-5 text-primary" /> Purchased Collection
              </h2>

              <div className="space-y-6 mb-8 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                {order?.items?.map((item: any, i: number) => (
                  <div key={i} className="flex gap-6 items-center">
                    <div className="w-20 h-24 rounded-2xl overflow-hidden flex-shrink-0 border border-white/5">
                      <img src={item.image} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm truncate">{item.name}</h4>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">{item.color} • {item.size}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs font-medium opacity-60">Qty: {item.quantity}</span>
                        <span className="font-black text-sm">{formatPrice(item.price)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/5 pt-6 space-y-3">
                <div className="flex justify-between text-xs font-medium"><span className="opacity-50">Subtotal</span><span>{formatPrice(order?.totalAmount || 0)}</span></div>
                <div className="flex justify-between text-xs font-medium"><span className="opacity-50">Shipping</span><span className="text-green-500 font-bold uppercase tracking-tighter">Complimentary</span></div>
                <div className="pt-4 border-t border-white/5 flex justify-between items-end">
                   <div>
                     <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Grand Total</p>
                     <p className="text-2xl font-black">{formatPrice(order?.totalAmount || 0)}</p>
                   </div>
                   <div className="px-3 py-1 glass rounded-lg border border-white/10">
                     <span className="text-[9px] font-black text-primary uppercase tracking-widest">Paid via Card</span>
                   </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Delivery Info */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="md:col-span-2 space-y-6">
            <div className="glass-strong rounded-[40px] p-8 border border-white/5 shadow-2xl h-full">
              <h2 className="font-heading font-black text-xl mb-8 flex items-center gap-3">
                <Truck className="w-5 h-5 text-primary" /> Delivery Info
              </h2>
              
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1.5">Shipping Address</p>
                    <p className="text-xs font-bold leading-relaxed">
                      {order?.shippingAddress?.firstName} {order?.shippingAddress?.lastName}<br />
                      {order?.shippingAddress?.address}<br />
                      {order?.shippingAddress?.city}, {order?.shippingAddress?.postalCode}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center flex-shrink-0">
                    <Receipt className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1.5">Invoice</p>
                    <p className="text-xs font-bold">Standard Billing</p>
                    <button className="text-[10px] text-primary font-black uppercase hover:underline mt-1 tracking-tighter">Download PDF</button>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5">
                  <h3 className="text-xs font-black uppercase mb-4 tracking-tighter">Timeline</h3>
                  <div className="space-y-5">
                    {[
                      { label: "Order Received", date: "Today", active: true },
                      { label: "Quality Audit", date: "Within 24h", active: false },
                      { label: "Dispatch", date: "Pending", active: false },
                    ].map((step, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className={`w-2 h-2 rounded-full ${step.active ? 'bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]' : 'bg-white/10'}`} />
                        <div className="flex-1 flex justify-between items-center">
                          <span className={`text-[11px] font-bold ${step.active ? 'text-foreground' : 'text-muted-foreground'}`}>{step.label}</span>
                          <span className="text-[9px] font-bold opacity-40 uppercase">{step.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="h-16 px-10 text-base font-black gradient-primary border-0 rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all">
            <Link to="/account?tab=orders" className="flex items-center gap-2">
              <Package className="w-4 h-4" /> Go to My Orders
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-16 px-10 text-base font-black rounded-2xl glass hover:bg-white/5 border border-white/10">
            <Link to="/shop" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Continue Shopping
            </Link>
          </Button>
        </motion.div>
      </div>
    </main>
  );
}
