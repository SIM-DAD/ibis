"""
Ibis license activation window.
Shown on first launch or when no valid license is found.
Blocks until the user activates successfully or quits.
"""
import logging
import threading
from pathlib import Path

import customtkinter as ctk

import license as lic

logger = logging.getLogger(__name__)

ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("blue")

# Brand tokens — match settings.py
C_RED    = "#e63946"
C_RED_H  = "#c1121f"
C_TEXT   = "#f0f0f0"
C_MUTED  = "#888888"
C_BORDER = "#444444"
C_GREEN  = "#2a9d5c"


class LicenseWindow:
    """
    License activation window.

    Args:
        on_activated: called (no args) when activation succeeds — app continues.
        on_quit:      called (no args) when user clicks Quit — app exits.
        reason:       "not_activated" | "revoked" | "grace_expired" — controls
                      the explanatory text shown above the key field.
    """

    def __init__(self, on_activated, on_quit, reason: str = "not_activated"):
        self._on_activated = on_activated
        self._on_quit      = on_quit
        self._reason       = reason
        self._root: ctk.CTk | None = None

    def show(self):
        self._build()
        self._root.mainloop()

    # ------------------------------------------------------------------

    def _build(self):
        root = ctk.CTk()
        root.title("Ibis — Activate")
        root.resizable(False, False)
        self._root = root

        # Icon
        ico = Path(__file__).parent / "assets" / "icon.ico"
        if ico.exists():
            try:
                root.iconbitmap(str(ico))
            except Exception:
                pass

        # ── Hero header ─────────────────────────────────────────────────
        hero = ctk.CTkFrame(root, fg_color="#ffffff", corner_radius=0, height=100)
        hero.pack(fill="x")
        hero.pack_propagate(False)

        hero_inner = ctk.CTkFrame(hero, fg_color="transparent", corner_radius=0)
        hero_inner.place(relx=0.5, rely=0.5, anchor="center")

        ctk.CTkLabel(
            hero_inner, text="Ibis",
            font=("Inter", 26, "bold"),
            text_color=C_RED, fg_color="transparent",
        ).pack()
        ctk.CTkLabel(
            hero_inner, text="License Activation",
            font=("Inter", 12),
            text_color="#555555", fg_color="transparent",
        ).pack()

        # ── Body ────────────────────────────────────────────────────────
        body = ctk.CTkFrame(root, fg_color="transparent", corner_radius=0)
        body.pack(fill="x", padx=28, pady=(24, 8))

        # Headline
        ctk.CTkLabel(
            body, text="Enter your license key",
            font=("Inter", 13, "bold"),
            text_color=C_TEXT, anchor="w",
        ).pack(fill="x", pady=(0, 4))

        # Contextual sub-text based on why we're showing this window
        sub = self._sub_text()
        ctk.CTkLabel(
            body, text=sub,
            font=("Inter", 11),
            text_color=C_MUTED, anchor="w", wraplength=460,
        ).pack(fill="x", pady=(0, 14))

        # Key entry
        self._key_var = ctk.StringVar()
        self._key_entry = ctk.CTkEntry(
            body,
            textvariable=self._key_var,
            placeholder_text="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX",
            font=("Inter", 13),
            text_color=C_TEXT,
            border_color=C_BORDER, border_width=1,
            corner_radius=8, height=46,
        )
        self._key_entry.pack(fill="x", pady=(0, 10))
        self._key_entry.focus()

        # Status / error line
        self._status_label = ctk.CTkLabel(
            body, text="",
            font=("Inter", 12),
            text_color=C_MUTED, anchor="w", wraplength=460,
        )
        self._status_label.pack(fill="x", pady=(0, 4))

        # ── Footer ──────────────────────────────────────────────────────
        ctk.CTkFrame(root, fg_color=C_BORDER, height=1, corner_radius=0).pack(
            fill="x", pady=(12, 0)
        )

        btn_bar = ctk.CTkFrame(root, corner_radius=0, height=68)
        btn_bar.pack(fill="x")
        btn_bar.pack_propagate(False)

        self._activate_btn = ctk.CTkButton(
            btn_bar, text="Activate  →",
            font=("Inter", 13, "bold"),
            fg_color=C_RED, hover_color=C_RED_H, text_color=C_TEXT,
            corner_radius=8, height=42, width=140,
            command=self._submit,
        )
        self._activate_btn.pack(side="right", padx=(0, 22), pady=13)

        ctk.CTkButton(
            btn_bar, text="Quit",
            font=("Inter", 12),
            hover_color="#555555", text_color=C_TEXT,
            border_color=C_BORDER, border_width=1,
            corner_radius=8, height=42, width=90,
            command=self._quit,
        ).pack(side="right", padx=(0, 8), pady=13)

        ctk.CTkLabel(
            btn_bar, text="hello@simdadllc.com",
            font=("Inter", 11), text_color=C_MUTED,
        ).pack(side="left", padx=(22, 0))

        root.bind("<Return>", lambda _: self._submit())
        root.bind("<Escape>", lambda _: self._quit())

        root.update_idletasks()
        w = 520
        h = root.winfo_reqheight()
        x = (root.winfo_screenwidth()  - w) // 2
        y = (root.winfo_screenheight() - h) // 2
        root.geometry(f"{w}x{h}+{x}+{y}")

    # ------------------------------------------------------------------

    def _sub_text(self) -> str:
        if self._reason == "revoked":
            return (
                "Your license key is no longer valid. "
                "If you believe this is an error, contact hello@simdadllc.com. "
                "Otherwise, enter a valid key below."
            )
        if self._reason == "grace_expired":
            return (
                "Ibis could not reach the license server and the offline grace period has expired. "
                "Connect to the internet and enter your key to reactivate."
            )
        # not_activated (default)
        return "Your key is in the receipt email from Lemon Squeezy."

    # ------------------------------------------------------------------

    def _submit(self):
        key = self._key_var.get().strip()
        if not key:
            self._set_status("Please enter your license key.", error=True)
            return

        self._activate_btn.configure(state="disabled", text="Activating…")
        self._set_status("Contacting activation server…")

        def _run():
            ok, msg = lic.activate(key)
            self._root.after(0, lambda: self._on_result(ok, msg))

        threading.Thread(target=_run, daemon=True).start()

    def _on_result(self, ok: bool, msg: str):
        if ok:
            self._set_status("Activated. Starting Ibis…", color=C_GREEN)
            self._root.after(900, self._finish)
        else:
            self._activate_btn.configure(state="normal", text="Activate  →")
            self._set_status(msg, error=True)

    def _set_status(self, text: str, error: bool = False, color: str | None = None):
        c = color or ("#ff6b6b" if error else C_MUTED)
        self._status_label.configure(text=text, text_color=c)

    def _finish(self):
        if self._root:
            self._root.destroy()
        self._on_activated()

    def _quit(self):
        if self._root:
            self._root.destroy()
        self._on_quit()
