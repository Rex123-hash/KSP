import { Icon } from "./Icon";
import { Sparkline } from "./Sparkline";
import type { Kpi } from "../data/mock";
import "./StatTile.css";

/**
 * Stat tile — value + delta + sparkline.
 *
 * A single headline number is a stat tile, never a one-bar bar chart.
 *
 * Note the delta: the ARROW follows the direction of movement, the COLOUR
 * follows whether that movement is good. Falling "Cases Undetected" is a down
 * arrow in the good colour. Conflating the two is how dashboards lie.
 */

export function StatTile({ kpi }: { kpi: Kpi }) {
  const sentimentClass =
    kpi.deltaSentiment === "good" ? "is-good" : "is-bad";

  return (
    <article className="stat-tile">
      <header className="stat-tile__head">
        <h3 className="eyebrow stat-tile__label">{kpi.label}</h3>
        <span className={`stat-tile__icon ${sentimentClass}`}>
          <Icon name={kpi.icon} size={17} />
        </span>
      </header>

      <p className="stat-tile__value">{kpi.value}</p>

      <p className={`stat-tile__delta ${sentimentClass}`}>
        <Icon
          name={kpi.deltaDirection === "up" ? "arrow-up" : "arrow-down"}
          size={13}
          strokeWidth={2.2}
        />
        <span className="stat-tile__delta-value">{kpi.delta}</span>
        <span className="stat-tile__delta-label">vs last period</span>
      </p>

      <div className="stat-tile__spark">
        <Sparkline points={kpi.spark} sentiment={kpi.deltaSentiment} />
      </div>
    </article>
  );
}
