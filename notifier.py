import logging
from pathlib import Path

from plyer import notification

logger = logging.getLogger(__name__)

_APP_NAME = "Ibis"
_TIMEOUT  = 5  # seconds the toast stays visible


def _notify(title: str, message: str) -> None:
    try:
        notification.notify(
            title=title,
            message=message,
            app_name=_APP_NAME,
            timeout=_TIMEOUT,
        )
    except Exception:
        logger.exception("Failed to show notification: %s — %s", title, message)


def transcription_complete(audio_path: Path, transcript_path: Path) -> None:
    _notify(
        title="Transcription complete",
        message=audio_path.name,
    )


def transcription_failed(audio_path: Path, reason: str) -> None:
    _notify(
        title="Transcription failed",
        message=f"{audio_path.name}: {reason}",
    )


def watch_folder_missing(folder_path: Path) -> None:
    _notify(
        title="Ibis — Watch folder missing",
        message=f"Could not find: {folder_path}\nOpen Settings to reconfigure.",
    )


def model_load_failed(reason: str) -> None:
    _notify(
        title="Ibis — Model failed to load",
        message=reason,
    )
