import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn utility function", () => {
  it("merges class names correctly", () => {
    const result = cn("bg-black", "text-white");
    expect(result).toBe("bg-black text-white");
  });

  it("handles conditional classes properly", () => {
    const isActive = true;
    const isHidden = false;
    const result = cn("base-class", isActive && "active", isHidden && "hidden");
    expect(result).toBe("base-class active");
  });

  it("resolves Tailwind class conflicts by overriding with the last class", () => {
    const result = cn("p-4", "p-8");
    expect(result).toBe("p-8");
  });
});
