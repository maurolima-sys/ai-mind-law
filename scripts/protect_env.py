"""
protect_env.py — protege .env.local contra deleção e edição não autorizada.

Modo de uso:
  python scripts/protect_env.py lock      # torna read-only e guarda hash
  python scripts/protect_env.py unlock    # restaura escrita (para editar)
  python scripts/protect_env.py check     # verifica integridade (hash)
  python scripts/protect_env.py watch     # monitoriza em tempo real (Ctrl+C para parar)

Requisitos: Python 3.8+ (sem dependências externas para lock/unlock/check)
            watchdog para o modo watch: pip install watchdog
"""

import sys
import os
import stat
import hashlib
import json
import time
from pathlib import Path

TARGET = Path(__file__).parent.parent / ".env.local"
HASH_FILE = Path(__file__).parent / ".env.local.sha256"


# ─── helpers ──────────────────────────────────────────────────────────────────

def _hash(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _set_readonly(path: Path, readonly: bool) -> None:
    current = path.stat().st_mode
    if readonly:
        path.chmod(current & ~stat.S_IWRITE & ~stat.S_IWGRP & ~stat.S_IWOTH)
    else:
        path.chmod(current | stat.S_IWRITE)


def _save_hash(h: str) -> None:
    HASH_FILE.write_text(json.dumps({"sha256": h, "path": str(TARGET)}))


def _load_hash() -> str | None:
    if not HASH_FILE.exists():
        return None
    return json.loads(HASH_FILE.read_text()).get("sha256")


# ─── commands ─────────────────────────────────────────────────────────────────

def cmd_lock() -> None:
    if not TARGET.exists():
        print(f"[ERROR] File not found: {TARGET}")
        sys.exit(1)
    h = _hash(TARGET)
    _save_hash(h)
    _set_readonly(TARGET, readonly=True)
    print(f"[OK] Locked — SHA-256: {h[:16]}…")


def cmd_unlock() -> None:
    if not TARGET.exists():
        print(f"[ERROR] File not found: {TARGET}")
        sys.exit(1)
    _set_readonly(TARGET, readonly=False)
    print("[OK] Unlocked — file is now writable. Run 'lock' again after editing.")


def cmd_check() -> None:
    if not TARGET.exists():
        print("[ALERT] .env.local has been DELETED.")
        sys.exit(2)
    stored = _load_hash()
    if stored is None:
        print("[WARN] No stored hash — run 'lock' first.")
        sys.exit(1)
    current = _hash(TARGET)
    if current == stored:
        print(f"[OK] Integrity verified — SHA-256: {current[:16]}…")
    else:
        print(f"[ALERT] File has been MODIFIED.")
        print(f"  stored:  {stored}")
        print(f"  current: {current}")
        sys.exit(2)


def cmd_watch() -> None:
    try:
        from watchdog.observers import Observer
        from watchdog.events import FileSystemEventHandler
    except ImportError:
        print("[ERROR] watchdog not installed. Run: pip install watchdog")
        sys.exit(1)

    stored_hash = _load_hash()
    if stored_hash is None:
        print("[WARN] No stored hash — running 'lock' first.")
        cmd_lock()
        stored_hash = _load_hash()

    class Handler(FileSystemEventHandler):
        def _alert(self, event_type: str, src: str) -> None:
            if Path(src).name != ".env.local":
                return
            print(f"\n[ALERT] {event_type.upper()}: {src}")
            if event_type == "deleted":
                print("  .env.local was deleted. Restore it manually and run 'lock'.")
            elif event_type in ("modified", "moved"):
                current = _hash(TARGET) if TARGET.exists() else None
                if current and current != stored_hash:
                    print(f"  Hash mismatch — restoring read-only attribute.")
                    _set_readonly(TARGET, readonly=True)

        def on_deleted(self, event):   self._alert("deleted",  event.src_path)
        def on_modified(self, event):  self._alert("modified", event.src_path)
        def on_moved(self, event):     self._alert("moved",    event.src_path)

    observer = Observer()
    observer.schedule(Handler(), str(TARGET.parent), recursive=False)
    observer.start()
    print(f"[WATCH] Monitoring {TARGET} — Ctrl+C to stop.")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()
    print("[WATCH] Stopped.")


# ─── entry point ──────────────────────────────────────────────────────────────

COMMANDS = {"lock": cmd_lock, "unlock": cmd_unlock, "check": cmd_check, "watch": cmd_watch}

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    if cmd not in COMMANDS:
        print(__doc__)
        sys.exit(0)
    COMMANDS[cmd]()
