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
      const loopt = (t * 0.85) % 1;
      const foldT = 1 - Math.cos(loopt * Math.PI);
      setProgress(foldT);
      rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
  }, [tones, fs, nyqNew]);

  useEffect(() => {
    const cv = cvRef.current;
    if (!cv) return;
    const rect = cv.getBoundingClientRect();
    let w = rect.width;
    if (w < 100) w = 600;
    const H = 260;
    const dpr = window.devicePixelRatio || 1;
    cv.width = w * dpr;
    cv.height = H * dpr;
    cv.style.height = H + 'px';
    cv.style.minHeight = H + 'px';
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, H);

    const padL = 52, padR = 16, padT = 46, padB = 36;
    const plotW = w - padL - padR;
    const plotH = H - padT - padB;
    const maxF = fs / 2;
    const BW = 16; // bar width for tones

    ctx.fillStyle = '#f8faff';
    ctx.strokeStyle = '#c5d4f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(0, 0, w, H);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#e2e8f0';
    const yTicks = 4;
    for (let i = 0; i <= yTicks; i++) {
      const frac = i / yTicks;
      const y = padT + plotH * (1 - frac);
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(w - padR, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    ctx.strokeStyle = '#93b4e8';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(padL, padT + plotH);
    ctx.lineTo(w - padR, padT + plotH);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '9.5px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    for (let i = 0; i <= yTicks; i++) {
      const frac = i / yTicks;
      const y = padT + plotH * (1 - frac);
      ctx.fillText(frac.toFixed(1), padL - 6, y + 3.5);
    }
    ctx.save();
    ctx.translate(14, padT + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#5a6f8f';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText('|X(f)|', 0, 0);
    ctx.restore();

    ctx.fillStyle = '#5a6f8f';
    ctx.font = '10px JetBrains Mono, monospace';
    const nTicks = 5;
    for (let i = 0; i <= nTicks; i++) {
      const f = (maxF / nTicks) * i;
      const x = padL + (f / maxF) * plotW;
      ctx.strokeStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(x, padT + plotH);
      ctx.lineTo(x, padT + plotH + 3);
      ctx.stroke();
      ctx.textAlign = i === nTicks ? 'right' : 'center';
      ctx.fillText(Math.round(f), x, padT + plotH + 16);
    }
    ctx.textAlign = 'center';
    ctx.fillStyle = '#5a6f8f';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText('frequency (Hz)', padL + plotW / 2, H - 4);

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
    ctx.fillText('folding pivot', Math.min(nyqX + 6, w - 110), padT + 14);
    ctx.fillText('new Nyquist = ' + Math.round(nyqNew) + ' Hz', Math.min(nyqX + 6, w - 130), padT + 26);
    ctx.restore();

    if (nyqNew < maxF * 0.98) {
      const g = ctx.createLinearGradient(nyqX, 0, w, 0);
      g.addColorStop(0, 'rgba(220,38,38,0.04)');
      g.addColorStop(1, 'rgba(220,38,38,0.18)');
      ctx.fillStyle = g;
      ctx.fillRect(nyqX, padT, w - padR - nyqX, plotH);
      ctx.fillStyle = 'rgba(220,38,38,0.85)';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('⇑ aliases after folding', nyqX + 6, padT + plotH - 6);
    }

    const pivotX = nyqX;
    if (progress > 0.08) {
      ctx.strokeStyle = 'rgba(37,99,235,0.35)';
      ctx.lineWidth = 1.1;
      ctx.setLineDash([3, 3]);
      for (let f = nyqNew + 10; f < maxF; f += 15) {
        const origX = padL + (f / maxF) * plotW;
        const foldedF = 2 * nyqNew - f;
        if (foldedF < 0) continue;
        const foldX = padL + (foldedF / maxF) * plotW;
        const alpha = Math.min(1, progress * 1.6) * (0.15 + 0.5 * (1 - (f - nyqNew) / (maxF - nyqNew)));
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

    const maxA = Math.max(...tones.map((t) => t.a), 1);
    tones.forEach((t) => {
      if (t.f > maxF) return;
      const origX = padL + (t.f / maxF) * plotW;
      const inBand = t.f <= nyqNew + 0.01;
      const ampN = Math.max(t.a / maxA, 0.08);
      const y1 = padT + plotH - ampN * (plotH - 20);
      const y0 = padT + plotH;
      const bw = Math.min(BW, plotW / Math.max(tones.length + 1, 4));
      const barX = origX - bw / 2;

      const origAlpha = inBand ? 1 : Math.max(0.2, 1 - progress * 0.75);
      ctx.globalAlpha = origAlpha;
      const gOrig = ctx.createLinearGradient(0, y0, 0, y1);
      gOrig.addColorStop(0, t.color + '33');
      gOrig.addColorStop(0.5, t.color + '88');
      gOrig.addColorStop(1, t.color);
      ctx.fillStyle = gOrig;
      ctx.strokeStyle = t.color;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      const r = 3;
      ctx.moveTo(barX + r, y1);
      ctx.lineTo(barX + bw - r, y1);
      ctx.quadraticCurveTo(barX + bw, y1, barX + bw, y1 + r);
      ctx.lineTo(barX + bw, y0);
      ctx.lineTo(barX, y0);
      ctx.lineTo(barX, y1 + r);
      ctx.quadraticCurveTo(barX, y1, barX + r, y1);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = t.color;
      ctx.beginPath();
      ctx.arc(origX, y1, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.fillStyle = t.color;
      ctx.font = 'bold 10px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      const labelY = y1 - 12 < padT + 10 ? y1 + 20 : y1 - 12;
      if (origAlpha > 0.4) ctx.fillText(t.id + ' ' + Math.round(t.f) + 'Hz', origX, labelY);

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
          ctx.globalAlpha = show * 0.96;
          const gFold = ctx.createLinearGradient(0, y0, 0, y1);
          gFold.addColorStop(0, col + '33');
          gFold.addColorStop(0.5, col + '99');
          gFold.addColorStop(1, col);
          ctx.fillStyle = gFold;
          ctx.strokeStyle = col;
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          const bX = foldX - bw / 2;
          ctx.moveTo(bX + r, y1);
          ctx.lineTo(bX + bw - r, y1);
          ctx.quadraticCurveTo(bX + bw, y1, bX + bw, y1 + r);
          ctx.lineTo(bX + bw, y0);
          ctx.lineTo(bX, y0);
          ctx.lineTo(bX, y1 + r);
          ctx.quadraticCurveTo(bX, y1, bX + r, y1);
          ctx.closePath();
          if (show > 0.4) {
            ctx.save();
            ctx.shadowColor = col;
            ctx.shadowBlur = 14 * show;
          }
          ctx.fill();
          ctx.stroke();
          if (show > 0.4) ctx.restore();
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(foldX, y1, 5.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.6;
          ctx.stroke();
          ctx.fillStyle = col;
          ctx.font = 'bold 10px JetBrains Mono, monospace';
          ctx.textAlign = 'center';
          const ly = y1 - 12 < padT + 10 ? y1 + 20 : y1 - 12;
          if (show > 0.3) ctx.fillText(t.id + ' alias ' + Math.round(foldedF), foldX, ly);
        }
      }
      ctx.globalAlpha = 1;
    });

    ctx.fillStyle = '#1a2b4a';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'left';
    const label =
      progress < 0.2 ? '① High frequencies are drawn above the new Nyquist' :
      progress < 0.6 ? '② They MIRROR (fold) around the new Nyquist line' :
      '③ They land as spurious alias peaks in the low band';
    ctx.fillText(label, padL, 20);
    ctx.strokeStyle = progress < 0.2 ? '#2563eb' : progress < 0.6 ? '#d97706' : '#dc2626';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(padL, 26);
    ctx.lineTo(padL + Math.min(460, plotW) * progress, 26);
    ctx.stroke();
    ctx.textAlign = 'start';
  }, [progress, tones, fs, nyqNew]);

  return (
    <div className={styles.foldWrap}>
      <canvas ref={cvRef} style={{ width: '100%', display: 'block' }} />
      <div className={styles.foldCaption}>
        <b>Watch it fold:</b> the dashed red line is the <b>new Nyquist f<sub>N</sub>′</b> — the folding pivot.
        Every frequency above it mirrors across it into the low band. That mirror image is an <b>alias</b>:
        it looks real but never existed in your signal. Filter <i>first</i> and there&apos;s nothing left to fold.
      </div>
    </div>
  );
}
