import { Icon, type IconName } from "../components/Icon";
import { Panel } from "../components/Panel";
import { StatTile } from "../components/StatTile";
import { Donut } from "../components/Donut";
import { MultiLineChart } from "../components/MultiLineChart";
import { PageState } from "../components/PageState";
import { protoToast, toast } from "../components/Toast";
import { useApi, downloadUrl } from "../api";
import { useMeta } from "../meta";
import type { Kpi } from "../data/mock";
import type { CrimeHeadSlice } from "../data/mapMock";
import type { LineSeries } from "../data/reportsMock";
import "./Reports.css";

type ZoneRow = { zone: string; casesLabel: string; pct: number };
type ReportRow = {
  icon: IconName;
  type: string;
  description: string;
  period: string;
  generatedOn: string;
  kind: string;
};
type ReportsData = {
  kpis: Kpi[];
  axisLabels: string[];
  series: LineSeries[];
  crimeHeads: CrimeHeadSlice[];
  totalCases: string;
  zones: ZoneRow[];
  reportList: ReportRow[];
};

export function Reports() {
  const state = useApi<ReportsData>("/reports");
  const { dateRange } = useMeta();

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
            <span>{dateRange}</span>
            <Icon name="chevron-down" size={14} strokeWidth={2} />
          </button>
          <a className="page-control ta-primary" href={downloadUrl("summary")} download onClick={() => toast("Summary report exported")}>
            <Icon name="arrow-down" size={16} />
            <span>Export Report</span>
          </a>
        </div>
      </div>

      <PageState state={state}>
        {(data) => {
          const maxPct = Math.max(...data.zones.map((z) => z.pct), 1);
          return (
            <>
              <div className="rp-kpis">
                {data.kpis.map((k) => (
                  <StatTile key={k.id} kpi={k} />
                ))}
              </div>

              <div className="rp-mid">
                <Panel title="Cases Over Time" action={{ label: "View Full Report" }} onAction={() => protoToast("Full report view needs a live query backend")}>
                  <div className="rp-legend">
                    {data.series.map((s) => (
                      <span key={s.label} className="rp-legend__item">
                        <span className="rp-legend__dot" style={{ background: s.color }} />
                        {s.label}
                      </span>
                    ))}
                  </div>
                  <MultiLineChart series={data.series} labels={data.axisLabels} />
                </Panel>

                <Panel title="Cases by Crime Head" action={{ label: "View Full Report" }} onAction={() => protoToast("Full report view needs a live query backend")}>
                  <div className="rp-dist">
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

              <div className="rp-bottom">
                <Panel title="Report Summary" action={{ label: "View All Reports" }} onAction={() => protoToast("Full report archive needs a live query backend")} bleed>
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
                        {data.reportList.map((r) => (
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
                              <a
                                className="rp-reports__dl"
                                href={downloadUrl(r.kind)}
                                download
                                aria-label={`Download ${r.type}`}
                              >
                                <Icon name="arrow-down" size={16} />
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Panel>

                <Panel title="Top Zones by Cases" action={{ label: "View Full Report" }} onAction={() => protoToast("Full report view needs a live query backend")}>
                  <div className="rp-zones__head">
                    <span>Zone</span>
                    <span>Cases</span>
                    <span className="rp-zones__pct-h">% of Total</span>
                  </div>
                  <ul className="rp-zones">
                    {data.zones.map((z) => (
                      <li key={z.zone} className="rp-zones__row">
                        <span className="rp-zones__name">{z.zone}</span>
                        <span className="tabular rp-zones__cases">{z.casesLabel}</span>
                        <span className="rp-zones__bar">
                          <span className="rp-zones__fill" style={{ width: `${(z.pct / maxPct) * 100}%` }} />
                        </span>
                        <span className="tabular rp-zones__pct">{z.pct}%</span>
                      </li>
                    ))}
                  </ul>
                  <a className="rp-zones__all" href={downloadUrl("zones")} download>
                    Export All Zones
                    <Icon name="arrow-right" size={14} strokeWidth={2} />
                  </a>
                </Panel>
              </div>
            </>
          );
        }}
      </PageState>
    </>
  );
}
