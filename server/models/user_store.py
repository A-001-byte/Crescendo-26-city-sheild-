import json
import os
import threading
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional

USERS_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "users.json")
_LOCK = threading.Lock()


def _ensure_store() -> None:
    os.makedirs(os.path.dirname(USERS_FILE), exist_ok=True)
    if not os.path.exists(USERS_FILE):
        with open(USERS_FILE, "w", encoding="utf-8") as f:
            json.dump([], f)


def _read_all() -> List[Dict]:
    _ensure_store()
    with open(USERS_FILE, "r", encoding="utf-8") as f:
        try:
            data = json.load(f)
        except json.JSONDecodeError:
            return []
    return data if isinstance(data, list) else []


def _write_all(users: List[Dict]) -> None:
    with open(USERS_FILE, "w", encoding="utf-8") as f:
        json.dump(users, f, indent=2)


def get_user_by_email(email: str) -> Optional[Dict]:
    target = (email or "").strip().lower()
    with _LOCK:
        users = _read_all()
    return next((u for u in users if str(u.get("email", "")).lower() == target), None)


def get_user_by_identity(identity: str) -> Optional[Dict]:
    target = (identity or "").strip().lower()
    with _LOCK:
        users = _read_all()
    return next(
        (
            u for u in users
            if str(u.get("email", "")).lower() == target
            or str(u.get("username", "")).lower() == target
            or str(u.get("full_name", "")).lower() == target
        ),
        None,
    )


def create_user(full_name: str, email: str, password_hash: str) -> Dict:
    username = (email.split("@")[0] if "@" in email else email).strip().lower()
    user = {
        "id": str(uuid.uuid4()),
        "full_name": full_name.strip(),
        "email": email.strip().lower(),
        "username": username,
        "password_hash": password_hash,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    with _LOCK:
        users = _read_all()
        users.append(user)
        _write_all(users)

    return user