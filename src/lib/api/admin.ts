const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

async function fetchAdmin<T>(path: string, options: RequestInit = {}): Promise<T> {
  let token: string | null = null;
  
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('thrifted_auth_token');
  } else {
    try {
      // Dynamically import next/headers only on the server
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      token = cookieStore.get('thrifted_auth_token')?.value || null;
    } catch (e) {
      token = null;
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    cache: 'no-store',
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('thrifted_auth_token');
        localStorage.removeItem('thrifted_auth_user');
        document.cookie = 'thrifted_auth_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        document.cookie = 'thrifted_auth_role=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        window.location.href = '/auth/login';
        await new Promise(() => {});
      } else {
        const { redirect } = await import('next/navigation');
        redirect('/auth/login');
      }
    }
    const errorData = await res.json().catch(() => ({ error: 'Lỗi không xác định' }));
    throw new Error(errorData.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// ============================================
// DASHBOARD TYPES
// ============================================

export interface DashboardStats {
  totalOrders: number;
  ordersToday: number;
  revenueToday: number;
  totalProducts: number;
  totalUsers: number;
  pendingSellRequests: number;
  recentOrders: OrderSummary[];
  recentSellRequests: SellRequestSummary[];
  ordersByStatus: Array<{ status: string; count: number }>;
  topProducts: TopProduct[];
}

export interface OrderSummary {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string; email: string } | null;
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    price: number;
    size: string | null;
    product: { name: string; images: string[] };
  }>;
}

export interface SellRequestSummary {
  id: string;
  status: string;
  saleType: string;
  contactName: string;
  contactPhone: string;
  createdAt: string;
  items: Array<{ id: string; productName: string; images: string[] }>;
  user: { id: string; firstName: string; lastName: string; email: string; phone?: string } | null;
}

export interface TopProduct {
  id: string;
  name: string;
  images: string[];
  price: number;
  orderCount: number;
}

// ============================================
// ORDER TYPES
// ============================================

export interface AdminOrder {
  id: string;
  status: string;
  subtotal: number;
  shippingFee: number;
  tax: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  paymentContent: string | null;
  isDepositRequired: boolean;
  depositAmount: number | null;
  depositPaid: boolean;
  couponDiscount: number | null;
  orderNote: string | null;
  shippingName: string;
  shippingPhone: string;
  shippingEmail: string | null;
  shippingAddress: string;
  shippingCity: string;
  shippingDistrict: string;
  shippingWard?: string | null;
  shippingPostal?: string | null;
  trackingCode: string | null;   // Mã nội bộ SuperShip
  ghnTrackingCode: string | null; // Mã nội bộ ngắn 8 ký tự của SuperShip — dùng để giao/nhận hàng khi không quét mã vạch
  printedAt: string | null; // Thời điểm in nhãn vận đơn lần cuối
  shippingStatus: string | null; // SuperShip shipping status
  createdAt: string;
  updatedAt: string;
  user: { id: string; firstName: string; lastName: string; email: string } | null;
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    price: number;
    size: string | null;
    product: { id: string; name: string; slug: string; images: string[] };
  }>;
  hasReturnRequest?: boolean;
  returnRequestStatus?: string | null;
}

export interface AdminOrderListResponse {
  orders: AdminOrder[];
  total: number;
  page: number;
  limit: number;
}

// ============================================
// PRODUCT TYPES
// ============================================

export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  oldPrice: number | null;
  condition: string;
  conditionPercent: number | null;
  authenticType: string | null;
  isHotDeal: boolean;
  isNewArrival: boolean;
  status: string;
  stock: number;
  stockPerSize: Record<string, number> | null; // VD: {"S": 2, "M": 0, "L": 1}
  weight: number; // gram
  views: number;
  images: string[];
  tags: string[];
  sizes: string[];
  sizingRong: string | null;
  sizingDai: string | null;
  sizingBung: string | null;
  sizingDayQuan: string | null;
  sizingOngQuan: string | null;
  categoryId: string | null;
  brandId: string | null;
  sellerId: string | null;
  category: { id: string; name: string; slug: string } | null;
  brand: { id: string; name: string; slug: string } | null;
  seller?: { id: string; firstName: string; lastName: string; email: string } | null;
  productAttributes?: Array<{
    id: string;
    attributeValueId: string;
    attributeValue: {
      id: string;
      value: string;
      attribute: { id: string; name: string };
    };
  }>;
  createdAt: string;
  updatedAt: string;
  seoTitle: string | null;
  seoDescription: string | null;
  scheduledAt: string | null;
  scheduledBy: string | null;
}

