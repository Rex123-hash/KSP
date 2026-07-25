import { useEffect, useRef, useState } from "react";
import { Icon } from "../components/Icon";
import { Panel } from "../components/Panel";
import { HotspotMap, type MapLevel, type MapView } from "../components/HotspotMap";
import { Donut } from "../components/Donut";
import { PageState } from "../components/PageState";
import { apiGet, useApi } from "../api";
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
    zoneKey: string;
    intensity: string;
    delta: string;
    peakTime: string;
    topCrimeHead: string;
    totalCases: string;
  };
  crimeHeads: CrimeHeadSlice[];
  totalCases: string;
};

/** Per-station drilldown behind "View Zone Details". */
type ZoneDetail = {
  zone: string;
  zoneLabel: string;
  unitId: number;
  casesLabel: string;
  pct: number;
  riskLevel: string;
  riskPct: number;
  peakLabel: string;
  crimeHeads: { label: string; countLabel: string; pct: number }[];
  statusMix: { label: string; count: number }[];
  recentFirs: {
    firNo: string;
    crimeHead: string;
    registeredOn: string;
    status: string;
    statusSlug: string;
  }[];
};

const HOURS = ["12 AM", "4 AM", "8 AM", "12 PM", "4 PM", "8 PM", "11 PM"];

export function MapHotspots() {
  const [hour, setHour] = useState<number | null>(null); // null = all day
  const [headIdx, setHeadIdx] = useState(0); // index into HEADS
  const [playing, setPlaying] = useState(false);
  const [view, setView] = useState<MapView>("heat");
  const [level, setLevel] = useState<MapLevel>("zone");
  const playRef = useRef<number | null>(null);
  const state = useApi<MapData>("/map");
  const { dateRange } = useMeta();

  // Zone drilldown
  const [zone, setZone] = useState<ZoneDetail | null>(null);
  const [zoneLoading, setZoneLoading] = useState(false);
  const [zoneError, setZoneError] = useState<string | null>(null);

  async function openZone(zoneKey: string) {
    setZoneLoading(true);
    setZoneError(null);
    try {
      setZone(await apiGet<ZoneDetail>(`/zones/${encodeURIComponent(zoneKey)}`));
    } catch {
      setZoneError("Could not load this zone.");
    } finally {
      setZoneLoading(false);
    }
  }

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
          onClick={() => setView((v) => (v === "heat" ? "clusters" : "heat"))}
        >
          <span className="filter-chip__label">View By</span>
          <span className="filter-chip__value">
            <Icon name={view === "heat" ? "map-pin" : "layers"} size={14} />
            {view === "heat" ? "Heatmap" : "Clusters"}
            <Icon name="chevron-down" size={14} strokeWidth={2} />
          </span>
        </button>

        <button
          type="button"
          className="filter-chip"
          onClick={() => {
            setLevel((l) => (l === "zone" ? "district" : "zone"));
            // Granularity only shows in the cluster view, so switch to it.
            setView("clusters");
          }}
        >
          <span className="filter-chip__label">Level</span>
          <span className="filter-chip__value">
            {level === "zone" ? "Zone" : "District"}
            <Icon name="chevron-down" size={14} strokeWidth={2} />
          </span>
        </button>
      </div>

      <div className="map-grid">
        <div className="map-grid__main">
          <div className="map-panel">
            <HotspotMap
              height={512}
              showFilterChip={false}
              filterHour={hour}
              filterHead={headFilter}
              view={view}
              level={level}
            />
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
                      disabled={zoneLoading}
                      onClick={() => void openZone(data.insight.zoneKey ?? data.insight.zone)}
                    >
                      {zoneLoading ? "Loading…" : "View Zone Details"}
                      <Icon name="arrow-right" size={16} strokeWidth={2} />
                    </button>
                    {zoneError && <p className="insight__error">{zoneError}</p>}
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

      {zone && <ZoneDetailPanel zone={zone} onClose={() => setZone(null)} />}
    </>
  );
}

/**
 * Zone drilldown. Answers the operational question the map raises but can't
 * answer on its own: within this station, what is actually happening, when, and
 * where do the cases stand.
 */
function ZoneDetailPanel({ zone, onClose }: { zone: ZoneDetail; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const statusTotal = zone.statusMix.reduce((s, x) => s + x.count, 0) || 1;

  return (
    <div className="zonedlg" role="dialog" aria-modal="true" aria-label={`${zone.zoneLabel} details`}>
      <button type="button" className="zonedlg__scrim" aria-label="Close" onClick={onClose} />
      <div className="zonedlg__panel">
        <header className="zonedlg__head">
          <div>
            <p className="zonedlg__eyebrow">Zone Drilldown</p>
            <h2 className="zonedlg__title">{zone.zoneLabel}</h2>
          </div>
          <button type="button" className="zonedlg__close" onClick={onClose} aria-label="Close">
            <Icon name="minus" size={18} strokeWidth={2.4} />
          </button>
        </header>

        <div className="zonedlg__stats">
          <ZoneStat label="Total Cases" value={zone.casesLabel} />
          <ZoneStat label="Share of State" value={`${zone.pct}%`} />
          <ZoneStat label="Risk" value={`${zone.riskLevel} · ${zone.riskPct}%`} />
          <ZoneStat label="Peak Window" value={zone.peakLabel} />
        </div>

        <section className="zonedlg__section">
          <h3 className="zonedlg__subtitle">Crime Heads in this Zone</h3>
          <ul className="zonedlg__bars">
            {zone.crimeHeads.map((h) => (
              <li key={h.label} className="zonedlg__bar">
                <span className="zonedlg__bar-label">{h.label}</span>
                <span className="zonedlg__bar-track">
                  <span className="zonedlg__bar-fill" style={{ width: `${h.pct}%` }} />
                </span>
                <span className="zonedlg__bar-val tabular">
                  {h.countLabel} · {h.pct}%
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="zonedlg__section">
          <h3 className="zonedlg__subtitle">Investigation Status</h3>
          <ul className="zonedlg__status">
            {zone.statusMix.map((s) => (
              <li key={s.label} className="zonedlg__status-row">
                <span className="zonedlg__status-label">{s.label}</span>
                <span className="zonedlg__status-val tabular">
                  {s.count} ({Math.round((s.count / statusTotal) * 100)}%)
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="zonedlg__section">
          <h3 className="zonedlg__subtitle">Recent FIRs</h3>
          <table className="zonedlg__table">
            <thead>
              <tr>
                <th scope="col">FIR No.</th>
                <th scope="col">Crime Head</th>
                <th scope="col">Registered</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {zone.recentFirs.map((f) => (
                <tr key={f.firNo + f.registeredOn}>
                  <td className="tabular">{f.firNo}</td>
                  <td>{f.crimeHead}</td>
                  <td className="tabular">{f.registeredOn}</td>
                  <td>
                    <span className={`pill is-${f.statusSlug}`}>{f.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}

function ZoneStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="zonedlg__stat">
      <span className="zonedlg__stat-label">{label}</span>
      <span className="zonedlg__stat-value">{value}</span>
    </div>
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
