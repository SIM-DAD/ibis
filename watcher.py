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
_SETTLE_DELAY = 2    # seconds to wait after detection before processing
_RETRY_DELAY  = 5    # seconds between retries on a locked file
_MAX_RETRIES  = 3


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


class Watcher:
    """
    Watches a folder for new audio files and transcribes them serially.

    Callbacks:
        on_complete(audio_path, transcript_path) — called on success
        on_error(audio_path, message)            — called on failure
        on_folder_missing(folder_path)           — called if watch folder absent at start
    """

    def __init__(self, config: dict, on_complete=None, on_error=None, on_folder_missing=None, on_start=None):
        self._config = config
        self._on_complete = on_complete
        self._on_error = on_error
        self._on_folder_missing = on_folder_missing
        self._on_start = on_start

        self._queue: queue.Queue = queue.Queue()
        self._observer: Observer | None = None
        self._worker_thread: threading.Thread | None = None
        self._stop_event = threading.Event()

    # ------------------------------------------------------------------

    def start(self):
        watch_folder = Path(self._config["watch_folder"])

        if not watch_folder.exists():
            logger.warning("Watch folder missing: %s", watch_folder)
            if self._on_folder_missing:
                self._on_folder_missing(watch_folder)
            return

        handler = _AudioEventHandler(self._queue)
        self._observer = Observer()
        self._observer.schedule(handler, str(watch_folder), recursive=False)
        self._observer.start()

        self._stop_event.clear()
        self._worker_thread = threading.Thread(target=self._worker, daemon=True, name="ibis-worker")
        self._worker_thread.start()

        self._enqueue_existing(watch_folder)
        logger.info("Watching %s", watch_folder)

    def stop(self):
        self._stop_event.set()
        if self._observer and self._observer.is_alive():
            self._observer.stop()
            self._observer.join()
        self._observer = None
        logger.info("Watcher stopped")

    def is_running(self) -> bool:
        return self._observer is not None and self._observer.is_alive()

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
