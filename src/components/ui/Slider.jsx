import { useState } from "react";
import styles from "./Slider.module.css";

export default function Slider({
  id,
  label,
  subLabel,
  value,
  min,
  max,
  step = 1,
  onChange,
  formatter = (v) => v,
  accent,
  disabled = false,
}) {
  const [dragging, setDragging] = useState(false);
  const pct = Math.min(100, Math.max(0, ((+value - +min) / (+max - +min)) * 100));

  return (
    <div className={`${styles.ctrl} ${accent ? styles[accent] : ""}`}>
      <div className={styles.ctrlLabel}>
        <span dangerouslySetInnerHTML={{ __html: label }} />
        <span className={styles.val}>{formatter(value)}</span>
      </div>
      <div
        className={`${styles.sliderShell} ${dragging ? styles.dragging : ""}`}
      >
        <div className={styles.sliderBubble} style={{ left: `${pct}%` }}>{formatter(value)}</div>
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onInput={(e) => {
            onChange(+e.target.value);
          }}
          onPointerDown={() => setDragging(true)}
          onPointerUp={() => setDragging(false)}
          onPointerCancel={() => setDragging(false)}
          onBlur={() => setDragging(false)}
        />
      </div>
      {subLabel && <div className={styles.subLabel}>{subLabel}</div>}
    </div>
  );
}
