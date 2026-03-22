# IBIS — PRODUCT FACT SHEET
**Version 1.0.0 | SIM DAD LLC | Confidential — Media Kit Use Only**

---

## EXECUTIVE SUMMARY

**Ibis** is a Windows desktop application that automatically transcribes voice recordings to text using local AI — with zero cloud, zero subscription, and zero ongoing internet access after installation. It watches a folder on your PC, picks up any new audio file, runs it through OpenAI's Whisper model on your own CPU, and delivers a clean, timestamped transcript. The original audio is then archived. The whole loop is silent, automatic, and completely private.

---

## THE CORE INSIGHT & NOVELTY

### Why This Exists

Every major transcription service — Otter.ai, Rev, Descript, Whisper.ai — requires you to upload your audio to their servers. For millions of professionals, this is not just an inconvenience: it is a **legal or ethical disqualifier**. A journalist cannot upload a source interview to a third-party server. A therapist cannot route patient audio through the cloud. An attorney cannot upload a privileged deposition recording to an AI service. A researcher under IRB protocol cannot process human subjects data on external infrastructure.

**Ibis eliminates this problem entirely by making the cloud unnecessary.**

### What Makes It Novel

1. **Folder-drop automation** — No app to open, no UI to manage. Drop a file in a folder and a transcript appears. This is the simplest possible workflow for voice-heavy professionals.
2. **Bundled model** — The 1.6 GB Whisper large-v3-turbo model ships inside the installer. There is no model download step, no Python installation, no CLI. It just works.
3. **CPU-only inference** — Uses `int8` quantization via CTranslate2. Runs on any modern Windows laptop with no GPU required.
4. **One-time purchase** — $24, no subscription, no account, no recurring charge. Buy it once; it runs forever.
5. **Atomic writes** — Transcripts are written to a `.tmp` file first, then atomically renamed. Downstream automation (personal knowledge management, life-os, etc.) can watch the Transcripts folder without risk of reading a partial file.
6. **Paragraph-level timestamps** — Transcripts are formatted as structured prose with `[HH:MM:SS]` paragraph markers, not raw segment dumps. Human-readable and machine-parseable.
7. **Low-confidence flagging** — When the model's average confidence score (`avg_logprob`) falls below -0.5, Ibis appends a footer flagging the transcript for manual review. No other consumer transcription tool surfaces this.
8. **Zero telemetry** — No analytics, no crash reporting, no phone-home. The app has no network code whatsoever after installation.

---

## PRODUCT IDENTITY

| Field | Value |
|---|---|
| Product Name | Ibis |
| Version | 1.0.0 |
| Company | SIM DAD LLC |
| Category | Desktop AI transcription |
| Platform | Windows 10 & 11 (x64) |
| Price — Personal | $24 one-time |
| Price — Pro (v2) | $49 one-time |
| Distribution | Lemon Squeezy |
| Internet required | No (after installation) |
| GPU required | No |
| Subscription | None |
| Telemetry | None |
| License enforcement | Unique key per purchase; local validation only; no activation server |

---

## TARGET AUDIENCE

### Primary Personas

**1. Journalists & Reporters**
- Cannot upload source interviews to third-party servers (source protection, legal liability)
- Conduct multiple interviews per day; need transcripts fast
- Often work on sensitive investigations where any cloud touch is a risk

**2. Therapists, Counselors & Clinicians**
- HIPAA prohibits PHI on unvetted third-party servers
- Session recordings are highly sensitive; local-only processing is the only safe option
- Many already record sessions with patient consent; transcription is the bottleneck

**3. Attorneys & Legal Professionals**
- Attorney-client privilege applies to audio recordings
- Depositions, client calls, and legal strategy sessions cannot be uploaded externally
- Transcripts are often needed for review within hours of recording

**4. Academic Researchers**
- IRB (Institutional Review Board) protocols often prohibit cloud processing of human subjects data
- Qualitative researchers conduct many interviews; manual transcription is a major time sink
- Needs audit trail (local logs) rather than third-party service records

**5. Knowledge Workers & ADHD Professionals**
- Voice capture is faster and more natural than typing for many people
- Auto-transcription removes the friction barrier between capturing a thought and having it in text
- Integrates with personal knowledge management systems (Obsidian, Notion, life-os) via folder watching

**6. Podcasters & Content Creators**
- Transcripts for show notes, captions, articles
- Prefer not to pay per-minute or per-file subscription rates
- Often process large backlogs of existing recordings

---

