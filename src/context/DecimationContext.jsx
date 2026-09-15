/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useRef, useState } from "react";
import { guideSteps } from "../data/guideSteps";
import {
  designFIR,
  filteredTones,
  foldFreq,
  synthesizeSamples,
  downsample,
  signalPresets,
} from "../utils/signalProcessing";

export const DecimationContext = createContext();
const stepRequirements = ['EXPLORE_SIGNAL', 'SET_M', 'SET_LPF', 'SEE_DECI'];

function presetInitialTones(preset) {
  if (preset.four) return preset.four.map((t) => ({ ...t }));
  if (preset.extra) {
    const list = [
      { id: 'A', f: preset.tones[0].f, a: preset.tones[0].a, color: preset.tones[0].color || '#2563eb' },
      {
        id: 'B',
        f: preset.tones[1]?.bExtra?.f ?? preset.tones[1].f,
        a: preset.tones[1]?.bExtra?.a ?? preset.tones[1].a,
        color: '#0284c7',
      },
      ...preset.extra.map((t) => ({ ...t })),
    ];
    return list;
  }
  return [
    { id: 'A', f: preset.tones[0].f, a: preset.tones[0].a, color: preset.tones[0].color || '#2563eb' },
    {
      id: 'B',
      f: preset.tones[1].f,
      a: preset.tones[1].a,
      color: preset.tones[1].color || '#0284c7',
      on: preset.tones[1].on ?? true,
    },
  ];
}

