import { describe, it, expect, vi, beforeEach } from "vitest";

const state = { apiKeys: [] as any[] };

vi.mock("@/db", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({ limit: async () => state.apiKeys.slice(0, 1) }),
      }),
    }),
  },
}));
vi.mock("@/db/schema", () => ({
  waApiKeys: { keyHash: "key_hash", revokedAt: "revoked_at" },
}));

import { resolveClientRef } from "@/lib/auth";
import { hashApiKey } from "@/lib/apiKey";

beforeEach(() => { state.apiKeys = []; });

describe("resolveClientRef", () => {
  it("returns null without Bearer header", async () => {
    expect(await resolveClientRef(null)).toBeNull();
    expect(await resolveClientRef("Token x")).toBeNull();
  });

  it("returns client_ref for a valid key", async () => {
    const key = "wag_valid";
    state.apiKeys = [{ clientRef: "seguros", keyHash: hashApiKey(key) }];
    expect(await resolveClientRef(`Bearer ${key}`)).toBe("seguros");
  });

  it("returns null when key not found", async () => {
    state.apiKeys = [];
    expect(await resolveClientRef("Bearer wag_nope")).toBeNull();
  });
});
