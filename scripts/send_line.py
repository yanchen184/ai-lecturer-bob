"""
Send two LINE messages from daily/post/<DATE>.md and daily/stats/<DATE>.md.

Required env: LINE_TOKEN, LINE_USER, DATE (YYYY-MM-DD).

Behavior:
- On a push event, only files added/modified by that push are sent
  (post and stats arrive in separate commits, each triggering its own run).
- On workflow_dispatch (no push payload), both are sent.
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


def pushed_files(event_path: str | None) -> set[str] | None:
    """Files added/modified by a push event; None when not a push (send everything)."""
    if not event_path or not pathlib.Path(event_path).is_file():
        return None
    event = json.loads(pathlib.Path(event_path).read_text(encoding="utf-8"))
    commits = event.get("commits")
    if commits is None:
        return None
    return {f for c in commits for f in c.get("added", []) + c.get("modified", [])}


def main() -> int:
    token = os.environ["LINE_TOKEN"]
    user = os.environ["LINE_USER"]
    date = os.environ["DATE"]

    repo_root = pathlib.Path(__file__).resolve().parent.parent
    post_rel = f"daily/post/{date}.md"
    stats_rel = f"daily/stats/{date}.md"
    post_path = repo_root / post_rel
    stats_path = repo_root / stats_rel

    changed = pushed_files(os.environ.get("GITHUB_EVENT_PATH"))
    want_post = changed is None or post_rel in changed
    want_stats = changed is None or stats_rel in changed
    print(f"send post={want_post} stats={want_stats}")

    post_body = read_file(post_path)
    stats_body = read_file(stats_path) if want_stats else None

    sent_any = not (want_post or want_stats)
    failed_any = False

    if want_post:
        text = post_body or f"⚠️ {date} 社群貼文檔案不存在 ({post_rel})"
        if push(text, token, user):
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
