import { describe, it, expect } from "vitest";
import { formatPrice, generateId, getOrderStatusLabel, cn } from "@/lib/utils";

describe("formatPrice", () => {
  it("formats integer price with currency", () => {
    expect(formatPrice(150)).toBe("150 RON");
  });

  it("formats decimal price without decimals", () => {
    expect(formatPrice(99.5)).toBe("100 RON");
  });

  it("uses custom currency", () => {
    expect(formatPrice(50, "EUR")).toBe("50 EUR");
  });

  it("formats zero", () => {
    expect(formatPrice(0)).toBe("0 RON");
  });
});

describe("generateId", () => {
  it("returns a string of 8 characters", () => {
    const id = generateId();
    expect(typeof id).toBe("string");
    expect(id.length).toBe(8);
  });

  it("returns unique ids", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});

describe("getOrderStatusLabel", () => {
  it("returns Romanian labels for all statuses", () => {
    expect(getOrderStatusLabel("pending")).toBe("În așteptare");
    expect(getOrderStatusLabel("confirmed")).toBe("Confirmată");
    expect(getOrderStatusLabel("delivered")).toBe("Livrată");
    expect(getOrderStatusLabel("rejected")).toBe("Respinsă");
    expect(getOrderStatusLabel("cancelled")).toBe("Anulată");
  });
});

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("px-2", "py-2")).toBe("px-2 py-2");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("resolves tailwind conflicts", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});
