import type { CrimeHeadSlice } from "../data/mapMock";
import "./Donut.css";

/**
 * Donut for the crime-head part-to-whole split. Slices use a fixed categorical
 * order from the brand family (never cycled hues); the tail is folded into
 * "Others" rather than generating more colours. A legend carries identity, so
 * meaning is never colour-alone.
 */

type Props = {
  slices: CrimeHeadSlice[];
  centerValue: string;
  centerLabel: string;
  size?: number;
};

export function Donut({ slices, centerValue, centerLabel, size = 168 }: Props) {
  const stroke = 22;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const cx = size / 2;

  let offset = 0;
  const arcs = slices.map((s) => {
    const len = (s.pct / 100) * c;
    const arc = {
      tone: s.tone,
      dash: `${len} ${c - len}`,
      // 2px gap between slices for separation on the surface
      dashOffset: -offset,
    };
    offset += len;
    return arc;
  });

  return (
    <div className="donut">
      <svg
        className="donut__svg"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`${centerLabel}: ${centerValue}`}
      >
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke="var(--surface-sunken)"
          strokeWidth={stroke}
        />
        {arcs.map((a, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cx}
            r={r}
            fill="none"
            stroke={a.tone}
            strokeWidth={stroke}
            strokeDasharray={a.dash}
            strokeDashoffset={a.dashOffset}
            transform={`rotate(-90 ${cx} ${cx})`}
          />
        ))}
      </svg>
      <div className="donut__center">
        <span className="donut__value tabular">{centerValue}</span>
        <span className="donut__label">{centerLabel}</span>
      </div>
    </div>
  );
}
