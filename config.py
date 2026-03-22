import json
import logging
import os
from pathlib import Path

logger = logging.getLogger(__name__)

APP_VERSION = "1.0.0"

CONFIG_PATH = Path(os.environ["APPDATA"]) / "Ibis" / "config.json"

_home = Path.home()

DEFAULT_CONFIG = {
    "watch_folder":       str(_home / "VoiceMemos" / "Inbox"),
    "completed_folder":   str(_home / "VoiceMemos" / "Completed"),
    "transcripts_folder": str(_home / "VoiceMemos" / "Transcripts"),
    "model_size":         "large-v3-turbo",
    "language":           "auto",
    "output_format":      "txt",
    "launch_at_startup":  False,
}


def load() -> dict:
    """Load config from disk. Missing keys fall back to defaults."""
    if not CONFIG_PATH.exists():
        logger.info("No config found at %s — using defaults", CONFIG_PATH)
        return DEFAULT_CONFIG.copy()
    try:
        with CONFIG_PATH.open("r", encoding="utf-8") as f:
            data = json.load(f)
        # Fill in any keys added in newer versions
        merged = DEFAULT_CONFIG.copy()
        merged.update(data)
        return merged
    except Exception:
        logger.exception("Failed to read config — using defaults")
        return DEFAULT_CONFIG.copy()


def save(config: dict) -> None:
    """Write config to disk, creating the directory if needed."""
    try:
        CONFIG_PATH.parent.mkdir(parents=True, exist_ok=True)
        with CONFIG_PATH.open("w", encoding="utf-8") as f:
            json.dump(config, f, indent=2)
        logger.info("Config saved to %s", CONFIG_PATH)
    except Exception:
        logger.exception("Failed to save config")


def is_first_run() -> bool:
    """True if no config file exists yet (triggers Settings window on startup)."""
    return not CONFIG_PATH.exists()


def ensure_folders(config: dict) -> None:
    """Create watch, completed, and transcripts folders if they don't exist."""
    for key in ("watch_folder", "completed_folder", "transcripts_folder"):
        folder = config.get(key, "")
        if folder:
            try:
                Path(folder).mkdir(parents=True, exist_ok=True)
            except Exception:
                logger.warning("Could not create folder: %s", folder)
