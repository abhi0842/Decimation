import { useEffect, useRef, useState } from "react";
import styles from "./plot.module.css";
import { filterGainAt } from "../../utils/dsp";

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function setupCanvas(cv, baseH) {
  const h = baseH;
  const dpr = window.devicePixelRatio || 1;
  const rect = cv.getBoundingClientRect();
  cv.width = Math.max(1, Math.round(rect.width * dpr));
  cv.height = Math.round(h * dpr);
  cv.style.height = h + "px";
  const ctx = cv.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w: rect.width, h };
}

function drawFreqAxis(ctx, w, h, maxFreq, padL, padB, padT) {
  ctx.strokeStyle = "#d0dcef";
  ctx.fillStyle = "#5a6f8f";
  ctx.font = '10.5px "JetBrains Mono", monospace';
  ctx.lineWidth = 1;
  const plotW = w - padL - 10;
  const nTicks = 5;
  for (let i = 0; i <= nTicks; i++) {
    const f = (maxFreq / nTicks) * i;
    const x = padL + (f / maxFreq) * plotW;
    ctx.beginPath();
    ctx.moveTo(x, padT);
    ctx.lineTo(x, h - padB);
    ctx.stroke();
    ctx.textAlign = i === nTicks ? "right" : "center";
    ctx.fillText(Math.round(f) + "", x, h - padB + 13);
  }
  ctx.strokeStyle = "#93b4e8";
  ctx.beginPath();
  ctx.moveTo(padL, h - padB);
  ctx.lineTo(w - 6, h - padB);
  ctx.stroke();
  ctx.fillStyle = "#5a6f8f";
  ctx.font = "11px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("frequency (Hz)", w / 2, h - 1);
}

