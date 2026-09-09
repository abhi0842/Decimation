import { useContext } from "react";
import { DecimationContext } from "../../context/DecimationContext";
import Step1Signal from "../steps/Step1Signal";
import Step2Rule from "../steps/Step2Rule";
import Step3LPF from "../steps/Step3LPF";
import Step4Decimate from "../steps/Step4Decimate";
import GuidedModal from "../guidedModal/GuidedModal";
import styles from "./DecimationLab.module.css";

const steps = [
  { id: 0, label: "1. Build Signal"},
  { id: 1, label: "2. Pick M and Visualize Folding"},
  { id: 2, label: "3. Apply LPF"},
  { id: 3, label: "4. Decimate" },
];

export default function DecimationLab() {
  const {
    activeStep,
    setActiveStep,
    prevStep,
    nextStep,
    resetToRecommended,
  } = useContext(DecimationContext);

  return (
    <div className={styles.wrap}>
      

      <div className={styles.tabbar}>
        {steps.map((s) => (
          <button
            key={s.id}
            className={activeStep === s.id ? styles.active : ""}
            onClick={() => setActiveStep(s.id)}
          >
            <span className={styles.tabIcon}>{s.icon}</span>
            <span className={styles.tabN}>{s.id + 1}</span>
            <span className={styles.tabLabel}>{s.label.replace(/^\d+\.\s*/, "")}</span>
          </button>
        ))}
      </div>

      <div className={styles.progressTrack}>
        <div
          className={styles.progressFill}
          style={{ width: ((activeStep + 1) / steps.length) * 100 + "%" }}
        />
        {steps.map((s) => (
          <div
            key={s.id}
            className={`${styles.progressDot} ${
              activeStep >= s.id ? styles.dotDone : ""
            }`}
            style={{ left: (s.id / (steps.length - 1)) * 100 + "%" }}
          />
        ))}
      </div>

      {activeStep === 0 && <Step1Signal />}
      {activeStep === 1 && <Step2Rule />}
      {activeStep === 2 && <Step3LPF />}
      {activeStep === 3 && <Step4Decimate />}

      <div className={styles.tabfoot}>
        <button
          className={styles.navbtn}
          onClick={prevStep}
          disabled={activeStep === 0}
        >
          ← Previous
        </button>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className={styles.navbtn}
            onClick={resetToRecommended}
            title="Reset to default lecture settings"
          >
            🔄 Reset
          </button>
          <button
            className={`${styles.navbtn} ${styles.next}`}
            onClick={nextStep}
            disabled={activeStep === steps.length - 1}
          >
            {activeStep === steps.length - 1 ? "Done ✓" : "Next →"}
          </button>
        </div>
      </div>

      <GuidedModal />

      <footer className={styles.footer}>
        Virtual Lab · Multirate DSP · Correct chain:
        <b> design LPF → filter the signal → keep every M-th sample</b>
      </footer>
    </div>
  );
}
