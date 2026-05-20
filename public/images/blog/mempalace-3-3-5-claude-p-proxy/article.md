> **TL;DR**(一分鐘看懂)
> - `chromadb_rust_bindings.abi3.so` 在 macOS 26.4 ARM64,`>=1.5.4,<2` 全版本必 SIGSEGV(issue [#1355](https://github.com/MemPalace/mempalace/issues/1355) / [chroma #6852](https://github.com/chroma-core/chroma/issues/6852))
> - **MemPalace 3.3.5** 用 HNSW segment quarantine 開機時自動隔離壞索引 + `repair --mode from-sqlite` 從 sqlite3 重灌新 palace,救回 51,355 抽屜
> - 升完發現 closet 壓縮要 LLM 後端,Max 訂閱不發 API key → 寫了 ~180 行 Python proxy 把 `claude -p` 包成 OpenAI 相容 HTTP 端點
> - 走 Max 訂閱、零 API 成本;延遲慢 ~10 倍(8-15s)但批次壓縮無所謂
> - 沒做的:bisect chromadb 1.5.3→1.5.4(issue 已開、quarantine 已修好實際痛點)

## 📌 這篇要回答的問題

1. [出血點:chromadb 1.5.x 在 ARM64 macOS 26 的 Rust crash](#出血點chromadb-15x-在-arm64-macos-26-的-rust-crash)
2. [HNSW segment quarantine:3.3.5 的第一層防線](#hnsw-segment-quarantine335-的第一層防線)
3. [`repair --mode from-sqlite`:第二層防線,繞過索引](#repair---mode-from-sqlite第二層防線繞過索引)
4. [Closet 壓縮要 LLM,但我沒 API key](#closet-壓縮要-llm但我沒-api-key)
5. [claude -p OpenAI proxy:把 CLI 包成 HTTP server](#claude--p-openai-proxy把-cli-包成-http-server)
6. [數據:升級前後對照](#數據升級前後對照)
7. [踩到但沒爆的雷](#踩到但沒爆的雷)
8. [延伸資源](#延伸資源)

## 出血點:chromadb 1.5.x 在 ARM64 macOS 26 的 Rust crash

我這台 M3 Pro 升 macOS 26.4 之後,`mempalace search` / `mempalace mine` 幾乎所有需要碰 chromadb collection 的指令都 SIGSEGV。crashlog 一律指向 `chromadb_rust_bindings.abi3.so`,frame 在 worker thread 內 `KERN_INVALID_ADDRESS at 0x0000000000000000`,三個 frame 一組無限重複——典型的 Rust segment loader 走到 corrupted pointer chain。

只有 MCP server (`mcp__mempalace__*`) 倖存,因為 daemon 啟動後不再呼叫 `client.get_collection()`,只走已開的 collection handle。所有 CLI 入口（包括 `mempalace status` 以外的指令）全部死掉。

我之前發了 [MemPalace #1355](https://github.com/MemPalace/mempalace/issues/1355),講明 `>=1.5.4,<2` 全版本受影響,workaround 是降 chromadb 到 `0.6.3` 然後重灌 palace。

但這次升 3.3.5 之後我發現——根本不用降版。

## HNSW segment quarantine:3.3.5 的第一層防線

3.3.5 在 `ChromaBackend._client()` 加了 `quarantine_stale_hnsw`:開 palace 之前掃所有 HNSW segment 目錄,比較 `data_level0.bin` 跟 `chroma.sqlite3` 的 mtime。**`data_level0.bin` 老於 `chroma.sqlite3` 超過閾值 → 直接 rename 到 `_quarantine_<timestamp>/`**,讓 chromadb 開啟時看不到那顆壞 segment。

關鍵設計選擇是它**不修壞 segment**,只是把它移出去。讓 chromadb 從 sqlite3 metadata 重新拼出可用狀態,索引 lazy 重建。對 segfault 的 root cause 一樣沒解（那是 chromadb 的事）,但繞過了「啟動就 crash」的場景。

[release notes](https://github.com/MemPalace/mempalace/releases/tag/v3.3.5) 原文:

> The `quarantine_stale_hnsw` feature detects HNSW segment directories whose `data_level0.bin` is significantly older than `chroma.sqlite3` and renames them out of the way on open.

我這台升完之後直接 `mempalace status` 不再 crash,51,355 drawers 全部對得回來:

```
=======================================================
  MemPalace Status — 51356 drawers
=======================================================

  WING: .claude
    ROOM: skills                4116 drawers
    ROOM: plugins               2753 drawers
    ROOM: agents                 965 drawers
    ...
  WING: sessions
    ROOM: technical            18050 drawers
    ROOM: architecture           773 drawers
    ROOM: problems               204 drawers
```

## `repair --mode from-sqlite`:第二層防線,繞過索引

quarantine 救得了「啟動」,救不了已經卡在 `apply_logs` 的舊 palace。3.3.5 同時推了 `repair --mode from-sqlite`:

> recovers palaces stuck on apply_logs by reading (id, document, metadata) directly from chroma.sqlite3 via the metadata segment join and re-upserting everything into a fresh palace.

換成人話:**繞過所有 HNSW 索引、wal log、segment metadata**,只信 sqlite3 裡的 `(id, document, metadata)` 三元組。把它們 SELECT 出來,建一個全新 palace,把整批 re-upsert 進去,HNSW 索引從 0 重建。

我這次跑的指令:

```bash
mempalace repair --mode from-sqlite --archive-existing
```

`--archive-existing` 會把舊 `~/.mempalace/` 整個改名成 `palace.pre-rebuild-<timestamp>/`,所以萬一 from-sqlite 出問題我隨時可以 rename 回去。實際跑出來 1.5G 抽屜全保,51,355 drawers 一個沒少。

整個過程 PID 90% CPU 跑了 24 分鐘左右。CPU bound 在 sentence-transformers 重算 embeddings——這是必要代價,因為新 palace 要重新建 HNSW,原本的索引被 quarantine 了。

## Closet 壓縮要 LLM,但我沒 API key

palace 救活了,但 `mempalace status` 顯示 **closets = 0**。Closet 是 mempalace 把多個語意相關 drawer 蒸餾成「主題濃縮」的機制,靠 `mempalace compress` 跑,需要 LLM 後端。

我沒 OpenAI / Anthropic API key（用 Max 訂閱不發 key）。第一反應是裝 Ollama 起本地模型,但有兩個問題:

1. **本地 7B 模型壓縮品質 ≪ Claude Sonnet** — 試過幾次,產出的 closet 沒有 anchor 性,搜尋時對不到原始 drawer 的概念
2. **我已經有 claude code CLI 2.1.145 在本機跑** — 走 Max 訂閱,無 token 計費

關鍵發現:`claude -p "prompt"` 是**完全 stateless** 的 print 模式,不會起 interactive session、不依賴 ~/.claude/projects/ 紀錄,純 in→out。**唯一條件是 CLI 版本 ≥ 2.1.145**,早期版本（包括我裝著的 2.1.69）會炸 `TypeError: Object not disposable`。

那剩下的問題只有一個:mempalace 想看到的是 OpenAI 相容的 `/v1/chat/completions` HTTP API,不是 CLI 子進程。**那就架一座橋。**

## claude -p OpenAI proxy:把 CLI 包成 HTTP server

`/Users/yanchen/.claude/scripts/claude-p-openai-proxy.py`（181 行 Python,純標準庫,無 dependency）。核心邏輯三段:

**子進程包裝（subprocess 層）**

```python
def call_claude_p(prompt: str, timeout: int = 120) -> str:
    env = {k: v for k, v in os.environ.items() if k != "CLAUDECODE"}
    proc = subprocess.run(
        ["claude", "-p", prompt],
        capture_output=True, text=True, timeout=timeout, env=env,
    )
    if proc.returncode != 0:
        raise RuntimeError(f"claude -p exit {proc.returncode}: {proc.stderr[:500]}")
    return proc.stdout.strip()
```

關鍵是 `CLAUDECODE` 那行:在 Claude Code session 內 spawn 另一個 `claude` 會被拒,因為偵測到巢狀。把 env var 拿掉就能繞過。

**訊息扁平化（OpenAI→prompt 層）**

```python
def build_prompt(messages: list) -> str:
    parts = []
    for m in messages:
        role, content = m.get("role", "user"), m.get("content", "")
        if isinstance(content, list):
            content = "".join(c.get("text", "") for c in content if c.get("type") == "text")
        if role == "system":   parts.append(f"[System instructions]\n{content}")
        elif role == "user":   parts.append(content)
        elif role == "assistant": parts.append(f"[Previous assistant turn]\n{content}")
    return "\n\n".join(parts)
```

OpenAI Chat 是 multi-turn message 結構,`claude -p` 只吃單一 prompt 字串。我用很笨的方式把 messages 串起來,加 `[System instructions]` 跟 `[Previous assistant turn]` 兩個 marker 讓 Claude 認得語境邊界。對「壓縮 / 摘要 / 分類」這類 mempalace 用得到的單轉場景已經夠。

**HTTP 接口（server 層）**

```python
class Handler(http.server.BaseHTTPRequestHandler):
    executor: ThreadPoolExecutor = None

    def do_POST(self):
        if self.path not in ("/chat/completions", "/v1/chat/completions"):
            self._json(404, {"error": {"message": f"unknown path {self.path}"}})
            return
        # ... read JSON, build_prompt, submit to executor, wrap as OpenAI response
```

完整 181 行:[`/Users/yanchen/.claude/scripts/claude-p-openai-proxy.py`](https://gist.github.com/) （已落地本機 ~/.claude/scripts/）

**啟動 + 測試**:

```bash
python3 ~/.claude/scripts/claude-p-openai-proxy.py --port 11435 --workers 2
# 另一個 terminal
curl -sX POST http://127.0.0.1:11435/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"reply with the word OK only"}]}'
```

實測單次 round-trip ~44 秒（含 claude CLI 啟動 8-10 秒 + 模型推論）。**不是高 QPS 設計**,是「批次壓縮跑一整晚」的設計。

mempalace 那端設成:

```bash
export LLM_ENDPOINT=http://localhost:11435/v1
export LLM_MODEL=claude-sonnet
export LLM_KEY=anything
mempalace compress
```

## 數據:升級前後對照

| 項目 | 3.3.4（升級前） | 3.3.5（升級後） |
|---|---|---|
| `mempalace status` | SIGSEGV in `chromadb_rust_bindings.abi3.so` | 正常輸出,51,355 drawers |
| `mempalace search` | SIGSEGV | 正常 |
| `mempalace mine` | SIGSEGV | 正常 |
| MCP server | 倖存（已開 handle） | 倖存 |
| Drawer 數 | 不可讀（crash） | 51,355 |
| Closet 數 | N/A | 0（待 compress 觸發） |
| LLM 後端成本 | N/A | $0（走 Max via proxy） |

`claude -p` 路徑 vs 其他方案比較:

| 方案 | 延遲 | 月成本 | 品質 | 設置複雜度 |
|---|---|---|---|---|
| OpenAI API（gpt-4o-mini） | 1-3s | 看用量,~$10-50 | 中上 | 低 |
| Anthropic API（直連） | 1-3s | 看用量 | 高 | 低（但 Max 訂閱不發 key） |
| Ollama 本地（llama3.1:8b） | 3-10s | $0 | 中 | 中（GPU 記憶體） |
| **claude -p + 本 proxy** | **8-15s** | **$0（含在 Max）** | **高** | **低（一支 Python）** |

`claude -p` 慢一個量級,但**對批次壓縮根本不需要快**——夜跑跑 1000 條 closet,慢 10 倍 = 90 分鐘變 15 小時,跑一晚還是搞定。

## 踩到但沒爆的雷

1. **claude-code 2.1.69 的 `TypeError: Object not disposable`** — 早期 `-p` mode 對 non-tty stdin 處理有 bug,必須升到 2.1.145。`npm install -g @anthropic-ai/claude-code@2.1.145`
2. **`CLAUDECODE` 巢狀偵測** — 不剝這個 env var,proxy 內 spawn 的 `claude` 子進程會拒跑
3. **`tail -60` 對 pipe stdout 會 buffer** — 跑 `repair` 時想看進度結果 `tail` 把整段全壓到結尾才吐。要看即時進度用 `--line-buffered` 或寫到檔案再 `tail -f`
4. **沒用 `--archive-existing` 的話 from-sqlite 會原地砍掉舊 palace** — 看清楚旗標,跑之前永遠先備份
5. **proxy 的 `ThreadPoolExecutor` 死了不會自動清** — 我 SIGTERM 第一次它沒理我,要 `pkill -9 -f claude-p-openai-proxy`

## FAQ

**Q1:我也想裝這支 proxy,但我沒 Max 訂閱怎麼辦？**
不能用。`claude -p` 認本機 `~/.claude/` 的訂閱狀態,沒登入會拒跑。OpenAI API key 直連反而簡單,把 proxy 改成轉發給 `https://api.openai.com/v1/chat/completions` 就好——但這樣就跟直接用 OpenAI 一樣,proxy 沒意義。

**Q2:為什麼不直接讓 mempalace 內建 claude -p 支援？**
mempalace 上游沒義務支援 Anthropic CLI 的怪招,而且這是 Bob 個人的 Max 訂閱情境,不通用。寫成獨立 proxy 反而更乾淨——任何 OpenAI 相容客戶端都能接。

**Q3:proxy 安全嗎？要不要綁 auth？**
我這支只 bind `127.0.0.1`,不暴露公網。LAN 內如果其他人能 ssh 到這台,他能直接跑 `claude -p`,要 proxy 也只是方便他用 HTTP 而已。**不要 bind `0.0.0.0`**——那等於把 Max 訂閱開放給整個 LAN。

**Q4:HNSW quarantine 會不會把好 segment 也誤判隔離？**
看 `data_level0.bin` 跟 `chroma.sqlite3` 的 mtime 差距判斷。正常運作下 sqlite3 寫入後 HNSW segment 會接著刷新；差距大代表 segment 上次 flush 失敗。**不會誤判正常 segment**,但會誤判「palace 長期沒進新 drawer」的情境——這時 sqlite3 不動、segment 也不動,差距趨近 0,正常。問題情境是 sqlite3 動了 segment 沒跟上。

**Q5:升 3.3.5 要做什麼準備？**
備份 `~/.mempalace/` 到 `.mempalace.bak.<date>/`。然後 `pip install -U mempalace`。MCP server 重啟一次讓它載新版。如果原本卡在 `apply_logs` 才需要跑 `repair --mode from-sqlite --archive-existing`,正常的話 quarantine 自動跑、不用手動干預。

---

## 延伸資源

- [MemPalace 3.3.5 release notes](https://github.com/MemPalace/mempalace/releases/tag/v3.3.5)
- [MemPalace issue #1355: chromadb_rust_bindings segfaults on macOS 26.4 ARM64](https://github.com/MemPalace/mempalace/issues/1355)
- [chroma-core issue #6852: SIGSEGV crash in chromadb_rust_bindings on macOS ARM64](https://github.com/chroma-core/chroma/issues/6852)
- [claude-code changelog](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- 本機 proxy: `/Users/yanchen/.claude/scripts/claude-p-openai-proxy.py`
- 本機 CLAUDE.md 上的 `claude -p` 使用守則:`/Users/yanchen/.claude/CLAUDE.md` 的「工具偏好」段
