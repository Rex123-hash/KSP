import { useId } from "react";

/**
 * Generic badge mark — not the state emblem.
 *
 * The real Karnataka State Police emblem is legally restricted: a 2022 GoK
 * circular (citing the State Emblem of India (Prohibition of Improper Use)
 * Act, 2005) reserves it for government departments absent prior permission.
 * This is a stylised, non-literal shield-and-star mark instead — no
 * Gandaberunda, no Ashoka Lion Capital, nothing that reproduces protected
 * state iconography. Swap for the real emblem only once KSP/hack2skill
 * confirm its use in the submission is authorised.
 *
 * Built as layered vector rather than flat fills: a bevelled gold rim, a graded
 * field, a struck star with its own light source, and a laurel arc. Gradient
 * ids are namespaced per instance via useId(), because several emblems render
 * on the same page (sidebar, top bar, login) and duplicate ids would make later
 * instances inherit the first one's paint.
 */

type Props = {
  size?: number;
  className?: string;
  /** Renders on a gold ring against a dark disc — used on the login card. */
  medallion?: boolean;
};

export function Emblem({ size = 40, className, medallion = false }: Props) {
  const uid = useId().replace(/:/g, "");

  if (medallion) {
    return (
      <svg
        className={className}
        width={size}
        height={size}
        viewBox="0 0 100 100"
        role="img"
        aria-label="Karnataka State Police"
      >
        <Defs uid={uid} />
        <circle cx="50" cy="50" r="49" fill={`url(#${uid}-disc)`} />
        <circle cx="50" cy="50" r="45.5" fill="none" stroke={`url(#${uid}-gold)`} strokeWidth="2.6" />
        <circle
          cx="50"
          cy="50"
          r="41.5"
          fill="none"
          stroke="var(--brand-gold-500)"
          strokeWidth="0.7"
          opacity="0.4"
        />
        {/* Ring of pips — reads as a struck medal up close, as texture when small. */}
        <g fill="var(--brand-gold-500)" opacity="0.75">
          {Array.from({ length: 24 }, (_, i) => {
            const a = (i / 24) * Math.PI * 2;
            return (
              <circle
                key={i}
                cx={50 + Math.cos(a) * 43.5}
                cy={50 + Math.sin(a) * 43.5}
                r="0.62"
              />
            );
          })}
        </g>

        {/* Laurel wreath flanking the shield — the detail that separates a
            medal from a logo. Leaves are placed along an arc and rotated
            tangentially so each sits naturally on the curve. */}
        <Laurel uid={uid} />

        <g transform="translate(50 50) scale(0.56) translate(-50 -50)">
          <BadgeBody uid={uid} />
        </g>
      </svg>
    );
  }

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label="Karnataka State Police"
    >
      <Defs uid={uid} />
      <BadgeBody uid={uid} />
    </svg>
  );
}

function Defs({ uid }: { uid: string }) {
  return (
    <defs>
      {/* Field: lit from the top, deepening toward the point of the shield. */}
      <linearGradient id={`${uid}-field`} x1="0.15" y1="0" x2="0.85" y2="1">
        <stop offset="0%" stopColor="#155e3f" />
        <stop offset="48%" stopColor="#0b4229" />
        <stop offset="100%" stopColor="#06291a" />
      </linearGradient>

      {/* Gold on a true metal ramp: highlight, body, shadowed underside. */}
      <linearGradient id={`${uid}-gold`} x1="0.1" y1="0" x2="0.7" y2="1">
        <stop offset="0%" stopColor="#f4e3a1" />
        <stop offset="34%" stopColor="#d9b43c" />
        <stop offset="66%" stopColor="#c9a227" />
        <stop offset="100%" stopColor="#8a6a12" />
      </linearGradient>

      <linearGradient id={`${uid}-disc`} x1="0.2" y1="0" x2="0.8" y2="1">
        <stop offset="0%" stopColor="#0f4c33" />
        <stop offset="100%" stopColor="#06291a" />
      </linearGradient>

      {/* Diagonal sheen across the upper-left face. */}
      <linearGradient id={`${uid}-sheen`} x1="0" y1="0" x2="0.85" y2="1">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2" />
        <stop offset="46%" stopColor="#ffffff" stopOpacity="0.05" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>
    </defs>
  );
}

