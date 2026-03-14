// ─── Core Entities ───────────────────────────────────────────────────────────

export type UserRole = "owner" | "guest" | "unknown";

export interface Umbrella {
  id: string;
  number: string;
  zone: string;
  locationName: string;
  locationLogo?: string;
  active: boolean;
  sessionId: string | null;
}

export interface Session {
  id: string;
  umbrellaId: string;
  ownerId: string | null;
  ownerPhone: string | null;
  startedAt: string;
  expiresAt: string | null;
  closed: boolean;
}

export interface UserSession {
  phone: string;
  role: UserRole;
  sessionId: string;
  umbrellaId: string;
  joinedAt: string;
}

// ─── Menu ─────────────────────────────────────────────────────────────────────

export type MenuCategorySlug =
  | "bar"
  | "cocktails"
  | "shots"
  | "beer"
  | "starters"
  | "pasta"
  | "pizza"
  | "sea"
  | "land"
  | "sides"
  | "desserts"
  | "restaurant"
  | "snacks"
  | "ice-cream"
  | "food"
  | "water"
  | "soft-drinks"
  | "energy-drinks"
  | "wine";

export interface MenuCategory {
  slug: MenuCategorySlug;
  name: string;
  icon: string;
  order: number;
}

export interface MenuItem {
  id: string;
  categorySlug: MenuCategorySlug;
  name: string;
  description: string;
  price: number;
  currency: string;
  image?: string;
  available: boolean;
  tags?: string[];
  allergens?: string[];
  popular?: boolean;
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export type OrderStatus =
  | "pending"
  | "sent"
  | "confirmed"
  | "preparing"
  | "delivering"
  | "delivered"
  | "rejected"
  | "cancelled";

export type OrderVisibility = "own" | "shared-with-owner";

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

export interface Order {
  id: string;
  umbrellaId: string;
  sessionId: string;
  guestPhone: string;
  role: UserRole;
  items: OrderItem[];
  subtotal: number;
  total: number;
  status: OrderStatus;
  visibility: OrderVisibility;
  createdAt: string;
  updatedAt: string;
  ownerApprovalRequired: boolean;
  ownerApproved: boolean | null;
}

// ─── Guest Join Request ───────────────────────────────────────────────────────

export type GuestJoinRequestStatus = "pending" | "approved" | "rejected";

export interface GuestJoinRequest {
  id: string;
  umbrellaId: string;
  sessionId: string;
  guestPhone: string;
  orderId: string;
  status: GuestJoinRequestStatus;
  createdAt: string;
}

// ─── Bill ─────────────────────────────────────────────────────────────────────

export type PaymentMethod = "cash" | "card" | "room-charge";

export type BillStatus = "open" | "requested" | "closed";

export interface Bill {
  id: string;
  umbrellaId: string;
  sessionId: string;
  orders: Order[];
  subtotal: number;
  total: number;
  status: BillStatus;
  paymentMethod?: PaymentMethod;
  closedAt?: string;
}

// ─── Credit ──────────────────────────────────────────────────────────────────

export interface CreditStatus {
  eligible: boolean;
  roomNumber?: string;
  guestName?: string;
  limitTotal: number;
  limitUsed: number;
  limitAvailable: number;
  currency: string;
}

export interface PaymentOptions {
  cash: boolean;
  card: boolean;
  roomCharge: boolean;
  creditStatus?: CreditStatus;
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PromoBanner {
  id: string;
  title: string;
  subtitle?: string;
  emoji?: string;
  color: string;
}
