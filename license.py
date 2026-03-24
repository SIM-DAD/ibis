"""
Ibis license management — Lemon Squeezy license key validation.

Flow:
  1. On first launch: no license.json → show activation window.
  2. On activation: POST to LS activate endpoint, save result locally.
  3. On every subsequent launch: try online validation; fall back to
     cached state if offline (grace period: 30 days from last validation).
  4. Explicitly revoked keys (HTTP 400 from LS): hard block regardless of cache.
"""
import json
import logging
import socket
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

from config import CONFIG_PATH

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
LICENSE_PATH    = CONFIG_PATH.parent / "license.json"
LS_ACTIVATE_URL = "https://api.lemonsqueezy.com/v1/licenses/activate"
LS_VALIDATE_URL = "https://api.lemonsqueezy.com/v1/licenses/validate"
GRACE_DAYS      = 30
TIMEOUT         = 10   # seconds


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _instance_name() -> str:
    try:
        return socket.gethostname()
    except Exception:
        return "unknown"


def _post(url: str, params: dict) -> dict:
    """POST url-encoded params, return parsed JSON. Raises on network error."""
    data = urllib.parse.urlencode(params).encode()
    req  = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
        return json.loads(resp.read().decode())


def _load() -> dict | None:
    if not LICENSE_PATH.exists():
        return None
    try:
        with LICENSE_PATH.open("r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        logger.exception("Failed to read license file")
        return None


def _save(data: dict) -> None:
    try:
        LICENSE_PATH.parent.mkdir(parents=True, exist_ok=True)
        with LICENSE_PATH.open("w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception:
        logger.exception("Failed to save license file")


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _friendly_error(raw: str) -> str:
    """Map Lemon Squeezy error strings to user-readable messages."""
    low = (raw or "").lower()
    if "activation limit" in low:
        return (
            "This key has reached its activation limit. "
            "Contact hello@simdadllc.com to reset it."
        )
    if "invalid" in low or "not found" in low or "does not exist" in low:
        return (
            "License key not found. "
            "Check the key in your receipt email and try again."
        )
    if "expired" in low:
        return "This license key has expired. Contact hello@simdadllc.com for help."
    if "disabled" in low or "revoked" in low:
        return (
            "This license key has been disabled. "
            "Contact hello@simdadllc.com for help."
        )
    return raw or "Activation failed. Contact hello@simdadllc.com if the problem persists."


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def activate(key: str) -> tuple[bool, str]:
    """
    Activate a license key with Lemon Squeezy.
    Returns (success: bool, error_message: str).
    On success, persists the license locally.
    """
    key = key.strip().upper()
    try:
        data = _post(LS_ACTIVATE_URL, {
            "license_key":   key,
            "instance_name": _instance_name(),
        })
    except urllib.error.URLError:
        return False, "Could not reach the activation server. Check your internet connection and try again."
    except Exception:
        logger.exception("Unexpected error during activation")
        return False, "An unexpected error occurred. Contact hello@simdadllc.com if the problem persists."

    if not data.get("activated"):
        return False, _friendly_error(data.get("error", ""))

    _save({
        "license_key":    key,
        "instance_id":    data.get("instance", {}).get("id", ""),
        "product_name":   data.get("meta", {}).get("product_name", "Ibis"),
        "activated_at":   _now_iso(),
        "last_validated": _now_iso(),
    })
    logger.info("License activated: %s", data.get("meta", {}).get("product_name", "Ibis"))
    return True, ""


def check() -> tuple[bool, str]:
    """
    Check license validity on startup.
    Returns (valid: bool, reason: str).

    Reasons when invalid:
      "not_activated"  — no license file, show activation window
      "revoked"        — LS explicitly says key is invalid, show activation window
      "grace_expired"  — offline too long, show activation window
    """
    saved = _load()
    if not saved:
        return False, "not_activated"

    # Try online validation first
    try:
        data = _post(LS_VALIDATE_URL, {
            "license_key": saved["license_key"],
            "instance_id": saved.get("instance_id", ""),
        })

        if data.get("valid"):
            saved["last_validated"] = _now_iso()
            _save(saved)
            logger.info("License valid (online)")
            return True, ""

        # Key explicitly invalid — revoked or refunded
        logger.warning("License invalid per LS: %s", data.get("error"))
        return False, "revoked"

    except urllib.error.URLError:
        logger.info("License validation offline — checking grace period")
        return _grace_check(saved)
    except Exception:
        logger.exception("Unexpected error during license check — applying grace period")
        return _grace_check(saved)


def _grace_check(saved: dict) -> tuple[bool, str]:
    last_str = saved.get("last_validated") or saved.get("activated_at", "")
    if not last_str:
        return False, "not_activated"
    try:
        last = datetime.fromisoformat(last_str)
        if last.tzinfo is None:
            last = last.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) - last <= timedelta(days=GRACE_DAYS):
            logger.info("Offline — grace period active (%d-day window)", GRACE_DAYS)
            return True, ""
    except Exception:
        logger.exception("Failed to parse last_validated timestamp")
    return False, "grace_expired"
