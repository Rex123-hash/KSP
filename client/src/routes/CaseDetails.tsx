import { useState } from "react";
import { Icon } from "../components/Icon";
import { LocationMap } from "../components/LocationMap";
import {
  caseHeader,
  caseInfo,
  caseLocation,
  caseSummary,
  caseTabs,
} from "../data/caseMock";
import "./CaseDetails.css";

export function CaseDetails() {
  const [tab, setTab] = useState("info");

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Case / FIR Details</h1>
          <p className="page-subtitle">View complete information of a case</p>
        </div>
        <div className="page-controls">
          <button type="button" className="page-control">
            <Icon name="arrow-right" size={16} className="cd-flip" />
            <span>Back to Results</span>
          </button>
          <button type="button" className="page-control">
            <span>Next Case</span>
            <Icon name="arrow-right" size={16} />
          </button>
          <button type="button" className="page-control ta-primary">
            <Icon name="file-text" size={16} />
            <span>Download FIR</span>
          </button>
        </div>
      </div>

      {/* Header strip */}
      <div className="cd-strip">
        <div className="cd-strip__fir">
          <span className="cd-strip__fir-label">FIR No.</span>
          <span className="cd-strip__fir-no tabular">{caseHeader.firNo}</span>
        </div>
        <StripField label="Police Station" value={caseHeader.station} />
        <StripField label="Crime Head" value={caseHeader.crimeHead} />
        <StripField label="Registered On" value={caseHeader.registeredOn} />
        <div className="cd-strip__field">
          <span className="cd-strip__label">Status</span>
          <span className="pill is-under-investigation">{caseHeader.status}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="cd-tabs" role="tablist">
        {caseTabs.map((t) => (
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

      {/* Body: three columns */}
      <div className="cd-body">
        <section className="panel cd-card">
          <h2 className="cd-card__title">Case Information</h2>
          <dl className="cd-info">
            {caseInfo.map((row) => (
              <div key={row.label} className="cd-info__row">
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="panel cd-card">
          <h2 className="cd-card__title">Location of Occurrence</h2>
          <LocationMap lat={caseLocation.lat} lng={caseLocation.lng} height={300} />
          <div className="cd-loc">
            <p className="cd-loc__addr">
              <Icon name="map-pin" size={15} />
              {caseLocation.address}
            </p>
            <button type="button" className="cd-loc__link">
              View on Map
              <Icon name="arrow-right" size={14} strokeWidth={2} />
            </button>
          </div>
        </section>

        <section className="panel cd-card">
          <h2 className="cd-card__title">Case Summary</h2>
          <ul className="cd-summary">
            {caseSummary.map((s) => (
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

      {/* Actions */}
      <section className="panel cd-actions">
        <h2 className="cd-card__title">Actions</h2>
        <div className="cd-actions__row">
          <button type="button" className="cd-action">
            <Icon name="file-text" size={16} /> Add Note
          </button>
          <button type="button" className="cd-action">
            <Icon name="network" size={16} /> Share Case
          </button>
          <button type="button" className="cd-action">
            <Icon name="file-check" size={16} /> Update Status
          </button>
          <button type="button" className="cd-action is-danger">
            <Icon name="lock" size={16} /> Close Case
          </button>
        </div>
      </section>
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
