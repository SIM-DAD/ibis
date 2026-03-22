import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { C, FONT } from '../tokens';

const POINTS = [
  { text: 'No internet required after install.',   sub: 'The AI model runs entirely on your machine.' },
  { text: 'No subscription. Ever.',                sub: 'One-time purchase. Yours forever.' },
  { text: 'Runs on any modern Windows PC.',        sub: 'No GPU needed. CPU int8 inference.' },
];

const DiffRow: React.FC<{ text: string; sub: string; startFrame: number }> = ({ text, sub, startFrame }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [startFrame, startFrame + 22], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const x = interpolate(frame, [startFrame, startFrame + 22], [-24, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 20,
      opacity,
      transform: `translateX(${x}px)`,
      fontFamily: FONT,
    }}>
      {/* Checkmark badge */}
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        background: C.red,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, marginTop: 4,
      }}>
        <span style={{ color: C.white, fontSize: 16, fontWeight: 700 }}>✓</span>
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 700, color: C.text, letterSpacing: '-0.02em', marginBottom: 4 }}>
          {text}
        </div>
        <div style={{ fontSize: 15, color: C.muted }}>
          {sub}
        </div>
      </div>
    </div>
  );
};

export const Differentiators: React.FC = () => {
  const frame = useCurrentFrame();

  const labelOpacity = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: 'clamp' });
  const sceneOpacity = interpolate(frame, [185, 210], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{
      background: C.bg,
      opacity: sceneOpacity,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: FONT,
    }}>
      <div style={{ width: 680, display: 'flex', flexDirection: 'column', gap: 36 }}>
        {/* Section label */}
        <div style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: C.red,
          opacity: labelOpacity,
        }}>
          Why Ibis
        </div>

        {POINTS.map((p, i) => (
          <DiffRow
            key={p.text}
            text={p.text}
            sub={p.sub}
            startFrame={10 + i * 55}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};
