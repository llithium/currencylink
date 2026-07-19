import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

class TestResizeObserver implements ResizeObserver {
  disconnect = vi.fn();
  observe = vi.fn();
  unobserve = vi.fn();
}

vi.stubGlobal("ResizeObserver", TestResizeObserver);
vi.stubGlobal(
  "matchMedia",
  vi.fn().mockImplementation((query: string) => ({
    matches: query.includes("light"),
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
);

Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
  configurable: true,
  value: vi.fn(),
});
