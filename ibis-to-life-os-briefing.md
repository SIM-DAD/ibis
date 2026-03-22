# Ibis → life-os Integration Briefing

## Prepared for: life-os Project Manager (Claude Instance)

## Context: Ibis Project Design Consultation

## Date: 2026-03-19

------------------------------------------------------------------------

## What This Document Is

This document is the counterpart to the life-os integration brief that was passed to the Ibis project manager. It is written from Ibis's side and addresses four things:

1. A precise, honest description of what Ibis will and will not deliver — including the gap between what v1 ships and what v2 introduces.
2. The integration contract from Ibis's perspective.
3. A macro analysis of the six target demographics and where Ibis falls short of each group's real needs — with callouts for life-os to compensate.
4. A set of low-effort features that Ibis should add to better serve these demographics, identified during this review.

This document is not a feature negotiation. It is a capability disclosure. life-os should treat it as the ground truth for what to expect from Ibis at each stage of its rollout.

------------------------------------------------------------------------

## The Two-Stage Launch

Ibis ships in two versions. life-os should internalize this boundary because the gap between them affects what life-os can automate.

### v1 — Personal ($24, available at launch)

| Capability | Detail |
|---|---|
| Watch folder | Single folder, user-configured |
| Input formats | MP3, WAV |
| Output format | Plain .txt file |
| Model | Whisper large-v3-turbo, bundled locally |
| Languages | 99 (fully multilingual) |
| Speaker handling | None — all speakers merged into undifferentiated prose |
| Timestamps within transcript | None |
| LLM processing | None — raw transcription only |
| Platform | Windows 10 and 11 only |
| Internet required | No — fully offline after install |
| Concurrent watch folders | One |
| Output location | Configurable — this is the life-os integration point |

### v2 — Pro ($49, coming later)

Adds on top of v1:

| Capability | Detail |
|---|---|
| Watch folders | Multiple |
| LLM summarization | Built-in, local (details TBD) |
| Custom output templates | User-defined output structure |
| Speaker diarization | Planned — who said what |
| Video file support | Planned — MP4 and similar |

**life-os planning implication:** Until v2 ships, life-os must treat every Ibis transcript as undifferentiated prose from an unknown number of speakers. The 8B classifier should not depend on speaker attribution or built-in summarization from Ibis. Everything structural must be derived from the content itself.

------------------------------------------------------------------------

## Confirmed Integration Contract (Ibis Side)

These are Ibis's commitments to life-os. They are firm for v1.

**1. Output format:** Plain UTF-8 `.txt`. No markdown, no frontmatter, no JSON, no speaker labels.

**2. Output structure:** Each transcript will begin with a three-line metadata header, followed by the transcript body:

```
Date: YYYY-MM-DD HH:MM:SS
Source: [original-audio-filename.mp3]
Duration: [HH:MM:SS estimated]

[transcribed prose]
```

This header is trivially strippable by the 8B classifier if it interferes with classification. It is included for human readability and audit trail purposes.

**3. File naming:** Ibis will use the format:

```
YYYY-MM-DD_HH-MM-SS_[original-filename].txt
```

Note: this differs slightly from life-os's recommended format (`YYYY-MM-DD-HH-MM-SS`). Ibis uses underscores between date/time and the original filename to preserve visual separation. The presence of seconds precision prevents collision for recordings in the same minute. life-os should parse around either convention.

**4. Atomic writes:** Ibis will write transcripts atomically — the final `.txt` is written to a `.tmp` file first and then renamed into the Transcripts Folder. The Watchdog daemon in life-os will never see a partial file. This is a confirmed implementation requirement.

**5. Output location:** The Transcripts Folder is user-configurable in Ibis Settings. For the owner's personal setup, this will be set to `C:\life-os\ibis-inbox\`. No other configuration is required. This is the entire integration.

**6. Audio handling:** Original audio files are moved to a separate Completed Folder on successful transcription. They are not touched on failure. Ibis will never write audio files into the Transcripts Folder.

------------------------------------------------------------------------

