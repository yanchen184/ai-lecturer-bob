> **TL;DR**
> - 本文解決：想在 Mac 上裝 Hermes Agent 接自家內網 LLM，但官方文件只示範 OpenAI / Anthropic，跳過「半套 OpenAI-compatible 後端」這條路
> - 推薦給：手上有內網 LLM wrapper、想跑離線 CLI agent、不想再被雲端 API key 卡住的工程師
> - 讀完你會知道：Hermes Agent 是什麼、Mac 從 0 安裝完整步驟、為什麼不能直接接 wrapper、要補哪 4 件事才會通

---

> **📚 Hermes Agent 系列 — 這是第 4 篇 / 共 5 篇**
>
> 1. [入門篇](/ai-lecturer-bob/blog/hermes-agent-intro/) — 這 AI 工具到底在幹嘛?(新手)
> 2. [最簡安裝](/ai-lecturer-bob/blog/hermes-agent-quickstart/) — 5 分鐘公開 API 版(新手)
> 3. [沙盒篇](/ai-lecturer-bob/blog/hermes-agent-sandbox/) — 怎麼讓它不弄壞電腦
> 4. **👉 Mac 安裝實戰(你在這)— 接公司內網 LLM(工程師硬版)**
> 5. [結構分析](/ai-lecturer-bob/blog/hermes-agent-academic/) — 為什麼它擠進 OpenRouter #2
>
> **這篇給誰看**:已經會用 CLI / 看得懂 Python / 手上有內網 OpenAI-compatible wrapper 想接的工程師
> **完全新手**:先看[入門篇](/ai-lecturer-bob/blog/hermes-agent-intro/) + [最簡安裝](/ai-lecturer-bob/blog/hermes-agent-quickstart/),那兩篇 15 分鐘讓你跑起來 / 不需要寫 proxy

我手上有一台跑著 **MediaTek-Research/Llama-Breeze2-8B-Instruct** 的內網機器（`http://<INTERNAL_LLM_HOST>:<PORT>`），公司另一個同事寫了 OpenAI-compatible wrapper 暴露 `/v1/chat/completions`。理論上，**任何吃 OpenAI API 的 client 都能直接接**。

