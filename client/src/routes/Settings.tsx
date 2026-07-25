import { useCallback, useEffect, useState } from "react";
import { Icon } from "../components/Icon";
import { Avatar } from "../components/Avatar";
import { toast, protoToast, denyToast } from "../components/Toast";
import { ApiError, writeGet, writePut } from "../api";
import { useAuth } from "../auth";
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

type ProfileData = {
  email: string;
  displayName: string;
  phone: string;
  preferredLanguage: string;
  rank: string;
  unitName: string;
  designation: string | null;
  role: string;
};

export function Settings() {
  const [tab, setTab] = useState("Profile");
  const [notif, setNotif] = useState(notifications.map((n) => n.on));
  const { authenticated, reachable, user, signOut } = useAuth();

  const [me, setMe] = useState<ProfileData | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ displayName: "", phone: "", preferredLanguage: "en" });
  const [saving, setSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!authenticated) return setMe(null);
    try {
      const p = await writeGet<ProfileData>("/profile");
      setMe(p);
      setForm({
        displayName: p.displayName,
        phone: p.phone,
        preferredLanguage: p.preferredLanguage,
      });
    } catch {
      setMe(null);
    }
  }, [authenticated]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  async function saveProfile() {
    setSaving(true);
    try {
      await writePut("/profile", form);
      toast("Profile updated");
      setEditing(false);
      await loadProfile();
    } catch (err) {
      denyToast(err instanceof ApiError ? err.message : "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  }

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
        {/* Profile — real when signed in, mock data otherwise */}
        {tab === "Profile" && (
  <section className="panel st-card">
            <h2 className="cd-card__title">Profile Information</h2>
            <div className="st-profile">
              <Avatar name={me?.displayName ?? profile.name} size={82} />
              {editing && me ? (
                <div className="st-form">
                  <label className="st-form__field">
                    <span>Name</span>
                    <input
                      value={form.displayName}
                      maxLength={255}
                      onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                    />
                  </label>
                  <label className="st-form__field">
                    <span>Phone</span>
                    <input
                      value={form.phone}
                      maxLength={32}
                      placeholder="+91 …"
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </label>
                  <label className="st-form__field">
                    <span>Language</span>
                    <select
                      value={form.preferredLanguage}
                      onChange={(e) => setForm({ ...form, preferredLanguage: e.target.value })}
                    >
                      <option value="en">English</option>
                      <option value="kn">ಕನ್ನಡ (Kannada)</option>
                    </select>
                  </label>
                </div>
              ) : (
                <dl className="st-profile__facts">
                  <ProfileFact label="Name" value={me?.displayName ?? profile.name} />
                  <ProfileFact
                    label="Designation"
                    value={me?.designation ?? profile.designation}
                  />
                  <ProfileFact label="Unit" value={me?.unitName ?? profile.division} />
                  <ProfileFact label="Rank" value={me?.rank ?? profile.employeeId} />
                  <ProfileFact label="Email" value={me?.email ?? profile.email} />
                  <ProfileFact label="Phone" value={me?.phone || (me ? "—" : profile.phone)} />
                </dl>
              )}
            </div>

            {editing ? (
              <div className="st-btn-row">
                <button
                  type="button"
                  className="st-btn st-btn--ghost"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="st-btn st-btn--solid"
                  disabled={saving}
                  onClick={() => void saveProfile()}
                >
                  <Icon name="check" size={15} /> {saving ? "Saving…" : "Save Profile"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="st-btn st-btn--ghost"
                onClick={() => {
                  if (!reachable) return protoToast("Write service unavailable — profile can’t be edited");
                  if (!authenticated) return protoToast("Sign in to edit your profile");
                  setEditing(true);
                }}
              >
                <Icon name="file-check" size={15} /> Edit Profile
              </button>
            )}
          </section>
        )}

        {/* Preferences */}
        {tab === "Preferences" && (
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
            <button type="button" className="st-btn st-btn--ghost" onClick={() => toast("Preferences saved")}>
              <Icon name="check" size={15} /> Save Preferences
            </button>
          </section>
        )}

        {/* Notifications */}
        {tab === "Notifications" && (
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
            <button type="button" className="st-btn st-btn--ghost" onClick={() => toast("Notification preferences saved")}>
              <Icon name="check" size={15} /> Save Notifications
            </button>
          </section>
        )}

        {/* Access & Roles */}
        {tab === "Access & Roles" && (
  <section className="panel st-card">
            <h2 className="cd-card__title">Access &amp; Roles</h2>
            <div className="st-access">
              <span className="st-access__icon"><Icon name="hierarchy" size={20} /></span>
              <dl className="st-access__facts">
                <div>
                  <dt>Role</dt>
                  <dd>{user ? `${user.rank} · ${user.role}` : accessRole.role}</dd>
                </div>
                <div>
                  <dt>Access Level</dt>
                  <dd>
                    <span className="st-access__badge">
                      {user ? (user.level ?? "Unit") : accessRole.accessLevel}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>Scope</dt>
                  <dd>
                    {user
                      ? `${user.scopeLabel} — ${user.scopeSize} unit${user.scopeSize === 1 ? "" : "s"}`
                      : accessRole.scope}
                  </dd>
                </div>
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
        )}

        {/* Account — credentials belong to Catalyst Authentication, not to us.
            This app has no password field by design: it never sees the secret. */}
        {tab === "Profile" && (
  <section className="panel st-card">
            <h2 className="cd-card__title">Account &amp; Security</h2>
            <p className="st-account__note">
              <Icon name="shield-check" size={15} />
              <span>
                Your credentials are held by Catalyst Authentication. This platform never stores or
                handles your password — changes go through Catalyst’s own secure reset flow.
              </span>
            </p>
            <div className="st-btn-row">
              <button
                type="button"
                className="st-btn st-btn--ghost"
                onClick={() => {
                  if (!authenticated) return protoToast("Sign in to manage your account");
                  toast("Use “Forgot Password” on the sign-in screen to reset your password", {
                    icon: "lock",
                    tone: "info",
                  });
                }}
              >
                <Icon name="lock" size={15} /> Change Password
              </button>
              {authenticated && (
                <button type="button" className="st-btn st-btn--solid" onClick={signOut}>
                  <Icon name="external" size={15} /> Sign Out
                </button>
              )}
            </div>
          </section>
        )}

        {/* System info */}
        {tab === "System" && (
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
        )}
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
