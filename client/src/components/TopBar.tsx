import { useNavigate } from "react-router-dom";
import { Icon } from "./Icon";
import { Emblem } from "./Emblem";
import { toast, protoToast } from "./Toast";
import { useMeta } from "../meta";
import { useAuth } from "../auth";
import "./TopBar.css";

/**
 * The breadcrumb is not decoration — it renders the Unit.ParentUnit chain and
 * is the primary way an officer moves down their command tree. See
 * architecture.md §6.
 *
 * When a real session exists, identity and scope come from it (resolved
 * server-side). Signed out, we fall back to the read API's officer so the shell
 * still renders.
 */

export function TopBar() {
  const { officer } = useMeta();
  const navigate = useNavigate();
  const { authenticated, user } = useAuth();

  const name = user?.name ?? officer.name;
  const rank = user?.rank ?? officer.rank;
  const trail = user?.breadcrumb?.length ? user.breadcrumb : officer.breadcrumb;

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
                  onClick={() =>
                    protoToast(
                      authenticated
                        ? `Your command scope is fixed to ${user?.scopeLabel ?? "your unit"}`
                        : "Sign in to browse your command scope"
                    )
                  }
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
          title={authenticated ? "Signed in — open settings" : "Sign in"}
          onClick={() => navigate(authenticated ? "/settings" : "/login")}
        >
          <span className="topbar__user-text">
            <span className="topbar__user-name">{name}</span>
            <span className="topbar__user-rank">
              {authenticated ? rank : "Not signed in"}
            </span>
          </span>
          <Emblem size={34} medallion />
          <Icon name="chevron-down" size={15} strokeWidth={2} />
        </button>
      </div>
    </header>
  );
}
