import logging
import queue
import threading
import time
from pathlib import Path

from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer

import transcriber

logger = logging.getLogger(__name__)

WATCHED_EXTENSIONS = {".mp3", ".wav", ".m4a"}
_SETTLE_DELAY   = 2    # seconds to wait after detection before processing
_RETRY_DELAY    = 5    # seconds between retries on a locked file
_MAX_RETRIES    = 3

# ---------------------------------------------------------------------------
# Windows device-change monitor (removable device support)
# ---------------------------------------------------------------------------

try:
    import win32api
    import win32con
    import win32gui
    _WIN32_AVAILABLE = True
except ImportError:
    _WIN32_AVAILABLE = False

_WM_DEVICECHANGE          = 0x0219
_DBT_DEVICEARRIVAL        = 0x8000
_DBT_DEVICEREMOVECOMPLETE = 0x8004


class _DeviceMonitor:
    """
    Hidden message-only window that listens for WM_DEVICECHANGE events.
    Fires on_arrival() / on_removal() on any storage device connection change.
    Runs its own message-pump thread — no polling.
    """

    def __init__(self, on_arrival, on_removal):
        self._on_arrival  = on_arrival
        self._on_removal  = on_removal
        self._thread: threading.Thread | None = None
        self._thread_id:  int | None = None

    def start(self) -> bool:
        """Start the monitor. Returns False if pywin32 is unavailable."""
        if not _WIN32_AVAILABLE:
            logger.warning("pywin32 not available — removable device monitoring disabled")
            return False
        self._thread = threading.Thread(
            target=self._run, daemon=True, name="ibis-device-monitor"
        )
        self._thread.start()
        return True

    def stop(self):
        if self._thread_id is not None:
            try:
                win32api.PostThreadMessage(self._thread_id, win32con.WM_QUIT, 0, 0)
            except Exception:
                pass
        if self._thread:
            self._thread.join(timeout=2)
            self._thread = None
            self._thread_id = None

    def is_alive(self) -> bool:
        return self._thread is not None and self._thread.is_alive()

    # ------------------------------------------------------------------

    def _run(self):
        self._thread_id = win32api.GetCurrentThreadId()

        def wnd_proc(hwnd, msg, wparam, lparam):
            if msg == _WM_DEVICECHANGE:
                if wparam == _DBT_DEVICEARRIVAL:
                    try:
                        self._on_arrival()
                    except Exception:
                        logger.exception("Error in device-arrival callback")
                elif wparam == _DBT_DEVICEREMOVECOMPLETE:
                    try:
                        self._on_removal()
                    except Exception:
                        logger.exception("Error in device-removal callback")
            return win32gui.DefWindowProc(hwnd, msg, wparam, lparam)

        wc = win32gui.WNDCLASS()
        wc.lpfnWndProc = wnd_proc
        wc.lpszClassName = "IbisDeviceMonitor"
        wc.hInstance = win32api.GetModuleHandle(None)

        try:
            atom = win32gui.RegisterClass(wc)
        except Exception:
            atom = wc.lpszClassName  # class already registered

        try:
            hwnd = win32gui.CreateWindow(
                atom, "", 0, 0, 0, 0, 0,
                win32con.HWND_MESSAGE, 0, win32api.GetModuleHandle(None), None,
            )
        except Exception:
            logger.exception("Could not create device-monitor window — removable device detection unavailable")
            return

        win32gui.PumpMessages()   # blocks until WM_QUIT posted to this thread

        try:
            win32gui.DestroyWindow(hwnd)
            win32gui.UnregisterClass(wc.lpszClassName, win32api.GetModuleHandle(None))
        except Exception:
            pass


# ---------------------------------------------------------------------------
# Audio event handler
# ---------------------------------------------------------------------------

class _AudioEventHandler(FileSystemEventHandler):
    def __init__(self, job_queue: queue.Queue):
        self._queue = job_queue

    def on_created(self, event):
        if not event.is_directory:
            self._enqueue(Path(event.src_path))

    def on_moved(self, event):
        if not event.is_directory:
            self._enqueue(Path(event.dest_path))

    def _enqueue(self, path: Path):
        if path.suffix.lower() in WATCHED_EXTENSIONS:
            logger.info("Detected: %s", path.name)
            self._queue.put(path)


# ---------------------------------------------------------------------------
# Watcher
# ---------------------------------------------------------------------------

