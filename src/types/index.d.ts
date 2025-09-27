// Type definitions for Axion Lighting Solutions

export interface Product {
  _id: string;
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  rating: number;
  image: string;
  inStock: boolean;
  images: string[];
  slug: string;
  discount?: number;
  variants?: Array<{
    _id: string;
    name: string;
    type: 'color' | 'size' | 'text' | 'dropdown';
    required: boolean;
    options: Array<{
      _id: string;
      label: string;
      value: string;
      priceModifier: number;
      stock: number;
      image?: string;
      sku?: string;
      subVariants?: Array<{
        _id: string;
        name: string;
        type: 'color' | 'size' | 'text' | 'dropdown';
        required: boolean;
        options: Array<{
          _id: string;
          label: string;
          value: string;
          priceModifier: number;
          stock: number;
          image?: string;
          sku?: string;
          subSubVariants?: Array<{
            _id: string;
            name: string;
            type: 'color' | 'size' | 'text' | 'dropdown';
            required: boolean;
            options: Array<{
              _id: string;
              label: string;
              value: string;
              priceModifier: number;
              stock: number;
              image?: string;
              sku?: string;
              customProperties?: Record<string, unknown>;
              specifications: { name: string; value: string }[];
            }>;
          }>;
          customProperties?: Record<string, unknown>;
          specifications: { name: string; value: string }[];
        }>;
      }> | string | undefined;
      customProperties?: Record<string, unknown>;
      specifications: { name: string; value: string }[];
    }>;
  }>;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  variants?: Array<{
    variantName: string;
    optionValue: string;
    optionLabel?: string;
    optionDetails?: {
      priceModifier?: number;
      sku?: string;
      customProperties?: Record<string, unknown>;
    };
    subVariants?: Array<{
      subVariantName: string;
      optionValue: string;
      optionLabel?: string;
      optionDetails?: {
        priceModifier?: number;
        sku?: string;
        customProperties?: Record<string, unknown>;
      };
      subSubVariants?: Array<{
        subSubVariantName: string;
        optionValue: string;
        optionLabel?: string;
        optionDetails?: {
          priceModifier?: number;
          sku?: string;
          customProperties?: Record<string, unknown>;
        };
      }>;
    }>;
  }>;
}

export interface BlogPost {
  tags: string[];
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  publishedAt: string;
  category: string;
  image: string;
  slug: string;
  date: string;
  description: string;
}

// types/index.ts (or wherever you keep types)
export interface Project {
  id: string;
  slug: string;
  title: string;
  overview: string;
  content?: string;
  keyFeatures?: string;
  technicalSpecs?: {
    projectType?: string;
    location?: string;
    completion?: string;
    duration?: string;
    team?: string;
  };
  clientTestimonial?: {
    text: string;
    author: string;
  };
  category?: string;
  style?: string;
  location?: string;
  date?: string;
  tags?: string[];
  features?: string[]; // optional array (legacy)
  specs?: {
    type?: string;
    location?: string;
    completion?: string;
    duration?: string;
    team?: string;
  };
  image?: string;       // fallback image
  images?: string[];    // gallery
  testimonial?: {
    text: string;
    author: string;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isAdmin: boolean;
  image: string;
}

export interface OrderItem {
  _id:string;
  saleName?: string;
  salePercent?: number;
  name: string;
  qty: number;
  quantity: number;
  image: string;
  price: number;
  product: string;
  color: string;
  shippingPrice: number;
  size: string;
  variants?: Array<{
    variantName: string;
    optionValue: string;
    optionLabel?: string;
    optionDetails?: {
      priceModifier?: number;
      sku?: string;
      customProperties?: Record<string, unknown>;
    };
    subVariants?: Array<{
      subVariantName: string;
      optionValue: string;
      optionLabel?: string;
      optionDetails?: {
        priceModifier?: number;
        sku?: string;
        customProperties?: Record<string, unknown>;
      };
      subSubVariants?: Array<{
        subSubVariantName: string;
        optionValue: string;
        optionLabel?: string;
        optionDetails?: {
          priceModifier?: number;
          sku?: string;
          customProperties?: Record<string, unknown>;
        };
      }>;
    }>;
  }>;
}

interface ShippingAddress {
  fullName: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
}
export interface SalesData {
  date: string;   // ISO date string, e.g. "2025-09-05"
  value: number;  // revenue
  label: string;  // formatted label for chart, e.g. "Sep 5"
  discountPercent:number;
  categorySlugs:string | undefined;
  productIds:string[]
  endsAt:string
}

interface OrderData {
  id: string;
  _id: string;
  orderId: string;
  images: string[];
  slug: string;
  name: string;
  status: string;
  date: string;
  rating: number;
  image: string;
  price: number;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    isAdmin: boolean;
    image: string;
  } | null;
  orderItems: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  itemsPrice: number;
  shippingPrice: number;
  taxPrice: number;
  totalPrice: number;
  customerEmail: string;
  isPaid: boolean;
  paidAt: Date | null;
  isDelivered: boolean;
  deliveredAt: Date | null;
  isConfirmed?: boolean;
  confirmedAt?: Date | null;
  isShipped?: boolean;
  shippedAt?: Date | null;
  createdAt: Date;
  isCancelled: boolean;
  cancelledAt: Date | null;
}