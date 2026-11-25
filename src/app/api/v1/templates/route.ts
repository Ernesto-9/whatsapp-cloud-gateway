import { NextResponse } from "next/server";
import { db } from "@/db";
import { waTemplates } from "@/db/schema";
import { eq } from "drizzle-orm";
import { resolveClientRef } from "@/lib/auth";

export async function GET(request: Request) {
  const clientRef = await resolveClientRef(request.headers.get("authorization"));
  if (!clientRef) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const templates = await db.select().from(waTemplates).where(eq(waTemplates.clientRef, clientRef));
  return NextResponse.json({ templates });
}
