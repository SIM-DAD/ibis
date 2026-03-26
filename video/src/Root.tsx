import React from 'react';
import { Composition } from 'remotion';
import { IbisDemo }    from './IbisDemo';
import { IbisPitch }   from './IbisPitch';
import { IbisPitchV2 } from './IbisPitchV2';
import { FPS, TOTAL_FRAMES, PITCH_V2_TOTAL } from './tokens';

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
    {/* 45-second original pitch (legacy) */}
    <Composition
      id="IbisPitch"
      component={IbisPitch}
      durationInFrames={1350}
      fps={FPS}
      width={1280}
      height={720}
    />
    {/* 70-second LS review video — uses real app screenshots */}
    <Composition
      id="IbisPitchV2"
      component={IbisPitchV2}
      durationInFrames={PITCH_V2_TOTAL}
      fps={FPS}
      width={1280}
      height={720}
    />
  </>
);
