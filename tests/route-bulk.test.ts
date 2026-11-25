import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({ resolveClientRef: vi.fn(), sendMessage: vi.fn() }));
vi.mock("@/lib/auth", () => ({ resolveClientRef: mocks.resolveClientRef }));
vi.mock("@/lib/messages/send", () => ({ sendMessage: mocks.sendMessage }));
vi.mock("@/lib/meta/client", () => ({ GraphMetaClient: class {} }));

import { POST } from "@/app/api/v1/messages/bulk/route";

const req = (body: unknown, auth = "Bearer wag_x") =>
  new Request("http://t/v1/messages/bulk", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: auth },
    body: JSON.stringify(body),
  });

beforeEach(() => { mocks.resolveClientRef.mockReset(); mocks.sendMessage.mockReset(); });

describe("POST /v1/messages/bulk", () => {
  it("401 without key", async () => {
    mocks.resolveClientRef.mockResolvedValue(null);
    expect((await POST(req({ template: "x", recipients: [] }))).status).toBe(401);
  });

  it("400 with empty recipients", async () => {
    mocks.resolveClientRef.mockResolvedValue("seguros");
    expect((await POST(req({ template: "x", recipients: [] }))).status).toBe(400);
  });

  it("sends to all recipients and reports counts", async () => {
    mocks.resolveClientRef.mockResolvedValue("seguros");
    mocks.sendMessage
      .mockResolvedValueOnce({ id: "m1", status: "sent" })
      .mockResolvedValueOnce({ id: "m2", status: "failed" });
    const res = await POST(req({
      template: "promo",
      recipients: [{ to: "5215512345678", variables: ["A"] }, { to: "5215512345679", variables: ["B"] }],
    }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.total).toBe(2);
    expect(json.sent).toBe(1);
    expect(json.failed).toBe(1);
    expect(mocks.sendMessage).toHaveBeenCalledTimes(2);
  });
});
