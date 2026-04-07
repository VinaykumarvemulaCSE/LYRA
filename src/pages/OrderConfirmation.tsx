import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Package, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function OrderConfirmation() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const orderNumber = orderId || `ORD-${Math.floor(100000 + Math.random() * 900000)}`;

  return (
    <main className="pt-32 pb-24 min-h-screen flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-xl w-full text-center">
        <div className="w-20 h-20 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <CheckCircle2 className="w-10 h-10 text-primary-foreground" />
        </div>
        <h1 className="font-heading text-4xl font-bold mb-4">Order Confirmed!</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Your order <strong className="text-foreground">{orderNumber}</strong> has been placed. We've sent a confirmation to your email.
        </p>
        <div className="glass-strong rounded-2xl p-8 mb-8 text-left">
          <h2 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" /> What's Next
          </h2>
          <ul className="space-y-4 text-sm text-muted-foreground">
            {["We'll begin processing your order immediately.", "You'll receive an email when your order ships with tracking info.", "Estimated delivery: 3-5 business days."].map((text, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-lg ${i === 0 ? "gradient-primary text-primary-foreground" : "bg-secondary text-muted-foreground"} flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5`}>{i + 1}</div>
                <p>{text}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="font-bold gradient-primary border-0 rounded-xl">
            <Link to={`/order-tracking?order=${orderNumber}`}>Track Order</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="font-bold rounded-xl border-primary text-primary hover:bg-primary hover:text-primary-foreground">
            <Link to="/shop">Continue Shopping <ArrowRight className="w-4 h-4 ml-2" /></Link>
          </Button>
        </div>
      </motion.div>
    </main>
  );
}
