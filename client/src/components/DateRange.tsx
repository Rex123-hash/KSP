import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import "./DateRange.css";

/**
 * Date-range control that actually re-queries the backend. Picking a preset
 * changes the `days` window; the page re-fetches its data for that window.
 */

const PRESETS = [
  { days: 30, label: "Last 30 days" },
  { days: 60, label: "Last 60 days" },
  { days: 90, label: "Last 90 days" },
  { days: 180, label: "Last 6 months" },
  { days: 365, label: "Last year" },
];

export function DateRange({
  days,
  onChange,
}: {
  days: number;
  onChange: (days: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const label = PRESETS.find((p) => p.days === days)?.label ?? `Last ${days} days`;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className="daterange" ref={ref}>
      <button type="button" className="page-control" onClick={() => setOpen((o) => !o)}>
        <Icon name="calendar" size={16} />
        <span>{label}</span>
        <Icon name="chevron-down" size={14} strokeWidth={2} />
      </button>
      {open && (
        <ul className="daterange__menu">
          {PRESETS.map((p) => (
            <li key={p.days}>
              <button
                type="button"
                className={p.days === days ? "is-active" : ""}
                onClick={() => {
                  onChange(p.days);
                  setOpen(false);
                }}
              >
                {p.label}
                {p.days === days && <Icon name="check" size={14} strokeWidth={2.5} />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
