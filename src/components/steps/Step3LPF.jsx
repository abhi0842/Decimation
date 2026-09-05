import { useContext } from "react";
import { DecimationContext } from "../../context/DecimationContext";
import Slider from "../ui/Slider";
import Toggle from "../ui/Toggle";
import Panel from "../ui/Panel";
import Callout from "../ui/Callout";
import Readout from "../ui/Readout";
import TimePlot from "../plot/TimePlot";
import SpectrumPlot from "../plot/SpectrumPlot";
import styles from "./Steps.module.css";

function makeSamples(tonesList, fs, dur = 0.03) {
  const N = Math.max(2, Math.round(fs * dur));
  const out = new Array(N);
  for (let n = 0; n < N; n++) {
    const t = n / fs;
    let s = 0;
    tonesList.forEach((tn) => (s += tn.a * Math.sin(2 * Math.PI * tn.f * t)));
    out[n] = { n, t, y: s };
  }
  return out;
}

export default function Step3LPF() {
  const {
    fc,
    setFc,
    order,
    setOrder,
    fs,
    fcClamped,
    orderOdd,
    nyqNew,
    transWidth,
    h,
    activeTones,
    fTones,
    overCount,
    snapFcToNyquist,
    bypassLPF,
    setBypassLPF,
  } = useContext(DecimationContext);

  const highStill = fTones.filter((t) => t.f > nyqNew && t.gain >= 0.25).length;

  const expType = bypassLPF
    ? "danger"
    : highStill > 0
    ? "danger"
    : overCount > 0
    ? "safe"
    : "neutral";
  const expIcon = bypassLPF
    ? "⛔"
    : highStill > 0
    ? "⚠️"
    : overCount > 0
    ? "✅"
    : "ℹ️";
  const expTitle = bypassLPF
    ? "Filter BYPASSED — on the next page every high tone aliases."
    : highStill > 0
    ? `${highStill} high tone${highStill > 1 ? "s" : ""} still leaking through.`
    : overCount > 0
    ? `Content above new Nyquist (${Math.round(nyqNew)} Hz) is gone — ready to decimate.`
    : "Filter applied. Raise a tone above the limit or use a preset to see it at work.";
  const expBody = bypassLPF
    ? `This is the WRONG order on purpose, so you can compare the output next. Toggle it back off to use the real filter.`
    : highStill > 0
    ? `Increase the <b>filter order</b> (sharper knee) or lower <b>f<sub>c</sub></b>.`
    : overCount > 0
    ? `Those high tones are gone. Proceed — decimation is now safe.`
    : `Try a preset with multiple tones; it's visually clearer what the filter cuts.`;

  return (
    <div className={styles.stepWrap}>
      <div className={styles.stepHead}>
        <div className={styles.stepNum}>3</div>
        <div>
          <div className={styles.stepTitle}>Design the low-pass filter (the guard dog)</div>
          <div className={styles.stepDesc}>
            This is the FIR filter that eats high frequencies before decimation.
            f<sub>c</sub> = &quot;everything above me goes away.&quot; Order = how sharply it
            cuts. Toggle the bypass to understand the danger of skipping this step.
          </div>
        </div>
      </div>

      <div className={styles.pipeline}>
        <div className={`${styles.pipeBlock} ${styles.active}`}>
          <div className={styles.label}>Raw</div>x[n]
        </div>
        <div className={styles.pipeArrow}>→</div>
        <div
          className={`${styles.pipeBlock} ${styles.active}`}
          style={{
            borderColor: bypassLPF ? "#dc2626" : "#2563eb",
            background: bypassLPF ? "#fef2f2" : "#dbeafe",
          }}
        >
          <div className={styles.label}>{bypassLPF ? "BYPASSED ❌" : "FIR LPF"}</div>
          {bypassLPF ? "no filter" : `N=${orderOdd}, f<sub>c</sub>=${Math.round(fcClamped)}Hz`}
        </div>
        <div className={styles.pipeArrow}>→</div>
        <div className={`${styles.pipeBlock} ${styles.active}`}>
          <div className={styles.label}>Filtered</div>x<sub>f</sub>[n]
        </div>
      </div>

      <div className={styles.grid2}>
        <div>
          <Panel title="Filter controls" right={bypassLPF ? "BYPASSED" : "ACTIVE"}>
            <Toggle
              label="Bypass the filter (show WRONG order)"
              subLabel="Flip this to see aliasing in the final step"
              checked={bypassLPF}
              onChange={setBypassLPF}
            />
            <div style={{ height: bypassLPF ? 0 : 0 }} />
            {!bypassLPF && (
              <>
                <Slider
                  id="in-fc"
                  label="Cutoff f<sub>c</sub>"
                  value={fc}
                  min={20}
                  max={fs / 2 - 5}
                  step={5}
                  onChange={(v) => setFc(v)}
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
                  onChange={(v) => setOrder(v)}
                  formatter={(v) => "N = " + (v | 1)}
                />
                <button className={styles.btnRec} onClick={snapFcToNyquist}>
                  🎯 Set f<sub>c</sub> = new Nyquist (recommended start)
                </button>
              </>
            )}

            <div className={styles.readoutGrid}>
              <Readout
                label="New Nyquist"
                value={Math.round(nyqNew) + " Hz"}
                color="red"
                hint="ideal hard ceiling"
              />
              <Readout
                label="Current f<sub>c</sub>"
                value={bypassLPF ? "∞ Hz" : Math.round(fcClamped) + " Hz"}
                color="green"
                hint={
                  bypassLPF
                    ? "filter is off"
                    : fcClamped > nyqNew
                    ? "above limit ⚠"
                    : "safe ✓"
                }
              />
              <Readout
                label="Order N"
                value={"N = " + orderOdd}
                color="blue"
                hint={`${orderOdd} coefficients`}
              />
              <Readout
                label="Transition"
                value={bypassLPF ? "—" : "~" + transWidth + " Hz"}
                color="amber"
                hint={bypassLPF ? "" : "3.3·fs/N Hamming rule"}
              />
            </div>
          </Panel>

          <Callout type={expType} icon={expIcon} title={expTitle}>
            {expBody}
          </Callout>

          {bypassLPF ? (
            <div className={styles.bypassBanner}>
              <b>Teaching mode ON:</b> everything on the <i>right</i> of this page now looks
              unchanged — because the filter is doing nothing. The next step will reveal
              the damage.
            </div>
          ) : (
            <div className={styles.passBanner}>
              <b>Intuition tip:</b> low order → soft, gradual slope (leaks high tones).
              High order → abrupt, sharp slope (strips them fast). You trade computation
              for steepness.
            </div>
          )}
        </div>

        <div>
          <div className={styles.sideBySide}>
            <Panel title="Before filter" right="time">
              <TimePlot
                tones={activeTones}
                samples={makeSamples(activeTones, fs)}
                fs={fs}
                durationSec={0.03}
                rateLabel={`x[n] raw`}
                height={135}
              />
            </Panel>
            <Panel title="After filter" right={bypassLPF ? "NO CHANGE ⚠" : "time"}>
              <TimePlot
                tones={fTones}
                samples={makeSamples(fTones, fs)}
                fs={fs}
                durationSec={0.03}
                rateLabel={bypassLPF ? "filter bypassed" : `x_f[n]`}
                height={135}
              />
            </Panel>
          </div>
          <div className={styles.sideBySide}>
            <Panel title="Raw spectrum" right="freq">
              <SpectrumPlot
                tones={activeTones.map((t) => ({ ...t, label: t.id }))}
                maxFreq={fs / 2}
                height={155}
              />
            </Panel>
            <Panel
              title="Filtered spectrum + |H(f)|"
              right={bypassLPF ? "flattened" : "freq"}
            >
              <SpectrumPlot
                tones={fTones.map((t) => ({
                  ...t,
                  label: t.id + (t.attenuated ? " ↓" : ""),
                  color: t.attenuated ? "#94a3b8" : t.color,
                }))}
                maxFreq={fs / 2}
                limitLine={fcClamped}
                limitLabel={bypassLPF ? "" : "f_c"}
                filterH={bypassLPF ? null : h}
                fs={fs}
                height={155}
                legend={bypassLPF
                  ? [{ color: "#dc2626", label: "filter OFF — all tones pass" }]
                  : [
                      { color: "#2563eb", label: "pass band" },
                      { color: "#94a3b8", label: "attenuated" },
                      { color: "#d97706", label: "cutoff f_c" },
                    ]}
              />
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}
