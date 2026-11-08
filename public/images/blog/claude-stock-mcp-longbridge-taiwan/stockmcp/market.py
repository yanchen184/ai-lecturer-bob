"""Read-only market data for Taiwan and US stocks from public, key-less endpoints."""
import datetime as dt
import json
import re
import urllib.parse
import urllib.request

from indicators import summarize

TIMEOUT_SECONDS = 20
USER_AGENT = "Mozilla/5.0 (stockmcp POC)"
TAIPEI = dt.timezone(dt.timedelta(hours=8))
TW_SYMBOL = re.compile(r"^\d{4,6}[A-Z]?$")
US_SYMBOL = re.compile(r"^[A-Z][A-Z\-]{0,9}$")

TW_BOARDS = {
    "tse": {
        "yahoo_suffix": ".TW",
        "valuation_url": "https://openapi.twse.com.tw/v1/exchangeReport/BWIBBU_ALL",
        "revenue_url": "https://openapi.twse.com.tw/v1/opendata/t187ap05_L",
    },
    "otc": {
        "yahoo_suffix": ".TWO",
        "valuation_url": "https://www.tpex.org.tw/openapi/v1/tpex_mainboard_peratio_analysis",
        "revenue_url": "https://www.tpex.org.tw/openapi/v1/mopsfin_t187ap05_O",
    },
}


class SymbolError(ValueError):
    pass


def _get_json(url):
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS) as response:
        return json.loads(response.read().decode("utf-8"))


def _number(value):
    try:
        return float(str(value).replace(",", ""))
    except (TypeError, ValueError):
        return None


def _first_price(levels):
    """mis.twse order-book fields look like '2135.0000_2130.0000_'."""
    return _number((levels or "").split("_")[0])


def normalize_symbol(raw):
    symbol = str(raw or "").strip().upper()
    if TW_SYMBOL.match(symbol):
        return {"market": "TW", "symbol": symbol}
    if US_SYMBOL.match(symbol):
        return {"market": "US", "symbol": symbol}
    raise SymbolError(f"Unsupported symbol: {raw!r}. Use 2330 or AAPL.")


def fetch_tw_quote(code):
    channels = "|".join(f"{board}_{code}.tw" for board in TW_BOARDS)
    url = (
        "https://mis.twse.com.tw/stock/api/getStockInfo.jsp?"
        + urllib.parse.urlencode({"ex_ch": channels, "json": 1, "delay": 0}, safe="|")
    )
    rows = [r for r in _get_json(url).get("msgArray", []) if r.get("c") == code]
    if not rows:
        raise LookupError(f"TWSE/TPEx returned no quote for {code}")
    row = rows[0]
    previous_close = _number(row.get("y"))
    last_trade = _number(row.get("z"))
    bid = _first_price(row.get("b"))
    ask = _first_price(row.get("a"))
    mid = (bid + ask) / 2 if bid and ask else None
    price = last_trade if last_trade is not None else mid
    change = price - previous_close if price is not None and previous_close else None
    return {
        "board": row["ex"],
        "name": row.get("n"),
        "currency": "TWD",
        "price": price,
        "price_basis": "last_trade" if last_trade is not None else "bid_ask_mid",
        "previous_close": previous_close,
        "change": change,
        "change_pct": change / previous_close * 100 if change is not None else None,
        "as_of": f"{row.get('d')} {row.get('t')} Asia/Taipei",
        "source": "mis.twse.com.tw",
    }


def fetch_history(yahoo_symbol):
    url = (
        f"https://query1.finance.yahoo.com/v8/finance/chart/"
        f"{urllib.parse.quote(yahoo_symbol)}?range=1y&interval=1d"
    )
    result = _get_json(url)["chart"]["result"][0]
    ohlcv = result["indicators"]["quote"][0]
    bars = [
        {"time": t, "open": o, "high": h, "low": l, "close": c, "volume_shares": v}
        for t, o, h, l, c, v in zip(
            result["timestamp"], ohlcv["open"], ohlcv["high"], ohlcv["low"], ohlcv["close"], ohlcv["volume"]
        )
        if c is not None
    ]
    return {"meta": result["meta"], "bars": bars}


