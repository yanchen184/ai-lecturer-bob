"""Technical indicators computed from a list of closing prices, oldest first."""


def sma(closes, window):
    if len(closes) < window:
        return None
    return sum(closes[-window:]) / window


def rsi(closes, period=14):
    """Wilder's RSI."""
    if len(closes) <= period:
        return None
    deltas = [b - a for a, b in zip(closes, closes[1:])]
    avg_gain = sum(max(d, 0) for d in deltas[:period]) / period
    avg_loss = sum(max(-d, 0) for d in deltas[:period]) / period
    for d in deltas[period:]:
        avg_gain = (avg_gain * (period - 1) + max(d, 0)) / period
        avg_loss = (avg_loss * (period - 1) + max(-d, 0)) / period
    if avg_loss == 0:
        return 100.0 if avg_gain > 0 else 50.0
    return 100 - 100 / (1 + avg_gain / avg_loss)


def _ema_series(values, span):
    k = 2 / (span + 1)
    result = [sum(values[:span]) / span]
    for v in values[span:]:
        result.append(v * k + result[-1] * (1 - k))
    return result


def macd(closes, fast=12, slow=26, signal=9):
    if len(closes) < slow + signal:
        return None
    fast_ema = _ema_series(closes, fast)[slow - fast:]
    slow_ema = _ema_series(closes, slow)
    dif = [f - s for f, s in zip(fast_ema, slow_ema)]
    dea = _ema_series(dif, signal)
    return {"dif": dif[-1], "signal": dea[-1], "histogram": dif[-1] - dea[-1]}


def summarize(closes):
    return {
        "ma5": sma(closes, 5),
        "ma20": sma(closes, 20),
        "ma60": sma(closes, 60),
        "rsi14": rsi(closes),
        "macd": macd(closes),
        "high_1y_close": max(closes) if closes else None,
        "low_1y_close": min(closes) if closes else None,
        "bars": len(closes),
    }
