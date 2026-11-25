import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHmac } from "crypto";

const updated: any[] = [];
vi.mock("@/db", () => ({
  db: {
    update: () => ({
      set: (s: any) => ({ where: () => ({ returning: async () => { updated.push(s); return [s]; } }) }),
    }),
  },
}));
vi.mock("@/db/schema", () => ({ waMessages: { waMessageId: "wa_message_id" } }));

import { GET, POST } from "@/app/api/v1/webhook/route";

const SECRET = "test-secret";

function sign(body: string, secret = SECRET) {
  return "sha256=" + createHmac("sha256", secret).update(body).digest("hex");
}

function postRequest(body: object, signature?: string) {
  const raw = JSON.stringify(body);
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (signature !== undefined) headers["x-hub-signature-256"] = signature;
  return new Request("http://t/v1/webhook", { method: "POST", body: raw, headers });
}

beforeEach(() => {
  updated.length = 0;
  process.env.WHATSAPP_VERIFY_TOKEN = "verifyme";
  process.env.META_APP_SECRET = SECRET;
});

describe("webhook", () => {
  it("GET verifies challenge", async () => {
    const url = "http://t/v1/webhook?hub.mode=subscribe&hub.verify_token=verifyme&hub.challenge=12345";
    const res = await GET(new Request(url));
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("12345");
  });

  it("GET rejects wrong token", async () => {
    const url = "http://t/v1/webhook?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=1";
    expect((await GET(new Request(url))).status).toBe(403);
  });

  it("POST updates message status with valid signature", async () => {
    const body = {
      entry: [{ changes: [{ value: { statuses: [{ id: "wamid.1", status: "delivered" }] } }] }],
    };
    const raw = JSON.stringify(body);
    const res = await POST(postRequest(body, sign(raw)));
    expect(res.status).toBe(200);
    expect(updated[0].status).toBe("delivered");
  });

  it("POST rejects missing signature", async () => {
    const body = { entry: [] };
    const res = await POST(postRequest(body));
    expect(res.status).toBe(401);
  });

  it("POST rejects wrong signature", async () => {
    const body = { entry: [] };
    const res = await POST(postRequest(body, "sha256=deadbeef"));
    expect(res.status).toBe(401);
  });

  it("POST skips signature check when META_APP_SECRET not set", async () => {
    delete process.env.META_APP_SECRET;
    const body = { entry: [] };
    const res = await POST(postRequest(body)); // sin firma, sin secret → pasa
    expect(res.status).toBe(200);
  });
});
