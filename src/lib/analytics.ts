/**
 * Analytics Utility
 * Implements the requested event taxonomy for LYRA-STYLE-HUB.
 * Currently logs to console, ready for backend integration in Phase 2.
 */

interface CommonProperties {
  user_id?: string;
  anonymous_id?: string;
  session_id?: string;
  timestamp: string;
  page_path: string;
  page_title: string;
  referrer: string;
  device_type?: string;
  platform?: string;
  locale?: string;
  screen_width: number;
  screen_height: number;
}

export class Analytics {
  private static sessionId: string = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

  private static getCommonProperties(): CommonProperties {
    return {
      session_id: this.sessionId,
      timestamp: new Date().toISOString(),
      page_path: window.location.pathname,
      page_title: document.title,
      referrer: document.referrer,
      locale: navigator.language,
      screen_width: window.innerWidth,
      screen_height: window.innerHeight,
    };
  }

  /**
   * Base track method
   */
  static track(eventName: string, properties?: Record<string, any>) {
    const payload = {
      event: eventName,
      properties: { ...this.getCommonProperties(), ...properties },
    };
    
    // In Phase 2, this will send to backend/analytics provider
    console.log(`[ANALYTICS] ${eventName}`, payload);
  }

  // --- Page Lifecycle ---
  static pageView(properties?: { user_id?: string; referrer?: string }) {
    this.track('page_view', properties);
  }
  static pageLoad(properties: { load_time_ms: number; network_type?: string }) {
    this.track('page_load', properties);
  }
  static pageUnload(properties: { duration_seconds: number }) {
    this.track('page_unload', properties);
  }

  // --- Product Interactions ---
  static productImpression(p: { product_id: string; sku?: string; position?: number; list_name?: string; price?: number; currency?: string; category?: string }) {
    this.track('product_impression', p);
  }
  static productClick(p: { product_id: string; sku?: string; list_name?: string; position?: number; price?: number; currency?: string }) {
    this.track('product_click', p);
  }
  static productView(p: { product_id: string; sku?: string; variant?: string; price?: number; currency?: string; stock_status?: string }) {
    this.track('product_view', p);
  }
  static productVariantSelect(p: { product_id: string; sku?: string; variant_key: string; variant_value: string }) {
    this.track('product_variant_select', p);
  }
  static productImageZoom(p: { product_id: string; image_index: number }) {
    this.track('product_image_zoom', p);
  }
  static productShare(p: { product_id: string; channel: string }) {
    this.track('product_share', p);
  }

  // --- Cart Events ---
  static addToCart(p: { product_id: string; sku?: string; quantity: number; price?: number; currency?: string; cart_id?: string }) {
    this.track('add_to_cart', p);
  }
  static removeFromCart(p: { product_id: string; sku?: string; quantity: number; cart_id?: string }) {
    this.track('remove_from_cart', p);
  }
  static updateCartQuantity(p: { product_id: string; sku?: string; old_quantity: number; new_quantity: number; cart_id?: string }) {
    this.track('update_cart_quantity', p);
  }
  static cartView(p: { cart_id?: string; item_count: number; total_amount: number; currency?: string }) {
    this.track('cart_view', p);
  }

  // --- Checkout & Payment ---
  static beginCheckout(p: { cart_id?: string; total_amount: number; currency?: string; items: any[] }) {
    this.track('begin_checkout', p);
  }
  static addShippingInfo(p: { shipping_method: string; shipping_cost: number; address_id?: string }) {
    this.track('add_shipping_info', p);
  }
  static addPaymentInfo(p: { payment_method: string; payment_provider: string }) {
    this.track('add_payment_info', p);
  }
  static applyCoupon(p: { coupon_code: string; discount_amount: number; currency?: string }) {
    this.track('apply_coupon', p);
  }
  static removeCoupon(p: { coupon_code: string }) {
    this.track('remove_coupon', p);
  }
  static purchase(p: { order_id: string; user_id?: string; total_amount: number; currency?: string; payment_status: string; items: any[] }) {
    this.track('purchase', p);
  }
  static paymentFailed(p: { order_id: string; error_code?: string; error_message: string }) {
    this.track('payment_failed', p);
  }

