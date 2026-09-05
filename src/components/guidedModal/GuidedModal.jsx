import { useContext } from "react";
import { DecimationContext } from "../../context/DecimationContext";
import styles from "./GuidedModal.module.css";

export default function GuidedModal() {
  const {
    guideActive,
    setGuideActive,
    guideStepIdx,
    setGuideStepIdx,
    steps,
    canProceed,
    currentGuideStep,
  } = useContext(DecimationContext);

  if (!guideActive) return null;

  const isLast = guideStepIdx === steps.length - 1;

  return (
    <div className={styles.overlay} onClick={() => !isLast || setGuideActive(false)}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.stepInfo}>
            <span className={styles.stepNumBadge}>
              {guideStepIdx + 1} / {steps.length}
            </span>
            <span className={styles.stepTitle}>{currentGuideStep?.title}</span>
          </div>
          <button
            className={styles.closeBtn}
            onClick={() => setGuideActive(false)}
            aria-label="Close guide"
          >
            ✕
          </button>
        </div>
        <div className={styles.progress}>
          <div
            className={styles.progressFill}
            style={{ width: ((guideStepIdx + 1) / steps.length) * 100 + "%" }}
          />
        </div>
        <div className={styles.body}>
          <div className={styles.icon}>🎓</div>
          <p className={styles.desc}>{currentGuideStep?.description}</p>
          {currentGuideStep?.requiredAction && !canProceed && (
            <div className={styles.hint}>
              💡 <b>Try it first:</b> interact with the controls on this page before proceeding.
            </div>
          )}
        </div>
        <div className={styles.footer}>
          <button
            className={styles.ghostBtn}
            onClick={() => setGuideStepIdx((p) => Math.max(0, p - 1))}
            disabled={guideStepIdx === 0}
          >
            ← Back
          </button>
          {isLast ? (
            <button
              className={styles.primaryBtn}
              onClick={() => setGuideActive(false)}
            >
              Start Experimenting 🚀
            </button>
          ) : (
            <button
              className={styles.primaryBtn}
              onClick={() => setGuideStepIdx((p) => Math.min(steps.length - 1, p + 1))}
              disabled={!canProceed}
            >
              {canProceed ? "Next →" : "Complete this step first"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
