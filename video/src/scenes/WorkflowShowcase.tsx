/**
 * WorkflowShowcase — 17 seconds (510 frames)
 *
 * The core demo of the IbisPitchV2. Shows the complete Ibis workflow
 * using real screenshots in 4 beats:
 *
 *   Beat 1  (0–90f,  3s)  — Text hook: "Drop audio. Get a transcript."
 *   Beat 2  (90–270f, 6s) — Watch folder screenshot with callouts
 *   Beat 3 (270–360f, 3s) — Processing: Ibis icon + "Transcribing locally…"
 *   Beat 4 (360–510f, 5s) — Transcripts folder screenshot with callouts
 *
 * Asset files required in video/public/:
 *   screenshot-watch-folder.png   — File Explorer on Inbox folder (audio file visible)
 *   screenshot-transcripts.png    — File Explorer on Transcripts folder (.txt visible)
 */
import React from 'react';
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { C, FONT } from '../tokens';
import { Annotation, ScreenshotFrame } from './ScreenshotFrame';

// ── Beat timing constants (local frames within WorkflowShowcase) ──────────────
const B = {
  // Beat 1 — text hook
  textFadeIn:     0,
  textHoldEnd:    70,
  textFadeOut:    80,

  // Beat 2 — watch folder screenshot
  watchIn:        90,
  watchCallout1:  130,  // "Your watch folder"
  watchCallout2:  165,  // "Any audio format"
  watchHoldEnd:   255,
  watchOut:       265,

  // Beat 3 — processing
  procIn:         270,
  procTextIn:     295,
  procOut:        350,

  // Beat 4 — transcripts folder screenshot
  transcriptIn:   360,
  transcriptCall1: 400,  // "Transcript saved automatically"
  transcriptCall2: 435,  // "Timestamped filename"
  transcriptCall3: 465,  // "Ready to open"
  transcriptOut:  495,
} as const;

// ── Beat 1 — text hook ────────────────────────────────────────────────────────

const TextHook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const line1Op = interpolate(frame, [B.textFadeIn, B.textFadeIn + 18], [0, 1], { extrapolateRight: 'clamp' });
  const line1Y  = interpolate(
    spring({ frame, fps, config: { damping: 22, stiffness: 120 } }),
    [0, 1], [16, 0],
  );
  const line2Op = interpolate(frame, [B.textFadeIn + 20, B.textFadeIn + 40], [0, 1], { extrapolateRight: 'clamp' });
  const line2Y  = interpolate(
    spring({ frame: Math.max(0, frame - 20), fps, config: { damping: 22, stiffness: 120 } }),
    [0, 1], [16, 0],
  );

  const sceneOp = interpolate(frame, [B.textHoldEnd, B.textFadeOut], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  if (frame > B.textFadeOut) return null;

  return (
    <AbsoluteFill
      style={{
        background: C.bg,
        opacity: sceneOp,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        fontFamily: FONT,
      }}
    >
      <div style={{ opacity: line1Op, transform: `translateY(${line1Y}px)`, fontSize: 54, fontWeight: 800, color: C.text, letterSpacing: '-0.03em', lineHeight: 1 }}>
        Drop audio.
      </div>
      <div style={{ opacity: line2Op, transform: `translateY(${line2Y}px)`, fontSize: 54, fontWeight: 800, color: C.accent, letterSpacing: '-0.03em', lineHeight: 1 }}>
        Get a transcript.
      </div>
    </AbsoluteFill>
  );
};

// ── Beat 3 — processing indicator ────────────────────────────────────────────

