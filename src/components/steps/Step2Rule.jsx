import { useContext } from "react";
import { DecimationContext } from "../../context/DecimationContext";
import Slider from "../ui/Slider";
import Panel from "../ui/Panel";
import Callout from "../ui/Callout";
import Readout from "../ui/Readout";
import SpectrumPlot from "../plot/SpectrumPlot";
import FoldingAnimation from "../aliasing/FoldingAnimation";
import WagonWheelDemo from "../aliasing/WagonWheelDemo";
import styles from "./Steps.module.css";

export default function Step2Rule() {
  const { M, fs, fsNew, nyqNew, tones, activeTones, overCount, markAction } =
    useContext(DecimationContext);

  return (
    <div className={styles.stepWrap}>
      <div className={styles.stepHead}>
        <div className={styles.stepNum}>2</div>
        <div>
          <div className={styles.stepTitle}>
            Pick M and visualize the aliasing limit
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
              onChange={(v) => markAction && markAction("SET_M", v)}
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
          <Panel title="Classic 'wagon wheel' demo — aliasing in time">
            <WagonWheelDemo />
          </Panel>
        </div>
      </div>
    </div>
  );
}