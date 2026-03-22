import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, FONT } from '../tokens';

const AUDIENCE = [
  { icon: '📰', label: 'Journalists',           sub: 'Protect your sources.' },
  { icon: '🩺', label: 'Therapists',             sub: 'HIPAA starts on-device.' },
  { icon: '⚖️', label: 'Attorneys',              sub: 'Attorney-client privilege.' },
  { icon: '🔬', label: 'Researchers',            sub: 'IRB-compliant by default.' },
  { icon: '🧠', label: 'Knowledge Workers',      sub: 'Voice notes → second brain.' },
  { icon: '🎙️', label: 'Podcasters & Creators', sub: 'Show notes, offline.' },
];

const AudienceCard: React.FC<{
  icon: string;
  label: string;
  sub: string;
  startFrame: number;
}> = ({ icon, label, sub, startFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({ frame: Math.max(0, frame - startFrame), fps, config: { damping: 18, stiffness: 100 } });
  const opacity = interpolate(frame, [startFrame, startFrame + 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const y = interpolate(progress, [0, 1], [20, 0]);

  return (
    <div style={{
      background: C.white,
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      padding: '20px 22px',
      opacity,
      transform: `translateY(${y}px)`,
      fontFamily: FONT,
    }}>
      <div style={{ fontSize: 28, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>{sub}</div>
    </div>
  );
};

export const AudienceSplash: React.FC = () => {
  const frame = useCurrentFrame();

  const headerOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const sceneOpacity  = interpolate(frame, [185, 210], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{
      background: C.bg,
      opacity: sceneOpacity,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 80px',
      fontFamily: FONT,
    }}>
      {/* Section label */}
      <div style={{
        fontSize: 11,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        color: C.red,
        marginBottom: 16,
        opacity: headerOpacity,
      }}>
        Built for people whose recordings are confidential
      </div>

      {/* Card grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 16,
        width: '100%',
        maxWidth: 900,
      }}>
        {AUDIENCE.map((a, i) => (
          <AudienceCard
            key={a.label}
            icon={a.icon}
            label={a.label}
            sub={a.sub}
            startFrame={20 + i * 22}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};
