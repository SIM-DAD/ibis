import logging
import sys
import winreg
from pathlib import Path
from tkinter import filedialog

import customtkinter as ctk
from PIL import Image, ImageChops

import config as cfg

logger = logging.getLogger(__name__)

ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("blue")

# ---------------------------------------------------------------------------
# Brand tokens — only override where we need brand colour; let CTk handle
# backgrounds so the window matches the user's system dark palette
# ---------------------------------------------------------------------------
C_RED    = "#e63946"
C_RED_H  = "#c1121f"
C_NAVY   = "#2c3e50"
C_TEXT   = "#f0f0f0"
C_MUTED  = "#888888"
C_BORDER = "#444444"

# ---------------------------------------------------------------------------
# Data
# ---------------------------------------------------------------------------
_LANGUAGES = [
    ("Auto-detect", "auto"), ("English", "en"),  ("Spanish", "es"),
    ("French", "fr"),        ("German", "de"),    ("Italian", "it"),
    ("Portuguese", "pt"),    ("Dutch", "nl"),     ("Polish", "pl"),
    ("Russian", "ru"),       ("Japanese", "ja"),  ("Chinese", "zh"),
    ("Korean", "ko"),
]

_MODELS = [
    ("Tiny  —  ~75 MB",                        "tiny"),
    ("Base  —  ~145 MB",                       "base"),
    ("Small  —  ~500 MB",                      "small"),
    ("Medium  —  ~1.5 GB",                     "medium"),
    ("✦  Large-v3-Turbo  —  ~1.6 GB",          "large-v3-turbo"),
    ("Distil-Large-v3  —  ~640 MB  (EN only)", "distil-large-v3"),
]

_OUTPUT_FORMATS = [
    ("Plain Text (.txt)",       "txt"),
    ("SubRip Subtitles (.srt)", "srt"),
    ("Both (.txt and .srt)",    "both"),
]

_STARTUP_KEY  = r"Software\Microsoft\Windows\CurrentVersion\Run"
_STARTUP_NAME = "Ibis"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _set_startup(enabled: bool, exe_path: str = "") -> None:
    try:
        key = winreg.OpenKey(
            winreg.HKEY_CURRENT_USER, _STARTUP_KEY, 0, winreg.KEY_SET_VALUE
        )
        if enabled and exe_path:
            winreg.SetValueEx(key, _STARTUP_NAME, 0, winreg.REG_SZ, f'"{exe_path}"')
        else:
            try:
                winreg.DeleteValue(key, _STARTUP_NAME)
            except FileNotFoundError:
                pass
        winreg.CloseKey(key)
    except Exception:
        logger.exception("Failed to update startup registry key")


def _load_icon_transparent(path: Path, size: tuple) -> ctk.CTkImage | None:
    """Load the app icon and strip near-white pixels so it renders cleanly
    on dark backgrounds without a white bounding box."""
    try:
        img = Image.open(path).convert("RGBA")
        data = img.getdata()
        cleaned = [
            (r, g, b, 0) if (r > 230 and g > 230 and b > 230) else (r, g, b, a)
            for r, g, b, a in data
        ]
        img.putdata(cleaned)
        img = img.resize(size, Image.LANCZOS)
        return ctk.CTkImage(img, size=size)
    except Exception:
        logger.warning("Could not load icon from %s", path)
        return None


def _section_label(parent, text: str):
    ctk.CTkLabel(
        parent, text=text.upper(),
        font=("Inter", 13, "bold"),
        text_color=C_RED, anchor="w",
    ).pack(fill="x", padx=24, pady=(20, 6))


def _card(parent) -> ctk.CTkFrame:
    """A card that uses CTk's default dark frame colour — no manual override."""
    outer = ctk.CTkFrame(parent, corner_radius=12, border_width=1, border_color=C_BORDER)
    outer.pack(fill="x", padx=20, pady=(0, 4))
    inner = ctk.CTkFrame(outer, fg_color="transparent", corner_radius=0)
    inner.pack(fill="x", padx=22, pady=20)
    return inner


def _field_label(parent, text: str):
    ctk.CTkLabel(
        parent, text=text,
        font=("Inter", 12), text_color=C_MUTED, anchor="w",
    ).pack(fill="x", pady=(8, 3))


def _combo(parent, values: list) -> ctk.CTkComboBox:
    return ctk.CTkComboBox(
        parent, values=values, state="readonly",
        border_color=C_BORDER, border_width=1,
        button_color=C_BORDER, button_hover_color="#666666",
        text_color=C_TEXT,
        font=("Inter", 12), corner_radius=8, height=42,
    )


