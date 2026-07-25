import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon, type IconName } from "../components/Icon";
import { LocationMap } from "../components/LocationMap";
import { PageState } from "../components/PageState";
import { toast, protoToast, denyToast } from "../components/Toast";
import { ApiError, useApi, writeGet, writePost } from "../api";
import { useAuth } from "../auth";
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

type Note = {
  id: string;
  text: string;
  authorName: string;
  authorEmail: string;
  createdAt: string;
};

type StatusChange = {
  id: string;
  fromStatusId: number | null;
  toStatusId: number | null;
  toStatus: string | null;
  reason: string;
  authorName: string;
  createdAt: string;
};

type Overlay = {
  caseId: number;
  canWrite: boolean;
  station: string | null;
  notes: Note[];
  statusHistory: StatusChange[];
  effectiveStatusId: number | null;
  effectiveStatus: string | null;
};

const STATUS_OPTIONS = [
  { id: 2, label: "Under Investigation" },
  { id: 3, label: "ChargeSheet Filed" },
  { id: 4, label: "Closed" },
];

const SLUG: Record<number, string> = {
  1: "fir-registered",
  2: "under-investigation",
  3: "chargesheet-filed",
  4: "closed",
};

/** The Case Details page always renders the most recent case, as does the read API. */
const CASE_KEY = "featured";

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

