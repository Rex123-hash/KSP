import { useState } from "react";
import { Icon } from "../components/Icon";
import { Avatar } from "../components/Avatar";
import {
  accessRole,
  notifications,
  permissions,
  preferences,
  profile,
  settingsTabs,
  systemInfo,
} from "../data/settingsMock";
import "./Settings.css";

export function Settings() {
  const [tab, setTab] = useState("Profile");
  const [notif, setNotif] = useState(notifications.map((n) => n.on));

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your preferences and system configurations</p>
        </div>
      </div>

      <div className="cd-tabs" role="tablist">
        {settingsTabs.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            className={`cd-tab${tab === t ? " is-active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="st-grid">
        {/* Profile */}
        <section className="panel st-card">
          <h2 className="cd-card__title">Profile Information</h2>
          <div className="st-profile">
            <Avatar name={profile.name} size={82} />
            <dl className="st-profile__facts">
              <ProfileFact label="Name" value={profile.name} />
              <ProfileFact label="Designation" value={profile.designation} />
              <ProfileFact label="Division" value={profile.division} />
              <ProfileFact label="Employee ID" value={profile.employeeId} />
              <ProfileFact label="Email" value={profile.email} />
              <ProfileFact label="Phone" value={profile.phone} />
            </dl>
          </div>
          <button type="button" className="st-btn st-btn--ghost">
            <Icon name="file-check" size={15} /> Edit Profile
          </button>
        </section>

        {/* Preferences */}
        <section className="panel st-card">
          <h2 className="cd-card__title">Preferences</h2>
          <ul className="st-prefs">
            {preferences.map((p) => (
              <li key={p.label} className="st-prefs__row">
                <span className="st-prefs__icon"><Icon name={p.icon} size={16} /></span>
                <span className="st-prefs__label">{p.label}</span>
                <span className="st-select">
                  {p.value}
                  <Icon name="chevron-down" size={14} strokeWidth={2} />
                </span>
              </li>
            ))}

            {/* Theme — Light only. Dark was removed from the product. */}
            <li className="st-prefs__row">
              <span className="st-prefs__icon"><Icon name="sun" size={16} /></span>
              <span className="st-prefs__label">Theme</span>
              <span className="st-theme">
                <span className="st-theme__opt is-active">
                  <Icon name="sun" size={14} /> Light
                </span>
                <span className="st-theme__opt is-disabled" title="Dark mode is not available">
                  <Icon name="moon" size={14} /> Dark
                </span>
              </span>
            </li>
          </ul>
          <button type="button" className="st-btn st-btn--ghost">
            <Icon name="check" size={15} /> Save Preferences
          </button>
        </section>

        {/* Notifications */}
        <section className="panel st-card">
          <h2 className="cd-card__title">Notification Preferences</h2>
          <ul className="st-notif">
            {notifications.map((n, i) => (
              <li key={n.label} className="st-notif__row">
                <span className="st-notif__icon"><Icon name={n.icon} size={16} /></span>
                <span className="st-notif__label">{n.label}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={notif[i]}
                  aria-label={n.label}
                  className={`st-toggle${notif[i] ? " is-on" : ""}`}
                  onClick={() => setNotif((v) => v.map((x, j) => (j === i ? !x : x)))}
                >
                  <span className="st-toggle__knob" />
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="st-btn st-btn--ghost">
            <Icon name="check" size={15} /> Save Notifications
          </button>
        </section>

        {/* Access & Roles */}
        <section className="panel st-card">
          <h2 className="cd-card__title">Access &amp; Roles</h2>
          <div className="st-access">
            <span className="st-access__icon"><Icon name="hierarchy" size={20} /></span>
            <dl className="st-access__facts">
              <div><dt>Role</dt><dd>{accessRole.role}</dd></div>
              <div><dt>Access Level</dt><dd><span className="st-access__badge">{accessRole.accessLevel}</span></dd></div>
              <div><dt>Scope</dt><dd>{accessRole.scope}</dd></div>
            </dl>
          </div>
          <p className="st-perms__head">Permissions ({permissions.length})</p>
          <div className="st-perms">
            {permissions.map((p) => (
              <span key={p} className="st-perm">
                <Icon name="check" size={12} strokeWidth={3} /> {p}
              </span>
            ))}
          </div>
        </section>

        {/* Change password */}
        <section className="panel st-card">
          <h2 className="cd-card__title">Change Password</h2>
          <PasswordField label="Current Password" placeholder="Enter current password" />
          <PasswordField label="New Password" placeholder="Enter new password" />
          <PasswordField label="Confirm New Password" placeholder="Confirm new password" />
          <button type="button" className="st-btn st-btn--solid">
            <Icon name="lock" size={15} /> Update Password
          </button>
        </section>

        {/* System info */}
        <section className="panel st-card">
          <h2 className="cd-card__title">System Information</h2>
          <ul className="st-sys">
            {systemInfo.map((s) => (
              <li key={s.label} className="st-sys__row">
                <span className="st-sys__icon"><Icon name={s.icon} size={15} /></span>
                <span className="st-sys__label">{s.label}</span>
                {s.badge ? (
                  <span className={`st-sys__badge is-${s.badge}`}>{s.value}</span>
                ) : (
                  <span className="st-sys__value">{s.value}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <footer className="st-footer">
        © 2026 Karnataka State Police <span aria-hidden="true">|</span> State Crime Records Bureau
      </footer>
    </>
  );
}

function ProfileFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="st-profile__fact">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function PasswordField({ label, placeholder }: { label: string; placeholder: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="st-field">
      <label className="st-field__label">{label}</label>
      <div className="st-field__box">
        <input type={show ? "text" : "password"} placeholder={placeholder} autoComplete="off" />
        <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide" : "Show"}>
          <Icon name={show ? "eye-off" : "eye"} size={16} />
        </button>
      </div>
    </div>
  );
}
