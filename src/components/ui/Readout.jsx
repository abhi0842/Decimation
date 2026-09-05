import styles from "./Readout.module.css";

export default function Readout({ label, value, color = "blue", hint }) {
  return (
    <div className={styles.readout}>
      <div className={styles.k}>{label}</div>
      <div className={`${styles.v} ${styles[color]}`} dangerouslySetInnerHTML={{ __html: value }} />
      {hint && <div className={styles.hint}>{hint}</div>}
    </div>
  );
}
