# Lyra Style Hub: Backend Integration Roadmap

This document outlines the required backend architecture and API integrations necessary to transform the Lyra Style Hub frontend into a fully functional, 100% production-ready, scalable e-commerce platform.

## 1. Authentication & User Management (Firebase Auth)
- [x] **Email & Password Authentication:** Connect the `/auth` signup and login forms to Firebase Authentication.
- [x] **Third-Party Providers:** Implement Google/Apple Sign-in options for a frictionless UX.
- [x] **Password Reset:** Connect the "Forgot Password" flow to Firebase's password reset email service.
- [x] **Secure User Sessions:** Implement persistent, token-based user sessions across the application.
- [x] **Account Profile DB:** Create a Firestore `users` collection to store saved addresses, order history, and preferences.

## 2. Product Catalog & Inventory Management (Firestore)
- [x] **Database Migration:** Move all mock products from `src/data/products.ts` into a structured Firestore `products` collection.
- [x] **Dynamic Fetching:** Update `Shop.tsx`, `Index.tsx`, and `Lookbook.tsx` to fetch products dynamically from the database.
- [ ] **Category & Filtering Engine:** Implement backend-side filtering (price, category, material) using Firestore queries to ensure performance at scale.
- [ ] **Search Indexing:** Integrate Algolia or Firestore text search for the global Navbar autocomplete search.
- [ ] **Inventory Tracking:** Track stock levels per size/color variant and prevent checkout if an item is out of stock.

## 3. Cart & Order Processing
- [ ] **Persistent Cart:** Sync the local React Context cart to Firestore (for logged-in users) or localStorage (for guests) so users don't lose items when refreshing.
- [ ] **Order Generation:** Create a secure backend endpoint (via Firebase Cloud Functions) to generate unique Order IDs and store order details in an `orders` collection.
- [ ] **Order Status Flow:** Implement order state management (Pending, Paid, Shipped, Delivered) and reflect this in the user's "My Orders" area.

## 4. Payment Gateway (Razorpay Integration)
- [ ] **Secure Order Creation API:** Create a Cloud Function to securely generate a Razorpay Order ID on the backend using the total checkout value.
- [ ] **Frontend Integration:** Integrate the Razorpay Checkout JS script in `Checkout.tsx`.
- [ ] **Webhook Listener:** Create a backend endpoint to listen for Razorpay webhooks (`payment.captured`, `payment.failed`) to securely update the order status in Firestore, preventing client-side spoofing.
- [ ] **Automated Invoicing:** Automatically generate and email invoices to the user upon successful payment.

## 5. Admin Panel (Secured Routes)
- [x] **Role-Based Access Control (RBAC):** Restrict access to `/admin` to users with the 'admin' custom claim in Firebase Auth. Protect the frontend route and backend endpoints.
- [x] **Product CRUD APIs:** Connect the Admin forms to Firestore to Create, Read, Update, and Delete products securely.
- [x] **Media Upload Engine:** Connect the Cover Image and Gallery drag-and-drop zones to GitHub CMS via secure Serverless functions.
- [ ] **Real-time Analytics:** Connect the dashboard stats to aggregate queries (e.g., total sales this month, active users) using Firebase Cloud Functions counters.

## 6. Community & Content
- [ ] **Product Reviews:** Connect the Review Dialog in `ProductReviews.tsx` to a `reviews` Firestore subcollection. Implement review moderation features in the Admin panel.
- [ ] **Contact Form Routing:** Wire `Contact.tsx` to a Cloud Function using Nodemailer or SendGrid to securely dispatch contact emails to the support team.
- [ ] **Promotions Engine:** Create a Firestore collection for discount codes and validate them securely on the backend during the checkout phase.

## 7. Performance & Next-Level Production Polish
- [ ] **Image Optimization:** Implement a CDN (like Cloudinary or Firebase Hosting's image optimization) to serve automatically compressed and correctly sized WebP/AVIF variants of the product images.
- [ ] **SEO Meta Tags:** Dynamically inject Open Graph and Twitter Card tags based on the loaded product in `ProductDetail.tsx` for social sharing.
- [ ] **Error Monitoring:** Integrate Sentry to catch and log any production frontend or backend errors seamlessly.
