import { describe, it, expect, vi, beforeEach } from "vitest";

const inserted = { accounts: [] as any[], apiKeys: [] as any[] };
vi.mock("@/db", () => ({
  db: {
    insert: (t: any) => ({
      values: (v: any) => ({
        returning: async () => {
          const bucket = t.__table === "accounts" ? inserted.accounts : inserted.apiKeys;
          const row = { id: `${t.__table}-1`, ...v };
          bucket.push(row);
          return [row];
        },
      }),
    }),
  },
}));
vi.mock("@/db/schema", () => ({
  waAccounts: { __table: "accounts" },
  waApiKeys: { __table: "apiKeys" },
}));
vi.mock("@/lib/crypto", () => ({ encrypt: (s: string) => `enc:${s}` }));

import { POST } from "@/app/api/v1/accounts/route";

const req = (body: unknown, auth = "Bearer admin-secret") =>
  new Request("http://t/v1/accounts", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: auth },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  inserted.accounts = []; inserted.apiKeys = [];
  process.env.ADMIN_API_KEY = "admin-secret";
});

describe("POST /v1/accounts", () => {
  it("401 without admin key", async () => {
    const res = await POST(req({}, "Bearer wrong"));
    expect(res.status).toBe(401);
  });

  it("400 on missing fields", async () => {
    const res = await POST(req({ clientRef: "seguros" }));
    expect(res.status).toBe(400);
  });

  it("creates account + api key, encrypts token, returns key once", async () => {
    const res = await POST(req({
      clientRef: "seguros", phoneNumberId: "PN1", wabaId: "WABA1", accessToken: "TOK", displayName: "Acme Corp",
    }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.apiKey).toMatch(/^wag_/);
    expect(inserted.accounts[0].accessTokenEnc).toBe("enc:TOK");
    expect(inserted.apiKeys[0].keyHash).toMatch(/^[0-9a-f]{64}$/);
  });
});
