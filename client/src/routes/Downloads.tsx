import { Icon, type IconName } from "../components/Icon";
import { PageState } from "../components/PageState";
import { useApi, downloadUrl } from "../api";
import "./Downloads.css";

type ReportRow = {
  icon: IconName;
  type: string;
  description: string;
  period: string;
  generatedOn: string;
  kind: string;
};
type ReportsData = { reportList: ReportRow[] };

export function Downloads() {
  const state = useApi<ReportsData>("/reports");

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Downloads</h1>
          <p className="page-subtitle">Export computed reports and datasets as CSV</p>
        </div>
      </div>

      <PageState state={state}>
        {(data) => (
          <div className="dl-grid">
            {data.reportList.map((r) => (
              <article key={r.kind} className="dl-card">
                <span className="dl-card__icon">
                  <Icon name={r.icon} size={22} />
                </span>
                <h2 className="dl-card__title">{r.type}</h2>
                <p className="dl-card__desc">{r.description}</p>
                <p className="dl-card__meta">
                  <Icon name="calendar" size={13} /> {r.period}
                </p>
                <a className="dl-card__btn" href={downloadUrl(r.kind)} download>
                  <Icon name="arrow-down" size={16} />
                  Download CSV
                </a>
              </article>
            ))}
          </div>
        )}
      </PageState>
    </>
  );
}
