import { createHash, randomBytes } from "crypto";

export function generateApiKey(): string {
  return "wag_" + randomBytes(24).toString("base64url");
}

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}
