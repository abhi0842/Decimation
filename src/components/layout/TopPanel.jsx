import { useContext } from "react";
import { DecimationContext } from "../../context/DecimationContext";
import styles from "./layout.module.css";

const TopPanel = () => {
  const {
    showInstruction,
    setShowInstruction,
    buttonRef,
    instructionPanelRef,
  } = useContext(DecimationContext);

  const toggleInstruction = () => {
    setShowInstruction(!showInstruction);
  };

  return (
    <div className={styles.Container}>
      <div className={styles.panelContainer}>
        <h1>Decimation Lab</h1>
        <div className={styles.buttonContainer}>
          <button
            ref={buttonRef}
            className={styles.panelButton}
            onClick={toggleInstruction}
          >
            <span className={styles.buttonIcon}></span>
            Instruction
          </button>
          <button
            id="guideButton"
            className={styles.panelButton}
            disabled
            title="Guided Tutor is temporarily unavailable"
          >
            <span className={styles.buttonIcon}></span>
            Guided Tutor (soon)
          </button>
        </div>
      </div>
      {showInstruction && (
        <section className={styles.instructionPanel} ref={instructionPanelRef}>
          <div className={styles.instructionHeader}>
            <strong>How to run the experiment</strong>
            <button
              className={styles.instructionClose}
              onClick={() => setShowInstruction(false)}
              aria-label="Close instructions"
            >
              ×
            </button>
          </div>
          <ol>
            <li>Start in <b>Build Signal</b>. Select a preset to load a useful example, or adjust the sampling rate, tone frequency, and amplitude sliders.</li>
            <li>In the <b>Sampling rate</b> panel, check the Nyquist limit. Frequencies above half the sampling rate cannot be represented safely.</li>
            <li>Click <b>Generate signal</b>. The time-domain waveform and frequency bars appear only after this step.</li>
            <li>Open <b>Pick M and Visualize Folding</b>. Increase <b>M</b> to lower the new sampling rate and observe which tones cross the new Nyquist limit.</li>
            <li>Open <b>Apply LPF</b>. Set the cutoff at or below the new Nyquist limit, then increase filter order if unwanted energy remains.</li>
            <li>Open <b>Decimate</b> and replay the animation. The correct order is: filter first, then keep every M-th sample.</li>
          </ol>
          <p><b>What to look for:</b> red output peaks marked ALIAS mean high-frequency content was still present when samples were discarded. A clean result means the low-pass filter removed it first.</p>
        </section>
      )}
    </div>
  );
};

export default TopPanel;
