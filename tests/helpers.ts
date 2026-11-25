import { vi } from "vitest";
import type { MetaClient, MetaSendResult } from "@/lib/meta/types";

export function fakeMeta(result: MetaSendResult = { waMessageId: "wamid.TEST" }): MetaClient {
  return {
    sendTemplate: vi.fn(async () => result),
    sendText: vi.fn(async () => result),
  };
}

export function throwingMeta(message = "meta_down"): MetaClient {
  return {
    sendTemplate: vi.fn(async () => { throw new Error(message); }),
    sendText: vi.fn(async () => { throw new Error(message); }),
  };
}

// In-memory rows store for db mocking. Each test sets these arrays.
export interface FakeDb {
  accounts: any[];
  apiKeys: any[];
  messages: any[];
  templates: any[];
}

export function makeFakeDb(seed: Partial<FakeDb> = {}): FakeDb {
  return {
    accounts: seed.accounts ?? [],
    apiKeys: seed.apiKeys ?? [],
    messages: seed.messages ?? [],
    templates: seed.templates ?? [],
  };
}
