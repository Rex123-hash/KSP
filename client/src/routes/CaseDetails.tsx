import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon, type IconName } from "../components/Icon";
import { LocationMap } from "../components/LocationMap";
import { PageState } from "../components/PageState";
import { toast, protoToast } from "../components/Toast";
import { useApi } from "../api";
import "./CaseDetails.css";

type CaseData = {
  header: {
    firNo: string;
    crimeNo: string;
    station: string;
    crimeHead: string;
    registeredOn: string;
    status: string;
    statusSlug: string;
  };
  tabs: { key: string; label: string; count?: number }[];
  info: { label: string; value: string }[];
  location: { lat: number; lng: number; address: string };
  summary: { icon: IconName; label: string; value: string; tone?: string }[];
};

export function CaseDetails() {
  const [tab, setTab] = useState("info");
  const state = useApi<CaseData>("/cases/featured");
  const navigate = useNavigate();

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Case / FIR Details</h1>
          <p className="page-subtitle">View complete information of a case</p>
        </div>
        <div className="page-controls">
          <button type="button" className="page-control" onClick={() => navigate("/command")}>
            <Icon name="arrow-right" size={16} className="cd-flip" />
            <span>Back to Results</span>
          </button>
          <button
            type="button"
            className="page-control"
            onClick={() => toast("This is the most recent FIR in scope", { icon: "file-text", tone: "info" })}
          >
            <span>Next Case</span>
            <Icon name="arrow-right" size={16} />
          </button>
          <button
            type="button"
            className="page-control ta-primary"
            onClick={() => toast("FIR export queued — download starting", { icon: "arrow-down" })}
          >
            <Icon name="file-text" size={16} />
            <span>Download FIR</span>
          </button>
        </div>
      </div>

      <PageState state={state}>
        {(data) => (
          <>
            <div className="cd-strip">
              <div className="cd-strip__fir">
                <span className="cd-strip__fir-label">FIR No.</span>
                <span className="cd-strip__fir-no tabular">{data.header.firNo}</span>
              </div>
              <StripField label="Police Station" value={data.header.station} />
              <StripField label="Crime Head" value={data.header.crimeHead} />
              <StripField label="Registered On" value={data.header.registeredOn} />
              <div className="cd-strip__field">
                <span className="cd-strip__label">Status</span>
                <span className={`pill is-${data.header.statusSlug}`}>{data.header.status}</span>
              </div>
            </div>

            <div className="cd-tabs" role="tablist">
              {data.tabs.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.key}
                  className={`cd-tab${tab === t.key ? " is-active" : ""}`}
                  onClick={() => setTab(t.key)}
                >
                  {t.label}
                  {t.count != null && <span className="cd-tab__count">({t.count})</span>}
                </button>
              ))}
            </div>

            <div className="cd-body">
              <section className="panel cd-card">
                <h2 className="cd-card__title">Case Information</h2>
                <dl className="cd-info">
                  {data.info.map((row) => (
                    <div key={row.label} className="cd-info__row">
                      <dt>{row.label}</dt>
                      <dd>{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section className="panel cd-card">
                <h2 className="cd-card__title">Location of Occurrence</h2>
                <LocationMap lat={data.location.lat} lng={data.location.lng} height={300} />
                <div className="cd-loc">
                  <p className="cd-loc__addr">
                    <Icon name="map-pin" size={15} />
                    {data.location.address}
                  </p>
                  <button type="button" className="cd-loc__link" onClick={() => navigate("/map")}>
                    View on Map
                    <Icon name="arrow-right" size={14} strokeWidth={2} />
                  </button>
                </div>
              </section>

              <section className="panel cd-card">
                <h2 className="cd-card__title">Case Summary</h2>
                <ul className="cd-summary">
                  {data.summary.map((s) => (
                    <li key={s.label} className="cd-summary__row">
                      <span className="cd-summary__icon">
                        <Icon name={s.icon} size={16} />
                      </span>
                      <span className="cd-summary__label">{s.label}</span>
                      {s.tone ? (
                        <span className={`cd-summary__badge is-${s.tone}`}>{s.value}</span>
                      ) : (
                        <span className="cd-summary__value">{s.value}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <section className="panel cd-actions">
              <h2 className="cd-card__title">Actions</h2>
              <div className="cd-actions__row">
                <button
                  type="button"
                  className="cd-action"
                  onClick={() => protoToast("Read-only deployment — notes aren’t saved")}
                >
                  <Icon name="file-text" size={16} /> Add Note
                </button>
                <button
                  type="button"
                  className="cd-action"
                  onClick={() => toast("Case link copied to clipboard")}
                >
                  <Icon name="share" size={16} /> Share Case
                </button>
                <button
                  type="button"
                  className="cd-action"
                  onClick={() => protoToast("Read-only deployment — status can’t be changed")}
                >
                  <Icon name="file-check" size={16} /> Update Status
                </button>
                <button
                  type="button"
                  className="cd-action is-danger"
                  onClick={() => protoToast("Read-only deployment — cases can’t be closed")}
                >
                  <Icon name="lock" size={16} /> Close Case
                </button>
              </div>
            </section>
          </>
        )}
      </PageState>
    </>
  );
}

function StripField({ label, value }: { label: string; value: string }) {
  return (
    <div className="cd-strip__field">
      <span className="cd-strip__label">{label}</span>
      <span className="cd-strip__value">{value}</span>
    </div>
  );
}
