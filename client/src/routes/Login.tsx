import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon, type IconName } from "../components/Icon";
import { Emblem } from "../components/Emblem";
import { loadCatalystSdk, useAuth } from "../auth";
import building from "../assets/login-building.webp";
import stateMap from "../assets/login-map.webp";
import "./Login.css";

/**
 * Officer login — real Catalyst Authentication.
 *
 * The credential fields are Catalyst's embedded sign-in iframe, rendered in
 * Catalyst's own theme (see the note on css_url below). We deliberately do not
 * own a password field: Catalyst holds the credential, and this app never sees it.
 *
 * On success Catalyst sets the session cookie and returns to the app; /session
 * then resolves the officer to a UnitID + RankID, which scopes everything
 * server-side. See architecture.md §6.
 */

const LOGIN_ELEMENT_ID = "catalyst-login";

const DEMO_PASSWORD = "Ksp@Datathon2026";

/** Three positions in the command tree — the contrast is the demo. */
const DEMO_ACCOUNTS = [
  { email: "amaan.k2405@gmail.com", role: "Sub-Inspector", scope: "Indiranagar PS" },
  { email: "amaank2405@gmail.com", role: "ASP", scope: "Bengaluru South" },
  { email: "a.maank2405@gmail.com", role: "DGP", scope: "SCRB · statewide" },
];

const FEATURES: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "shield-check",
    title: "Secure Access",
    body: "Role based authentication",
  },
  {
    icon: "hierarchy",
    title: "Hierarchical Control",
    body: "View data as per your command",
  },
  {
    icon: "chart-up",
    title: "Actionable Insights",
    body: "Data driven decisions",
  },
  {
    icon: "file-check",
    title: "Audit & Traceability",
    body: "Every action is recorded",
  },
];

export function Login() {
  const navigate = useNavigate();
  const { loading, authenticated } = useAuth();
  const [sdk, setSdk] = useState<"loading" | "ready" | "unavailable">("loading");
  const [copied, setCopied] = useState<string | null>(null);

  // Already signed in — don't make them log in again.
  useEffect(() => {
    if (!loading && authenticated) navigate("/", { replace: true });
  }, [loading, authenticated, navigate]);

  // Mount Catalyst's sign-in iframe into the card.
  useEffect(() => {
    let live = true;
    void loadCatalystSdk().then((ok) => {
      if (!live) return;
      if (!ok) return setSdk("unavailable");
      try {
        // Deliberately NO css_url.
        //
        // Catalyst's `css_url` REPLACES its own stylesheet rather than adding
        // to it. The sign-in form is a multi-state UI — password, OTP, TOTP,
        // CAPTCHA, backup codes, password-expired — and Zoho collapses the
        // inactive states with a `.zeroheight` class defined in that stylesheet.
        // Supplying our own dropped their CSS entirely, `.zeroheight` stopped
        // existing, and every hidden panel expanded: a 2,000px form listing OTP
        // and CAPTCHA fields at once. Catalyst's default theme is clean and
        // complete, and our card supplies the branding around it.
        const origin = window.location.origin;
        const base = import.meta.env.BASE_URL;
        window.catalyst?.auth?.signIn?.(LOGIN_ELEMENT_ID, {
          service_url: `${origin}${base}index.html`,
        });
        setSdk("ready");
      } catch {
        setSdk("unavailable");
      }
    });
    return () => {
      live = false;
    };
  }, []);

  return (
    <div className="login">
      <div className="login__main">
        {/* The building sits on the grid, not inside the brand column: the brand
            column clips at its own right edge, which sliced the monument's right
            wall off. Out here it can run to the login card's edge. */}
        <img className="login__building" src={building} alt="" aria-hidden="true" />

        {/* --- Left: brand --------------------------------------------- */}
        <section className="login__brand">
          <img className="login__map" src={stateMap} alt="" aria-hidden="true" />

          <header className="login__brand-head">
            <Emblem size={46} />
            <div>
              <p className="login__brand-name">Karnataka State Police</p>
              <p className="login__brand-sub">State Crime Records Bureau</p>
            </div>
          </header>

          <div className="login__hero">
            <h1 className="login__headline">
              Intelligence.
              <br />
              Integrity.
              <br />
              Impact.
            </h1>
            <div className="login__rule" role="presentation" />
            <p className="login__tagline">
              AI-Powered Crime Intelligence
              <br />
              for a Safer Karnataka
            </p>
          </div>

          <ul className="login__features">
            {FEATURES.map((f) => (
              <li key={f.title} className="login__feature">
                <span className="login__feature-icon">
                  <Icon name={f.icon} size={22} strokeWidth={1.5} />
                </span>
                <p className="login__feature-title">{f.title}</p>
                <p className="login__feature-body">{f.body}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* --- Right: form --------------------------------------------- */}
        <section className="login__panel">
          <div className="login__card">
            <div className="login__card-body">
              <Emblem size={96} medallion className="login__card-emblem" />

              <h2 className="login__card-title">Officer Login</h2>
              {/* Catalyst's iframe prints its own "Sign in to access …" line, so
                  ours is dropped once the form mounts rather than repeating it. */}
              {sdk !== "ready" && (
                <p className="login__card-sub">Access the Crime Intelligence Platform</p>
              )}

              {sdk === "unavailable" ? (
                <div className="login__embed-note" role="status">
                  <Icon name="shield" size={18} />
                  <p>
                    Catalyst sign-in is available only on the deployed app. Run the
                    hosted build to authenticate.
                  </p>
                </div>
              ) : (
                <>
                  {sdk === "loading" && (
                    <p className="login__embed-note" role="status">
                      Loading secure sign-in…
                    </p>
                  )}
                  {/* Catalyst injects its sign-in iframe here. */}
                  <div id={LOGIN_ELEMENT_ID} className="login__embed" />

                  {/* Evaluator credentials. Each row is a different position in
                      the command tree, which is what the demo turns on. */}
                  <div className="login__demo">
                    <p className="login__demo-head">
                      <Icon name="user" size={14} />
                      Demo accounts — all use password <code>{DEMO_PASSWORD}</code>
                    </p>
                    <ul className="login__demo-list">
                      {DEMO_ACCOUNTS.map((a) => (
                        <li key={a.email} className="login__demo-row">
                          <button
                            type="button"
                            className="login__demo-copy"
                            title="Copy email"
                            onClick={() => {
                              void navigator.clipboard?.writeText(a.email);
                              setCopied(a.email);
                              window.setTimeout(() => setCopied(null), 1400);
                            }}
                          >
                            {copied === a.email ? "Copied" : a.email}
                          </button>
                          <span className="login__demo-role">{a.role}</span>
                          <span className="login__demo-scope">{a.scope}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>

            <footer className="login__notice">
              <Icon name="lock" size={14} />
              <p>
                This is a secure government system. Unauthorised access is
                prohibited. All activities are monitored and recorded.
              </p>
            </footer>
          </div>
        </section>
      </div>

      <footer className="login__bar">
        <div className="login__bar-left">
          <span className="login__bar-mark" aria-hidden="true">
            <Icon name="shield" size={16} filled />
          </span>
          <div>
            <p className="login__bar-strong">For Internal Use Only</p>
            <p className="login__bar-muted">KSP • SCRB</p>
          </div>
        </div>

        <div className="login__bar-right">
          <Icon name="shield-check" size={17} />
          <span>Towards a Safer Karnataka</span>
        </div>
      </footer>
    </div>
  );
}

