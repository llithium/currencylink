import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RatePoint } from "../api/frankfurter";
import { ThemeProvider } from "../hooks/useTheme";
import RateChart from "./RateChart";

const chartMocks = vi.hoisted(() => {
  const setData = vi.fn();
  const fitContent = vi.fn();
  const remove = vi.fn();
  const applyOptions = vi.fn();
  const subscribeCrosshairMove = vi.fn();
  const addSeries = vi.fn(() => ({ setData }));
  const createChart = vi.fn(() => ({
    addSeries,
    applyOptions,
    remove,
    subscribeCrosshairMove,
    timeScale: () => ({ fitContent }),
  }));
  return { addSeries, applyOptions, createChart, fitContent, remove, setData, subscribeCrosshairMove };
});

vi.mock("lightweight-charts", () => ({
  AreaSeries: "AreaSeries",
  ColorType: { Solid: "solid" },
  CrosshairMode: { Normal: 0 },
  LineStyle: { Dashed: 2, Dotted: 1 },
  createChart: chartMocks.createChart,
}));

const data: RatePoint[] = [
  { date: "2026-07-17", base: "EUR", quote: "USD", rate: 1.1 },
  { date: "2026-07-18", base: "EUR", quote: "USD", rate: 1.2 },
];

describe("RateChart", () => {
  beforeEach(() => {
    document.documentElement.dataset.theme = "dark";
    Object.values(chartMocks).forEach((mock) => mock.mockClear());
  });

  afterEach(() => localStorage.clear());

  it("creates, populates, resets, and disposes the chart", async () => {
    const user = userEvent.setup();
    const view = render(
      <ThemeProvider>
        <RateChart data={data} quote="USD" />
      </ThemeProvider>,
    );

    expect(chartMocks.createChart).toHaveBeenCalledOnce();
    expect(chartMocks.setData).toHaveBeenCalledWith([
      { time: "2026-07-17", value: 1.1 },
      { time: "2026-07-18", value: 1.2 },
    ]);
    await user.click(screen.getByRole("button", { name: "Reset chart zoom" }));
    expect(chartMocks.fitContent).toHaveBeenCalled();

    view.unmount();
    expect(chartMocks.remove).toHaveBeenCalledOnce();
  });
});
