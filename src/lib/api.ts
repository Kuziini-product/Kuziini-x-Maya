/**
 * Centralized API helpers for admin operations.
 * All functions return typed data and throw on error.
 * Used by React Query hooks in @/hooks/use-admin.ts
 */

import type {
  GuestProfile,
  DailyConfirmation,
  DashboardStats,
  GuestMember,
} from "@/types";

// ─── Generic helpers ────────────────────────────────────────────────────────

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Eroare server.");
  return json.data as T;
}

function post<T>(url: string, body: Record<string, unknown>): Promise<T> {
  return request<T>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function patch<T>(url: string, body: Record<string, unknown>): Promise<T> {
  return request<T>(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function del<T>(url: string, body: Record<string, unknown>): Promise<T> {
  return request<T>(url, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ─── Dashboard ──────────────────────────────────────────────────────────────

export async function fetchDashboard() {
  return request<{ stats: DashboardStats }>("/api/admin/dashboard");
}

// ─── Guests ─────────────────────────────────────────────────────────────────

export async function fetchGuests() {
  return request<GuestProfile[]>("/api/admin/guests");
}

export async function fetchPendingGuests() {
  return request<GuestProfile[]>("/api/admin/guests/pending");
}

export async function createGuest(data: {
  name: string;
  phone: string;
  email: string;
  stayStart: string;
  stayEnd: string;
  groupSize: number;
  loungerId: string;
  loungerIds: string[];
  members: GuestMember[];
  creditEnabled: boolean;
  creditLimit: number;
  notes: string;
}) {
  return post<GuestProfile>("/api/admin/guests", data);
}

export async function updateGuest(guestId: string, updates: Record<string, unknown>) {
  return patch<GuestProfile>(`/api/admin/guests/${guestId}`, updates);
}

export async function checkoutGuest(guestId: string) {
  return post<GuestProfile>(`/api/admin/guests/${guestId}/checkout`, {});
}

export async function approveRegistration(guestId: string) {
  return post<GuestProfile>(`/api/admin/guests/${guestId}/approve`, {});
}

export async function rejectRegistration(guestId: string) {
  return post<void>(`/api/admin/guests/${guestId}/reject`, {});
}

export async function addGuestMember(guestId: string, member: GuestMember) {
  return post<GuestProfile>(`/api/admin/guests/${guestId}/members`, { member });
}

export async function removeGuestMember(guestId: string, phone: string) {
  return del<GuestProfile>(`/api/admin/guests/${guestId}/members`, { phone });
}

export async function addGuestLounger(guestId: string, loungerId: string) {
  return post<GuestProfile>(`/api/admin/guests/${guestId}/loungers`, { loungerId });
}

export async function removeGuestLounger(guestId: string, loungerId: string) {
  return del<GuestProfile>(`/api/admin/guests/${guestId}/loungers`, { loungerId });
}

export async function relocateGuest(guestId: string, newLoungerId: string, reason: string) {
  return post<GuestProfile>(`/api/admin/guests/${guestId}/relocate`, { newLoungerId, reason });
}

export async function searchGuests(query: string) {
  return request<GuestProfile[]>(`/api/admin/guests?q=${encodeURIComponent(query)}`);
}

// ─── Daily Confirmations ────────────────────────────────────────────────────

interface DailyStatusData {
  confirmed: GuestProfile[];
  unconfirmed: GuestProfile[];
  confirmations: DailyConfirmation[];
  date: string;
}

export async function fetchDailyStatus() {
  return request<DailyStatusData>("/api/admin/daily");
}

export async function confirmDaily(guestId: string, loungerId: string, method: string) {
  return post<{ guest: GuestProfile; confirmation: DailyConfirmation }>(
    "/api/admin/daily/confirm",
    { guestId, loungerId, method }
  );
}

export async function deactivateAllDaily() {
  return post<{ deactivated: number }>("/api/admin/daily/deactivate", {});
}

// ─── Lounger Grid ───────────────────────────────────────────────────────────

export async function fetchLoungerAssignments() {
  const [dashData, guests] = await Promise.all([
    fetchDashboard(),
    fetchGuests(),
  ]);
  return { stats: dashData.stats, guests };
}

// ─── Kuziini Admin Dashboard ────────────────────────────────────────────────

import type {
  AdminData,
  OfferEntry,
  AnalyticsData,
  GalleryStatsData,
  AccessData,
  LoginEntry,
  OrderEntry,
  BillEntry,
} from "@/types/admin-dashboard";

export async function fetchAdminData() {
  return post<AdminData>("/api/admin", {});
}

export async function fetchOffers() {
  return post<OfferEntry[]>("/api/offers", { action: "list" });
}

export async function fetchClientProfiles(params: {
  logins: LoginEntry[];
  orders: OrderEntry[];
  billRequests: BillEntry[];
  offers: OfferEntry[];
}) {
  return post<AnalyticsData>("/api/analytics", {
    action: "getClientProfiles",
    ...params,
  });
}

export async function fetchGalleryStats() {
  return post<GalleryStatsData>("/api/analytics", { action: "getGalleryStats" });
}

export async function fetchAccessLog() {
  return post<AccessData>("/api/access-log", { action: "getLog" });
}

export async function fetchOnlineCount(): Promise<{ online: number; phones: string[] }> {
  const res = await fetch("/api/access-log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "getOnline" }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Eroare server.");
  return { online: json.online, phones: json.phones || [] };
}

export async function markAccessLogRead() {
  return post<void>("/api/access-log", { action: "markRead" });
}
