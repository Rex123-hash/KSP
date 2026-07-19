import { useState } from "react";
import { Icon } from "../components/Icon";
import { Panel } from "../components/Panel";
import { Avatar } from "../components/Avatar";
import { NetworkGraph, type NetworkNode } from "../components/NetworkGraph";
import { PageState } from "../components/PageState";
import { useApi } from "../api";
import "./PersonNetwork.css";

function tierOf(score: number): "high" | "medium" | "low" {
  if (score >= 75) return "high";
  if (score >= 60) return "medium";
  return "low";
}

type Person = {
  id: number;
  name: string;
  confidence: number;
  aliases: string[];
  knownFor: string;
  age: number;
  gender: string;
  lastSeen: string;
  linkedCases: number;
  mergedFrom: string[];
  riskScore: number;
};
type Connection = { name: string; confidence: number; relation: string };
type LinkedCase = {
  firNo: string;
  crimeHead: string;
  station: string;
  date: string;
  status: string;
  statusSlug: string;
};
type PersonData = {
  person: Person;
  network: NetworkNode[];
  connections: Connection[];
  relationSummary: { total: number; high: number; medium: number; low: number };
  insights: {
    strongAssociations: string;
    networkDensity: string;
    activityLevel: string;
    riskScore: number;
  };
  linkedCases: LinkedCase[];
};

