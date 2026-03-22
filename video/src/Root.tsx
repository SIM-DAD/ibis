import React from 'react';
import { Composition } from 'remotion';
import { IbisDemo }  from './IbisDemo';
import { IbisPitch } from './IbisPitch';
import { FPS, TOTAL_FRAMES } from './tokens';

export const Root: React.FC = () => (
  <>
    {/* 15-second homepage loop */}
    <Composition
      id="IbisDemo"
      component={IbisDemo}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={1280}
      height={720}
    />
    {/* 45-second full pitch video */}
    <Composition
      id="IbisPitch"
      component={IbisPitch}
      durationInFrames={1350}
      fps={FPS}
      width={1280}
      height={720}
    />
  </>
);
