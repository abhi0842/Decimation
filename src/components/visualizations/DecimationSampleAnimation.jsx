import styles from "./plot.module.css";

const W = 1000;
const H = 310;
const BLUE = "#1f77b4";
const RED = "#dc2626";
const MUTED = "#cbd5e1";

function Stem({ x, y, baseY, color, ring, opacity = 1 }) {
  return (
    <g opacity={opacity}>
      <line
        x1={x}
        y1={baseY}
        x2={x}
        y2={y}
        stroke={color}
        strokeWidth="2"
      />
      <circle cx={x} cy={y} r="4.5" fill={color} />
      {ring && (
        <circle
          cx={x}
          cy={y}
          r="8.2"
          fill="none"
          stroke={BLUE}
          strokeWidth="3"
        />
      )}
    </g>
  );
}

function Axis({ x, y, w, h, title, xLabel }) {
  return (
    <>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill="#fff"
        stroke="#334155"
        strokeWidth="1.2"
      />

      {[0.25, 0.5, 0.75].map((p) => (
        <line
          key={p}
          x1={x}
          x2={x + w}
          y1={y + p * h}
          y2={y + p * h}
          stroke="#e2e8f0"
        />
      ))}

      <line
        x1={x}
        x2={x + w}
        y1={y + h / 2}
        y2={y + h / 2}
        stroke="#111827"
        strokeWidth="1.5"
      />

      <text
        x={x + w / 2}
        y={y - 9}
        textAnchor="middle"
        className={styles.samplePlotTitle}
      >
        {title}
      </text>

      <text
        x={x + w / 2}
        y={y + h + 24}
        textAnchor="middle"
        className={styles.sampleAxisLabel}
      >
        {xLabel}
      </text>
    </>
  );
}

export default function DecimationSampleAnimation({
  samples,
  M,
  progress = 0,
}) {
  const visible = (samples || []).slice(0, 24);
  const kept = visible.filter((_, index) => index % M === 0);

  const max = Math.max(
    1,
    ...visible.map((sample) => Math.abs(sample.y))
  );

  const panels = {
    x1: 44,
    x2: 530,
    y: 38,
    w: 425,
    h: 202,
  };

  const point = (sample, index, count, x, width) => ({
    x:
      x +
      22 +
      (index / Math.max(1, count - 1)) * (width - 44),

    y:
      panels.y +
      panels.h / 2 -
      (sample.y / max) * (panels.h * 0.41),
  });

  /*
   * Animation timing
   *
   * 0 → 0.75 : classify input samples
   * 0.75 → 1 : reveal output
   *
   * This makes the animation slower than the previous
   * 0.65 / 0.35 split.
   */
  const inputProgress = Math.max(
    0,
    Math.min(1, progress / 0.75)
  );

  const outputProgress = Math.max(
    0,
    Math.min(1, (progress - 0.75) / 0.25)
  );

  /*
   * Output panel is completely hidden until
   * the animation reaches 100%.
   */
  const animationComplete = progress >= 1;

  const isInputClassified = (index) => {
    if (visible.length <= 1) {
      return inputProgress > 0;
    }

    return (
      index / (visible.length - 1) <= inputProgress
    );
  };

  return (
    <div className={styles.sampleAnimation}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Keep every ${M}-th sample and place it on the slower output clock`}
      >
        {/* INPUT PANEL — always visible */}
        <Axis
          x={panels.x1}
          y={panels.y}
          w={panels.w}
          h={panels.h}
          title={`(a) Input — classify every ${M}-th sample`}
          xLabel="input sample index n"
        />

        {/* INPUT SAMPLES */}
        {visible.map((sample, index) => {
          const p = point(
            sample,
            index,
            visible.length,
            panels.x1,
            panels.w
          );

          const classified = isInputClassified(index);
          const keptSample = index % M === 0;

          return (
            <Stem
              key={sample.n}
              x={p.x}
              y={p.y}
              baseY={panels.y + panels.h / 2}
              color={
                classified
                  ? keptSample
                    ? BLUE
                    : RED
                  : MUTED
              }
              ring={
                classified && keptSample
              }
            />
          );
        })}

        {/* 
         * OUTPUT PANEL
         *
         * Completely absent until animation finishes.
         */}
        {animationComplete && (
          <>
            <Axis
              x={panels.x2}
              y={panels.y}
              w={panels.w}
              h={panels.h}
              title={`(b) After ↓${M} — output`}
              xLabel="output sample index k"
            />

            {kept.map((sample, index) => {
              const p = point(
                sample,
                index,
                kept.length,
                panels.x2,
                panels.w
              );

              return (
                <Stem
                  key={sample.n}
                  x={p.x}
                  y={p.y}
                  baseY={panels.y + panels.h / 2}
                  color={BLUE}
                  opacity={1}
                />
              );
            })}
          </>
        )}

        {/* Notes */}
        <text
          x="256"
          y="286"
          textAnchor="middle"
          className={styles.sampleNote}
        >
          blue: kept every {M}-th sample · red: removed
        </text>

        {animationComplete && (
          <text
            x="744"
            y="286"
            textAnchor="middle"
            className={styles.sampleNote}
          >
            same values, re-indexed as y[k] = x[kM]
          </text>
        )}
      </svg>
    </div>
  );
}