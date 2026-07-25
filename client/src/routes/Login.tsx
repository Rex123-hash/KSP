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
 * The credential fields are Catalyst's embedded sign-in iframe, styled by
 * public/catalyst-login.css to match our tokens. We deliberately do not own a
 * password field: Catalyst holds the credential, and this app never sees it.
 *
 * On success Catalyst sets the session cookie and returns to the app; /session
 * then resolves the officer to a UnitID + RankID, which scopes everything
 * server-side. See architecture.md §6.
 */

const LOGIN_ELEMENT_ID = "catalyst-login";

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
        window.catalyst?.auth?.signIn?.(LOGIN_ELEMENT_ID, {
          css_url: `${import.meta.env.BASE_URL}catalyst-login.css`,
          service_url: `${import.meta.env.BASE_URL}index.html`,
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
        {/* --- Left: brand --------------------------------------------- */}
        <section className="login__brand">
          <img className="login__map" src={stateMap} alt="" aria-hidden="true" />
          <img className="login__building" src={building} alt="" aria-hidden="true" />

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
              <p className="login__card-sub">
                Access the Crime Intelligence Platform
              </p>

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

