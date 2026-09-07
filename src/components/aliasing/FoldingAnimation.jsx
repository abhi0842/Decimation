import { useEffect, useRef, useState } from "react";
import styles from "./Alias.module.css";

export default function FoldingAnimation({ tones, fs, nyqNew }) {
  const cvRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const start = performance.now();
    const dur = 2400;
    const frame = (now) => {
      const t = Math.min(1, (now - start) / dur);
      // loop: unfold - pause - fold - pause
      const loopt = (t * 0.85) % 1;
      const foldT = 1 - Math.cos(loopt * Math.PI); // 0 → 1 → 0
      setProgress(foldT);
      rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
  }, [tones, fs, nyqNew]);

  useEffect(() => {
    const cv = cvRef.current;
    if (!cv) return;
    const w = cv.getBoundingClientRect().width;
    const H = 240;
    const dpr = window.devicePixelRatio || 1;
    cv.width = w * dpr;
    cv.height = H * dpr;
    cv.style.height = H + 'px';
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, H);

    const padL = 48, padR = 16, padT = 46, padB = 32;
    const plotW = w - padL - padR;
    const plotH = H - padT - padB;
    const maxF = fs / 2;

    // Background
    ctx.fillStyle = '#f8faff';
    ctx.fillRect(0, 0, w, H);

    // Axis
    ctx.strokeStyle = '#93b4e8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL, padT + plotH);
    ctx.lineTo(w - padR, padT + plotH);
    ctx.stroke();

    // Ticks
    ctx.fillStyle = '#5a6f8f';
    ctx.font = '10px JetBrains Mono, monospace';
    const nTicks = 5;
    for (let i = 0; i <= nTicks; i++) {
      const f = (maxF / nTicks) * i;
      const x = padL + (f / maxF) * plotW;
      ctx.strokeStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, padT + plotH);
      ctx.stroke();
      ctx.textAlign = i === nTicks ? 'right' : 'center';
      ctx.fillText(Math.round(f), x, padT + plotH + 14);
    }
    ctx.textAlign = 'center';
    ctx.fillStyle = '#5a6f8f';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText('frequency (Hz)', w / 2, H - 4);

    // Nyquist marker (pivot of folding)
    const nyqX = padL + (nyqNew / maxF) * plotW;
    ctx.save();
    const nyqAlpha = 0.55 + 0.25 * Math.sin(progress * Math.PI);
    ctx.globalAlpha = nyqAlpha;
    ctx.strokeStyle = '#dc2626';
    ctx.setLineDash([6, 3]);
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(nyqX, padT);
    ctx.lineTo(nyqX, padT + plotH);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#dc2626';
    ctx.font = 'bold 10.5px JetBrains Mono, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('new Nyquist', Math.min(nyqX + 6, w - 90), padT + 14);
    ctx.fillText('= ' + Math.round(nyqNew) + ' Hz (fold pivot)', Math.min(nyqX + 6, w - 90), padT + 26);
    ctx.restore();

    // Aliasing zone gradient
    if (nyqNew < maxF * 0.98) {
      const g = ctx.createLinearGradient(nyqX, 0, w, 0);
      g.addColorStop(0, 'rgba(220,38,38,0.04)');
      g.addColorStop(1, 'rgba(220,38,38,0.18)');
      ctx.fillStyle = g;
      ctx.fillRect(nyqX, padT, w - padR - nyqX, plotH);
    }

    // Draw folding "mirror" line: reflects (nyqNew → 0 axis)
    const pivotX = nyqX;
    if (progress > 0.08) {
      ctx.strokeStyle = 'rgba(37,99,235,0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      for (let f = nyqNew + 10; f < maxF; f += 15) {
        const origX = padL + (f / maxF) * plotW;
        const foldedF = 2 * nyqNew - f; // first fold; if <0 it goes back up -> skip
        if (foldedF < 0) continue;
        const foldX = padL + (foldedF / maxF) * plotW;
        const alpha = Math.min(1, progress * 1.6) * (0.2 + 0.6 * (1 - (f - nyqNew) / (maxF - nyqNew)));
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.moveTo(origX, padT + plotH);
        const cpX = pivotX;
        const cpY = padT + plotH - plotH * 0.55 * Math.min(1, progress * 1.8);
        ctx.quadraticCurveTo(cpX, cpY, foldX, padT + plotH);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.setLineDash([]);
    }

    // Draw each tone at both positions (original + folded when progress high)
    const maxA = Math.max(...tones.map((t) => t.a), 1);
    tones.forEach((t) => {
      if (t.f > maxF) return;
      const origX = padL + (t.f / maxF) * plotW;
      const inBand = t.f <= nyqNew + 0.01;
      const ampN = Math.max(t.a / maxA, 0.08);
      const y1 = padT + plotH - ampN * (plotH - 16);
      // Original tone
      const origAlpha = inBand ? 1 : Math.max(0.15, 1 - progress * 0.75);
      ctx.globalAlpha = origAlpha;
      ctx.strokeStyle = t.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(origX, padT + plotH);
      ctx.lineTo(origX, y1);
      ctx.stroke();
      ctx.fillStyle = t.color;
      ctx.beginPath();
      ctx.arc(origX, y1, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = t.color;
      ctx.font = 'bold 10px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      const labelY = y1 - 12 < padT + 10 ? y1 + 20 : y1 - 12;
      if (origAlpha > 0.35) ctx.fillText(t.id + ':' + Math.round(t.f), origX, labelY);

      // Aliased (folded) version — only if it's above the limit
      if (!inBand) {
        const foldedF = (() => {
          let fm = t.f % (2 * nyqNew);
          if (fm > nyqNew) fm = 2 * nyqNew - fm;
          return fm;
        })();
        const foldX = padL + (foldedF / maxF) * plotW;
        const show = Math.max(0, Math.min(1, (progress - 0.2) / 0.6));
        if (show > 0.02) {
          const col = '#dc2626';
          ctx.globalAlpha = show * 0.95;
          ctx.strokeStyle = col;
          ctx.lineWidth = 3;
          if (show > 0.4) {
            // glow
            ctx.save();
            ctx.shadowColor = col;
            ctx.shadowBlur = 14 * show;
          }
          ctx.beginPath();
          ctx.moveTo(foldX, padT + plotH);
          ctx.lineTo(foldX, y1);
          ctx.stroke();
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(foldX, y1, 5, 0, Math.PI * 2);
          ctx.fill();
          if (show > 0.4) ctx.restore();
          ctx.fillStyle = col;
          ctx.font = 'bold 10px JetBrains Mono, monospace';
          ctx.textAlign = 'center';
          ctx.fillText(t.id + ' alias→' + Math.round(foldedF), foldX, y1 - 12 < padT + 10 ? y1 + 20 : y1 - 12);
        }
      }
      ctx.globalAlpha = 1;
    });

    // Top annotation
    ctx.fillStyle = '#1a2b4a';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'left';
    const label =
      progress < 0.2 ? 'Step 1: frequencies above the limit are drawn' :
      progress < 0.6 ? 'Step 2: they MIRROR around the new Nyquist' :
      'Step 3: and land as aliases in the low band';
    ctx.fillText(label, padL, 20);
    ctx.strokeStyle = progress < 0.2 ? '#2563eb' : progress < 0.6 ? '#d97706' : '#dc2626';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padL, 24);
    ctx.lineTo(padL + 420 * progress, 24);
    ctx.stroke();
    ctx.textAlign = 'start';
  });

  return (
    <div className={styles.foldWrap}>
      <canvas ref={cvRef} style={{ width: '100%' }} />
      <div className={styles.foldCaption}>
        <b>Watch it fold:</b> the animated dashed red line is the folding pivot at the
        <b> new Nyquist</b>. Every tone above it mirrors across it into the low band — that mirror image is
        what we call an <b>alias</b>. When you filter first, those high tones never exist, so they can&apos;t fold.
      </div>
    </div>
  );
}
