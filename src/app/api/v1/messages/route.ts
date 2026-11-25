import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveClientRef } from "@/lib/auth";
import { sendMessage } from "@/lib/messages/send";
import { GraphMetaClient } from "@/lib/meta/client";

const schema = z.object({
  to: z.string().min(8),
  template: z.string().optional(),
  language: z.string().optional(),
  variables: z.array(z.string()).optional(),
  text: z.string().optional(),
  dedupeKey: z.string().optional(),
}).refine((d) => d.template || d.text, { message: "template_or_text_required" });

export async function POST(request: Request) {
  const clientRef = await resolveClientRef(request.headers.get("authorization"));
  if (!clientRef) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad_request", detail: parsed.error.format() }, { status: 400 });

  const msg = await sendMessage(new GraphMetaClient(), { clientRef, ...parsed.data });
  return NextResponse.json({ id: msg.id, status: msg.status }, { status: 200 });
}
