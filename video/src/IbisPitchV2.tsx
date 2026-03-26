/**
 * IbisPitchV2 — 70-second LS review video
 *
 * Uses real app screenshots (placed in video/public/) to show the product
 * as it actually works. ScreenshotFrame renders placeholder rectangles
 * until the asset files are in place.
 *
 * Scene map  (all times absolute, 30 fps):
 * ──────────────────────────────────────────────────────────────────────────
 *  0s   (   0f)  ProblemFrame     — privacy problem → "Ibis doesn't"
 *  7s   ( 210f)  Intro            — logo + tagline
 * 10s   ( 300f)  SetupScene       — real screenshot: app config
 * 21s   ( 630f)  WorkflowShowcase — drop audio → transcript (real screenshots)
 * 38s   (1140f)  OutputScene      — real screenshot: transcript content
 * 47s   (1410f)  Differentiators  — 3 key selling points
 * 56s   (1680f)  PricingScene     — Personal $24 / Pro $49 cards
 * 61s   (1830f)  EndCard          — logo + useibis.app + pricing footer
 * 70s   (2100f)  END
 * ──────────────────────────────────────────────────────────────────────────
 *
 * To render:
 *   npx remotion render IbisPitchV2 out/ibis-pitch-v2.mp4
 */
import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { P } from './tokens';

import { ProblemFrame }    from './scenes/ProblemFrame';
import { Intro }           from './scenes/Intro';
import { ScreenshotFrame } from './scenes/ScreenshotFrame';
import { WorkflowShowcase }from './scenes/WorkflowShowcase';
import { Differentiators } from './scenes/Differentiators';
import { PricingScene }    from './scenes/PricingScene';
import { EndCard }         from './scenes/EndCard';

// screenshot-setup.png: 559×1178 — center-aligned, labels on RIGHT
// y values measured from the actual Settings window layout:
//   Watch Folder field    ≈ 0.22 of image height
//   Transcripts Folder    ≈ 0.44
//   Model dropdown        ≈ 0.57
const SETUP_ANNOTATIONS = [
  { label: 'Watch folder',                       targetX: 0.7, targetY: 0.245, frameIn: 40  },
  { label: 'Transcripts output folder',          targetX: 0.7, targetY: 0.445, frameIn: 75  },
  { label: 'Whisper Large-v3-Turbo — on-device', targetX: 0.8, targetY: 0.6, frameIn: 110 },
];

// screenshot-transcript-content.png: 561×355 — left-aligned, labels RIGHT
// y values measured from the actual file:
//   Date/Source/Duration block  ≈ 0.28 (middle of the 3-line header)
//   [00:00:00] timestamp line   ≈ 0.50
//   Paragraph text body         ≈ 0.70
const OUTPUT_ANNOTATIONS = [
  { label: 'Date · Source · Duration header',    targetX: 0.40, targetY: 0.35, frameIn: 35 },
  { label: '[HH:MM:SS] paragraph timestamps',    targetX: 0.225, targetY: 0.535, frameIn: 65 },
  { label: 'Clean plain text — paste anywhere',  targetX: 0.94, targetY: 0.725, frameIn: 95 },
];

export const IbisPitchV2: React.FC = () => (
  <AbsoluteFill>

    {/* 0–7s — Privacy problem */}
    <Sequence from={P.problem.from} durationInFrames={P.problem.duration}>
      <ProblemFrame />
    </Sequence>

    {/* 7–10s — Logo reveal */}
    <Sequence from={P.intro.from} durationInFrames={P.intro.duration}>
      <Intro />
    </Sequence>

    {/* 10–21s — App setup screenshot (portrait 559×1178, center-aligned) */}
    <Sequence from={P.setup.from} durationInFrames={P.setup.duration}>
      <ScreenshotFrame
        src="screenshot-setup.png"
        aspectRatio={559 / 1178}
        displayWidth={280}
        screenshotAlign="center"
        sceneLabel="Setup"
        caption="Pick your folders. Ibis runs silently in the background."
        annotations={SETUP_ANNOTATIONS}
        fadeInAt={0}
        fadeOutAt={310}
      />
    </Sequence>

    {/* 21–38s — Core workflow with real screenshots */}
    <Sequence from={P.workflow.from} durationInFrames={P.workflow.duration}>
      <WorkflowShowcase />
    </Sequence>

    {/* 38–47s — Transcript content screenshot (561×355, left-aligned, labels right) */}
    <Sequence from={P.output.from} durationInFrames={P.output.duration}>
      <ScreenshotFrame
        src="screenshot-transcript-content.png"
        aspectRatio={561 / 355}
        displayWidth={760}
        screenshotAlign="left"
        sceneLabel="Output"
        caption="Every transcript: metadata header, paragraph timestamps, clean text."
        annotations={OUTPUT_ANNOTATIONS}
        fadeInAt={0}
        fadeOutAt={250}
      />
    </Sequence>

    {/* 47–56s — Key differentiators */}
    <Sequence from={P.diff.from} durationInFrames={P.diff.duration}>
      <Differentiators />
    </Sequence>

    {/* 56–62s — Pricing */}
    <Sequence from={P.pricing.from} durationInFrames={P.pricing.duration}>
      <PricingScene />
    </Sequence>

    {/* 62–70s — End card */}
    <Sequence from={P.endCard.from} durationInFrames={P.endCard.duration}>
      <EndCard />
    </Sequence>

  </AbsoluteFill>
);
