import { useState } from "react";
import { Icon } from "../components/Icon";
import { Panel } from "../components/Panel";
import { HotspotMap } from "../components/HotspotMap";
import { Donut } from "../components/Donut";
import {
  crimeHeadSlices,
  dateRangeLabel,
  hotspotInsight,
  mapFilters,
  totalCasesInView,
} from "../data/mapMock";
import "./MapHotspots.css";

const FILTER_CHIPS: { key: string; label: string; value: string; icon?: never }[] = [
  { key: "crimeHead", label: "Crime Head", value: mapFilters.crimeHead },
  { key: "timeOfDay", label: "Time / Day", value: mapFilters.timeOfDay },
  { key: "viewBy", label: "View By", value: mapFilters.viewBy },
  { key: "level", label: "Level", value: mapFilters.level },
];

const HOURS = ["12 AM", "4 AM", "8 AM", "12 PM", "4 PM", "8 PM", "12 AM"];

export function MapHotspots() {
  const [hour, setHour] = useState(83); // slider 0–100, ~8 PM

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Map &amp; Hotspots</h1>
          <p className="page-subtitle">
            Explore crime patterns across locations and time
          </p>
        </div>
        <div className="page-controls">
          <button type="button" className="page-control">
            <Icon name="calendar" size={16} />
            <span>{dateRangeLabel}</span>
            <Icon name="chevron-down" size={14} strokeWidth={2} />
          </button>
          <button type="button" className="page-control">
            <Icon name="filter" size={16} />
            <span>Filters</span>
          </button>
        </div>
      </div>

      <div className="filter-bar">
        {FILTER_CHIPS.map((c) => (
          <button key={c.key} type="button" className="filter-chip">
            <span className="filter-chip__label">{c.label}</span>
            <span className="filter-chip__value">
              {c.key === "viewBy" && (
                <Icon name="map-pin" size={14} />
              )}
              {c.value}
              <Icon name="chevron-down" size={14} strokeWidth={2} />
            </span>
          </button>
        ))}
      </div>

      <div className="map-grid">
        <div className="map-grid__main">
          <div className="map-panel">
            <HotspotMap height={512} showFilterChip={false} />
          </div>

          <Panel title="Time Filter" note="(heatmap)">
            <div className="time-filter">
              <div className="time-filter__track">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={hour}
                  onChange={(e) => setHour(Number(e.target.value))}
                  aria-label="Time of day"
                />
                <div className="time-filter__ticks">
                  {HOURS.map((h, i) => (
                    <span key={i}>{h}</span>
                  ))}
                </div>
              </div>
              <button type="button" className="time-filter__play">
                <Icon name="chevron-right" size={15} strokeWidth={2.4} />
                Play Animation
              </button>
            </div>
          </Panel>
        </div>

        <div className="map-grid__rail">
          <Panel title="Hotspot Insights">
            <div className="insight">
              <div className="insight__head">
                <span className="insight__dot" />
                <span className="insight__zone">{hotspotInsight.zone}</span>
                <span className="insight__badge">{hotspotInsight.intensity}</span>
              </div>
              <p className="insight__delta">
                <Icon name="arrow-up" size={13} strokeWidth={2.4} />
                {hotspotInsight.delta} vs last period
              </p>

              <dl className="insight__rows">
                <InsightRow icon="clock" label="Peak Time" value={hotspotInsight.peakTime} />
                <InsightRow icon="tag" label="Top Crime Head" value={hotspotInsight.topCrimeHead} />
                <InsightRow icon="file-text" label="Total Cases" value={hotspotInsight.totalCases} />
              </dl>

              <button type="button" className="insight__cta">
                View Zone Details
                <Icon name="arrow-right" size={16} strokeWidth={2} />
              </button>
            </div>
          </Panel>

          <Panel title="Top Crime Heads" note="(in view)">
            <div className="crimeheads">
              <Donut
                slices={crimeHeadSlices}
                centerValue={totalCasesInView}
                centerLabel="Total Cases"
              />
              <ul className="crimeheads__legend">
                {crimeHeadSlices.map((s) => (
                  <li key={s.label} className="crimeheads__row">
                    <span className="crimeheads__swatch" style={{ background: s.tone }} />
                    <span className="crimeheads__name">{s.label}</span>
                    <span className="crimeheads__pct tabular">{s.pct}%</span>
                    <span className="crimeheads__count tabular">({s.count})</span>
                  </li>
                ))}
              </ul>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}

function InsightRow({
  icon,
  label,
  value,
}: {
  icon: "clock" | "tag" | "file-text";
  label: string;
  value: string;
}) {
  return (
    <div className="insight__row">
      <dt>
        <Icon name={icon} size={15} />
        {label}
      </dt>
      <dd>{value}</dd>
    </div>
  );
}
