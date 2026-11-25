import { NextResponse } from "next/server";
import { db } from "@/db";
import { waMessages } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { resolveClientRef } from "@/lib/auth";

export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const clientRef = await resolveClientRef(request.headers.get("authorization"));
  if (!clientRef) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const rows = await db.select().from(waMessages)
    .where(and(eq(waMessages.id, id), eq(waMessages.clientRef, clientRef))).limit(1);
  const msg = rows[0];
  if (!msg) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json({
    id: msg.id, status: msg.status, waMessageId: msg.waMessageId, error: msg.error,
  });
}
