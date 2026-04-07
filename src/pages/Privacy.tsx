export default function Privacy() {
  return (
    <main className="pt-24 pb-16 min-h-screen">
      <div className="container max-w-3xl">
        <div className="glass-strong rounded-2xl p-8 md:p-12">
          <h1 className="font-heading text-3xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mb-8">Last updated: March 29, 2026</p>
          <div className="prose prose-sm max-w-none text-muted-foreground [&_h2]:font-heading [&_h2]:text-foreground [&_h2]:font-bold [&_h2]:text-lg [&_h2]:mt-8 [&_h2]:mb-3">
            <h2>Information We Collect</h2>
            <p>We collect information you provide directly including name, email, postal address, phone number, and payment information when you create an account or make a purchase.</p>
            <h2>How We Use Your Information</h2>
            <ul><li>To process and fulfill your orders</li><li>To communicate about your account</li><li>To improve our website and service</li><li>To detect and prevent fraud</li></ul>
            <h2>Cookies and Tracking</h2>
            <p>We use cookies and similar technologies to track activity on our site. You can instruct your browser to refuse cookies.</p>
            <h2>Data Security</h2>
            <p>We use industry-standard encryption to protect your data during transmission. No method of transmission is 100% secure.</p>
            <h2>Your Rights</h2>
            <p>You may have the right to access, correct, or delete your personal data. Contact us to exercise these rights.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
