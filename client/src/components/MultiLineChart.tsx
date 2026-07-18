import type { LineSeries } from "../data/reportsMock";
import "./LineChart.css";

/**
 * Multi-series categorical line chart (e.g. registered vs chargesheeted vs
 * convicted over time). Distinct series ARE the subject here, so categorical
 * colour is correct — a legend names each, fixed order, drawn from the brand
 * family plus one violet. One y-axis only.
 */

type Props = {
  series: LineSeries[];
  labels: string[];
  height?: number;
};

export function MultiLineChart({ series, labels, height = 300 }: Props) {
  const W = 900;
  const H = height;
  const padL = 40;
  const padR = 12;
  const padT = 16;
  const padB = 34;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const all = series.flatMap((s) => s.data);
  const max = Math.ceil(Math.max(...all) / 500) * 500;
  const yTicks = [0, 500, 1000, 1500, 2000].filter((t) => t <= max);

  const n = series[0].data.length;
  const x = (i: number) => padL + (i / (n - 1)) * plotW;
  const y = (v: number) => padT + plotH - (v / max) * plotH;

  const path = (data: number[]) =>
    data.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");

  const labelStep = Math.max(1, Math.round(n / labels.length));

  return (
    <div className="linechart">
      <svg viewBox={`0 0 ${W} ${H}`} className="linechart__svg" role="img"
        aria-label="Cases over time by outcome">
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={padL} y1={y(t)} x2={W - padR} y2={y(t)} stroke="var(--line-grid)" strokeWidth="1" />
            <text x={padL - 8} y={y(t)} className="linechart__ytick">
              {t >= 1000 ? `${t / 1000}K` : t}
            </text>
          </g>
        ))}

        {labels.map((lab, i) => {
          const idx = Math.min(i * labelStep, n - 1);
          return (
            <text key={lab} x={x(idx)} y={H - 10} className="linechart__xtick">{lab}</text>
          );
        })}

        {series.map((s) => (
          <g key={s.label}>
            <path d={path(s.data)} fill="none" stroke={s.color} strokeWidth="2.4"
              strokeLinecap="round" strokeLinejoin="round" />
            {s.data.map((v, i) => (
              <circle key={i} cx={x(i)} cy={y(v)} r="2.8" fill={s.color} />
            ))}
          </g>
        ))}
      </svg>
    </div>
  );
}
