import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function EmailPreviews() {
  const [activeTemplate, setActiveTemplate] = useState("welcome");

  const templates = [
    { id: "welcome", label: "Welcome Email" },
    { id: "order_confirmation", label: "Order Confirmation" },
    { id: "shipping", label: "Shipping Update" },
    { id: "abandoned_cart", label: "Abandoned Cart" },
    { id: "password_reset", label: "Password Reset" },
  ];

  return (
    <main className="pt-24 pb-16 min-h-screen bg-muted/20">
      <div className="container max-w-5xl">
        <h1 className="font-heading text-3xl font-bold mb-8 text-center">Email Templates Preview</h1>
        
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {templates.map((t) => (
            <Button
              key={t.id}
              variant={activeTemplate === t.id ? "default" : "outline"}
              onClick={() => setActiveTemplate(t.id)}
              className="font-bold"
            >
              {t.label}
            </Button>
          ))}
        </div>

        <div className="max-w-2xl mx-auto bg-background border border-border rounded-xl shadow-lg overflow-hidden flex flex-col items-center">
          {/* Email Header Match */}
          <div className="w-full bg-zinc-950 text-white p-8 text-center">
            <h2 className="font-heading text-3xl font-extrabold tracking-widest uppercase">LYRA</h2>
          </div>

          <div className="p-8 w-full prose prose-slate">
            {activeTemplate === "welcome" && (
              <>
                <h1 className="text-2xl font-heading mb-4 text-center">Welcome to the Club</h1>
                <p>Hi Emily,</p>
                <p>Thank you for joining LYRA. You are now part of an exclusive community that values timeless design, ethical craftsmanship, and uncompromising quality.</p>
                <p>To celebrate your arrival, enjoy <strong>10% off</strong> your first purchase with the code below:</p>
                <div className="text-center my-8">
                  <span className="bg-muted px-6 py-3 font-mono font-bold tracking-widest text-lg rounded-md border border-border">WELCOME10</span>
                </div>
                <div className="text-center">
                  <Button className="bg-black text-white px-8 py-3 rounded-none uppercase tracking-widest font-bold text-xs hover:bg-zinc-800 transition-colors">Shop The Collection</Button>
                </div>
              </>
            )}

            {activeTemplate === "order_confirmation" && (
              <>
                <h1 className="text-2xl font-heading mb-4 text-center">Order Confirmed</h1>
                <p>Hi Emily,</p>
                <p>Thank you for your purchase. We're getting your order ready to be shipped. We will notify you when it has been sent.</p>
                
                <div className="bg-muted/30 p-6 rounded-lg my-8 border border-border text-sm">
                  <div className="flex justify-between font-bold border-b border-border pb-4 mb-4">
                    <span>Order #1024</span>
                    <span>Oct 24, 2024</span>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex gap-4 items-center">
                      <div className="w-12 h-16 bg-muted rounded overflow-hidden">
                        <img src="https://images.unsplash.com/photo-1539008835657-9e8e9680c956?q=80&w=1974" alt="Item" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-bold">Emerald Silk Gown</p>
                        <p className="text-muted-foreground text-xs">Size: S | Qty: 1</p>
                      </div>
                    </div>
                    <p className="font-bold">₹45,000</p>
                  </div>
                  <div className="border-t border-border pt-4 mt-4 text-right">
                    <p className="font-bold text-lg">Total: ₹45,000</p>
                  </div>
                </div>

                <div className="text-center">
                  <Button className="bg-black text-white px-8 py-3 rounded-none uppercase tracking-widest font-bold text-xs hover:bg-zinc-800 transition-colors">View Order Status</Button>
                </div>
              </>
            )}

            {activeTemplate === "shipping" && (
              <>
                <h1 className="text-2xl font-heading mb-4 text-center">Your Order is on its Way!</h1>
                <p>Hi Emily,</p>
                <p>Great news! Your order <strong>#1024</strong> has been shipped and is currently on its way to you.</p>
                
                <div className="text-center my-8 p-6 border border-border rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground uppercase tracking-wider font-bold mb-2">Tracking Number</p>
                  <p className="font-mono text-lg mb-4">AWB9876543210IN</p>
                  <p className="text-sm mb-4">Carrier: BlueDart Express</p>
                  <Button className="bg-black text-white px-8 py-3 rounded-none uppercase tracking-widest font-bold text-xs hover:bg-zinc-800 transition-colors">Track Package</Button>
                </div>
                
                <p className="text-sm text-muted-foreground text-center">Please note that it may take up to 24 hours for tracking information to be updated on the carrier's website.</p>
              </>
            )}

            {activeTemplate === "abandoned_cart" && (
              <>
                <h1 className="text-2xl font-heading mb-4 text-center">Did you forget something?</h1>
                <p>Hi Emily,</p>
                <p>We noticed you left some beautiful pieces behind. They are still waiting for you in your cart, but our stock moves fast.</p>
                
                <div className="flex justify-center my-8">
                  <div className="w-32 h-40 bg-muted rounded overflow-hidden border border-border shadow-sm">
                    <img src="https://images.unsplash.com/photo-1596464716127-f2a82984de30?q=80&w=2070" alt="Item" className="w-full h-full object-cover" />
                  </div>
                </div>

                <p className="text-center mb-8">Complete your purchase now before they're gone.</p>
                
                <div className="text-center">
                  <Button className="bg-black text-white px-8 py-3 rounded-none uppercase tracking-widest font-bold text-xs hover:bg-zinc-800 transition-colors">Return To Cart</Button>
                </div>
              </>
            )}

            {activeTemplate === "password_reset" && (
              <>
                <h1 className="text-2xl font-heading mb-4 text-center">Password Reset Request</h1>
                <p>Hi Emily,</p>
                <p>We received a request to reset your LYRA password. Click the button below to choose a new one:</p>
                
                <div className="text-center my-8">
                  <Button className="bg-black text-white px-8 py-3 rounded-none uppercase tracking-widest font-bold text-xs hover:bg-zinc-800 transition-colors">Reset Password</Button>
                </div>
                
                <p className="text-sm text-muted-foreground">If you did not request a password reset, please safely ignore this email. Your password will remain unchanged.</p>
              </>
            )}

            <div className="mt-12 pt-8 border-t border-border text-center text-xs text-muted-foreground">
              <p>© 2024 LYRA Style Hub. All rights reserved.</p>
              <p className="mt-2">123 Luxury Lane, Bandra West, Mumbai 400050</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
