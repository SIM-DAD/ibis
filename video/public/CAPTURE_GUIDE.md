# Ibis Promo Video — Asset Capture Guide

Place all captured files in this folder (`video/public/`).
The Remotion scenes reference these exact filenames.

---

## Screenshots Required

### `screenshot-setup.png`
**What:** The Ibis configuration/settings window — folder selection UI.
**How:** Launch Ibis → right-click tray icon → Settings (or however config opens).
**Show:** Watch folder path + Transcripts folder path both configured.
**Tips:** Clean desktop background. Full window visible. No personal filenames.

---

### `screenshot-watch-folder.png`
**What:** File Explorer open on the Ibis watch folder (Inbox) with an audio file inside.
**How:** Drop a test audio file (e.g., `interview.mp3`) into the watch folder, then screenshot *before* Ibis processes it.
**Show:** The folder path in the address bar, the audio file clearly visible.
**Tips:** Use a realistic filename like `interview.mp3` or `meeting-notes.m4a`. One or two files max.

---

### `screenshot-tray.png`  *(optional — used if you want a processing beat)*
**What:** The Windows 11 system tray area showing the Ibis icon while it's actively transcribing.
**How:** Drop an audio file, then immediately screenshot the bottom-right taskbar corner.
**Show:** The Ibis tray icon (ideally in an "active" state if there's a visual indicator).

---

### `screenshot-transcripts.png`
**What:** File Explorer open on the Ibis output/transcripts folder, with a `.txt` file that was just created.
**How:** After Ibis processes the test audio file, open the transcripts folder and screenshot it.
**Show:** The output `.txt` file with its full timestamped filename (e.g., `2026-03-25_14-30-00_interview.txt`).
**Tips:** File Explorer address bar showing the folder path is good.

---

### `screenshot-transcript-content.png`
**What:** The actual `.txt` transcript file open — showing the date/source/duration header, `[HH:MM:SS]` timestamps, and clean transcribed text.
**How:** Open the output `.txt` file in Notepad or VS Code, screenshot the top portion.
**Show:** At minimum: the metadata header (Date, Source, Duration) + 2-3 paragraphs of timestamped text.
**Tips:** Use a real voice recording so the transcript content looks natural. Zoom Notepad font to ~14-16pt for readability. No sensitive content.

---

## Screen Recording (optional but ideal for WorkflowShowcase)

### `recording-workflow.mp4`
**What:** A 15-20 second screen recording of the full workflow: drop audio file → wait → transcript appears.
**How:** Use Xbox Game Bar (`Win+G`) or OBS. Record at 1280×720 or 1920×1080.
**Sequence:**
1. Start recording with watch folder open in File Explorer
2. Drag + drop the audio file into the watch folder
3. Watch the tray icon (or wait)
4. Switch to the transcripts folder — show the `.txt` file appearing
5. Open the file briefly, stop recording

**If you record this:** The `WorkflowShowcase` scene can be swapped from screenshot-based to video-based.

---

## Recommended Recording Setup

- **Resolution:** 1920×1080 or 1280×720
- **Background:** Plain desktop (no icons/clutter)
- **Window size:** Maximize File Explorer so it fills the screen or close to it
- **Zoom level:** File Explorer view → Details view, at least 125% system DPI

---

## Checklist

- [ ] `screenshot-setup.png`
- [ ] `screenshot-watch-folder.png`
- [ ] `screenshot-transcripts.png`
- [ ] `screenshot-transcript-content.png`
- [ ] `screenshot-tray.png` *(optional)*
- [ ] `recording-workflow.mp4` *(optional)*
