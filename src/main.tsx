import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initCsrfToken } from '@/lib/api-config';

// Initialize core security protocols
initCsrfToken();

createRoot(document.getElementById("root")!).render(<App />);

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.log('SW registration failed: ', err);
    });
  });
}