## FEATURE LIST — COMPLETE

### Transcription
- Automatic detection of new audio files in a watched folder
- Supported input formats: **MP3, WAV, M4A**
- AI model: **OpenAI Whisper large-v3-turbo** (fully bundled; no download required)
- **99 language support** — auto-detect or manual selection
- Available models: Tiny, Base, Small, Medium, Large-v3-Turbo (default), Distil-Large-v3
- CPU-only inference using `int8` quantization (no GPU required)
- Processes one file at a time (serial queue, no partial results)

### Output
- **Plain text (.txt)** — structured prose with metadata header and paragraph timestamps
- **SubRip subtitles (.srt)** — standard format with millisecond timing per segment
- **Both** — simultaneously generates .txt and .srt
- Filename format: `YYYY-MM-DD_HH-MM-SS_[original-filename].txt`
- Metadata header: Date, Source filename, Duration
- Paragraph grouping: new paragraph on >1.5 second silence gap, or every 10 segments
- Timestamp markers: `[HH:MM:SS]` at the start of each paragraph
- Low-confidence footer: appended when average model confidence < -0.5
- **Atomic writes**: `.tmp` → rename on completion (safe for downstream automation)

### File Organization
- **Watch Folder** — source directory (user-configured)
- **Completed Folder** — originals moved here after successful transcription
- **Transcripts Folder** — where .txt/.srt files are written
- Collision handling: duplicate filenames in Completed get a `_[timestamp]` suffix
- All three folders are **auto-created** if they do not exist

### Interface
- Runs silently as a **Windows system tray application**
- Three tray icon states: Watching / Paused / Processing
- Tray menu: Status label, Settings, Pause/Resume, Open Transcripts Folder, Quit
- **Settings window** (dark-mode, CustomTkinter): configure all folders, model, language, output format, startup behavior
- **First-run wizard**: Settings window opens automatically if no config exists

### Windows Integration
- **Launch at startup**: writes to `HKEY_CURRENT_USER\...\Run` registry key; removes on uncheck
- **Toast notifications**: success and failure alerts via Windows native notification system (5-second timeout)
- **Installer**: Inno Setup 6, generates `IbisSetup.exe` (~1.8–2.2 GB)
- Install location: `C:\Program Files\Ibis\`
- Start Menu shortcut group created; optional Desktop shortcut
- Clean uninstall removes all installed files; user data (AppData) preserved

### Resilience
- File locking: up to 3 retries at 5-second intervals if file is still being written
- Settle delay: 2-second wait after file detection before transcription begins
- Missing watch folder: notification shown, watcher paused, app continues running
- Transcription failure: error notification, audio left in Watch Folder, `.tmp` deleted
- Model preload: Whisper model loaded in background thread at startup (ready before first file)
- Existing files on startup: automatically enqueued (catches any files that arrived while app was off)

### Logging
- Log file: `%APPDATA%\Roaming\Ibis\ibis.log`
- Rotation: 5 MB max, 2 backups retained
- Format: `YYYY-MM-DD HH:MM:SS [LEVEL] module: message`

---

## TRANSCRIPT FORMAT — EXACT SPECIFICATION

### Filename
```
YYYY-MM-DD_HH-MM-SS_[original-filename].txt
Example: 2026-03-19_13-19-36_interview.txt
```

### File Content
```
Date: 2026-03-19 13:19:36
Source: interview.wav
Duration: 00:15:47

[00:00:00]
First paragraph of transcript text. Sentences are joined into clean prose
with no word-level timing noise.

[00:01:32]
Second paragraph begins here after a pause in the recording.

