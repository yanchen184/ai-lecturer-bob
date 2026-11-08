import json
import subprocess
import sys
import unittest
from pathlib import Path
from unittest import mock

import indicators as ind
import market
from market import SymbolError, normalize_symbol
from server import handle

SERVER = Path(__file__).with_name("server.py")


class IndicatorTests(unittest.TestCase):
    def test_sma(self):
        self.assertEqual(ind.sma([1, 2, 3, 4], 2), 3.5)
        self.assertIsNone(ind.sma([1], 2))

    def test_rsi_bounds(self):
        self.assertEqual(ind.rsi(list(range(1, 30))), 100.0)
        self.assertEqual(ind.rsi(list(range(30, 1, -1))), 0.0)
        self.assertEqual(ind.rsi([5.0] * 30), 50.0)

    def test_rsi_published_example(self):
        closes = [44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.10, 45.42,
                  45.84, 46.08, 45.89, 46.03, 45.61, 46.28, 46.28]
        self.assertAlmostEqual(ind.rsi(closes), 70.46, delta=0.3)

    def test_macd_flat_is_zero(self):
        self.assertEqual(ind.macd([10.0] * 60), {"dif": 0.0, "signal": 0.0, "histogram": 0.0})

    def test_macd_needs_history(self):
        self.assertIsNone(ind.macd([1.0] * 34))
        self.assertIsNotNone(ind.macd([1.0] * 35))


class SymbolTests(unittest.TestCase):
    def test_accepts(self):
        self.assertEqual(normalize_symbol(" 2330 ")["market"], "TW")
        self.assertEqual(normalize_symbol("00631L")["market"], "TW")
        self.assertEqual(normalize_symbol("brk-b"), {"market": "US", "symbol": "BRK-B"})

    def test_rejects_url_injection_and_empty(self):
        for bad in ["AAPL?x=1", "../etc", "", None, "2330&ex_ch=1"]:
            with self.assertRaises(SymbolError):
                normalize_symbol(bad)


class DailyRangeTests(unittest.TestCase):
    def test_tw_quote_omits_mis_session_range(self):
        row = {"c": "2330", "ex": "tse", "n": "x", "z": "2135.0", "y": "2240.0",
               "o": "2135.0", "h": "2140.0", "l": "2130.0", "v": "96959", "d": "20261106", "t": "13:30:00"}
        with mock.patch.object(market, "_get_json", return_value={"msgArray": [row]}):
            quote = market.fetch_tw_quote("2330")
        self.assertEqual(quote["price"], 2135.0)
        self.assertFalse({"open", "high", "low"} & set(quote))

    def test_last_bar_comes_from_daily_history(self):
        payload = {"chart": {"result": [{"meta": {}, "timestamp": [1793923200, 1794009600], "indicators": {"quote": [
            {"open": [1.0, None], "high": [3.0, None], "low": [0.5, None], "close": [2.0, None], "volume": [9, None]}
        ]}}]}}
        with mock.patch.object(market, "_get_json", return_value=payload):
            bar = market._technicals(market.fetch_history("2330.TW"))["last_bar"]
        self.assertEqual((bar["open"], bar["high"], bar["low"], bar["close"]), (1.0, 3.0, 0.5, 2.0))


class ProtocolTests(unittest.TestCase):
    def test_notification_has_no_response(self):
        self.assertIsNone(handle({"method": "notifications/initialized"}))

    def test_unknown_method(self):
        self.assertEqual(handle({"id": 1, "method": "nope"})["error"]["code"], -32601)

    def test_only_one_tool_is_exposed(self):
        tools = handle({"id": 1, "method": "tools/list"})["result"]["tools"]
        self.assertEqual([t["name"] for t in tools], ["stock_snapshot"])

    def test_bad_symbol_is_tool_error(self):
        result = handle({"id": 1, "method": "tools/call", "params": {
            "name": "stock_snapshot", "arguments": {"symbol": "A?b"}}})["result"]
        self.assertTrue(result["isError"])

    def test_stdio_handshake(self):
        lines = [
            {"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {}},
            {"jsonrpc": "2.0", "method": "notifications/initialized"},
            {"jsonrpc": "2.0", "id": 2, "method": "tools/list"},
        ]
        payload = "".join(json.dumps(m) + "\n" for m in lines)
        out = subprocess.run([sys.executable, str(SERVER)], input=payload, capture_output=True,
                             text=True, encoding="utf-8", timeout=20, check=True).stdout
        replies = [json.loads(x) for x in out.splitlines()]
        self.assertEqual([r["id"] for r in replies], [1, 2])


if __name__ == "__main__":
    unittest.main()
