import { useEffect, useRef } from "react";
import styles from "./Alias.module.css";

export default function WagonWheelDemo() {
  const cvRef = useRef(null);
  const phaseRef = useRef(0);

  const draw = () => {
    const cv = cvRef.current;
    if (!cv) return;
    const w = cv.getBoundingClientRect().width;
    const H = 320;
    const dpr = window.devicePixelRatio || 1;
    cv.width = w * dpr;
    cv.height = H * dpr;
    cv.style.height = H + "px";
    const ctx = cv.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, H);

    const fsLow = 10; // "sample rate" of the downsampled output
    const cycles = 2.4;
    // Two frequencies that alias at this sampling rate:
    // f_real (high)  -> after sampling at rate fsLow = looks like f_fake (low)
    const fFake = 0.9;
    const fReal = fsLow - fFake; // = 9.1 Hz -> folds to 0.9 Hz
    const phase = phaseRef.current;

    const panelH = H / 2 - 6;
    const drawPanel = ({ y0, label, freq, col, sampleAt = null, sub }) => {
      const padL = 52, padR = 12, padT = 24, padB = 22;
      const plotW = w - padL - padR;
      const plotH = panelH - padT - padB;
      const mid = y0 + padT + plotH / 2;
      const rangeT = cycles / freq;

      // Panel frame
      ctx.fillStyle = '#f8faff';
      ctx.strokeStyle = '#c5d4f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.rect(0, y0 + 2, w, panelH - 4);
      ctx.fill();
      ctx.stroke();

      // Label
      ctx.fillStyle = '#ffffff';
      ctx.fillStyle = '#1a2b4a';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillText(label, 10, y0 + 18);
      ctx.fillStyle = '#5a6f8f';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillText(freq, 10, y0 + panelH - 10);
      if (sub) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px Inter, sans-serif';
        ctx.fillText(sub, 10, y0 + 32);
      }

      // Grid + zero line
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
      ctx.beginPath();
      ctx.moveTo(padL, mid);
      ctx.lineTo(w - padR, mid);
      ctx.stroke();

      // Continuous wave (underlying)
      ctx.strokeStyle = sampleAt ? 'rgba(37,99,235,0.25)' : col;
      ctx.lineWidth = sampleAt ? 1.4 : 2.2;
      ctx.beginPath();
      const steps = 500;
      for (let i = 0; i <= steps; i++) {
        const frac = i / steps;
        const t = frac * rangeT;
        const s = Math.sin(2 * Math.PI * freq * t + phase);
        const x = padL + frac * plotW;
        const y = mid - s * (plotH / 2 - 6);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Sampled points + connecting "stair" line
      if (sampleAt) {
        const sampCount = Math.round(fsLow * rangeT);
        const sampY = new Array(sampCount);
        // Sample the REAL sine only at sample times: even though freq high, sampled points match the low freq
        for (let k = 0; k < sampCount; k++) {
          const t = k / sampleAt;
          const s = Math.sin(2 * Math.PI * freq * t + phase);
          sampY[k] = s;
        }
        ctx.strokeStyle = col;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        sampY.forEach((v, k) => {
          const frac = ((k / sampleAt) / rangeT);
          const x = padL + frac * plotW;
          const y = mid - v * (plotH / 2 - 6);
          if (k === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
        sampY.forEach((v, k) => {
          const frac = ((k / sampleAt) / rangeT);
          const x = padL + frac * plotW;
          const y = mid - v * (plotH / 2 - 6);
          // stem
          ctx.strokeStyle = col;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(x, mid);
          ctx.lineTo(x, y);
          ctx.stroke();
          // dot
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(x, y, 3.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        });
      }
    };

    drawPanel({
      y0: 0,
      label: 'High-frequency sine (f = ' + fReal.toFixed(1) + ' Hz)',
      sub: '',
      freq: '',
      col: '#dc2626',
    });
    drawPanel({
      y0: panelH + 12,
      label: 'After sampling at rate ' + fsLow + ' Hz',
      sub: 'the same samples match a low-frequency (f = ' + fFake.toFixed(1) + ' Hz) — aliasing!',
      freq: 'red samples ≡ blue samples: indistinguishable',
      col: '#2563eb',
      sampleAt: fsLow,
    });

    // Arrow between panels
    const ay = panelH;
    ctx.fillStyle = '#d97706';
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2;
    const ax = w - 30;
    ctx.beginPath();
    ctx.moveTo(ax, ay - 2);
    ctx.lineTo(ax, ay + 14);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ax - 5, ay + 7);
    ctx.lineTo(ax, ay + 14);
    ctx.lineTo(ax + 5, ay + 7);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#92400e';
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('sample ↓M', ax - 10, ay + 7);
    ctx.textAlign = 'start';
  };

  useEffect(() => {
    let raf;
    const render = () => {
      phaseRef.current += 0.04;
      draw();
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className={styles.wagWrap}>
      <canvas ref={cvRef} style={{ width: '100%' }} />
      
    </div>
  );
}
