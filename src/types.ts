export type Language = 'en' | 'ar';
export type Currency = 'SAR' | 'USD';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

export enum CouponDiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed'
}

export enum PopupType {
  WELCOME = 'welcome',
  COUPON = 'coupon',
  NEWSLETTER = 'newsletter',
  ANNOUNCEMENT = 'announcement'
}

export interface ProductVariant {
  weight: string;
  priceSAR: number;
  stock: number;
}

export interface Review {
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Product {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  sku: string;
  category: string;
  images: string[];
  priceSAR: number;
  stock: number;
  variants: ProductVariant[];
  rating: number;
  reviewsCount: number;
  reviews?: Review[];
  isBestSeller: boolean;
  isNewArrival: boolean;
}

export interface Category {
  id: string;
  nameEn: string;
  nameAr: string;
  slug: string;
  image: string;
  productCount: number;
}

export interface CartItem {
  product: Product;
  variantIndex: number; // -1 if no variant (uses base price)
  quantity: number;
}

export interface Coupon {
  id: string;
  code: string;
  type: CouponDiscountType;
  value: number;
  minOrderSAR: number;
  maxDiscountSAR: number;
  usageLimit: number;
  usedCount: number;
  expiryDate: string;
  createdAt: string;
}

export interface PopupConfig {
  id: string;
  type: PopupType;
  titleEn: string;
  titleAr: string;
  contentEn: string;
  contentAr: string;
  imageUrl?: string;
  couponId?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Order {
  id: string;
  userId: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  shippingAddress: {
    street: string;
    city: string;
    zipCode: string;
    country: string;
  };
  items: {
    productId: string;
    productNameEn: string;
    productNameAr: string;
    weight: string;
    priceSAR: number;
    quantity: number;
    image: string;
  }[];
  subtotalSAR: number;
  discountSAR: number;
  deliveryChargeSAR: number;
  taxSAR: number;
  totalSAR: number;
  totalUSD: number;
  status: OrderStatus;
  paymentMethod: 'cod' | 'card' | 'bank';
  paymentStatus: 'pending' | 'paid';
  createdAt: string;
  updatedAt: string;
}

export interface CMSGlobalSettings {
  websiteName: string;
  logoUrl: string;
  faviconUrl: string;
  contactEmail: string;
  contactPhone: string;
  whatsappNumber: string;
  facebookUrl: string;
  instagramUrl: string;
  twitterUrl: string;
  shippingFee: number;
  freeShippingThreshold?: number; // threshold amount for free shipping
  paymentCodActive?: boolean;
  paymentCardActive?: boolean;
  paymentBankActive?: boolean;
  paymentBankDetailsEn?: string;
  paymentBankDetailsAr?: string;
  taxRatePercent: number;
  usdExchangeRate: number; // e.g. 0.27 to convert SAR to USD
  seoTitleEn: string;
  seoTitleAr: string;
  seoDescEn: string;
  seoDescAr: string;
}

export interface HomeSection {
  id: string;
  titleEn: string;
  titleAr: string;
  enabled: boolean;
  order: number;
}

export interface HeroSlide {
  id: string;
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
  buttonTextEn: string;
  buttonTextAr: string;
  imageUrl: string;
}

export interface FAQItem {
  id: string;
  questionEn: string;
  questionAr: string;
  answerEn: string;
  answerAr: string;
}

export interface CMSPagesContent {
  aboutEn: string;
  aboutAr: string;
  aboutImageUrl: string;
  contactEn: string;
  contactAr: string;
  termsEn: string;
  termsAr: string;
  privacyEn: string;
  privacyAr: string;
  returnPolicyEn: string;
  returnPolicyAr: string;
  shippingPolicyEn: string;
  shippingPolicyAr: string;
  faqs: FAQItem[];
  announcementTextEn: string;
  announcementTextAr: string;
  announcementActive: boolean;
  flashSaleActive: boolean;
  flashSaleEnd: string; // ISO string or simple dateTime
  flashSaleDiscountPercent: number;
}