# ---------------------------------------------------------------------------
# Settings window
# ---------------------------------------------------------------------------
class SettingsWindow:
    def __init__(self, current_config: dict, on_save=None):
        self._config  = current_config.copy()
        self._on_save = on_save
        self._root: ctk.CTk | None = None
        self._img_refs = []

    def show(self):
        if self._root and self._root.winfo_exists():
            self._root.lift()
            return
        self._build()
        self._root.mainloop()

    # ------------------------------------------------------------------

    def _build(self):
        root = ctk.CTk()
        root.title("Ibis — Settings")
        root.resizable(False, False)
        self._root = root

        ico = Path(__file__).parent / "assets" / "icon.ico"
        if ico.exists():
            try:
                root.iconbitmap(str(ico))
            except Exception:
                pass

        # ── Hero header ─────────────────────────────────────────────────
        hero = ctk.CTkFrame(root, fg_color="#ffffff", corner_radius=0, height=120)
        hero.pack(fill="x")
        hero.pack_propagate(False)

        hero_content = ctk.CTkFrame(hero, fg_color="transparent", corner_radius=0)
        hero_content.place(relx=0.5, rely=0.5, anchor="center")

        logo_img = _load_icon_transparent(ico, (72, 72)) if ico.exists() else None
        if logo_img:
            self._img_refs.append(logo_img)
            ctk.CTkLabel(
                hero_content, image=logo_img, text="",
                fg_color="transparent",
            ).pack(side="left", padx=(0, 14))

        wordmark = ctk.CTkFrame(hero_content, fg_color="transparent", corner_radius=0)
        wordmark.pack(side="left")

        ctk.CTkLabel(
            wordmark, text="Ibis",
            font=("Inter", 26, "bold"),
            text_color=C_RED, fg_color="transparent", anchor="w",
        ).pack(anchor="w")

        ctk.CTkLabel(
            wordmark, text="Settings",
            font=("Inter", 12),
            text_color="#555555", fg_color="transparent", anchor="w",
        ).pack(anchor="w")

        # ── Folders ─────────────────────────────────────────────────────
        _section_label(root, "Folders")
        folder_card = _card(root)

        self._watch_var = ctk.StringVar(value=self._config["watch_folder"])
        _field_label(folder_card, "Watch Folder")
        self._folder_row(folder_card, self._watch_var)

        self._completed_var = ctk.StringVar(value=self._config["completed_folder"])
        _field_label(folder_card, "Completed Folder")
        self._folder_row(folder_card, self._completed_var)

        self._transcripts_var = ctk.StringVar(value=self._config["transcripts_folder"])
        _field_label(folder_card, "Transcripts Folder")
        self._folder_row(folder_card, self._transcripts_var)

        # ── Transcription ───────────────────────────────────────────────
        _section_label(root, "Transcription")
        trans_card = _card(root)

        _field_label(trans_card, "Model")
        self._model_cb = _combo(trans_card, [l for l, _ in _MODELS])
        self._model_cb.set(
            next((l for l, v in _MODELS if v == self._config["model_size"]), _MODELS[4][0])
        )
        self._model_cb.pack(fill="x", pady=(0, 6))

        _field_label(trans_card, "Language")
        self._lang_cb = _combo(trans_card, [l for l, _ in _LANGUAGES])
        self._lang_cb.set(
            next((l for l, v in _LANGUAGES if v == self._config["language"]), _LANGUAGES[0][0])
        )
        self._lang_cb.pack(fill="x", pady=(0, 6))

        _field_label(trans_card, "Output Format")
        self._format_cb = _combo(trans_card, [l for l, _ in _OUTPUT_FORMATS])
        self._format_cb.set(
            next((l for l, v in _OUTPUT_FORMATS if v == self._config.get("output_format", "txt")), _OUTPUT_FORMATS[0][0])
        )
        self._format_cb.pack(fill="x")

        # ── Startup ─────────────────────────────────────────────────────
        _section_label(root, "Startup")
        startup_card = _card(root)

        toggle_row = ctk.CTkFrame(startup_card, fg_color="transparent", corner_radius=0)
        toggle_row.pack(fill="x")

        label_col = ctk.CTkFrame(toggle_row, fg_color="transparent", corner_radius=0)
        label_col.pack(side="left", fill="x", expand=True)

        ctk.CTkLabel(
            label_col, text="Launch at startup",
            font=("Inter", 13, "bold"), text_color=C_TEXT, anchor="w",
        ).pack(anchor="w")

        ctk.CTkLabel(
            label_col,
            text="Start Ibis automatically when Windows boots",
            font=("Inter", 11), text_color=C_MUTED, anchor="w",
        ).pack(anchor="w", pady=(2, 0))

        self._startup_var = ctk.BooleanVar(value=self._config["launch_at_startup"])
        ctk.CTkSwitch(
            toggle_row, text="",
            variable=self._startup_var,
            onvalue=True, offvalue=False,
            progress_color=C_RED,
            button_color=C_TEXT,
            button_hover_color="#cccccc",
            fg_color=C_BORDER,
            width=52, height=26,
        ).pack(side="right", padx=(12, 0))

        # ── Footer ──────────────────────────────────────────────────────
        ctk.CTkFrame(root, fg_color=C_BORDER, height=1, corner_radius=0).pack(
            fill="x", pady=(22, 0)
        )

        btn_bar = ctk.CTkFrame(root, corner_radius=0, height=72)
        btn_bar.pack(fill="x")
        btn_bar.pack_propagate(False)

        ctk.CTkButton(
            btn_bar, text="Save  →",
            font=("Inter", 13, "bold"),
            fg_color=C_RED, hover_color=C_RED_H, text_color=C_TEXT,
            corner_radius=8, height=42, width=130,
            command=self._save,
        ).pack(side="right", padx=(0, 22), pady=15)

        ctk.CTkButton(
            btn_bar, text="Cancel",
            font=("Inter", 12),
            hover_color="#555555",
            text_color=C_TEXT,
            border_color=C_BORDER, border_width=1,
            corner_radius=8, height=42, width=110,
            command=root.destroy,
        ).pack(side="right", padx=(0, 8), pady=15)

        ctk.CTkLabel(
            btn_bar, text=f"v{cfg.APP_VERSION}",
            font=("Inter", 11), text_color=C_MUTED,
        ).pack(side="left", padx=(22, 0))

        root.bind("<Return>", lambda _: self._save())
        root.bind("<Escape>", lambda _: root.destroy())

        root.update_idletasks()
        w, h = 560, root.winfo_reqheight()
        x = (root.winfo_screenwidth()  - w) // 2
        y = (root.winfo_screenheight() - h) // 2
        root.geometry(f"{w}x{h}+{x}+{y}")

    # ------------------------------------------------------------------

    def _folder_row(self, parent, var: ctk.StringVar):
        row = ctk.CTkFrame(parent, fg_color="transparent", corner_radius=0)
        row.pack(fill="x", pady=(0, 4))

        ctk.CTkEntry(
            row, textvariable=var,
            font=("Inter", 12), text_color=C_TEXT,
            border_color=C_BORDER, border_width=1,
            corner_radius=8, height=42,
        ).pack(side="left", fill="x", expand=True)

        ctk.CTkButton(
            row, text="Browse…",
            font=("Inter", 11),
            hover_color="#555555",
            text_color=C_TEXT,
            border_color=C_BORDER, border_width=1,
            corner_radius=8, height=42, width=100,
            command=lambda v=var: self._browse(v),
        ).pack(side="left", padx=(8, 0))

    def _browse(self, var: ctk.StringVar):
        current = var.get()
        initial = current if Path(current).exists() else str(Path.home())
        folder = filedialog.askdirectory(initialdir=initial)
        if folder:
            var.set(folder)

    def _save(self):
        model_value = next(
            (v for l, v in _MODELS         if l == self._model_cb.get()),
            self._config["model_size"]
        )
        lang_value = next(
            (v for l, v in _LANGUAGES      if l == self._lang_cb.get()),
            self._config["language"]
        )
        format_value = next(
            (v for l, v in _OUTPUT_FORMATS if l == self._format_cb.get()),
            self._config.get("output_format", "txt")
        )

        new_config = {
            "watch_folder":       self._watch_var.get(),
            "completed_folder":   self._completed_var.get(),
            "transcripts_folder": self._transcripts_var.get(),
            "model_size":         model_value,
            "language":           lang_value,
            "output_format":      format_value,
            "launch_at_startup":  self._startup_var.get(),
        }

        cfg.ensure_folders(new_config)
        cfg.save(new_config)

        exe = sys.executable if getattr(sys, "frozen", False) else ""
        _set_startup(new_config["launch_at_startup"], exe)

        if self._on_save:
            self._on_save(new_config)

        if self._root:
            self._root.destroy()
