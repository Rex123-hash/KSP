import { useEffect, useRef, useState } from "react";
import { Icon } from "../components/Icon";
import { Panel } from "../components/Panel";
import { HotspotMap } from "../components/HotspotMap";
import { Donut } from "../components/Donut";
import { PageState } from "../components/PageState";
import { protoToast } from "../components/Toast";
import { useApi } from "../api";
import { useMeta } from "../meta";
import { type CrimeHeadSlice } from "../data/mapMock";
import "./MapHotspots.css";

// Crime-head groups (CrimeMajorHeadID) — the ids the hotspot points carry.
const HEADS = [
  { id: null, label: "All Crime Heads" },
  { id: 1, label: "Property" },
  { id: 2, label: "Against Body" },
  { id: 3, label: "Against Women" },
  { id: 4, label: "Economic" },
  { id: 5, label: "Other IPC/BNS" },
];

function hourLabel(h: number) {
  const period = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12} ${period}`;
}

type MapData = {
  insight: {
    zone: string;
    intensity: string;
    delta: string;
    peakTime: string;
    topCrimeHead: string;
    totalCases: string;
  };
  crimeHeads: CrimeHeadSlice[];
  totalCases: string;
};

const HOURS = ["12 AM", "4 AM", "8 AM", "12 PM", "4 PM", "8 PM", "11 PM"];

export function MapHotspots() {
  const [hour, setHour] = useState<number | null>(null); // null = all day
  const [headIdx, setHeadIdx] = useState(0); // index into HEADS
  const [playing, setPlaying] = useState(false);
  const playRef = useRef<number | null>(null);
  const state = useApi<MapData>("/map");
  const { dateRange } = useMeta();

  // Play animation: cycle the hour 0→23 while playing.
  useEffect(() => {
    if (!playing) return;
    playRef.current = window.setInterval(() => {
      setHour((h) => ((h == null ? -1 : h) + 1) % 24);
    }, 550);
    return () => {
      if (playRef.current) window.clearInterval(playRef.current);
    };
  }, [playing]);

  const headFilter = HEADS[headIdx].id;

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
            <span>{dateRange}</span>
            <Icon name="chevron-down" size={14} strokeWidth={2} />
          </button>
          <button type="button" className="page-control">
            <Icon name="filter" size={16} />
            <span>Filters</span>
          </button>
        </div>
      </div>

      <div className="filter-bar">
        {/* Crime Head — clicking cycles the head filter and drives the map. */}
        <button
          type="button"
          className="filter-chip"
          onClick={() => setHeadIdx((i) => (i + 1) % HEADS.length)}
        >
          <span className="filter-chip__label">Crime Head</span>
          <span className="filter-chip__value">
            {HEADS[headIdx].label}
            <Icon name="chevron-down" size={14} strokeWidth={2} />
          </span>
        </button>

        {/* Time / Day — reflects the slider; click resets to all day. */}
        <button type="button" className="filter-chip" onClick={() => setHour(null)}>
          <span className="filter-chip__label">Time / Day</span>
          <span className="filter-chip__value">
            {hour == null ? "All Day" : hourLabel(hour)}
            <Icon name="chevron-down" size={14} strokeWidth={2} />
          </span>
        </button>

        <button
          type="button"
          className="filter-chip"
          onClick={() => protoToast("Cluster view needs a live query backend")}
        >
          <span className="filter-chip__label">View By</span>
          <span className="filter-chip__value">
            <Icon name="map-pin" size={14} />
            Heatmap
            <Icon name="chevron-down" size={14} strokeWidth={2} />
          </span>
        </button>

        <button
          type="button"
          className="filter-chip"
          onClick={() => protoToast("District/station drilldown needs a live query backend")}
        >
          <span className="filter-chip__label">Level</span>
          <span className="filter-chip__value">
            Zone
            <Icon name="chevron-down" size={14} strokeWidth={2} />
          </span>
        </button>
      </div>

      <div className="map-grid">
        <div className="map-grid__main">
          <div className="map-panel">
            <HotspotMap height={512} showFilterChip={false} filterHour={hour} filterHead={headFilter} />
          </div>

          <Panel
            title="Time Filter"
            note={hour == null ? "· all day" : `· ${hourLabel(hour)}`}
          >
            <div className="time-filter">
              <div className="time-filter__track">
                <input
                  type="range"
                  min={0}
                  max={23}
                  value={hour ?? 0}
                  onChange={(e) => {
                    setPlaying(false);
                    setHour(Number(e.target.value));
                  }}
                  aria-label="Time of day"
                />
                <div className="time-filter__ticks">
                  {HOURS.map((h, i) => (
                    <span key={i}>{h}</span>
                  ))}
                </div>
              </div>
              <button
                type="button"
                className="time-filter__play"
                onClick={() => setPlaying((p) => !p)}
              >
                <Icon name={playing ? "minus" : "chevron-right"} size={15} strokeWidth={2.4} />
                {playing ? "Pause" : "Play Animation"}
              </button>
            </div>
          </Panel>
        </div>

        <div className="map-grid__rail">
          <PageState state={state}>
            {(data) => (
              <>
                <Panel title="Hotspot Insights">
                  <div className="insight">
                    <div className="insight__head">
                      <span className="insight__dot" />
                      <span className="insight__zone">{data.insight.zone}</span>
                      <span className="insight__badge">{data.insight.intensity}</span>
                    </div>
                    <p className="insight__delta">
                      <Icon name="arrow-up" size={13} strokeWidth={2.4} />
                      {data.insight.delta} risk score
                    </p>

                    <dl className="insight__rows">
                      <InsightRow icon="clock" label="Peak Time" value={data.insight.peakTime} />
                      <InsightRow icon="tag" label="Top Crime Head" value={data.insight.topCrimeHead} />
                      <InsightRow icon="file-text" label="Total Cases" value={data.insight.totalCases} />
                    </dl>

                    <button
                      type="button"
                      className="insight__cta"
                      onClick={() => protoToast("Zone drilldown needs a live query backend")}
                    >
                      View Zone Details
                      <Icon name="arrow-right" size={16} strokeWidth={2} />
                    </button>
                  </div>
                </Panel>

                <Panel title="Top Crime Heads" note="(in view)">
                  <div className="crimeheads">
                    <Donut
                      slices={data.crimeHeads}
                      centerValue={data.totalCases}
                      centerLabel="Total Cases"
                    />
                    <ul className="crimeheads__legend">
                      {data.crimeHeads.map((s) => (
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
              </>
            )}
          </PageState>
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
