import {
  Phase,
  CX, CY, R, START_ANGLE, SWEEP,
  polarToXY, arcPath,
  SCALE_MAX, UPLOAD_MAX, DL_LABELS, UL_LABELS,
  ST_DOWNLOAD, ST_UPLOAD, ST_TRACK,
} from "./constants";

export default function Speedometer({ value, max, phase }: { value: number; max: number; phase: Phase }) {
  const progress = Math.min(value / max, 1);
  const isUpload = phase === "upload";
  const accent = isUpload ? ST_UPLOAD : ST_DOWNLOAD;
  const active = phase === "download" || phase === "upload";
  const labels = max === UPLOAD_MAX ? UL_LABELS : DL_LABELS;

  // Radial "spokes" around the whole 270° arc — the signature Speedtest look.
  const SPOKES = 60;
  const spokes = Array.from({ length: SPOKES + 1 }, (_, i) => {
    const frac = i / SPOKES;
    const angleDeg = START_ANGLE + frac * SWEEP;
    const outer = polarToXY(angleDeg, R + 2);
    const inner = polarToXY(angleDeg, R - 12);
    const lit = frac <= progress && active;
    return { angleDeg, outer, inner, lit, key: i };
  });

  const bigNumber = active
    ? value >= 1000 ? (value / 1000).toFixed(2) : value.toFixed(value < 100 ? 1 : 0)
    : phase === "done" || phase === "idle" ? "0" : "";

  return (
    <svg viewBox="0 0 320 320" width="100%" style={{ maxWidth: 380, display: "block", margin: "0 auto" }}>
      <defs>
        <filter id="stGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <linearGradient id="stArc" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.9" />
          <stop offset="100%" stopColor={accent} />
        </linearGradient>
      </defs>

      {/* Background full track */}
      <path
        d={arcPath(START_ANGLE, START_ANGLE + SWEEP, R)}
        fill="none"
        stroke={ST_TRACK}
        strokeWidth={10}
        strokeLinecap="round"
      />

      {/* Radial spokes */}
      {spokes.map((s) => (
        <line
          key={s.key}
          x1={s.inner.x} y1={s.inner.y} x2={s.outer.x} y2={s.outer.y}
          stroke={s.lit ? accent : "rgba(255,255,255,0.10)"}
          strokeWidth={s.lit ? 2.4 : 1.4}
          strokeLinecap="round"
          style={{ transition: "stroke 0.12s linear" }}
        />
      ))}

      {/* Progress arc glow */}
      {active && progress > 0.01 && (
        <path
          d={arcPath(START_ANGLE, START_ANGLE + progress * SWEEP, R)}
          fill="none"
          stroke="url(#stArc)"
          strokeWidth={10}
          strokeLinecap="round"
          filter="url(#stGlow)"
          style={{ transition: "stroke 0.12s linear" }}
        />
      )}

      {/* Scale labels */}
      {labels.map((label) => {
        const frac = label / max;
        const angleDeg = START_ANGLE + frac * SWEEP;
        const pt = polarToXY(angleDeg, R - 30);
        const displayLabel = max === SCALE_MAX && label >= 1000 ? "1000" : String(label);
        return (
          <text
            key={label}
            x={pt.x} y={pt.y + 3}
            textAnchor="middle"
            fontSize="10"
            fill="rgba(255,255,255,0.4)"
            fontFamily="Montserrat, sans-serif"
          >
            {displayLabel}
          </text>
        );
      })}

      {/* Phase label (top, above number) */}
      <text
        x={CX} y={CY - 44}
        textAnchor="middle"
        fontSize="12"
        letterSpacing="2"
        fontWeight="700"
        fill={active ? accent : "rgba(255,255,255,0.35)"}
        fontFamily="Montserrat, sans-serif"
        style={{ textTransform: "uppercase" }}
      >
        {phase === "download" ? "↓ DOWNLOAD"
          : phase === "upload" ? "↑ UPLOAD"
          : phase === "ping" ? "PING"
          : phase === "done" ? "DONE" : "READY"}
      </text>

      {/* Big number */}
      <text
        x={CX} y={CY + 18}
        textAnchor="middle"
        fontSize="66"
        fontWeight="800"
        fill="#ffffff"
        fontFamily="Montserrat, sans-serif"
        style={{ transition: "fill 0.15s" }}
      >
        {bigNumber}
      </text>

      {/* Unit */}
      <text
        x={CX} y={CY + 44}
        textAnchor="middle"
        fontSize="13"
        letterSpacing="1"
        fill="rgba(255,255,255,0.45)"
        fontFamily="Montserrat, sans-serif"
      >
        {active && value >= 1000 ? "Gbps" : "Mbps"}
      </text>
    </svg>
  );
}
