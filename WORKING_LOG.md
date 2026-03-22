# Ibis — Working Log

A running log of what has been done, what's been decided, and what comes next. Updated at the end of each phase to ensure continuity across sessions.

---

## Phase 0: Setup & Orientation — 2026-03-19 ✓

- Project moved from Google Drive to `E:\Projects\SIM-DAD\Ibis`.
- Reviewed all existing materials: spec, prerequisites doc, marketing site, icons.
- Updated `external-prerequisites.md` to remove stale Google Drive paths.
- Created this working log.

---

## Inter-System Briefing — 2026-03-19 ✓

- Reviewed `life-os-Ibis-project-summary.md`; produced `ibis-to-life-os-briefing.md`.
- Confirmed spec received: `ibis-pm-confirmed-spec.md`. One discrepancy resolved (low-confidence threshold `-0.6` → `-0.5`).
- Six spec improvements identified and incorporated (see below).
- No further inter-system coordination required before v1 ships.

### Spec decisions locked
- Transcript filename: `YYYY-MM-DD_HH-MM-SS_[original-filename].txt`
- Transcript header: 3-line block — Date, Source, Duration
- Atomic write: `.tmp` → rename on completion
- Paragraph-grouped body with `[HH:MM:SS]` markers
- Low-confidence flag when `avg_logprob < -0.5`
- Watched extensions: `.mp3`, `.wav`, `.m4a`
- v1 scope: single watch folder, Windows only, no mobile sync
- Mobile sync (Syncthing) is product docs only — owner uses a physical Olympus/OM System recorder

---

## Phase 1: Core Python Modules — 2026-03-19 ✓

All seven modules written, integrated, and confirmed working against real audio.

| File | Role |
|---|---|
| `config.py` | Load/save `AppData\Roaming\Ibis\config.json`; defaults; `is_first_run()` |
| `transcriber.py` | faster-whisper transcription; transcript format; atomic write; eager model preload |
| `watcher.py` | watchdog observer; queue worker; 2s settle delay; 3× retry on locked file; processes existing files at startup |
| `notifier.py` | plyer toast wrappers — complete / failed / folder missing / model error |
| `tray.py` | pystray icon + menu; pause/resume; icon state variants (normal/paused/processing) |
| `settings.py` | CustomTkinter window; Inter font; brand colors; all config fields; Browse buttons; Windows startup registry |
| `main.py` | IbisApp wiring; logging to `ibis.log` + stderr; eager model preload at startup |

### Known issues fixed during Phase 1
- `transcriber` not imported in `main.py` — fixed.
- Watch folder must exist at launch time; if created after launch, use Pause → Resume from tray to restart watcher without relaunching the app.

### Prerequisites confirmed
- Python 3.11.9 active interpreter ✓
- `models/large-v3-turbo/` created via `snapshot_download` ✓
- `venv` created; all dependencies installed via `requirements.txt` ✓
- `assets/icon.ico` copied from `img/icon.ico` ✓

---

## Settings UI Redesign — 2026-03-19 ✓

Migrated from basic tkinter to CustomTkinter with full brand alignment.

- Framework: CustomTkinter (CTk) dark mode, CTk default dark frame colors
- Font: Inter (confirmed installed on system; matches website)
- Colors: `#e63946` red, `#2c3e50` navy hero header, `#f0f0f0` text, `#888` muted, `#444` borders
- Hero header: white background (matches icon), Ibis wordmark in red, "Settings" subtitle in `#555555`
- Section labels: Inter 13px bold, red, uppercase
- Field labels: Inter 12px, muted
- Startup toggle: CTkSwitch with red progress color
- Save button: `"Save  →"` (no emoji)
- Window: 560px wide, centered on screen

---

## Marketing Assets — 2026-03-19 ✓

### Remotion video project (`video/`)
Two compositions built and rendered:

| File | Duration | Purpose |
|---|---|---|
| `video/out/ibis-demo.mp4` | 15 s | Homepage autoplay loop |
| `video/out/ibis-pitch.mp4` | 45 s | Full pitch / Product Hunt / launch |

**15s flow:** Brand intro → file drops into Watch Folder → Ibis processes silently → Transcripts folder shows `.txt` file → transcript preview → end card

**45s flow:** Problem frame (cloud = bad) → brand intro → workflow demo → audience cards (6 personas) → 3 differentiators → end card with pricing

**Stack:** Remotion 4, React/TypeScript, Inter font, 1280×720 @ 30fps

### Website (`index.html`) ✓
- `video/out/ibis-demo.mp4` embedded as autoplay/muted/loop `<video>` replacing the placeholder frame
- Email form placeholder updated to `hello@simdadllc.com`
- All brand tokens consistent with app settings UI

---

## Phase 2: End-to-End Testing — 2026-03-19 ✓

All tests passed. One bug caught and fixed during this phase.

### Bug fixed
- `set_processing(True)` was never called — watcher had no `on_start` callback. Added `on_start` parameter to `Watcher.__init__`, fired in `_process()` before transcription begins, wired in `main.py` via `_on_transcription_start()`.

