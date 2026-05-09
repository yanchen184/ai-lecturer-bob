"""
Send two LINE messages from daily/post/<DATE>.md and daily/stats/<DATE>.md.

Required env: LINE_TOKEN, LINE_USER, DATE (YYYY-MM-DD).

Behavior:
- If post file missing  -> send a stub note instead.
- If stats file missing -> skip stats message (post is what user actually copies).
- Each LINE text is hard-capped at 4900 chars.
- Exits non-zero only if BOTH messages fail to send (so a partial day still surfaces).
"""

from __future__ import annotations

import json
import os
import pathlib
import sys
import urllib.error
import urllib.request

LINE_PUSH_URL = "https://api.line.me/v2/bot/message/push"
MAX_LEN = 4900


def push(text: str, token: str, user: str) -> bool:
    payload = json.dumps(
        {"to": user, "messages": [{"type": "text", "text": text[:MAX_LEN]}]},
        ensure_ascii=False,
    ).encode("utf-8")
    req = urllib.request.Request(
        LINE_PUSH_URL,
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
        body = e.read().decode("utf-8", errors="replace")
        print(f"LINE HTTPError {e.code}: {body}", file=sys.stderr)
        return False
    except Exception as e:
        print(f"LINE Exception: {e}", file=sys.stderr)
        return False


def read_file(p: pathlib.Path) -> str | None:
    if not p.is_file():
        return None
    try:
        return p.read_text(encoding="utf-8").strip()
    except Exception as e:
        print(f"read {p} failed: {e}", file=sys.stderr)
        return None


def main() -> int:
    token = os.environ["LINE_TOKEN"]
    user = os.environ["LINE_USER"]
    date = os.environ["DATE"]

    repo_root = pathlib.Path(__file__).resolve().parent.parent
    post_path = repo_root / "daily" / "post" / f"{date}.md"
    stats_path = repo_root / "daily" / "stats" / f"{date}.md"

    post_body = read_file(post_path)
    stats_body = read_file(stats_path)

    sent_any = False
    failed_any = False

    if post_body:
        if push(post_body, token, user):
            sent_any = True
        else:
            failed_any = True
    else:
        msg = f"⚠️ {date} 社群貼文檔案不存在 ({post_path.relative_to(repo_root)})"
        if push(msg, token, user):
            sent_any = True
        else:
            failed_any = True

    if stats_body:
        if push(stats_body, token, user):
            sent_any = True
        else:
            failed_any = True
    # 沒有 stats 不算錯——使用者要的是 post，stats 只是輔助訊號

    if not sent_any:
        return 1
    if failed_any:
        print("partial failure, but at least one message sent", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
