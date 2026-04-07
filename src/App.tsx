import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/cart/CartDrawer";
import ScrollToTop from "@/components/layout/ScrollToTop";
import { StorefrontErrorBoundary } from "@/components/layout/ErrorBoundary";
import Index from "./pages/Index";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import NotFound from "./pages/NotFound";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import OrderTracking from "./pages/OrderTracking";
import Wishlist from "./pages/Wishlist";
import SearchResults from "./pages/SearchResults";
import Auth from "./pages/Auth";
import Account from "./pages/Account";
import ResetPassword from "./pages/ResetPassword";

import About from "./pages/About";
import Contact from "./pages/Contact";
import FAQ from "./pages/FAQ";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Refund from "./pages/Refund";
import Shipping from "./pages/Shipping";
import Blog from "./pages/Blog";
import Lookbook from "./pages/Lookbook";
import Maintenance from "./pages/Maintenance";
import Admin from "./pages/Admin";
import EmailPreviews from "./pages/EmailPreviews";
import Sustainability from "./pages/Sustainability";
import Careers from "./pages/Careers";
import Bestsellers from "./pages/Bestsellers";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
        <BrowserRouter>
          <StorefrontErrorBoundary>
            <ScrollToTop />
            <Navbar />
            <CartDrawer />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-confirmation" element={<OrderConfirmation />} />
              <Route path="/order-tracking" element={<OrderTracking />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/account" element={<Account />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              
              <Route path="/emails" element={<EmailPreviews />} />

              <Route path="/sustainability" element={<Sustainability />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/bestsellers" element={<Bestsellers />} />

              {/* Content & Legal Pages */}
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/refund" element={<Refund />} />
              <Route path="/shipping" element={<Shipping />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/lookbook" element={<Lookbook />} />
              <Route path="/maintenance" element={<Maintenance />} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Footer />
          </StorefrontErrorBoundary>
        </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;
