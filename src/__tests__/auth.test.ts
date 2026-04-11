import { describe, it, expect } from "vitest";
import { hashPassword, getSessionToken, AuthError } from "@/lib/auth";

describe("hashPassword", () => {
  it("returns consistent hash for same input", async () => {
    const hash1 = await hashPassword("test123");
    const hash2 = await hashPassword("test123");
    expect(hash1).toBe(hash2);
  });

  it("returns different hash for different input", async () => {
    const hash1 = await hashPassword("test123");
    const hash2 = await hashPassword("test456");
    expect(hash1).not.toBe(hash2);
  });

  it("returns 64 character hex string", async () => {
    const hash = await hashPassword("anything");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("getSessionToken", () => {
  it("returns null for null cookie header", () => {
    expect(getSessionToken(null)).toBeNull();
  });

  it("returns null for empty cookie header", () => {
    expect(getSessionToken("")).toBeNull();
  });

  it("extracts token from single cookie", () => {
    expect(getSessionToken("maya_session=abc123")).toBe("abc123");
  });

  it("extracts token from multiple cookies", () => {
    expect(getSessionToken("other=foo; maya_session=abc123; bar=baz")).toBe("abc123");
  });

  it("returns null when maya_session not present", () => {
    expect(getSessionToken("other=foo; another=bar")).toBeNull();
  });
});

describe("AuthError", () => {
  it("has correct name and status", () => {
    const error = new AuthError("Test error", 403);
    expect(error.name).toBe("AuthError");
    expect(error.message).toBe("Test error");
    expect(error.status).toBe(403);
  });

  it("defaults to 401 status", () => {
    const error = new AuthError("Unauthorized");
    expect(error.status).toBe(401);
  });

  it("is instanceof Error", () => {
    const error = new AuthError("test");
    expect(error).toBeInstanceOf(Error);
  });
});
