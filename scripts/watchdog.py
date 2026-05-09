"""
Verify daily/post/<DATE>.md and daily/stats/<DATE>.md exist; alert via LINE if missing.

Required env: LINE_TOKEN, LINE_USER, DATE, REPO (owner/name).
"""

from __future__ import annotations

import json
import os
import pathlib
import sys
import urllib.error
import urllib.request


def push(text: str, token: str, user: str) -> bool:
    payload = json.dumps(
        {"to": user, "messages": [{"type": "text", "text": text[:4900]}]},
        ensure_ascii=False,
    ).encode("utf-8")
    req = urllib.request.Request(
        "https://api.line.me/v2/bot/message/push",
        data=payload,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            print(f"LINE OK {resp.status}")
            return True
    except urllib.error.HTTPError as e:
        print(f"LINE HTTPError {e.code}: {e.read().decode('utf-8', errors='replace')}", file=sys.stderr)
        return False
    except Exception as e:
        print(f"LINE Exception: {e}", file=sys.stderr)
        return False


def main() -> int:
    date = os.environ["DATE"]
    repo = os.environ["REPO"]
    token = os.environ["LINE_TOKEN"]
    user = os.environ["LINE_USER"]

    root = pathlib.Path(__file__).resolve().parent.parent
    post = root / "daily" / "post" / f"{date}.md"
    stats = root / "daily" / "stats" / f"{date}.md"

    missing = []
    if not post.is_file():
        missing.append("post")
    if not stats.is_file():
        missing.append("stats")

    if not missing:
        print(f"OK both files exist for {date}")
        return 0

    msg = (
        f"⚠️ routine watchdog {date}\n"
        f"缺少檔案: {', '.join(missing)}\n"
        f"https://github.com/{repo}/actions"
    )
    print(f"MISSING: {missing}")
    return 0 if push(msg, token, user) else 1


if __name__ == "__main__":
    sys.exit(main())
