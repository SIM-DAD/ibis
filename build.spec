# -*- mode: python ; coding: utf-8 -*-
"""
PyInstaller build spec for Ibis.

Single-folder bundle (onedir) — faster cold-start than onefile.
Run:  pyinstaller build.spec
Output: dist\Ibis\Ibis.exe
"""

import sys
from pathlib import Path

ROOT = Path(SPECPATH)
VENV = ROOT / "venv" / "Lib" / "site-packages"

# ── Data files bundled into the package ──────────────────────────────────────
datas = [
    # Whisper model (flat layout required by transcriber.py)
    (str(ROOT / "models" / "large-v3-turbo"), "models/large-v3-turbo"),

    # App icons
    (str(ROOT / "assets"), "assets"),

    # faster-whisper assets (silero VAD model, etc.)
    (str(VENV / "faster_whisper" / "assets"), "faster_whisper/assets"),

    # ctranslate2 native DLLs and support files
    (str(VENV / "ctranslate2" / "ctranslate2.dll"),  "."),
    (str(VENV / "ctranslate2" / "libiomp5md.dll"),   "."),
]

# ── Hidden imports not auto-detected by PyInstaller ──────────────────────────
hiddenimports = [
    "faster_whisper",
    "ctranslate2",
    "watchdog.observers",
    "watchdog.observers.winapi",
    "watchdog.events",
    "pystray._win32",
    "plyer.platforms.win.notification",
    "customtkinter",
    "PIL._tkinter_finder",
    "importlib_metadata",
    "importlib.metadata",
    "email",
    "email.message",
    "license",
    "license_window",
    "urllib.request",
    "urllib.parse",
    "urllib.error",
]

# ── Analysis ──────────────────────────────────────────────────────────────────
a = Analysis(
    [str(ROOT / "main.py")],
    pathex=[str(ROOT)],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=["tkinter.test", "unittest", "xmlrpc"],
    noarchive=False,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name="Ibis",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,               # UPX can trigger AV false positives — leave off
    console=False,           # no console window
    icon=str(ROOT / "assets" / "icon.ico"),
)

coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=False,
    upx_exclude=[],
    name="Ibis",
)
