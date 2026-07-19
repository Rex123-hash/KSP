import type { ReactNode } from "react";
import { Icon } from "./Icon";
import type { AsyncState } from "../api";
import "./PageState.css";

/**
 * Renders loading and error states for an API-backed page. Loading is a calm
 * skeleton (precomputed reads are fast); error states say what failed rather
 * than blanking the screen mid-demo.
 */

type Props<T> = {
  state: AsyncState<T>;
  children: (data: T) => ReactNode;
};

export function PageState<T>({ state, children }: Props<T>) {
  if (state.loading) {
    return (
      <div className="pstate">
        <div className="pstate__spinner" aria-hidden="true" />
        <p className="pstate__msg">Loading…</p>
      </div>
    );
  }
  if (state.error || !state.data) {
    return (
      <div className="pstate pstate--error">
        <span className="pstate__icon">
          <Icon name="alert" size={26} />
        </span>
        <p className="pstate__msg">Couldn’t load this data.</p>
        <p className="pstate__detail">{state.error ?? "No data returned."}</p>
        <p className="pstate__hint">
          Is the API running? <code>cd server &amp;&amp; npm start</code>
        </p>
      </div>
    );
  }
  return <>{children(state.data)}</>;
}
