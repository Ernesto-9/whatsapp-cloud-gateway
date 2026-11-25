import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { waAccounts, waApiKeys } from "@/db/schema";
import { encrypt } from "@/lib/crypto";
import { generateApiKey, hashApiKey } from "@/lib/apiKey";

const schema = z.object({
  clientRef: z.string().min(1),
  phoneNumberId: z.string().min(1),
  wabaId: z.string().min(1),
  accessToken: z.string().min(1),
  displayName: z.string().optional(),
});

export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.ADMIN_API_KEY}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad_request", detail: parsed.error.format() }, { status: 400 });

  const { clientRef, phoneNumberId, wabaId, accessToken, displayName } = parsed.data;

  await db.insert(waAccounts).values({
    clientRef, phoneNumberId, wabaId, accessTokenEnc: encrypt(accessToken), displayName: displayName ?? null,
  }).returning();

  const apiKey = generateApiKey();
  await db.insert(waApiKeys).values({ clientRef, keyHash: hashApiKey(apiKey), label: displayName ?? null }).returning();

  return NextResponse.json({ clientRef, apiKey }, { status: 200 });
}