## The Owner's Personal Use Case: Voice-to-Task Pipeline

The owner uses Ibis primarily to capture tasks, project thoughts, and observations verbally. The intended pipeline is:

```
Owner speaks into phone
  → Audio file transferred to Watch Folder on NSF-Leith
    → Ibis transcribes to C:\life-os\ibis-inbox\
      → life-os 8B classifier extracts tasks, routes content
        → Tasks written to SQLite task table
          → Owner reviews completed items, nothing slips
```

**What Ibis contributes to this pipeline:** Steps 2–3 only. Everything downstream is life-os's domain.

**What Ibis does not contribute:**
- No task identification ("this sounds like an action item")
- No priority inference
- No project tagging
- No due date extraction
- No disambiguation of "I should probably..." vs "I need to by Thursday..."

All of that is life-os's job. Ibis produces raw prose and nothing more.

**Practical note for classifier tuning:** The owner will often dictate in a stream-of-consciousness style, mixing tasks, context, and ambient commentary in a single recording. The 8B model should be tuned to extract tasks even when they are embedded in narrative ("...so that reminded me I still need to finish the Ibis config module before we can test the watcher..."). Explicit trigger phrases like "todo" or "action item" may not appear.

------------------------------------------------------------------------

## Demographic Analysis: Where Ibis Falls Short and What life-os Should Know

### Journalists

**What Ibis gives them:** Local transcription of interviews. Source recordings never leave the machine.

**Where Ibis falls short in v1:**
- No speaker diarization. An interview between a journalist and a source is transcribed as a single wall of text with no speaker attribution. The journalist cannot tell who said what without reading the full transcript.
- No timestamps within the transcript. There is no way to jump to minute 14 of a 90-minute interview from the transcript alone.

**What life-os can do:** None of this is fixable downstream. The undifferentiated text is what it is until v2 diarization ships. The classifier can identify that a transcript is likely an interview (two-person conversational rhythm, Q&A structure, hedging language) and route it appropriately, but it cannot reconstruct speaker attribution.

**Easy add for Ibis (flagged for owner):** If the owner is recording interviews, naming the recording file with the source's identifier (e.g., `source-doe-interview-1.mp3`) will carry that context into the transcript filename. This is a workflow convention, not a code change.

---

### Therapists & Clinicians

**What Ibis gives them:** The only compliant option — local processing, no cloud, no third-party access to patient audio.

**Where Ibis falls short in v1:**
- No session metadata beyond the timestamp and filename. Clinical documentation workflows often require session type, patient identifier, and clinician name. None of this comes from Ibis.
- No diarization. A therapy session has a clinician and a patient. The transcript merges both voices.
- No confirmation log that data was NOT transmitted. HIPAA-sensitive users want an audit trail showing local-only processing. Ibis logs to `AppData\Roaming\Ibis\ibis.log` but this is not structured for compliance documentation.

**What life-os can do:** If the clinician names their recordings with a patient reference (anonymized or coded), the classifier can extract that from the filename embedded in the transcript header. life-os should not store patient identifiers in plain-text vault locations. The routing logic should treat clinical content as high-sensitivity and avoid writing it to summary or inbox files that might be synced or shared.

**Note for the owner personally:** These are paying customers, not the owner's own use case. life-os does not process their data — only the owner's. This entry is for product development awareness.

---

### Attorneys

**What Ibis gives them:** Local transcription of depositions, client calls, and dictated notes.

**Where Ibis falls short in v1:**
- No diarization. Depositions have an attorney, opposing counsel, a witness, and sometimes a court reporter. All voices merge.
- No timestamps. Attorneys reference recordings by timestamp when preparing briefs ("at 32:14 the witness states..."). Ibis transcripts offer no way to find specific moments.

**What life-os can do:** Same limitation as journalists — undifferentiated prose until v2. Routing logic should recognize legal content (deposition, privilege, opposing counsel, client matter) and keep it within appropriate vault boundaries.

