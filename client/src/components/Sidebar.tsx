import { NavLink } from "react-router-dom";
import { Icon, type IconName } from "./Icon";
import { Emblem } from "./Emblem";
import { currentOfficer } from "../data/mock";
import "./Sidebar.css";

/**
 * The six surfaces from design.md §3. No more.
 * The scope card at the foot is the org-chart spine made visible: it answers
 * "where do I sit in the force" on every screen.
 */

const NAV: { to: string; label: string; icon: IconName }[] = [
  { to: "/", label: "Command View", icon: "command" },
  { to: "/map", label: "Map & Hotspots", icon: "map-pin" },
  { to: "/network", label: "Person & Network", icon: "network" },
  { to: "/trends", label: "Trends & Alerts", icon: "alert" },
  { to: "/cases", label: "Case / FIR Details", icon: "file-text" },
];

export function Sidebar() {
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
      </nav>

      <div className="sidebar__scope">
        <div className="sidebar__scope-head">
          <span className="sidebar__scope-icon">
            <Icon name="shield-check" size={15} />
          </span>
          <span className="eyebrow sidebar__scope-eyebrow">Current Scope</span>
        </div>
        <p className="sidebar__scope-unit">{currentOfficer.scopeLabel}</p>
        <p className="sidebar__scope-rank">{currentOfficer.rank}</p>
        <button type="button" className="sidebar__scope-change">
          Change Scope
          <Icon name="chevron-right" size={13} strokeWidth={2} />
        </button>
      </div>
    </aside>
  );
}
