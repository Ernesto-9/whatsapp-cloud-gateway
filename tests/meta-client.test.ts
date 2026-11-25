import { describe, it, expect, vi, afterEach } from "vitest";
import { GraphMetaClient } from "@/lib/meta/client";

afterEach(() => vi.restoreAllMocks());

describe("GraphMetaClient", () => {
  it("posts a template message and returns wa_message_id", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ messages: [{ id: "wamid.ABC" }] }),
    })) as unknown as typeof fetch;
    vi.stubGlobal("fetch", fetchMock);

    const client = new GraphMetaClient();
    const res = await client.sendTemplate("PN1", "TOK", {
      to: "5215512345678", template: "recordatorio_pago", language: "es_MX", variables: ["Juan", "$1,200"],
    });

    expect(res.waMessageId).toBe("wamid.ABC");
    const [url, init] = (fetchMock as any).mock.calls[0];
    expect(url).toContain("/PN1/messages");
    const body = JSON.parse(init.body);
    expect(body.type).toBe("template");
    expect(body.template.name).toBe("recordatorio_pago");
    expect(body.template.components[0].parameters).toHaveLength(2);
    expect(init.headers.Authorization).toBe("Bearer TOK");
  });

  it("throws on non-ok response", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: false, status: 401, json: async () => ({ error: { message: "bad token" } }),
    })) as unknown as typeof fetch);
    const client = new GraphMetaClient();
    await expect(client.sendText("PN1", "TOK", { to: "52155", text: "hi" })).rejects.toThrow("Meta error 401");
  });
});
