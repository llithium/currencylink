import { expect, test, type Page } from "@playwright/test";

const browserErrors = new WeakMap<Page, string[]>();

const currencies = [
  { iso_code: "EUR", name: "Euro", symbol: "€", start_date: "1999-01-04" },
  { iso_code: "GBP", name: "British Pound", symbol: "£", start_date: "1948-01-01" },
  { iso_code: "JPY", name: "Japanese Yen", symbol: "¥", start_date: "1948-01-01" },
  { iso_code: "USD", name: "United States Dollar", symbol: "$", start_date: "1948-01-01" },
];

const usdRates: Record<string, number> = { EUR: 0.9, GBP: 0.8, JPY: 150, USD: 1 };

function rateFor(base: string, quote: string): number {
  return usdRates[quote] / usdRates[base];
}

async function mockFrankfurter(page: Page) {
  await page.route("https://api.frankfurter.dev/v2/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/currencies")) {
      await route.fulfill({ json: currencies });
      return;
    }

    if (url.pathname.includes("/rate/")) {
      const [, base, quote] = url.pathname.match(/\/rate\/([^/]+)\/([^/]+)/) ?? [];
      await route.fulfill({
        json: { date: "2026-07-19", base, quote, rate: rateFor(base, quote) },
      });
      return;
    }

    const base = url.searchParams.get("base") ?? "EUR";
    const requestedQuotes = url.searchParams.get("quotes")?.split(",") ??
      currencies.map((currency) => currency.iso_code).filter((code) => code !== base);
    const dates = url.searchParams.has("from")
      ? ["2026-07-17", "2026-07-18", "2026-07-19"]
      : ["2026-07-19"];
    const rows = dates.flatMap((date, dateIndex) =>
      requestedQuotes
        .filter((quote) => quote !== base)
        .map((quote) => ({
          date,
          base,
          quote,
          rate: rateFor(base, quote) * (1 + dateIndex * 0.002),
        })),
    );
    await route.fulfill({ json: rows });
  });
}

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  browserErrors.set(page, errors);
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await mockFrankfurter(page);
});

test.afterEach(async ({ page }) => {
  expect(browserErrors.get(page) ?? []).toEqual([]);
});

test("conversion, responsive swap direction, and theme preference persist", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Convert with reference rates" })).toBeVisible();
  await page.getByRole("textbox", { name: "Amount" }).fill("2");
  await expect(page.getByText("$2.22")).toBeVisible();
  const swapTransform = await page.getByRole("button", { name: "Swap currencies" })
    .locator("svg")
    .evaluate((element) => getComputedStyle(element).transform);
  expect(swapTransform === "none").toBe(testInfo.project.name === "mobile");

  await page.getByRole("button", { name: "Use light theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(page.getByRole("button", { name: "Use dark theme" })).toBeVisible();
});

test("rates pins persist and search opens the selected pair history", async ({ page }) => {
  await page.goto("/rates?base=USD");
  await page.getByRole("textbox", { name: "Search currencies" }).fill("Japanese");
  await page.getByRole("button", { name: "Pin JPY reference rate" }).click();
  await expect(page.getByLabel("Pinned USD-based reference rates").getByText("JPY", { exact: true }))
    .toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Unpin JPY reference rate" })).toBeVisible();
  await page.getByRole("link", { name: /JPY Japanese Yen/ }).click();
  await expect(page).toHaveURL(/\/history\?from=USD&to=JPY&range=1M/);
  await expect(page.getByRole("heading", { name: "Exchange-rate history" })).toBeVisible();
});

test("history ranges update the URL and fit on the viewport", async ({ page }) => {
  await page.goto("/history?from=EUR&to=USD&range=1M");
  await expect(page.getByRole("button", { name: "Reset chart zoom" })).toBeVisible();
  await page.getByRole("button", { name: "1Y" }).click();
  await expect(page).toHaveURL(/range=1Y/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
});
