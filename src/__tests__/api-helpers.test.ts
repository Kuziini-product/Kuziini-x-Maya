import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Import after mock setup
import {
  fetchDashboard,
  fetchGuests,
  fetchPendingGuests,
  updateGuest,
  checkoutGuest,
  approveRegistration,
  rejectRegistration,
  fetchDailyStatus,
  searchGuests,
} from "@/lib/api";

function mockSuccess(data: unknown) {
  mockFetch.mockResolvedValueOnce({
    json: () => Promise.resolve({ success: true, data }),
  });
}

function mockError(error: string) {
  mockFetch.mockResolvedValueOnce({
    json: () => Promise.resolve({ success: false, error }),
  });
}

beforeEach(() => {
  mockFetch.mockClear();
});

describe("fetchDashboard", () => {
  it("calls GET /api/admin/dashboard", async () => {
    const stats = { totalLoungers: 400 };
    mockSuccess({ stats });
    const result = await fetchDashboard();
    expect(result.stats.totalLoungers).toBe(400);
    expect(mockFetch).toHaveBeenCalledWith("/api/admin/dashboard", undefined);
  });

  it("throws on error response", async () => {
    mockError("Neautorizat.");
    await expect(fetchDashboard()).rejects.toThrow("Neautorizat.");
  });
});

describe("fetchGuests", () => {
  it("calls GET /api/admin/guests", async () => {
    mockSuccess([{ id: "g1", name: "Test" }]);
    const result = await fetchGuests();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Test");
  });
});

describe("fetchPendingGuests", () => {
  it("calls GET /api/admin/guests/pending", async () => {
    mockSuccess([]);
    const result = await fetchPendingGuests();
    expect(result).toEqual([]);
    expect(mockFetch).toHaveBeenCalledWith("/api/admin/guests/pending", undefined);
  });
});

describe("updateGuest", () => {
  it("calls PATCH /api/admin/guests/:id", async () => {
    mockSuccess({ id: "g1", name: "Updated" });
    await updateGuest("g1", { name: "Updated" });
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/admin/guests/g1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ name: "Updated" }),
      })
    );
  });
});

describe("checkoutGuest", () => {
  it("calls POST /api/admin/guests/:id/checkout", async () => {
    mockSuccess({ id: "g1", status: "checked_out" });
    await checkoutGuest("g1");
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/admin/guests/g1/checkout",
      expect.objectContaining({ method: "POST" })
    );
  });
});

describe("approveRegistration", () => {
  it("calls POST /api/admin/guests/:id/approve", async () => {
    mockSuccess({ id: "g1", status: "registered" });
    await approveRegistration("g1");
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/admin/guests/g1/approve",
      expect.objectContaining({ method: "POST" })
    );
  });
});

describe("rejectRegistration", () => {
  it("calls POST /api/admin/guests/:id/reject", async () => {
    mockSuccess(undefined);
    await rejectRegistration("g1");
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/admin/guests/g1/reject",
      expect.objectContaining({ method: "POST" })
    );
  });
});

describe("fetchDailyStatus", () => {
  it("calls GET /api/admin/daily", async () => {
    mockSuccess({ confirmed: [], unconfirmed: [], date: "2026-04-12" });
    const result = await fetchDailyStatus();
    expect(result.date).toBe("2026-04-12");
  });
});

describe("searchGuests", () => {
  it("encodes query parameter", async () => {
    mockSuccess([]);
    await searchGuests("Ion & Maria");
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/admin/guests?q=Ion%20%26%20Maria",
      undefined
    );
  });
});

describe("error handling", () => {
  it("throws with server error message", async () => {
    mockError("Oaspete negăsit.");
    await expect(updateGuest("x", {})).rejects.toThrow("Oaspete negăsit.");
  });

  it("throws generic message when no error provided", async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ success: false }),
    });
    await expect(fetchGuests()).rejects.toThrow("Eroare server.");
  });
});
