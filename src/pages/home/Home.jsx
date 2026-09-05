import styles from "./home.module.css";
import TopPanel from "../../components/topPanel/TopPanel.jsx";
import DecimationLab from "../../components/decimationLab/DecimationLab.jsx";

export const Home = () => {
  return (
    <div className={styles.grandContainer}>
      <div className={styles.parentContainer}>
        <div className={styles.topContainer}>
          <TopPanel />
        </div>
        <div className={styles.middleContainer}>
          <DecimationLab />
        </div>
        <div className={styles.footerContainer}>
          ©Copyright 2025 Virtual Labs, IIT Roorkee — Multirate DSP: Decimation
        </div>
      </div>
    </div>
  );
};
