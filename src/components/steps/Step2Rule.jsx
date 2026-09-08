import { useContext } from "react";
import { DecimationContext } from "../../context/DecimationContext";
import Slider from "../ui/Slider";
import Panel from "../ui/Panel";
import Callout from "../ui/Callout";
import Readout from "../ui/Readout";
import SpectrumPlot from "../plot/SpectrumPlot";
import styles from "./Steps.module.css";

export default function Step2Rule() {
  const { M, setM, fs, fsNew, nyqNew, activeTones, overCount } =
    useContext(DecimationContext);
  const atRisk = activeTones.filter((tone) => tone.f > nyqNew);

  return (
    <div className={styles.stepWrap}>
      <div className={styles.stepHead}>
        <div className={styles.stepNum}>2</div>
        <div>
          <div className={styles.stepTitle}>
            Pick M and visualize the aliasing limit
          </div>
          <div className={styles.stepDesc}>
            Keep one sample and discard the next M − 1. A larger M reduces the output rate and its usable frequency range.
          </div>
        </div>
      </div>

      
      <div className={styles.grid2}>
        <div>
          <Panel title="Downsample factor M" right="↓M">
            <Slider
              id="in-m"
              label="M "
              value={M}
              min={2}
              max={8}
              step={1}
              onChange={(v) => setM(v)}
              formatter={(v) => "M = " + v}
              accent="amber"
              
            />
            <Slider
              id="in-fs-view"
              label="f<sub>s</sub> (set in Step 1)"
              value={fs}
              min={600}
              max={2000}
              step={10}
              onChange={() => {}}
              formatter={(v) => v + " Hz"}
              disabled
            />
          </Panel>

          <Panel title="What this means">
            <div className={styles.readoutGrid}>
              <Readout
                label="New rate"
                value={Math.round(fsNew) + " Hz"}
                color="blue"
           
              />
              <Readout
                label="New limit"
                value={Math.round(nyqNew) + " Hz"}
                color="red"
             
              />
              <Readout
                label="Samples kept"
                value={`1 in ${M}`}
                color="green"
                
              />
              <Readout
                label="Tones over limit"
                value={overCount + ""}
                color={overCount > 0 ? "red" : "green"}
              
              />
            </div>
          </Panel>

          <Callout
            type={overCount > 0 ? "danger" : "safe"}
            icon={overCount > 0 ? "" : ""}
            title={
              overCount > 0
                ? `${overCount} tone${overCount > 1 ? "s" : ""} ${
                    overCount > 1 ? "are" : "is"
                  } ABOVE the new limit — must be filtered first.`
                : "All tones fit within the new limit — but still learn the pattern below."
            }
          >
            {overCount > 0
              ? ``
              : ``}
          </Callout>
        </div>

        <div>
         
          <Panel title="Tone spectrum with danger zone marked">
            <SpectrumPlot
              tones={activeTones.map((t) => ({ ...t, label: t.id }))}
              maxFreq={fs / 2}
              dangerFrom={nyqNew}
              limitLine={nyqNew}
              limitLabel="new Nyquist"
              height={175}
              legend={[
                ...activeTones.map((t) => ({ color: t.color, label: `Tone ${t.id} (${Math.round(t.f)} Hz)` })),
                {
                  color: "#fecaca",
                  border: "1px solid #dc2626",
                  label: "↑ frequencies that will alias if not filtered",
                },
              ]}
            />
          </Panel>
          <Panel title="Live alias forecast">
            {atRisk.length ? (
              <div className={styles.forecastList}>
                <p>Without the LPF, these tones fold into the output band:</p>
                {atRisk.map((tone) => {
                  const folded = Math.abs(((tone.f + fsNew / 2) % fsNew) - fsNew / 2);
                  return (
                    <div className={styles.forecastRow} key={tone.id}>
                      <span style={{ color: tone.color, fontWeight: 800 }}>Tone {tone.id}: {Math.round(tone.f)} Hz</span>
                      <span>appears as</span>
                      <strong>{Math.round(folded)} Hz</strong>
                    </div>
                  );
                })}
                <p className={styles.forecastNote}>That false low-frequency content is an alias. Step 3 removes it before it can fold.</p>
              </div>
            ) : (
              <div className={styles.forecastList}>
                <p>All current tones are inside the output band: 0–{Math.round(nyqNew)} Hz.</p>
                <p className={styles.forecastNote}>Try increasing M or raising a tone frequency to create an aliasing risk.</p>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
