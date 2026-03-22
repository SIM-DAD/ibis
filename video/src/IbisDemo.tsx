import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { SEQ } from './tokens';
import { Intro } from './scenes/Intro';
import { DesktopScene } from './scenes/DesktopScene';
import { EndCard } from './scenes/EndCard';

export const IbisDemo: React.FC = () => (
  <AbsoluteFill>
    <Sequence from={SEQ.intro.from} durationInFrames={SEQ.intro.duration}>
      <Intro />
    </Sequence>
    <Sequence from={SEQ.desktop.from} durationInFrames={SEQ.desktop.duration}>
      <DesktopScene />
    </Sequence>
    <Sequence from={SEQ.endCard.from} durationInFrames={SEQ.endCard.duration}>
      <EndCard />
    </Sequence>
  </AbsoluteFill>
);
