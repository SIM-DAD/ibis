/**
 * IbisPitch — 45-second full pitch video
 *
 * Scene breakdown:
 *   0–7s   (0–210f)    ProblemFrame  — cloud = bad, Ibis = answer
 *   7–10s  (210–300f)  Intro         — logo + tagline
 *   10–21s (300–630f)  DesktopScene  — workflow demo (reused from 15s)
 *   21–28s (630–840f)  AudienceSplash — who it's for
 *   28–35s (840–1050f) Differentiators — 3 key selling points
 *   35–45s (1050–1350f) EndCard       — price + CTA
 */
import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { ProblemFrame }    from './scenes/ProblemFrame';
import { Intro }           from './scenes/Intro';
import { DesktopScene }    from './scenes/DesktopScene';
import { AudienceSplash }  from './scenes/AudienceSplash';
import { Differentiators } from './scenes/Differentiators';
import { EndCard }         from './scenes/EndCard';

export const IbisPitch: React.FC = () => (
  <AbsoluteFill>
    <Sequence from={0}    durationInFrames={210}><ProblemFrame /></Sequence>
    <Sequence from={210}  durationInFrames={90}> <Intro /></Sequence>
    <Sequence from={300}  durationInFrames={330}><DesktopScene /></Sequence>
    <Sequence from={630}  durationInFrames={210}><AudienceSplash /></Sequence>
    <Sequence from={840}  durationInFrames={210}><Differentiators /></Sequence>
    <Sequence from={1050} durationInFrames={300}><EndCard /></Sequence>
  </AbsoluteFill>
);
