"""Minimal MCP stdio server exposing one read-only tool."""
import json
import sys

from market import SymbolError, stock_snapshot

PROTOCOL_VERSION = "2025-03-26"
TOOL = {
    "name": "stock_snapshot",
    "description": (
        "Read-only snapshot of one Taiwan or US stock: latest quote, moving averages, RSI, MACD; "
        "Taiwan stocks also include PE/PB/yield and monthly revenue. Every section has its own "
        "as-of time and source. A section containing 'unavailable' has no data; do not fill it in."
    ),
    "inputSchema": {
        "type": "object",
        "properties": {"symbol": {"type": "string", "description": "e.g. 2330, 6488, AAPL"}},
        "required": ["symbol"],
    },
}


def _call_tool(params):
    if params.get("name") != TOOL["name"]:
        raise KeyError(f"Unknown tool: {params.get('name')}")
    try:
        data = stock_snapshot(params.get("arguments", {}).get("symbol"))
    except SymbolError as error:
        return {"content": [{"type": "text", "text": str(error)}], "isError": True}
    return {"content": [{"type": "text", "text": json.dumps(data, ensure_ascii=False)}]}


def _result_for(method, params):
    if method == "initialize":
        return {
            "protocolVersion": PROTOCOL_VERSION,
            "capabilities": {"tools": {}},
            "serverInfo": {"name": "stockmcp", "version": "0.1.0"},
        }
    if method == "ping":
        return {}
    if method == "tools/list":
        return {"tools": [TOOL]}
    if method == "tools/call":
        return _call_tool(params)
    raise NotImplementedError(method)


def handle(message):
    """Return the JSON-RPC response, or None for a notification."""
    if "id" not in message:
        return None
    base = {"jsonrpc": "2.0", "id": message["id"]}
    try:
        return {**base, "result": _result_for(message.get("method"), message.get("params") or {})}
    except NotImplementedError as error:
        return {**base, "error": {"code": -32601, "message": f"Method not found: {error}"}}
    except KeyError as error:
        return {**base, "error": {"code": -32602, "message": str(error)}}


def main():
    sys.stdin.reconfigure(encoding="utf-8")
    sys.stdout.reconfigure(encoding="utf-8", newline="\n")
    for line in sys.stdin:
        if not line.strip():
            continue
        response = handle(json.loads(line))
        if response is not None:
            print(json.dumps(response, ensure_ascii=False), flush=True)


if __name__ == "__main__":
    main()
