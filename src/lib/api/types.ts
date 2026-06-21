// Product Types
export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  oldPrice?: number;
  condition: ProductCondition;
  conditionPercent?: number;
  authenticType?: AuthenticType;
  isHotDeal: boolean;
  isNewArrival: boolean;
  status: string; // "DRAFT", "AVAILABLE", "SOLD_OUT", "HIDDEN"
  stock: number; // Tổng tồn kho (legacy / computed từ stockPerSize)
  stockPerSize: Record<string, number> | null; // VD: {"S": 2, "M": 0, "L": 1}

  weight: number; // Trọng lượng tính bằng gram (shipping)
  views: number;
  
  images: string[];
  tags: string[];
  sizes: string[];

  // Flat sizing info
  sizingRong?: string;
  sizingDai?: string;
  sizingBung?: string;
  sizingDayQuan?: string;
  sizingOngQuan?: string;

  // Relations
  category?: Category;
  categoryId?: string;
  brand?: Brand;
  brandId?: string;
  seller?: User;
  sellerId?: string;
  seoTitle?: string;
  seoDescription?: string;

  createdAt: Date;
  updatedAt?: Date;

  productAttributes?: Array<{
    id: string;
    attributeValueId: string;
    attributeValue: {
      id: string;
      value: string;
      attribute: { id: string; name: string };
    };
  }>;
}

export interface CartItem {
  product: Product;
  quantity: number;
  size?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
  seoTitle?: string;
  seoDescription?: string;
}

export type ProductCondition = 
  | "NEW_WITH_TAGS" 
  | "LIKE_NEW" 
  | "EXCELLENT" 
  | "GOOD";

export type AuthenticType = 
  | "AUTHENTIC"
  | "LIKE_AUTHENTIC"
  | "REP_UNBRANDED"
  | "REP_BRANDED";

// Order Types
export interface Order {
  id: string;
  items: OrderItem[];
  status: OrderStatus;
  subtotal: number;
  shippingFee: number;
  tax: number;
  total: number;
  shippingAddress: Address;
  paymentMethod: PaymentMethod;
  paymentStatus: string;
  paymentContent: string | null;
  isDepositRequired: boolean;
  depositAmount: number | null;
  depositPaid: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  product: Product;
  quantity: number;
  price: number;
  size?: string;
}

export type OrderStatus = 
  | "PENDING" 
  | "PROCESSING" 
  | "SHIPPED" 
  | "DELIVERED" 
  | "CANCELLED";

export interface Address {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  postalCode?: string;
}

export type PaymentMethod = 
  | "COD" 
  | "BANK_TRANSFER" 
  | "CARD"
  | "VNPAY";

// Filter Types
export interface ProductFilter {
  categories?: string[]; // category slugs
  brands?: string[]; // brand slugs or names
  priceRange?: [number, number];
  conditions?: ProductCondition[];
  sizes?: string[];
  hotDealsOnly?: boolean;
  sortBy?: SortOption;
  hideOutOfStock?: boolean;
}

export type SortOption = 
  | "newest" 
  | "price-low" 
  | "price-high" 
  | "popular";

// Blog Types
export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: User;
  category: BlogCategory;
  tags: string[];
  readTime?: number;
  published: boolean;
  publishedAt?: Date;
  seoTitle?: string;
  seoDescription?: string;
}

export type BlogCategory = 
  | "FASHION" 
  | "AUTHENTIC_GUIDE" 
  | "NEWS" 
  | "LIFESTYLE";

// User Type (simplified for UI)
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  avatar?: string;
  isVerifiedSeller?: boolean;
  sellerRating?: number;
  totalSales?: number;
  createdAt?: string | Date;
}

// Brand Types
export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  country?: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
}

// Collection Types (Optional, can just be derived or mapped to Category)
export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  productCount?: number;
}

// Announcement Types
export interface Announcement {
  id: string;
  text: string;
  icon?: string;
  link?: string;
  isActive: boolean;
}

// Sell Request Item
export interface SellRequestItem {
  id: string;
  sellRequestId: string;
  productName: string;
  brandName: string;
  categoryName: string;
  condition: string;
  expectedPrice?: number;
  offeredPrice?: number;
  description?: string;
  images: string[];
  itemStatus: string;
  rejectionNote?: string;
  createdAt: string;
  updatedAt: string;
}

// Sell Request
export interface SellRequest {
  id: string;
  userId?: string;
  saleType: 'CONSIGNMENT' | 'BUYOUT';
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  deliveryMethod: 'SHOP_PICKUP' | 'SELF_SEND';
  pickupCity?: string;
  pickupAddress?: string;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  items: SellRequestItem[];
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
}

// Banner Types
export interface Banner {
  id: string;
  title?: string;
  description?: string;
  image: string;
  link?: string;
  button1Text?: string;
  button1Link?: string;
  button2Text?: string;
  button2Link?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Attribute Types
export interface Attribute {
  id: string;
  name: string;
  values: AttributeValue[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AttributeValue {
  id: string;
  attributeId: string;
  value: string;
  createdAt: Date;
  updatedAt: Date;
}
