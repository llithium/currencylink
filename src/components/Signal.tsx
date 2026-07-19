// Small presentational atoms shared across the Signal views.

/** Signed change %, mono with ▲/▼ and up/down coloring. */
export function Chg({ value, size = 12 }: { value: number; size?: number }) {
  const up = value >= 0;
  return (
    <span
      className="mono whitespace-nowrap font-medium"
      style={{ fontSize: size, color: up ? "var(--up)" : "var(--down)" }}
    >
      {up ? "▲" : "▼"} {Math.abs(value).toFixed(2)}%
    </span>
  );
}

type SparklineProps = {
  data: number[];
  width?: number;
  height?: number;
  /** "auto" colors by direction (up/down); otherwise a CSS color. */
  stroke?: string;
  strokeWidth?: number;
};

/** Minimal inline-SVG sparkline — series of numbers → mini path. */
export function Sparkline({
  data,
  width = 60,
  height = 22,
  stroke = "auto",
  strokeWidth = 1.4,
}: SparklineProps) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const x = (i: number) => (i / (data.length - 1)) * width;
  const y = (v: number) => height - 2 - ((v - min) / span) * (height - 4);
  const line = data
    .map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`)
    .join(" ");
  const up = data[data.length - 1] >= data[0];
  const color =
    stroke === "auto" ? (up ? "var(--up)" : "var(--down)") : stroke;
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: "block", overflow: "visible" }}
    >
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
