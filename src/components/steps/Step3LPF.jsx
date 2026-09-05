import { useContext } from "react";
import { DecimationContext } from "../../context/DecimationContext";
import Slider from "../ui/Slider";
import Panel from "../ui/Panel";
import Callout from "../ui/Callout";
import Formula from "../ui/Formula";
import Readout from "../ui/Readout";
import TimePlot from "../plot/TimePlot";
import SpectrumPlot from "../plot/SpectrumPlot";
import styles from "./Steps.module.css";

export default function Step3LPF() {
  const {
    fc, setFc, order, setOrder,
    fs, fcClamped, orderOdd, nyqNew, transWidth, h, tones, fTones, overCount,
    snapFcToNyquist, markAction,
  } = useContext(DecimationContext);

  const highStill = fTones.filter((t) => t.f > nyqNew && t.gain >= 0.25).length;

  let expType = "neutral", expTitle = "", expBody = "";
  if (highStill > 0) {
    expType = "danger";
    expTitle = "⚠️ High frequencies are still leaking through.";
    expBody =
      "Increase the <b>filter order</b> (sharper transition) or lower <b>f<sub>c</sub></b>. Stopband attenuation must be deep before decimation.";
  } else if (overCount > 0) {
    expType = "safe";
    expTitle = `✅ Content above new Nyquist (${Math.round(nyqNew)} Hz) is strongly attenuated.`;
    expBody = "This filtered signal is now safe to downsample. Proceed to the final step!";
  } else {
    expType = "neutral";
    expTitle = "LPF is applied.";
    expBody =
      "Raise a tone above the new Nyquist or increase M to watch the filter strip it away. Higher order → sharper roll-off around f<sub>c</sub>.";
  }

  return (
    <div className={styles.stepWrap}>
      <div className={styles.stepHead}>
        <div className={styles.stepNum}>3</div>
        <div>
          <div className={styles.stepTitle}>Apply the FIR low-pass filter</div>
          <div className={styles.stepDesc}>
            Design a real FIR low-pass filter using the <b>windowed-sinc</b> method with a Hamming window.
            Choose the <b>cutoff frequency</b> f<sub>c</sub> ≤ new Nyquist, and the <b>filter order N</b>
            (number of taps — higher = sharper cutoff = more delay).
          </div>
        </div>
      </div>

      <div className={styles.pipeline}>
        <div className={`${styles.pipeBlock} ${styles.active}`}>
          <div className={styles.label}>Input</div>x[n] raw
        </div>
        <div className={styles.pipeArrow}>→</div>
        <div className={`${styles.pipeBlock} ${styles.active}`}>
          <div className={styles.label}>FIR LPF</div>order {orderOdd}, f<sub>c</sub> {Math.round(fcClamped)} Hz
        </div>
        <div className={styles.pipeArrow}>→</div>
        <div className={`${styles.pipeBlock} ${styles.active}`}>
          <div className={styles.label}>Output</div>x<sub>f</sub>[n] filtered
        </div>
      </div>

      <Formula
        title="Windowed-sinc FIR design (Hamming window)"
      >
        Ideal sinc:&nbsp;
        <span className="eq">
          h<sub>ideal</sub>[k] = 2f<sub>c</sub>/f<sub>s</sub> · sinc(2π·f<sub>c</sub>/f<sub>s</sub> · k)
        </span>
        <br />
        Hamming:&nbsp;
        <span className="eq">
          w[n] = 0.54 − 0.46·cos(2πn/(N−1))
        </span>
        <br />
        Final:&nbsp;
        <span className="eq">
          h[n] = h<sub>ideal</sub>[n − (N−1)/2] · w[n]
        </span>,
        then normalize DC gain to 1.
      </Formula>

      <div className={styles.grid2}>
        <div>
          <Panel title="FIR low-pass parameters" right="windowed-sinc">
            <Slider
              id="in-fc"
              label="Cutoff f<sub>c</sub>"
              value={fc}
              min={20}
              max={fs / 2 - 5}
              step={5}
              onChange={(v) => { setFc(v); markAction("SET_LPF"); }}
              formatter={(v) => Math.round(v) + " Hz"}
              accent="green"
            />
            <Slider
              id="in-order"
              label="Filter order N (taps)"
              value={order}
              min={11}
              max={121}
              step={2}
              onChange={(v) => { setOrder(v); markAction("SET_LPF"); }}
              formatter={(v) => "N = " + (v | 1)}
            />
            <button
              className={styles.btnRec}
              onClick={() => { snapFcToNyquist(); markAction("SET_LPF"); }}
            >
              🎯 Set f<sub>c</sub> = new Nyquist (recommended)
            </button>

            <div className={styles.readoutGrid}>
              <Readout
                label="New Nyquist"
                value={Math.round(nyqNew) + " Hz"}
                color="red"
                hint="ideal upper bound for fc"
              />
              <Readout
                label="Current f<sub>c</sub>"
                value={Math.round(fcClamped) + " Hz"}
                color="green"
                hint={fcClamped > nyqNew ? "above limit ⚠" : "safe ✓"}
              />
              <Readout
                label="Filter order"
                value={"N = " + orderOdd}
                color="blue"
                hint={orderOdd + " taps"}
              />
              <Readout
                label="Transition width"
                value={"~" + transWidth + " Hz"}
                color="amber"
                hint="Hamming rule: 3.3·fs/N"
              />
            </div>
          </Panel>

          <Panel title="Interpretation">
            <Callout
              type={expType}
              icon={
                highStill > 0 ? "⚠️" :
                overCount > 0 ? "✅" : "ℹ️"
              }
              title={expTitle}
            >
              {expBody}
            </Callout>
          </Panel>
        </div>

        <div>
          <div className={styles.sideBySide}>
            <Panel title="Raw signal (before LPF)" right="time">
              <TimePlot
                tones={tones}
                fs={fs}
                durationSec={0.03}
                rateLabel={`raw x[n]  ·  ${fs} Hz`}
                height={130}
              />
            </Panel>
            <Panel title="After LPF (filtered output)" right="time">
              <TimePlot
                tones={fTones}
                fs={fs}
                durationSec={0.03}
                rateLabel={`x_f[n] after FIR (N=${orderOdd})`}
                height={130}
              />
            </Panel>
          </div>

          <div className={styles.sideBySide}>
            <Panel title="Raw spectrum" right="freq">
              <SpectrumPlot
                tones={tones.map((t) => ({ ...t, label: t.id }))}
                maxFreq={fs / 2}
                height={155}
              />
            </Panel>
            <Panel title="Filtered spectrum + |H(f)| overlay" right="freq">
              <SpectrumPlot
                tones={fTones.map((t) => ({
                  ...t,
                  label: t.id + (t.attenuated ? " (↓)" : ""),
                  color: t.attenuated ? "#94a3b8" : t.color,
                }))}
                maxFreq={fs / 2}
                limitLine={fcClamped}
                limitLabel="f_c"
                filterH={h}
                fs={fs}
                height={155}
                legend={[
                  { color: "#2563eb", label: "Passed" },
                  { color: "#94a3b8", label: "Attenuated" },
                  { color: "#d97706", label: "Cutoff f_c" },
                ]}
              />
            </Panel>
          </div>

          <Callout type="neutral" icon="🔍">
            The thin blue curve is <b>|H(f)|</b> — the filter's magnitude response.
            Notice how the sharpness of the knee around f<sub>c</sub> grows with order N.
            Tones above f<sub>c</sub> grow dim as the filter strips them.
          </Callout>
        </div>
      </div>
    </div>
  );
}
