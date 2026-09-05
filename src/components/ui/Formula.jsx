import styles from "./Formula.module.css";

export default function Formula({ title, children, collapsed = false }) {
  return (
    <div className={styles.formulaBox}>
      {title && <div className={styles.title}>{title}</div>}
      <div
        className={`${styles.body} ${collapsed ? styles.collapsed : ""}`}
        dangerouslySetInnerHTML={{ __html: children }}
      />
    </div>
  );
}
