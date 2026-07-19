export function Chg({
  value,
  size = 12,
  label,
}: {
  value: number;
  size?: number;
  label?: string;
}) {
  const up = value >= 0;
  return (
    <span
      className={`change ${up ? "change-up" : "change-down"}`}
      style={{ fontSize: size }}
      aria-label={`${label ? `${label}: ` : ""}${up ? "up" : "down"} ${Math.abs(value).toFixed(2)} percent`}
    >
      <span aria-hidden="true">{up ? "▲" : "▼"}</span>{" "}
      {Math.abs(value).toFixed(2)}%
    </span>
  );
}

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
}

export function Sparkline({ data, width = 72, height = 28 }: SparklineProps) {
  if (data.length < 2) return <span className="sparkline-empty" aria-hidden="true" />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const x = (index: number) => (index / (data.length - 1)) * width;
  const y = (value: number) => height - 2 - ((value - min) / span) * (height - 4);
  const path = data
    .map((value, index) =>
      `${index ? "L" : "M"}${x(index).toFixed(1)} ${y(value).toFixed(1)}`,
    )
    .join(" ");
  const up = data[data.length - 1] >= data[0];

  return (
    <svg
      className="sparkline"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
    >
      <path
        d={path}
        fill="none"
        stroke={up ? "var(--up)" : "var(--down)"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LoadingRows({ count = 5 }: { count?: number }) {
  return (
    <div className="loading-rows" aria-label="Loading rates" role="status">
      {Array.from({ length: count }, (_, index) => (
        <div className="loading-row" key={index}>
          <span />
          <span />
          <span />
        </div>
      ))}
    </div>
  );
}

export function InlineError({
  message,
  retry,
}: {
  message: string;
  retry: () => void;
}) {
  return (
    <div className="inline-error" role="alert">
      <div>
        <strong>Couldn’t load rates</strong>
        <span>{message}</span>
      </div>
      <button type="button" className="text-button" onClick={retry}>
        Retry
      </button>
    </div>
  );
}
