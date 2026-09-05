import styles from "./Toggle.module.css";

export default function Toggle({
  label,
  checked,
  onChange,
  subLabel,
}) {
  return (
    <div className={styles.toggleRow}>
      <div className={styles.labelCol}>
        <label className={styles.toggleLabel}>{label}</label>
        {subLabel && <div className={styles.subLabel}>{subLabel}</div>}
      </div>
      <label className={styles.switch}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className={styles.sliderToggle} />
      </label>
    </div>
  );
}
