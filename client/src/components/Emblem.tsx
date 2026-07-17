import emblem from "../assets/ksp-emblem-official.png";

/**
 * The official Karnataka State Police emblem — the Ashoka Lion Capital over a
 * red shield bearing the Gandaberunda (the state's mythical two-headed eagle),
 * gajakesari (lion-elephant) supporters, and "सत्यमेव जयते" ("Satyameva Jayate")
 * on the ribbon.
 *
 * Sourced directly from ksp.karnataka.gov.in's own site header
 * (frontend/opt1/images/center_logo/kar_main_logo.png) — this is the exact
 * asset KSP displays on their own homepage, not a recreation. An earlier
 * AI-generated version of this crest was rejected before shipping: it used
 * rampant lions under a European crown (Indian state insignia don't carry a
 * monarch's crown) and its Kannada banner text didn't match between two
 * separate generations of "the same" crest — a tell that it was invented
 * rather than transcribed. Do not regenerate this asset; if it ever needs to
 * change, re-derive it from an official source the way this one was.
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
      <span
        className={className}
        style={{
          display: "inline-grid",
          placeItems: "center",
          width: size,
          height: size,
          borderRadius: "50%",
          background: "var(--brand-green-800)",
          border: `${Math.max(1.5, size * 0.025)}px solid var(--brand-gold-500)`,
          boxSizing: "border-box",
        }}
      >
        <img
          src={emblem}
          alt="Karnataka State Police"
          width={size * 0.7}
          height={size * 0.7}
          style={{ objectFit: "contain" }}
        />
      </span>
    );
  }

  return (
    <img
      className={className}
      src={emblem}
      alt="Karnataka State Police"
      width={size}
      height={size}
      style={{ objectFit: "contain" }}
    />
  );
}
