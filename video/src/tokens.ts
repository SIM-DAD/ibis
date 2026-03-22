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
export const TOTAL_FRAMES = 450; // 15 s

// Sequence timing (absolute frames)
export const SEQ = {
  intro:      { from: 0,   duration: 60  }, // 0–2 s
  desktop:    { from: 60,  duration: 330 }, // 2–13 s
  endCard:    { from: 390, duration: 60  }, // 13–15 s
} as const;

// Within DesktopScene (frame = local frame, 0-based)
export const D = {
  bgFadeIn:       [0,   15],   // desktop bg appears
  windowAppear:   [15,  40],   // explorer window scales in
  fileDropStart:  60,          // interview.mp3 starts falling
  fileDropLand:   100,         // file settled
  // 100-180: Ibis processes silently
  folderSwitch:   180,         // explorer switches to Transcripts folder
  txtFileDrop:    210,         // .txt file slides in
  previewIn:      270,         // transcript preview text fades in
  holdEnd:        330,         // scene ends
} as const;
