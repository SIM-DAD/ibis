import { loadFont } from '@remotion/google-fonts/PlusJakartaSans';

const { fontFamily } = loadFont();
export const FONT = fontFamily;

// Brand tokens — mirrored from index.html CSS variables
export const C = {
  bg:       '#FFFFFF',
  surface:  '#F7F7F8',
  text:     '#0F0F0F',
  red:      '#2D6A8F', // renamed to accent blue; key kept for compat
  redDark:  '#1A5070',
  accent:   '#2D6A8F',
  accentL:  '#E6F1F8',
  navy:     '#1A3A50',
  white:    '#ffffff',
  border:   '#E4E4E7',
  muted:    '#6B7280',
  darkBg:   '#111111',
  green:    '#28c840',
} as const;

export const FPS = 30;
export const TOTAL_FRAMES = 450; // 15s — IbisDemo homepage loop

// ── IbisDemo sequence (15s homepage loop) ────────────────────────────────────
export const SEQ = {
  intro:      { from: 0,   duration: 60  }, // 0–2 s
  desktop:    { from: 60,  duration: 330 }, // 2–13 s
  endCard:    { from: 390, duration: 60  }, // 13–15 s
} as const;

// ── IbisPitchV2 sequence (70s = 2100 frames) ─────────────────────────────────
// Scene           From    Duration   Seconds
// ────────────────────────────────────────────
// ProblemFrame       0       210        7s
// Intro            210        90        3s
// SetupScene       300       330       11s  real app screenshot
// WorkflowShowcase 630       510       17s  watch folder → transcript
// OutputScene     1140       270        9s  real transcript content
// Differentiators 1410       270        9s
// PricingScene    1680       180        6s
// EndCard         1860       240        8s
export const P = {
  problem:   { from: 0,    duration: 210 },
  intro:     { from: 210,  duration: 90  },
  setup:     { from: 300,  duration: 330 },
  workflow:  { from: 630,  duration: 510 },
  output:    { from: 1140, duration: 270 },
  diff:      { from: 1410, duration: 270 },
  pricing:   { from: 1680, duration: 180 },
  endCard:   { from: 1860, duration: 240 },
} as const;
export const PITCH_V2_TOTAL = 2100; // 70s

// ── Within DesktopScene (IbisDemo only — frame = local 0-based) ──────────────
export const D = {
  bgFadeIn:       [0,   15],   // desktop bg appears
  windowAppear:   [15,  40],   // explorer window scales in
  fileDropStart:  60,          // interview.mp3 starts falling
  fileDropLand:   100,         // file settled
  folderSwitch:   180,         // explorer switches to Transcripts folder
  txtFileDrop:    210,         // .txt file slides in
  previewIn:      270,         // transcript preview text fades in
  holdEnd:        330,         // scene ends
} as const;
