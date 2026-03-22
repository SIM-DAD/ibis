# Ibis Project Manager: Confirmed Integration Spec & Action Items

## Prepared for: Ibis Project Manager (Claude Instance)

## Date: 2026-03-19

## Status: Post-exchange — both life-os and Ibis briefs have been reviewed

------------------------------------------------------------------------

## Purpose

This document synthesizes the two-way briefing exchange between the Ibis and life-os project managers. It supersedes the individual briefs for the purpose of active development. It contains:

1. The confirmed integration contract
2. The Ibis v1 action items backlog derived from the review
3. The open infrastructure gap and its recommended resolution

------------------------------------------------------------------------

## Confirmed Integration Contract (Both Sides Agreed)

| Requirement | Confirmed Detail |
|---|---|
| Output format | Plain UTF-8 `.txt` |
| Output location | `C:\life-os\ibis-inbox\` |
| File naming | `YYYY-MM-DD_HH-MM-SS_[original-filename].txt` |
| Metadata header | Date / Source / Duration (3 lines, strippable) |
| Atomic write | Write to `.tmp`, rename on completion — REQUIRED |
| Audio input (v1) | MP3, WAV |
| Speaker attribution | None in v1 — all speakers merged |
| Timestamps within transcript | None in v1 (paragraph markers recommended, see below) |
| LLM processing | None in Ibis — life-os 8B handles all downstream structure |
| Internet required | No — fully offline |
| Platform | Windows 10 and 11 |

**Filename format note:** life-os proposed `YYYY-MM-DD-HH-MM-SS-[title].txt` (all dashes). Ibis confirmed `YYYY-MM-DD_HH-MM-SS_[original-filename].txt` (underscores between date/time and original filename). These are cosmetically different. The life-os watcher processes any `.txt` file and the classifier reads content, not filenames. Both formats are acceptable. No coordination required.

------------------------------------------------------------------------

## Ibis v1 Action Items Backlog

Derived from the Ibis → life-os briefing review. Items are ordered by priority.

| # | Item | Effort | Priority | Status |
|---|---|---|---|---|
| 1 | **Add M4A to watched extensions** | 1 line | High | New — add to backlog |
| 2 | **Add seconds precision to filename** (`HH-MM-SS`) | 1 line | Medium | Already in spec backlog |
| 3 | **Atomic write** (write to `.tmp`, rename) | 5 lines | Required | Already in spec backlog |
| 4 | **Metadata header block** in transcript (Date, Source, Duration) | 10 lines | Medium | Already in spec backlog |
| 5 | **Paragraph-level timestamp markers** (`[HH:MM:SS]`) at segment breaks | 20 lines | Medium | New — add to backlog |
| 6 | **Low-confidence flag** in transcript when avg confidence is poor | 10 lines | Low-Medium | New — add to backlog |

### Item 1: M4A Support — High Priority Detail

faster-whisper handles M4A natively via its ffmpeg dependency, which is already bundled in the PyInstaller build. This is a **one-line change** to the watched file extension filter. It unblocks the primary mobile capture format used by Apple Voice Memos, Google Recorder, and most modern Android voice apps.

The owner's personal pipeline is currently blocked on this: phone recordings are M4A by default. Without M4A support, recordings must be manually converted before Ibis can process them.

### Item 5: Paragraph-Level Timestamp Markers — Implementation Note

faster-whisper returns segment-level timestamps internally. Inserting `[HH:MM:SS]` markers at natural segment breaks in the output transcript is approximately 20 lines of code and does not change the integration contract — the file is still plain `.txt`. This has high value for journalists, attorneys, and researchers (the three demographics who most need to navigate long recordings).

### Item 6: Low-Confidence Flag — Implementation Note

When the average segment log probability falls below a threshold (e.g., `avg_logprob < -0.5`), append a single line to the transcript footer:

```
[Note: low-confidence segments detected — review recommended]
```

This is a ~10-line addition. It surfaces accuracy uncertainty that faster-whisper already computes but currently discards. Valuable for researchers and clinicians.

------------------------------------------------------------------------

## Open Infrastructure Gap: Mobile-to-NSF-Leith Sync

Neither Ibis nor life-os resolves how a voice memo recorded on the owner's phone reaches the Ibis Watch Folder on NSF-Leith.

**Recommended resolution: Syncthing**

- Install Syncthing on phone and NSF-Leith
- Point the NSF-Leith sync target at the Ibis Watch Folder
- Phone records to a Syncthing-monitored folder
- Recordings sync over LAN automatically when home; queue and sync on return when out

This is a one-time setup. It adds no ongoing friction to the capture workflow and satisfies the ADHD constraint (zero extra steps after initial config).

**This is an infrastructure task, not a software build task.** Neither Ibis nor life-os owns it. Track it separately as a personal infrastructure setup item.

------------------------------------------------------------------------

## What life-os Handles (Not Ibis's Problem)

For clarity, the following are fully within life-os's domain and require no coordination:

- Task extraction from prose
- Classification by life zone (academic / llc / personal)
- Project tagging and routing
- Due date extraction
- Summarization (via 8B model)
- Confidence-based routing (auto-file vs human-review inbox)
- Health log detection and filing
- SQLite task table writes
- Archive of processed transcripts

Ibis produces raw prose. Everything downstream is life-os.

------------------------------------------------------------------------

## v2 Additions That Will Affect life-os

When v2 ships, coordinate with the life-os project manager before enabling:

- **Multiple watch folders** — life-os currently uses a single drop folder; v2 may allow zone-specific folders (llc vs personal) which the watcher should handle
- **Speaker diarization** — the 8B classifier prompt may be updated to use speaker labels when present; coordinate on format
- **Built-in LLM summarization** — if Ibis v2 adds summaries to the output, confirm whether life-os should treat them as canonical or re-summarize

No coordination required until v2 development begins.

------------------------------------------------------------------------

## Coordination Trigger

Any change to the following requires notification to the life-os project manager before shipping:

- Transcript output format (metadata header structure, footer additions)
- File naming convention
- Output folder logic
- New audio formats added to watch list (informational only — no life-os changes needed)
