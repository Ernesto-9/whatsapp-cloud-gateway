import { describe, it, expect, vi, beforeEach } from "vitest";

// Mutable fixtures the db mock reads/writes.
const state = { accounts: [] as any[], messages: [] as any[] };

vi.mock("@/db", () => {
  const makeChain = (table: "accounts" | "messages") => ({
    // select().from(x).where(...).limit(n)
    select: () => ({
      from: () => ({
        where: () => ({ limit: async () => state[table].slice(0, 1) }),
      }),
    }),
  });
  return {
    db: {
      select: () => ({
        from: (t: any) => ({
          where: () => ({
            limit: async () => {
              // crude table detection via a tag set in schema mock below
              return (t.__table === "accounts" ? state.accounts : state.messages).slice(0, 1);
            },
          }),
        }),
      }),
      insert: () => ({
        values: (v: any) => ({
          returning: async () => {
            const row = { id: "msg-1", status: "queued", ...v };
            state.messages.push(row);
            return [row];
          },
        }),
      }),
      update: () => ({
        set: (s: any) => ({
          where: () => ({
            returning: async () => {
              const row = { ...state.messages[state.messages.length - 1], ...s };
              return [row];
            },
          }),
        }),
      }),
    },
  };
});

vi.mock("@/db/schema", () => ({
  waAccounts: { __table: "accounts", clientRef: "client_ref" },
  waMessages: { __table: "messages", clientRef: "client_ref", dedupeKey: "dedupe_key", id: "id" },
}));

vi.mock("@/lib/crypto", () => ({ decrypt: (s: string) => s.replace("enc:", "") }));

import { sendMessage } from "@/lib/messages/send";
import { fakeMeta, throwingMeta } from "./helpers";

beforeEach(() => {
  state.accounts = [{ clientRef: "seguros", phoneNumberId: "PN1", accessTokenEnc: "enc:TOK" }];
  state.messages = [];
});

describe("sendMessage", () => {
  it("sends a template, persists, marks sent", async () => {
    const meta = fakeMeta({ waMessageId: "wamid.OK" });
    const msg = await sendMessage(meta, {
      clientRef: "seguros", to: "52155", template: "cumple", language: "es_MX", variables: ["Ana"],
    });
    expect(meta.sendTemplate).toHaveBeenCalledOnce();
    expect(msg.status).toBe("sent");
    expect(msg.waMessageId).toBe("wamid.OK");
  });

  it("marks failed when Meta throws", async () => {
    const msg = await sendMessage(throwingMeta(), {
      clientRef: "seguros", to: "52155", template: "cumple", language: "es_MX",
    });
    expect(msg.status).toBe("failed");
    expect(msg.error).toContain("meta_down");
  });

  it("throws no_account when client has no account", async () => {
    state.accounts = [];
    await expect(sendMessage(fakeMeta(), { clientRef: "x", to: "52155", text: "hi" }))
      .rejects.toThrow("no_account");
  });
});
