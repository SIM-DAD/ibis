# Ibis: Your Intelligent Background Scribe
## Project Specification for Claude Code

---

## Overview

Build a Windows desktop application called **Ibis** that runs silently in the system tray, watches a user-defined folder for new MP3, WAV, or M4A files, transcribes them locally using OpenAI Whisper, saves the transcript as a `.txt` file, and moves the original audio into a "completed" folder. The app requires no cloud connection and no ongoing subscription. It is intended to be packaged and sold as a one-time purchase via Lemon Squeezy.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Language | Python 3.11 | Whisper is Python-native; large ecosystem for tray apps |
| Transcription | `faster-whisper` | Best Python runtime for CPU inference; supports distil-whisper and all OpenAI Whisper model variants |
| Folder watching | `watchdog` | Mature, cross-platform file system event library |
| System tray | `pystray` | Lightweight Windows tray icon with menu support |
| Settings UI | `tkinter` | Bundled with Python; no extra dependency |
| Notifications | `win10toast` or `plyer` | Native Windows toast notifications |
| Packaging | `PyInstaller` | Bundles everything into a single `.exe` |
| Installer | `Inno Setup` | Produces a standard Windows installer with uninstaller |

---

## Project Structure

```
whisperwatch/
├── main.py                  # Entry point; starts tray + watcher
├── watcher.py               # Folder watching logic (watchdog)
├── transcriber.py           # Whisper transcription logic
├── settings.py              # Settings window (tkinter)
├── config.py                # Load/save config from JSON
├── notifier.py              # Windows toast notifications
├── tray.py                  # System tray icon and menu
├── config.json              # User config (auto-created on first run)
├── assets/
│   └── icon.ico             # App icon for tray and installer
├── models/                  # Bundled Whisper model lives here
│   └── (large-v3-turbo model files)
├── requirements.txt
├── build.spec               # PyInstaller spec file
└── installer/
    └── setup.iss            # Inno Setup installer script
```

---

## Core Features

### 1. System Tray App

- The app launches minimized to the Windows system tray on startup.
- The tray icon menu includes:
  - **Status** (e.g., "Watching: C:\Users\...\VoiceMemos") — non-clickable label
  - **Settings** — opens the settings window
  - **Pause / Resume** — toggles the folder watcher on/off
  - **Open Transcripts Folder** — opens the transcripts output folder in Explorer
  - **Quit** — exits the app cleanly
- The tray icon should visually indicate state: watching (normal icon), paused (greyed icon), processing (animated or badge).

### 2. Folder Watcher

- Use `watchdog` to monitor the configured **Watch Folder** for new files.
- Trigger on `on_created` and `on_moved` events (covers both new files and files moved into the folder).
- Only process files with extensions `.mp3`, `.wav`, or `.m4a` (case-insensitive). M4A is the default format for Apple Voice Memos and most Android voice recorder apps; faster-whisper handles it natively via ffmpeg.
- Wait briefly (2 seconds) after a file appears before processing, to ensure the file has finished writing.
- If a file is already in the Watch Folder when the app starts, process it immediately.

### 3. Transcription Pipeline

- Use `faster-whisper` with the **large-v3-turbo** model bundled locally inside the app.
- Run transcription in a background thread so the tray remains responsive.
- Transcription steps:
  1. Detect new audio file in Watch Folder.
  2. Transcribe using faster-whisper. Collect all segments (each segment includes text, start time, end time, and `avg_logprob`).
  3. Build the transcript content (see **Transcript Format** below).
  4. Write the transcript atomically: write to `[filename].txt.tmp` in the Transcripts Folder first, then rename to the final `.txt`. This prevents downstream file watchers (e.g., life-os) from reading a partially-written file.
  5. Move the original audio file to the **Completed Folder**.
  6. Show a Windows toast notification: "Transcription complete: [filename]".
- Transcript filename format: `YYYY-MM-DD_HH-MM-SS_[original-filename].txt`
  - Example: `2025-03-16_09-45-32_voicenote.txt`
  - Seconds precision is required to prevent filename collision for recordings in the same minute.
- If transcription fails, log the error and show a failure notification. Do not move the audio file. Remove the `.tmp` file if it exists.

### Transcript Format

Every transcript file begins with a 3-line metadata header, followed by a blank line, followed by the transcript body:

