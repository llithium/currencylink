// Small presentational atoms shared across the Broadsheet views.

type RuleProps = {
  variant?: "heavy" | "section" | "hair";
  className?: string;
};

/** Horizontal rule. heavy = 2.5px masthead bar, section = 1px ink, hair = 1px faint. */
export function Rule({ variant = "section", className = "" }: RuleProps) {
  const cls =
    variant === "heavy"
      ? "bs-rule bs-rule--heavy"
      : variant === "hair"
        ? "bs-rule bs-rule--hair"
        : "bs-rule";
  return <div className={`${cls} ${className}`} />;
}

/** Signed change %, with ▲/▼ and up/down coloring. */
export function Chg({ value, size = 12.5 }: { value: number; size?: number }) {
  const up = value >= 0;
  return (
    <span
      className="whitespace-nowrap font-sans font-bold"
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
  stroke?: string;
  strokeWidth?: number;
};

/** Minimal inline-SVG sparkline — series of numbers → mini path. */
export function Sparkline({
  data,
  width = 56,
  height = 20,
  stroke = "var(--faint)",
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
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
