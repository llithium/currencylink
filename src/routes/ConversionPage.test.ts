import { describe, expect, it } from "vitest";
import { normalizeAmountInput, parseAmount } from "./ConversionPage";

describe("converter amount input", () => {
  it("preserves editable decimal states", () => {
    expect(normalizeAmountInput("1.")).toBe("1.");
    expect(normalizeAmountInput("$1,234.5")).toBe("1234.5");
    expect(normalizeAmountInput("1.2.3")).toBe("1.23");
  });

  it("turns empty and invalid input into zero for calculation", () => {
    expect(parseAmount("")).toBe(0);
    expect(parseAmount("12.5")).toBe(12.5);
  });
});
