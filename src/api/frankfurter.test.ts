import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearCurrencyCacheForTests,
  FrankfurterError,
  getCurrencies,
  getHistory,
  getRate,
  percentageChange,
} from "./frankfurter";

afterEach(() => {
  clearCurrencyCacheForTests();
  vi.unstubAllGlobals();
});

describe("Frankfurter v2 client", () => {
  it("normalizes and sorts currency metadata", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify([
            { iso_code: "USD", name: "United States Dollar", symbol: "$", start_date: "1948-01-01" },
            { iso_code: "EUR", name: "Euro", symbol: "€", start_date: "1999-01-04" },
          ]),
          { status: 200 },
        ),
      ),
    );

    await expect(getCurrencies()).resolves.toEqual([
      { code: "EUR", name: "Euro", symbol: "€", startDate: "1999-01-04" },
      { code: "USD", name: "United States Dollar", symbol: "$", startDate: "1948-01-01" },
    ]);
  });

  it("normalizes a pair rate and calculates change", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ date: "2026-07-19", base: "EUR", quote: "USD", rate: 1.1456 })),
      ),
    );

    await expect(getRate("EUR", "USD")).resolves.toEqual({
      date: "2026-07-19",
      base: "EUR",
      quote: "USD",
      rate: 1.1456,
    });
    expect(percentageChange(110, 100)).toBeCloseTo(10);
    expect(percentageChange(2, 0)).toBe(0);
  });

  it("requests grouped history and returns it in date order", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify([
          { date: "2026-07-10", base: "EUR", quote: "USD", rate: 1.2 },
          { date: "2026-07-03", base: "EUR", quote: "USD", rate: 1.1 },
        ]),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const points = await getHistory({
      base: "EUR",
      quote: "USD",
      from: "2026-07-01",
      group: "week",
    });

    expect(String(fetchMock.mock.calls[0][0])).toContain("group=week");
    expect(points.map((point) => point.date)).toEqual(["2026-07-03", "2026-07-10"]);
  });

  it("surfaces API messages as structured errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: "Unknown currency" }), {
          status: 404,
          statusText: "Not Found",
        }),
      ),
    );

    await expect(getRate("EUR", "XXX")).rejects.toEqual(
      expect.objectContaining<Partial<FrankfurterError>>({
        message: "Unknown currency",
        status: 404,
      }),
    );
  });
});
