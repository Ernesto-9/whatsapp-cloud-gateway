import { db } from "@/db";
import { waAccounts, waMessages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { decrypt } from "@/lib/crypto";
import type { MetaClient } from "@/lib/meta/types";

export interface SendRequest {
  clientRef: string;
  to: string;
  template?: string;
  language?: string;
  variables?: string[];
  text?: string;
  dedupeKey?: string;
}

export async function sendMessage(meta: MetaClient, req: SendRequest) {
  if (req.dedupeKey) {
    const existing = await db.select().from(waMessages)
      .where(eq(waMessages.dedupeKey, req.dedupeKey)).limit(1);
    if (existing[0]) return existing[0];
  }

  const accounts = await db.select().from(waAccounts)
    .where(eq(waAccounts.clientRef, req.clientRef)).limit(1);
  const account = accounts[0];
  if (!account) throw new Error("no_account");

  const token = decrypt(account.accessTokenEnc);

  const inserted = await db.insert(waMessages).values({
    clientRef: req.clientRef,
    toPhone: req.to,
    type: req.template ? "template" : "text",
    templateName: req.template ?? null,
    payload: { variables: req.variables, text: req.text },
    status: "queued",
    dedupeKey: req.dedupeKey ?? null,
  }).returning();
  const msg = inserted[0];

  try {
    const result = req.template
      ? await meta.sendTemplate(account.phoneNumberId, token, {
          to: req.to, template: req.template, language: req.language ?? "es_MX", variables: req.variables,
        })
      : await meta.sendText(account.phoneNumberId, token, { to: req.to, text: req.text! });
    const updated = await db.update(waMessages)
      .set({ status: "sent", waMessageId: result.waMessageId, updatedAt: new Date() })
      .where(eq(waMessages.id, msg.id)).returning();
    return updated[0];
  } catch (e) {
    const failed = await db.update(waMessages)
      .set({ status: "failed", error: String(e), updatedAt: new Date() })
      .where(eq(waMessages.id, msg.id)).returning();
    return failed[0];
  }
}
