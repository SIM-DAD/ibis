# Ibis — External Prerequisites

Everything below must be prepared **before or during** the build, and cannot be created by Claude Code.

---

## Software to Install on Your Machine

| # | Item | Notes |
|---|---|---|
| 1 | **Python 3.11** | Must be exactly 3.11 for best PyInstaller + faster-whisper compatibility. Download from python.org |
| 2 | **Inno Setup 6** | Free Windows installer builder. Required for Phase 6. Download from jrsoftware.org |
| 3 | **Git** | For version control. Likely already installed |

---

## Design Assets to Create

| # | Item | Spec | Notes |
|---|---|---|---|
| 4 | **`assets/icon.ico`** | Required | The app's primary icon used in the tray, Start Menu, and installer. Must be `.ico` format. Recommend including multiple sizes (16×16, 32×32, 48×48, 256×256) in the same `.ico` file. Claude Code can generate tinted/greyed variants programmatically from this base using Pillow |

### Color Choices:
- bg: #f1f1f1
- text: #262626
- acc1: #e63946
- acc2: #ffa07a
- acc3: #2c3e50




---

## Data / Model Download (Run Once Before Build)

| # | Item | How |
|---|---|---|
| 5 | **large-v3-turbo model files** (~1.6 GB) | Run the command below after installing dependencies — must be done before the PyInstaller build |

**Note:** The project previously lived on Google Drive (which blocked symlinks). It is now at `E:\Projects\SIM-DAD\Ibis`. Use `huggingface_hub.snapshot_download` with `local_dir=` to copy model files into the expected flat layout:

```python
python -c "
from huggingface_hub import snapshot_download
snapshot_download(
    repo_id='mobiuslabsgmbh/faster-whisper-large-v3-turbo',
    local_dir='./models/large-v3-turbo'
)
print('Done.')
"
```

Run this from the project root (`E:\Projects\SIM-DAD\Ibis`). The model files are already present in HuggingFace cache format at `models/models--mobiuslabsgmbh--faster-whisper-large-v3-turbo/snapshots/0a363e9161cbc7ed1431c9597a8ceaf0c4f78fcf/`, so this re-download will be near-instant (served from local cache).

After completion, `models/large-v3-turbo/` will contain:
```
config.json
model.bin
preprocessor_config.json
tokenizer.json
vocabulary.json
```

In `transcriber.py`, load the model from this path:
```python
model = WhisperModel("./models/large-v3-turbo", device="cpu", compute_type="int8")
```

> **Python version note:** Python 3.11.9 is installed and confirmed as the active `python` interpreter in this project directory (2026-03-19). No version switching needed.

---

## Business / Distribution (Before Launch)

| # | Item | Notes |
|---|---|---|
| 6 | **Lemon Squeezy account + product listing** | Create the product, set price, configure license key delivery if desired |
| 7 | **Code signing certificate** | Strongly recommended. Without it, Windows SmartScreen will warn buyers "Unknown publisher." Options: Certum (~$100/yr), DigiCert, or Sectigo. EV certificates eliminate the SmartScreen warning entirely but cost more |
| 8 | **`signtool.exe` setup** | Comes with Windows SDK. Used to sign the `.exe` and installer after build. Requires the certificate from item 7 |

---

## Optional but Recommended

| # | Item | Notes |
|---|---|---|
| 9 | **VirusTotal scan after build** | PyInstaller EXEs commonly trigger false-positive AV flags. Submit to VirusTotal before releasing; if flagged, may need to submit to AV vendors for whitelisting |
| 10 | **Test machine running stock Windows 10/11** | Verify the packaged `.exe` works on a clean system without Python installed |

---

## Critical Path

Items **1, 4, and 5** are blockers for the build. Items **2 and 6–8** can be done in parallel while coding is underway.
