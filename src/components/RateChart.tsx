import { useEffect, useRef, useState } from "react";
import {
  AreaSeries,
  ColorType,
  CrosshairMode,
  LineStyle,
  createChart,
  createSeriesMarkers,
  type AreaData,
  type ISeriesApi,
  type Time,
} from "lightweight-charts";
import type { RatePoint } from "../api/frankfurter";
import { percentageChange } from "../api/frankfurter";
import { useTheme } from "../hooks/useTheme";
import { fmtRate } from "../utils/format";
import { Chg } from "./Signal";

interface HoverValue {
  date: string;
  rate: number;
}

export default function RateChart({
  data,
  quote,
}: {
  data: RatePoint[];
  quote: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const fitRef = useRef<(() => void) | null>(null);
  const { theme } = useTheme();
  const latest = data[data.length - 1];
  const [hover, setHover] = useState<HoverValue | null>(
    latest ? { date: latest.date, rate: latest.rate } : null,
  );

  useEffect(() => {
    if (!latest) return;
    setHover({ date: latest.date, rate: latest.rate });
  }, [latest]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !data.length) return;
    const rootStyles = getComputedStyle(document.documentElement);
    const color = (name: string) => rootStyles.getPropertyValue(name).trim();
    const lastPoint = data[data.length - 1];
    const minMove =
      lastPoint.rate < 1 ? 0.00001 : lastPoint.rate < 10 ? 0.0001 : 0.001;

    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: color("--chart-label"),
        fontFamily: '"Manrope", system-ui, sans-serif',
        fontSize: 12,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: color("--chart-grid"), style: LineStyle.Dotted },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: color("--chart-crosshair"),
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: color("--accent"),
        },
        horzLine: {
          color: color("--chart-crosshair"),
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: color("--accent"),
        },
      },
      rightPriceScale: {
        borderVisible: false,
        entireTextOnly: true,
        scaleMargins: { top: 0.12, bottom: 0.12 },
      },
      timeScale: {
        borderVisible: false,
        rightOffset: 1,
        timeVisible: false,
        tickMarkMaxCharacterLength: 5,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: false,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    const series = chart.addSeries(AreaSeries, {
      lineColor: color("--accent"),
      topColor: color("--chart-fill-top"),
      bottomColor: color("--chart-fill-bottom"),
      lineWidth: 2,
      crosshairMarkerBackgroundColor: color("--accent"),
      crosshairMarkerBorderColor: color("--surface"),
      priceLineVisible: false,
      lastValueVisible: false,
      priceFormat: {
        type: "price",
        precision: Math.max(0, Math.ceil(-Math.log10(minMove))),
        minMove,
      },
    });
    seriesRef.current = series;
    series.setData(
      data.map((point) => ({ time: point.date as Time, value: point.rate })),
    );
    createSeriesMarkers(
      series,
      [
        {
          time: lastPoint.date as Time,
          price: lastPoint.rate,
          position: "atPriceMiddle",
          shape: "circle",
          color: color("--accent"),
          size: 0.8,
        },
      ],
      { autoScale: false },
    );
    chart.timeScale().fitContent();
    fitRef.current = () => chart.timeScale().fitContent();

    chart.subscribeCrosshairMove((param) => {
      if (!param.time) {
        const point = data[data.length - 1];
        setHover({ date: point.date, rate: point.rate });
        return;
      }
      const value = param.seriesData.get(series) as AreaData<Time> | undefined;
      if (value && "value" in value) {
        setHover({ date: String(param.time), rate: value.value });
      }
    });

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        chart.applyOptions({
          width: Math.floor(entry.contentRect.width),
          height: Math.floor(entry.contentRect.height),
        });
      }
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      fitRef.current = null;
      seriesRef.current = null;
      chart.remove();
    };
  }, [data, theme]);

  const open = data[0]?.rate ?? 0;
  const hoverChange = hover ? percentageChange(hover.rate, open) : 0;

  return (
    <div>
      <div className="chart-readout">
        <div className="chart-legend" aria-live="polite">
          {hover && <time dateTime={hover.date}>{hover.date}</time>}
          <strong>
            {hover ? fmtRate(hover.rate) : "—"} {quote}
          </strong>
          {hover && (
            <Chg value={hoverChange} size={11} label="Change from range open" />
          )}
        </div>
        <button
          type="button"
          className="chart-reset"
          onClick={() => fitRef.current?.()}
          aria-label="Reset chart zoom"
          title="Reset chart zoom"
        >
          Reset
        </button>
      </div>
      <div className="market-chart-wrap">
        <div className="market-chart" ref={containerRef} aria-hidden="true" />
      </div>
      <p className="sr-only">
        {data.length
          ? `${quote} exchange-rate chart from ${data[0].date} to ${data[data.length - 1].date}. Open ${fmtRate(open)}, latest ${fmtRate(data[data.length - 1].rate)}.`
          : "No chart data available."}
      </p>
    </div>
  );
}