/**
 * Laurel wreath for the medallion. Six leaves per side, placed along a circle
 * and rotated to sit tangent to it, with the branch drawn under them. Mirrored
 * across the vertical axis so the two sides read as one wreath.
 */
function Laurel({ uid }: { uid: string }) {
  const R = 37;
  const leafAngles = [100, 115, 130, 145, 160, 175]; // bottom-left → left
  const leaf = (deg: number, key: string) => {
    const a = (deg * Math.PI) / 180;
    const cx = 50 + Math.cos(a) * R;
    const cy = 50 + Math.sin(a) * R;
    return (
      <ellipse
        key={key}
        cx={cx}
        cy={cy}
        rx="5.2"
        ry="2.3"
        fill={`url(#${uid}-gold)`}
        transform={`rotate(${deg + 90} ${cx} ${cy})`}
      />
    );
  };

  return (
    <g opacity="0.9">
      {/* Left branch */}
      <path
        d="M31 76 A 37 37 0 0 1 15 46"
        fill="none"
        stroke="var(--brand-gold-500)"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.8"
      />
      {leafAngles.map((d) => leaf(d, `l${d}`))}

      {/* Right branch — same geometry mirrored about x = 50 */}
      <g transform="translate(100 0) scale(-1 1)">
        <path
          d="M31 76 A 37 37 0 0 1 15 46"
          fill="none"
          stroke="var(--brand-gold-500)"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.8"
        />
        {leafAngles.map((d) => leaf(d, `r${d}`))}
      </g>
    </g>
  );
}

/** Five-pointed star, outer r=20 / inner r=8.2 about (50, 51). */
const STAR =
  "M50 31 L54.8 44.4 L69 44.8 L57.8 53.5 L61.8 67.2 L50 59.2 L38.2 67.2 L42.2 53.5 L31 44.8 L45.2 44.4 Z";

const SHIELD_OUTER =
  "M50 4 L87 16.5 V45 C87 69 71.5 86.5 50 96.5 C28.5 86.5 13 69 13 45 V16.5 Z";
const SHIELD_FIELD =
  "M50 8.4 L83 19.6 V45 C83 66.6 69 82.4 50 91.7 C31 82.4 17 66.6 17 45 V19.6 Z";
const SHIELD_HAIRLINE =
  "M50 12.6 L79 22.4 V45 C79 64.2 66.6 78.6 50 87.2 C33.4 78.6 21 64.2 21 45 V22.4 Z";

function BadgeBody({ uid }: { uid: string }) {
  return (
    <g>
      <path d={SHIELD_OUTER} fill={`url(#${uid}-gold)`} />
      <path d={SHIELD_FIELD} fill={`url(#${uid}-field)`} />
      {/* Inner hairline — the detail that reads as "struck" rather than "drawn". */}
      <path
        d={SHIELD_HAIRLINE}
        fill="none"
        stroke="var(--brand-gold-500)"
        strokeWidth="0.9"
        opacity="0.55"
      />
      <path d={SHIELD_FIELD} fill={`url(#${uid}-sheen)`} />

      {/* Laurel arc beneath the star — authority without state iconography. */}
      <path
        d="M28 62 C33 74 41 81 50 84 C59 81 67 74 72 62"
        fill="none"
        stroke="var(--brand-gold-500)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />

      {/* Star: shadow, body, lit upper facet, then a fine dark edge. */}
      <path d={STAR} fill="#042115" opacity="0.35" transform="translate(0.8 1.1)" />
      <path d={STAR} fill={`url(#${uid}-gold)`} />
      <path d="M50 31 L54.8 44.4 L45.2 44.4 Z" fill="#fdf1c4" opacity="0.55" />
      <path d={STAR} fill="none" stroke="#6d5310" strokeWidth="0.5" opacity="0.5" />
    </g>
  );
}
