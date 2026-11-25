import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveClientRef } from "@/lib/auth";
import { sendMessage } from "@/lib/messages/send";
import { GraphMetaClient } from "@/lib/meta/client";

const schema = z.object({
  template: z.string().min(1),
  language: z.string().optional(),
  recipients: z.array(z.object({
    to: z.string().min(8),
    variables: z.array(z.string()).optional(),
    dedupeKey: z.string().optional(),
  })).min(1),
});

export async function POST(request: Request) {
  const clientRef = await resolveClientRef(request.headers.get("authorization"));
  if (!clientRef) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad_request", detail: parsed.error.format() }, { status: 400 });

  const meta = new GraphMetaClient();
  const { template, language, recipients } = parsed.data;
  let sent = 0, failed = 0;
  const ids: string[] = [];

  for (const r of recipients) {
    const msg = await sendMessage(meta, {
      clientRef, to: r.to, template, language, variables: r.variables, dedupeKey: r.dedupeKey,
    });
    ids.push(msg.id);
    if (msg.status === "failed") failed++; else sent++;
    await new Promise((res) => setTimeout(res, 200)); // ~5 msg/s cap
  }

  return NextResponse.json({ total: recipients.length, sent, failed, ids }, { status: 200 });
}
