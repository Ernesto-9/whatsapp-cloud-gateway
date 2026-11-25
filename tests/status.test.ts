import { describe, it, expect } from "vitest";
import { mapMetaStatus } from "@/lib/messages/status";

describe("mapMetaStatus", () => {
  it("maps known statuses", () => {
    expect(mapMetaStatus("sent")).toBe("sent");
    expect(mapMetaStatus("delivered")).toBe("delivered");
    expect(mapMetaStatus("read")).toBe("read");
    expect(mapMetaStatus("failed")).toBe("failed");
  });
  it("returns null for unknown", () => {
    expect(mapMetaStatus("deleted")).toBeNull();
  });
});