export interface AdminProductListResponse {
  products: AdminProduct[];
  total: number;
  page: number;
  limit: number;
}

// ============================================
// USER TYPES
// ============================================

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  phone: string | null;
  role: string;
  isEmailVerified: boolean;
  createdAt: string;
  _count?: { orders: number; sellRequests: number };
}

export interface AdminUserListResponse {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
}

// ============================================
// BLOG TYPES
// ============================================

export interface AdminBlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImage: string;
  category: string;
  tags: string[];
  published: boolean;
  publishedAt: string | null;
  readTime: number | null;
  author: { id: string; firstName: string; lastName: string };
  createdAt: string;
  updatedAt: string;
  seoTitle: string | null;
  seoDescription: string | null;
}

export interface AdminBlogListResponse {
  posts: AdminBlogPost[];
  total: number;
  page: number;
  limit: number;
}

// ============================================
// COUPON TYPES
// ============================================

export interface AdminCoupon {
  id: string;
  code: string;
  description: string | null;
  discountPercent: number | null;
  discountAmount: number | null;
  minOrderValue: number | null;
  maxDiscount: number | null;
  maxUses: number | null;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  createdAt: string;
}

export interface AdminCouponListResponse {
  coupons: AdminCoupon[];
  total: number;
  page: number;
  limit: number;
}

// ============================================
// DASHBOARD API
// ============================================

export async function getDashboardStats(): Promise<DashboardStats> {
  return fetchAdmin<DashboardStats>('/admin/dashboard/stats');
}

// ============================================
// ORDERS API
// ============================================

export async function getAdminOrders(params?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  hasReturnRequest?: boolean;
}): Promise<AdminOrderListResponse> {
  const sp = new URLSearchParams();
  if (params?.status) sp.set('status', params.status);
  if (params?.search) sp.set('search', params.search);
  if (params?.page) sp.set('page', String(params.page));
  if (params?.limit) sp.set('limit', String(params.limit));
  if (params?.hasReturnRequest) sp.set('hasReturnRequest', 'true');
  const qs = sp.toString();
  return fetchAdmin<AdminOrderListResponse>(`/admin/orders${qs ? `?${qs}` : ''}`);
}

export async function getAdminOrder(id: string): Promise<AdminOrder> {
  return fetchAdmin<AdminOrder>(`/admin/orders/${id}`);
}

export async function updateOrderStatus(id: string, status: string): Promise<AdminOrder> {
  return fetchAdmin<AdminOrder>(`/admin/orders/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function confirmOrder(id: string): Promise<AdminOrder> {
  return fetchAdmin<AdminOrder>(`/admin/orders/${id}/confirm`, {
    method: 'PATCH',
  });
}

export async function cancelOrder(id: string, reason: string): Promise<AdminOrder> {
  return fetchAdmin<AdminOrder>(`/admin/orders/${id}/cancel`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });
}

export async function batchConfirmOrders(orderIds: string[]): Promise<{
  succeeded: number;
  failed: number;
  total: number;
  message: string;
}> {
  return fetchAdmin(`/admin/orders/batch-confirm`, {
    method: 'POST',
    body: JSON.stringify({ orderIds }),
  });
}

export async function printShippingLabels(orderIds?: string[], trackingCodes?: string[]): Promise<{ token: string; url: string }> {
  return fetchAdmin(`/shipping/print`, {
    method: 'POST',
    body: JSON.stringify({ orderIds, trackingCodes }),
  });
}

export async function resetPrintedLabels(orderIds?: string[]): Promise<void> {
  return fetchAdmin(`/shipping/reset-printed`, {
    method: 'POST',
    body: JSON.stringify({ orderIds }),
  });
}

export async function updateOrderPaymentStatus(id: string, paymentStatus: string): Promise<AdminOrder> {
  return fetchAdmin<AdminOrder>(`/admin/orders/${id}/payment`, {
    method: 'PATCH',
    body: JSON.stringify({ paymentStatus }),
  });
}

export async function updateOrderDepositStatus(id: string, depositPaid: boolean): Promise<AdminOrder> {
  return fetchAdmin<AdminOrder>(`/admin/orders/${id}/deposit`, {
    method: 'PATCH',
    body: JSON.stringify({ depositPaid }),
  });
}

export async function rejectOrder(id: string, reason: string): Promise<AdminOrder> {
  return fetchAdmin<AdminOrder>(`/admin/orders/${id}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });
}

