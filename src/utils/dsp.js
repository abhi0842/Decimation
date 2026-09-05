export function designFIR(order, fc, fs) {
  const N = order | 1;
  const M = (N - 1) / 2;
  const fcNorm = fc / fs;
  const h = new Float64Array(N);
  let sum = 0;
  for (let n = 0; n < N; n++) {
    const k = n - M;
    const sinc = k === 0 ? 2 * fcNorm : Math.sin(2 * Math.PI * fcNorm * k) / (Math.PI * k);
    const w = 0.54 - 0.46 * Math.cos(2 * Math.PI * n / (N - 1));
    h[n] = sinc * w;
    sum += h[n];
  }
  for (let n = 0; n < N; n++) h[n] /= sum;
  return h;
}

export function filterGainAt(h, f, fs) {
  let re = 0, im = 0;
  for (let n = 0; n < h.length; n++) {
    const ang = (-2 * Math.PI * f / fs) * n;
    re += h[n] * Math.cos(ang);
    im += h[n] * Math.sin(ang);
  }
  return Math.sqrt(re * re + im * im);
}

export function computeFilterResponse(h, fs, maxFreq, steps = 200) {
  const response = [];
  for (let i = 0; i <= steps; i++) {
    const f = (i / steps) * maxFreq;
    response.push({ f, g: filterGainAt(h, f, fs) });
  }
  return response;
}

export function applyFIR(samples, h) {
  const N = samples.length;
  const L = h.length;
  const out = new Float64Array(N);
  const delay = (L - 1) >> 1;
  for (let i = 0; i < N; i++) {
    let acc = 0;
    for (let k = 0; k < L; k++) {
      const j = i - k + delay;
      if (j >= 0 && j < N) acc += h[k] * samples[j];
    }
    out[i] = acc;
  }
  return out;
}

export function synthesize(tones, fs, durationSec) {
  const N = Math.max(2, Math.round(fs * durationSec));
  const x = new Float64Array(N);
  for (let n = 0; n < N; n++) {
    const t = n / fs;
    let s = 0;
    tones.forEach(tn => { s += tn.a * Math.sin(2 * Math.PI * tn.f * t); });
    x[n] = s;
  }
  return x;
}

export function synthesizeSamples(tones, fs, durationSec) {
  const N = Math.max(2, Math.round(fs * durationSec));
  const samples = [];
  for (let n = 0; n < N; n++) {
    const t = n / fs;
    let s = 0;
    tones.forEach(tn => { s += tn.a * Math.sin(2 * Math.PI * tn.f * t); });
    samples.push({ n, t, y: s });
  }
  return samples;
}

export function foldFreq(f, fsNew) {
  let fm = f % fsNew;
  if (fm < 0) fm += fsNew;
  if (fm > fsNew / 2) fm = fsNew - fm;
  return fm;
}

export function filteredTones(tones, h, fs) {
  return tones.map(t => {
    const g = filterGainAt(h, t.f, fs);
    return {
      id: t.id,
      f: t.f,
      a: t.a * g,
      color: g > 0.3 ? t.color : '#94a3b8',
      gain: g,
      attenuated: g < 0.3
    };
  });
}

export function downsample(samples, M, offset = 0) {
  const out = [];
  for (let i = offset; i < samples.length; i += M) {
    out.push({ ...samples[i], n: out.length });
  }
  return out;
}

export function transitionWidth(order, fs) {
  return Math.round(3.3 * fs / order);
}

export function fmtHz(v) { return Math.round(v) + ' Hz'; }

export function activeTones(state) {
  const t = [{ id: 'A', f: state.toneA.f, a: state.toneA.a, color: '#2563eb' }];
  if (state.toneB.on) t.push({ id: 'B', f: state.toneB.f, a: state.toneB.a, color: '#0284c7' });
  return t;
}