**Easy add for Ibis (flagged for owner):** faster-whisper returns segment-level timestamps internally. Generating a plain-text transcript with paragraph-level time markers (`[00:32:14]`) is trivially implementable and would significantly raise the value of Ibis for attorneys and journalists without touching the integration contract. This is recommended for v1.

---

### Researchers

**What Ibis gives them:** IRB-compliant local processing of participant recordings.

**Where Ibis falls short in v1:**
- No diarization. Research interviews are multi-speaker.
- No confidence markers. faster-whisper returns segment-level probability scores internally. When Whisper is uncertain (technical jargon, accented speech, crosstalk), the researcher receives no signal that a word or phrase may be wrong. This is a silent accuracy problem.

**What life-os can do:** The 8B classifier should be aware that research transcripts may contain domain-specific terminology it does not recognize. Low-confidence routing (writing to the human-review inbox) is appropriate for content that contains specialized vocabulary.

**Easy add for Ibis (flagged for owner):** When average segment confidence falls below a threshold (e.g., avg_logprob < -0.5), append a one-line note to the transcript: `[Note: low-confidence segments detected — review recommended]`. This is a three-line code addition with material value for researchers and clinicians.

---

### Knowledge Workers

**What Ibis gives them:** The core use case. Voice notes become text files that land in their knowledge management system automatically.

**Where Ibis falls short in v1:**
- **M4A format not supported.** This is the most significant practical gap for this demographic. Apple Voice Memos, Google Recorder, and most modern Android voice apps default to M4A (AAC-encoded). The owner and every knowledge worker using a smartphone as their primary capture device will need to convert recordings before Ibis can process them. Ibis currently supports only MP3 and WAV.
- No structure imposed on the transcript. A ten-minute voice note containing three tasks, a project update, and a random observation arrives as a single undifferentiated block of text.

**What life-os can do:** All structuring, task extraction, classification, and routing is life-os's job. This is by design. The 8B classifier handles it.

**Easy add for Ibis (flagged for owner — high priority):** Add `.m4a` to the watched file extensions. faster-whisper handles M4A natively via its ffmpeg dependency, which is already bundled in the PyInstaller build. This is a one-line change to the file extension filter and unblocks the most common mobile capture format. This is the single highest-impact low-effort change available.

---

### Podcasters & Creators

**What Ibis gives them:** Offline transcription for show notes, captions, and repurposed content.

**Where Ibis falls short in v1:**
- No SRT/VTT output. Caption workflows require timestamped subtitle formats. Ibis produces plain prose.
- No video support. Podcasters often record video as well as audio. MP4 is not supported in v1.
- No summarization. Show notes require condensed summaries, not full transcripts.

**What life-os can do:** LLM summarization via the 8B model can generate show-note-style summaries from raw transcripts for the owner's personal use. This is a natural use of the classification pipeline. For Ibis customers, this is a v2 feature.

------------------------------------------------------------------------

## Consolidated Gap Table: What life-os Must Compensate For

These are the capabilities that Ibis does not provide in v1 and that life-os must either handle or flag as unresolvable until a future version.

| Gap | life-os compensation | Resolvable? |
|---|---|---|
| No task extraction | 8B classifier extracts tasks from prose | Yes — fully in life-os's domain |
| No routing/classification | 8B classifier handles all routing | Yes — fully in life-os's domain |
| No summarization | 8B model can summarize on ingest | Yes — for owner's use |
| No speaker diarization | Cannot compensate — prose is merged | No — wait for Ibis v2 |
| No timestamps in transcript | Cannot compensate | No — pending Ibis implementation |
| No M4A support (v1) | Cannot compensate — upstream of life-os | No — needs Ibis code change |
| No video support | Cannot compensate | No — Ibis v2 planned |
| No mobile-to-NSF-Leith sync | Cannot compensate — infrastructure gap | No — separate problem (see below) |
| Single watch folder (v1) | No multi-zone separation until v2 | Partial — classifier distinguishes zone by content |

------------------------------------------------------------------------

## The Mobile Capture Gap — An Independent Software Problem

