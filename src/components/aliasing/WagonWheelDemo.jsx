import { useEffect, useRef } from "react";
import styles from "./Alias.module.css";

export default function WagonWheelDemo() {
  const cvRef = useRef(null);
  const phaseRef = useRef(0);
  const rafRef = useRef(null);

  const fsLow = 10;
  const cycles = 2.4;
  const fFake = 0.9;
  const fReal = fsLow - fFake;

  const draw = () => {
    const cv = cvRef.current;
    if (!cv) return;
    const rect = cv.getBoundingClientRect();
    let w = rect.width;
    if (w < 100) w = 600;
    const H = 340;
    const dpr = window.devicePixelRatio || 1;
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(H * dpr);
    cv.style.height = H + "px";
    cv.style.minHeight = H + "px";
    const ctx = cv.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, H);

    const phase = phaseRef.current;

    const panelH = H / 2 - 6;

    // Parameters:
    //  signalFreq: the actual numeric frequency for sine math
    //  title / subTitle / footerLabel: display strings only
    //  sampleAt: if set, we also draw samples (taken from the HIGH freq sine)
    //  sampleFreq: numeric frequency for what we'll reconstruct (fFake)
    const drawPanel = ({
      y0, title, subTitle, footerLabel, signalFreq,
      sampleAt = null, col,
    }) => {
      const padL = 56, padR = 14, padT = 30, padB = 24;
      const plotW = w - padL - padR;
      const plotH = panelH - padT - padB;
      const mid = y0 + padT + plotH / 2;
      // For time axis — show same duration in BOTH panels (cycles / fFake so
      // bottom panel fits integer cycles and both panels match horizontally).
      const rangeT = cycles / fFake;

      // Panel frame
      ctx.fillStyle = '#f8faff';
      ctx.strokeStyle = '#c5d4f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.rect(2, y0 + 4, w - 4, panelH - 8);
      ctx.fill();
      ctx.stroke();

      // Labels
      ctx.fillStyle = '#1a2b4a';
      ctx.font = 'bold 13px Inter, sans-serif';
      ctx.fillText(title, 12, y0 + 22);
      ctx.fillStyle = '#5a6f8f';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillText(footerLabel, 12, y0 + panelH - 8);
      if (subTitle) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10.5px Inter, sans-serif';
        ctx.fillText(subTitle, 12, y0 + 36);
      }

      // Horizontal grid
      ctx.strokeStyle = '#e2e8f0';
      for (let i = 0; i <= 4; i++) {
        const yy = y0 + padT + (plotH / 4) * i;
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(padL, yy);
        ctx.lineTo(w - padR, yy);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.strokeStyle = '#93b4e8';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(padL, mid);
      ctx.lineTo(w - padR, mid);
      ctx.stroke();

      // X-axis time ticks
      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.lineWidth = 0.8;
      ctx.strokeStyle = '#cbd5e1';
      const xTicks = 6;
      for (let i = 0; i <= xTicks; i++) {
        const frac = i / xTicks;
        const x = padL + frac * plotW;
        const tVal = (frac * rangeT).toFixed(2);
        ctx.beginPath();
        ctx.moveTo(x, y0 + panelH - padB);
        ctx.lineTo(x, y0 + panelH - padB + 3);
        ctx.stroke();
        if (i > 0 && i < xTicks) ctx.fillText(tVal, x, y0 + panelH - 6);
      }
      ctx.fillStyle = '#5a6f8f';
      ctx.font = '10px Inter, sans-serif';
      ctx.fillText('time (s)', padL + plotW / 2, y0 + panelH - 1);

      // Continuous sine at the actual signalFreq (draws smooth curve)
      ctx.strokeStyle = sampleAt ? 'rgba(148, 163, 184, 0.45)' : col;
      ctx.lineWidth = sampleAt ? 1.5 : 2.6;
      ctx.beginPath();
      const steps = 480;
      for (let i = 0; i <= steps; i++) {
        const frac = i / steps;
        const t = frac * rangeT;
        const s = Math.sin(2 * Math.PI * signalFreq * t + phase);
        const x = padL + frac * plotW;
        const y = mid - s * (plotH / 2 - 8);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // If sampling: take samples from the HIGH freq and draw them +
      // connecting line (the staircase is the reconstruction, which visually
      // matches the LOW freq fFake because of aliasing).
      if (sampleAt) {
        const sampCount = Math.round(fsLow * rangeT);
        const sampY = new Array(sampCount);
        const sampX = new Array(sampCount);
        for (let k = 0; k < sampCount; k++) {
          const t = k / sampleAt;
          // Important: samples come from the HIGH frequency (fReal).
          // But when connected/visualized, they look like fFake.
          const s = Math.sin(2 * Math.PI * fReal * t + phase);
          sampY[k] = s;
          sampX[k] = padL + ((t / rangeT)) * plotW;
        }
        // Connecting line (reconstructed)
        ctx.strokeStyle = col;
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        sampY.forEach((v, k) => {
          const x = sampX[k];
          const y = mid - v * (plotH / 2 - 8);
          if (k === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
        sampY.forEach((v, k) => {
          const x = sampX[k];
          const y = mid - v * (plotH / 2 - 8);
          // Stem
          ctx.strokeStyle = col;
          ctx.globalAlpha = 0.35;
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.moveTo(x, mid);
          ctx.lineTo(x, y);
          ctx.stroke();
          ctx.globalAlpha = 1;
          // Circle
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(x, y, 4.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.6;
          ctx.stroke();
        });
      }
    };

    // Panel 1: smooth high-frequency sine at rate >> fsLow
    drawPanel({
      y0: 0,
      title: 'High-frequency sine (smooth, high rate)',
      subTitle: 'True signal: f = ' + fReal.toFixed(1) + ' Hz',
      footerLabel: 'underlying continuous waveform',
      signalFreq: fReal,
      col: '#dc2626',
    });

    // Panel 2: the exact SAME sine, now sampled at fsLow — because of
    // aliasing, the samples match fFake = fsLow - fReal.
    drawPanel({
      y0: panelH + 12,
      title: 'After sampling ↓M at rate ' + fsLow + ' Hz',
      subTitle: 'Reconstructed from samples: looks like f = ' + fFake.toFixed(1) + ' Hz  (≠ true freq!)',
      footerLabel: 'samples ≡ those of a LOW-frequency sine — this IS aliasing',
      signalFreq: fFake, // visual only — samples are still taken from fReal inside above code via fReal
      sampleAt: fsLow,
      col: '#2563eb',
    });

    // Arrow between panels
    const ay = panelH;
    ctx.fillStyle = '#d97706';
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2;
    const ax = w - 26;
    ctx.beginPath();
    ctx.moveTo(ax, ay - 4);
    ctx.lineTo(ax, ay + 18);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ax - 6, ay + 9);
    ctx.lineTo(ax, ay + 18);
    ctx.lineTo(ax + 6, ay + 9);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#92400e';
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('↓M sample', ax - 10, ay + 11);
    ctx.textAlign = 'start';
  };

  useEffect(() => {
    let mounted = true;
    const raf = () => {
      if (!mounted) return;
      phaseRef.current += 0.042;
      draw();
      rafRef.current = requestAnimationFrame(raf);
    };
    draw();
    setTimeout(() => draw(), 0);
    setTimeout(() => draw(), 50);
    rafRef.current = requestAnimationFrame(raf);
    const onResize = () => draw();
    window.addEventListener('resize', onResize);
    return () => {
      mounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div className={styles.wagWrap}>
      <canvas ref={cvRef} style={{ width: '100%', display: 'block' }} />
      <div className={styles.wagCaption}>
        <b>Why this happens:</b> the red {fReal.toFixed(1)} Hz sine (top) and a {fFake.toFixed(1)} Hz sine (bottom)
        produce <i>exactly the same set of samples</i> when you sample at {fsLow} Hz.
        Once sampled, they are indistinguishable — this is <b>aliasing</b>.<br />
        <b>The fix:</b> <u>low-pass filter the signal to f<sub>N</sub>′ before</u> downsampling.
      </div>
    </div>
  );
}
