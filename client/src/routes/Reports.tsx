import { Icon } from "../components/Icon";
import { Panel } from "../components/Panel";
import { StatTile } from "../components/StatTile";
import { Donut } from "../components/Donut";
import { MultiLineChart } from "../components/MultiLineChart";
import {
  reportAxisLabels,
  reportCrimeHeads,
  reportKpis,
  reportRows,
  reportSeries,
  reportsDateRange,
  reportTotalCases,
  topZones,
} from "../data/reportsMock";
import "./Reports.css";

export function Reports() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Comprehensive insights and analytics on crime data</p>
        </div>
        <div className="page-controls">
          <button type="button" className="page-control">
            <Icon name="calendar" size={16} />
            <span>{reportsDateRange}</span>
            <Icon name="chevron-down" size={14} strokeWidth={2} />
          </button>
          <button type="button" className="page-control">
            <Icon name="filter" size={16} />
            <span>Filters</span>
          </button>
        </div>
      </div>

      <div className="rp-kpis">
        {reportKpis.map((k) => (
          <StatTile key={k.id} kpi={k} />
        ))}
      </div>

      <div className="rp-mid">
        <Panel title="Cases Over Time" action={{ label: "View Full Report" }}>
          <div className="rp-legend">
            {reportSeries.map((s) => (
              <span key={s.label} className="rp-legend__item">
                <span className="rp-legend__dot" style={{ background: s.color }} />
                {s.label}
              </span>
            ))}
          </div>
          <MultiLineChart series={reportSeries} labels={reportAxisLabels} />
        </Panel>

        <Panel title="Cases by Crime Head" action={{ label: "View Full Report" }}>
          <div className="rp-dist">
            <Donut slices={reportCrimeHeads} centerValue={reportTotalCases} centerLabel="Total Cases" />
            <ul className="crimeheads__legend">
              {reportCrimeHeads.map((s) => (
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

      <div className="rp-bottom">
        <Panel title="Report Summary" action={{ label: "View All Reports" }} bleed>
          <div className="rp-reports__scroll">
            <table className="rp-reports">
              <thead>
                <tr>
                  <th>Report Type</th>
                  <th>Description</th>
                  <th>Period</th>
                  <th>Generated On</th>
                  <th className="rp-reports__act-h">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reportRows.map((r) => (
                  <tr key={r.type}>
                    <td>
                      <span className="rp-reports__type">
                        <span className="rp-reports__icon">
                          <Icon name={r.icon} size={15} />
                        </span>
                        {r.type}
                      </span>
                    </td>
                    <td className="rp-reports__desc">{r.description}</td>
                    <td className="tabular rp-reports__muted">{r.period}</td>
                    <td className="tabular rp-reports__muted">{r.generatedOn}</td>
                    <td>
                      <button type="button" className="rp-reports__dl" aria-label={`Download ${r.type}`}>
                        <Icon name="arrow-down" size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Top Zones by Cases" action={{ label: "View Full Report" }}>
          <div className="rp-zones__head">
            <span>Zone</span>
            <span>Cases</span>
            <span className="rp-zones__pct-h">% of Total</span>
          </div>
          <ul className="rp-zones">
            {topZones.map((z) => (
              <li key={z.zone} className="rp-zones__row">
                <span className="rp-zones__name">{z.zone}</span>
                <span className="tabular rp-zones__cases">{z.cases}</span>
                <span className="rp-zones__bar">
                  <span className="rp-zones__fill" style={{ width: `${(z.pct / 22.1) * 100}%` }} />
                </span>
                <span className="tabular rp-zones__pct">{z.pct}%</span>
              </li>
            ))}
          </ul>
          <button type="button" className="rp-zones__all">
            View All Zones
            <Icon name="arrow-right" size={14} strokeWidth={2} />
          </button>
        </Panel>
      </div>
    </>
  );
}
