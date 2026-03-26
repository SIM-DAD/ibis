/**
 * PricingScene — 6 seconds (180 frames)
 *
 * Shows the two Ibis tiers side by side with feature bullets.
 * Designed to be clear for the LS review board: one-time pricing,
 * no subscription, specific device limits.
 *
 * Update TIERS below if feature bullets change.
 */
import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { C, FONT } from '../tokens';

// ── Tier data — update bullets here ──────────────────────────────────────────

const TIERS = [
  {
    name: 'Personal',
    price: '$24',
    subtitle: 'one-time purchase',
    highlight: false,
    features: [
      'Local Whisper large-v3-turbo',
      'Unlimited transcriptions',
      '1 device',
      'MP3, WAV, M4A, MP4 & more',
      'Paragraph timestamps',
      'Lifetime updates',
    ],
  },
  {
    name: 'Pro',
    price: '$49',
    subtitle: 'one-time purchase',
    highlight: true,
    features: [
      'Everything in Personal',
      'Up to 3 devices',
      'Commercial use',
      'Priority support',
      'Early access to new features',
    ],
  },
] as const;

// ── PricingCard ───────────────────────────────────────────────────────────────

const PricingCard: React.FC<{
  tier: (typeof TIERS)[number];
  startFrame: number;
}> = ({ tier, startFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: Math.max(0, frame - startFrame),
    fps,
    config: { damping: 20, stiffness: 100 },
  });

  const opacity = interpolate(frame, [startFrame, startFrame + 16], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const y = interpolate(progress, [0, 1], [24, 0]);

  const isHighlight = tier.highlight;

  return (
    <div
      style={{
        width: 320,
        background: isHighlight ? C.accent : C.white,
        border: `1.5px solid ${isHighlight ? C.accent : C.border}`,
        borderRadius: 14,
        padding: '30px 28px 28px',
        fontFamily: FONT,
        opacity,
        transform: `translateY(${y}px)`,
        boxShadow: isHighlight
          ? '0 20px 56px rgba(45,106,143,0.28), 0 4px 16px rgba(45,106,143,0.18)'
          : '0 8px 24px rgba(0,0,0,0.07)',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.1em',
          color: isHighlight ? 'rgba(255,255,255,0.7)' : C.muted,
          marginBottom: 6,
        }}
      >
        {tier.name}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
        <span
          style={{
            fontSize: 52,
            fontWeight: 800,
            color: isHighlight ? C.white : C.text,
            letterSpacing: '-0.04em',
            lineHeight: 1,
          }}
        >
          {tier.price}
        </span>
      </div>

      <div
        style={{
          fontSize: 12,
          color: isHighlight ? 'rgba(255,255,255,0.65)' : C.muted,
          marginBottom: 24,
          fontWeight: 400,
          letterSpacing: '0.01em',
        }}
      >
        {tier.subtitle}
      </div>

      {/* Divider */}
      <div
        style={{
          height: 1,
          background: isHighlight ? 'rgba(255,255,255,0.15)' : C.border,
          marginBottom: 20,
        }}
      />

      {/* Features */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {tier.features.map((feat) => (
          <div
            key={feat}
            style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}
          >
            <span
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: isHighlight ? 'rgba(255,255,255,0.2)' : C.accentL,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: 1,
              }}
            >
              <span
                style={{
                  color: isHighlight ? C.white : C.accent,
                  fontSize: 10,
                  fontWeight: 800,
                  lineHeight: 1,
                }}
              >
                ✓
              </span>
            </span>
            <span
              style={{
                fontSize: 13,
                color: isHighlight ? 'rgba(255,255,255,0.9)' : C.text,
                lineHeight: 1.4,
                fontWeight: 400,
              }}
            >
              {feat}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── PricingScene ──────────────────────────────────────────────────────────────

export const PricingScene: React.FC = () => {
  const frame = useCurrentFrame();

  const labelOp = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const noteOp  = interpolate(frame, [50, 70], [0, 1], { extrapolateRight: 'clamp' });

  const sceneOp = interpolate(frame, [160, 178], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        background: C.bg,
        opacity: sceneOp,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 28,
        fontFamily: FONT,
      }}
    >
      {/* Label */}
      <div
        style={{
          fontSize: 22,
          fontWeight: 800,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.10em',
          color: C.accent,
          opacity: labelOp,
        }}
      >
        Simple pricing. No subscription.
      </div>

      {/* Cards */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
        <PricingCard tier={TIERS[0]} startFrame={12} />
        <PricingCard tier={TIERS[1]} startFrame={28} />
      </div>

      {/* Footnote */}
      <div
        style={{
          fontSize: 15,
          color: C.muted,
          opacity: noteOp,
          letterSpacing: '0.01em',
        }}
      >
        Windows 10 &amp; 11 · No internet required after install · Lifetime license
      </div>
    </AbsoluteFill>
  );
};
