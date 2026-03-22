// Brand tokens — mirrored from index.html CSS variables
export const C = {
  bg:       '#f1f1f1',
  text:     '#262626',
  red:      '#e63946',
  redDark:  '#c1121f',
  navy:     '#2c3e50',
  white:    '#ffffff',
  border:   '#e2e2e2',
  muted:    '#777777',
  green:    '#28c840',
} as const;

export const FONT = '"Inter", "Segoe UI", sans-serif';

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
