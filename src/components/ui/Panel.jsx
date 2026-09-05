import styles from "./Panel.module.css";

export default function Panel({ title, subtitle, right, children, className = "" }) {
  return (
    <div className={`${styles.panel} ${className}`}>
      {(title || right) && (
        <h3>
          <span>{title}</span>
          {right && <span className={styles.right}>{right}</span>}
        </h3>
      )}
      {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
      {children}
    </div>
  );
}
