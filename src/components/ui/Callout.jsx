import styles from "./Callout.module.css";

export default function Callout({
  type = "neutral",
  icon,
  title,
  children,
}) {
  return (
    <div className={`${styles.callout} ${styles[type]}`}>
      {icon && <div className={styles.icon}>{icon}</div>}
      <div className={styles.body}>
        {title && <div className={styles.title} dangerouslySetInnerHTML={{ __html: title }} />}
        <div className={styles.content} dangerouslySetInnerHTML={{ __html: children }} />
      </div>
    </div>
  );
}
