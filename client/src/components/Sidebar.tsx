import { NavLink } from "react-router-dom";
import { Icon, type IconName } from "./Icon";
import { Emblem } from "./Emblem";
import { protoToast } from "./Toast";
import { useMeta } from "../meta";
import { useAuth } from "../auth";
import "./Sidebar.css";

/**
 * The scope card at the foot is the org-chart spine made visible: it answers
 * "where do I sit in the force" on every screen. Nav is split into the core
 * analytical surfaces and a secondary group (reporting / account), divided.
 */

const NAV: { to: string; label: string; icon: IconName }[] = [
  { to: "/", label: "Command View", icon: "command" },
  { to: "/map", label: "Map & Hotspots", icon: "map-pin" },
  { to: "/network", label: "Person & Network", icon: "network" },
  { to: "/trends", label: "Trends & Alerts", icon: "alert" },
  { to: "/cases", label: "Case / FIR Details", icon: "file-text" },
];

const NAV_SECONDARY: { to: string; label: string; icon: IconName }[] = [
  { to: "/reports", label: "Reports", icon: "chart-up" },
  { to: "/downloads", label: "Downloads", icon: "arrow-down" },
  { to: "/audit", label: "Audit Trail", icon: "shield-check" },
  { to: "/settings", label: "Settings", icon: "settings" },
];

export function Sidebar() {
  const { officer } = useMeta();
  const { authenticated, user } = useAuth();

  // Signed in, the scope panel must reflect the real session — the server
  // decides it, and showing the fallback officer here while the top bar shows
  // the actual one would misrepresent who can do what.
  const scopeLabel = user?.scopeLabel ?? officer.scopeLabel;
  const scopeRank = authenticated ? user?.rank ?? officer.rank : "Not signed in";
  const scopeUnits = user?.scopeSize ?? 0;
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <Emblem size={38} />
        <div className="sidebar__brand-text">
          <p className="sidebar__brand-name">
            Karnataka
            <br />
            State Police
          </p>
          <p className="sidebar__brand-sub">Crime Intelligence Platform</p>
        </div>
      </div>

      <nav className="sidebar__nav" aria-label="Primary">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `sidebar__link${isActive ? " is-active" : ""}`
            }
          >
            <Icon name={item.icon} size={19} />
            <span>{item.label}</span>
          </NavLink>
        ))}

        <span className="sidebar__divider" role="presentation" />

        {NAV_SECONDARY.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `sidebar__link${isActive ? " is-active" : ""}`
            }
          >
            <Icon name={item.icon} size={19} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__scope">
        <div className="sidebar__scope-head">
          <span className="sidebar__scope-icon">
            <Icon name="shield-check" size={15} />
          </span>
          <span className="eyebrow sidebar__scope-eyebrow">Current Scope</span>
        </div>
        <p className="sidebar__scope-unit">{scopeLabel}</p>
        <p className="sidebar__scope-rank">
          {scopeRank}
          {authenticated && scopeUnits > 0 && (
            <span className="sidebar__scope-count">
              {" "}
              · {scopeUnits} unit{scopeUnits === 1 ? "" : "s"}
            </span>
          )}
        </p>
        <button
          type="button"
          className="sidebar__scope-change"
          onClick={() =>
            protoToast(
              authenticated
                ? `Your scope is fixed to ${scopeLabel} by your posting — sign in as another officer to change it`
                : "Sign in to see your command scope"
            )
          }
        >
          Change Scope
          <Icon name="chevron-right" size={13} strokeWidth={2} />
        </button>
      </div>
    </aside>
  );
}
