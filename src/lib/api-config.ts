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
  RAZORPAY_ORDER: `${API_BASE_URL}/api/razorpay-order`,
  RAZORPAY_VERIFY: `${API_BASE_URL}/api/razorpay-verify`,
  UPLOAD: `${API_BASE_URL}/api/upload`,
  CONTACT: `${API_BASE_URL}/api/email?type=contact`,
  WELCOME_EMAIL: `${API_BASE_URL}/api/email?type=welcome`,
  SHIPPING_EMAIL: `${API_BASE_URL}/api/email?type=shipping`,
  DIAGNOSTICS: `${API_BASE_URL}/api/admin?action=diagnostics`,
  MAINTENANCE: `${API_BASE_URL}/api/admin`,
  CSRF: `${API_BASE_URL}/api/csrf-token`,
};

export let csrfToken = "";

export async function initCsrfToken() {
  try {
    const res = await fetch(API_ROUTES.CSRF);
    if (res.ok) {
      const data = await res.json();
      csrfToken = data.token;
    }
  } catch (error) {
    console.warn("Could not fetch CSRF token", error);
  }
}
