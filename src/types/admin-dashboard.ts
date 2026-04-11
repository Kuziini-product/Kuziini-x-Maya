export interface Stats {
  totalLogins: number;
  uniquePhones: number;
  totalOrders: number;
  totalRevenue: number;
  totalBillRequests: number;
  paymentBreakdown: Record<string, number>;
}

export interface UmbrellaInfo {
  id: string;
  zone: string;
  active: boolean;
  hasSession: boolean;
  ownerPhone: string | null;
  sessionStarted: string | null;
}

export interface LoginEntry {
  name: string;
  phone: string;
  email: string;
  umbrellaId: string;
  timestamp: string;
}

export interface OrderEntry {
  orderId: string;
  umbrellaId: string;
  phone: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  timestamp: string;
}

export interface BillEntry {
  umbrellaId: string;
  paymentMethod: string;
  amount: number;
  timestamp: string;
}

export interface AdminData {
  stats: Stats;
  umbrellas: UmbrellaInfo[];
  logins: LoginEntry[];
  orders: OrderEntry[];
  billRequests: BillEntry[];
}

export interface OfferEntry {
  id: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  photoUrl: string;
  photoIndex?: number;
  photoIndexes?: number[];
  timestamp: string;
  read: boolean;
}

export interface ClientProfile {
  phone: string;
  name: string;
  email: string;
  source: ("receptie" | "oferta")[];
  totalVisits: number;
  firstVisit: string;
  lastVisit: string;
  totalSpent: number;
  totalOrders: number;
  avgPerVisit: number;
  paymentMethods: Record<string, number>;
  kuziiniPhotosViewed: number;
  kuziiniPhotoLikes: number;
  offerRequests: number;
  offerDetails: { message: string; photoUrl: string; timestamp: string }[];
  umbrellas: string[];
}

export interface PhotoStatEntry {
  index: number;
  likes: number;
  views: number;
}

export interface AnalyticsData {
  clients: ClientProfile[];
  photoStats: PhotoStatEntry[];
  totalPhotoViews: number;
  uniqueViewers: number;
}

export type ClientSort = "spent" | "visits" | "recent" | "orders" | "name";
export type ClientFilter = "all" | "receptie" | "oferta";

export interface GalleryUserStat {
  sessionId: string;
  photosViewed: number;
  totalTimeSpent: number;
  photoDetails: { photoIndex: number; timestamp: string; duration: number }[];
  likes: number;
  firstView: string;
  lastView: string;
}

export interface GalleryPhotoStat {
  index: number;
  likes: number;
  views: number;
  avgDuration: number;
  totalDuration: number;
}

export interface GalleryStatsData {
  users: GalleryUserStat[];
  photos: GalleryPhotoStat[];
  hourlyViews: number[];
  totalViews: number;
  uniqueViewers: number;
  totalTimeSpent: number;
}

export interface AccessUser {
  name: string;
  phone: string;
  email: string;
  totalAccess: number;
  firstAccess: string;
  lastAccess: string;
  pages: { page: string; action: string; umbrellaId: string; timestamp: string }[];
}

export interface AccessData {
  unread: number;
  totalEntries: number;
  users: AccessUser[];
}

export type Tab = "overview" | "logins" | "orders" | "bills" | "umbrellas" | "banners" | "gallery" | "offers" | "clients" | "rapoarte" | "guest-dashboard" | "guest-checkin" | "guest-pending" | "guest-list" | "guest-daily" | "guest-loungers" | "admin-users";
