import { Icon } from "./Icon";
import "./Avatar.css";

/**
 * Initial-circle avatar. Deliberately not a photo: the schema carries no images
 * of any person, so a face here would be fabricated. Initials for a named
 * person; a silhouette for an unresolved / unknown identity.
 */

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/* Deterministic tone from the name so the same person is always the same
   colour, drawn from the brand family (never a random hue). */
const TONES = [
  "var(--brand-green-700)",
  "var(--brand-green-500)",
  "var(--seq-400)",
  "var(--seq-500)",
  "var(--brand-green-600)",
];

function toneFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return TONES[Math.abs(h) % TONES.length];
}

type Props = {
  name: string;
  size?: number;
  unknown?: boolean;
  className?: string;
};

export function Avatar({ name, size = 40, unknown = false, className = "" }: Props) {
  const fontSize = Math.round(size * 0.36);

  if (unknown) {
    return (
      <span
        className={`avatar avatar--unknown ${className}`}
        style={{ width: size, height: size }}
        aria-label="Unknown identity"
      >
        <Icon name="user" size={Math.round(size * 0.5)} />
      </span>
    );
  }

  return (
    <span
      className={`avatar ${className}`}
      style={{ width: size, height: size, background: toneFor(name), fontSize }}
      aria-label={name}
      title={name}
    >
      {initials(name)}
    </span>
  );
}
