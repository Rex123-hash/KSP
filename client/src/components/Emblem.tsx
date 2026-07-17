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
        aria-label="Karnataka State Police"
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
        <g transform="translate(50 53) scale(0.6) translate(-50 -50)">
          <BadgeBody />
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
      <BadgeBody />
    </svg>
  );
}

function BadgeBody() {
  return (
    <g>
      <path
        d="M50 6 84 18v28c0 24-14 41-34 48C30 87 16 70 16 46V18L50 6Z"
        fill="var(--brand-green-800)"
        stroke="var(--brand-gold-500)"
        strokeWidth="2"
      />
      <path
        d="M50 16 76 25v21c0 18-10.5 31-26 36-15.5-5-26-18-26-36V25L50 16Z"
        fill="var(--brand-green-050)"
        opacity="0.08"
      />
      <path
        d="M50 30 58.8 45.6 76 48.6 63.8 61.2 66.6 78.6 50 70.4 33.4 78.6 36.2 61.2 24 48.6 41.2 45.6 50 30Z"
        fill="var(--brand-gold-500)"
      />
    </g>
  );
}
