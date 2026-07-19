import { Icon, type IconName } from "../components/Icon";
import { Panel } from "../components/Panel";
import { StatTile } from "../components/StatTile";
import { HotspotMap } from "../components/HotspotMap";
import { PageState } from "../components/PageState";
import { useApi } from "../api";
import { useMeta } from "../meta";
import type { Kpi } from "../data/mock";
import "./CommandView.css";

type Alert = {
  id: string;
  title: string;
  delta: string;
  deltaLabel: string;
  where: string;
  when: string;
  severity: "critical" | "serious" | "warning" | "good";
};
type Fir = {
  firNo: string;
  station: string;
  crimeHead: string;
  registeredOn: string;
  status: string;
  statusSlug: string;
};
type SummaryItem = {
  id: string;
  label: string;
  value: string;
  sub: string;
  icon: IconName;
  subSentiment?: "good" | "bad";
};
type CommandData = {
  kpis: Kpi[];
  alerts: Alert[];
  quickSummary: SummaryItem[];
  recentFirs: Fir[];
};

export function CommandView() {
  const state = useApi<CommandData>("/command");
  const { dateRange } = useMeta();

  return (
    <>
      <div className="cmd__head">
        <div>
          <h1 className="cmd__title">Command View</h1>
          <p className="cmd__subtitle">
            Overview of crime activity in your command
          </p>
        </div>

        <div className="cmd__controls">
          <button type="button" className="cmd__control">
            <Icon name="calendar" size={16} />
            <span>{dateRange}</span>
            <Icon name="chevron-down" size={14} strokeWidth={2} />
          </button>
          <button type="button" className="cmd__control">
            <Icon name="filter" size={16} />
            <span>Filters</span>
          </button>
        </div>
      </div>

      <PageState state={state}>
        {(data) => (
          <>
            <div className="cmd__kpis">
              {data.kpis.map((kpi) => (
                <StatTile key={kpi.id} kpi={kpi} />
              ))}
            </div>

            <div className="cmd__grid">
              <div className="cmd__col">
                <Panel
                  title="Crime Hotspots"
                  note="(this period)"
                  action={{ label: "View Full Map", icon: "external" }}
                  bleed
                >
                  <HotspotMap height={392} />
                </Panel>

                <Panel title="Quick Summary" note="(this period)">
                  <ul className="summary">
                    {data.quickSummary.map((item) => (
                      <li key={item.id} className="summary__item">
                        <span className="summary__icon">
                          <Icon name={item.icon} size={17} />
                        </span>
                        <div className="summary__text">
                          <p className="summary__label">{item.label}</p>
                          <p className="summary__value">{item.value}</p>
                          <p
                            className={`summary__sub${
                              item.subSentiment ? ` is-${item.subSentiment}` : ""
                            }`}
                          >
                            {item.sub}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </Panel>
              </div>

              <div className="cmd__col">
                <Panel title="Active Alerts" action={{ label: "View All" }} bleed>
                  <ul className="alerts">
                    {data.alerts.map((alert) => (
                      <AlertRow key={alert.id} alert={alert} />
                    ))}
                  </ul>
                </Panel>

                <Panel title="Recent FIRs" action={{ label: "View All" }} bleed>
                  <FirTable rows={data.recentFirs} />
                </Panel>
              </div>
            </div>
          </>
        )}
      </PageState>

      <footer className="cmd__footer">
        © 2026 Karnataka State Police <span aria-hidden="true">|</span> State
        Crime Records Bureau
      </footer>
    </>
  );
}

/* -------------------------------------------------------------------------- */

function AlertRow({ alert }: { alert: Alert }) {
  const rising = alert.severity !== "good";
  return (
    <li className={`alerts__row is-${alert.severity}`}>
      <span className="alerts__icon">
        <Icon name="arrow-up" size={15} strokeWidth={2.4} />
      </span>

      <div className="alerts__text">
        <p className="alerts__title-line">
          <span className="alerts__title">{alert.title}</span>
          <span className="alerts__delta">
            <Icon name="arrow-up" size={11} strokeWidth={2.4} />
            {alert.delta}
            <span className="alerts__delta-label">{alert.deltaLabel}</span>
          </span>
        </p>
        <p className="alerts__meta">
          {alert.where} <span aria-hidden="true">·</span> {alert.when}
        </p>
      </div>

      <span className="alerts__chevron" aria-hidden="true">
        <Icon name="chevron-right" size={16} strokeWidth={2} />
      </span>

      <span className="sr-only">
        {rising ? "Increase" : "Improvement"}, severity {alert.severity}
      </span>
    </li>
  );
}

function FirTable({ rows }: { rows: Fir[] }) {
  return (
    <div className="fir-table__scroll">
      <table className="fir-table">
        <thead>
          <tr>
            <th scope="col">FIR No.</th>
            <th scope="col">Police Station</th>
            <th scope="col">Crime Head</th>
            <th scope="col">Registered On</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((fir) => (
            <tr key={fir.firNo}>
              <td className="tabular fir-table__no">{fir.firNo}</td>
              <td>{fir.station}</td>
              <td>{fir.crimeHead}</td>
              <td className="tabular fir-table__when">{fir.registeredOn}</td>
              <td>
                <span className={`pill is-${fir.statusSlug}`}>{fir.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
