import { useState } from "react";
import { Icon } from "../components/Icon";
import { Panel } from "../components/Panel";
import { Avatar } from "../components/Avatar";
import { NetworkGraph } from "../components/NetworkGraph";
import {
  connections,
  focusPerson,
  linkedCases,
  networkInsights,
  relationSummary,
  tierOf,
} from "../data/networkMock";
import "./PersonNetwork.css";

export function PersonNetwork() {
  const [view, setView] = useState<"graph" | "list">("graph");

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

      <div className="pn-grid">
        {/* ---- Left: graph + linked cases -------------------------------- */}
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
              <NetworkGraph />
            ) : (
              <ConnectionList />
            )}
          </section>

          <Panel
            title={`Linked Cases (${linkedCases.length})`}
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
                  {linkedCases.map((c) => (
                    <tr key={c.firNo}>
                      <td className="tabular pn-cases__no">{c.firNo}</td>
                      <td>{c.crimeHead}</td>
                      <td>{c.station}</td>
                      <td className="tabular pn-cases__date">{c.date}</td>
                      <td>
                        <span
                          className={`pill is-${c.status
                            .toLowerCase()
                            .replace(/\s+/g, "-")}`}
                        >
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        {/* ---- Right: profile -------------------------------------------- */}
        <div className="pn-grid__rail">
          <Panel title="Person Profile">
            <div className="profile">
              <div className="profile__head">
                <Avatar name={focusPerson.name} size={54} />
                <div className="profile__id">
                  <p className="profile__name-line">
                    <span className="profile__name">{focusPerson.name}</span>
                    <span className="profile__badge">High Confidence</span>
                  </p>
                  <p className="profile__conf">
                    Confidence Score: {focusPerson.confidence}%
                  </p>
                </div>
              </div>

              {/* The moat, shown: the raw name strings that resolved into one
                  person. This is the pitch's payoff, not a footnote. */}
              <div className="resolved">
                <p className="resolved__head">
                  <Icon name="shield-check" size={14} />
                  Resolved from {focusPerson.mergedFrom.length} records
                </p>
                <div className="resolved__variants">
                  {focusPerson.mergedFrom.map((v) => (
                    <span key={v} className="resolved__variant">
                      {v}
                    </span>
                  ))}
                  <span className="resolved__arrow" aria-hidden="true">
                    <Icon name="arrow-right" size={13} strokeWidth={2} />
                  </span>
                  <span className="resolved__one">{focusPerson.name}</span>
                </div>
                <p className="resolved__note">
                  Same person inferred across spelling variants · verified against
                  ground truth
                </p>
              </div>

              <dl className="profile__facts">
                <Fact icon="tag" label="Alias" value={focusPerson.aliases.join(", ")} />
                <Fact icon="alert" label="Known For" value={focusPerson.knownFor} />
                <Fact icon="user" label="Age" value={`${focusPerson.age} Years`} />
                <Fact icon="clock" label="Last Seen" value={focusPerson.lastSeen} />
                <Fact icon="user" label="Gender" value={focusPerson.gender} />
                <Fact icon="file-text" label="Linked Cases" value={`${focusPerson.linkedCases} Cases`} />
              </dl>
            </div>
          </Panel>

          <Panel title="Relation Summary">
            <div className="relsum">
              <RelCell n={relationSummary.total} label="Total Connections" tone="neutral" />
              <RelCell n={relationSummary.high} label="High Confidence" tone="good" />
              <RelCell n={relationSummary.medium} label="Medium Confidence" tone="warning" />
              <RelCell n={relationSummary.low} label="Low Confidence" tone="critical" />
            </div>
          </Panel>

          <Panel title="Connected To" action={{ label: "View All Connections" }}>
            <ul className="connlist">
              {connections.map((c) => (
                <li key={c.name} className="connlist__row">
                  <Avatar name={c.name} size={34} />
                  <div className="connlist__id">
                    <span className="connlist__name">{c.name}</span>
                    <span className="connlist__conf">
                      Confidence: {c.confidence}%
                    </span>
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
              <Insight icon="network" label="Strong Associations" value={networkInsights.strongAssociations} />
              <Insight icon="hierarchy" label="Network Density" value={networkInsights.networkDensity} />
              <Insight icon="chart-up" label="Activity Level" value={networkInsights.activityLevel} />
              <Insight icon="alert" label="Risk Score" value={`${networkInsights.riskScore} / 100`} accent />
            </div>
          </Panel>
        </div>
      </div>
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

function ConnectionList() {
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
