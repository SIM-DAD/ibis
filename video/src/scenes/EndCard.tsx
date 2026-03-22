import React from 'react';
import { AbsoluteFill, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, FONT } from '../tokens';

export const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Fade in from desktop scene
  const bgOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });

  const logoScale = spring({ frame, fps, config: { damping: 18, stiffness: 80 } });
  const logoOpacity = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: 'clamp' });

  const taglineOpacity = interpolate(frame, [18, 40], [0, 1], { extrapolateRight: 'clamp' });
  const priceOpacity   = interpolate(frame, [30, 55], [0, 1], { extrapolateRight: 'clamp' });
  const ctaOpacity     = interpolate(frame, [45, 70], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{
      background: C.bg,
      opacity: bgOpacity,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: FONT,
    }}>
      {/* Logo + wordmark */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        marginBottom: 28,
        opacity: logoOpacity,
        transform: `scale(${logoScale})`,
      }}>
        <img src={staticFile('icon.svg')} style={{ width: 64, height: 64 }} />
        <span style={{
          fontSize: 56,
          fontWeight: 800,
          color: C.red,
          letterSpacing: '-0.03em',
        }}>
          Ibis
        </span>
      </div>

      {/* Tagline */}
      <div style={{
        fontSize: 20,
        fontWeight: 400,
        color: C.muted,
        marginBottom: 28,
        opacity: taglineOpacity,
        letterSpacing: '0.01em',
      }}>
        Local AI transcription. No cloud. No subscription.
      </div>

      {/* Divider */}
      <div style={{
        width: 48,
        height: 2,
        background: C.red,
        borderRadius: 1,
        marginBottom: 28,
        opacity: priceOpacity,
      }} />

      {/* Price pill */}
      <div style={{
        display: 'flex',
        gap: 16,
        alignItems: 'center',
        marginBottom: 36,
        opacity: priceOpacity,
      }}>
        <div style={{
          background: C.red,
          color: C.white,
          borderRadius: 99,
          padding: '10px 28px',
          fontSize: 18,
          fontWeight: 700,
        }}>
          $24 · Personal
        </div>
        <div style={{
          background: C.navy,
          color: C.white,
          borderRadius: 99,
          padding: '10px 28px',
          fontSize: 18,
          fontWeight: 700,
        }}>
          $49 · Pro (v2)
        </div>
      </div>

      {/* CTA */}
      <div style={{
        fontSize: 15,
        color: C.muted,
        opacity: ctaOpacity,
        letterSpacing: '0.02em',
      }}>
        simdadllc.com · Windows 10 &amp; 11 · One-time purchase
      </div>
    </AbsoluteFill>
  );
};