```
Date: 2025-03-16 09:45:32
Source: voicenote.mp3
Duration: 00:04:12

[transcript body]
```

The transcript body is formatted as follows:

- Segments are grouped into paragraphs. A new paragraph begins when the gap between two consecutive segments exceeds 1.5 seconds, or every 10 segments at most, whichever comes first.
- Each paragraph is preceded by a timestamp marker in the format `[HH:MM:SS]` indicating the start time of the first segment in that paragraph.
- Example:

```
[00:00:00]
So the main thing I wanted to capture today is that we need to finish the config module
before we can start testing the watcher. That's the blocker right now.

[00:00:18]
Also reminder to follow up with the accountant about the Q1 filing. That needs to happen
before end of month.
```

- If the average `avg_logprob` across all segments is below `-0.5`, append the following line after the transcript body (separated by a blank line):

```
[Note: low-confidence transcription — some words may be inaccurate. Manual review recommended.]
```

This threshold (agreed with life-os PM in confirmed spec) surfaces recordings where Whisper struggled (heavy accent, background noise, domain-specific terminology) without flagging normal transcriptions.

### 4. Settings Window

Open via the tray menu. Built with `tkinter`. Contains:

- **Watch Folder** — folder path input + Browse button
- **Completed Folder** — folder path input + Browse button
- **Transcripts Folder** — folder path input + Browse button
- **Model Size** — dropdown: Tiny, Base, Small, Medium, Large-v3-Turbo (default), Distil-Large-v3 (English only)
- **Language** — dropdown: Auto-detect (default), English, Spanish, French, German, and other major Whisper-supported languages
- **Launch at Windows startup** — checkbox (adds/removes registry key)
- **Save** and **Cancel** buttons

All settings persist to `config.json` in the user's `AppData\Roaming\Ibis\` directory.

### 5. Config File

`config.json` schema:

```json
{
  "watch_folder": "C:\\Users\\Username\\VoiceMemos\\Inbox",
  "completed_folder": "C:\\Users\\Username\\VoiceMemos\\Completed",
  "transcripts_folder": "C:\\Users\\Username\\VoiceMemos\\Transcripts",
  "model_size": "large-v3-turbo",
  "language": "auto",
  "launch_at_startup": false
}
```

On first launch, if no config exists, show the Settings window automatically and prompt the user to configure their folders before watching begins.

### 6. Windows Startup

If "Launch at Windows startup" is enabled, write the following registry key:

```
HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run
Name: Ibis
Value: "C:\path\to\Ibis.exe"
```

Remove the key if the option is unchecked.

---

## Error Handling

| Scenario | Behavior |
|---|---|
| Watch Folder does not exist | Show warning notification; pause watcher |
| Audio file is locked / still writing | Retry after 5 seconds, up to 3 times |
| Transcription model fails to load | Show error dialog on startup |
| Transcription fails mid-file | Log error; show failure toast; leave audio in Watch Folder; delete `.tmp` file if present |
| Completed or Transcripts folder missing | Auto-create on first use |

All errors should be logged to `AppData\Roaming\Ibis\ibis.log`.

---

## Packaging with PyInstaller

Create `build.spec` configured to:

- Bundle everything into a single folder (not a single `.exe`) for faster startup.
- Include the `models/` directory containing the large-v3-turbo model files.
- Include `assets/icon.ico`.
- Set the app name to `Ibis`.
- Hide the console window (`console=False`).

Build command:
```bash
pyinstaller build.spec
```

Output will be in `dist/Ibis/`.

---

## Installer with Inno Setup

`installer/setup.iss` should:

- Set app name: `Ibis`
- Set default install directory: `C:\Program Files\Ibis`
- Include all files from `dist/Ibis/`
- Create a Start Menu shortcut
- Create an optional Desktop shortcut
- Include an uninstaller
- Set the installer icon to `assets/icon.ico`
- After install, optionally launch the app

---

## Python Dependencies

`requirements.txt`:

```
faster-whisper
watchdog
pystray
Pillow
plyer
pyinstaller
```

> Note: `tkinter` is included with Python and does not need to be listed. `Pillow` is required by `pystray` for icon rendering.

---

## Model Bundling