export default function SpectrumPlot({
  tones,
  maxFreq,
  dangerFrom,
  limitLine,
  limitLabel = "limit",
  filterH,
  fs,
  height = 160,
  legend,
  title,
  barWidth = 14,
}) {
  const canvasRef = useRef(null);
  const metaRef = useRef(null);
  const [hover, setHover] = useState(null);

  const render = () => {
    const cv = canvasRef.current;
    if (!cv) return;
    const { ctx, w, h } = setupCanvas(cv, height);
    ctx.clearRect(0, 0, w, h);
    const padL = 44,
      padB = 32,
      padT = 16;
    const plotW = w - padL - 10;
    const plotH = h - padB - padT;

    metaRef.current = { padL, padB, padT, plotW, plotH, w, h, maxFreq, tones };
    
    // Y-axis labels (amplitude)
    ctx.strokeStyle = "#e2e8f0";
    ctx.fillStyle = "#94a3b8";
    ctx.font = '9.5px "JetBrains Mono", monospace';
    ctx.textAlign = "right";
    const yTicks = 4;
    for (let i = 0; i <= yTicks; i++) {
      const frac = i / yTicks;
      const y = padT + plotH * (1 - frac);
      ctx.setLineDash([2, 3]);
      ctx.strokeStyle = "#e2e8f0";
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(w - 6, y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#94a3b8";
      ctx.fillText((frac).toFixed(1), padL - 6, y + 3.5);
    }
    ctx.fillStyle = "#5a6f8f";
    ctx.font = "10px Inter, sans-serif";
    ctx.save();
    ctx.translate(12, padT + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.fillText("|X(f)|", 0, 0);
    ctx.restore();

    drawFreqAxis(ctx, w, h, maxFreq, padL, padB, padT);

    if (dangerFrom !== undefined && dangerFrom < maxFreq) {
      const x0 = padL + (dangerFrom / maxFreq) * plotW;
      const grad = ctx.createLinearGradient(x0, 0, w, 0);
      grad.addColorStop(0, "rgba(220,38,38,0.02)");
      grad.addColorStop(1, "rgba(220,38,38,0.13)");
      ctx.fillStyle = grad;
      ctx.fillRect(x0, padT, w - 10 - x0, plotH);
      ctx.strokeStyle = "#fca5a5";
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(x0, padT);
      ctx.lineTo(x0, h - padB);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(220,38,38,0.85)";
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = "left";
      ctx.fillText("aliasing zone ↑", Math.min(x0 + 5, w - 80), padT + 11);
    }

    if (limitLine !== undefined) {
      const x0 = padL + (limitLine / maxFreq) * plotW;
      ctx.strokeStyle = "#d97706";
      ctx.setLineDash([6, 4]);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(x0, padT);
      ctx.lineTo(x0, h - padB);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineWidth = 1;
      ctx.fillStyle = "#d97706";
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = "left";
      ctx.fillText(limitLabel, Math.min(x0 + 5, w - 40), padT + 11);
    }

    if (filterH && fs) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(padL, padT, w - 10 - padL, h - padB - padT);
      ctx.clip();
      ctx.strokeStyle = "rgba(37,99,235,0.55)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      const steps = 200;
      for (let i = 0; i <= steps; i++) {
        const f = (i / steps) * maxFreq;
        const g = filterGainAt(filterH, f, fs);
        const x = padL + (f / maxFreq) * plotW;
        const y = h - padB - Math.min(1, g) * (plotH - 8);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.fillStyle = "rgba(37,99,235,0.08)";
      ctx.lineTo(padL + plotW, h - padB);
      ctx.lineTo(padL, h - padB);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(padL, padT, w - 10 - padL, h - padB - padT);
    ctx.clip();
    const maxAmp = Math.max(...tones.map((t) => t.a), 0.001, 1);
    tones.forEach((t) => {
      if (t.f > maxFreq || t.f == null) return;
      const xCenter = padL + (t.f / maxFreq) * plotW;
      const ampNorm = Math.max(t.a / maxAmp, 0.04);
      const y0 = h - padB;
      const y1 = y0 - ampNorm * (plotH - 20);
      const bw = Math.min(barWidth, plotW / Math.max(tones.length + 1, 4));
      const barX = xCenter - bw / 2;
      const barH = y0 - y1;

      // Bar fill - gradient from bottom
      const g = ctx.createLinearGradient(0, y0, 0, y1);
      const hex = t.color;
      g.addColorStop(0, hex + '33');
      g.addColorStop(0.5, hex + '99');
      g.addColorStop(1, hex);
      ctx.fillStyle = g;
      ctx.strokeStyle = hex;
      ctx.lineWidth = 1.5;
      roundRect(ctx, barX, y1, bw, barH, 3);
      ctx.fill();
      ctx.stroke();

      // Top marker / dot with glow
      ctx.fillStyle = hex;
      if (t.glow) {
        ctx.save();
        ctx.shadowColor = hex;
        ctx.shadowBlur = 14;
      }
      ctx.beginPath();
      ctx.arc(xCenter, y1, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.8;
      ctx.stroke();
      if (t.glow) ctx.restore();
      
      // Frequency label above bar
      ctx.fillStyle = hex;
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.textAlign = "center";
      let fLabel = Math.round(t.f) + "";
      if (t.label) fLabel = t.label;
      const ly = y1 - 18 < padT + 2 ? y1 + 22 : y1 - 14;
      ctx.fillText(fLabel, xCenter, ly);
    });
    ctx.restore();

    if (hover) {
      const mx = hover.x;
      if (mx >= padL && mx <= w - 6) {
        const frac = (mx - padL) / plotW;
        const freq = frac * maxFreq;
        let nearest = null,
          nearestDist = 14;
        (tones || []).forEach((t) => {
          if (t.f == null || t.f > maxFreq) return;
          const tx = padL + (t.f / maxFreq) * plotW;
          const d = Math.abs(tx - mx);
          if (d < nearestDist) {
            nearestDist = d;
            nearest = t;
          }
        });
        const showFreq = nearest ? nearest.f : freq;
        const label =
          Math.round(showFreq) +
          " Hz" +
          (nearest ? "  ·  " + (nearest.label || nearest.id || "") : "");
        ctx.strokeStyle = "rgba(37,99,235,0.45)";
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(mx, padT);
        ctx.lineTo(mx, h - padB);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.font = '11px "JetBrains Mono", monospace';
        const textW = ctx.measureText(label).width + 16;
        let boxX = mx - textW / 2;
        boxX = Math.max(padL, Math.min(boxX, w - 6 - textW));
        ctx.fillStyle = "rgba(26,43,74,0.92)";
        ctx.strokeStyle = "rgba(37,99,235,0.4)";
        ctx.lineWidth = 1;
        const boxY = 4;
        roundRect(ctx, boxX, boxY, textW, 20, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.fillText(label, boxX + textW / 2, boxY + 14);
      }
    }
  };

  useEffect(() => {
    render();
    const onResize = () => render();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tones, maxFreq, dangerFrom, limitLine, limitLabel, filterH, fs, height, barWidth]);

  const handleMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    setHover({ x: e.clientX - rect.left });
  };

  return (
    <div className={styles.plotWrap}>
      {title && <div className={styles.plotTitle}>{title}</div>}
      <div className={styles.cvShell}>
        <canvas
          ref={canvasRef}
          onMouseMove={handleMove}
          onMouseLeave={() => setHover(null)}
          style={{ height }}
        />
      </div>
      {legend && (
        <div className={styles.legend}>
          {legend.map((item, i) => (
            <span key={i}>
              <i
                style={{
                  background: item.color,
                  border: item.border || "none",
                }}
              />
              {item.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
