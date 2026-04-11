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
  name?: string;
  email?: string;
  role: UserRole;
  sessionId: string;
  umbrellaId: string;
  homeUmbrellaId?: string; // umbrella where user is registered at reception
  isRegistered: boolean;   // registered at reception (any umbrella)
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
  promoLabel?: string; // marketing name from banner (different from menuItem.name)
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
  deliveryUmbrellaId: string;  // where to deliver (scanned umbrella)
  billingUmbrellaId: string;   // which umbrella's bill to charge
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

// ─── Closed Bill (History) ───────────────────────────────────────────────────

export interface ClosedBill {
  id: string;
  umbrellaId: string;
  orders: Order[];
  total: number;
  paymentMethod: PaymentMethod;
  closedAt: string;
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
  canOrder: boolean;
  canRequestBill: boolean;
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
  image?: string; // base64 data URL
  color: string;
  order: number;
  instagramUrl?: string; // Kuziini: link to Instagram post
  menuItemId?: string;   // Maya: menu item to add to cart on click
}

export type BannerCategory = "Maya" | "kuziini";

// ─── Admin Users ─────────────────────────────────────────────────────────────

export type AdminRole = "super_admin" | "content_admin" | "guest_admin";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: AdminRole;
  passwordHash: string;
  active: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

// ─── Guest Management ────────────────────────────────────────────────────────

export type GuestStatus = "pending_validation" | "registered" | "active" | "inactive" | "checked_out";

export interface GuestMember {
  phone: string;
  name: string;
  email: string;
}

export interface GuestProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  members: GuestMember[];
  loungerIds: string[];
  loungerId: string;
  stayStart: string;
  stayEnd: string;
  status: GuestStatus;
  creditEnabled: boolean;
  creditLimit?: number;
  creditUsed?: number;
  registeredAt: string;
  registeredBy: string;
  notes?: string;
  groupSize?: number;
  loungerHistory?: LoungerHistoryEntry[];
}

export interface DailyConfirmation {
  id: string;
  guestId: string;
  date: string;
  confirmedAt: string;
  confirmedBy: string;
  loungerId: string;
  method: "qr_scan" | "manual";
}

export interface LoungerAssignment {
  loungerId: string;
  guestId: string | null;
  guestName: string | null;
  guestPhone: string | null;
  date: string;
  confirmedToday: boolean;
}

export interface LoungerHistoryEntry {
  date: string;
  loungerId: string;
  action: "assigned" | "relocated_from" | "relocated_to";
  reason?: string;
  timestamp: string;
  by: string;
}

export interface DashboardStats {
  totalLoungers: number;
  loungersInUse: number;
  freeLoungers: number;
  activeGuests: number;
  pendingOrders: number;
  totalGuestsToday: number;
  creditGuestsCount: number;
}