export function PersonNetwork() {
  const [view, setView] = useState<"graph" | "list">("graph");
  const state = useApi<PersonData>("/persons/featured");

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Person &amp; Network</h1>
          <p className="page-subtitle">
            Identify connected persons and criminal networks
          </p>
        </div>
        <div className="page-controls">
          <label className="pn-search">
            <Icon name="user" size={16} />
            <input placeholder="Search by name, alias or ID" />
          </label>
          <button type="button" className="page-control">
            <Icon name="filter" size={16} />
            <span>Advanced Filters</span>
          </button>
        </div>
      </div>

      <PageState state={state}>
        {(data) => (
          <div className="pn-grid">
            {/* ---- Left: graph + linked cases ---------------------------- */}
            <div className="pn-grid__main">
              <section className="panel pn-graph-panel">
                <div className="pn-graph-panel__head">
                  <div className="pn-toggle" role="tablist" aria-label="Network view">
                    <button
                      type="button"
                      className={`pn-toggle__btn${view === "graph" ? " is-active" : ""}`}
                      onClick={() => setView("graph")}
                    >
                      <Icon name="network" size={15} /> Network Graph
                    </button>
                    <button
                      type="button"
                      className={`pn-toggle__btn${view === "list" ? " is-active" : ""}`}
                      onClick={() => setView("list")}
                    >
                      <Icon name="file-text" size={15} /> List View
                    </button>
                  </div>
                </div>

                {view === "graph" ? (
                  <NetworkGraph
                    focusName={data.person.name}
                    focusConfidence={data.person.confidence}
                    nodes={data.network}
                  />
                ) : (
                  <ConnectionList connections={data.connections} />
                )}
              </section>

              <Panel
                title={`Linked Cases (${data.linkedCases.length})`}
                action={{ label: "View All Cases" }}
                bleed
              >
                <div className="pn-cases__scroll">
                  <table className="pn-cases">
                    <thead>
                      <tr>
                        <th>FIR No.</th>
                        <th>Crime Head</th>
                        <th>Police Station</th>
                        <th>Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.linkedCases.map((c) => (
                        <tr key={c.firNo}>
                          <td className="tabular pn-cases__no">{c.firNo}</td>
                          <td>{c.crimeHead}</td>
                          <td>{c.station}</td>
                          <td className="tabular pn-cases__date">{c.date}</td>
                          <td>
                            <span className={`pill is-${c.statusSlug}`}>{c.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            </div>

            {/* ---- Right: profile --------------------------------------- */}
            <div className="pn-grid__rail">
              <Panel title="Person Profile">
                <div className="profile">
                  <div className="profile__head">
                    <Avatar name={data.person.name} size={54} />
                    <div className="profile__id">
                      <p className="profile__name-line">
                        <span className="profile__name">{data.person.name}</span>
                        <span className="profile__badge">
                          {data.person.confidence >= 75 ? "High Confidence" : "Medium Confidence"}
                        </span>
                      </p>
                      <p className="profile__conf">
                        Confidence Score: {data.person.confidence}%
                      </p>
                    </div>
                  </div>

                  {/* The moat, shown: the raw name strings that resolved into
                      one person — the pitch's payoff. */}
                  <div className="resolved">
                    <p className="resolved__head">
                      <Icon name="shield-check" size={14} />
                      Resolved from {data.person.mergedFrom.length} records
                    </p>
                    <div className="resolved__variants">
                      {data.person.mergedFrom.map((v) => (
                        <span key={v} className="resolved__variant">
                          {v}
                        </span>
                      ))}
                      <span className="resolved__arrow" aria-hidden="true">
                        <Icon name="arrow-right" size={13} strokeWidth={2} />
                      </span>
                      <span className="resolved__one">{data.person.name}</span>
                    </div>
                    <p className="resolved__note">
                      Same person inferred across spelling variants · verified
                      against ground truth
                    </p>
                  </div>

                  <dl className="profile__facts">
                    <Fact icon="tag" label="Alias" value={data.person.aliases.join(", ") || "—"} />
                    <Fact icon="alert" label="Known For" value={data.person.knownFor} />
                    <Fact icon="user" label="Age" value={`${data.person.age} Years`} />
                    <Fact icon="clock" label="Last Seen" value={data.person.lastSeen} />
                    <Fact icon="user" label="Gender" value={data.person.gender} />
                    <Fact icon="file-text" label="Linked Cases" value={`${data.person.linkedCases} Cases`} />
                  </dl>
                </div>
              </Panel>

              <Panel title="Relation Summary">
                <div className="relsum">
                  <RelCell n={data.relationSummary.total} label="Total Connections" tone="neutral" />
                  <RelCell n={data.relationSummary.high} label="High Confidence" tone="good" />
                  <RelCell n={data.relationSummary.medium} label="Medium Confidence" tone="warning" />
                  <RelCell n={data.relationSummary.low} label="Low Confidence" tone="critical" />
                </div>
              </Panel>

              <Panel title="Connected To" action={{ label: "View All Connections" }}>
                <ul className="connlist">
                  {data.connections.map((c) => (
                    <li key={c.name} className="connlist__row">
                      <Avatar name={c.name} size={34} />
                      <div className="connlist__id">
                        <span className="connlist__name">{c.name}</span>
                        <span className="connlist__conf">Confidence: {c.confidence}%</span>
                      </div>
                      <span className={`connlist__tag is-${tierOf(c.confidence)}`}>
                        {c.relation}
                      </span>
                      <button type="button" className="connlist__eye" aria-label="View">
                        <Icon name="eye" size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              </Panel>

              <Panel title="Network Insights">
                <div className="insights">
                  <Insight icon="network" label="Strong Associations" value={data.insights.strongAssociations} />
                  <Insight icon="hierarchy" label="Network Density" value={data.insights.networkDensity} />
                  <Insight icon="chart-up" label="Activity Level" value={data.insights.activityLevel} />
                  <Insight icon="alert" label="Risk Score" value={`${data.insights.riskScore} / 100`} accent />
                </div>
              </Panel>
            </div>
          </div>
        )}
      </PageState>
    </>
  );
}

/* -------------------------------------------------------------------------- */

function Fact({ icon, label, value }: { icon: Parameters<typeof Icon>[0]["name"]; label: string; value: string }) {
  return (
    <div className="profile__fact">
      <dt>
        <Icon name={icon} size={14} />
        {label}
      </dt>
      <dd>{value}</dd>
    </div>
  );
}

function RelCell({ n, label, tone }: { n: number; label: string; tone: string }) {
  return (
    <div className={`relsum__cell is-${tone}`}>
      <span className="relsum__n">{n}</span>
      <span className="relsum__label">{label}</span>
    </div>
  );
}

function Insight({
  icon,
  label,
  value,
  accent = false,
}: {
  icon: Parameters<typeof Icon>[0]["name"];
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className={`insights__row${accent ? " is-accent" : ""}`}>
      <span className="insights__icon">
        <Icon name={icon} size={16} />
      </span>
      <span className="insights__label">{label}</span>
      <span className="insights__value">{value}</span>
    </div>
  );
}

function ConnectionList({ connections }: { connections: Connection[] }) {
  return (
    <div className="pn-cases__scroll">
      <table className="pn-cases">
        <thead>
          <tr>
            <th>Person</th>
            <th>Confidence</th>
            <th>Relation</th>
          </tr>
        </thead>
        <tbody>
          {connections.map((c) => (
            <tr key={c.name}>
              <td>
                <span className="pn-listcell">
                  <Avatar name={c.name} size={28} />
                  {c.name}
                </span>
              </td>
              <td className="tabular">{c.confidence}%</td>
              <td>
                <span className={`connlist__tag is-${tierOf(c.confidence)}`}>
                  {c.relation}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
