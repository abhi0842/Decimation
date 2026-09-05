import { useEffect, useRef, useState } from "react";
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
  const shellRef = useRef(null);
  const bubbleRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (bubbleRef.current && shellRef.current) {
      const input = shellRef.current.querySelector("input");
      if (input) {
        const pct = (+value - +min) / (+max - +min);
        bubbleRef.current.style.left = pct * 100 + "%";
        bubbleRef.current.textContent = formatter(value);
      }
    }
  }, [value, min, max, formatter]);

  return (
    <div className={`${styles.ctrl} ${accent ? styles[accent] : ""}`}>
      <div className={styles.ctrlLabel}>
        <span dangerouslySetInnerHTML={{ __html: label }} />
        <span className={styles.val}>{formatter(value)}</span>
      </div>
      <div
        ref={shellRef}
        className={`${styles.sliderShell} ${dragging ? styles.dragging : ""}`}
      >
        <div ref={bubbleRef} className={styles.sliderBubble} />
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
            setDragging(true);
          }}
          onChange={() => setDragging(false)}
          onMouseUp={() => setDragging(false)}
          onMouseLeave={() => setDragging(false)}
          onTouchStart={() => setDragging(true)}
          onTouchEnd={() => setDragging(false)}
        />
      </div>
      {subLabel && <div className={styles.subLabel}>{subLabel}</div>}
    </div>
  );
}
