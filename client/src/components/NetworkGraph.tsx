import "./NetworkGraph.css";

export type NetworkNode = {
  id: string;
  name: string;
  confidence: number;
  kind: "known" | "associated" | "unknown";
  angle: number;
};

function tierOf(score: number): "high" | "medium" | "low" {
  if (score >= 75) return "high";
  if (score >= 60) return "medium";
  return "low";
}

/**
 * Criminal-association graph. A resolved person at the centre, linked persons on
 * a ring. The EDGE style encodes link confidence (solid / dashed / dotted); the
 * NODE ring encodes identity certainty (known / associated / unknown). Nothing
 * here is a photo — nodes are initial discs, unknowns a dashed silhouette.
 *
 * Confidence is never hidden: every node prints its score, so an inferred link
 * is never shown as a certainty. This is the whole point of the screen.
 */

const W = 640;
const H = 468;
const CX = W / 2;
const CY = 226;
const RING = 158;
const NODE_R = 32;
const CENTER_R = 46;

function initials(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (!p.length) return "?";
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

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

function pos(angleDeg: number) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: CX + RING * Math.sin(a), y: CY - RING * Math.cos(a) };
}

const EDGE_STYLE: Record<string, { stroke: string; dash?: string; width: number }> = {
  high: { stroke: "var(--brand-green-600)", width: 2 },
  medium: { stroke: "var(--brand-green-500)", dash: "7 6", width: 1.6 },
  low: { stroke: "var(--brand-gold-500)", dash: "2 6", width: 1.6 },
};

export function NetworkGraph({
  focusName,
  focusConfidence,
  nodes,
}: {
  focusName: string;
  focusConfidence: number;
  nodes: NetworkNode[];
}) {
  return (
    <div className="netgraph">
      <svg viewBox={`0 0 ${W} ${H}`} className="netgraph__svg" role="img"
        aria-label={`Association network for ${focusName}`}>
        {/* Edges first, under the nodes */}
        {nodes.map((n) => {
          const p = pos(n.angle);
          const st = EDGE_STYLE[tierOf(n.confidence)];
          return (
            <line
              key={`e-${n.id}`}
              x1={CX}
              y1={CY}
              x2={p.x}
              y2={p.y}
              stroke={st.stroke}
              strokeWidth={st.width}
              strokeDasharray={st.dash}
              strokeLinecap="round"
            />
          );
        })}

        {/* Ring nodes */}
        {nodes.map((n) => (
          <Node key={n.id} node={n} />
        ))}

        {/* Centre node */}
        <g>
          <circle cx={CX} cy={CY} r={CENTER_R + 5} fill="none"
            stroke="var(--brand-gold-500)" strokeWidth="2" />
          <circle cx={CX} cy={CY} r={CENTER_R} fill="var(--brand-green-800)" />
          <text x={CX} y={CY} className="netgraph__initials" fontSize="26">
            {initials(focusName)}
          </text>
          <text x={CX} y={CY + CENTER_R + 22} className="netgraph__name netgraph__name--center">
            {focusName}
          </text>
          <text x={CX} y={CY + CENTER_R + 38} className="netgraph__conf netgraph__conf--center">
            Confidence: {focusConfidence}%
          </text>
        </g>
      </svg>

      <Legend />
    </div>
  );
}

function Node({ node }: { node: NetworkNode }) {
  const p = pos(node.angle);
  const known = node.kind === "known";
  const unknown = node.kind === "unknown";

  return (
    <g>
      {unknown ? (
        <>
          <circle cx={p.x} cy={p.y} r={NODE_R} fill="var(--surface-sunken)"
            stroke="var(--brand-gold-500)" strokeWidth="1.5" strokeDasharray="4 4" />
          <text x={p.x} y={p.y} className="netgraph__initials netgraph__initials--unknown"
            fontSize="22">?</text>
        </>
      ) : (
        <>
          <circle cx={p.x} cy={p.y} r={NODE_R + 3} fill="none"
            stroke={known ? "var(--brand-green-500)" : "var(--seq-300)"} strokeWidth="2" />
          <circle cx={p.x} cy={p.y} r={NODE_R} fill={toneFor(node.name)} />
          <text x={p.x} y={p.y} className="netgraph__initials" fontSize="20">
            {initials(node.name)}
          </text>
        </>
      )}
      <text x={p.x} y={p.y + NODE_R + 17} className="netgraph__name">{node.name}</text>
      <text x={p.x} y={p.y + NODE_R + 32} className="netgraph__conf">({node.confidence}%)</text>
    </g>
  );
}

function Legend() {
  return (
    <div className="netgraph__legend">
      <div className="netgraph__legend-group">
        <span className="netgraph__legend-item">
          <span className="netgraph__line netgraph__line--high" /> High Confidence
        </span>
        <span className="netgraph__legend-item">
          <span className="netgraph__line netgraph__line--med" /> Medium Confidence
        </span>
        <span className="netgraph__legend-item">
          <span className="netgraph__line netgraph__line--low" /> Low Confidence
        </span>
      </div>
      <div className="netgraph__legend-group">
        <span className="netgraph__legend-item">
          <span className="netgraph__dot netgraph__dot--known" /> Known Person
        </span>
        <span className="netgraph__legend-item">
          <span className="netgraph__dot netgraph__dot--assoc" /> Associated Person
        </span>
        <span className="netgraph__legend-item">
          <span className="netgraph__dot netgraph__dot--unknown" /> Unknown Identity
        </span>
      </div>
    </div>
  );
}
