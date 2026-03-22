import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { C, D, FONT } from '../tokens';

// ─── Shared sub-components ───────────────────────────────────────────────────

// Windows 11–style title bar button
const WinBtn: React.FC<{ label: string; isClose?: boolean }> = ({ label, isClose }) => (
  <div style={{
    width: 46,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: isClose ? 'transparent' : 'transparent',
    fontSize: 13,
    color: '#444',
    cursor: 'default',
    userSelect: 'none',
    borderRadius: isClose ? '0 8px 0 0' : 0,
  }}>
    {label}
  </div>
);

const WindowFrame: React.FC<{
  title: string;
  width: number;
  height: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ title, width, height, style, children }) => (
  <div style={{
    width,
    height,
    background: C.white,
    borderRadius: 8,
    boxShadow: '0 12px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
    overflow: 'hidden',
    fontFamily: FONT,
    ...style,
  }}>
    {/* Windows 11-style title bar */}
    <div style={{
      height: 32,
      background: '#f3f3f3',
      borderBottom: `1px solid ${C.border}`,
      display: 'flex',
      alignItems: 'center',
      userSelect: 'none',
    }}>
      {/* App icon + title (left-aligned) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '0 12px',
        flex: 1,
        minWidth: 0,
      }}>
        <div style={{
          width: 14, height: 14,
          background: C.red,
          borderRadius: 3,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ color: 'white', fontSize: 8, fontWeight: 800 }}>I</span>
        </div>
        <span style={{ fontSize: 12, fontWeight: 400, color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {title}
        </span>
      </div>
      {/* Window controls (right side) */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <WinBtn label="—" />
        <WinBtn label="□" />
        <WinBtn label="✕" isClose />
      </div>
    </div>
    {/* Content */}
    <div style={{ height: height - 32, overflow: 'hidden' }}>
      {children}
    </div>
  </div>
);

const FileItem: React.FC<{
  name: string;
  type: 'audio' | 'text';
  translateY?: number;
  opacity?: number;
}> = ({ name, type, translateY = 0, opacity = 1 }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 16px',
    borderRadius: 6,
    background: 'rgba(0,0,0,0.02)',
    border: `1px solid ${C.border}`,
    transform: `translateY(${translateY}px)`,
    opacity,
    fontFamily: FONT,
  }}>
    {type === 'audio' ? (
      // Audio file icon
      <div style={{
        width: 34,
        height: 34,
        borderRadius: 6,
        background: 'linear-gradient(135deg, #e63946 0%, #c1121f 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
        </svg>
      </div>
    ) : (
      // Text file icon
      <div style={{
        width: 34,
        height: 34,
        borderRadius: 6,
        background: 'linear-gradient(135deg, #2c3e50 0%, #1a252f 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
          <path d="M14,2H6C4.9,2,4,2.9,4,4v16c0,1.1,0.9,2,2,2h12c1.1,0,2-0.9,2-2V8L14,2z M16,18H8v-2h8V18z M16,14H8v-2h8V14z M13,9V3.5L18.5,9H13z"/>
        </svg>
      </div>
    )}
    <div>
      <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{name}</div>
      <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>
        {type === 'audio' ? 'MP3 Audio File' : 'Plain Text Document'}
      </div>
    </div>
  </div>
);


// ─── Tray corner ─────────────────────────────────────────────────────────────

const TrayCorner: React.FC<{ pulse: number }> = ({ pulse }) => (
  <div style={{
    position: 'absolute',
    bottom: 12,
    right: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontFamily: FONT,
  }}>
    {/* Clock */}
    <div style={{ fontSize: 11, color: C.muted, textAlign: 'right' }}>
      <div>2:34 PM</div>
      <div>3/19/2026</div>
    </div>
    {/* Ibis tray icon */}
    <div style={{
      width: 20,
      height: 20,
      borderRadius: 4,
      background: C.red,
      opacity: 0.85 + pulse * 0.15,
      transform: `scale(${1 + pulse * 0.08})`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <span style={{ color: 'white', fontSize: 10, fontWeight: 800, fontFamily: FONT }}>I</span>
    </div>
  </div>
);

// ─── Transcript preview text ──────────────────────────────────────────────────

const TranscriptPreview: React.FC<{ opacity: number }> = ({ opacity }) => (
  <div style={{
    position: 'absolute',
    bottom: 60,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 580,
    background: C.white,
    borderRadius: 10,
    border: `1px solid ${C.border}`,
    padding: '16px 20px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
    opacity,
    fontFamily: FONT,
  }}>
    <div style={{ fontSize: 10, fontWeight: 700, color: C.red, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
      Transcript Preview
    </div>
    <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.5, marginBottom: 8 }}>
      Date: 2026-03-19 · Source: interview.mp3 · Duration: 0:14
    </div>
    <div style={{ fontSize: 12, color: C.text, lineHeight: 1.7 }}>
      <span style={{ color: C.muted, fontSize: 11 }}>[00:00:00] </span>
      The key insight here is that all processing happens locally — no audio ever
      leaves the machine. For journalists and therapists, that's not a nice-to-have.
      <span style={{ color: C.muted, fontSize: 11 }}> [00:00:07] </span>
      It's the whole point.
    </div>
  </div>
);

// ─── DesktopScene ─────────────────────────────────────────────────────────────

export const DesktopScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Desktop bg fade-in
  const bgOpacity = interpolate(frame, D.bgFadeIn as [number, number], [0, 1], { extrapolateRight: 'clamp' });

  // Explorer window spring-in
  const windowScale = spring({
    frame: Math.max(0, frame - D.windowAppear[0]),
    fps,
    config: { damping: 18, stiffness: 90 },
  });
  const windowOpacity = interpolate(frame, D.windowAppear as [number, number], [0, 1], { extrapolateRight: 'clamp' });

  // File drop animation (interview.mp3)
  const fileDropProgress = spring({
    frame: Math.max(0, frame - D.fileDropStart),
    fps,
    config: { damping: 14, stiffness: 100 },
  });
  const fileY = interpolate(fileDropProgress, [0, 1], [-80, 0]);
  const fileOpacity = interpolate(frame, [D.fileDropStart, D.fileDropStart + 12], [0, 1], { extrapolateRight: 'clamp' });

  // Tray pulse when file lands
  const trayPulse = interpolate(
    Math.sin((frame - D.fileDropLand) * 0.25),
    [-1, 1], [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  ) * interpolate(frame, [D.fileDropLand, D.fileDropLand + 60], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Folder label switch
  const showTranscripts = frame >= D.folderSwitch;
  const folderLabelOpacity = interpolate(
    frame, [D.folderSwitch, D.folderSwitch + 20], [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  // .txt file drops in
  const txtDropProgress = spring({ frame: Math.max(0, frame - D.txtFileDrop), fps, config: { damping: 14, stiffness: 100 } });
  const txtFileY = interpolate(txtDropProgress, [0, 1], [-80, 0]);
  const txtFileOpacity = interpolate(frame, [D.txtFileDrop, D.txtFileDrop + 12], [0, 1], { extrapolateRight: 'clamp' });

  // Transcript preview fades in
  const previewOpacity = interpolate(frame, [D.previewIn, D.previewIn + 30], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: C.bg, opacity: bgOpacity }}>

      {/* Subtle desktop grid/texture */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(160deg, #f8f8f8 0%, #ebebeb 100%)',
      }} />

      {/* ── File Explorer window ───────────────────────────────────────── */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: `translate(-50%, -54%) scale(${windowScale})`,
        opacity: windowOpacity,
      }}>
        <WindowFrame
          title={showTranscripts
            ? 'VoiceMemos › Transcripts'
            : 'VoiceMemos › Inbox'}
          width={560}
          height={320}
        >
          {/* Breadcrumb bar */}
          <div style={{
            padding: '8px 16px',
            borderBottom: `1px solid ${C.border}`,
            fontSize: 11,
            color: C.muted,
            fontFamily: FONT,
            background: '#fafafa',
            opacity: showTranscripts ? folderLabelOpacity : 1,
          }}>
            {showTranscripts
              ? '📁  C:\\Users\\alex\\VoiceMemos\\Transcripts'
              : '📁  C:\\Users\\alex\\VoiceMemos\\Inbox'}
          </div>

          {/* File list area */}
          <div style={{
            padding: '16px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            height: '100%',
          }}>
            {!showTranscripts && (
              <FileItem
                name="interview.mp3"
                type="audio"
                translateY={fileY}
                opacity={fileOpacity}
              />
            )}
            {showTranscripts && (
              <FileItem
                name="2026-03-19_14-30-00_interview.txt"
                type="text"
                translateY={txtFileY}
                opacity={txtFileOpacity}
              />
            )}
          </div>
        </WindowFrame>
      </div>

      {/* ── Transcript preview card ────────────────────────────────────── */}
      {frame >= D.previewIn && (
        <TranscriptPreview opacity={previewOpacity} />
      )}

      {/* ── Tray / taskbar strip ──────────────────────────────────────── */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 42,
        background: 'rgba(248,248,248,0.95)',
        borderTop: `1px solid ${C.border}`,
        backdropFilter: 'blur(8px)',
      }}>
        <TrayCorner pulse={trayPulse} />
      </div>

    </AbsoluteFill>
  );
};
