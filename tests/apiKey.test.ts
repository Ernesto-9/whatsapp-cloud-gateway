import { describe, it, expect } from "vitest";
import { generateApiKey, hashApiKey } from "@/lib/apiKey";

describe("apiKey", () => {
  it("generates a prefixed key", () => {
    const key = generateApiKey();
    expect(key.startsWith("wag_")).toBe(true);
    expect(key.length).toBeGreaterThan(20);
  });

  it("hashes deterministically", () => {
    expect(hashApiKey("wag_abc")).toBe(hashApiKey("wag_abc"));
    expect(hashApiKey("wag_abc")).not.toBe(hashApiKey("wag_xyz"));
  });

  it("hash is hex sha-256 (64 chars)", () => {
    expect(hashApiKey("wag_abc")).toMatch(/^[0-9a-f]{64}$/);
  });
});
