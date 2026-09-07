import { useContext } from "react";
import { DecimationContext } from "../../context/DecimationContext";
import styles from "./topPanel.module.css";

const TopPanel = () => {
  const {
    showInstruction,
    setShowInstruction,
    buttonRef,
    guideActive,
    setGuideActive,
    setGuideStepIdx,
  } = useContext(DecimationContext);

  const toggleInstruction = () => {
    setShowInstruction(!showInstruction);
  };

  const toggleGuide = () => {
    if (!guideActive) {
      setGuideStepIdx(0);
      setGuideActive(true);
    } else {
      setGuideActive(false);
      setShowInstruction(false);
      setGuideStepIdx(0);
    }
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
            onClick={toggleGuide}
            style={{ backgroundColor: guideActive ? "#2ecc71" : "" }}
          >
            <span className={styles.buttonIcon}></span>
            Guided Tutor
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopPanel;
