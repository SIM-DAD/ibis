import React from 'react';
import { AbsoluteFill, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, FONT } from '../tokens';

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo slides in from left + fades
  const logoX = interpolate(
    spring({ frame, fps, config: { damping: 18, stiffness: 80 } }),
    [0, 1], [-60, 0],
  );
  const logoOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });

  // Wordmark fades in slightly after logo
  const wordmarkOpacity = interpolate(frame, [15, 40], [0, 1], { extrapolateRight: 'clamp' });
  const wordmarkY = interpolate(
    spring({ frame: Math.max(0, frame - 15), fps, config: { damping: 20 } }),
    [0, 1], [12, 0],
  );

  // Tagline fades in last
  const taglineOpacity = interpolate(frame, [35, 65], [0, 1], { extrapolateRight: 'clamp' });

  // Whole scene fades out at end
  const sceneOpacity = interpolate(frame, [70, 90], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: C.bg, opacity: sceneOpacity }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 0,
        fontFamily: FONT,
      }}>
        {/* Logo + wordmark row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          marginBottom: 20,
        }}>
          <img
            src={staticFile('icon.svg')}
            style={{
              width: 80,
              height: 80,
              opacity: logoOpacity,
              transform: `translateX(${logoX}px)`,
            }}
          />
          <div style={{ opacity: wordmarkOpacity, transform: `translateY(${wordmarkY}px)` }}>
            <div style={{
              fontSize: 72,
              fontWeight: 800,
              color: C.red,
              letterSpacing: '-0.03em',
              lineHeight: 1,
            }}>
              Ibis
            </div>
          </div>
        </div>

        {/* Tagline */}
        <div style={{
          fontSize: 22,
          fontWeight: 400,
          color: C.muted,
          letterSpacing: '0.01em',
          opacity: taglineOpacity,
        }}>
          Local AI Transcription for Windows
        </div>
      </div>
    </AbsoluteFill>
  );
};