export interface EditOrderPayload {
  items?: { productId: string; quantity: number; price: number; size?: string }[];
  shippingName?: string;
  shippingPhone?: string;
  shippingEmail?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingDistrict?: string;
  shippingWard?: string;
  shippingPostal?: string;
  shippingFee?: number;
}

export async function updateOrder(id: string, payload: EditOrderPayload): Promise<AdminOrder> {
  return fetchAdmin<AdminOrder>(`/admin/orders/${id}/edit`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function createSupershipOrder(orderId: string): Promise<{ success: boolean; trackingCode: string }> {
  return fetchAdmin<{ success: boolean; trackingCode: string }>(`/shipping/orders`, {
    method: 'POST',
    body: JSON.stringify({ orderId }),
  });
}

// ============================================
// SHIPPING MANAGEMENT API
// ============================================

export interface ShippingSummary {
  pendingOrders: number;
  shippedOrders: number;
  returnedOrders: number;
  failedNotifs: number;
}

export interface ShippingOrder {
  id: string;
  status: string;
  total: number;
  paymentStatus: string;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingDistrict: string;
  shippingWard?: string | null;
  shippingPostal?: string | null;
  trackingCode: string | null;
  shippingStatus: string | null;
  createdAt: string;
  updatedAt: string;
  user: { id: string; firstName: string; lastName: string; email?: string; phone?: string } | null;
}

export async function getShippingSummary(): Promise<ShippingSummary> {
  return fetchAdmin<ShippingSummary>('/admin/shipping/summary');
}

export async function getShippingAll(tab: string = 'pending', page: number = 1, limit: number = 20) {
  return fetchAdmin<{
    summary: ShippingSummary;
    pendingData: { orders: ShippingOrder[]; total: number; page: number; limit: number };
    activeData: { orders: ShippingOrder[]; total: number; page: number; limit: number };
    returnedData: { orders: ShippingOrder[]; total: number; page: number; limit: number };
  }>(`/admin/shipping/all?tab=${tab}&page=${page}&limit=${limit}`);
}

export async function getPendingShipOrders(params?: { page?: number; limit?: number }) {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  return fetchAdmin<{ orders: ShippingOrder[]; total: number; page: number; limit: number }>(
    `/admin/shipping/pending?page=${page}&limit=${limit}`
  );
}

export async function getActiveShipOrders(params?: { page?: number; limit?: number }) {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  return fetchAdmin<{ orders: ShippingOrder[]; total: number; page: number; limit: number }>(
    `/admin/shipping/active?page=${page}&limit=${limit}`
  );
}

export async function getReturnedShipOrders(params?: { page?: number; limit?: number }) {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  return fetchAdmin<{ orders: ShippingOrder[]; total: number; page: number; limit: number }>(
    `/admin/shipping/returned?page=${page}&limit=${limit}`
  );
}

export async function createSupershipOrderManual(orderId: string): Promise<{ success: boolean; trackingCode: string }> {
  return fetchAdmin<{ success: boolean; trackingCode: string }>(`/admin/shipping/create/${orderId}`, {
    method: 'POST',
  });
}

export async function cancelSupershipOrder(orderId: string): Promise<{ success: boolean }> {
  return fetchAdmin<{ success: boolean }>(`/admin/shipping/cancel/${orderId}`, {
    method: 'DELETE',
  });
}

export async function trackSupershipOrder(trackingCode: string) {
  return fetchAdmin<any>(`/admin/shipping/track/${encodeURIComponent(trackingCode)}`);
}

export async function syncSupershipByOrderId(orderId: string) {
  return fetchAdmin<any>(`/admin/shipping/sync/${orderId}`);
}

export async function syncSupershipByTrackingCode(trackingCode: string) {
  return fetchAdmin<any>(`/admin/shipping/sync-by-tracking/${encodeURIComponent(trackingCode)}`);
}

export async function printSuperShipLabel(orderIds?: string[], trackingCodes?: string[]) {
  return fetchAdmin<{ token: string; url: string }>('/shipping/print', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderIds, trackingCodes }),
  });
}

