export const guideSteps = [
  {
    title: "Welcome to the Decimation Lab!",
    description:
      "This interactive lab will teach you how decimation (downsampling) works in digital signal processing. The key insight: always filter BEFORE you downsample to avoid aliasing.",
    target: null,
  },
  {
    title: "Step 1 — Build Your Signal",
    description:
      "Start by creating a test signal with two tones. The default uses 150 Hz and 500 Hz at 1200 Hz sampling rate. We'll see why both matter shortly.",
    target: "step1",
    requiredAction: "EXPLORE_SIGNAL",
  },
  {
    title: "Step 2 — Understand the Rule",
    description:
      "Choose M (downsample factor). The NEW Nyquist limit becomes (fs/M)/2. Any frequency ABOVE this limit MUST be removed by a low-pass filter — otherwise it aliases!",
    target: "step2",
    requiredAction: "SET_M",
  },
  {
    title: "Step 3 — Design the Low-Pass Filter",
    description:
      "Set the cutoff fc ≤ new Nyquist and choose the filter order (higher = sharper). Watch how the FIR filter shapes the spectrum, removing content above the cutoff.",
    target: "step3",
    requiredAction: "SET_LPF",
  },
  {
    title: "Step 4 — Decimate & Observe",
    description:
      "Now we keep every M-th sample. Green samples are kept, red ones discarded. Check the results table to confirm no aliasing occurred because the LPF did its job!",
    target: "step4",
    requiredAction: "SEE_DECI",
  },
  {
    title: "Experiment & Learn",
    description:
      "Try turning Tone B above the new Nyquist with a weak LPF (low order) to see aliasing appear in red. Then increase order or lower fc to fix it. Have fun!",
    target: null,
  },
];
