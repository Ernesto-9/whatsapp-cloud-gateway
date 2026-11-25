import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { db } from "@/db";
import { waMessages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { mapMetaStatus } from "@/lib/messages/status";

function verifySignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.META_APP_SECRET;
  if (!secret) return true; // dev: skip if not configured
  if (!signature) return false;
  const expected = "sha256=" + createHmac("sha256", secret).update(rawBody).digest("hex");
  if (expected.length !== signature.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge ?? "", { status: 200 });
  }
  return new Response("forbidden", { status: 403 });
}

export async function POST(request: Request) {
  const rawBody = await request.text().catch(() => "");
  const signature = request.headers.get("x-hub-signature-256");
  if (!verifySignature(rawBody, signature)) {
    return new Response("unauthorized", { status: 401 });
  }
  const body = JSON.parse(rawBody || "null");
  const statuses = body?.entry?.flatMap((e: any) =>
    e.changes?.flatMap((c: any) => c.value?.statuses ?? []) ?? []) ?? [];

  for (const s of statuses) {
    const mapped = mapMetaStatus(s.status);
    if (!mapped || !s.id) continue;
    await db.update(waMessages)
      .set({ status: mapped, updatedAt: new Date(), error: s.errors ? JSON.stringify(s.errors) : null })
      .where(eq(waMessages.waMessageId, s.id)).returning();
  }
  return NextResponse.json({ ok: true }, { status: 200 });
}