The default model is **large-v3-turbo** (~1.6 GB on disk), OpenAI's own streamlined variant of Whisper large-v3 (released Oct 2024). It achieves near-identical accuracy to large-v3 (~7.4% WER vs ~6.8%), runs 5-8x faster, and supports all 99 Whisper languages — making it the best all-around choice for a multilingual product.

Before building, download the model and place it in `models/large-v3-turbo/`:

```bash
python -c "
from faster_whisper import WhisperModel
model = WhisperModel('large-v3-turbo', download_root='./models')
"
```

In `transcriber.py`, always load the model from the local path:

```python
from faster_whisper import WhisperModel

MODEL_PATH = "./models/large-v3-turbo"  # Relative to the bundled app

model = WhisperModel(MODEL_PATH, device="cpu", compute_type="int8")
```

Using `compute_type="int8"` gives a meaningful speed boost on CPU with negligible accuracy loss.

**Model size reference for the Settings dropdown:**

| Config value | Model | Disk size | Languages | Notes |
|---|---|---|---|---|
| `tiny` | Whisper tiny | ~75 MB | 99 | Fastest; lowest accuracy |
| `base` | Whisper base | ~145 MB | 99 | Fast; low accuracy |
| `small` | Whisper small | ~500 MB | 99 | Good balance for weak hardware |
| `medium` | Whisper medium | ~1.5 GB | 99 | Better accuracy |
| `large-v3-turbo` | Whisper large-v3-turbo | ~1.6 GB | 99 | **Default.** Best accuracy/speed balance; fully multilingual |
| `distil-large-v3` | Distil-large-v3 | ~640 MB | English only | Fastest option; English-only users who want smallest footprint |

---

## Concurrency Notes

- The folder watcher runs in a `watchdog` observer thread.
- Each transcription job runs in its own `threading.Thread`.
- The tray icon runs in the main thread via `pystray`.
- Use a `threading.Lock` to prevent two files from being transcribed simultaneously if desired, or a `queue.Queue` to serialize transcription jobs.

---

## Implementation Order

Build and test in this order:

1. `config.py` — load/save settings
2. `transcriber.py` — transcribe a single file, confirm output
3. `watcher.py` — detect new files, call transcriber
4. `notifier.py` — show Windows toast on completion
5. `tray.py` — system tray icon and menu
6. `settings.py` — settings window with save/load
7. `main.py` — wire everything together
8. Test end-to-end with real MP3, WAV, and M4A files
9. Package with PyInstaller
10. Build installer with Inno Setup

---

## v1 Scope Boundaries

**Platform:** Windows 10 and 11 only. Ibis v1 is a single-machine desktop application. It does not include mobile recording, mobile sync, or cross-device coordination. Users recording on a phone must transfer audio to the Watch Folder manually (or via a sync tool such as Syncthing) before Ibis can process it.

**Watch folders:** v1 supports exactly one Watch Folder. Multiple watch folders are a v2 Pro feature.

---

## Out of Scope (v1)

The following are intentionally excluded from the first version to keep scope manageable:

- Speaker diarization (who said what)
- LLM summarization of transcripts
- Support for video files (MP4, MOV, MKV)
- Cloud transcription fallback
- Multi-language translation (transcribe only, not translate)
- A full GUI window beyond the settings panel

These are natural candidates for a paid v2 upgrade.

---

## Notes for Claude Code

- Use `pathlib.Path` throughout instead of `os.path` string manipulation.
- Prefer `logging` over `print` statements for all diagnostic output.
- The app must handle being run from both the development environment and the PyInstaller bundle. Use `sys._MEIPASS` to detect the bundled context and resolve asset/model paths accordingly.
- Do not hard-code any folder paths. Everything must be read from `config.json`.
- Keep each module focused and independently testable.
- Always write transcript files atomically: write to `[name].txt.tmp`, then `Path.rename()` to the final `.txt`. Never write directly to the final filename — downstream file watchers may pick up a partial file.
- The transcript body uses paragraph grouping with `[HH:MM:SS]` markers. Build this from the segment list returned by faster-whisper, using `segment.start`, `segment.end`, and `segment.avg_logprob`.
- Duration in the transcript header is derived from the last segment's `end` time, formatted as `HH:MM:SS`. If no segments are returned, write `00:00:00`.