Neither Ibis nor life-os solves the following: **how does a voice memo recorded on the owner's phone reach the Ibis Watch Folder on NSF-Leith?**

This is an infrastructure gap that sits upstream of both systems. It is not Ibis's responsibility and it is not life-os's responsibility. It requires one of the following:

| Option | Complexity | Notes |
|---|---|---|
| Manual transfer (USB / AirDrop) | None | Acceptable for low-frequency use; friction breaks the ADHD capture habit |
| Syncthing between phone and NSF-Leith | Low | Free, open-source, LAN-first sync. Phone records to a Syncthing folder; NSF-Leith Watch Folder = that folder. Near-automatic. |
| iOS Shortcut + file share | Medium | Can auto-share to a network share or cloud sync on recording completion. Fragile. |
| Companion mobile app | High | Out of scope for any current build. A future product possibility. |

**Recommended path for the owner:** Syncthing. Install on phone and NSF-Leith, point the NSF-Leith sync target at the Ibis Watch Folder. Recordings sync over LAN automatically when the phone is home. Out-of-home recordings queue and sync on return. This is a one-time setup with no ongoing friction.

This should be tracked as an infrastructure task, not a software build.

------------------------------------------------------------------------

## Recommended Ibis v1 Additions (Flagged During This Review)

The following are low-effort changes that materially improve the product before v1 ships. None break the integration contract.

| # | Change | Effort | Impact |
|---|---|---|---|
| 1 | **Add M4A to watched extensions** | 1 line | Unblocks primary mobile capture format for all demographics |
| 2 | **Add seconds to timestamp format** (`HH-MM-SS`) | 1 line | Prevents filename collision; improves audit trail |
| 3 | **Atomic write** (write to `.tmp`, then rename) | 5 lines | Required for life-os integration correctness |
| 4 | **Metadata header block** in transcript (date, source, duration) | 10 lines | Helps all professional demographics; strippable by classifier |
| 5 | **Paragraph-level timestamp markers** (`[HH:MM:SS]`) at natural segment breaks | 20 lines | High value for journalists, attorneys, researchers, podcasters |
| 6 | **Low-confidence flag** in transcript when avg confidence is poor | 10 lines | Valuable for researchers and clinicians; signals when review is needed |

Items 2 and 3 are already flagged in the main spec update backlog. Items 1, 4, 5, and 6 are new recommendations from this review.

------------------------------------------------------------------------

## What life-os Tracks About Ibis (Ibis Perspective)

life-os's execution plan registers Ibis as LLC-002. This is accurate. From Ibis's side:

- Ibis does not depend on life-os to function. It is a standalone product.
- The life-os integration is a one-field configuration (Transcripts Folder path). It requires no Ibis code changes.
- Ibis completion unblocks the owner's automated capture pipeline but does not block Ibis's commercial launch. These are independent events.
- The owner is both a customer of their own product and the developer. Design decisions that serve the owner's personal workflow are generally good product decisions, but should be validated against the broader demographic before being treated as universal.

------------------------------------------------------------------------

## Summary Table

| Item | Detail |
|---|---|
| What Ibis delivers at v1 | Plain .txt transcript, atomic write, to a configurable folder |
| File naming format | `YYYY-MM-DD_HH-MM-SS_[source-filename].txt` |
| Metadata header in transcript | Yes — date, source filename, duration (3 lines, strippable) |
| Audio formats supported | MP3, WAV (M4A recommended as easy addition) |
| Speaker attribution | None in v1 |
| Timestamps within transcript | None in v1 (paragraph markers recommended as easy addition) |
| Life-os integration complexity | One folder path in Ibis Settings |
| Atomic write | Yes — confirmed implementation requirement |
| What life-os must handle | Task extraction, classification, routing, summarization, all structure |
| What neither system handles | Mobile-to-NSF-Leith sync (Syncthing recommended) |
| v2 additions relevant to life-os | Multiple watch folders, speaker diarization, LLM summarization, video |
| Coordination trigger | Any change to transcript format, filename convention, or output folder logic |
