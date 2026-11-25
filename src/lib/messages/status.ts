const MAP: Record<string, "sent" | "delivered" | "read" | "failed"> = {
  sent: "sent", delivered: "delivered", read: "read", failed: "failed",
};
export function mapMetaStatus(metaStatus: string): "sent" | "delivered" | "read" | "failed" | null {
  return MAP[metaStatus] ?? null;
}
