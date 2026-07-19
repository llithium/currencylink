# Currency Link

Currency Link is a focused fiat currency converter, rate browser, and historical
pair explorer. It uses free, keyless Frankfurter v2 reference-rate data and makes
clear that the displayed values are daily blended reference rates rather than
live tradable quotes.

**Link:** https://currencylink.netlify.app/

## Features

- Convert between all active Frankfurter currencies with shareable code-based URLs.
- Browse, search, and sort the latest reference rates with 30-day sparklines.
- Pin preferred reference rates to the persistent header ticker; USD and EUR are pinned initially.
- Explore pair history from one week through the currencies' full available range.
- Pan, zoom, and inspect rates with TradingView Lightweight Charts.
- Use an accessible system-aware light or dark theme on desktop and mobile.

## Built with

- [React](https://react.dev/)
- [React Router](https://reactrouter.com/)
- [Frankfurter v2](https://frankfurter.dev/) for exchange-rate data
- [React Aria Components](https://react-spectrum.adobe.com/react-aria/components.html)
- [TradingView Lightweight Charts](https://tradingview.github.io/lightweight-charts/)
- [Tailwind](https://tailwindcss.com/)
- [Vitest](https://vitest.dev/) and [Playwright](https://playwright.dev/) for testing

## Local development

```sh
pnpm install
pnpm dev
```

Quality checks:

```sh
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
```
