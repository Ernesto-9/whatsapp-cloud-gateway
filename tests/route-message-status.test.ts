import { describe, it, expect, vi, beforeEach } from "vitest";

const state = { messages: [] as any[] };
vi.mock("@/db", () => ({
  db: { select: () => ({ from: () => ({ where: () => ({ limit: async () => state.messages.slice(0, 1) }) }) }) },
}));
vi.mock("@/db/schema", () => ({ waMessages: { id: "id", clientRef: "client_ref" } }));
const mocks = vi.hoisted(() => ({ resolveClientRef: vi.fn() }));
vi.mock("@/lib/auth", () => ({ resolveClientRef: mocks.resolveClientRef }));

import { GET } from "@/app/api/v1/messages/[id]/route";

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const get = (auth = "Bearer wag_x") =>
  new Request("http://t/v1/messages/msg-1", { headers: { authorization: auth } });

beforeEach(() => { state.messages = []; mocks.resolveClientRef.mockReset(); });

describe("GET /v1/messages/[id]", () => {
  it("401 without key", async () => {
    mocks.resolveClientRef.mockResolvedValue(null);
    expect((await GET(get(), ctx("msg-1"))).status).toBe(401);
  });

  it("404 when not found / not owned", async () => {
    mocks.resolveClientRef.mockResolvedValue("seguros");
    state.messages = [];
    expect((await GET(get(), ctx("msg-1"))).status).toBe(404);
  });

  it("200 with status when owned", async () => {
    mocks.resolveClientRef.mockResolvedValue("seguros");
    state.messages = [{ id: "msg-1", clientRef: "seguros", status: "delivered", waMessageId: "wamid.1" }];
    const res = await GET(get(), ctx("msg-1"));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ id: "msg-1", status: "delivered" });
  });
});