class Watcher:
    """
    Watches a folder for new audio files and transcribes them serially.

    Removable device support: when config["removable_device"] is True, Ibis
    listens for Windows device-connection events (WM_DEVICECHANGE) instead of
    reporting an error on a missing folder. The observer starts automatically
    when the device appears and stops cleanly when it is removed.

    Callbacks:
        on_complete(audio_path, transcript_path) — called on success
        on_error(audio_path, message)            — called on failure
        on_folder_missing(folder_path)           — called if folder absent at startup (non-removable only)
        on_start(audio_path)                     — called when transcription begins
        on_device_connected(folder_path)         — called when removable device is connected
        on_device_disconnected(folder_path)      — called when removable device is removed
    """

    def __init__(self, config: dict, on_complete=None, on_error=None,
                 on_folder_missing=None, on_start=None,
                 on_device_connected=None, on_device_disconnected=None):
        self._config                 = config
        self._on_complete            = on_complete
        self._on_error               = on_error
        self._on_folder_missing      = on_folder_missing
        self._on_start               = on_start
        self._on_device_connected    = on_device_connected
        self._on_device_disconnected = on_device_disconnected

        self._queue:          queue.Queue             = queue.Queue()
        self._observer:       Observer | None         = None
        self._device_monitor: _DeviceMonitor | None   = None
        self._worker_thread:  threading.Thread | None = None
        self._stop_event = threading.Event()
        self._lock       = threading.Lock()

    # ------------------------------------------------------------------

    def start(self):
        watch_folder     = Path(self._config["watch_folder"])
        removable_device = self._config.get("removable_device", False)

        self._stop_event.clear()

        self._worker_thread = threading.Thread(
            target=self._worker, daemon=True, name="ibis-worker"
        )
        self._worker_thread.start()

        if removable_device:
            self._device_monitor = _DeviceMonitor(
                on_arrival=self._on_device_arrival,
                on_removal=self._on_device_removal,
            )
            self._device_monitor.start()
            if watch_folder.exists():
                self._start_observer(watch_folder)
            else:
                logger.info("Removable device not connected — waiting: %s", watch_folder)
        else:
            if not watch_folder.exists():
                logger.warning("Watch folder missing: %s", watch_folder)
                if self._on_folder_missing:
                    self._on_folder_missing(watch_folder)
                return
            self._start_observer(watch_folder)

    def stop(self):
        self._stop_event.set()
        self._stop_observer()
        if self._device_monitor:
            self._device_monitor.stop()
            self._device_monitor = None
        logger.info("Watcher stopped")

    def is_running(self) -> bool:
        if self._stop_event.is_set():
            return False
        observer_alive = self._observer is not None and self._observer.is_alive()
        monitor_alive  = self._device_monitor is not None and self._device_monitor.is_alive()
        return observer_alive or monitor_alive

    # ------------------------------------------------------------------

    def _start_observer(self, folder: Path):
        handler = _AudioEventHandler(self._queue)
        obs = Observer()
        obs.schedule(handler, str(folder), recursive=False)
        obs.start()
        with self._lock:
            self._observer = obs
        self._enqueue_existing(folder)
        logger.info("Watching %s", folder)

    def _stop_observer(self):
        with self._lock:
            obs, self._observer = self._observer, None
        if obs and obs.is_alive():
            obs.stop()
            obs.join()

    def _on_device_arrival(self):
        """Called from the device monitor thread when any device is connected."""
        if self._stop_event.is_set():
            return
        watch_folder = Path(self._config["watch_folder"])
        if not watch_folder.exists():
            return  # Not our device
        with self._lock:
            already_watching = self._observer is not None and self._observer.is_alive()
        if already_watching:
            return
        logger.info("Device connected: %s", watch_folder)
        self._start_observer(watch_folder)
        if self._on_device_connected:
            self._on_device_connected(watch_folder)

    def _on_device_removal(self):
        """Called from the device monitor thread when any device is removed."""
        if self._stop_event.is_set():
            return
        watch_folder = Path(self._config["watch_folder"])
        with self._lock:
            observer_was_alive = self._observer is not None and self._observer.is_alive()
        if not observer_was_alive:
            return
        if watch_folder.exists():
            return  # A different device was removed; ours is still there
        logger.info("Device removed: %s", watch_folder)
        self._stop_observer()
        if self._on_device_disconnected:
            self._on_device_disconnected(watch_folder)

    # ------------------------------------------------------------------

    def _enqueue_existing(self, folder: Path):
        for f in sorted(folder.iterdir()):
            if f.is_file() and f.suffix.lower() in WATCHED_EXTENSIONS:
                logger.info("Queuing existing file: %s", f.name)
                self._queue.put(f)

    def _worker(self):
        while not self._stop_event.is_set():
            try:
                audio_path = self._queue.get(timeout=1)
            except queue.Empty:
                continue
            try:
                time.sleep(_SETTLE_DELAY)
                self._process(audio_path)
            finally:
                self._queue.task_done()

    def _process(self, audio_path: Path):
        transcripts_folder = Path(self._config["transcripts_folder"])
        completed_folder   = Path(self._config["completed_folder"])
        model_size         = self._config["model_size"]
        language           = self._config["language"]
        output_format      = self._config.get("output_format", "txt")

        if self._on_start:
            self._on_start(audio_path)

        for attempt in range(1, _MAX_RETRIES + 1):
            try:
                transcript_path = transcriber.transcribe(
                    audio_path=audio_path,
                    transcripts_folder=transcripts_folder,
                    model_size=model_size,
                    language=language,
                    output_format=output_format,
                )
                completed_folder.mkdir(parents=True, exist_ok=True)
                dest = completed_folder / audio_path.name
                # Avoid collision if a file with the same name already exists
                if dest.exists():
                    dest = completed_folder / f"{audio_path.stem}_{int(time.time())}{audio_path.suffix}"
                audio_path.rename(dest)
                logger.info("Moved %s → %s", audio_path.name, completed_folder)

                if self._on_complete:
                    self._on_complete(audio_path, transcript_path)
                return

            except PermissionError:
                if attempt < _MAX_RETRIES:
                    logger.warning(
                        "File locked, retry %d/%d in %ds: %s",
                        attempt, _MAX_RETRIES, _RETRY_DELAY, audio_path.name,
                    )
                    time.sleep(_RETRY_DELAY)
                else:
                    msg = f"File still locked after {_MAX_RETRIES} attempts."
                    logger.error("%s: %s", msg, audio_path.name)
                    if self._on_error:
                        self._on_error(audio_path, msg)

            except Exception as exc:
                logger.exception("Transcription failed: %s", audio_path.name)
                if self._on_error:
                    self._on_error(audio_path, str(exc))
                return
