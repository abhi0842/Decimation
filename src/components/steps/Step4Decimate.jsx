import { useContext, useEffect, useRef } from "react";
import { DecimationContext } from "../../context/DecimationContext";
import Panel from "../ui/Panel";
import Callout from "../ui/Callout";
import Formula from "../ui/Formula";
import Readout from "../ui/Readout";
import TimePlot from "../plot/TimePlot";
import SpectrumPlot from "../plot/SpectrumPlot";
import styles from "./Steps.module.css";

export default function Step4Decimate() {
  const {
    fs, M, fsNew, nyqNew, fcClamped, orderOdd, fTones,
    survivingTones, outTones, toneResults, overCount, hasLeakage,
    decimAnimProgress, setDecimAnimProgress, markAction,
  } = useContext(DecimationContext);

  const rafRef = useRef(null);
  const playAnim = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setDecimAnimProgress(0);
    const start = performance.now();
    const duration = 1800;
    const frame = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDecimAnimProgress(eased);
      if (t < 1) rafRef.current = requestAnimationFrame(frame);
      else {
        setDecimAnimProgress(1);
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(frame);
    markAction("SEE_DECI");
  };

  useEffect(() => {
    playAnim();
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const displayTones = fTones.map((t) => ({
    // `a` is already the post-filter amplitude in fTones.
    f: t.f, a: t.a, color: t.color, id: t.id,
  }));
  const plotTones = displayTones.length ? displayTones : outTones;

  return (
    <div className={styles.stepWrap}>
      <div className={styles.stepHead}>
        <div className={styles.stepNum}>4</div>
        <div>
          <div className={styles.stepTitle}>Decimate the filtered signal</div>
          <div className={styles.stepDesc}>
            Watch the samples: green points become the output sequence y[n]; red points are discarded. The output has the same duration, but only one out of every {M} input samples.
          </div>
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

      <Formula title="Mathematics of ↓M (Decimation)">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14.5, lineHeight: 1.5 }}>
          <div><span className="eq" style={{ fontSize: 18, fontWeight: 800 }}>
            y[n] = x<sub>f</sub>[n · M],&nbsp;&nbsp;&nbsp;&nbsp;n ∈ ℤ
          </span></div>
          <div style={{ paddingLeft: 4, borderLeft: '3px solid #cbd5e1', paddingTop: 4, paddingBottom: 4 }}>
            <div>
              <b>Input:</b> x<sub>f</sub>[n] — filtered signal at original rate <b>f<sub>s</sub> = {fs} Hz</b>
            </div>
            <div>
              <b>Downsample factor:</b> keep <b>1 sample out of every M</b> → discard M−1 in between
            </div>
            <div>
              <b>Output sample rate:</b> <span style={{ color: '#16a34a', fontWeight: 700 }}>f<sub>s</sub>′ = f<sub>s</sub> / M = {Math.round(fsNew)} Hz</span>
            </div>
            <div>
              <b>New Nyquist limit (half of f<sub>s</sub>′):</b> <span style={{ color: '#dc2626', fontWeight: 700 }}>f<sub>N</sub>′ = f<sub>s</sub>′ / 2 = {Math.round(nyqNew)} Hz</span>
            </div>
            <div style={{ marginTop: 6, padding: '8px 10px', background: 'linear-gradient(135deg,#eff6ff,#dbeafe)', borderRadius: 8, border: '1px solid #bfdbfe', color: '#1e3a8a' }}>
              <b>✓ Why filtering first is required:</b><br />
              Since x<sub>f</sub>[n] was bandlimited to ≤ f<sub>c</sub> ≤ f<sub>N</sub>′ by the LPF in Step 3,
              the output spectrum is a <i>stretched</i> (scaled) copy of the baseband — <b>no folding, no aliasing, no information loss</b>.
              Skip the LPF and any energy above f<sub>N</sub>′ will fold into [0, f<sub>N</sub>′] as spurious alias peaks.
            </div>
          </div>
        </div>
      </Formula>

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

      <div style={{ height: 14 }} />

      <div className={styles.sideBySide}>
        <Panel
          title="Filtered signal (input to ↓M)"
          right={fs + " Hz"}
        >
          <TimePlot
            tones={plotTones}
            fs={fs}
            durationSec={0.03}
            rateLabel={"filtered x_f[n]"}
            height={155}
          />
        </Panel>
        <Panel
          title="After decimation — green kept · red discarded"
          right={Math.round(fsNew) + " Hz"}
        >
          <TimePlot
            tones={plotTones}
            fs={fs}
            durationSec={0.03}
            rateLabel={`keep every ${M}-th → ${Math.round(fsNew)} Hz`}
            markEvery={M}
            decimateAnim
            animProgress={decimAnimProgress}
            height={155}
            showN
          />
          <div className={styles.animPanel}>
            <button className={`${styles.animBtn} ${styles.primary}`} onClick={playAnim}>
              ▶ Replay animation
            </button>
            <div className={styles.animStatus}>
              {decimAnimProgress < 1
                ? `playing ${Math.round(decimAnimProgress * 100)}%`
                : "complete ✓"}
            </div>
          </div>
          <div style={{ fontSize: 12, color: "#5a6f8f", marginTop: 8, lineHeight: 1.5 }}>
            Animation sequence: all samples appear → discarded ones (red) fade away → every M-th sample (green) glows and is relabeled as y[n].
          </div>
        </Panel>
      </div>

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

      <Callout
        type="info"
        icon="📚"
        title="Key takeaways from this lab"
      >
        ① <b>Filter first, then downsample.</b> Swapping them causes irrecoverable aliasing.<br />
        ② The new Nyquist is <b>(f<sub>s</sub>/M)/2</b>. Set f<sub>c</sub> ≤ that.<br />
        ③ Higher filter order N → sharper transition, but more computation and more delay.<br />
        ④ Decimation is lossless <i>only</i> if the signal is properly bandlimited before ↓M.
      </Callout>
    </div>
  );
}
