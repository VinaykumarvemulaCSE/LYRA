/**
 * LYRA API Configuration
 * ---------------------
 * Centralized control for the backend API connection.
 * Default is an empty string which points to the same domain (Vite Proxy/Vercel).
 * For Render/Stand-alone, we use the VITE_API_BASE_URL env var.
 */

const getApiBaseUrl = () => {
  const url = import.meta.env.VITE_API_BASE_URL;
  if (!url) return ""; // Fallback for Vercel/Same-domain
  
  // Ensure no trailing slash for consistency
  return url.endsWith("/") ? url.slice(0, -1) : url;
};

export const API_BASE_URL = getApiBaseUrl();

export const API_ROUTES = {
  RAZORPAY_ORDER: `${API_BASE_URL}/api/razorpay/order`,
  RAZORPAY_VERIFY: `${API_BASE_URL}/api/razorpay/verify`,
  UPLOAD: `${API_BASE_URL}/api/upload`,
  CONTACT: `${API_BASE_URL}/api/email/contact`,
  WELCOME_EMAIL: `${API_BASE_URL}/api/email/welcome`,
  SHIPPING_EMAIL: `${API_BASE_URL}/api/email/shipping`,
  DIAGNOSTICS: `${API_BASE_URL}/api/admin/diagnostics`,
};