const ProcessingBeat: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const localF = frame - B.procIn;

  const sceneOp = interpolate(frame, [B.procIn, B.procIn + 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  }) * interpolate(frame, [B.procOut, B.procOut + 14], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Icon pulse
  const pulse = Math.sin(localF * 0.18) * 0.5 + 0.5;
  const iconScale = spring({ frame: localF, fps, config: { damping: 16, stiffness: 90 } });

  const textOp = interpolate(frame, [B.procTextIn, B.procTextIn + 16], [0, 1], { extrapolateRight: 'clamp' });

  // Dot animation — three dots staggered
  const dots = [0, 1, 2].map((i) => {
    const dotPulse = Math.sin((localF - i * 8) * 0.22);
    return interpolate(dotPulse, [-1, 1], [0.25, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  });

  if (frame < B.procIn || frame > B.procOut + 14) return null;

  return (
    <AbsoluteFill
      style={{
        background: C.bg,
        opacity: sceneOp,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        fontFamily: FONT,
      }}
    >
      {/* Ibis icon */}
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 16,
          background: `rgba(45,106,143,${0.85 + pulse * 0.15})`,
          transform: `scale(${iconScale * (1 + pulse * 0.04)})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 8px 28px rgba(45,106,143,${0.3 + pulse * 0.2})`,
        }}
      >
        <Img
          src={staticFile('icon.svg')}
          style={{ width: 48, height: 48 }}
        />
      </div>

      {/* "Transcribing locally…" */}
      <div style={{ opacity: textOp, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{ fontSize: 22, fontWeight: 600, color: C.text, letterSpacing: '-0.02em' }}>
          Transcribing locally
          <span style={{ display: 'inline-flex', gap: 3, marginLeft: 4, verticalAlign: 'baseline' }}>
            {dots.map((op, i) => (
              <span key={i} style={{ opacity: op, fontSize: 22, color: C.accent, fontWeight: 700 }}>.</span>
            ))}
          </span>
        </div>
        <div style={{ fontSize: 13, color: C.muted, fontWeight: 400, letterSpacing: '0.02em' }}>
          No internet connection required
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── WorkflowShowcase ──────────────────────────────────────────────────────────

// screenshot-watcher-folder.png: 1201×892 — screenshotAlign='left', labels RIGHT
// y values measured from the actual File Explorer screenshot:
//   Address bar row  ≈ 0.07   (shows "VoiceMemos > Inbox")
//   Files area mid   ≈ 0.50   (VLC-icon audio files)
const WATCH_ANNOTATIONS: Annotation[] = [
  { label: 'VoiceMemos\\Inbox — your watch folder', targetX: 0.45, targetY: 0.075, frameIn: B.watchCallout1 },
  { label: 'MP3 · WAV · M4A — any audio format',   targetX: 0.60, targetY: 0.25, frameIn: B.watchCallout2 },
];

// screenshot-transcripts.png: 787×441 — screenshotAlign='left', labels RIGHT
// y values measured from the actual Transcripts screenshot:
//   Address bar row         ≈ 0.14  (shows "VoiceMemos > Transcripts")
//   First file (top-left)   ≈ 0.47  (2026-03-25_22-24-44_AP.txt)
//   Second row of files     ≈ 0.78
const TRANSCRIPT_ANNOTATIONS: Annotation[] = [
  { label: 'VoiceMemos\\Transcripts',     targetX: 0.72, targetY: 0.145, frameIn: B.transcriptCall1 },
  { label: 'Auto-named with timestamp',   targetX: 0.965, targetY: 0.575, frameIn: B.transcriptCall2 },
  { label: 'Plain .txt — open anywhere',  targetX: 0.92, targetY: 0.965, frameIn: B.transcriptCall3 },
];

export const WorkflowShowcase: React.FC = () => {
  const frame = useCurrentFrame();

  const showWatch      = frame >= B.watchIn     && frame <= B.watchOut + 14;
  const showTranscript = frame >= B.transcriptIn && frame <= B.transcriptOut + 14;

  return (
    <AbsoluteFill style={{ background: C.bg }}>

      {/* Beat 1 — text hook */}
      <TextHook />

      {/* Beat 2 — watch folder (1201×892, left-aligned, labels right) */}
      {showWatch && (
        <ScreenshotFrame
          src="screenshot-watcher-folder.png"
          aspectRatio={1201 / 892}
          displayWidth={820}
          screenshotAlign="left"
          sceneLabel="Step 1 — Drop audio"
          caption="Ibis watches for new audio files automatically."
          annotations={WATCH_ANNOTATIONS}
          fadeInAt={B.watchIn}
          fadeOutAt={B.watchHoldEnd}
        />
      )}

      {/* Beat 3 — processing */}
      <ProcessingBeat />

      {/* Beat 4 — transcripts folder (787×441, left-aligned, labels right) */}
      {showTranscript && (
        <ScreenshotFrame
          src="screenshot-transcripts.png"
          aspectRatio={787 / 441}
          displayWidth={820}
          screenshotAlign="left"
          sceneLabel="Step 2 — Transcript ready"
          caption="Saved to your transcripts folder. Nothing sent to the cloud."
          annotations={TRANSCRIPT_ANNOTATIONS}
          fadeInAt={B.transcriptIn}
          fadeOutAt={B.transcriptOut}
        />
      )}

    </AbsoluteFill>
  );
};
