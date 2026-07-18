import "./LineChart.css";

/**
 * Two-series trend line: current period emphasised, previous period recessive.
 * This is emphasis, not two competing categoricals — the current line carries
 * the brand hue and a soft area fill; the comparison line is muted grey.
 * One y-axis only (never dual-axis). Recessive grid, direct legend.
 */

type Props = {
  current: number[];
  previous: number[];
  labels: string[];
  height?: number;
};

export function LineChart({ current, previous, labels, height = 300 }: Props) {
  const W = 900;
  const H = height;
  const padL = 40;
  const padR = 12;
  const padT = 16;
  const padB = 34;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const all = [...current, ...previous];
  const max = Math.ceil(Math.max(...all) / 500) * 500;
  const min = 0;
  const yTicks = [0, 500, 1000, 1500, 2000].filter((t) => t <= max);

  const n = current.length;
  const x = (i: number) => padL + (i / (n - 1)) * plotW;
  const y = (v: number) => padT + plotH - ((v - min) / (max - min)) * plotH;

  const path = (data: number[]) =>
    data.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");

  const area = `${path(current)} L${x(n - 1).toFixed(1)},${(padT + plotH).toFixed(1)} L${padL},${(padT + plotH).toFixed(1)} Z`;

  // Label every ~3rd point so the axis doesn't crowd
  const labelStep = Math.max(1, Math.round(n / labels.length));

  return (
    <div className="linechart">
      <svg viewBox={`0 0 ${W} ${H}`} className="linechart__svg" role="img"
        aria-label="Crime trend, current vs last period">
        <defs>
          <linearGradient id="lc-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--brand-green-600)" stopOpacity="0.16" />
            <stop offset="100%" stopColor="var(--brand-green-600)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* gridlines + y labels */}
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={padL} y1={y(t)} x2={W - padR} y2={y(t)}
              stroke="var(--line-grid)" strokeWidth="1" />
            <text x={padL - 8} y={y(t)} className="linechart__ytick">
              {t >= 1000 ? `${t / 1000}K` : t}
            </text>
          </g>
        ))}

        {/* x labels */}
        {labels.map((lab, i) => {
          const idx = Math.min(i * labelStep, n - 1);
          return (
            <text key={lab} x={x(idx)} y={H - 10} className="linechart__xtick">
              {lab}
            </text>
          );
        })}

        {/* previous (recessive) */}
        <path d={path(previous)} fill="none" stroke="var(--ink-muted)"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.55" />
        {previous.map((v, i) => (
          <circle key={`p${i}`} cx={x(i)} cy={y(v)} r="2.6" fill="var(--ink-muted)" opacity="0.55" />
        ))}

        {/* current (emphasis) */}
        <path d={area} fill="url(#lc-fill)" />
        <path d={path(current)} fill="none" stroke="var(--brand-green-700)"
          strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        {current.map((v, i) => (
          <circle key={`c${i}`} cx={x(i)} cy={y(v)} r="3" fill="var(--brand-green-700)" />
        ))}
      </svg>
    </div>
  );
}
