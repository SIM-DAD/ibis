"""
Ibis — main entry point.
Wires config, watcher, notifier, settings, and tray together.
"""
import logging
import sys
import threading
from logging.handlers import RotatingFileHandler
from pathlib import Path

import config as cfg
import license as lic
import notifier
import transcriber
from license_window import LicenseWindow
from settings import SettingsWindow
from tray import TrayApp
from watcher import Watcher

# ---------------------------------------------------------------------------
# Logging — writes to AppData\Roaming\Ibis\ibis.log and stderr
# ---------------------------------------------------------------------------

def _setup_logging():
    log_path = cfg.CONFIG_PATH.parent / "ibis.log"
    log_path.parent.mkdir(parents=True, exist_ok=True)

    fmt = logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s")

    file_handler = RotatingFileHandler(
        log_path, maxBytes=5 * 1024 * 1024, backupCount=2, encoding="utf-8"
    )
    file_handler.setFormatter(fmt)

    stream_handler = logging.StreamHandler(sys.stderr)
    stream_handler.setFormatter(fmt)

    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    root_logger.addHandler(file_handler)
    root_logger.addHandler(stream_handler)


logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

class IbisApp:
    def __init__(self):
        self._config = cfg.load()
        cfg.ensure_folders(self._config)
        self._watcher: Watcher | None = None
        self._tray: TrayApp | None = None

    def run(self):
        logger.info("Ibis starting")

        # ── License check ────────────────────────────────────────────────
        valid, reason = lic.check()
        if not valid:
            logger.info("License check failed (%s) — showing activation window", reason)
            activated = threading.Event()
            quit_requested = threading.Event()

            def _on_activated():
                activated.set()

            def _on_quit():
                quit_requested.set()

            LicenseWindow(
                on_activated=_on_activated,
                on_quit=_on_quit,
                reason=reason,
            ).show()

            if quit_requested.is_set():
                logger.info("User quit at license window")
                sys.exit(0)

        # ── Normal startup ───────────────────────────────────────────────
        self._tray = TrayApp(
            config=self._config,
            on_pause_resume=self._handle_pause_resume,
            on_open_settings=self._handle_open_settings,
            on_quit=self._handle_quit,
        )

        # Kick off model load in background so it's ready before the first file arrives
        transcriber.preload(
            self._config["model_size"],
            on_error=lambda reason: notifier.model_load_failed(reason),
        )

        if cfg.is_first_run():
            logger.info("First run — opening Settings")
            self._open_settings_and_start()
        else:
            self._start_watcher()

        # Blocks until tray.stop() is called
        self._tray.start()

    # ------------------------------------------------------------------

    def _start_watcher(self):
        self._watcher = Watcher(
            config=self._config,
            on_complete=self._on_transcription_complete,
            on_error=self._on_transcription_error,
            on_folder_missing=self._on_folder_missing,
            on_start=self._on_transcription_start,
        )
        self._watcher.start()

    def _stop_watcher(self):
        if self._watcher:
            self._watcher.stop()
            self._watcher = None

    # ------------------------------------------------------------------

    def _handle_pause_resume(self):
        if self._watcher and self._watcher.is_running():
            self._stop_watcher()
            logger.info("Watcher paused")
        else:
            self._start_watcher()
            logger.info("Watcher resumed")

    def _handle_open_settings(self):
        win = SettingsWindow(self._config, on_save=self._on_settings_saved)
        win.show()

    def _open_settings_and_start(self):
        def after_save(new_config):
            self._config = new_config
            self._start_watcher()

        win = SettingsWindow(self._config, on_save=after_save)
        win.show()

    def _handle_quit(self):
        logger.info("Ibis shutting down")
        self._stop_watcher()
        if self._tray:
            self._tray.stop()

    # ------------------------------------------------------------------

    def _on_settings_saved(self, new_config: dict):
        logger.info("Settings saved — restarting watcher")
        self._config = new_config
        self._stop_watcher()
        self._start_watcher()
        if self._tray:
            self._tray.update_config(new_config)

    def _on_transcription_start(self, audio_path: Path):
        if self._tray:
            self._tray.set_processing(True)

    def _on_transcription_complete(self, audio_path: Path, transcript_path: Path):
        if self._tray:
            self._tray.set_processing(False)
        notifier.transcription_complete(audio_path, transcript_path)

    def _on_transcription_error(self, audio_path: Path, reason: str):
        if self._tray:
            self._tray.set_processing(False)
        notifier.transcription_failed(audio_path, reason)

    def _on_folder_missing(self, folder_path: Path):
        notifier.watch_folder_missing(folder_path)


# ---------------------------------------------------------------------------

def main():
    _setup_logging()
    try:
        IbisApp().run()
    except Exception:
        logger.exception("Unhandled exception — Ibis exiting")
        sys.exit(1)


if __name__ == "__main__":
    main()
