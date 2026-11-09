import json
import os
import pathlib
import sys
import tempfile
import unittest
from unittest import mock

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import send_line  # noqa: E402

DATE = "2026-11-09"
POST = f"daily/post/{DATE}.md"
STATS = f"daily/stats/{DATE}.md"


def run_with_event(event: dict | None) -> list[str]:
    sent: list[str] = []
    with tempfile.TemporaryDirectory() as d:
        env = {"LINE_TOKEN": "t", "LINE_USER": "u", "DATE": DATE}
        if event is not None:
            path = pathlib.Path(d) / "event.json"
            path.write_text(json.dumps(event), encoding="utf-8")
            env["GITHUB_EVENT_PATH"] = str(path)
        with mock.patch.dict(os.environ, env, clear=True), \
                mock.patch.object(send_line, "push", side_effect=lambda t, *_: sent.append(t) or True), \
                mock.patch.object(send_line, "read_file", side_effect=lambda p: "post body" if "/post/" in p.as_posix() else "stats body"):
            assert send_line.main() == 0
    return sent


class SendLineTest(unittest.TestCase):
    def test_push_with_only_post_sends_post_once(self):
        self.assertEqual(run_with_event({"commits": [{"added": [POST], "modified": []}]}), ["post body"])

    def test_push_with_only_stats_does_not_resend_post(self):
        self.assertEqual(run_with_event({"commits": [{"added": [STATS], "modified": []}]}), ["stats body"])

    def test_push_with_both_sends_both(self):
        event = {"commits": [{"added": [POST], "modified": []}, {"added": [], "modified": [STATS]}]}
        self.assertEqual(run_with_event(event), ["post body", "stats body"])

    def test_manual_dispatch_sends_both(self):
        self.assertEqual(run_with_event({"inputs": {"date": DATE}}), ["post body", "stats body"])
        self.assertEqual(run_with_event(None), ["post body", "stats body"])

    def test_push_touching_other_dates_sends_nothing(self):
        self.assertEqual(run_with_event({"commits": [{"added": ["daily/post/2026-11-08.md"], "modified": []}]}), [])


if __name__ == "__main__":
    unittest.main()
