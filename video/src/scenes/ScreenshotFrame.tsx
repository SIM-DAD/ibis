/**
 * ScreenshotFrame — annotated screenshot scene component
 *
 * Layout:
 *   - Scene label: large, prominent header above the screenshot
 *   - Screenshot: positioned left, right, or center in the 1280×720 canvas
 *   - Annotation labels: always in the WHITE SPACE outside the screenshot,
 *     never overlaid on it. Connected to target points by animated arrow lines.
 *   - Caption: subtitle below the screenshot
 *
 * Arrow lines animate from the label side toward the target dot on the
 * screenshot edge. All lines are short (~50–70px) so they never cross
 * the screenshot content.
 *
 * screenshotAlign:
 *   'right'  → screenshot flush right, labels on the LEFT
 *   'left'   → screenshot flush left, labels on the RIGHT
 *   'center' → screenshot centered, labels on the RIGHT
 */
import React, { useState } from 'react';
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { C, FONT } from '../tokens';

// ── Canvas ────────────────────────────────────────────────────────────────────
const CW = 1280;
const CH = 720;
const H_MARGIN    = 64;  // px from canvas edge to screenshot edge
const ANNOT_GAP   = 44;  // px gap between screenshot edge and where line terminates
const LABEL_H     = 48;  // height reserved for scene label row
const CAPTION_H   = 32;  // height reserved for caption row
const V_GAP       = 12;  // gap between label/screenshot/caption

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Annotation {
  label: string;
  /**
   * Horizontal target as a fraction (0–1) of image width.
   * For RIGHT-side labels use ~0.97 (right edge).
   * For LEFT-side labels use ~0.03 (left edge).
   * Lines are kept short so they don't cross much of the screenshot.
   */
  targetX: number;
  /** Vertical target as a fraction (0–1) of image height. */
  targetY: number;
  /** Local frame at which this annotation appears. */
  frameIn: number;
  /** Override auto-detected side. Defaults to the opposite of screenshotAlign. */
  side?: 'left' | 'right';
}

interface ScreenshotFrameProps {
  src: string;
  aspectRatio?: number;
  displayWidth?: number;
  /** Shown as a large header above the screenshot. */
  sceneLabel?: string;
  /** Shown as a subtitle below the screenshot. */
  caption?: string;
  annotations?: Annotation[];
  /**
   * 'right'  — screenshot on the right, labels on the left (good for portrait)
   * 'left'   — screenshot on the left, labels on the right (good for landscape)
   * 'center' — screenshot centered, labels on the right
   */
  screenshotAlign?: 'center' | 'left' | 'right';
  fadeInAt?: number;
  fadeOutAt?: number;
}

// ── Placeholder (shown when image is missing) ─────────────────────────────────

const Placeholder: React.FC<{ w: number; h: number; name: string }> = ({ w, h, name }) => (
  <div style={{
    width: w, height: h,
    background: C.surface,
    border: `2px dashed ${C.border}`,
    borderRadius: 8,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 10, fontFamily: FONT,
  }}>
    <div style={{ fontSize: 30, opacity: 0.25 }}>🖼</div>
    <div style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>video/public/{name}</div>
    <div style={{ fontSize: 11, color: C.border }}>Place screenshot here</div>
  </div>
);

// ── ScreenshotFrame ───────────────────────────────────────────────────────────