[Note: low-confidence transcription — some words may be inaccurate. Manual review recommended.]
```

### Rules
- New paragraph triggered by: silence gap > 1.5 seconds OR 10 consecutive segments
- `[HH:MM:SS]` marks the start time of the first segment in each paragraph
- Low-confidence footer: present only when `avg_logprob < -0.5`
- Encoding: UTF-8
- Line endings: standard

---

## TECHNICAL ARCHITECTURE

### Stack
| Component | Technology |
|---|---|
| Language | Python 3.11 |
| AI inference | faster-whisper + CTranslate2 |
| File watching | watchdog |
| System tray | pystray |
| Notifications | plyer (Windows native) |
| Settings UI | CustomTkinter (dark theme) |
| Packaging | PyInstaller (onedir) |
| Installer | Inno Setup 6 |

### Module Map
| Module | Role |
|---|---|
| `main.py` | Entry point; wires all components |
| `config.py` | Load/save JSON config; first-run detection |
| `transcriber.py` | Whisper inference; transcript formatting; file output |
| `watcher.py` | Watchdog integration; file queue; retry logic |
| `tray.py` | System tray icon, menu, state management |
| `settings.py` | Settings GUI window (CustomTkinter) |
| `notifier.py` | Windows toast notifications |

### Threading Model
- **Main thread**: pystray (blocking; controls app lifetime)
- **Model preload thread**: background daemon; loads Whisper on startup
- **Watchdog observer thread**: file system events
- **Worker thread**: drains job queue serially; handles retries

### IPC / Network
- **None.** No network code. No API calls. No external services. Config is a local JSON file.

### Config Location
- `%APPDATA%\Roaming\Ibis\config.json`

### Config Schema
```json
{
  "watch_folder": "...",
  "completed_folder": "...",
  "transcripts_folder": "...",
  "model_size": "large-v3-turbo",
  "language": "auto",
  "output_format": "txt",
  "launch_at_startup": false
}
```

---

## AI MODEL DETAILS

| Field | Value |
|---|---|
| Model family | OpenAI Whisper |
| Specific model | large-v3-turbo |
| Size on disk | ~1.6 GB |
| Languages | 99 |
| Device | CPU (no GPU required) |
| Quantization | int8 (via CTranslate2) |
| Inference library | faster-whisper |
| Bundled in installer | Yes — no download required |
| Internet for inference | No |

**What "large-v3-turbo" means:** This is OpenAI's latest and most efficient large-model checkpoint. It matches the accuracy of the original Whisper large-v3 while running significantly faster. It is the best Whisper model for CPU-only deployments. For reference, it outperforms the original Whisper large on most benchmarks while being usable on consumer hardware.

---

## PRIVACY ARCHITECTURE

### What Never Leaves the Machine
- Audio files (source)
- Transcript output
- Config and settings
- Logs
- Model weights (bundled)
- All inference computation

### What Goes Out
- **Nothing.** Zero network calls after installation.

### Compliance Implications
| Standard | Status |
|---|---|
| HIPAA | Compatible — PHI never leaves user's machine |
| GDPR | Compatible — user is sole data controller; no external processing |
| Attorney-client privilege | Compatible — recordings remain on privileged hardware |
| IRB / human subjects research | Compatible — no third-party data processing |
| FERPA | Compatible — student data stays local |

---

## SYSTEM REQUIREMENTS

| Requirement | Minimum | Recommended |
|---|---|---|
| OS | Windows 10 (build 17763) | Windows 11 |
| Architecture | x64 | x64 |
| RAM | 4 GB | 8 GB |
| Disk | 3 GB free (installer + app) | 5 GB |
| CPU | Any modern x64 | 4+ core |
| GPU | Not required | Not applicable |
| Internet | Not required after install | Not applicable |
| .NET / VC++ | Bundled | — |

---

## PRICING & BUSINESS MODEL

### Tiers
**Personal — $24 (one-time)**
- Watch-folder auto-transcription
- Whisper large-v3-turbo (bundled)
- 99 languages, fully offline
- MP3, WAV, M4A support
- TXT and SRT output
- Single machine
- Lifetime updates for v1.x

**Pro — $49 (one-time, v2)**
- Everything in Personal, plus:
- **Projects system** — define up to 20 named projects, each with its own Watch / Completed / Transcripts folder triplet; global model and language settings inherited by all projects
- Project name appears in all notifications and tray status
- Auto-migrates existing v1 folders into a "Default" project on first launch
- Speaker diarization (planned)
- LLM summarization of transcripts (planned)
- Custom output templates (planned)
- Video file support (planned)
- Priority support

*Pro v2.1 (planned additions):* per-project language/model override; per-project pause/resume from tray; project-level filename tagging

**Team — ~$99–$149 (one-time bundle, v3)**
- 3–5 seat license pack for small practices, research groups, and law firms
- Each seat is an independent Pro license key; no shared infrastructure required
- No license server, no internet check — preserves offline-first architecture
- Enforcement via Lemon Squeezy multi-key delivery + professional trust model
- *Rationale:* Attorneys, therapists, and researchers operate in small organizations; individual pricing creates friction for organizational adoption. A 5-seat bundle at $149 vs. 5 individual Pro purchases at $245 saves the buyer $96 while delivering 3x single-sale revenue.
- *Trigger for building:* First inbound request for multi-seat purchase, or 100 Personal sales (whichever comes first)
- *Website treatment:* "Team pricing — coming soon / contact us" card on pricing page so organizational buyers don't assume consumer-only product

*Team v3.x (future, if demand warrants):* shared project configuration templates, centralized log export, admin key revocation — requires backend work; do not build speculatively

### Model
- One-time purchase, not a subscription
- Distribution via Lemon Squeezy (5% + payment processing per sale)
- Personal loyalty upgrade path: existing Personal buyers get 50% off Pro ($24.50) when Pro launches
- Pro build trigger: 100 Personal sales — confirms market before investing in Pro features

### License Enforcement (decided)
- **Mechanism:** Unique license key generated per purchase by Lemon Squeezy; entered once on first launch; stored in `config.json`
- **Validation:** Local only — format and checksum check; no activation server, no internet call
- **Download limits:** None — buyers can re-download the installer freely (reinstalls, machine changes)
- **DRM:** None beyond the key entry step
- **Rationale:** Offline-first promise cannot coexist with an activation server. Trust-sensitive professionals (the primary audience) are not the piracy risk. Enforcement strong enough to signal "real product" without creating support burden or compromising the product's core value proposition.
- **Team enforcement:** Multi-key bundle delivery via Lemon Squeezy; honor system for seat count; professional audience's liability exposure is its own deterrent against abuse

---

## COMPETITIVE LANDSCAPE

| Product | Cloud Required | Subscription | GPU Required | Price |
|---|---|---|---|---|
| **Ibis** | **No** | **No** | **No** | **$24 once** |
| Otter.ai | Yes | Yes ($17/mo) | No | ~$204/yr |
| Rev | Yes | Yes / per-minute | No | $0.25/min |
| Whisper (raw) | No | No | Recommended | Free (no GUI) |
| MacWhisper | No | No | No | Mac only |
| Descript | Yes | Yes ($24/mo) | No | ~$288/yr |
| Fireflies.ai | Yes | Yes | No | ~$228/yr |

**Key gap Ibis fills:** There is no polished, installer-based, GUI-driven, folder-watching, offline-first Whisper wrapper for Windows with a consumer price point. MacWhisper is the closest parallel but is Mac-only. Raw Whisper requires Python expertise and CLI comfort. Ibis closes this gap for Windows users.

---

## DIFFERENTIATORS — SUMMARY

1. **100% local** — No cloud. Not "optional cloud." Not "cloud by default, local on enterprise." Local only, always.
2. **Zero setup AI** — 1.6 GB model bundled in installer. No model download, no Python, no CLI.
3. **Folder automation** — Drop a file, get a transcript. No app interaction required.
4. **One-time price** — $24 forever. No subscription to cancel, no price increases, no usage caps.
5. **Professional-grade output** — Structured prose with timestamps, not a wall of text. SRT format for video workflows.
6. **Atomic writes** — Safe for downstream automation. Transcript appears only when complete.
7. **Low-confidence flagging** — Unique quality signal. Users know when to manually review.
8. **Compliance-ready** — HIPAA, GDPR, privilege, IRB compatible by architecture, not by policy.
9. **Windows-native** — Proper installer, Start Menu, startup registry, toast notifications. Not a Python script.
10. **99 languages** — Full Whisper multilingual support, auto-detected or manually selected.

---

## RELEASE STATUS (as of 2026-03-20)

| Phase | Status |
|---|---|
| Core Python application | Complete |
| Settings UI | Complete |
| PyInstaller bundle | Complete |
| Inno Setup installer | Complete |
| Functional testing (15-item checklist) | Passed |
| V1 polish (log rotation, version, SRT, auto-folders) | Complete |
| Code signing (SSL.com EV + eSigner) | Pending purchase |
| Lemon Squeezy store setup | Pending |
| Website hosting + email capture backend | Pending |
| Launch (Product Hunt, communities, waitlist) | Pending |

---

## WEBSITE & BRAND

### Tagline Options (from index.html)
- "Your voice. Your data. Your scribe."
- "AI transcription that runs entirely on your machine — no cloud, no subscription."
- "Your recordings stay on your machine."

### Brand Colors
| Name | Hex |
|---|---|
| Primary red | #e63946 |
| Accent salmon | #ffa07a |
| Dark navy | #2c3e50 |
| Background | #f1f1f1 |

### Typography
- Font: Inter (Google Fonts)
- Design: Mobile-first, fluid, semantic HTML/CSS (no framework)

### Demo Video
- **IbisDemo**: 15-second loop (website embed) — Logo intro → folder demo → transcript appears → end card
- **IbisPitch**: 45-second pitch — Problem frame → product intro → demo → audiences → differentiators → CTA
- Built with Remotion 4 (React/TypeScript), rendered MP4 H.264

---

## QUOTES / ANGLES FOR MEDIA KIT

> "Every cloud transcription service is one subpoena, one breach, or one IRB complaint away from being unusable for the professionals who need it most."

> "Ibis doesn't ask you to trust a server you've never seen with recordings you can never take back."

> "The Whisper model that powers this costs thousands of dollars of compute to train. Ibis puts it on your laptop for $24."

> "Folder watching is a zero-learning-curve interface. If you can move a file, you can use Ibis."

> "The best transcription tool for journalists isn't the one with the slickest UI — it's the one that can never expose a source."

---

---

## ROADMAP DECISIONS LOG

*Decisions made and locked — do not re-litigate without new information.*

| Decision | Choice | Rationale |
|---|---|---|
| Filename format (v1) | Keep `YYYY-MM-DD_HH-MM-SS_[source].txt` | Universal default; never collides; works for both intentional and garbage recorder filenames |
| Filename format (v1.1 candidate) | `source_only` mode optional | Only meaningful for users who name audio files intentionally; defer until user demand surfaces |
| Pro core differentiator | Projects system (up to 20 named projects, each with independent folder triplet) | Changes Pro from "more features" to "professionals managing multiple workstreams" — stronger upgrade story |
| Pro architecture | Shared global queue + one serial worker; one Observer per project | Prevents concurrent CPU inference from multiple project watchers; model cache already shared |
| Pro config migration | Auto-promote v1 folders to "Default" project on first Pro launch | Zero friction upgrade path |
| Team pricing | ~$99–$149 for 3–5 seat bundle; trigger: first inbound request or 100 Personal sales | Addresses organizational buyers without building backend infrastructure |
| Team website treatment | "Team pricing — coming soon / contact us" card at launch | Signals organizational-readiness to buyers who would otherwise assume consumer-only |
| License enforcement | Unique LS key, local validation, no activation server, no download limits | Offline-first promise; trust-sensitive audience; support burden avoidance |
| Pro build trigger | 100 Personal sales | Confirms demand before investing |
| Personal → Pro loyalty | 50% upgrade discount ($24.50) for existing Personal buyers | Rewards early adopters; goodwill worth more than margin given up |
| Mac platform | Build after 100 Windows Personal sales — same trigger as Pro | Confirms market exists; funds $99/yr Apple Developer Program; real users to beta-test with |
| Linux platform | Skip as commercial product | 4% market; CLI-comfortable users already have faster-whisper; fragmented packaging; high support burden for negligible revenue |

---

## PLATFORM ROADMAP

### Windows (v1 — current)
Full support. The only commercial target for launch.

### macOS (planned, post-100-sales)

**Market:** ~16% global desktop, ~28–32% US — meaningfully larger for Ibis's professional personas who skew American and toward premium hardware. Competitive gap exists: MacWhisper Pro ($79.99, 8 GB RAM minimum) has limited folder-watch automation compared to what Ibis offers.

**Technical approach:**
- Core transcription stack (faster-whisper, watchdog, CustomTkinter) is cross-platform
- Replace `pystray` with `rumps` for menu bar (known M-series GIL threading conflict with pystray + CustomTkinter)
- Isolate and guard `winreg` startup-registry code in `settings.py` behind a platform check
- All other code already uses `pathlib.Path` and has no Windows-specific assumptions
- Packaging: `.dmg` drag-to-Applications install + Apple notarization (mandatory for Gatekeeper)

**Requirements before starting Mac port:**
- Apple Developer Program membership ($99/yr)
- Mac build machine (macOS required for notarization)
- 100 Windows Personal sales reached

**Estimated port scope:** ~15% of codebase needs changes (tray, startup registry, packaging/installer). Core transcription and UI logic unchanged.

### Linux (not planned for commercial release)

Skip. CLI tools already serve the technically capable Linux audience. Fragmented packaging (`.deb`, `.rpm`, AppImage, Flatpak), inconsistent tray behavior across desktop environments, and an open-source culture that resists paying for GUI wrappers make the commercial ROI poor. If community demand surfaces after Windows/Mac launch, consider an open-source or community-maintained build — not a supported commercial product.

---

*Fact sheet last updated 2026-03-20. All technical details verified against source code. Roadmap decisions reflect session discussions.*
