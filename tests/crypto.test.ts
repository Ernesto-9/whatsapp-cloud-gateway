import { describe, it, expect, beforeAll } from "vitest";
import { encrypt, decrypt } from "@/lib/crypto";

beforeAll(() => {
  process.env.TOKEN_ENC_KEY = "a".repeat(64); // 32 bytes hex
});

describe("crypto", () => {
  it("round-trips a value", () => {
    const secret = "EAAG-meta-token-123";
    const enc = encrypt(secret);
    expect(enc).not.toContain(secret);
    expect(decrypt(enc)).toBe(secret);
  });

  it("produces different ciphertext each time (random IV)", () => {
    expect(encrypt("same")).not.toBe(encrypt("same"));
  });

  it("throws on bad key length", () => {
    process.env.TOKEN_ENC_KEY = "short";
    expect(() => encrypt("x")).toThrow();
    process.env.TOKEN_ENC_KEY = "a".repeat(64);
  });
});
