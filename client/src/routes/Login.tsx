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

/**
 * Brand paint for Catalyst's sign-in iframe.
 *
 * This is INJECTED into the iframe rather than passed as `css_url`, and the
 * distinction matters: `css_url` *replaces* Catalyst's stylesheet, which
 * previously removed the rules that collapse the form's inactive states (OTP,
 * TOTP, CAPTCHA, backup codes) and produced a 2,000px wall of fields. Injecting
 * a <style> element adds to their CSS instead, so their layout is untouched and
 * we only restate colours.
 *
 * Safe because the iframe is served from our own origin (/accounts/p/…/signin),
 * so same-origin access is permitted. Selectors were read from the live DOM.
 */
const IFRAME_BRAND_CSS = `
  /* Primary action: Zoho blue -> KSP green */
  #nextbtn, .btn.blue, button.blue, input.blue {
    background: #0b4229 !important;
    border-color: #0b4229 !important;
  }
  #nextbtn:hover, .btn.blue:hover, button.blue:hover {
    background: #08341f !important;
    border-color: #08341f !important;
  }
  /* Links pick up the brand green rather than plain grey */
  a, a.text16 { color: #14543a !important; }
  a:hover, a.text16:hover { color: #08341f !important; }
  /* Focus ring to match our own inputs */
  .textbox:focus, input:focus {
    border-color: #14543a !important;
    box-shadow: 0 0 0 3px rgba(20, 84, 58, 0.12) !important;
  }
`;

const BRAND_STYLE_ID = "ksp-brand-paint";

/**
 * Paint the iframe, idempotently. Returns false until the iframe document is
 * reachable, so the caller can keep retrying — it mounts asynchronously, and
 * Catalyst reloads it between the email and password steps, which drops any
 * style we added.
 */
function paintSignInFrame(): boolean {
  const frame = document.querySelector<HTMLIFrameElement>(`#${LOGIN_ELEMENT_ID} iframe`);
  const doc = frame?.contentDocument;
  if (!doc?.head) return false;

  if (!doc.getElementById(BRAND_STYLE_ID)) {
    const style = doc.createElement("style");
    style.id = BRAND_STYLE_ID;
    style.textContent = IFRAME_BRAND_CSS;
    doc.head.appendChild(style);
  }

  // Belt and braces: also set the primary action inline. Catalyst rebuilds this
  // button as the form moves between steps, and an inline declaration survives
  // any stylesheet of theirs that loads after ours.
  doc.querySelectorAll<HTMLElement>("#nextbtn, .btn.blue").forEach((el) => {
    el.style.setProperty("background", "#0b4229", "important");
    el.style.setProperty("border-color", "#0b4229", "important");
  });

  return true;
}

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

  function copy(value: string) {
    void navigator.clipboard?.writeText(value);
    setCopied(value);
    window.setTimeout(() => setCopied(null), 1500);
  }

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

  // Keep the iframe painted. Catalyst reloads it between the email and password
  // steps, so a one-shot injection would be lost on the second screen.
  useEffect(() => {
    if (sdk !== "ready") return;
    paintSignInFrame();
    const t = window.setInterval(paintSignInFrame, 700);
    return () => window.clearInterval(t);
  }, [sdk]);

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
                      <Icon name="user" size={15} />
                      Demo accounts
                    </p>

                    <ul className="login__demo-list">
                      {DEMO_ACCOUNTS.map((a) => (
                        <li key={a.email} className="login__demo-row">
                          <button
                            type="button"
                            className="login__demo-copy"
                            title="Copy email address"
                            onClick={() => copy(a.email)}
                          >
                            <span className="login__demo-value">{a.email}</span>
                            <Icon name={copied === a.email ? "check" : "layers"} size={13} />
                          </button>
                          <span className="login__demo-role">{a.role}</span>
                          <span className="login__demo-scope">{a.scope}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="login__demo-pw">
                      <span className="login__demo-pw-label">Password (all three)</span>
                      <button
                        type="button"
                        className="login__demo-copy is-pw"
                        title="Copy password"
                        onClick={() => copy(DEMO_PASSWORD)}
                      >
                        <span className="login__demo-value">{DEMO_PASSWORD}</span>
                        <Icon name={copied === DEMO_PASSWORD ? "check" : "layers"} size={13} />
                      </button>
                    </div>
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

