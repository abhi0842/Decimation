import { useEffect, useState } from "react";
import { foldFreq } from "../../utils/signalProcessing";
import styles from "../visualizations/plot.module.css";

const W = 1000;
const H = 276;

function Peak({ x, base, height, color, label, opacity = 1, glow = false }) {
  return <g opacity={opacity}>
    <line x1={x} x2={x} y1={base} y2={base - height} stroke={color} strokeWidth="3" />
    <circle cx={x} cy={base - height} r="5" fill={color} style={glow ? { filter: `drop-shadow(0 0 5px ${color})` } : undefined} />
    <text x={x} y={base - height - 11} textAnchor="middle" className={styles.samplePlotTitle} fill={color}>{label}</text>
  </g>;
}

export default function AliasingAnimation({ tones, fs, M }) {
  const [progress, setProgress] = useState(1);
  const fsNew = fs / M;
  const nyqNew = fsNew / 2;
  const input = tones.filter((tone) => tone.f >= 0 && tone.f <= fs / 2);
  const inputKey = input.map((tone) => `${tone.f}-${tone.a}`).join(",");

  useEffect(() => {
    let frame;
    const start = performance.now();
    const animate = (now) => {
      const t = Math.min(1, (now - start) / 850);
      setProgress(1 - Math.pow(1 - t, 3));
      if (t < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [fs, M, inputKey]);

  const left = { x: 46, y: 39, w: 407, h: 171 };
  const right = { x: 547, y: 39, w: 407, h: 171 };
  const base = left.y + left.h - 18;
  const toX = (f, panel, max) => panel.x + 24 + (f / Math.max(max, 1)) * (panel.w - 48);
  const maxAmp = Math.max(1, ...input.map((tone) => tone.a));

  return <div className={styles.aliasAnimation}>
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Live spectrum folding animation after direct downsampling">
      {[left, right].map((panel) => <g key={panel.x}>
        <rect x={panel.x} y={panel.y} width={panel.w} height={panel.h} fill="#fff" stroke="#334155" strokeWidth="1.2" />
        {[.25, .5, .75].map((p) => <line key={p} x1={panel.x} x2={panel.x + panel.w} y1={panel.y + p * panel.h} y2={panel.y + p * panel.h} stroke="#e2e8f0" />)}
        <line x1={panel.x} x2={panel.x + panel.w} y1={base} y2={base} stroke="#111827" strokeWidth="1.3" />
      </g>)}
      <text x={left.x + left.w / 2} y="22" textAnchor="middle" className={styles.samplePlotTitle}>(a) Input spectrum</text>
      <text x={right.x + right.w / 2} y="22" textAnchor="middle" className={styles.samplePlotTitle}>(b) Direct ↓{M}: folded output spectrum</text>
      <text x={left.x} y="234" className={styles.sampleAxisLabel}>0 Hz</text>
      <text x={left.x + left.w - 6} y="234" textAnchor="end" className={styles.sampleAxisLabel}>{Math.round(fs / 2)} Hz</text>
      <text x={right.x} y="234" className={styles.sampleAxisLabel}>0 Hz</text>
      <text x={right.x + right.w - 6} y="234" textAnchor="end" className={styles.sampleAxisLabel}>{Math.round(nyqNew)} Hz</text>
      <line x1={toX(nyqNew, left, fs / 2)} x2={toX(nyqNew, left, fs / 2)} y1={left.y} y2={base} stroke="#e97817" strokeWidth="2" strokeDasharray="5 4" />
      <text x={toX(nyqNew, left, fs / 2) - 4} y={left.y + 14} textAnchor="end" className={styles.sampleNote}>new Nyquist</text>
      {input.map((tone) => {
        const height = 112 * (tone.a / maxAmp);
        const x = toX(tone.f, left, fs / 2);
        const outF = foldFreq(tone.f, fsNew);
        const outX = toX(outF, right, nyqNew);
        const unsafe = tone.f > nyqNew;
        const travelX = x + (outX - x) * progress;
        return <g key={tone.id}>
          <Peak x={x} base={base} height={height} color={tone.color} label={`${Math.round(tone.f)} Hz`} />
          <path d={`M ${x} ${base - height - 22} C ${x + 55} ${left.y - 4}, ${outX - 55} ${left.y - 4}, ${outX} ${base - height - 22}`} fill="none" stroke={unsafe ? "#dc2626" : "#16a34a"} strokeWidth="1.7" strokeDasharray="4 4" opacity={0.65} />
          <circle cx={travelX} cy={base - height - 22} r="4" fill={unsafe ? "#dc2626" : "#16a34a"} opacity={progress < .95 ? 1 : 0} />
          <Peak x={outX} base={base} height={height} color={unsafe ? "#dc2626" : tone.color} label={unsafe ? `${Math.round(outF)} Hz alias` : `${Math.round(outF)} Hz`} opacity={progress} glow={unsafe} />
        </g>;
      })}
      <text x={W / 2} y="264" textAnchor="middle" className={styles.sampleNote}>Green path: stays in band. Red path: folds into a false low-frequency alias. Change M or a tone frequency to replay.</text>
    </svg>
  </div>;
}
