import { Link } from "react-router-dom";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/data/products";
import { Button } from "@/components/ui/button";

export default function Cart() {
  const { items: contextItems, removeItem, updateQuantity, totalPrice: total } = useCart();
  const items = contextItems.map(item => ({
    ...item.product,
    quantity: item.quantity,
    color: item.selectedColor,
    size: item.selectedSize
  }));
  const shipping = total > 15000 ? 0 : 500;
  const grandTotal = total + shipping;

  return (
    <main className="pt-24 pb-16 min-h-screen">
      <div className="container max-w-6xl">
        <h1 className="font-heading text-3xl font-bold mb-8">Shopping Cart</h1>
        {items.length === 0 ? (
          <div className="text-center py-20 glass-strong rounded-2xl">
            <h2 className="text-xl font-bold mb-4">Your cart is empty</h2>
            <p className="text-muted-foreground mb-8">Looks like you haven't added anything yet.</p>
            <Button asChild className="gradient-primary border-0 rounded-xl">
              <Link to="/shop">Continue Shopping</Link>
            </Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div key={`${item.id}-${item.color}-${item.size}`} className="flex gap-4 p-4 glass-strong rounded-2xl">
                  <div className="w-24 h-32 rounded-xl overflow-hidden flex-shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <span className="text-xs text-muted-foreground uppercase">{item.brand}</span>
                        <h3 className="font-heading font-bold">{item.name}</h3>
                      </div>
                      <button onClick={() => removeItem(item.id, item.color, item.size)} className="text-muted-foreground hover:text-destructive transition-colors p-2">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground mb-auto">Color: {item.color} | Size: {item.size}</p>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center glass-subtle rounded-xl">
                        <button className="w-8 h-8 flex items-center justify-center hover:text-primary transition-colors" onClick={() => updateQuantity(item.id, item.color, item.size, Math.max(1, item.quantity - 1))} disabled={item.quantity <= 1}>-</button>
                        <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                        <button className="w-8 h-8 flex items-center justify-center hover:text-primary transition-colors" onClick={() => updateQuantity(item.id, item.color, item.size, item.quantity + 1)}>+</button>
                      </div>
                      <span className="font-heading font-bold">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  </div>
                </div>
              ))}
              <Link to="/shop" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mt-4">
                <ArrowLeft className="w-4 h-4" /> Continue Shopping
              </Link>
            </div>
            <div className="lg:col-span-1">
              <div className="glass-strong rounded-2xl p-6 sticky top-28">
                <h2 className="font-heading font-bold text-lg mb-6">Order Summary</h2>
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span className="font-medium">{formatPrice(total)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Shipping</span><span className="font-medium">{shipping === 0 ? "Free" : formatPrice(shipping)}</span></div>
                  {shipping > 0 && <p className="text-xs text-muted-foreground">Free shipping on orders over ₹15,000</p>}
                  <div className="border-t border-border/30 pt-4 flex justify-between">
                    <span className="font-bold">Total</span>
                    <span className="font-heading font-bold text-xl">{formatPrice(grandTotal)}</span>
                  </div>
                </div>
                <Link to="/checkout" className="w-full h-12 text-sm font-bold gradient-primary text-primary-foreground flex items-center justify-center rounded-xl shadow-lg hover:opacity-90 transition-opacity">
                  Proceed to Checkout
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
