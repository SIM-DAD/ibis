import logging
import sys
from datetime import datetime, timedelta
from pathlib import Path

from faster_whisper import WhisperModel

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Model path — resolves correctly both in development and PyInstaller bundle
# ---------------------------------------------------------------------------

def _model_base() -> Path:
    if getattr(sys, "frozen", False):
        return Path(sys._MEIPASS)
    return Path(__file__).parent


def _model_path(model_size: str) -> str:
    local = _model_base() / "models" / model_size
    if local.exists():
        return str(local)
    # Fall back to letting faster-whisper download by name
    return model_size


# ---------------------------------------------------------------------------
# Module-level model cache — load once, reuse across jobs
# ---------------------------------------------------------------------------

_model_cache: dict[str, WhisperModel] = {}


def get_model(model_size: str) -> WhisperModel:
    if model_size not in _model_cache:
        path = _model_path(model_size)
        logger.info("Loading model '%s' from %s", model_size, path)
        _model_cache[model_size] = WhisperModel(
            path, device="cpu", compute_type="int8"
        )
        logger.info("Model loaded")
    return _model_cache[model_size]


def preload(model_size: str, on_error=None) -> None:
    """
    Eagerly load the model in a background thread so it is ready in memory
    before the first file arrives. on_error(reason) is called if loading fails.
    """
    import threading

    def _load():
        try:
            get_model(model_size)
        except Exception as exc:
            logger.exception("Model preload failed")
            if on_error:
                on_error(str(exc))

    t = threading.Thread(target=_load, daemon=True, name="ibis-model-preload")
    t.start()


# ---------------------------------------------------------------------------
# Transcript formatting helpers
# ---------------------------------------------------------------------------

_LOW_CONFIDENCE_THRESHOLD = -0.5
_PARAGRAPH_GAP_SECONDS = 1.5
_PARAGRAPH_MAX_SEGMENTS = 10


def _format_ts(seconds: float) -> str:
    """Convert float seconds to HH:MM:SS string."""
    td = timedelta(seconds=int(seconds))
    total = int(td.total_seconds())
    h, rem = divmod(total, 3600)
    m, s = divmod(rem, 60)
    return f"{h:02d}:{m:02d}:{s:02d}"


def _format_srt_ts(seconds: float) -> str:
    """Convert float seconds to SRT timestamp HH:MM:SS,mmm."""
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    ms = int((seconds % 1) * 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def _build_srt(segments: list) -> str:
    """Build a SubRip (.srt) subtitle string from segment list."""
    if not segments:
        return ""
    lines = []
    for i, seg in enumerate(segments, 1):
        lines.append(str(i))
        lines.append(f"{_format_srt_ts(seg.start)} --> {_format_srt_ts(seg.end)}")
        lines.append(seg.text.strip())
        lines.append("")
    return "\n".join(lines)


def _build_transcript(segments: list, source_name: str, duration: float) -> str:
    """
    Build the full transcript string including metadata header,
    paragraph-grouped body with [HH:MM:SS] markers, and optional
    low-confidence footer.
    """
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    header = (
        f"Date: {now}\n"
        f"Source: {source_name}\n"
        f"Duration: {_format_ts(duration)}\n"
    )

    if not segments:
        return header + "\n[No speech detected]\n"

    # --- paragraph grouping ---
    paragraphs = []
    current: list[str] = []
    current_start: float = segments[0].start
    prev_end: float = segments[0].end

    for i, seg in enumerate(segments):
        gap = seg.start - prev_end
        if current and (gap > _PARAGRAPH_GAP_SECONDS or len(current) >= _PARAGRAPH_MAX_SEGMENTS):
            paragraphs.append((current_start, " ".join(current)))
            current = []
            current_start = seg.start
        current.append(seg.text.strip())
        prev_end = seg.end

    if current:
        paragraphs.append((current_start, " ".join(current)))

    body_lines = []
    for start_time, text in paragraphs:
        body_lines.append(f"[{_format_ts(start_time)}]")
        body_lines.append(text)
        body_lines.append("")

    body = "\n".join(body_lines).strip()

    # --- low-confidence footer ---
    avg_logprob = sum(s.avg_logprob for s in segments) / len(segments)
    footer = ""
    if avg_logprob < _LOW_CONFIDENCE_THRESHOLD:
        logger.warning(
            "Low-confidence transcription (avg_logprob=%.3f) for %s",
            avg_logprob, source_name,
        )
        footer = (
            "\n\n[Note: low-confidence transcription — "
            "some words may be inaccurate. Manual review recommended.]"
        )

    return f"{header}\n{body}{footer}\n"


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def transcribe(
    audio_path: Path,
    transcripts_folder: Path,
    model_size: str,
    language: str,
    output_format: str = "txt",
) -> Path:
    """
    Transcribe audio_path and write output file(s) to transcripts_folder.

    output_format: "txt" | "srt" | "both"

    Writes atomically (.tmp → rename). Returns the Path of the primary output
    file (.txt if available, otherwise .srt).
    Raises on failure — caller is responsible for error handling.
    """
    logger.info("Transcribing %s (format: %s)", audio_path.name, output_format)

    model = get_model(model_size)

    lang = None if language == "auto" else language
    segments_gen, info = model.transcribe(str(audio_path), language=lang)
    segments = list(segments_gen)  # consume generator once

    duration = info.duration if info.duration else (segments[-1].end if segments else 0.0)

    ts = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    stem = f"{ts}_{audio_path.stem}"

    transcripts_folder.mkdir(parents=True, exist_ok=True)
    primary_path: Path | None = None

    def _write(name: str, content: str) -> Path:
        tmp = transcripts_folder / (name + ".tmp")
        final = transcripts_folder / name
        tmp.write_text(content, encoding="utf-8")
        tmp.rename(final)
        logger.info("Written: %s", final)
        return final

    if output_format in ("txt", "both"):
        txt = _build_transcript(segments, audio_path.name, duration)
        primary_path = _write(f"{stem}.txt", txt)

    if output_format in ("srt", "both"):
        srt = _build_srt(segments)
        srt_path = _write(f"{stem}.srt", srt)
        if primary_path is None:
            primary_path = srt_path

    return primary_path  # type: ignore[return-value]
