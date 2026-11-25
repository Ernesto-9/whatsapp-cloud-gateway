import { describe, it, expect, vi, beforeEach } from "vitest";

const state = { templates: [] as any[] };
vi.mock("@/db", () => ({
  db: { select: () => ({ from: () => ({ where: async () => state.templates }) }) },
}));
vi.mock("@/db/schema", () => ({ waTemplates: { clientRef: "client_ref" } }));
const mocks = vi.hoisted(() => ({ resolveClientRef: vi.fn() }));
vi.mock("@/lib/auth", () => ({ resolveClientRef: mocks.resolveClientRef }));

import { GET } from "@/app/api/v1/templates/route";
const get = (auth = "Bearer wag_x") => new Request("http://t/v1/templates", { headers: { authorization: auth } });

beforeEach(() => { state.templates = []; mocks.resolveClientRef.mockReset(); });

describe("GET /v1/templates", () => {
  it("401 without key", async () => {
    mocks.resolveClientRef.mockResolvedValue(null);
    expect((await GET(get())).status).toBe(401);
  });
  it("returns approved templates for the client", async () => {
    mocks.resolveClientRef.mockResolvedValue("seguros");
    state.templates = [{ name: "cumple", language: "es_MX", category: "utility", status: "approved" }];
    const res = await GET(get());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.templates).toHaveLength(1);
    expect(json.templates[0].name).toBe("cumple");
  });
});