// ============================================
// ADMIN NOTIFICATIONS API
// ============================================

export interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, any> | null;
  isRead: boolean;
  createdAt: string;
}

export async function getAdminNotifications(params?: { page?: number; limit?: number; unreadOnly?: boolean }) {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  const unread = params?.unreadOnly ? '&unreadOnly=true' : '';
  return fetchAdmin<{
    notifications: AdminNotification[];
    total: number;
    unreadCount: number;
    page: number;
    limit: number;
  }>(`/admin/notifications?page=${page}&limit=${limit}${unread}`);
}

export async function markNotificationRead(id: string): Promise<{ ok: boolean }> {
  return fetchAdmin<{ ok: boolean }>(`/admin/notifications/${id}/read`, { method: 'PATCH' });
}

export async function markAllNotificationsRead(): Promise<{ ok: boolean }> {
  return fetchAdmin<{ ok: boolean }>('/admin/notifications/read-all', { method: 'PATCH' });
}

export async function deleteNotification(id: string): Promise<{ ok: boolean }> {
  return fetchAdmin<{ ok: boolean }>(`/admin/notifications/${id}`, { method: 'DELETE' });
}

// ============================================
// PRODUCTS API
// ============================================

export async function getAdminProducts(params?: {
  status?: string;
  brand?: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<AdminProductListResponse> {
  const sp = new URLSearchParams();
  if (params?.status) sp.set('status', params.status);
  if (params?.brand) sp.set('brand', params.brand);
  if (params?.category) sp.set('category', params.category);
  if (params?.search) sp.set('search', params.search);
  if (params?.page) sp.set('page', String(params.page));
  if (params?.limit) sp.set('limit', String(params.limit));
  const qs = sp.toString();
  return fetchAdmin<AdminProductListResponse>(`/admin/products${qs ? `?${qs}` : ''}`);
}

export async function getAdminProduct(id: string): Promise<AdminProduct> {
  return fetchAdmin<AdminProduct>(`/admin/products/${id}`);
}

export async function createProduct(data: Partial<AdminProduct>): Promise<AdminProduct> {
  return fetchAdmin<AdminProduct>('/admin/products', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateProduct(id: string, data: Partial<AdminProduct>): Promise<AdminProduct> {
  return fetchAdmin<AdminProduct>(`/admin/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function patchProduct(id: string, data: Partial<AdminProduct>): Promise<AdminProduct> {
  return fetchAdmin<AdminProduct>(`/admin/products/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteProduct(id: string): Promise<void> {
  await fetchAdmin(`/admin/products/${id}`, { method: 'DELETE' });
}

// ============================================
// USERS API
// ============================================

export async function getAdminUsers(params?: {
  role?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<AdminUserListResponse> {
  const sp = new URLSearchParams();
  if (params?.role) sp.set('role', params.role);
  if (params?.search) sp.set('search', params.search);
  if (params?.page) sp.set('page', String(params.page));
  if (params?.limit) sp.set('limit', String(params.limit));
  const qs = sp.toString();
  return fetchAdmin<AdminUserListResponse>(`/admin/users${qs ? `?${qs}` : ''}`);
}

export async function getAdminUser(id: string): Promise<AdminUser> {
  return fetchAdmin<AdminUser>(`/admin/users/${id}`);
}

export async function updateUser(id: string, data: { role?: string; isDisabled?: boolean }): Promise<AdminUser> {
  return fetchAdmin<AdminUser>(`/admin/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function getAdminUserOrders(id: string): Promise<AdminOrderListResponse> {
  return fetchAdmin<AdminOrderListResponse>(`/admin/users/${id}/orders`);
}

// ============================================
// BLOG API
// ============================================

export async function getAdminBlogPosts(params?: {
  category?: string;
  published?: string;
  page?: number;
  limit?: number;
}): Promise<AdminBlogListResponse> {
  const sp = new URLSearchParams();
  if (params?.category) sp.set('category', params.category);
  if (params?.published) sp.set('published', params.published);
  if (params?.page) sp.set('page', String(params.page));
  if (params?.limit) sp.set('limit', String(params.limit));
  const qs = sp.toString();
  return fetchAdmin<AdminBlogListResponse>(`/admin/blog${qs ? `?${qs}` : ''}`);
}

export async function getAdminBlogPost(id: string): Promise<AdminBlogPost> {
  return fetchAdmin<AdminBlogPost>(`/admin/blog/${id}`);
}

export async function createBlogPost(data: Partial<AdminBlogPost>): Promise<AdminBlogPost> {
  return fetchAdmin<AdminBlogPost>('/admin/blog', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateBlogPost(id: string, data: Partial<AdminBlogPost>): Promise<AdminBlogPost> {
  return fetchAdmin<AdminBlogPost>(`/admin/blog/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteBlogPost(id: string): Promise<void> {
  await fetchAdmin(`/admin/blog/${id}`, { method: 'DELETE' });
}

// ============================================
// COUPONS API
// ============================================

export async function getAdminCoupons(params?: {
  isActive?: string;
  page?: number;
  limit?: number;
}): Promise<AdminCouponListResponse> {
  const sp = new URLSearchParams();
  if (params?.isActive) sp.set('isActive', params.isActive);
  if (params?.page) sp.set('page', String(params.page));
  if (params?.limit) sp.set('limit', String(params.limit));
  const qs = sp.toString();
  return fetchAdmin<AdminCouponListResponse>(`/admin/coupons${qs ? `?${qs}` : ''}`);
}

export async function getAdminCoupon(id: string): Promise<AdminCoupon> {
  return fetchAdmin<AdminCoupon>(`/admin/coupons/${id}`);
}

export async function createCoupon(data: Partial<AdminCoupon>): Promise<AdminCoupon> {
  return fetchAdmin<AdminCoupon>('/admin/coupons', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCoupon(id: string, data: Partial<AdminCoupon>): Promise<AdminCoupon> {
  return fetchAdmin<AdminCoupon>(`/admin/coupons/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteCoupon(id: string): Promise<void> {
  await fetchAdmin(`/admin/coupons/${id}`, { method: 'DELETE' });
}

// ============================================
// ATTRIBUTES API
// ============================================

export interface AdminAttribute {
  id: string;
  name: string;
  values: Array<{ id: string; value: string }>;
}

export async function getAdminAttributes(): Promise<AdminAttribute[]> {
  return fetchAdmin<AdminAttribute[]>('/admin/attributes');
}

// ============================================
// CATEGORIES API
// ============================================

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  parentId?: string | null;
  _count?: { products: number };
}

export async function getAdminCategories(): Promise<AdminCategory[]> {
  return fetchAdmin<AdminCategory[]>('/admin/categories');
}
// ============================================
// SETTINGS API
// ============================================

export interface ShopConfig {
  bankId: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  shopName: string;
  shopPhone: string;
  pickupProvince: string;
  pickupDistrict: string;
  pickupWard: string;
  pickupAddress: string;
  freeShippingThreshold: number;
  defaultShippingFee: number;
  allowReturnDays: number;
  allowReturn: boolean;
  requireReturnImage: boolean;
  footerLogo: string | null;
  businessLicense: string | null;
  licenseDate: string | null;
  taxCode: string | null;
  ownerName: string | null;
}

export async function getShopConfig(): Promise<ShopConfig> {
  return fetchAdmin<ShopConfig>('/admin/settings/bank');
}

export async function getBankConfig(): Promise<ShopConfig> {
  return fetchAdmin('/admin/settings/bank');
}

export async function updateBankConfig(data: Partial<ShopConfig>): Promise<void> {
  await fetchAdmin('/admin/settings/bank', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ============================================
// REVENUE TYPES
// ============================================

export interface RevenueSummary {
  revenueToday: number;
  revenueYesterday: number;
  revenueThisMonth: number;
  revenueThisYear: number;
  totalRevenue: number;
  totalOrdersAllTime: number;
  ordersToday: number;
  ordersThisMonth: number;
  ordersThisYear: number;
  avgOrderValue: number;
  growthToday: number;
}

export interface DailyRevenue {
  date: string;
  revenue: number;
  orders: number;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  orders: number;
}

export interface YearlyRevenue {
  year: number;
  revenue: number;
  orders: number;
}

export interface RevenueData {
  summary: RevenueSummary;
  daily: DailyRevenue[];
  monthly: MonthlyRevenue[];
  yearly: YearlyRevenue[];
}

// ============================================
// REVENUE API
// ============================================

export async function getRevenueData(): Promise<RevenueData> {
  return fetchAdmin<RevenueData>('/admin/revenue');
}

// ============================================
// SITE TEXTS API
// ============================================

export interface SiteText {
  id: string;
  key: string;
  value: string;
  category: string;
  updatedAt: string;
}

export async function getSiteTexts(): Promise<SiteText[]> {
  return fetchAdmin<SiteText[]>('/site-texts/admin');
}

export async function upsertSiteText(key: string, value: string, category?: string): Promise<SiteText> {
  return fetchAdmin<SiteText>('/site-texts', {
    method: 'PUT',
    body: JSON.stringify({ key, value, category }),
  });
}

export async function bulkUpsertSiteTexts(texts: Array<{ key: string; value: string; category?: string }>): Promise<{ success: number; total: number }> {
  return fetchAdmin<{ success: number; total: number }>('/site-texts/bulk', {
    method: 'PUT',
    body: JSON.stringify({ texts }),
  });
}

export async function deleteSiteText(key: string): Promise<void> {
  await fetchAdmin(`/site-texts/${encodeURIComponent(key)}`, { method: 'DELETE' });
}

// ============================================
// RETURN REQUEST API
// ============================================

export async function getReturnRequests(params?: { status?: string; page?: number; limit?: number }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  return fetchAdmin<{
    requests: ReturnRequestAdmin[];
    total: number;
    pendingCount: number;
    page: number;
    limit: number;
    pages: number;
  }>(`/return-requests?${qs}`);
}

export async function getReturnRequestAdminDetail(id: string) {
  return fetchAdmin<ReturnRequestAdmin>(`/return-requests/${id}`);
}

export async function approveReturnRequest(id: string, adminNote?: string) {
  return fetchAdmin(`/admin/return-requests/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ action: 'approve', adminNote }),
  });
}

export async function rejectReturnRequest(id: string, adminNote: string) {
  return fetchAdmin(`/admin/return-requests/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ action: 'reject', adminNote }),
  });
}

export async function completeReturnRequest(id: string) {
  return fetchAdmin(`/admin/return-requests/${id}/complete`, {
    method: 'PATCH',
  });
}

export interface ReturnRequestAdmin {
  id: string;
  orderId: string;
  userId: string;
  reason: string;
  reasonText?: string | null;
  images: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  adminNote?: string | null;
  adminId?: string | null;
  approvedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  order: {
    id: string;
    total: number;
    status: string;
    paymentMethod: string;
    paymentStatus: string;
    shippingName: string;
    shippingPhone: string;
    shippingCity: string;
    shippingDistrict: string;
    shopName?: string | null;
    pickupAddress?: string | null;
    pickupWard?: string | null;
    pickupDistrict?: string | null;
    pickupProvince?: string | null;
    pickupPhone?: string | null;
    createdAt: string;
    deliveredAt?: string | null;
    items: {
      id: string;
      product: { id: string; name: string; images: string[] };
    }[];
  };
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
  };
  admin?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}
