import { useContext } from "react";
import { DecimationContext } from "../../context/DecimationContext";
import Slider from "../ui/Slider";
import Panel from "../ui/Panel";
import Readout from "../ui/Readout";
import TimePlot from "../plot/TimePlot";
import SpectrumPlot from "../plot/SpectrumPlot";
import styles from "./Steps.module.css";

export default function Step1Signal() {
  const {
    fs,
    setFs,
    tones,
    activeTones,
    updateTone,
    addTone,
    removeTone,
    presetId,
    applyPreset,
    signalPresets,
  } = useContext(DecimationContext);

  const maxF = fs / 2;

  const legendItems = activeTones.map((t) => ({
    color: t.color,
    label: `Tone ${t.id} (${Math.round(t.f)} Hz)`,
  }));

  return (
    <div className={styles.stepWrap}>
      <div className={styles.stepHead}>
        <div className={styles.stepNum}>1</div>
        <div>
          <div className={styles.stepTitle}>Choose a signal </div>
          <div className={styles.stepDesc}>
            Start with a low tone you want to keep and a high tone that may need filtering. The spectrum on the right is the best place to see which frequencies are present.
          </div>
        </div>
      </div>

      <div className={styles.presetsRow}>
        {signalPresets.map((p) => (
          <button
            key={p.id}
            className={`${styles.preset} ${presetId === p.id ? styles.presetActive : ""}`}
            onClick={() => applyPreset(p.id)}
          >
            <div className={styles.presetName}>{p.name}</div>
            {p.id !== "custom" && (
              <div className={styles.presetStory}>{p.story}</div>
            )}
          </button>
        ))}
      </div>

      <div className={styles.grid2}>
        <div>
          <Panel title="Sampling rate" right="global">
            <Slider
              id="in-fs"
              label="f<sub>s</sub>"
              value={fs}
              min={600}
              max={2000}
              step={10}
              onChange={(v) => setFs(v)}
              formatter={(v) => v + " Hz"}
            />
            <div style={{ marginTop: 10 }}>
              <Readout
                label="Upper limit (Nyquist)"
                value={Math.round(fs / 2) + " Hz"}
                color="blue"
                hint="max frequency this sampling rate can represent"
              />
            </div>
          </Panel>

          <Panel
            title={`Tone controls (${activeTones.length} active)`}
            right={
              <button
                className={styles.addBtn}
                onClick={() => addTone()}
                disabled={tones.length >= 6}
                style={{ opacity: tones.length >= 6 ? 0.5 : 1 }}
              >
                + add tone
              </button>
            }
          >
            {tones.map((t) => (
              <div key={t.id} className={styles.toneCard}>
                <div className={styles.toneHead}>
                  <span
                    className={styles.toneChip}
                    style={{
                      background: t.color + "22",
                      color: t.color,
                      borderColor: t.color + "55",
                    }}
                  >
                    Tone {t.id}
                  </span>
                  <button
                    className={styles.toneX}
                    onClick={() => removeTone(t.id)}
                    disabled={tones.length <= 1}
                    aria-label={`Remove tone ${t.id}`}
                  >
                    ×
                  </button>
                </div>
                <Slider
                  id={"f-" + t.id}
                  label="Frequency"
                  value={t.f}
                  min={0}
                  max={maxF}
                  step={5}
                  onChange={(v) => updateTone(t.id, { f: v })}
                  formatter={(v) => v + " Hz"}
                  accent={t.id === "A" ? "" : t.id === "B" ? "toneB" : "amber"}
                />
                <Slider
                  id={"a-" + t.id}
                  label="Amplitude"
                  value={t.a}
                  min={0.1}
                  max={1.5}
                  step={0.05}
                  onChange={(v) => updateTone(t.id, { a: v })}
                  formatter={(v) => (+v).toFixed(2)}
                />
              </div>
            ))}
          </Panel>

          
        </div>

        <div>
          <Panel title="Time domain — x[n]">
            <TimePlot
              tones={activeTones}
              samples={useToneSamples(activeTones, fs)}
              fs={fs}
              durationSec={0.03}
              rateLabel={`${fs} Hz · ${activeTones.length} tone${
                activeTones.length > 1 ? "s" : ""
              }`}
              height={175}
            />
          </Panel>
          <Panel title="Frequency domain — spectrum bars">
            <SpectrumPlot
              tones={activeTones.map((t) => ({ ...t, label: t.id }))}
              maxFreq={fs / 2}
              height={195}
              legend={legendItems.length ? legendItems : undefined}
            />
           
          </Panel>
        </div>
      </div>
    </div>
  );
}

function useToneSamples(activeTones, fs) {
  const N = Math.max(2, Math.round(fs * 0.03));
  const out = new Array(N);
  for (let n = 0; n < N; n++) {
    const t = n / fs;
    let s = 0;
    activeTones.forEach((tn) => (s += tn.a * Math.sin(2 * Math.PI * tn.f * t)));
    out[n] = { n, t, y: s };
  }
  return out;
}
