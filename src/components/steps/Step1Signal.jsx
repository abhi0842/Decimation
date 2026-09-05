import { useContext } from "react";
import { DecimationContext } from "../../context/DecimationContext";
import Slider from "../ui/Slider";
import Toggle from "../ui/Toggle";
import Panel from "../ui/Panel";
import Callout from "../ui/Callout";
import Formula from "../ui/Formula";
import Readout from "../ui/Readout";
import TimePlot from "../plot/TimePlot";
import SpectrumPlot from "../plot/SpectrumPlot";
import styles from "./Steps.module.css";

export default function Step1Signal() {
  const {
    fs, setFs,
    toneA, setToneA,
    toneB, setToneB,
    tones, markAction,
  } = useContext(DecimationContext);

  const maxF = fs / 2;

  return (
    <div className={styles.stepWrap}>
      <div className={styles.stepHead}>
        <div className={styles.stepNum}>1</div>
        <div>
          <div className={styles.stepTitle}>Build the raw signal x[n]</div>
          <div className={styles.stepDesc}>
            Create a discrete-time test signal with up to two sinusoidal tones.
            The lecture defaults (fs = 1200 Hz, Tone A = 150 Hz, Tone B = 500 Hz)
            are perfect for later seeing decimation in action.
          </div>
        </div>
      </div>

      <Callout
        type="info"
        icon="💡"
        title="Tip — keep Tone B at 500 Hz for now"
      >
        With M = 3 the new Nyquist becomes 200 Hz. The 500 Hz tone sits well above it,
        so it will have to be removed by the low-pass filter — otherwise it aliases!
      </Callout>

      <Formula
        title="How x[n] is built"
      >
        <span className="eq"><b>x[n]</b> = A<sub>A</sub>·sin(2π·f<sub>A</sub>·n/f<sub>s</sub>) &nbsp;+&nbsp; A<sub>B</sub>·sin(2π·f<sub>B</sub>·n/f<sub>s</sub>)</span><br />
        where <b>n ∈ ℤ</b> is the sample index and <b>t = n/f<sub>s</sub></b> is the corresponding time.
      </Formula>

      <div className={styles.grid2}>
        <div>
          <Panel
            title="Sampling rate"
            right="global"
          >
            <Slider
              id="in-fs"
              label="f<sub>s</sub>"
              value={fs}
              min={600}
              max={2000}
              step={10}
              onChange={(v) => { setFs(v); markAction("EXPLORE_SIGNAL"); }}
              formatter={(v) => v + " Hz"}
            />
            <div style={{ marginTop: 10 }}>
              <Readout
                label="Nyquist f<sub>s</sub>/2"
                value={Math.round(fs / 2) + " Hz"}
                color="gray"
                hint="max freq without aliasing at this rate"
              />
            </div>
          </Panel>

          <Panel title="Tone A" right="always on">
            <Slider
              id="in-fa"
              label="Frequency f<sub>A</sub>"
              value={toneA.f}
              min={0}
              max={maxF}
              step={5}
              onChange={(v) => { setToneA({ ...toneA, f: v }); markAction("EXPLORE_SIGNAL"); }}
              formatter={(v) => v + " Hz"}
            />
            <Slider
              id="in-aa"
              label="Amplitude A<sub>A</sub>"
              value={toneA.a}
              min={0}
              max={1.5}
              step={0.05}
              onChange={(v) => { setToneA({ ...toneA, a: v }); markAction("EXPLORE_SIGNAL"); }}
              formatter={(v) => (+v).toFixed(2)}
            />
          </Panel>

          <Panel title="Tone B" subtitle="Add a second component to see filtering">
            <Toggle
              label="Include Tone B"
              subLabel="Disable to study a pure single tone"
              checked={toneB.on}
              onChange={(v) => { setToneB({ ...toneB, on: v }); markAction("EXPLORE_SIGNAL"); }}
            />
            <div className={toneB.on ? "toneB" : ""}>
              <Slider
                id="in-fb"
                label="Frequency f<sub>B</sub>"
                value={toneB.f}
                min={0}
                max={maxF}
                step={5}
                onChange={(v) => { setToneB({ ...toneB, f: v }); markAction("EXPLORE_SIGNAL"); }}
                formatter={(v) => v + " Hz"}
                disabled={!toneB.on}
              />
              <Slider
                id="in-ab"
                label="Amplitude A<sub>B</sub>"
                value={toneB.a}
                min={0}
                max={1.5}
                step={0.05}
                onChange={(v) => { setToneB({ ...toneB, a: v }); markAction("EXPLORE_SIGNAL"); }}
                formatter={(v) => (+v).toFixed(2)}
                disabled={!toneB.on}
              />
            </div>
          </Panel>
        </div>

        <div>
          <Panel title="Raw signal — time domain x[n]">
            <TimePlot
              tones={tones}
              fs={fs}
              durationSec={0.03}
              rateLabel={`sampled at ${fs} Hz (N = ${Math.round(fs * 0.03)} samples)`}
              height={165}
            />
          </Panel>
          <Panel title="Raw spectrum (0 → f<sub>s</sub>/2)">
            <SpectrumPlot
              tones={tones.map(t => ({ ...t, label: t.id }))}
              maxFreq={fs / 2}
              height={165}
              legend={[
                { color: "#2563eb", label: "Tone A" },
                ...(toneB.on ? [{ color: "#0284c7", label: "Tone B" }] : []),
              ]}
            />
            <Callout type="neutral" icon="📏">
              Each tone in the <b>time domain</b> becomes a sharp vertical line in the <b>frequency domain</b>.
              This is the core intuition behind the Fourier transform.
            </Callout>
          </Panel>
        </div>
      </div>
    </div>
  );
}
