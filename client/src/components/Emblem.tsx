/**
 * PLACEHOLDER CREST.
 *
 * This is NOT the Karnataka state emblem (Gandaberunda). It is a neutral
 * stand-in so layout and colour can be built now.
 *
 * Before submission, replace this component's body with the official emblem
 * asset (SVG preferred) — drop it at `src/assets/ksp-emblem.svg` and render it
 * here. Do not ship the placeholder: the emblem is what makes the product read
 * as genuinely KSP's to a police audience, and an invented crest reads as fake.
 */

type Props = {
  size?: number;
  className?: string;
  /** Renders on a gold ring against a dark disc — used on the login card. */
  medallion?: boolean;
};

export function Emblem({ size = 40, className, medallion = false }: Props) {
  if (medallion) {
    return (
      <svg
        className={className}
        width={size}
        height={size}
        viewBox="0 0 100 100"
        role="img"
        aria-label="Karnataka State Police emblem (placeholder)"
      >
        <circle cx="50" cy="50" r="48" fill="var(--brand-green-800)" />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="var(--brand-gold-500)"
          strokeWidth="2.5"
        />
        <g transform="translate(50 52) scale(0.62) translate(-50 -50)">
          <CrestBody />
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
      aria-label="Karnataka State Police emblem (placeholder)"
    >
      <CrestBody />
    </svg>
  );
}

function CrestBody() {
  return (
    <g>
      {/* Shield */}
      <path
        d="M50 12 22 22v30c0 17 12 30 28 36 16-6 28-19 28-36V22L50 12Z"
        fill="var(--brand-gold-500)"
        stroke="var(--brand-gold-600)"
        strokeWidth="1.5"
      />
      {/* Supporters, abstracted */}
      <path
        d="M22 30c-6 2-10 7-10 13s4 11 10 13"
        fill="none"
        stroke="var(--brand-gold-600)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M78 30c6 2 10 7 10 13s-4 11-10 13"
        fill="none"
        stroke="var(--brand-gold-600)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Inner field */}
      <path
        d="M50 22 32 28v22c0 12 8 21 18 25 10-4 18-13 18-25V28L50 22Z"
        fill="var(--brand-green-800)"
      />
      {/* Ashoka-style pillar abstraction */}
      <path
        d="M50 32v28M42 40h16M44 60h12"
        stroke="var(--brand-gold-400)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="50" cy="35" r="3.5" fill="var(--brand-gold-400)" />
    </g>
  );
}
