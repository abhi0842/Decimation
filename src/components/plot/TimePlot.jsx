import { useEffect, useRef, useState } from "react";
import styles from "./plot.module.css";

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

export default function TimePlot({
  tones,
  samples,
  fs,
  durationSec = 0.03,
  rateLabel,
  markEvery,
  markColor,
  decimateAnim,
  animProgress = 1,
  height = 160,
  showN = false,
  title,
}) {
  const canvasRef = useRef(null);
  const metaRef = useRef(null);
  const [hover, setHover] = useState(null);

  const render = () => {
    const cv = canvasRef.current;
    if (!cv) return;
    const { ctx, w, h } = setupCanvas(cv, height);
    ctx.clearRect(0, 0, w, h);
    const padL = 40,
      padB = 28,
      padT = 18;
    const plotW = w - padL - 10;
    const plotH = h - padB - padT;
    const mid = padT + plotH / 2;
    const N = samples && samples.length ? samples.length : Math.max(2, Math.round(fs * durationSec));
    const isDecimAnim = !!decimateAnim;

    metaRef.current = {
      padL,
      padB,
      padT,
      plotW,
      plotH,
      w,
      h,
      duration: durationSec,
      tones,
      fs,
      samples,
      mid,
    };

    ctx.strokeStyle = "#e2e8f0";
    ctx.fillStyle = "#5a6f8f";
    ctx.font = '10.5px "JetBrains Mono", monospace';
    const nYTicks = 4;
    for (let i = 0; i <= nYTicks; i++) {
      const yp = padT + (plotH / nYTicks) * i;
      ctx.strokeStyle = i === nYTicks / 2 ? "#93b4e8" : "#e2e8f0";
      ctx.setLineDash(i === nYTicks / 2 ? [] : [2, 3]);
      ctx.beginPath();
      ctx.moveTo(padL, yp);
      ctx.lineTo(w - 6, yp);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    const maxSum =
      samples && samples.length
        ? Math.max(...samples.map((s) => Math.abs(s.y)), 0.001, 1)
        : Math.max(tones.reduce((s, t) => s + t.a, 0), 0.001, 1);
    const scale = (plotH / 2 - 10) / maxSum;

    ctx.save();
    ctx.beginPath();
    ctx.rect(padL, padT, w - 10 - padL, h - padB - padT);
    ctx.clip();

    ctx.strokeStyle = isDecimAnim ? "rgba(37,99,235,0.12)" : "rgba(37,99,235,0.22)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    const denseN = 360;
    for (let i = 0; i <= denseN; i++) {
      const t = (i / denseN) * durationSec;
      let s;
      if (samples && samples.length) {
        const idx = Math.min(samples.length - 1, Math.floor((i / denseN) * (samples.length - 1)));
        s = samples[idx].y;
      } else {
        s = 0;
        tones.forEach((tn) => {
          s += tn.a * Math.sin(2 * Math.PI * tn.f * t);
        });
      }
      const x = padL + (i / denseN) * plotW;
      const y = mid - s * scale;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    const progress = isDecimAnim ? animProgress : 1;
    const redAlpha = isDecimAnim
      ? Math.max(0, Math.min(1, 1 - Math.max(0, (progress - 0.25) / 0.55)))
      : 1;

    for (let n = 0; n < N; n++) {
      const x = padL + (n / (N - 1)) * plotW;
      let s;
      if (samples && samples[n]) {
        s = samples[n].y;
      } else {
        s = 0;
        const t = n / fs;
        tones.forEach((tn) => {
          s += tn.a * Math.sin(2 * Math.PI * tn.f * t);
        });
      }
      const y = mid - s * scale;
      const isKept = markEvery && n % markEvery === 0;

      if (isDecimAnim) {
        if (isKept) {
          const r = 3 + progress * 1.8;
          ctx.globalAlpha = 1;
          ctx.strokeStyle = "#059669";
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.moveTo(x, mid);
          ctx.lineTo(x, y);
          ctx.stroke();
          ctx.fillStyle = "#059669";
          if (progress > 0.55) {
            ctx.save();
            ctx.shadowColor = "#059669";
            ctx.shadowBlur = 10 * (progress - 0.55) / 0.45;
          }
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
          if (progress > 0.55) ctx.restore();
          if (progress > 0.7 && showN) {
            ctx.fillStyle = "#059669";
            ctx.font = 'bold 10px "JetBrains Mono", monospace';
            ctx.textAlign = "center";
            ctx.fillText("n" + Math.floor(n / markEvery), x, Math.max(y - r - 4, padT + 10));
          }
        } else {
          if (redAlpha < 0.02) continue;
          ctx.globalAlpha = redAlpha;
          ctx.strokeStyle = "#dc2626";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(x, mid);
          ctx.lineTo(x, y);
          ctx.stroke();
          ctx.fillStyle = "#dc2626";
          ctx.beginPath();
          ctx.arc(x, y, 2.3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      } else {
        const highlighted = !!isKept;
        ctx.strokeStyle = highlighted ? markColor || "#2563eb" : "#94a3b8";
        ctx.lineWidth = highlighted ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(x, mid);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.fillStyle = highlighted ? markColor || "#2563eb" : "#64748b";
        ctx.beginPath();
        ctx.arc(x, y, highlighted ? 3.8 : 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    ctx.fillStyle = "#5a6f8f";
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.textAlign = "left";
    ctx.fillText(rateLabel || fs + " Hz", padL, 13);

    ctx.fillStyle = "#5a6f8f";
    ctx.font = "11px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      showN ? "sample index n" : "time (samples 0→" + (N - 1) + ")",
      w / 2,
      h - 4
    );

    if (isDecimAnim) {
      ctx.font = '11px "JetBrains Mono", monospace';
      const legY = h - 6;
      ctx.fillStyle = "#059669";
      ctx.beginPath();
      ctx.arc(padL + 6, legY - 4, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#0f766e";
      ctx.fillText("kept (every M-th)", padL + 14, legY);
      if (redAlpha > 0.15) {
        ctx.globalAlpha = Math.min(1, redAlpha + 0.15);
        ctx.fillStyle = "#dc2626";
        ctx.beginPath();
        ctx.arc(padL + 170, legY - 4, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#991b1b";
        ctx.fillText("discarded", padL + 178, legY);
        ctx.globalAlpha = 1;
      }
    }

    if (hover) {
      const mx = hover.x;
      if (mx >= padL && mx <= w - 6) {
        const frac = (mx - padL) / plotW;
        const nIdx = Math.round(frac * (N - 1));
        let s;
        if (samples && samples[nIdx]) s = samples[nIdx].y;
        else {
          s = 0;
          const t = nIdx / fs;
          tones.forEach((tn) => {
            s += tn.a * Math.sin(2 * Math.PI * tn.f * t);
          });
        }
        const tSec = (nIdx / (N - 1)) * durationSec;
        const label =
          "n=" + nIdx + "  ·  " + (tSec * 1000).toFixed(2) + " ms  ·  x=" + s.toFixed(3);
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
  });

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
    </div>
  );
}