  // --- Authentication & Account ---
  static signup(p: { user_id: string; method: 'email' | 'google' | string }) {
    this.track('signup', p);
  }
  static login(p: { user_id: string; method: string }) {
    this.track('login', p);
  }
  static logout(p: { user_id: string }) {
    this.track('logout', p);
  }
  static passwordResetRequest(p: { user_id?: string; method: string }) {
    this.track('password_reset_request', p);
  }
  static profileUpdate(p: { user_id: string; fields_changed: string[] }) {
    this.track('profile_update', p);
  }

  // --- Search & Discovery ---
  static searchQuery(p: { query: string; result_count: number; filters_applied?: string[] }) {
    this.track('search_query', p);
  }
  static searchResultClick(p: { query: string; product_id: string; position: number }) {
    this.track('search_result_click', p);
  }
  static filterApply(p: { filter_type: string; filter_value: string; result_count: number }) {
    this.track('filter_apply', p);
  }
  static sortApply(p: { sort_by: string; direction: 'asc' | 'desc' }) {
    this.track('sort_apply', p);
  }

  // --- Navigation & UI Interactions ---
  static ctaClick(p: { cta_id: string; label?: string }) {
    this.track('cta_click', p);
  }
  static menuOpen(p: { menu_id: string }) {
    this.track('menu_open', p);
  }
  static infiniteScrollLoad(p: { page: number; items_loaded: number }) {
    this.track('infinite_scroll_load', p);
  }
  static heroInteraction(p: { hero_id: string; action: 'play' | 'pause' | 'cta_click' | string }) {
    this.track('hero_interaction', p);
  }
  static skeletonShown(p: { component: string; duration_ms: number }) {
    this.track('skeleton_shown', p);
  }

  // --- Wishlist & Engagement ---
  static wishlistAdd(p: { user_id?: string; product_id: string; sku?: string }) {
    this.track('wishlist_add', p);
  }
  static wishlistRemove(p: { user_id?: string; product_id: string }) {
    this.track('wishlist_remove', p);
  }
  static emailOpen(p: { email_id: string; campaign_id?: string; user_id?: string }) {
    this.track('email_open', p);
  }
  static emailClick(p: { email_id: string; campaign_id?: string; link_id: string }) {
    this.track('email_click', p);
  }

  // --- Admin / Management ---
  static adminProductCreate(p: { admin_id: string; product_id: string }) {
    this.track('admin_product_create', p);
  }
  static adminProductUpdate(p: { admin_id: string; product_id: string; fields_changed: string[] }) {
    this.track('admin_product_update', p);
  }
  static adminProductDelete(p: { admin_id: string; product_id: string }) {
    this.track('admin_product_delete', p);
  }
  static adminInventoryUpdate(p: { admin_id: string; product_id: string; old_stock: number; new_stock: number }) {
    this.track('admin_inventory_update', p);
  }
  static adminOrderStatusChange(p: { admin_id: string; order_id: string; old_status: string; new_status: string }) {
    this.track('admin_order_status_change', p);
  }

  // --- Marketing & Promotions ---
  static promoView(p: { promo_id: string; location: string }) {
    this.track('promo_view', p);
  }
  static promoClick(p: { promo_id: string; campaign_id?: string }) {
    this.track('promo_click', p);
  }
  static affiliateClick(p: { affiliate_id: string; campaign_id?: string }) {
    this.track('affiliate_click', p);
  }

  // --- System & Errors ---
  static apiError(p: { endpoint: string; status_code: number; error_message: string; request_id?: string }) {
    this.track('api_error', p);
  }
  static dbError(p: { operation: string; error_message: string }) {
    this.track('db_error', p);
  }
  static clientError(p: { error_type: string; stack_trace?: string }) {
    this.track('client_error', p);
  }
  static featureFlagEvaluated(p: { flag_key: string; variant: string; user_id?: string }) {
    this.track('feature_flag_evaluated', p);
  }

  // --- Performance & Telemetry ---
  static resourceTiming(p: { resource: string; duration_ms: number }) {
    this.track('resource_timing', p);
  }
  static firstContentfulPaint(p: { value_ms: number }) {
    this.track('first_contentful_paint', p);
  }
  static largestContentfulPaint(p: { value_ms: number }) {
    this.track('largest_contentful_paint', p);
  }
  static interactionToNextPaint(p: { value_ms: number }) {
    this.track('interaction_to_next_paint', p);
  }
}
