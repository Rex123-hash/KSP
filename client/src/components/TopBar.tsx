import { Icon } from "./Icon";
import { Emblem } from "./Emblem";
import { toast, protoToast } from "./Toast";
import { useMeta } from "../meta";
import "./TopBar.css";

/**
 * The breadcrumb is not decoration — it renders the Unit.ParentUnit chain and
 * is the primary way an officer moves down their command tree. See
 * architecture.md §6.
 */

export function TopBar() {
  const { officer } = useMeta();
  const trail = officer.breadcrumb;

  return (
    <header className="topbar">
      <nav className="topbar__crumbs" aria-label="Command scope">
        <span className="topbar__crumb-pin">
          <Icon name="map-pin" size={15} />
        </span>
        {trail.map((node, i) => {
          const isLast = i === trail.length - 1;
          return (
            <span key={node} className="topbar__crumb-group">
              {isLast ? (
                <span className="topbar__crumb is-current" aria-current="page">
                  {node}
                </span>
              ) : (
                <button
                  type="button"
                  className="topbar__crumb"
                  onClick={() => protoToast(`Scoping to ${node} needs role-scoped auth`)}
                >
                  {node}
                </button>
              )}
              {!isLast && (
                <span className="topbar__crumb-sep" aria-hidden="true">
                  <Icon name="chevron-right" size={13} strokeWidth={2} />
                </span>
              )}
            </span>
          );
        })}
      </nav>

      <div className="topbar__actions">
        <button
          type="button"
          className="topbar__icon-btn"
          aria-label={`Notifications, ${officer.notifications} unread`}
          onClick={() => toast(`${officer.notifications} active alerts in your command`, { icon: "bell", tone: "info" })}
        >
          <Icon name="bell" size={19} />
          {officer.notifications > 0 && (
            <span className="topbar__badge">{officer.notifications}</span>
          )}
        </button>

        <div className="topbar__divider" role="presentation" />

        <button
          type="button"
          className="topbar__user"
          onClick={() => protoToast("Account menu needs Catalyst Authentication")}
        >
          <span className="topbar__user-text">
            <span className="topbar__user-name">{officer.name}</span>
            <span className="topbar__user-rank">{officer.rank}</span>
          </span>
          <Emblem size={34} medallion />
          <Icon name="chevron-down" size={15} strokeWidth={2} />
        </button>
      </div>
    </header>
  );
}
