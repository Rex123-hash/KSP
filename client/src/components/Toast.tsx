import { useEffect, useState } from "react";
import { Icon, type IconName } from "./Icon";
import "./Toast.css";

/**
 * Minimal toast. Every actionable control gives feedback: real actions confirm,
 * and actions that would need a live write-backend say so honestly rather than
 * doing nothing. A module-level emitter keeps it dependency-free.
 */

type Tone = "ok" | "info" | "warn";
type ToastMsg = { id: number; text: string; icon: IconName; tone: Tone };
type Listener = (t: ToastMsg) => void;

let seq = 0;
const listeners = new Set<Listener>();

export function toast(text: string, opts?: { icon?: IconName; tone?: Tone }) {
  const msg: ToastMsg = {
    id: ++seq,
    text,
    icon: opts?.icon ?? "check",
    tone: opts?.tone ?? "ok",
  };
  listeners.forEach((l) => l(msg));
}

/** Convenience for actions that need a live backend not present in this build. */
export function protoToast(text: string) {
  toast(text, { icon: "shield", tone: "info" });
}

/**
 * A refused or failed action. Used for scope denials, which are not errors in
 * the system — they are the access control working — so they read as a warning
 * rather than a failure.
 */
export function denyToast(text: string) {
  toast(text, { icon: "shield", tone: "warn" });
}

export function Toaster() {
  const [items, setItems] = useState<ToastMsg[]>([]);

  useEffect(() => {
    const l: Listener = (t) => {
      setItems((cur) => [...cur, t]);
      window.setTimeout(() => {
        setItems((cur) => cur.filter((x) => x.id !== t.id));
      }, 2600);
    };
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  return (
    <div className="toaster" role="status" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`toast is-${t.tone}`}>
          <Icon name={t.icon} size={16} />
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  );
}
