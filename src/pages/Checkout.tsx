import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Loader2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { formatPrice } from "@/data/products";
import { Button } from "@/components/ui/button";
import { dataService } from "@/services/dataService";
import { toast } from "sonner";
import { API_ROUTES } from "@/lib/api-config";

export default function Checkout() {
  const { items: contextItems, totalPrice: total, clearCart } = useCart();
  const items = contextItems.map(item => ({ ...item.product, quantity: item.quantity, color: item.selectedColor, size: item.selectedSize }));
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [formData, setFormData] = useState({
    email: user?.email || "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    postalCode: "",
    state: "",
    phone: user?.phoneNumber || ""
  });

  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  const shipping = total > 5000 ? 0 : 500;
  
  // Calculate potential discount
  const discountAmount = appliedPromo 
    ? (appliedPromo.discountFlat > 0 ? appliedPromo.discountFlat : (total * (appliedPromo.discountPercent / 100))) 
    : 0;
    
  const grandTotal = Math.max(0, total + shipping - discountAmount);

  const handleApplyPromo = async () => {
    if (!promoCodeInput) return;
    setIsApplyingPromo(true);
    setErrorMsg("");
    try {
      const promos = await dataService.promotions.getAll();
      const validPromo = promos.find(p => p.code.toLowerCase() === promoCodeInput.toLowerCase() && p.active);
      
      if (!validPromo) {
        toast.error("Invalid Promo Code", { description: "This code does not exist or has expired." });
        setAppliedPromo(null);
      } else {
        setAppliedPromo(validPromo);
        toast.success("Promo Applied!", { description: `You unlocked a discount.` });
      }
    } catch (err) {
      toast.error("Failed to verify code");
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    
    if (!user) {
      toast.error("Authentication Required", { description: "Please sign in to complete your purchase securely." });
      navigate("/auth");
      return;
    }

    setIsProcessing(true);
    
    try {
      // 1. Stock Validation
      const stockCheckPromises = items.map(item => dataService.products.getById(item.id));
      const freshProducts = await Promise.all(stockCheckPromises);
      
      for (const item of items) {
        const product = freshProducts.find(p => p?.id === item.id);
        if (!product) throw new Error(`Product ${item.name} not found`);
        const variant = product.variants.find(v => v.color === item.color);
        if (!variant || variant.stock < item.quantity) {
          throw new Error(`Insufficient stock for ${item.name} (${item.color})`);
        }
      }

      // 2. Generate secure order document in Firebase BEFORE payment
      const dbOrder = {
        userId: user.uid,
        items: items,
        totalAmount: grandTotal,
        subTotal: total,
        discountAmount: discountAmount,
        promoCode: appliedPromo ? appliedPromo.code : null,
        shippingAddress: formData,
        status: "pending",
        paymentStatus: "pending",
        paymentId: ""
      };
      const createdOrder = await dataService.orders.create(dbOrder as any);
      if (!createdOrder?.id) throw new Error("Order system unavailable. Please try again.");

      // 3. Load Razorpay script
      const res = await loadRazorpayScript();
      if (!res) throw new Error("Razorpay SDK failed to load. Are you online?");

      // 4. Request an Order from our Serverless Backend (throws on failure — no demo bypass)
      const orderReq = await fetch(API_ROUTES.RAZORPAY_ORDER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: grandTotal, receipt: createdOrder.id })
      });

      const orderData = await orderReq.json();
      if (!orderReq.ok) throw new Error(orderData.message || "Could not connect to payment gateway. Please try again.");

      // 5. Setup Razorpay Options
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "", // Fail closed - no fallback key 
        amount: orderData.amount,
        currency: orderData.currency,
        name: "LYRA Style Hub",
        description: "Exquisite Fashion Purchase",
        image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=150",
        order_id: orderData.id,
        handler: async function (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
           try {
              // 6. Verify signature via Serverless API
              // Server-side handler also: updates order status, decrements stock, sends confirmation email
              const verifyRes = await fetch(API_ROUTES.RAZORPAY_VERIFY, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  db_order_id: createdOrder.id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  userEmail: formData.email,
                })
              });

              const verifyData = await verifyRes.json();
              if (!verifyRes.ok) throw new Error(verifyData.message || "Payment verification failed");

              toast.success("Payment Successful!", { description: "Your order has been confirmed." });
              clearCart();
              navigate(`/order-confirmation?orderId=${createdOrder.id}`);
           } catch (err: unknown) {
              const message = err instanceof Error ? err.message : "Verification failed";
              setErrorMsg(message);
              toast.error("Verification Failed", { description: message });
           }
        },
        prefill: {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          contact: formData.phone.replace(/[^0-9]/g, ""),
        },
        theme: {
          color: "#0c1220",
        },
      };

      // 6. Open Razorpay checkout (requires a real order ID from server)
      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.on("payment.failed", function (response: { error: { description: string } }) {
        toast.error("Payment Failed", { description: response.error.description });
      });

      paymentObject.open();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred";
      setErrorMsg(message);
      toast.error("Checkout Failed", { description: message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (items.length === 0) {
    return (
      <main className="pt-24 pb-16 min-h-screen container max-w-4xl text-center">
        <h1 className="font-heading text-3xl font-bold mb-4">Checkout</h1>
        <p className="text-muted-foreground mb-8">Your bag is empty.</p>
        <Button asChild className="gradient-primary border-0 rounded-xl px-12 h-12">
          <Link to="/shop">Return to Shop</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="pt-24 pb-16 min-h-screen bg-background/50">
      <div className="container max-w-6xl">
        <div className="flex items-center gap-4 mb-10">
          <Link to="/cart" className="w-12 h-12 flex items-center justify-center rounded-2xl glass hover:bg-secondary transition-all hover:scale-105 active:scale-95">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Secure Checkout</span>
            <h1 className="font-heading text-4xl font-black tracking-tighter">Your Details</h1>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-10">
          <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-8">
            {/* Contact */}
            <div className="glass-strong rounded-3xl p-8 border border-border/10 shadow-2xl">
              <h2 className="font-heading font-black text-xl mb-6 tracking-tight">Contact Information</h2>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Email Address</label>
                  <input 
                    required 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full h-12 px-5 glass rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 border-0 shadow-inner" 
                    placeholder="your@email.com" 
                  />
                </div>
              </div>
            </div>

            {/* Shipping */}
            <div className="glass-strong rounded-3xl p-8 border border-border/10 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading font-black text-xl tracking-tight">Shipping Address</h2>
                <div className="px-3 py-1 bg-primary/10 rounded-lg border border-primary/20">
                  <span className="text-[9px] font-black text-primary uppercase tracking-widest">Saved Address Used</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">First Name</label>
                  <input required type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} className="w-full h-12 px-5 glass rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 border-0 shadow-inner" placeholder="Emily" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Last Name</label>
                  <input required type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} className="w-full h-12 px-5 glass rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 border-0 shadow-inner" placeholder="Carter" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Street Address</label>
                  <input required type="text" name="address" value={formData.address} onChange={handleInputChange} className="w-full h-12 px-5 glass rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 border-0 shadow-inner" placeholder="123 Luxury Lane" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">City</label>
                  <input required type="text" name="city" value={formData.city} onChange={handleInputChange} className="w-full h-12 px-5 glass rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 border-0 shadow-inner" placeholder="Mumbai" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Postal Code</label>
                  <input required type="text" name="postalCode" value={formData.postalCode} onChange={handleInputChange} className="w-full h-12 px-5 glass rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 border-0 shadow-inner" placeholder="400001" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">State</label>
                  <input required type="text" name="state" value={formData.state} onChange={handleInputChange} className="w-full h-12 px-5 glass rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 border-0 shadow-inner" placeholder="Maharashtra" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Phone Number</label>
                  <input required type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full h-12 px-5 glass rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 border-0 shadow-inner" placeholder="+91 98765 43210" />
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="glass-strong rounded-3xl p-8 border border-border/10 shadow-2xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-lg">Secure Gateway</h3>
                  <p className="text-xs text-muted-foreground">Encrypted payments via Razorpay</p>
                </div>
              </div>
              <img src="https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg" alt="Razorpay" className="h-4 opacity-50 contrast-125" />
            </div>

            {errorMsg && (
              <div className="p-4 rounded-xl border border-destructive/50 bg-destructive/10 text-destructive text-sm font-bold">
                {errorMsg}
              </div>
            )}

            <Button type="submit" className="w-full h-16 text-xl font-black gradient-primary border-0 rounded-[20px] shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all" disabled={isProcessing}>
              {isProcessing ? (
                <span className="flex items-center gap-3">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating Gateway...
                </span>
              ) : (
                `Complete Purchase — ${formatPrice(grandTotal)}`
              )}
            </Button>
            <p className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
              Safe & Secure · 256-bit SSL Encryption
            </p>
          </form>

          {/* Summary */}
          <div className="lg:col-span-2">
            <div className="glass-strong rounded-2xl p-6 sticky top-28">
              <h2 className="font-heading font-bold text-lg mb-6">Order Summary</h2>
              <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto pr-2">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-16 h-20 rounded-xl overflow-hidden flex-shrink-0 relative">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      <span className="absolute -top-1 -right-1 w-5 h-5 gradient-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">{item.quantity}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm line-clamp-1">{item.name}</h4>
                      <p className="text-xs text-muted-foreground">{item.color} / {item.size}</p>
                      <p className="text-sm font-medium mt-1">{formatPrice(item.price)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-border/30 pt-4 space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-medium">{formatPrice(total)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span className="font-medium">{shipping === 0 ? "Free" : formatPrice(shipping)}</span></div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-500 font-bold">
                    <span>Discount ({appliedPromo?.code})</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="border-t border-border/30 pt-3 flex justify-between"><span className="font-bold">Total</span><span className="font-heading font-bold text-xl">{formatPrice(grandTotal)}</span></div>
              </div>

              {/* Promo Code Engine */}
              <div className="border-t border-border/30 pt-6 mt-6">
                <p className="text-[10px] font-black uppercase text-muted-foreground mb-3 ml-1 tracking-widest">Promotion Code</p>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value)}
                    placeholder="ENTER CODE" 
                    className="flex-grow h-12 px-4 glass rounded-xl text-sm font-bold uppercase focus:outline-none focus:ring-2 focus:ring-primary/30 border-0 shadow-inner" 
                  />
                  <Button type="button" onClick={handleApplyPromo} disabled={isApplyingPromo} variant="outline" className="h-12 w-20 text-xs font-bold rounded-xl glass hover:bg-primary/10 border border-primary/20">
                    {isApplyingPromo ? <Loader2 className="w-4 h-4 animate-spin"/> : "APPLY"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
