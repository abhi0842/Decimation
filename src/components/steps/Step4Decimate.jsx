import { useContext, useEffect, useRef, useState } from "react";
import { DecimationContext } from "../../context/DecimationContext";
import Panel from "../ui/Panel";
import Callout from "../ui/Callout";
import Formula from "../ui/Formula";
import Readout from "../ui/Readout";
import SpectrumPlot from "../visualizations/SpectrumPlot";
import DecimationSampleAnimation from "../visualizations/DecimationSampleAnimation";
import styles from "./Steps.module.css";

export default function Step4Decimate() {
  const {
    fs, M, fsNew, nyqNew, fcClamped, orderOdd,
    survivingTones, outTones, toneResults, overCount, hasLeakage, filteredSignal,
    decimAnimProgress, setDecimAnimProgress, markAction, bypassLPF,
  } = useContext(DecimationContext);
  const isLectureExample = fs === 1200 && M === 3 && toneResults.length === 2 &&
    toneResults.some((tone) => Math.round(tone.origF) === 150) &&
    toneResults.some((tone) => Math.round(tone.origF) === 500);

  const timerRef = useRef(null);
  const sampleCount = Math.min(filteredSignal.length, 24);
  const [sampleIndex, setSampleIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(false);

  const updateProgress = (index) => {
    if (index >= sampleCount - 1) {
      setDecimAnimProgress(1);
      setIsPlaying(false);
      markAction("SEE_DECI");
      return;
    }

    const inputProgress = sampleCount <= 1 ? 1 : index / (sampleCount - 1);
    setDecimAnimProgress(inputProgress * 0.75);
  };

  const nextSample = () => {
    setSampleIndex((current) => {
      const next = Math.min(current + 1, sampleCount - 1);
      updateProgress(next);
      return next;
    });
  };

  const playAnim = () => {
    if (sampleIndex >= sampleCount - 1) {
      setSampleIndex(-1);
      setDecimAnimProgress(0);
    }
    setIsPlaying(true);
  };

  const pauseAnim = () => {
    setIsPlaying(false);
  };

  const toggleAuto = () => {
    setAutoAdvance((enabled) => {
      const nextEnabled = !enabled;
      if (nextEnabled) setIsPlaying(true);
      return nextEnabled;
    });
  };

  useEffect(() => {
    if (!isPlaying) return undefined;

    timerRef.current = setInterval(() => {
      nextSample();
    }, 180);

    return () => clearInterval(timerRef.current);
  }, [isPlaying, sampleCount]);

  useEffect(() => () => clearInterval(timerRef.current), []);

  const finalType = hasLeakage
    ? "danger"
    : overCount > 0
    ? "safe"
    : "neutral";
  const finalIcon = hasLeakage ? "" : overCount > 0 ? "" : "ℹ";
  const finalTitle = hasLeakage
    ? "Leakage detected — LPF is too weak."
    : overCount > 0
    ? "Correct decimation chain — no aliasing."
    : "Decimation complete.";
  const finalBody = hasLeakage
    ? `Residual energy above new Nyquist aliased after ↓M. Go back to Step 3 and increase the filter order or lower f<sub>c</sub>.`
    : overCount > 0
    ? `The LPF removed content above ${Math.round(nyqNew)} Hz first, then every ${M}-th sample was kept. New peaks appear in the output. Output rate = <b>${Math.round(fsNew)} Hz</b>.`
    : `No tone is currently above the new Nyquist. Raise a frequency above ${Math.round(nyqNew)} Hz or increase M to stress-test the chain.`;

  return (
    <div className={styles.stepWrap}>
      <div className={styles.stepHead}>
        <div className={styles.stepNum}>4</div>
        <div>
          <div className={styles.stepTitle}>Downsample the filtered signal</div>
         
        </div>
      </div>

      <div className={styles.pipeline}>
        <div className={`${styles.pipeBlock} ${styles.active}`}>
          <div className={styles.label}>Filtered</div>x<sub>f</sub>[n]
        </div>
        <div className={styles.pipeArrow}>→</div>
        <div className={`${styles.pipeBlock} ${styles.active}`}>
          <div className={styles.label}>↓ M</div>every {M}-th
        </div>
        <div className={styles.pipeArrow}>→</div>
        <div className={`${styles.pipeBlock} ${styles.active}`}>
          <div className={styles.label}>Output</div>y[n] @ {Math.round(fsNew)} Hz
        </div>
      </div>

     

      {isLectureExample && (
        <div className={`${styles.exampleStory} ${bypassLPF ? styles.exampleUnsafe : styles.exampleSafe}`}>
          <div className={styles.exampleKicker}>Module 3 worked example</div>
          <div className={styles.exampleFlow}>
            <strong>1200 Hz</strong><span>÷ 3</span><strong>400 Hz output rate</strong><span>→</span><strong>200 Hz new Nyquist</strong>
          </div>
          {bypassLPF ? (
            <p><b>Without the LPF:</b> 150 Hz remains at 150 Hz, while 500 Hz folds as 500 − 400 = <b>100 Hz</b>. The 100 Hz peak is an alias, not original signal content.</p>
          ) : (
            <p><b>With the LPF first:</b> the 500 Hz tone is removed before ↓3, so only the genuine 150 Hz tone appears at the output.</p>
          )}
        </div>
      )}

     

      <div style={{ height: 14 }} />

      <Panel title="Keep every M-th sample" right={`${fs} Hz → ${Math.round(fsNew)} Hz`}>
          <DecimationSampleAnimation samples={filteredSignal} M={M} progress={decimAnimProgress} />
          <div className={styles.animPanel}>
            <button className={`${styles.animBtn} ${styles.primary}`} onClick={playAnim}>
              ▶ Play
            </button>
            <button className={styles.animBtn} onClick={pauseAnim} disabled={!isPlaying}>
              ❚❚ Pause
            </button>
            <button
              className={`${styles.animBtn} ${autoAdvance ? styles.selected : ""}`}
              onClick={toggleAuto}
              aria-pressed={autoAdvance}
            >
              {autoAdvance ? "Auto on" : "Auto"}
            </button>
            <button
              className={styles.animBtn}
              onClick={nextSample}
              disabled={sampleIndex >= sampleCount - 1}
            >
              Next sample →
            </button>
            <div className={styles.animStatus}>
              {decimAnimProgress >= 1
                ? "output visible ✓"
                : sampleIndex < 0
                ? "ready: choose Next or Play"
                : `${sampleIndex + 1} of ${sampleCount} input samples classified`}
            </div>
          </div>
          <div style={{ fontSize: 12, color: "#5a6f8f", marginTop: 8, lineHeight: 1.5 }}>
            Animation sequence: identify every M-th input sample → discard the rest → place the kept values on the slower output clock.
          </div>
      </Panel>

      <div className={styles.sideBySide}>
        <Panel title="Filtered spectrum (before ↓M)" right="0 → fs/2">
          <SpectrumPlot
            tones={survivingTones.map((t) => ({ ...t, label: t.id }))}
            maxFreq={fs / 2}
            limitLine={nyqNew}
            limitLabel="new Nyquist"
            height={160}
          />
        </Panel>
        <Panel title="Output spectrum after ↓M" right={"0 → " + Math.round(nyqNew)}>
          <SpectrumPlot
            tones={outTones}
            maxFreq={nyqNew}
            height={160}
          />
        </Panel>
      </div>
       <Panel title="Summary of the decimation parameters used">
        <div className={styles.readoutGrid}>
          <Readout label="LPF cutoff f<sub>c</sub>" value={Math.round(fcClamped) + " Hz"} color="blue" />
          <Readout label="Filter order N" value={"N = " + orderOdd} color="blue" />
          <Readout label="Downsample M" value={"M = " + M} color="amber" />
          <Readout label="Output rate" value={Math.round(fsNew) + " Hz"} color="green" />
          <Readout label="Output Nyquist" value={Math.round(nyqNew) + " Hz"} color="green" />
          <Readout label="Samples kept" value={Math.round(100 / M) + "%"} color="green" hint={`1 out of every ${M}`} />
        </div>
      </Panel>

      <Panel title="Where each tone lands after LPF + ↓M">
        <div className={styles.tableWrap}>
          <table className={styles.results}>
            <thead>
              <tr>
                <th>Tone</th>
                <th>Original f</th>
                <th>LPF gain |H(f)|</th>
                <th>After LPF</th>
                <th>After ↓M</th>
              </tr>
            </thead>
            <tbody>
              {toneResults.map((r) => (
                <tr key={r.id}>
                  <td style={{ color: r.color, fontWeight: 800 }}>{r.id}</td>
                  <td>{Math.round(r.origF)} Hz</td>
                  <td>{r.gainPct}%</td>
                  <td>
                    {r.afterLpf.status === "removed" ? (
                      <span className={`${styles.tag} ${styles.filtered}`}>removed</span>
                    ) : (
                      r.afterLpf.text
                    )}
                  </td>
                  <td>
                    {r.afterDec.status === "gone" ? (
                      <span className={`${styles.tag} ${styles.filtered}`}>gone</span>
                    ) : r.afterDec.status === "alias" ? (
                      <span style={{ color: "#dc2626", fontWeight: 700 }}>
                        {r.afterDec.text}
                      </span>
                    ) : (
                      r.afterDec.text
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Callout type={finalType} icon={finalIcon} title={finalTitle}>
        {finalBody}
      </Callout>

     
    </div>
  );
}