我選了 [Hermes Agent](https://github.com/NousResearch/hermes-agent)——NousResearch 在 2026 年初開源的 CLI agent，可以把它想成「**provider-agnostic 的 Claude Code**」。

然後我撞牆撞了兩天。

`hermes -z "用一句話介紹自己"` 跑完 exit 0，**stdout 完全空白**。沒錯誤、沒 log、session JSON 只記到 user message。三次重試後給空字串收工。

這篇是我從 0 把它裝起來、發現問題、寫 proxy 補洞、最後跑通的完整紀錄。如果你也想接「**不是 OpenAI 也不是 Anthropic、但號稱 OpenAI-compatible**」的後端，這篇省你兩天。

<img src="/ai-lecturer-bob/images/blog/hermes-agent-mac-install/hermes-github-repo.png" alt="NousResearch/hermes-agent GitHub repo 主頁，6k stars、24k forks、1.5k contributors、Python 為主" style="border-radius: 8px; margin: 1rem 0; width: 100%;" />

## 📌 目錄

1. [Hermes Agent 是什麼](#hermes-agent-是什麼)
2. [為什麼選 Hermes 而不是 Claude Code / Cursor](#為什麼選-hermes-而不是-claude-code--cursor)
3. [從 0 在 Mac 上安裝](#從-0-在-mac-上安裝)
4. [接內網 LLM 的第一次嘗試（失敗）](#接內網-llm-的第一次嘗試失敗)
5. [真正的問題：半套 OpenAI-compatible](#真正的問題半套-openai-compatible)
6. [proxy 補洞：四件事一次補齊](#proxy-補洞四件事一次補齊)
7. [設 launchd 開機自啟動](#設-launchd-開機自啟動)
8. [驗收：終端機跑出繁中回應](#驗收終端機跑出繁中回應)
9. [踩坑清單與排查心法](#踩坑清單與排查心法)
10. [常見問題](#常見問題)
11. [延伸資源](#延伸資源)

## 🧠 Hermes Agent 是什麼

[Hermes Agent](https://github.com/NousResearch/hermes-agent) 是 **NousResearch** 維護的開源 CLI agent，2026 年 5 月剛發 v0.13.0 (`The Tenacity Release`)，6k stars、24k forks、社群極為活躍（1.5k contributors）。

它的定位是 **CLI 上的 universal agent**：

- 一個 `hermes` 指令，後面接 prompt 或進互動 REPL
- 支援多 provider：OpenAI、Anthropic、Google、Alibaba (DashScope)、xAI、Groq、Together、LM Studio、Ollama
- 內建工具：bash、edit、read、search、MCP、screenshot、TTS、agent fork
- 結構化 session 存在 `~/.hermes/sessions/`，每一輪 message 都是 JSON

<img src="/ai-lecturer-bob/images/blog/hermes-agent-mac-install/hermes-v013-release.png" alt="Hermes Agent v0.13.0 (2026.5.7) — The Tenacity Release 的 GitHub release 頁面，128.5k 行新增、282 個 contributors" style="border-radius: 8px; margin: 1rem 0; width: 100%;" />

v0.13.0 一次塞進來的東西包括：multi-agent delegation、provider 自動切換、Hermes Voice TTS、affordance editing、Skills v2、Plankton 語意檢查……重點是它**還在加速演化**。

## 🤔 為什麼選 Hermes 而不是 Claude Code / Cursor

直接給對照：

| 特徵 | Hermes Agent | Claude Code | Cursor |
|------|:---:|:---:|:---:|
| Open source | ✓ | ✗ | ✗ |
| 自架 LLM 後端 | ✓ | ✗ | ✗ |
| Provider 數量 | 9+ | 1 (Anthropic) | 多家但綁定服務 |
| CLI / REPL | ✓ | ✓ | ✗ (IDE 為主) |
| Session 結構化 JSON | ✓ | ✓ | △ |
| MCP 支援 | ✓ | ✓ | ✓ |
| 適合場景 | 多 provider、離線、自架 | Anthropic only、生產級 CLI | IDE-first 開發 |

**對我的場景**：內網 Breeze2 是免費 + 不可外連的。Claude Code 直接出局（強制連 Anthropic API）。Cursor 不是 CLI，不算同類。Hermes Agent 是少數**真的 provider-agnostic** 的選擇。

順帶一提，**Hermes Agent 在 OpenRouter Apps 排行榜上是 #2**（僅次於 OpenAI 自家的 ChatGPT），但這個位置背後的意義另一篇講，這篇只管裝起來。

## 🛠️ 從 0 在 Mac 上安裝

整體流程拆三步：

```
brew → uvx 安裝 hermes-cli → 設 config + .env
```

### 步驟 1：確認 Python 與 uv

```bash
# 需要 Python ≥ 3.10
python3 --version
# Python 3.12.6

# 安裝 uv (Hermes 官方推薦的 runner，比 pipx 快非常多)
brew install uv
```

### 步驟 2：用 uvx 安裝 hermes-agent

```bash
uvx --from hermes-cli hermes --version
# Hermes Agent v0.13.0
```

第一次跑會自動把 `hermes-cli` 拉下來 cache 在 `~/.cache/uv/`。後續直接：

```bash
hermes -z "hello"
```

如果你想 alias 起來不要每次打 `uvx --from`，在 `~/.zshrc` 加：

```bash
alias hermes='uvx --from hermes-cli hermes'
```

### 步驟 3：設 config 與 env

Hermes 的兩個關鍵檔案：

```bash
~/.hermes/config.yaml   # provider 設定、預設 model
~/.hermes/.env          # API key (永遠別 commit)
```

最小設定（接 Anthropic）：

```yaml
# ~/.hermes/config.yaml
model:
  default: claude-sonnet-4-5
  provider: anthropic
```

```bash
# ~/.hermes/.env
ANTHROPIC_API_KEY=sk-ant-xxx
```

跑一次 sanity check：

```bash
hermes -z "say hi"
```

有回應就表示 Hermes 本體已通。**現在進入麻煩的部分：接內網 LLM。**

## 🚧 接內網 LLM 的第一次嘗試（失敗）

內網 wrapper 號稱 OpenAI-compatible，那理論上接這樣就好：

```yaml
# ~/.hermes/config.yaml (失敗版本)
model:
  default: breeze2
  provider: openai
```

```bash
# ~/.hermes/.env
OPENAI_API_KEY=dummy
OPENAI_BASE_URL=http://<INTERNAL_LLM_HOST>:<PORT>/v1
```

結果：

```bash
$ hermes -z "用一句話介紹自己,30 字以內"
$
$ echo $?
0
```

**完全空白、exit 0、沒任何錯誤。**

`hermes logs errors` 也空。`~/.hermes/sessions/session_xxx.json` 只有一條 user message、`message_count: 1`。

最詭異的是它**沒當機、沒 timeout、沒 401**——它好像正常跑完了，只是內容是空的。

## 🔬 真正的問題：半套 OpenAI-compatible

我在 wrapper 那層加了 access log，發現 Hermes 根本**沒打 `/v1/chat/completions`**。它打了：

```
GET /v1/models
```

然後 wrapper 回 `404 Not Found`，Hermes 預檢失敗、silent drop、收工。

挖完 Hermes 源碼後我發現問題不只一個。**Breeze2 wrapper 跟標準 OpenAI API 差了 4 件事**：

| # | 缺什麼 | 觸發症狀 | 嚴重度 |
|---|--------|---------|:---:|
| 1 | `GET /v1/models` 不存在 | 預檢失敗，silent drop | 致命 |
| 2 | response 沒有 `usage` 欄位 | OpenAI SDK strict 模式視為 malformed | 致命 |
| 3 | `stream: true` 仍回單一 JSON 不發 SSE | Hermes 拿到空 chunk，重試 3 次後給空 | 致命 |
| 4 | `system_fingerprint` 沒給 | 警告 log（不致命） | 低 |

**這 4 件事任何一條缺，Hermes 都會 silent fail**——這是 OpenAI SDK strict 模式的設計：寧可吐空也不亂解析。

⚠️ 順便提醒：我中間試過借用 `lmstudio` provider（看起來 `LM_BASE_URL` 機制剛好可以重用），結果 `hermes_cli/models.py:2633 ensure_lmstudio_model_loaded()` 會打 LM Studio **私有的** `GET /api/v1/models`（回傳 `{"models":[...]}` 非 OpenAI 標準），探測失敗就無聲跳過整個 chat call。**用 `lmstudio` provider 完全錯路，改借 `alibaba` provider 才對**——後者純 OpenAI-compat、沒有私有 probe。

## 🩹 proxy 補洞：四件事一次補齊

不要去改 wrapper（不是我寫的、改了會被 revert）。最乾淨的解法是**在 `127.0.0.1:8910` 起一支 proxy**，把 4 件事一次補齊：

```python
# ~/workspace/breeze2-proxy/proxy.py
"""Breeze2 wrapper 補丁:
原 server (內網 wrapper) 只實作 /v1/chat/completions,缺 /v1/models 端點,
導致 Hermes Agent / Open WebUI / LiteLLM 等 client 預檢失敗。
這支 proxy 補回 /v1/models 並 stream forward 其他請求。
"""
import os
import httpx
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, StreamingResponse

UPSTREAM = os.getenv("BREEZE2_UPSTREAM", "http://<INTERNAL_LLM_HOST>:<PORT>")
MODEL_ID = "breeze2"
MODEL_FULL = "MediaTek-Research/Llama-Breeze2-8B-Instruct"

app = FastAPI(title="Breeze2 proxy (補 /v1/models)")


@app.get("/v1/models")
async def list_models():
    return {
        "object": "list",
        "data": [{
            "id": MODEL_ID, "object": "model", "created": 1709251200,
            "owned_by": "mediatek-research", "permission": [],
            "root": MODEL_FULL, "parent": None,
        }],
    }


def _estimate_tokens(text: str) -> int:
    """Hermes 校驗 response 必須含 usage 欄位,Breeze2 wrapper 沒給,粗估代填:
    中文 1 字 ≈ 1 token,英文 4 字元 ≈ 1 token,混合就取較大值。"""
    if not text:
        return 0
    han = sum(1 for c in text if "一" <= c <= "鿿")
    return max(han, len(text) // 4) or 1


@app.post("/v1/chat/completions")
async def chat(req: Request):
    body_bytes = await req.body()
    import json as _json
    req_payload = _json.loads(body_bytes) if body_bytes else {}

    # 坑 #3: 拔掉 stream=true 再 forward,response 自己包 SSE
    wants_stream = bool(req_payload.get("stream"))
    if wants_stream:
        req_payload.pop("stream", None)
        req_payload.pop("stream_options", None)
        forward_body = _json.dumps(req_payload).encode("utf-8")
    else:
        forward_body = body_bytes

    async with httpx.AsyncClient(timeout=120.0) as c:
        r = await c.post(f"{UPSTREAM}/v1/chat/completions",
                         content=forward_body,
                         headers={"Content-Type": "application/json"})
        data = r.json()

    # 坑 #2: 補 usage 欄位
    if r.status_code == 200 and "usage" not in data:
        prompt_text = " ".join(str(m.get("content","")) for m in req_payload.get("messages",[]))
        completion_text = data.get("choices",[{}])[0].get("message",{}).get("content","") or ""
        pt = _estimate_tokens(prompt_text)
        ct = _estimate_tokens(completion_text)
        data["usage"] = {"prompt_tokens": pt, "completion_tokens": ct, "total_tokens": pt+ct}
        data.setdefault("system_fingerprint", "breeze2-proxy")  # 坑 #4

    if not wants_stream:
        return JSONResponse(content=data, status_code=r.status_code)

    # 坑 #3 後半: 把單一 JSON 拆成 SSE chunks
    completion_id = data.get("id", "chatcmpl-breeze2-proxy")
    created = data.get("created")
    model_name = data.get("model", req_payload.get("model", "breeze2"))
    fingerprint = data.get("system_fingerprint", "breeze2-proxy")
    msg = data["choices"][0]["message"]
    content_text = msg.get("content") or ""
    finish_reason = data["choices"][0].get("finish_reason", "stop")
    usage = data.get("usage")

    def _chunk(delta, finish=None):
        payload = {
            "id": completion_id, "object": "chat.completion.chunk",
            "created": created, "model": model_name,
            "system_fingerprint": fingerprint,
            "choices": [{"index": 0, "delta": delta, "finish_reason": finish}],
        }
        return f"data: {_json.dumps(payload, ensure_ascii=False)}\n\n"

    async def sse_iter():
        yield _chunk({"role": "assistant"})
        if content_text:
            yield _chunk({"content": content_text})
        final = {
            "id": completion_id, "object": "chat.completion.chunk",
            "created": created, "model": model_name,
            "system_fingerprint": fingerprint,
            "choices": [{"index": 0, "delta": {}, "finish_reason": finish_reason}],
        }
        if usage:
            final["usage"] = usage
        yield f"data: {_json.dumps(final, ensure_ascii=False)}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(sse_iter(), media_type="text/event-stream")


@app.get("/health")
async def health():
    async with httpx.AsyncClient(timeout=10.0) as c:
        return (await c.get(f"{UPSTREAM}/health")).json()
```

`requirements.txt`：

```
fastapi==0.115.0
uvicorn[standard]==0.32.0
httpx==0.27.2
```

跑起來：

```bash
cd ~/workspace/breeze2-proxy
uv venv && source .venv/bin/activate
uv pip install -r requirements.txt
uvicorn proxy:app --host 127.0.0.1 --port 8910
```

Hermes 那邊改成借 `alibaba` provider：

```yaml
# ~/.hermes/config.yaml
model:
  default: breeze2
  provider: alibaba
```

```bash
# ~/.hermes/.env
DASHSCOPE_API_KEY=dummy
DASHSCOPE_BASE_URL=http://127.0.0.1:8910/v1
```

**為什麼借 `alibaba`？** 因為 OpenAI 系列 provider 在 Hermes 內部會多打 organization probe，DashScope (`alibaba`) provider 在 Hermes 內部走純 OpenAI 協定、無私有探測，只多注入一句 "You are powered by ..." system prompt（[`run_agent.py:6019`](https://github.com/NousResearch/hermes-agent/blob/main/run_agent.py)），對本地實驗無傷大雅。

## ⚙️ 設 launchd 開機自啟動

每次手動 `uvicorn` 太蠢。寫一個 LaunchAgent，開機 + crash 都自動拉起來：

```xml
<!-- ~/Library/LaunchAgents/com.yanchen.breeze2-proxy.plist -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.yanchen.breeze2-proxy</string>

  <key>ProgramArguments</key>
  <array>
    <string>/Users/yanchen/workspace/breeze2-proxy/.venv/bin/uvicorn</string>
    <string>proxy:app</string>
    <string>--host</string><string>127.0.0.1</string>
    <string>--port</string><string>8910</string>
  </array>

  <key>WorkingDirectory</key>
  <string>/Users/yanchen/workspace/breeze2-proxy</string>

  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>

  <key>StandardOutPath</key>
  <string>/Users/yanchen/workspace/breeze2-proxy/proxy.log</string>
  <key>StandardErrorPath</key>
  <string>/Users/yanchen/workspace/breeze2-proxy/proxy.err.log</string>
</dict>
</plist>
```

掛起來：

```bash
launchctl load -w ~/Library/LaunchAgents/com.yanchen.breeze2-proxy.plist
launchctl list | grep breeze2
# -    0    com.yanchen.breeze2-proxy
```

驗證已掛起：

```bash
curl -s http://127.0.0.1:8910/health | jq .
# { "status": "ok", "model": "MediaTek-Research/Llama-Breeze2-8B-Instruct" }
```

之後**開機 = proxy 自動跑**，崩了 launchd 會自動重啟。

## ✅ 驗收：終端機跑出繁中回應

四件事補齊 + launchd 上線，最後跑：

```bash
curl -s http://127.0.0.1:8910/health | jq .
hermes -z "用一句話介紹自己,30 字以內"
```

<img src="/ai-lecturer-bob/images/blog/hermes-agent-mac-install/terminal-hermes-running.png" alt="Mac 終端機畫面：先 curl proxy /health 回 Breeze2 model 資訊,接著 hermes -z 跑出 Hermes Agent 的繁中自我介紹" style="border-radius: 8px; margin: 1rem 0; width: 100%;" />

Breeze2 回了一段繁中自介。**從 silent fail 到正常輸出，差距就是這支 80 行的 proxy。**

## 🪤 踩坑清單與排查心法

按你會遇到的順序排：

### 坑 1：`hermes -z` 完全空白、exit 0

- **症狀**：stdout 空、`hermes logs errors` 也空、`~/.hermes/sessions/session_*.json` 只記到 user message
- **常見根因**：缺 `/v1/models` 或 `usage` 欄位
- **排查方式**：在 wrapper / proxy 加 access log，看 Hermes 預檢打了什麼

### 坑 2：用 `lmstudio` provider 繞路

- **症狀**：跟坑 1 一模一樣
- **根因**：`hermes_cli/models.py:2633 ensure_lmstudio_model_loaded()` 打 LM Studio **私有** `GET /api/v1/models`，回傳格式跟 OpenAI 不同
- **解法**：別用 `lmstudio`，借 `alibaba`

### 坑 3：stream 拿到單一 JSON 而非 SSE

- **症狀**：Hermes 重試 3 次後吐空
- **根因**：`run_agent.py:15162 _strip_think_blocks(final_response).strip()` 把空 stream 當 empty content
- **解法**：proxy 收到 `stream=true` 先拔掉，response 自己包成 SSE chunks

### 排查心法

**Hermes 最折磨人的地方是它 silent fail**——沒錯誤、沒 log、表面正常。debug 唯一可靠的方法是**在 transport 層加 access log + dump body**，看實際打了什麼、收了什麼。session JSON 是次優的證據（只記得到 user message 就 99% 是 silent drop）。

## ❓ 常見問題

### Q1：可以不用 proxy 直接接 wrapper 嗎？

如果 wrapper 本身就完整實作 OpenAI API（含 `/v1/models`、`usage`、SSE streaming），可以。但很多內部 wrapper 都是「只實作 `/v1/chat/completions`」這種半套版本——遇到就要 proxy。

### Q2：proxy 加在中間會不會很慢？

`127.0.0.1:8910` 是本機，httpx 同步轉發加 SSE 包裝大約多 5-15ms。Breeze2 自己回應就要 1-5 秒，proxy 開銷可以忽略。

### Q3：為什麼不用 LiteLLM？

LiteLLM 是 Python library 加 server，**它自己也吃 OpenAI strict 協定**——同樣會被 wrapper 半套打回。proxy 要寫的東西一樣多，多一層 LiteLLM 反而增加複雜度。

### Q4：Hermes Agent 跟 Claude Code 哪個好？

不同場景。**綁定 Anthropic 用 Claude Code、要自架/多 provider 用 Hermes**。Claude Code 生產級別更穩、Hermes 更彈性但要自己搞 prompt 路由。我兩個都裝。

### Q5：launchd 跑不起來怎麼辦？

看 `proxy.err.log`。最常見的是 venv 路徑寫錯。`.venv/bin/uvicorn` 一定要是絕對路徑、且 `WorkingDirectory` 一定要設成專案根目錄。

## 📚 延伸資源

- [NousResearch/hermes-agent GitHub](https://github.com/NousResearch/hermes-agent)
- [Hermes Agent v0.13.0 Release Notes](https://github.com/NousResearch/hermes-agent/releases/tag/v0.13.0)
- [Apple Developer — Daemons and Services Programming Guide](https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/BPSystemStartup/Chapters/CreatingLaunchdJobs.html)
- [OpenAI API — Chat Completions Reference](https://platform.openai.com/docs/api-reference/chat)
- 我的學術篇姊妹文：[Hermes Agent 為什麼擠進 OpenRouter 前段班](/ai-lecturer-bob/blog/hermes-agent-academic/)