export const ScreenshotFrame: React.FC<ScreenshotFrameProps> = ({
  src,
  aspectRatio = 16 / 9,
  displayWidth = 960,
  sceneLabel,
  caption,
  annotations = [],
  screenshotAlign = 'center',
  fadeInAt = 0,
  fadeOutAt,
}) => {
  const frame = useCurrentFrame();
  const [missing, setMissing] = useState(false);

  const imgW = displayWidth;
  const imgH = Math.round(imgW / aspectRatio);

  const hasLabel   = Boolean(sceneLabel);
  const hasCaption = Boolean(caption);

  // Vertical layout (centered as a block)
  const totalH =
    (hasLabel   ? LABEL_H   + V_GAP : 0) +
    imgH +
    (hasCaption ? V_GAP + CAPTION_H : 0);
  const blockTop = Math.max(8, Math.round((CH - totalH) / 2));
  const imgTop   = blockTop + (hasLabel ? LABEL_H + V_GAP : 0);

  // Horizontal position
  let imgLeft: number;
  if (screenshotAlign === 'right')       imgLeft = CW - H_MARGIN - imgW;
  else if (screenshotAlign === 'left')   imgLeft = H_MARGIN;
  else /* center */                      imgLeft = Math.round((CW - imgW) / 2);

  // Default annotation side (opposite to screenshot alignment)
  const defaultSide: 'left' | 'right' = screenshotAlign === 'right' ? 'left' : 'right';

  // Scene opacity
  const fadeIn  = interpolate(frame, [fadeInAt, fadeInAt + 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const fadeOut = fadeOutAt != null
    ? interpolate(frame, [fadeOutAt, fadeOutAt + 18], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : 1;
  const sceneOp = fadeIn * fadeOut;

  // Label + caption fade-in offsets
  const labelOp   = interpolate(frame, [fadeInAt, fadeInAt + 22], [0, 1], { extrapolateRight: 'clamp' });
  const captionOp = interpolate(frame, [fadeInAt + 20, fadeInAt + 40], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: C.bg, opacity: sceneOp }}>

      {/* ── Scene label ──────────────────────────────────────────────────── */}
      {hasLabel && (
        <div style={{
          position: 'absolute',
          left: 0, right: 0,
          top: blockTop,
          height: LABEL_H,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: FONT,
          opacity: labelOp,
        }}>
          <div style={{
            fontSize: 22,
            fontWeight: 800,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.10em',
            color: C.accent,
          }}>
            {sceneLabel}
          </div>
        </div>
      )}

      {/* ── Screenshot ───────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute',
        left: imgLeft,
        top: imgTop,
        width: imgW,
        height: imgH,
        borderRadius: 8,
        boxShadow: '0 20px 56px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.09)',
        overflow: 'hidden',
        border: `1px solid ${C.border}`,
      }}>
        {missing ? (
          <Placeholder w={imgW} h={imgH} name={src} />
        ) : (
          <Img
            src={staticFile(src)}
            style={{ width: imgW, height: imgH, display: 'block', objectFit: 'cover', objectPosition: 'top left' }}
            onError={() => setMissing(true)}
          />
        )}
      </div>

      {/* ── Caption ──────────────────────────────────────────────────────── */}
      {hasCaption && (
        <div style={{
          position: 'absolute',
          left: 0, right: 0,
          top: imgTop + imgH + V_GAP,
          height: CAPTION_H,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: FONT,
          opacity: captionOp,
        }}>
          <div style={{
            fontSize: 17,
            fontWeight: 400,
            color: C.muted,
            letterSpacing: '0.01em',
          }}>
            {caption}
          </div>
        </div>
      )}

      {/* ── SVG: arrow lines + target dots ───────────────────────────────── */}
      <svg
        style={{
          position: 'absolute',
          left: 0, top: 0,
          width: CW, height: CH,
          overflow: 'visible',
          pointerEvents: 'none',
        }}
        viewBox={`0 0 ${CW} ${CH}`}
      >
        {annotations.map((ann, i) => {
          const side = ann.side ?? defaultSide;

          // Target point in canvas coordinates (on or near the screenshot edge)
          const targetCX = imgLeft + ann.targetX * imgW;
          const targetCY = imgTop  + ann.targetY * imgH;

          // Line start: just outside the screenshot on the annotation side
          const lineStartX = side === 'left'
            ? imgLeft - ANNOT_GAP
            : imgLeft + imgW + ANNOT_GAP;

          const lf = frame - ann.frameIn;
          if (lf < 0) return null;

          const dx = targetCX - lineStartX;
          const dy = targetCY - targetCY; // labels sit at same y as target
          const lineLen = Math.abs(dx); // horizontal line

          const prog    = interpolate(lf, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const dotOp   = interpolate(lf, [10, 22], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const dashOff = lineLen * (1 - prog);

          return (
            <g key={i}>
              {/* Animated line */}
              <line
                x1={lineStartX} y1={targetCY}
                x2={targetCX}   y2={targetCY}
                stroke={C.accent}
                strokeWidth={1.5}
                strokeDasharray={lineLen}
                strokeDashoffset={dashOff}
                strokeLinecap="round"
              />
              {/* Target dot */}
              <circle cx={targetCX} cy={targetCY} r={4} fill={C.accent} opacity={dotOp} />
              <circle cx={targetCX} cy={targetCY} r={10} fill="none" stroke={C.accent} strokeWidth={1.5} opacity={dotOp * 0.30} />
            </g>
          );
        })}
      </svg>

      {/* ── Annotation labels in the whitespace ──────────────────────────── */}
      {annotations.map((ann, i) => {
        const side = ann.side ?? defaultSide;
        const targetCY = imgTop + ann.targetY * imgH;

        const lf = frame - ann.frameIn;
        if (lf < 0) return null;

        const labelOp2  = interpolate(lf, [0, 16], [0, 1],  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        const slideX    = interpolate(lf, [0, 14], [side === 'left' ? -10 : 10, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

        // Label sits at the same vertical centre as its target
        const labelTop = targetCY - 11; // 11 ≈ half of line-height at fontSize 15

        // Left-side labels: right-aligned, right edge at imgLeft - ANNOT_GAP - 10
        // Right-side labels: left-aligned, left edge at imgRight + ANNOT_GAP + 10
        const labelMaxW = side === 'left'
          ? imgLeft - ANNOT_GAP - 10 - H_MARGIN
          : CW - H_MARGIN - (imgLeft + imgW + ANNOT_GAP + 10);

        const posStyle: React.CSSProperties = side === 'left'
          ? {
              right: CW - (imgLeft - ANNOT_GAP - 10),
              textAlign: 'right',
              maxWidth: labelMaxW,
            }
          : {
              left: imgLeft + imgW + ANNOT_GAP + 10,
              textAlign: 'left',
              maxWidth: labelMaxW,
            };

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: labelTop,
              fontFamily: FONT,
              opacity: labelOp2,
              transform: `translateX(${slideX}px)`,
              ...posStyle,
            }}
          >
            <span style={{
              fontSize: 15,
              fontWeight: 600,
              color: C.text,
              letterSpacing: '-0.01em',
              lineHeight: 1.4,
              whiteSpace: 'nowrap',
            }}>
              {ann.label}
            </span>
          </div>
        );
      })}

    </AbsoluteFill>
  );
};
