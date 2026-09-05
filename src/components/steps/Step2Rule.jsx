import { useContext } from "react";
import { DecimationContext } from "../../context/DecimationContext";
import Slider from "../ui/Slider";
import Panel from "../ui/Panel";
import Callout from "../ui/Callout";
import Formula from "../ui/Formula";
import Readout from "../ui/Readout";
import SpectrumPlot from "../plot/SpectrumPlot";
import styles from "./Steps.module.css";

export default function Step2Rule() {
  const {
    M, setM, fs, fsNew, nyqNew, tones, overCount, markAction,
  } = useContext(DecimationContext);

  const msgType = overCount > 0 ? "danger" : "safe";
  const msgTitle = overCount > 0
    ? `<b>${overCount} tone${overCount > 1 ? "s" : ""} above new Nyquist.</b>`
    : "<b>All tones fit in the new band.</b>";
  const msgBody = overCount > 0
    ? `The LPF on the next page must remove them before you downsample.`
    : `Still design the LPF — it is what guarantees safety for <i>any</i> signal, not just these two tones.`;

  return (
    <div className={styles.stepWrap}>
      <div className={styles.stepHead}>
        <div className={styles.stepNum}>2</div>
        <div>
          <div className={styles.stepTitle}>The rule before downsampling</div>
          <div className={styles.stepDesc}>
            Pick the integer downsampling factor <b>M</b>.
            The new sampling rate becomes <b>f<sub>s</sub>/M</b> and the new Nyquist
            limit is half of that. Everything above the new Nyquist must be removed by a filter <b>before</b> you keep every M-th sample.
          </div>
        </div>
      </div>

      <Callout
        type="neutral"
        icon="📐"
        title="Golden rule of decimation"
      >
        <b>Filter first. Downsample second.</b><br />
        Swapping the order causes <i>aliasing</i> — high frequencies fold back into the low band and are indistinguishable from the real signal.
      </Callout>

      <Formula title="Rates after ↓M">
        <span className="eq"><b>New rate:</b>&nbsp; f<sub>s</sub>' = f<sub>s</sub> / M &nbsp;=&nbsp; {fs} / {M} &nbsp;=&nbsp; <b>{Math.round(fsNew)} Hz</b></span><br />
        <span className="eq"><b>New Nyquist:</b>&nbsp; f<sub>N</sub>' = f<sub>s</sub>' / 2 &nbsp;=&nbsp; <b style={{ color: "#dc2626" }}>{Math.round(nyqNew)} Hz</b></span><br />
        Requirement for no aliasing after LPF: &nbsp; f<sub>signal</sub> ≤ <b>f<sub>N</sub>'</b>
      </Formula>

      <div className={styles.grid2}>
        <div>
          <Panel title="Downsample factor" right="↓M">
            <Slider
              id="in-m"
              label="M (integer factor)"
              value={M}
              min={2}
              max={8}
              step={1}
              onChange={(v) => { setM(v); markAction("SET_M"); }}
              formatter={(v) => "M = " + v}
              accent="amber"
              subLabel={`keeps samples 0, M, 2M, 3M, ...`}
            />
          </Panel>

          <Panel title="Computed limits">
            <div className={styles.readoutGrid}>
              <Readout
                label="New rate f<sub>s</sub>'"
                value={Math.round(fsNew) + " Hz"}
                color="blue"
                hint="every M-th sample"
              />
              <Readout
                label="New Nyquist limit"
                value={Math.round(nyqNew) + " Hz"}
                color="red"
                hint="max safe frequency after ↓M"
              />
              <Readout
                label="Compression ratio"
                value={`${M}:1`}
                color="green"
                hint={`1/${M} the samples`}
              />
              <Readout
                label="Tones over limit"
                value={overCount + ""}
                color={overCount > 0 ? "red" : "green"}
                hint="must be filtered out"
              />
            </div>
          </Panel>
        </div>

        <div>
          <Panel title="Spectrum with danger zone (must be filtered out)">
            <SpectrumPlot
              tones={tones.map(t => ({ ...t, label: t.id }))}
              maxFreq={fs / 2}
              dangerFrom={nyqNew}
              limitLine={nyqNew}
              limitLabel="new Nyquist"
              height={185}
              legend={[
                { color: "#2563eb", label: "Tone A" },
                ...(tones.length > 1 ? [{ color: "#0284c7", label: "Tone B" }] : []),
                { color: "#fecaca", border: "1px solid #dc2626", label: "↑ must be removed by LPF" },
              ]}
            />
          </Panel>

          <Callout type={msgType} icon={overCount > 0 ? "⚠️" : "✅"} title={msgTitle}>
            {msgBody}
          </Callout>

          <Panel title="What happens if you skip the LPF?" subtitle="a single click will take you there">
            <div className={styles.aliasingDemo}>
              <div className={styles.demoCol}>
                <div className={styles.demoBadge}>❌ Wrong</div>
                <div className={styles.demoTitle}>downsample → filter</div>
                <div className={styles.demoDesc}>
                  High frequencies fold into the low band
                  (they <i>alias</i>) and no later filter can undo it.
                </div>
              </div>
              <div className={styles.demoArrow}>≠</div>
              <div className={styles.demoCol}>
                <div className={`${styles.demoBadge} ${styles.good}`}>✅ Correct</div>
                <div className={styles.demoTitle}>filter → downsample</div>
                <div className={styles.demoDesc}>
                  High frequencies are <i>removed first</i>,
                  so keeping every M-th sample is safe.
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
