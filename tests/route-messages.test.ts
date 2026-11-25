import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  resolveClientRef: vi.fn(),
  sendMessage: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ resolveClientRef: mocks.resolveClientRef }));
vi.mock("@/lib/messages/send", () => ({ sendMessage: mocks.sendMessage }));
vi.mock("@/lib/meta/client", () => ({ GraphMetaClient: class {} }));

import { POST } from "@/app/api/v1/messages/route";

function req(body: unknown, auth = "Bearer wag_x") {
  return new Request("http://t/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: auth },
    body: JSON.stringify(body),
  });
}

beforeEach(() => { mocks.resolveClientRef.mockReset(); mocks.sendMessage.mockReset(); });

describe("POST /v1/messages", () => {
  it("401 without valid key", async () => {
    mocks.resolveClientRef.mockResolvedValue(null);
    const res = await POST(req({ to: "5215512345678", template: "x" }));
    expect(res.status).toBe(401);
  });

  it("400 on invalid body (no to)", async () => {
    mocks.resolveClientRef.mockResolvedValue("seguros");
    const res = await POST(req({ template: "x" }));
    expect(res.status).toBe(400);
  });

  it("400 when neither template nor text provided", async () => {
    mocks.resolveClientRef.mockResolvedValue("seguros");
    const res = await POST(req({ to: "5215512345678" }));
    expect(res.status).toBe(400);
  });

  it("200 and returns id+status on success", async () => {
    mocks.resolveClientRef.mockResolvedValue("seguros");
    mocks.sendMessage.mockResolvedValue({ id: "msg-1", status: "sent" });
    const res = await POST(req({ to: "5215512345678", template: "cumple", variables: ["Ana"] }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ id: "msg-1", status: "sent" });
    expect(mocks.sendMessage).toHaveBeenCalledWith(expect.anything(),
      expect.objectContaining({ clientRef: "seguros", to: "5215512345678", template: "cumple" }));
  });
});
