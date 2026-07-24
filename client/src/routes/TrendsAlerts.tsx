import { Icon, type IconName } from "../components/Icon";
import { Panel } from "../components/Panel";
import { Sparkline } from "../components/Sparkline";
import { LineChart } from "../components/LineChart";
import { Donut } from "../components/Donut";
import { PageState } from "../components/PageState";
import { protoToast } from "../components/Toast";
import { useApi } from "../api";
import { useMeta } from "../meta";
import type { Kpi } from "../data/mock";
import type { CrimeHeadSlice } from "../data/mapMock";
import "./TrendsAlerts.css";

type TrendingCrime = {
  crimeHead: string;
  direction: "up" | "down";
  change: string;
  cases: string;
  spark: number[];
};
type TrendAlert = {
  id: string;
  severity: "high" | "medium" | "low";
  title: string;
  where: string;
  when: string;
};
type RiskZone = { zone: string; level: "High" | "Medium" | "Low"; pct: number };
type TrendsData = {
  kpis: (Kpi & { breakdown?: { label: string; tone: string }[] })[];
  axisLabels: string[];
  current: number[];
  previous: number[];
  crimeHeads: CrimeHeadSlice[];
  totalCases: string;
  trending: TrendingCrime[];
  alerts: TrendAlert[];
  riskZones: RiskZone[];
};

export function TrendsAlerts() {
  const state = useApi<TrendsData>("/trends");
  const { dateRange } = useMeta();

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Trends &amp; Alerts</h1>
          <p className="page-subtitle">Monitor crime trends and detect unusual patterns</p>
        </div>
        <div className="page-controls">
          <button type="button" className="page-control">
            <Icon name="calendar" size={16} />
            <span>{dateRange}</span>
            <Icon name="chevron-down" size={14} strokeWidth={2} />
          </button>
          <button
            type="button"
            className="page-control ta-primary"
            onClick={() => protoToast("Custom range needs a live query backend")}
          >
            <Icon name="calendar" size={16} />
            <span>Custom Range</span>
          </button>
        </div>
      </div>

      <PageState state={state}>
        {(data) => (
          <>
            <div className="ta-kpis">
              {data.kpis.map((k) => (
                <TrendTile key={k.id} kpi={k} />
              ))}
            </div>

            <div className="ta-mid">
              <Panel title="Trend Overview" note="· current vs last period">
                <div className="ta-legend">
                  <span className="ta-legend__item">
                    <span className="ta-legend__dot ta-legend__dot--cur" /> Current Period
                  </span>
                  <span className="ta-legend__item">
                    <span className="ta-legend__dot ta-legend__dot--prev" /> Last Period
                  </span>
                </div>
                <LineChart current={data.current} previous={data.previous} labels={data.axisLabels} />
              </Panel>

              <Panel title="Crime Head Distribution">
                <div className="ta-dist">
                  <Donut slices={data.crimeHeads} centerValue={data.totalCases} centerLabel="Total Cases" />
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
            </div>

            <div className="ta-bottom">
              <Panel title="Trending Crimes" action={{ label: "View All Trending Crimes" }} onAction={() => protoToast("Full trending-crime drilldown needs a live query backend")} bleed>
                <div className="ta-trending__scroll">
                  <table className="ta-trending">
                    <thead>
                      <tr>
                        <th>Crime Head</th>
                        <th>Trend</th>
                        <th>Change</th>
                        <th>Cases</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.trending.map((c) => (
                        <tr key={c.crimeHead}>
                          <td className="ta-trending__name">{c.crimeHead}</td>
                          <td className="ta-trending__spark">
                            <Sparkline
                              points={c.spark}
                              sentiment={c.direction === "up" ? "bad" : "good"}
                              width={110}
                              height={30}
                            />
                          </td>
                          <td>
                            <span className={`ta-change is-${c.direction === "up" ? "bad" : "good"}`}>
                              <Icon name={c.direction === "up" ? "arrow-up" : "arrow-down"} size={12} strokeWidth={2.4} />
                              {c.change}
                            </span>
                          </td>
                          <td className="tabular ta-trending__cases">{c.cases}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>

              <Panel title="Alert Summary" action={{ label: "View All Alerts" }} onAction={() => protoToast("Full alert history needs a live query backend")} bleed>
                <ul className="ta-alerts">
                  {data.alerts.map((a) => (
                    <li key={a.id} className={`ta-alerts__row is-${a.severity}`}>
                      <span className="ta-alerts__icon">
                        <Icon name="bell" size={15} />
                      </span>
                      <span className={`ta-alerts__sev is-${a.severity}`}>
                        {a.severity === "high" ? "High" : a.severity === "medium" ? "Medium" : "Low"}
                      </span>
                      <div className="ta-alerts__text">
                        <p className="ta-alerts__title">{a.title}</p>
                        <p className="ta-alerts__meta">
                          {a.where} <span aria-hidden="true">·</span> {a.when}
                        </p>
                      </div>
                      <Icon name="chevron-right" size={16} strokeWidth={2} />
                    </li>
                  ))}
                </ul>
              </Panel>

              <Panel title="Predicted Risk Zones" note="(next 7 days)">
                <ul className="ta-risk">
                  {data.riskZones.map((z) => (
                    <li key={z.zone} className="ta-risk__row">
                      <span className="ta-risk__zone">{z.zone}</span>
                      <span className={`ta-risk__badge is-${z.level.toLowerCase()}`}>{z.level}</span>
                      <span className="ta-risk__bar">
                        <span
                          className={`ta-risk__fill is-${z.level.toLowerCase()}`}
                          style={{ width: `${z.pct}%` }}
                        />
                      </span>
                      <span className="ta-risk__pct tabular">{z.pct}%</span>
                    </li>
                  ))}
                </ul>
                <p className="ta-risk__note">
                  <Icon name="alert" size={13} />
                  Risk score is calculated from historical and recent case data.
                </p>
              </Panel>
            </div>
          </>
        )}
      </PageState>
    </>
  );
}

/* -------------------------------------------------------------------------- */

function TrendTile({ kpi }: { kpi: Kpi & { breakdown?: { label: string; tone: string }[] } }) {
  const sentiment = kpi.deltaSentiment ?? "good";
  return (
    <article className="tkpi">
      <header className="tkpi__head">
        <span className="tkpi__label">{kpi.label}</span>
        <span className={`tkpi__icon is-${sentiment}`}>
          <Icon name={kpi.icon as IconName} size={17} />
        </span>
      </header>
      <p className="tkpi__value">{kpi.value}</p>

      {kpi.delta && !kpi.breakdown && (
        <p className={`tkpi__delta is-${sentiment}`}>
          <Icon name={kpi.deltaDirection === "up" ? "arrow-up" : "arrow-down"} size={13} strokeWidth={2.2} />
          <span className="tkpi__delta-val">{kpi.delta}</span>
          <span className="tkpi__delta-lab">vs last period</span>
        </p>
      )}

      {kpi.breakdown && (
        <p className="tkpi__breakdown">
          {kpi.breakdown.map((b, i) => (
            <span key={b.label} className="tkpi__bd">
              <span className="tkpi__bd-dot" style={{ background: b.tone }} />
              {b.label}
              {i < kpi.breakdown!.length - 1 && <span className="tkpi__bd-sep">·</span>}
            </span>
          ))}
        </p>
      )}

      {kpi.spark && !kpi.breakdown && (
        <div className="tkpi__spark">
          <Sparkline points={kpi.spark} sentiment={sentiment} />
        </div>
      )}
    </article>
  );
}
