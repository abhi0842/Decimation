/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useRef, useState } from "react";
import { guideSteps } from "../guideSteps";
import {
  designFIR,
  filteredTones,
  foldFreq,
  synthesizeSamples,
  downsample,
  activeTones as getActiveTones,
  transitionWidth,
} from "../utils/dsp";

export const DecimationContext = createContext();

export const DecimationProvider = ({ children }) => {
  const [fs, setFs] = useState(1200);
  const [toneA, setToneA] = useState({ f: 150, a: 1.0 });
  const [toneB, setToneB] = useState({ f: 500, a: 0.7, on: true });
  const [M, setM] = useState(3);
  const [fc, setFc] = useState(200);
  const [order, setOrder] = useState(51);
  const [activeStep, setActiveStep] = useState(0);
  const [decimAnimProgress, setDecimAnimProgress] = useState(1);
  const [showAliasingDemo, setShowAliasingDemo] = useState(false);
  const [showFormula, setShowFormula] = useState(true);
  const [quizState, setQuizState] = useState({ answered: [], currentQ: 0 });

  const [guideActive, setGuideActive] = useState(false);
  const [guideStepIdx, setGuideStepIdx] = useState(0);
  const [actions, setActions] = useState({});

  const [showInstruction, setShowInstruction] = useState(false);
  const buttonRef = useRef(null);
  const instructionPanelRef = useRef(null);

  const steps = guideSteps;
  const currentGuideStep = steps[guideStepIdx];
  const canProceed = !currentGuideStep?.requiredAction || !!actions[currentGuideStep.requiredAction];

  const markAction = (action) => {
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
  };

  const goToStep = useCallback((idx) => {
    setActiveStep(Math.max(0, Math.min(3, idx)));
    setDecimAnimProgress(0);
  }, []);

  const nextStep = useCallback(() => {
    if (activeStep < 3) goToStep(activeStep + 1);
  }, [activeStep, goToStep]);

  const prevStep = useCallback(() => {
    if (activeStep > 0) goToStep(activeStep - 1);
  }, [activeStep, goToStep]);

  const resetToRecommended = useCallback(() => {
    setFs(1200);
    setToneA({ f: 150, a: 1.0 });
    setToneB({ f: 500, a: 0.7, on: true });
    setM(3);
    setOrder(51);
    const nyq = 1200 / 3 / 2;
    setFc(Math.round(nyq / 5) * 5);
  }, []);

  const snapFcToNyquist = useCallback(() => {
    const nyq = fs / M / 2;
    setFc(Math.round(nyq / 5) * 5);
  }, [fs, M]);

  const tones = getActiveTones({ toneA, toneB });
  const fsNew = fs / M;
  const nyqNew = fsNew / 2;
  const fcClamped = Math.min(fc, fs / 2 - 5);
  const orderOdd = order | 1;

  const h = designFIR(orderOdd, fcClamped, fs);
  const fTones = filteredTones(tones, h, fs);
  const transWidth = transitionWidth(orderOdd, fs);

  const rawSignal = synthesizeSamples(tones, fs, 0.03);
  const filteredSignal = synthesizeSamples(fTones, fs, 0.03);
  const decimatedSignal = downsample(filteredSignal, M);

  const survivingTones = fTones.filter((t) => t.gain > 0.15);
  const outTones = survivingTones
    .filter((t) => t.f <= nyqNew + 5)
    .map((t) => ({ f: t.f, a: t.a, color: t.color, label: t.id }));

  fTones.forEach((t) => {
    if (t.f > nyqNew && t.gain > 0.2) {
      const landed = foldFreq(t.f, fsNew);
      outTones.push({
        f: landed,
        a: t.a * t.gain,
        color: "#dc2626",
        label: t.id + " (alias)",
        glow: true,
      });
    }
  });

  const overCount = tones.filter((t) => t.f > nyqNew).length;
  const hasLeakage = fTones.some((t) => t.f > nyqNew && t.gain > 0.2);

  const toneResults = tones.map((t, i) => {
    const ft = fTones[i];
    const over = t.f > nyqNew;
    const gainPct = Math.round(ft.gain * 100);
    return {
      id: t.id,
      color: t.color,
      origF: t.f,
      gainPct,
      afterLpf:
        ft.gain < 0.15
          ? { status: "removed", text: "removed" }
          : { status: "passed", text: `${Math.round(t.f)} Hz (×${ft.gain.toFixed(2)})` },
      afterDec:
        ft.gain < 0.15
          ? { status: "gone", text: "gone" }
          : over
          ? { status: "alias", text: `${Math.round(foldFreq(t.f, fsNew))} Hz ALIAS`, f: foldFreq(t.f, fsNew) }
          : { status: "ok", text: `${Math.round(t.f)} Hz`, f: t.f },
    };
  });

  return (
    <DecimationContext.Provider
      value={{
        fs,
        setFs,
        toneA,
        setToneA,
        toneB,
        setToneB,
        M,
        setM,
        fc,
        setFc,
        order,
        setOrder,
        orderOdd,
        fcClamped,
        tones,
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
        overCount,
        hasLeakage,
        toneResults,

        activeStep,
        setActiveStep: goToStep,
        nextStep,
        prevStep,
        resetToRecommended,
        snapFcToNyquist,

        decimAnimProgress,
        setDecimAnimProgress,

        showAliasingDemo,
        setShowAliasingDemo,
        showFormula,
        setShowFormula,
        quizState,
        setQuizState,

        guideActive,
        setGuideActive,
        guideStepIdx,
        setGuideStepIdx,
        actions,
        markAction,
        steps,
        currentGuideStep,
        canProceed,

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