### Test checklist — all passed ✓
- [x] MP3 file → transcript appears in Transcripts folder, audio moves to Completed
- [x] WAV file → same
- [x] M4A file → same
- [x] Transcript format correct: 3-line header, `[HH:MM:SS]` markers, filename `YYYY-MM-DD_HH-MM-SS_[name].txt`
- [x] Transcript lands in `C:\life-os\ibis-inbox\` when Transcripts Folder is set to that path
- [x] Toast notification fires on completion
- [x] Toast notification fires on failure (corrupt/empty file)
- [x] Settings window: all fields save and reload correctly
- [x] Settings window: changing Watch Folder restarts watcher on Save
- [x] Pause → Resume from tray stops and restarts the watcher
- [x] Open Transcripts Folder tray item opens Explorer
- [x] Windows startup registry key added/removed correctly with checkbox
- [x] Two files dropped simultaneously — processed serially, no collision
- [x] File with same name as existing Completed file — gets timestamp suffix, no overwrite
- [x] Low-confidence recording produces `[Note: ...]` footer
- [x] `ibis.log` captures all events correctly

### UI assets confirmed ✓
- [x] `assets/icon_paused.ico`
- [x] `assets/icon_processing.ico`

---

## Phase 3: PyInstaller Packaging — 2026-03-19 ✓

- [x] `build.spec` written — single-folder bundle, model + assets included, `console=False`
- [x] Build succeeded: `dist/Ibis/Ibis.exe` (~1.9 GB with bundled model)
- [x] Smoke test passed — tray icon, transcription, settings all confirmed working from bundle

### Bug fixed during build
- `email` excluded too aggressively — `importlib.metadata` (used by tqdm/faster-whisper) depends on it. Removed `email` and `html` from excludes; added `importlib_metadata` and `importlib.metadata` to `hiddenimports`.

---

## Phase 4: Inno Setup Installer — 2026-03-19 ✓

- [x] `installer/setup.iss` written — lzma2 compression, admin install, Start Menu + optional desktop shortcut, optional startup registry entry, uninstaller, taskkill on uninstall
- [x] Built `installer/Output/IbisSetup.exe` — 474 MB (compressed from 1.9 GB)
- [x] Full install → transcription → uninstall flow tested and passed
- [x] No files left behind after uninstall confirmed

---

## Phase 5: Code Signing — _not started_

- [ ] Purchase code signing certificate
  - Certum OV (~$100/yr) — reduces SmartScreen friction
  - EV cert (~$300/yr) — eliminates SmartScreen warning entirely (recommended for paid software)
- [ ] Sign `dist/Ibis/Ibis.exe` with `signtool.exe`
- [ ] Sign `installer/Output/IbisSetup.exe` with `signtool.exe`
- [ ] Run both through VirusTotal — PyInstaller EXEs commonly trigger false positives
  - If flagged: submit to AV vendors for whitelisting (takes 1–5 days)
- [ ] Test signed installer on a clean Windows 10 VM and a clean Windows 11 VM (no Python, no venv)

---

## Phase 6: Store & Payment Setup — _not started_

- [ ] Create Lemon Squeezy account / product listing
  - Personal tier: $24 one-time, single machine
  - Pro waitlist: $49 (capture email only — no charge until v2 ships)
- [ ] Configure post-purchase delivery:
  - Download link to signed `IbisSetup.exe`
  - License key system (if enforcing per-machine activation — decide: yes/no)
  - Purchase confirmation email template
- [ ] Configure Lemon Squeezy webhook or email for order notifications
- [ ] Test full purchase → download → install flow end-to-end
- [ ] Add real Lemon Squeezy checkout URL to website CTA buttons (currently point to `#notify`)

---

## Phase 7: Website & Email Infrastructure — _not started_

- [ ] Wire email capture form to a real backend:
  - Option A: Lemon Squeezy waitlist (built-in)
  - Option B: ConvertKit / MailerLite free tier
  - Option C: simple Formspree endpoint (fastest)
- [ ] Remove `onsubmit="return false;"` from the form once backend is live
- [ ] Add OG image (`og:image` meta tag) for social sharing previews — currently missing
- [ ] Add Twitter/X card image
- [ ] Choose and configure hosting:
  - Option A: GitHub Pages (free, static)
  - Option B: Netlify (free tier, form handling built in)
  - Option C: Vercel (free tier)
- [ ] Point domain to host (confirm domain is owned/registered)
- [ ] Add HTTPS / SSL (automatic on Netlify/Vercel/GitHub Pages)
- [ ] Decide on video hosting strategy:
  - Current: `video/out/ibis-demo.mp4` served as a static file (fine for low traffic)
  - At scale: host on Cloudflare R2 or Bunny.net CDN, update `src` in index.html
- [ ] Set up Google Analytics or Plausible for launch traffic tracking

---

## Phase 8: Launch — _not started_

- [ ] Send launch email to waitlist
- [ ] Post on Product Hunt (schedule for Tuesday–Thursday morning ET for best visibility)
  - Tagline, description, gallery screenshots, demo video (`ibis-pitch.mp4`)
  - Hunter + makers listed
- [ ] Post announcement on relevant communities:
  - r/windows, r/productivity, r/selfhosted, r/speechrecognition
  - Hacker News "Show HN"
  - Twitter/X, LinkedIn
- [ ] Notify life-os PM that v1 has shipped (triggers life-os integration documentation update)
- [ ] Monitor Lemon Squeezy dashboard + email for first purchases
- [ ] Have support email ready (currently `support@simdadllc.com` per earlier docs)

---

## v2 Coordination Triggers (notify life-os PM before shipping)
- Multiple watch folders
- Speaker diarization output format
- Built-in LLM summarization added to transcript output
