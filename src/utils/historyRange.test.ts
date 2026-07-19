import { describe, expect, it } from "vitest";
import type { Currency } from "../api/frankfurter";
import { getHistoryRequestRange, isHistoryRange } from "./historyRange";

const eur: Currency = { code: "EUR", name: "Euro", symbol: "€", startDate: "1999-01-04" };
const usd: Currency = { code: "USD", name: "US Dollar", symbol: "$", startDate: "1948-01-01" };
const now = new Date("2026-07-19T12:00:00Z");

describe("history ranges", () => {
  it("builds daily, weekly, and monthly requests", () => {
    expect(getHistoryRequestRange("1W", eur, usd, now)).toEqual({
      from: "2026-07-12",
      to: "2026-07-19",
    });
    expect(getHistoryRequestRange("1Y", eur, usd, now).group).toBe("week");
    expect(getHistoryRequestRange("5Y", eur, usd, now).group).toBe("month");
  });

  it("starts MAX at the later currency start date", () => {
    expect(getHistoryRequestRange("MAX", eur, usd, now)).toEqual({
      from: "1999-01-04",
      to: "2026-07-19",
      group: "month",
    });
  });

  it("validates public range values", () => {
    expect(isHistoryRange("3M")).toBe(true);
    expect(isHistoryRange("10Y")).toBe(false);
  });
});
