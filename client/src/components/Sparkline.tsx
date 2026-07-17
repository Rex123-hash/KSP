/**
 * Sparkline — the trend channel inside a stat tile.
 *
 * No axes, no grid, no labels: the tile's value carries the number and the
 * sparkline carries only the shape. 2px line over a soft fill, per the mark
 * spec. Colour is passed in by sentiment, never derived from slope.
 */

type Props = {
  points: number[];
  sentiment: "good" | "bad";
  width?: number;
  height?: number;
};

export function Sparkline({
  points,
  sentiment,
  width = 220,
  height = 44,
}: Props) {
  if (points.length < 2) return null;

  const stroke =
    sentiment === "good" ? "var(--delta-good)" : "var(--delta-bad)";

  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;

  // Inset so the 2px stroke never clips at the top or bottom edge.
  const pad = 3;
  const plotH = height - pad * 2;

  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * width;
    const y = pad + plotH - ((p - min) / span) * plotH;
    return [x, y] as const;
  });

  const line = coords
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");

  const area = `${line} L${width},${height} L0,${height} Z`;
  const gradientId = `spark-${sentiment}`;

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.18" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
