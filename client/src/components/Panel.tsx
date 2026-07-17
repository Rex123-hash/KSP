import type { ReactNode } from "react";
import { Icon } from "./Icon";
import "./Panel.css";

/**
 * The card every content block sits in. Title on the left, one optional action
 * on the right. Panels do not nest.
 */

type Props = {
  title: string;
  /** Small qualifier after the title, e.g. "(this period)". */
  note?: string;
  action?: { label: string; icon?: "external" | "chevron-right" };
  onAction?: () => void;
  bleed?: boolean;
  className?: string;
  children: ReactNode;
};

export function Panel({
  title,
  note,
  action,
  onAction,
  bleed = false,
  className = "",
  children,
}: Props) {
  return (
    <section className={`panel ${className}`}>
      <header className="panel__head">
        <h2 className="panel__title">
          {title}
          {note && <span className="panel__note">{note}</span>}
        </h2>

        {action && (
          <button type="button" className="panel__action" onClick={onAction}>
            {action.label}
            <Icon
              name={action.icon ?? "chevron-right"}
              size={14}
              strokeWidth={2}
            />
          </button>
        )}
      </header>

      <div className={`panel__body${bleed ? " is-bleed" : ""}`}>{children}</div>
    </section>
  );
}
