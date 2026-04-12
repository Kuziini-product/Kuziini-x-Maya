import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api";
import type { GuestProfile, GuestMember } from "@/types";

// ─── Query Keys ─────────────────────────────────────────────────────────────

export const queryKeys = {
  dashboard: ["admin", "dashboard"] as const,
  guests: ["admin", "guests"] as const,
  pendingGuests: ["admin", "guests", "pending"] as const,
  dailyStatus: ["admin", "daily"] as const,
  // Kuziini admin
  adminData: ["admin", "kuziini", "data"] as const,
  offers: ["admin", "kuziini", "offers"] as const,
  clientProfiles: ["admin", "kuziini", "clients"] as const,
  galleryStats: ["admin", "kuziini", "gallery-stats"] as const,
  accessLog: ["admin", "kuziini", "access-log"] as const,
  onlineUsers: ["admin", "kuziini", "online"] as const,
};

// ─── Dashboard ──────────────────────────────────────────────────────────────

export function useDashboard(options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: api.fetchDashboard,
    refetchInterval: options?.refetchInterval ?? 15_000,
  });
}

// ─── Guest List ─────────────────────────────────────────────────────────────

export function useGuests() {
  return useQuery({
    queryKey: queryKeys.guests,
    queryFn: api.fetchGuests,
  });
}

export function useGuestUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ guestId, updates }: { guestId: string; updates: Record<string, unknown> }) =>
      api.updateGuest(guestId, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.guests });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useGuestCheckout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (guestId: string) => api.checkoutGuest(guestId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.guests });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

// ─── Pending Registrations ──────────────────────────────────────────────────

export function usePendingGuests(options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: queryKeys.pendingGuests,
    queryFn: api.fetchPendingGuests,
    refetchInterval: options?.refetchInterval ?? 10_000,
  });
}

export function useApproveRegistration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (guestId: string) => api.approveRegistration(guestId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.pendingGuests });
      qc.invalidateQueries({ queryKey: queryKeys.guests });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useRejectRegistration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (guestId: string) => api.rejectRegistration(guestId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.pendingGuests });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

// ─── Daily Confirmations ────────────────────────────────────────────────────

export function useDailyStatus() {
  return useQuery({
    queryKey: queryKeys.dailyStatus,
    queryFn: api.fetchDailyStatus,
  });
}

export function useConfirmDaily() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ guestId, loungerId, method }: { guestId: string; loungerId: string; method: string }) =>
      api.confirmDaily(guestId, loungerId, method),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.dailyStatus });
      qc.invalidateQueries({ queryKey: queryKeys.guests });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useDeactivateAll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.deactivateAllDaily(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.dailyStatus });
      qc.invalidateQueries({ queryKey: queryKeys.guests });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

// ─── Guest Members ──────────────────────────────────────────────────────────

export function useAddMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ guestId, member }: { guestId: string; member: GuestMember }) =>
      api.addGuestMember(guestId, member),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.guests });
    },
  });
}

export function useRemoveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ guestId, phone }: { guestId: string; phone: string }) =>
      api.removeGuestMember(guestId, phone),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.guests });
    },
  });
}

// ─── Guest Loungers ─────────────────────────────────────────────────────────

export function useAddLounger() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ guestId, loungerId }: { guestId: string; loungerId: string }) =>
      api.addGuestLounger(guestId, loungerId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.guests });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useRemoveLounger() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ guestId, loungerId }: { guestId: string; loungerId: string }) =>
      api.removeGuestLounger(guestId, loungerId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.guests });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useRelocateGuest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ guestId, newLoungerId, reason }: { guestId: string; newLoungerId: string; reason: string }) =>
      api.relocateGuest(guestId, newLoungerId, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.guests });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

// ─── Kuziini Admin Dashboard ────────────────────────────────────────────────

export function useAdminData(enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.adminData,
    queryFn: api.fetchAdminData,
    enabled,
    refetchInterval: 15_000,
  });
}

export function useOffers(enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.offers,
    queryFn: api.fetchOffers,
    enabled,
  });
}

export function useGalleryStats(enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.galleryStats,
    queryFn: api.fetchGalleryStats,
    enabled,
  });
}

export function useAccessLog(enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.accessLog,
    queryFn: api.fetchAccessLog,
    enabled,
  });
}

export function useOnlineUsers(enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.onlineUsers,
    queryFn: api.fetchOnlineCount,
    enabled,
    refetchInterval: 30_000,
  });
}
