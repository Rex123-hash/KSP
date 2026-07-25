import { useCallback, useEffect, useState } from "react";
import { Icon } from "../components/Icon";
import { writeGet } from "../api";
import { useAuth } from "../auth";
import "./AuditTrail.css";

/**
 * Audit trail — Challenge 2's governance requirement made visible.
 *
 * Refused actions are listed alongside successful ones. That is the point: a
 * denial recorded here is proof the command-scope check actually ran, which a
 * successful action alone can never demonstrate.
 *
 * Entries are scoped server-side to the caller's command subtree.
 */

type Entry = {
  id: string;
  actorName: string;
  actorEmail: string;
  actorUnit: string;
  action: string;
  entityType: string;
  entityId: string;
  outcome: "allow" | "deny" | string;
  detail: string;
  createdAt: string;
};

type AuditResponse = { scopeLabel: string; entries: Entry[] };

const ACTION_LABEL: Record<string, string> = {
  "note.add": "Note added",
  "case.status": "Status changed",
  "case.close": "Case closed",
  "profile.update": "Profile updated",
};

function when(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AuditTrail() {
  const { authenticated, reachable, loading: authLoading } = useAuth();
  const [data, setData] = useState<AuditResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!authenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setData(await writeGet<AuditResponse>("/audit?limit=100"));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the audit trail.");
    } finally {
      setLoading(false);
    }
  }, [authenticated]);

  useEffect(() => {
    void load();
  }, [load]);

  const denials = data?.entries.filter((e) => e.outcome === "deny").length ?? 0;

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Audit Trail</h1>
          <p className="page-subtitle">
            Every write action and every refused attempt, within your command scope
          </p>
        </div>
        <div className="page-controls">
          <button type="button" className="page-control" onClick={() => void load()}>
            <Icon name="arrow-down" size={16} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {!authLoading && !reachable && (
        <p className="at-note">
          <Icon name="shield" size={15} />
          <span>The write service isn’t reachable in this build, so no actions are recorded.</span>
        </p>
      )}

      {!authLoading && reachable && !authenticated && (
        <p className="at-note">
          <Icon name="lock" size={15} />
          <span>Sign in to view the audit trail for your command.</span>
        </p>
      )}

      {authenticated && (
        <section className="panel at-panel">
          <header className="at-head">
            <h2 className="at-title">
              {data ? data.scopeLabel : "Loading…"}
              {data && (
                <span className="at-count">
                  {data.entries.length} entr{data.entries.length === 1 ? "y" : "ies"}
                  {denials > 0 && <span className="at-denials"> · {denials} refused</span>}
                </span>
              )}
            </h2>
          </header>

          {loading && <p className="at-empty">Loading audit entries…</p>}
          {error && !loading && <p className="at-empty">{error}</p>}

          {!loading && !error && data && data.entries.length === 0 && (
            <p className="at-empty">
              No recorded activity yet. Add a note or change a case status to see it here.
            </p>
          )}

          {!loading && !error && data && data.entries.length > 0 && (
            <div className="at-scroll">
              <table className="at-table">
                <thead>
                  <tr>
                    <th scope="col">When</th>
                    <th scope="col">Officer</th>
                    <th scope="col">Unit</th>
                    <th scope="col">Action</th>
                    <th scope="col">Target</th>
                    <th scope="col">Outcome</th>
                    <th scope="col">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {data.entries.map((e) => (
                    <tr key={e.id} className={e.outcome === "deny" ? "is-deny" : undefined}>
                      <td className="tabular">{when(e.createdAt)}</td>
                      <td>{e.actorName}</td>
                      <td>{e.actorUnit}</td>
                      <td>{ACTION_LABEL[e.action] ?? e.action}</td>
                      <td className="tabular">
                        {e.entityType}
                        {e.entityId ? ` ${e.entityId}` : ""}
                      </td>
                      <td>
                        <span className={`at-pill is-${e.outcome}`}>
                          {e.outcome === "deny" ? "Refused" : "Allowed"}
                        </span>
                      </td>
                      <td className="at-detail">{e.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </>
  );
}
