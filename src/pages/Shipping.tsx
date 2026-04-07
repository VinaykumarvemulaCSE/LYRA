export default function Shipping() {
  return (
    <main className="pt-24 pb-16 min-h-screen">
      <div className="container max-w-3xl">
        <div className="glass-strong rounded-2xl p-8 md:p-12">
          <h1 className="font-heading text-3xl font-bold mb-2">Shipping Policy</h1>
          <p className="text-sm text-muted-foreground mb-8">Fast, reliable delivery across India</p>
          <div className="prose prose-sm max-w-none text-muted-foreground [&_h2]:font-heading [&_h2]:text-foreground [&_h2]:font-bold [&_h2]:text-lg [&_h2]:mt-8 [&_h2]:mb-3">
            <h2>Processing Times</h2>
            <p>All orders are processed within 1-2 business days. You'll receive a notification when shipped.</p>
            <h2>Shipping Rates</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left my-4 text-sm">
                <thead><tr className="border-b-2 border-border/30"><th className="py-2 font-heading font-bold text-foreground">Method</th><th className="py-2 font-heading font-bold text-foreground">Delivery</th><th className="py-2 font-heading font-bold text-foreground">Price</th></tr></thead>
                <tbody>
                  <tr className="border-b border-border/30"><td className="py-2">Standard</td><td className="py-2">3-5 business days</td><td className="py-2">₹500 (Free over ₹15,000)</td></tr>
                  <tr className="border-b border-border/30"><td className="py-2">Express</td><td className="py-2">1-2 business days</td><td className="py-2">₹1,200</td></tr>
                </tbody>
              </table>
            </div>
            <h2>International Shipping</h2>
            <p>We ship internationally. Charges calculated at checkout. Import duties are the customer's responsibility.</p>
            <h2>Order Tracking</h2>
            <p>You'll receive tracking info via email within 48 hours of shipment.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
