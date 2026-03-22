import logging
import os
import subprocess
import sys
from pathlib import Path

import pystray
from PIL import Image

import config as cfg

logger = logging.getLogger(__name__)


def _asset(name: str) -> Path:
    base = Path(sys._MEIPASS) if getattr(sys, "frozen", False) else Path(__file__).parent
    return base / "assets" / name


def _load_icon(name: str) -> Image.Image:
    path = _asset(name)
    if path.exists():
        return Image.open(path)
    # Fallback: 1×1 transparent image so the tray doesn't crash
    logger.warning("Icon not found: %s", path)
    return Image.new("RGBA", (64, 64), (0, 0, 0, 0))


class TrayApp:
    """
    Manages the system tray icon and menu.

    Callbacks injected at construction keep tray.py decoupled from the
    rest of the app — no direct imports of watcher, settings, etc.

    Expected callbacks:
        on_pause_resume()   — toggle the watcher on/off
        on_open_settings()  — open the settings window
        on_quit()           — clean shutdown
    """

    def __init__(self, config: dict, on_pause_resume, on_open_settings, on_quit):
        self._config = config
        self._on_pause_resume = on_pause_resume
        self._on_open_settings = on_open_settings
        self._on_quit = on_quit
        self._paused = False
        self._icon: pystray.Icon | None = None

    # ------------------------------------------------------------------

    def start(self):
        """Build and run the tray icon (blocks — call from main thread)."""
        self._icon = pystray.Icon(
            name="Ibis",
            icon=_load_icon("icon.ico"),
            title=f"Ibis {cfg.APP_VERSION}",
            menu=self._build_menu(),
        )
        self._icon.run()

    def stop(self):
        if self._icon:
            self._icon.stop()

    def set_paused(self, paused: bool):
        self._paused = paused
        self._refresh_icon()
        self._refresh_menu()

    def set_processing(self, processing: bool):
        """Swap to a visual indicator while a transcription is running."""
        icon_name = "icon_processing.ico" if processing else ("icon_paused.ico" if self._paused else "icon.ico")
        if self._icon:
            img = _load_icon(icon_name)
            self._icon.icon = img

    def update_config(self, config: dict):
        self._config = config
        self._refresh_menu()

    # ------------------------------------------------------------------

    def _watch_folder_label(self) -> str:
        folder = self._config.get("watch_folder", "")
        if folder:
            return f"Watching: {folder}"
        return "Watch folder not set"

    def _build_menu(self) -> pystray.Menu:
        pause_label = "Resume" if self._paused else "Pause"
        return pystray.Menu(
            pystray.MenuItem(self._watch_folder_label(), None, enabled=False),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem("Settings", self._handle_settings),
            pystray.MenuItem(pause_label, self._handle_pause_resume),
            pystray.MenuItem("Open Transcripts Folder", self._handle_open_transcripts),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem("Quit", self._handle_quit),
        )

    def _refresh_menu(self):
        if self._icon:
            self._icon.menu = self._build_menu()

    def _refresh_icon(self):
        if self._icon:
            icon_name = "icon_paused.ico" if self._paused else "icon.ico"
            self._icon.icon = _load_icon(icon_name)

    # ------------------------------------------------------------------

    def _handle_settings(self, icon, item):
        self._on_open_settings()

    def _handle_pause_resume(self, icon, item):
        self._paused = not self._paused
        self._refresh_icon()
        self._refresh_menu()
        self._on_pause_resume()

    def _handle_open_transcripts(self, icon, item):
        folder = self._config.get("transcripts_folder", "")
        if folder and Path(folder).exists():
            os.startfile(folder)
        else:
            logger.warning("Transcripts folder not set or missing: %s", folder)

    def _handle_quit(self, icon, item):
        self._on_quit()