export function CaseDetails() {
  const [tab, setTab] = useState("info");
  const state = useApi<CaseData>("/cases/featured");
  const navigate = useNavigate();
  const { authenticated, reachable } = useAuth();

  const [overlay, setOverlay] = useState<Overlay | null>(null);
  const [composing, setComposing] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [statusOpen, setStatusOpen] = useState(false);
  const [nextStatus, setNextStatus] = useState(String(STATUS_OPTIONS[0].id));
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const loadOverlay = useCallback(async () => {
    if (!authenticated) return setOverlay(null);
    try {
      setOverlay(await writeGet<Overlay>(`/cases/${CASE_KEY}/overlay`));
    } catch {
      setOverlay(null);
    }
  }, [authenticated]);

  useEffect(() => {
    void loadOverlay();
  }, [loadOverlay]);

  /**
   * Shared failure handling. A 403 is not a fault — it is the command-scope
   * check working — so it reads as a refusal, and the attempt is already
   * recorded server-side in the audit trail.
   */
  const fail = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          toast("Session expired — sign in again", { icon: "lock", tone: "info" });
          navigate("/login");
          return;
        }
        if (err.status === 403) return denyToast(err.message);
        return denyToast(err.message);
      }
      denyToast("Something went wrong. Try again.");
    },
    [navigate]
  );

  /** Signed out (or no write backend): keep the honest read-only message. */
  const guard = (what: string) => {
    if (!reachable) {
      protoToast(`Write service unavailable — ${what}`);
      return false;
    }
    if (!authenticated) {
      protoToast(`Sign in to ${what}`);
      return false;
    }
    return true;
  };

  async function submitNote() {
    const text = noteText.trim();
    if (!text) return;
    setBusy(true);
    try {
      await writePost<Note>(`/cases/${CASE_KEY}/notes`, { text });
      setNoteText("");
      setComposing(false);
      toast("Note saved to the case file");
      await loadOverlay();
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  }

  async function submitStatus(currentStatusId: number | null) {
    setBusy(true);
    try {
      await writePost<StatusChange>(`/cases/${CASE_KEY}/status`, {
        toStatusId: Number(nextStatus),
        fromStatusId: currentStatusId,
        reason: reason.trim(),
      });
      setStatusOpen(false);
      setReason("");
      toast("Case status updated");
      await loadOverlay();
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  }

  async function closeCase(currentStatusId: number | null) {
    if (!window.confirm("Close this case? This is recorded in the audit trail.")) return;
    setBusy(true);
    try {
      await writePost<StatusChange>(`/cases/${CASE_KEY}/close`, {
        fromStatusId: currentStatusId,
        reason: "Closed from Case Details",
      });
      toast("Case closed");
      await loadOverlay();
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  }

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
        {(data) => {
          // A recorded status change supersedes the base record.
          const statusId = overlay?.effectiveStatusId ?? null;
          const statusLabel = overlay?.effectiveStatus ?? data.header.status;
          const statusSlug = statusId != null ? SLUG[statusId] : data.header.statusSlug;

          return (
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
                  <span className={`pill is-${statusSlug}`}>{statusLabel}</span>
                </div>
              </div>

              {/* Command-scope banner: says plainly whether this officer may act here. */}
              {authenticated && overlay && !overlay.canWrite && (
                <p className="cd-scope-note" role="status">
                  <Icon name="shield" size={15} />
                  <span>
                    This case belongs to {overlay.station ?? "another unit"}, outside your command
                    scope. You can read it; write actions will be refused and recorded.
                  </span>
                </p>
              )}

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

              {/* --- Case file: notes and recorded status changes ------------- */}
              {authenticated && overlay && (
                <section className="panel cd-card cd-file">
                  <h2 className="cd-card__title">
                    Case File
                    <span className="cd-file__count">
                      {overlay.notes.length} note{overlay.notes.length === 1 ? "" : "s"}
                    </span>
                  </h2>

                  {composing && (
                    <div className="cd-composer">
                      <label htmlFor="cd-note" className="sr-only">
                        Case note
                      </label>
                      <textarea
                        id="cd-note"
                        className="cd-composer__input"
                        rows={3}
                        maxLength={2000}
                        placeholder="Record an investigation note…"
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                      />
                      <div className="cd-composer__row">
                        <span className="cd-composer__count tabular">{noteText.length}/2000</span>
                        <button
                          type="button"
                          className="cd-action"
                          onClick={() => {
                            setComposing(false);
                            setNoteText("");
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="cd-action is-primary"
                          disabled={busy || !noteText.trim()}
                          onClick={() => void submitNote()}
                        >
                          {busy ? "Saving…" : "Save Note"}
                        </button>
                      </div>
                    </div>
                  )}

                  {statusOpen && (
                    <div className="cd-composer">
                      <div className="cd-composer__row">
                        <label htmlFor="cd-status" className="cd-composer__label">
                          New status
                        </label>
                        <select
                          id="cd-status"
                          className="cd-composer__select"
                          value={nextStatus}
                          onChange={(e) => setNextStatus(e.target.value)}
                        >
                          {STATUS_OPTIONS.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <input
                        className="cd-composer__input"
                        placeholder="Reason (recorded in the audit trail)"
                        maxLength={500}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                      />
                      <div className="cd-composer__row">
                        <button
                          type="button"
                          className="cd-action"
                          onClick={() => setStatusOpen(false)}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="cd-action is-primary"
                          disabled={busy}
                          onClick={() => void submitStatus(statusId)}
                        >
                          {busy ? "Applying…" : "Apply"}
                        </button>
                      </div>
                    </div>
                  )}

                  {overlay.notes.length === 0 && overlay.statusHistory.length === 0 ? (
                    <p className="cd-file__empty">
                      No notes or status changes recorded on this case yet.
                    </p>
                  ) : (
                    <ol className="cd-timeline">
                      {overlay.statusHistory.map((s) => (
                        <li key={`s-${s.id}`} className="cd-timeline__item is-status">
                          <span className="cd-timeline__icon">
                            <Icon name="file-check" size={15} />
                          </span>
                          <div className="cd-timeline__body">
                            <p className="cd-timeline__head">
                              Status → <strong>{s.toStatus}</strong>
                            </p>
                            {s.reason && <p className="cd-timeline__text">{s.reason}</p>}
                            <p className="cd-timeline__meta">
                              {s.authorName} · {when(s.createdAt)}
                            </p>
                          </div>
                        </li>
                      ))}
                      {overlay.notes.map((n) => (
                        <li key={`n-${n.id}`} className="cd-timeline__item">
                          <span className="cd-timeline__icon">
                            <Icon name="file-text" size={15} />
                          </span>
                          <div className="cd-timeline__body">
                            <p className="cd-timeline__text">{n.text}</p>
                            <p className="cd-timeline__meta">
                              {n.authorName} · {when(n.createdAt)}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
                </section>
              )}

              <section className="panel cd-actions">
                <h2 className="cd-card__title">Actions</h2>
                <div className="cd-actions__row">
                  <button
                    type="button"
                    className="cd-action"
                    disabled={busy}
                    onClick={() => {
                      if (!guard("add notes")) return;
                      setStatusOpen(false);
                      setComposing((v) => !v);
                    }}
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
                    disabled={busy}
                    onClick={() => {
                      if (!guard("change case status")) return;
                      setComposing(false);
                      setStatusOpen((v) => !v);
                    }}
                  >
                    <Icon name="file-check" size={16} /> Update Status
                  </button>
                  <button
                    type="button"
                    className="cd-action is-danger"
                    disabled={busy}
                    onClick={() => {
                      if (!guard("close cases")) return;
                      void closeCase(statusId);
                    }}
                  >
                    <Icon name="lock" size={16} /> Close Case
                  </button>
                </div>
              </section>
            </>
          );
        }}
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
