import { db } from "@/db";
import { waApiKeys } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { hashApiKey } from "./apiKey";

export async function resolveClientRef(authHeader: string | null): Promise<string | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const key = authHeader.slice(7).trim();
  if (!key) return null;
  const hash = hashApiKey(key);
  const rows = await db.select().from(waApiKeys)
    .where(and(eq(waApiKeys.keyHash, hash), isNull(waApiKeys.revokedAt)))
    .limit(1);
  return rows[0]?.clientRef ?? null;
}
