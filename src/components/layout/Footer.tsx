import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";

const footerLinks = {
  Shop: [
    { label: "Men's Collection", href: "/shop?category=Men" },
    { label: "Women's Collection", href: "/shop?category=Women" },
    { label: "Kids' Collection", href: "/shop?category=Kids" },
    { label: "Bestsellers", href: "/bestsellers" },
    { label: "Search Products", href: "/search" },
  ],
  Account: [
    { label: "My Profile", href: "/account" },
    { label: "Order History", href: "/account?tab=orders" },
    { label: "Saved Addresses", href: "/account?tab=addresses" },
    { label: "Notifications", href: "/account?tab=notifications" },
    { label: "Wishlist", href: "/wishlist" },
  ],
  About: [
    { label: "About Us", href: "/about" },
    { label: "Careers", href: "/careers" },
    { label: "Sustainability", href: "/sustainability" },
    { label: "The Journal/Blog", href: "/blog" },
  ],
  Help: [
    { label: "FAQ & Support", href: "/faq" },
    { label: "Shipping Policy", href: "/shipping" },
    { label: "Refunds & Returns", href: "/refund" },
    { label: "Contact Us", href: "/contact" },
  ],
};

export default function Footer() {
  const isExcluded = window.location.pathname.startsWith("/admin") || window.location.pathname === "/checkout";
  if (isExcluded) return null;

  return (
    <footer className="border-t border-border bg-background/60 backdrop-blur-md mt-auto relative z-10">
      <div className="container py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="font-heading text-3xl font-extrabold tracking-tight text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400 mb-4">LYRA</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Elevating everyday essentials. Professional, modern, and perfectly crafted clothing for all.
            </p>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-heading text-sm font-bold mb-5 text-foreground uppercase tracking-wider">
                {title}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
            <p className="text-xs text-muted-foreground font-medium">
              &copy; {new Date().getFullYear()} LYRA Fashion Commerece System. All rights reserved.
            </p>
            <span className="text-xs text-muted-foreground hidden md:inline">&middot;</span>
            <a
              href="https://my-portfolio-072007.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:text-blue-500 transition-colors font-bold inline-flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-full"
            >
              Built by vinaykumar <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="flex gap-6">
            <Link to="/privacy" className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