export const DecimationProvider = ({ children }) => {
  const startPreset = signalPresets.find((preset) => preset.id === 'lecture') || signalPresets[0];
  const startTones = presetInitialTones(startPreset);

  const [presetId, setPresetId] = useState(startPreset.id);
  const [fs, setFs] = useState(startPreset.fs);
  const [M, setM] = useState(startPreset.M);
  const [order, setOrder] = useState(startPreset.order);
  const [fc, setFc] = useState(Math.round(startPreset.fs / startPreset.M / 2));
  const [tones, setTones] = useState(startTones);
  const [bypassLPF, setBypassLPF] = useState(false);
  const [signalGenerated, setSignalGenerated] = useState(false);

  const [activeStep, setActiveStep] = useState(0);
  const [decimAnimProgress, setDecimAnimProgress] = useState(0);

  const [guideActive, setGuideActive] = useState(false);
  const [guideStepIdx, setGuideStepIdx] = useState(0);
  const [actions, setActions] = useState({});

  const [showInstruction, setShowInstruction] = useState(false);
  const buttonRef = useRef(null);
  const instructionPanelRef = useRef(null);

  const steps = guideSteps;
  const currentGuideStep = steps[guideStepIdx];
  const canProceed = !currentGuideStep?.requiredAction || !!actions[currentGuideStep.requiredAction];
  const isStepComplete = useCallback((step) => {
    if (step === 0) return signalGenerated;
    return !!actions[stepRequirements[step]];
  }, [actions, signalGenerated]);

  const markAction = useCallback((action) => {
    setActions((prev) => {
      const next = { ...prev, [action]: true };
      if (
        currentGuideStep?.requiredAction === action &&
        !prev[action] &&
        guideStepIdx < steps.length - 1
      ) {
        setTimeout(() => {
          setGuideStepIdx((s) => Math.min(steps.length - 1, s + 1));
        }, 400);
      }
      return next;
    });
  }, [currentGuideStep, guideStepIdx, steps]);

  const applyPreset = useCallback((id) => {
    const preset = signalPresets.find((p) => p.id === id);
    if (!preset) return;
    const newTones = presetInitialTones(preset);
    setPresetId(id);
    setFs(preset.fs);
    setM(preset.M);
    setOrder(preset.order);
    const newNyq = preset.fs / preset.M / 2;
    setFc(Math.round(newNyq / 5) * 5);
    setTones(newTones);
    setSignalGenerated(false);
    markAction('EXPLORE_SIGNAL');
  }, [markAction]);

  const generateSignal = useCallback(() => {
    setSignalGenerated(true);
    markAction('EXPLORE_SIGNAL');
  }, [markAction]);

  const updateTone = (id, patch) => {
    setTones((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    markAction('EXPLORE_SIGNAL');
  };

  const addTone = () => {
    const palette = ['#2563eb', '#0284c7', '#d97706', '#dc2626', '#7c3aed', '#059669'];
    setTones((prev) => {
      if (prev.length >= 6) return prev;
      const idIdx = prev.length;
      const id = String.fromCharCode(65 + idIdx);
      const f = 100 + idIdx * 110;
      return [
        ...prev,
        {
          id,
          f: Math.min(f, fs / 2 - 10),
          a: 0.6 + 0.1 * idIdx,
          color: palette[idIdx % palette.length],
        },
      ];
    });
    markAction('EXPLORE_SIGNAL');
  };

  const removeTone = (id) => {
    setTones((prev) => prev.filter((t) => t.id !== id));
    markAction('EXPLORE_SIGNAL');
  };

  const goToStep = useCallback((idx) => {
    const nextIndex = Math.max(0, Math.min(3, idx));
    const canMoveForward = nextIndex <= activeStep || (
      nextIndex === activeStep + 1 && isStepComplete(activeStep)
    );
    if (!canMoveForward) return;
    setActiveStep(nextIndex);
    setDecimAnimProgress(0);
  }, [activeStep, isStepComplete]);

  const nextStep = useCallback(() => {
    if (activeStep < 3) goToStep(activeStep + 1);
  }, [activeStep, goToStep]);

  const prevStep = useCallback(() => {
    if (activeStep > 0) goToStep(activeStep - 1);
  }, [activeStep, goToStep]);

  const resetToRecommended = useCallback(() => {
    applyPreset('lecture');
  }, [applyPreset]);

  const snapFcToNyquist = useCallback(() => {
    const nyq = fs / M / 2;
    setFc(Math.round(nyq / 5) * 5);
    markAction('SET_LPF');
  }, [fs, M, markAction]);

  const activeTones = tones.filter((t) => t.on !== false);

  const fsNew = fs / M;
  const nyqNew = fsNew / 2;
  const fcClamped = Math.min(fc, fs / 2 - 5);
  const orderOdd = order | 1;

  const h = designFIR(orderOdd, fcClamped, fs);
  const fTones = bypassLPF
    ? activeTones.map((t) => ({ ...t, gain: 1, attenuated: false }))
    : filteredTones(activeTones, h, fs);

  const transWidth = Math.round(3.3 * fs / orderOdd);

  const rawSignal = synthesizeSamples(activeTones, fs, 0.03);
  const filteredSignal = synthesizeSamples(
    fTones.map((t) => ({ f: t.f, a: t.a, color: t.color })),
    fs,
    0.03
  );
  const decimatedSignal = downsample(filteredSignal, M);

  const survivingTones = fTones.filter((t) => t.gain > 0.015);
  const outTones = [];
  survivingTones.forEach((t) => {
    if (t.f <= nyqNew + 3) {
      // filteredTones already applies |H(f)| to `a`; do not attenuate twice.
      outTones.push({ f: t.f, a: t.a, color: t.color, label: t.id });
    } else if (t.gain > 0.05) {
      const landed = foldFreq(t.f, fsNew);
      outTones.push({
        f: landed,
        a: t.a,
        color: '#dc2626',
        label: t.id + ' alias',
        glow: true,
      });
    }
  });

  // "Bypass LPF" reference output (shows what aliasing looks like if you skip filtering)
  const bypassFilteredTones = activeTones.map((t) => ({
    ...t,
    gain: 1,
    attenuated: false,
  }));
  const bypassOutTones = [];
  bypassFilteredTones.forEach((t) => {
    if (t.f <= nyqNew + 3) {
      bypassOutTones.push({ f: t.f, a: t.a, color: t.color, label: t.id });
    } else {
      const landed = foldFreq(t.f, fsNew);
      bypassOutTones.push({
        f: landed,
        a: t.a,
        color: '#dc2626',
        label: t.id + ' alias',
        glow: true,
      });
    }
  });

  const hasLeakage = bypassLPF
    ? bypassOutTones.some((t) => t.glow)
    : fTones.some((t) => t.f > nyqNew && t.gain > 0.05);
  const overCount = activeTones.filter((t) => t.f > nyqNew).length;

  const toneResults = activeTones.map((t) => {
    const ft = fTones.find((x) => x.id === t.id) || t;
    const over = t.f > nyqNew;
    const gainPct = Math.round(ft.gain * 100);
    let afterLpf;
    if (ft.gain < 0.03) {
      afterLpf = { status: 'removed', text: 'removed' };
    } else {
      afterLpf = {
        status: 'passed',
        text: `${Math.round(t.f)} Hz (×${ft.gain.toFixed(2)})`,
      };
    }
    let afterDec;
    if (ft.gain < 0.03) {
      afterDec = { status: 'gone', text: 'gone' };
    } else if (over) {
      afterDec = {
        status: 'alias',
        text: `${Math.round(foldFreq(t.f, fsNew))} Hz ALIAS`,
        f: foldFreq(t.f, fsNew),
      };
    } else {
      afterDec = { status: 'ok', text: `${Math.round(t.f)} Hz`, f: t.f };
    }
    return {
      id: t.id,
      color: t.color,
      origF: t.f,
      gainPct,
      afterLpf,
      afterDec,
    };
  });

  return (
    <DecimationContext.Provider
      value={{
        // State
        presetId,
        applyPreset,
        signalPresets,
        currentPreset: signalPresets.find((p) => p.id === presetId) || signalPresets[0],
        fs,
        setFs: (v) => { setFs(v); markAction('EXPLORE_SIGNAL'); },
        tones,
        updateTone,
        addTone,
        removeTone,
        activeTones,
        M,
        setM: (v) => { setM(v); markAction('SET_M'); },
        fc,
        setFc: (v) => { setFc(v); markAction('SET_LPF'); },
        order,
        setOrder: (v) => { setOrder(v); markAction('SET_LPF'); },
        orderOdd,
        fcClamped,
        fTones,
        fsNew,
        nyqNew,
        transWidth,
        h,
        rawSignal,
        filteredSignal,
        decimatedSignal,
        survivingTones,
        outTones,
        bypassOutTones,
        overCount,
        hasLeakage,
        toneResults,
        bypassLPF,
        setBypassLPF,
        signalGenerated,
        generateSignal,

        // Navigation
        activeStep,
        setActiveStep: goToStep,
        nextStep,
        prevStep,
        resetToRecommended,
        snapFcToNyquist,

        // Animation
        decimAnimProgress,
        setDecimAnimProgress,

        // Misc

        // Guide
        guideActive,
        setGuideActive,
        guideStepIdx,
        setGuideStepIdx,
        actions,
        markAction,
        steps,
        currentGuideStep,
        canProceed,
        isStepComplete,
        canAdvance: isStepComplete(activeStep),

        showInstruction,
        setShowInstruction,
        buttonRef,
        instructionPanelRef,
      }}
    >
      {children}
    </DecimationContext.Provider>
  );
};
