import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { C, FONT } from '../tokens';

const Line: React.FC<{
  text: string;
  startFrame: number;
  size?: number;
  weight?: number;
  color?: string;
  spacing?: string;
}> = ({ text, startFrame, size = 36, weight = 700, color = C.text, spacing = '-0.02em' }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [startFrame, startFrame + 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const y = interpolate(frame, [startFrame, startFrame + 20], [14, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <div style={{ opacity, transform: `translateY(${y}px)`, fontFamily: FONT, fontSize: size, fontWeight: weight, color, letterSpacing: spacing, lineHeight: 1.2 }}>
      {text}
    </div>
  );
};

// Cloud upload icon with a red X — represents the problem
const CloudX: React.FC<{ opacity: number }> = ({ opacity }) => (
  <div style={{ opacity, marginBottom: 36 }}>
    <svg width="72" height="72" viewBox="0 0 24 24" fill="none">
      <path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" fill="#e2e2e2"/>
      <line x1="9" y1="9" x2="15" y2="15" stroke={C.red} strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="15" y1="9" x2="9" y2="15" stroke={C.red} strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  </div>
);

export const ProblemFrame: React.FC = () => {
  const frame = useCurrentFrame();

  const cloudOpacity = interpolate(frame, [10, 35], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Fade out at end
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
      gap: 18,
    }}>
      <CloudX opacity={cloudOpacity} />
      <Line text="Your recordings are sensitive." startFrame={20} size={40} weight={700} />
      <Line text="Cloud services receive them." startFrame={60} size={40} weight={400} color={C.muted} />
      <div style={{ height: 12 }} />
      <Line text="Ibis doesn't." startFrame={110} size={52} weight={800} color={C.red} spacing="-0.03em" />
    </AbsoluteFill>
  );
};
