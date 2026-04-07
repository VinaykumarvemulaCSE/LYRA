export default function Refund() {
  return (
    <main className="pt-24 pb-16 min-h-screen">
      <div className="container max-w-3xl">
        <div className="glass-strong rounded-2xl p-8 md:p-12">
          <h1 className="font-heading text-3xl font-bold mb-2">Return & Refund Policy</h1>
          <p className="text-sm text-muted-foreground mb-8">Your satisfaction is our priority</p>
          <div className="prose prose-sm max-w-none text-muted-foreground [&_h2]:font-heading [&_h2]:text-foreground [&_h2]:font-bold [&_h2]:text-lg [&_h2]:mt-8 [&_h2]:mb-3">
            <h2>14-Day Return Window</h2>
            <p>We accept returns of unworn, unwashed, and undamaged items with original tags within 14 days of delivery.</p>
            <h2>How to Initiate a Return</h2>
            <ol><li>Log into your account and go to "My Orders"</li><li>Select the order and click "Initiate Return"</li><li>Follow instructions to generate a return label</li><li>Package items securely and drop off at the carrier</li></ol>
            <h2>Refund Process</h2>
            <p>Once received and inspected, approved refunds will be processed within 5-7 business days to your original payment method.</p>
            <h2>Non-Returnable Items</h2>
            <ul><li>Items marked as "Final Sale"</li><li>Intimates and swimwear</li><li>Gift cards</li></ul>
            <h2>Exchanges</h2>
            <p>We don't offer direct exchanges. Please return the original and place a new order.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
