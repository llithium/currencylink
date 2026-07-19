import { describe, expect, it } from "vitest";
import { currencyFlag } from "./currencyFlag";

describe("currencyFlag", () => {
  it("returns representative flags and a neutral fallback", () => {
    expect(currencyFlag("USD")).toBe("🇺🇸");
    expect(currencyFlag("EUR")).toBe("🇪🇺");
    expect(currencyFlag("XDR")).toBe("🌐");
  });
});