def fetch_us_quote(history):
    meta = history["meta"]
    closes = [bar["close"] for bar in history["bars"]]
    price = meta.get("regularMarketPrice")
    previous = closes[-2] if len(closes) >= 2 else None
    change = price - previous if price is not None and previous else None
    as_of = dt.datetime.fromtimestamp(meta["regularMarketTime"], TAIPEI)
    return {
        "board": meta.get("exchangeName"),
        "name": meta.get("longName") or meta.get("shortName"),
        "currency": meta.get("currency"),
        "price": price,
        "price_basis": "regular_market",
        "previous_close": previous,
        "change": change,
        "change_pct": change / previous * 100 if change is not None else None,
        "as_of": as_of.strftime("%Y-%m-%d %H:%M:%S Asia/Taipei"),
        "source": "query1.finance.yahoo.com",
    }


def _row_for(rows, *code_keys, code):
    for row in rows:
        if any(row.get(key) == code for key in code_keys):
            return row
    raise LookupError(f"{code} not found in dataset")


def fetch_tw_valuation(code, board):
    rows = _get_json(TW_BOARDS[board]["valuation_url"])
    row = _row_for(rows, "Code", "SecuritiesCompanyCode", code=code)
    return {
        "pe": _number(row.get("PEratio") or row.get("PriceEarningRatio")),
        "pb": _number(row.get("PBratio") or row.get("PriceBookRatio")),
        "dividend_yield_pct": _number(row.get("DividendYield") or row.get("YieldRatio")),
        "as_of_roc": row.get("Date"),
        "source": TW_BOARDS[board]["valuation_url"],
    }


def fetch_tw_revenue(code, board):
    rows = _get_json(TW_BOARDS[board]["revenue_url"])
    row = _row_for(rows, "公司代號", code=code)
    return {
        "period_roc": row.get("資料年月"),
        "monthly_revenue_thousand_twd": _number(row.get("營業收入-當月營收")),
        "mom_pct": _number(row.get("營業收入-上月比較增減(%)")),
        "yoy_pct": _number(row.get("營業收入-去年同月增減(%)")),
        "ytd_yoy_pct": _number(row.get("累計營業收入-前期比較增減(%)")),
        "company_note": row.get("備註"),
        "source": TW_BOARDS[board]["revenue_url"],
    }


def _section(fetch):
    """A failing data source reports its own error without dropping the others."""
    try:
        return fetch()
    except Exception as error:  # Each upstream fails differently; the error is surfaced to the caller.
        return {"unavailable": f"{type(error).__name__}: {error}"}


def _technicals(history):
    if "unavailable" in history:
        return history
    last = history["bars"][-1]
    last_bar = {
        "date": dt.datetime.fromtimestamp(last["time"], TAIPEI).date().isoformat(),
        **{key: last[key] for key in ("open", "high", "low", "close", "volume_shares")},
    }
    closes = [bar["close"] for bar in history["bars"]]
    return {**summarize(closes), "last_bar": last_bar, "source": "query1.finance.yahoo.com"}


def snapshot_tw(code):
    quote = _section(lambda: fetch_tw_quote(code))
    board = quote.get("board")
    if board not in TW_BOARDS:
        unavailable = {"unavailable": "board unknown because the quote lookup failed"}
        return {"quote": quote, "valuation": unavailable, "revenue": unavailable, "technicals": unavailable}
    suffix = TW_BOARDS[board]["yahoo_suffix"]
    history = _section(lambda: fetch_history(f"{code}{suffix}"))
    return {
        "quote": quote,
        "valuation": _section(lambda: fetch_tw_valuation(code, board)),
        "revenue": _section(lambda: fetch_tw_revenue(code, board)),
        "technicals": _technicals(history),
    }


def snapshot_us(symbol):
    history = _section(lambda: fetch_history(symbol))
    quote = history if "unavailable" in history else _section(lambda: fetch_us_quote(history))
    return {
        "quote": quote,
        "valuation": {"unavailable": "not implemented for US symbols in this POC"},
        "revenue": {"unavailable": "not implemented for US symbols in this POC"},
        "technicals": _technicals(history),
    }


def stock_snapshot(raw_symbol):
    target = normalize_symbol(raw_symbol)
    fetch = snapshot_tw if target["market"] == "TW" else snapshot_us
    return {**target, **fetch(target["symbol"])}
