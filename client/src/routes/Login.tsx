import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Icon, type IconName } from "../components/Icon";
import { Emblem } from "../components/Emblem";
import backdrop from "../assets/login-backdrop.jpeg";
import "./Login.css";

/**
 * Officer login.
 *
 * Auth is not wired: submitting navigates to the Command View so the flow can be
 * demoed. Real authentication is Catalyst Authentication, and the signed-in user
 * must resolve to an Employee row (UnitID + RankID) — that record is what scopes
 * every subsequent read, server-side. See architecture.md §6.
 */

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
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    navigate("/");
  }

  return (
    <div className="login">
      <div className="login__main">
        {/* --- Left: brand --------------------------------------------- */}
        <section className="login__brand">
          <img className="login__backdrop" src={backdrop} alt="" aria-hidden="true" />

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

              <form className="login__form" onSubmit={handleSubmit}>
                <div className="login__field">
                  <label htmlFor="employee-id" className="sr-only">
                    Employee ID
                  </label>
                  <span className="login__field-icon">
                    <Icon name="user" size={17} />
                  </span>
                  <input
                    id="employee-id"
                    name="employeeId"
                    type="text"
                    autoComplete="username"
                    placeholder="Employee ID"
                    required
                  />
                </div>

                <div className="login__field">
                  <label htmlFor="password" className="sr-only">
                    Password
                  </label>
                  <span className="login__field-icon">
                    <Icon name="lock" size={17} />
                  </span>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Password"
                    required
                  />
                  <button
                    type="button"
                    className="login__field-toggle"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    <Icon name={showPassword ? "eye-off" : "eye"} size={17} />
                  </button>
                </div>

                <div className="login__row">
                  <label className="login__check">
                    <input type="checkbox" name="remember" />
                    <span className="login__check-box" aria-hidden="true">
                      <Icon name="check" size={11} strokeWidth={3} />
                    </span>
                    <span>Remember me</span>
                  </label>

                  <button type="button" className="login__link">
                    Forgot Password?
                  </button>
                </div>

                <button type="submit" className="login__submit">
                  <span>Login</span>
                  <Icon name="arrow-right" size={18} strokeWidth={2} />
                </button>

                <div className="login__or" role="separator">
                  <span>OR</span>
                </div>

                <button type="button" className="login__alt">
                  <Icon name="shield-check" size={17} />
                  <span>Login with Smart Card</span>
                </button>
              </form>
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

