# 讓 Claude 每天早上幫你寫一封 SEO 解讀信：cron + claude -p stateless 走 Max 訂閱 0 元 pipeline

> 系列前篇：[我請 AI 每天早上 9 點寄 SEO 報告給我，從想到能用花了 1 小時](/blog/ai-daily-seo-email-bot/)。前篇是「故事版」，這篇是「實作版」 — 把那套 raw 數據報表升級成「**Claude 本人寫的分析信**」。

## TL;DR

舊版每天寄一封信給我：`UV 17 人 / PV 4 次 / 過去 7 天 Top 5 查詢 ...` 一坨數字。**看是看了，但沒人解讀**。我得自己腦補「這算多還是少？」「為什麼這個 query 掉了？」「今天要不要動什麼？」 — 然後通常就懶得想，信看完關掉。

新版加了一個 step：**在寄信前，把昨天的 GSC + Firestore 數字丟給 `claude -p`，要它用繁體中文吐回三段：一句總評、需要注意、今天可以做**。整段 ≤ 250 字、直接、不奉承。寄到信箱時數字在下面、Claude 分析在上面 — **打開信先看到「今天值不值得花 5 分鐘動手」**。

成本：**0 元**（走 Claude Code Max 訂閱、stateless `claude -p` 模式）。原本 213 行 bash 加了 35 行（一個 prompt + 一個 `claude -p` 呼叫 + fallback），整個 round-trip 32 秒。

這篇講怎麼做 — 環境準備、prompt 設計、改腳本、跑一次驗證、踩坑、抄回家自己用。

## 目錄

1. 為什麼 raw 數據不夠 — 動線太重的問題
2. 一張圖看新舊差異
3. Step 1：先有 raw 數據 pipeline（前提）
4. Step 2：寫 Claude prompt（最重要、決定信品質的一段）
5. Step 3：改腳本接 `claude -p` stateless
6. Step 4：跑一次驗證 round-trip
7. 5 個踩坑
8. 抄回家自己用：要改哪幾個地方
9. 澄清：這跟 claude.ai 接 Gmail 完全不同
10. FAQ

## 1. 為什麼 raw 數據不夠

舊版信長這樣：

```
ai-lecturer-bob 每日 SEO 報告
資料日期：2026-05-21（GSC 數據點：2026-05-18，有 3-4 天延遲）

──────────────────────────
【昨日站內流量（Firestore）】
UV：17 人  PV：4 次

【GSC 2026-05-18 單日】
  曝光 234｜點擊 12｜CTR 5.1%｜平均排名 28.4

【過去 7 天 Top 5 查詢】
  1. claude code skill｜曝光 1234｜點擊 56｜排名 8.2
  2. ...
```

**問題**：這只是把 GSC 後台搬到信箱。我每天打開信，腦袋還是要自己跑這套：

- 「昨天 17 UV 算多嗎？」 → 我得記住前 7 天平均
- 「`claude code skill` 排名 8.2 是不是退步了？」 → 我得記住上週數字
- 「過去 28 天 Top 10 裡突然冒出來一個沒看過的 query，這代表什麼？」 → 我得自己解讀
- 「今天要不要為某個 query 補文章？」 → 通常想到這步就放棄了，因為**動腦成本高**

換句話說：**raw 數據 = 把判斷成本推給我**。看完信我還要花 10-15 分鐘才能做出今天的動作。10 分鐘的隱性成本足以讓我選擇「今天先不看」 — 然後 SEO 監測又變回黑盒子。

我要的不是「數據儀表板」，是「**今天該做什麼的建議**」。這正好是 LLM 擅長的事 — 給它數字 + 上下文，要它給你一句「今天值得做這件事」。

## 2. 一張圖看新舊差異

**舊 pipeline（5 步）**：

```
launchd 07:07
   │
   ▼
[1] 算日期變數
[2] GSC API 抓四個 query（單日 / 7 天查詢 / 7 天頁面 / 28 天 Top）
[3] Firestore 抓 PV/UV
[4] 把所有字串塞進 BODY heredoc
[5] SMTP TLS 寄出
   │
   ▼
📬 信（純 raw 數字）
```

**新 pipeline（多一步，6 步）**：

```
launchd 07:07
   │
   ▼
[1] 算日期變數
[2] GSC API 抓四個 query
[3] Firestore 抓 PV/UV
[4] ★ 把所有數字組成 prompt，丟給 claude -p stateless 跑分析（60-90 秒）
[5] 組 BODY：Claude 分析放上面、raw 數字放下面
[6] SMTP TLS 寄出
   │
   ▼
📬 信（Claude 解讀 + raw 數字對照）
```

只多一步、整個 pipeline 從 ~10 秒變 ~32 秒、信長度從 800 字變 1000 字。**但讀信體感差很多** — 打開先看到一句「今天可以為 X 改個 title」，不用自己想。

## 3. Step 1：先有 raw 數據 pipeline（前提）

如果你還沒有「每天自動抓 SEO 數字 + 寄信」的 pipeline，先去看[前篇文章](/blog/ai-daily-seo-email-bot/)的 step-by-step。簡述前提：

- macOS launchd plist（cron 也行，Linux 用 systemd-timer）每天觸發 `daily-seo-email.sh`
- 腳本內含 GSC OAuth refresh token、Firestore REST API、Gmail SMTP App Password
- 完整 213 行 bash 在 `/Users/yanchen/.claude/scripts/daily-seo-email.sh`

如果你完全沒有 SEO 數據可分析，這篇對你還是有用 — Claude 分析這層的設計（prompt + stateless + fallback）可以套到**任何「raw 數字 → 想要 LLM 解讀」的場景**：每日銷售報表、weekly RSS 摘要、log 異常分析、stock 開盤前的快訊 ⋯ 邏輯都一樣。

## 4. Step 2：寫 Claude prompt（最重要的一段）

這是整個改造的**核心**。Claude 分析品質 = prompt 品質。

### 原則

寫這支 prompt 我來回改了 5 版，最後落在四個原則：

1. **角色給死**：「你是 ai-lecturer-bob (yanchen.app) 的 SEO 顧問」 — 不要讓 LLM 自己猜身分
2. **數據結構化**：用區塊（`【昨日站內】` / `【GSC 單日】`）餵，不要把所有數字塞成一坨
3. **輸出格式限死**：要它**只**回三段（總評 / 注意 / 今天可以做），每段字數上限、不要 markdown、不要 bullet
4. **反 LLM 廢話**：明寫「不要『太棒了』『整體表現良好』這種廢話」「如果沒事就講『沒事』」 — 這條最關鍵，沒寫的話它會給你「您的網站表現良好，建議持續優化內容質量」這種狗屁

### 最終版 prompt

```text
你是 ai-lecturer-bob (yanchen.app) 的 SEO 顧問。下面是今天的 GSC + Firestore 數據。

【昨日站內（${YESTERDAY}）】
UV ${UV} 人 / PV ${PV} 次

【GSC ${GSC_DATE} 單日】
${GSC_DAY}

【過去 7 天 Top 查詢（${GSC_WEEK_START} ~ ${GSC_DATE}）】
${GSC_WEEK}

【過去 7 天 Top 頁面】
${GSC_PAGES}

【過去 28 天 Top 查詢（${GSC_MONTH_START} ~ ${GSC_DATE}）】
${GSC_MONTH_TOP}

請用繁體中文輸出三段，總共 ≤ 250 字，不要 markdown 標題、不要 bullet，每段 1-3 句：

【一句總評】
（昨天/這週整體狀態，例：流量穩、查詢結構健康/某 query 突然漲）

【需要注意】
（最值得關注的 1-2 件事：某 query 排名滑落、某熱門頁面點擊歸零、CTR 異常低、新冒出來的 query 等）

【今天可以做】
（具體一件事，5 分鐘以內可動手：補哪個 query 的新文章、改某頁的 title、申請哪個 query 的新 backlink 等）

風格：直接、簡潔、口語、不奉承、不要「太棒了」「整體表現良好」這種廢話。如果沒有特別事件就講「沒事」。
```

### Prompt 設計關鍵點

| 設計選擇 | 為什麼這樣 |
|---|---|
| 三段固定格式 | 信內排版好對齊；輸出穩定可預測 |
| ≤ 250 字 | 信不能太長，讀者掃一眼就懂 |
| 「不要 markdown」 | 純文字信不渲染 markdown，`**粗體**` 會直接顯示成 `**粗體**`，醜 |
| 三個視角的數據（單日 / 7 天 / 28 天） | Claude 才能對比「今天 vs 趨勢」，沒有對比就只能空談 |
| 「如果沒事就講『沒事』」 | 阻止 Claude 為了交差硬擠分析 |
| 給範例（「例：補哪個 query 的新文章」） | few-shot anchor，輸出會貼近範例的具體度 |

### 對比反面教材

第 1 版我這樣寫：「請分析以下 SEO 數據並給建議」 → Claude 回我 600 字「您的網站近期表現穩定，CTR 略有提升，建議持續關注核心關鍵字 ⋯」 — **完全沒看數字**、像 ChatGPT 寫 LinkedIn 貼文。

第 5 版（上面這版）我跑了 7 天，每天分析都不一樣、都看到了**當天具體的數字**，從沒寫過「持續關注」「持續優化」這類廢話。**約束才是品質的來源**。

## 5. Step 3：改腳本接 `claude -p` stateless

`claude -p "..."` 是 Claude Code CLI 的 stateless 模式：吃一段 prompt、吐一段 response、結束。**不啟動 session、不開 UI、不需要 API key**（走你機器登入的 Max 訂閱）。

CLAUDE.md 那邊的設定我以前寫過：「**長批次 LLM 任務 ⋯ 用 `claude -p` stateless 模式，走 Max 訂閱、0 額外成本**」。這個正好是場景。

### 改動：在原 `daily-seo-email.sh` 的 Step 3 跟 Step 5 之間插入 Step 4

```bash
# --- Step 4: Claude 分析（stateless，走 Max 訂閱、0 額外成本）---
CLAUDE_PROMPT=$(cat <<PROMPTEOF
你是 ai-lecturer-bob (yanchen.app) 的 SEO 顧問。下面是今天的 GSC + Firestore 數據。

【昨日站內（${YESTERDAY}）】
UV ${UV} 人 / PV ${PV} 次

【GSC ${GSC_DATE} 單日】
${GSC_DAY}

【過去 7 天 Top 查詢（${GSC_WEEK_START} ~ ${GSC_DATE}）】
${GSC_WEEK}

【過去 7 天 Top 頁面】
${GSC_PAGES}

【過去 28 天 Top 查詢（${GSC_MONTH_START} ~ ${GSC_DATE}）】
${GSC_MONTH_TOP}

請用繁體中文輸出三段，總共 ≤ 250 字，不要 markdown 標題、不要 bullet，每段 1-3 句：

【一句總評】
（昨天/這週整體狀態）

【需要注意】
（最值得關注的 1-2 件事）

【今天可以做】
（具體一件事，5 分鐘以內可動手）

風格：直接、簡潔、口語、不奉承。如果沒有特別事件就講「沒事」。
PROMPTEOF
)

echo "[4] Claude 分析中..."
if command -v claude >/dev/null 2>&1; then
  CLAUDE_INSIGHT=$(env -u CLAUDECODE timeout 90 claude -p "$CLAUDE_PROMPT" 2>&1)
  CLAUDE_RC=$?
  if [ "$CLAUDE_RC" != '0' ] || [ -z "$CLAUDE_INSIGHT" ]; then
    CLAUDE_INSIGHT="（Claude 分析跳過：exit=$CLAUDE_RC 或空輸出。raw 數據如下，自己看。）"
    FAILED_STEPS="$FAILED_STEPS Step4(claude rc=$CLAUDE_RC)"
    echo "[4] Claude 分析失敗 rc=$CLAUDE_RC"
  else
    echo "[4] Claude 分析 OK ($(echo "$CLAUDE_INSIGHT" | wc -c | tr -d ' ') chars)"
  fi
else
  CLAUDE_INSIGHT="（claude CLI 未安裝，跳過分析）"
  FAILED_STEPS="$FAILED_STEPS Step4(claude-not-found)"
fi
```

### 關鍵設計

| 設計 | 為什麼 |
|---|---|
| `env -u CLAUDECODE` | 從 Claude Code session 內生 child claude 進程時要清掉 `CLAUDECODE` 環境變數，不然會卡住或行為怪。CLAUDE.md 紀錄過 |
| `timeout 90` | Claude 偶爾抽風會掛 30 秒以上，給 90 秒上限、超時當失敗 |
| `command -v claude` | 先確認 CLI 存在，沒裝就 fallback 不擋寄信 |
| FAILED_STEPS 追蹤 | 跟原本一致：分析失敗信還是寄、信末附「失敗步驟」讓我知道 |
| 不擋寄信 | 分析掛了 raw 數據還是要寄 — **信寄不出去比信沒分析糟糕** |

### 改動 Step 5（信內容）

原本 BODY 只有 raw 數字，現在最上面塞一塊 Claude 分析：

```bash
BODY=$(cat <<MAILEOF
ai-lecturer-bob 每日 SEO 報告
資料日期：${YESTERDAY}（GSC 數據點：${GSC_DATE}，有 3-4 天延遲）

══════════════════════════════════
🤖 Claude 今日洞察
══════════════════════════════════
${CLAUDE_INSIGHT}

══════════════════════════════════
📊 Raw 數據
══════════════════════════════════

──────────────────────────────────
【昨日站內流量（Firestore）】
UV：${UV} 人  PV：${PV} 次

⋯ 原本的 raw 數據區塊都保留 ⋯
MAILEOF
)
```

**順序很重要**：Claude 分析在上、raw 數據在下。讀者打開信先看到「**今天可以做 X**」，想驗證才會往下滑看數字。如果順序反過來，讀者一打開先看到一堆數字，腦袋已經累了，到 Claude 分析時注意力剩 30%。

## 6. Step 4：跑一次驗證 round-trip

改完後**手動跑一次**確認真的 work：

```bash
$ env -u CLAUDECODE bash ~/.claude/scripts/daily-seo-email.sh
[1] YESTERDAY=2026-05-21 GSC_DATE=2026-05-18
[2] GSC done
[3] PV=4 UV=17
[4] Claude 分析中...
[4] Claude 分析 OK (658 chars)
[5] EMAIL OK
```

**[4] Claude 分析 OK** + **[5] EMAIL OK** 兩個都有 = 真的成功。

**但這還不算 round-trip**。CLAUDE.md 寫過：handshake（process 跑完）不算修好，要 round-trip — **從輸入端進、輸出端出、人看得到結果**。所以還要：

1. 打開 Gmail
2. 看到今天那封 SEO 日報
3. 信最上面真的有「Claude 今日洞察」區塊
4. 三段格式（總評 / 注意 / 今天可以做）真的吐出來
5. 內容真的看了昨天的數字、不是空泛廢話

我打開 Gmail 看了。寄到、有分析、內容貼著昨天的數字。round-trip 完成。

## 7. 5 個踩坑

### 7.1 `env -u CLAUDECODE` 沒清，腳本卡死

第一版直接 `claude -p "$PROMPT"`，跑起來卡 60 秒、timeout 殺掉。看 process tree 才發現它把 prompt 解讀成「在 Claude Code session 內」，啟動 stateful 模式。加 `env -u CLAUDECODE` 後正常。

**教訓**：在 Claude Code session 內 spawn 子 claude 進程，**永遠先 `env -u CLAUDECODE`**。

### 7.2 prompt 沒給格式範例，Claude 亂發揮

第 1 版 prompt 只說「請分析以下數據並給建議」 → 回我「您的網站近期表現穩定 ⋯」官腔六百字。

**教訓**：LLM 預設模式是「客氣場面話」，要打破就明寫格式約束 + 反面案例。

### 7.3 信用純文字格式，markdown 不渲染

我一度想讓 Claude 用 `**粗體**` 標重點，結果信寄出來 `**` 字面顯示。SMTP 寄的是 `MIMEText(..., 'plain', 'utf-8')` — 純文字、不渲染 markdown。

**教訓**：寄純文字信時，**明寫「不要 markdown」**。要 markdown 渲染要走 `MIMEText(..., 'html', 'utf-8')` 改 HTML 版本，太多副作用，懶得改。

### 7.4 timeout 90 不夠

第一版我給 60 秒 timeout，某次 Claude 拖到 67 秒，被 kill。改 90 秒之後沒再炸過。

**教訓**：本機 `claude -p` 平均 8-15 秒，但 Anthropic API 偶爾延遲，給 90 秒比較穩。如果你網路慢可以給 120 秒。

### 7.5 失敗 fallback 一定要有

如果某天 Claude API 壞了 / 我 quota 滿了 / network 斷了，分析會失敗。但**信還是要寄** — raw 數據才是底線。所以 `CLAUDE_INSIGHT` 失敗時 fallback 成「分析跳過」，信照常寄、只是少了分析區塊。

**教訓**：**新功能掛掉不能讓舊功能也掛**。Claude 分析是 nice-to-have，raw 數據是 must-have，順序不能反。

## 8. 抄回家自己用

如果你想抄這套：

| 你要改的東西 | 在哪 |
|---|---|
| 角色描述（「你是 X 的 Y 顧問」） | prompt 第一行 |
| 你的數據區塊 | prompt 中段 `【⋯】` 那幾段 — 你的 raw 數字塞進去 |
| 輸出格式 | prompt 後半（總評 / 注意 / 今天可以做） |
| `daily-seo-email.sh` 路徑 | 你自己的腳本路徑 |
| `claude` CLI | 確保有裝（`brew install claude` 或從 [claude.com/code](https://claude.com/code)） |
| 訂閱方案 | Claude Max 或 Pro。`claude -p` 走訂閱不算 API 費用 |

如果你不用 Claude Code、想走 Anthropic API：把 `claude -p "$PROMPT"` 改成 `curl https://api.anthropic.com/v1/messages -H "x-api-key: $KEY" ⋯`，邏輯一樣，差別是要 API key、要算 token 費用。

## 9. 澄清：這跟 claude.ai 接 Gmail 完全不同

寫這篇時我自己一度混亂，記得「我有在 claude.ai 設過跟 Gmail 連結」 — 對，**那是真的**，但**跟這個 pipeline 無關**。兩條路：

| 條目 | claude.ai Gmail Connector | 這套 SEO 日報 |
|---|---|---|
| 入口 | claude.ai → Settings → Connectors | macOS launchd |
| 用途 | 在 claude.ai 對話時讓 Claude **讀** Gmail 信 | 每天定時**寄** SEO 信 |
| 寄信機制 | Gmail OAuth | Gmail SMTP TLS + App Password |
| 觸發方式 | 你在網頁聊天時 Claude 主動呼叫 | macOS cron 自動觸發 |
| 需要 Claude Code CLI 嗎 | 不用 | 要（Step 4 那段） |

**簡單講**：connector 是「讓 Claude 看到你信箱」，這套是「自動寄信給你」。同樣是 Gmail，但根本不同的協議（OAuth vs SMTP）、不同的方向（讀 vs 寫）、不同的觸發者（人 vs cron）。

如果你想做的是「**Claude 看完我信箱自動回信**」 → 那是 claude.ai connector 那條路。如果你想做的是「**讓 Claude 每天自動生一份報告寄給我**」 → 是這篇講的這條路。

## 10. FAQ

**Q1：為什麼不直接讓 Claude Code 寄信？**

A：Claude Code 沒有「主動排程跑」的能力 — 它是 session-based、要有人開啟 CLI 才會跑。要每天 07:07 自動跑就得靠系統層的 cron / launchd / systemd-timer。所以這套設計是：**系統排程觸發 bash → bash 呼叫 `claude -p` 跑一次性分析 → bash 寄信**。Claude 在這套裡是「批次任務 worker」，不是「主控者」。

**Q2：`claude -p` 真的免費嗎？**

A：**對 Max / Pro 訂閱者來說 0 額外成本**。`claude -p` 走的是你機器登入的訂閱 quota，跟你在 Claude Code 裡聊天用的是同一份額度。Max $200/月 給的額度幾乎用不完（除非你瘋狂跑大批次）。Pro $20/月 也夠用，每天分析一次 250 字輸出，月用量微不足道。**但如果你不是訂閱戶、要走 Anthropic API**，每次分析會花 ~$0.001-0.005，每月還是不到 $1。

**Q3：Claude 分析會不會出錯誤建議？**

A：會。LLM 不會看真實情境，只會看數字。它可能建議「為某 query 補文章」但那 query 已經有文章 — 因為它不知道。**所以我把它定位成「方向參考」不是「執行命令」**。每天看一眼，覺得 make sense 就做，不 make sense 就忽略。LLM 提案 + 人類過濾 = 平均 30% 有用、70% 不重要，這個比率對我 ROI 已經很高 — 因為**每天 5 分鐘的提案門檻太低**，30% 有用就賺了。

**Q4：可以改成每週一次嗎？**

A：可以。launchd plist 把 `StartCalendarInterval` 改成 `<key>Weekday</key><integer>1</integer>` 就只有週一觸發。但我**不推薦** — 每週一次的問題是「訊號太弱」，週一你看完信，週二三四五都不會想起來。每天一次反而養成習慣，**raw 數據五分鐘看完，Claude 分析 30 秒讀完，沒事就略過**，這個節奏最舒服。

**Q5：prompt 怎麼進化？**

A：跑一陣子後你會發現 Claude 重複講同樣的事（例如老是叫你「更新 sitemap」），那就在 prompt 加一條「**不要重複建議過去 7 天提過的事**」。或是發現它分析太樂觀，加「**只關注壞消息**」。Prompt 是個可演化的東西，**不是寫一次就不動**。

**Q6：可以接到 Slack 不寄 Gmail 嗎？**

A：可以。把 Step 5 寄信改成 Slack webhook：

```bash
curl -X POST -H 'Content-Type: application/json' \
  -d "{\"text\":\"$BODY\"}" \
  https://hooks.slack.com/services/YOUR/WEBHOOK
```

Slack 有 markdown 渲染，可以把 prompt 「不要 markdown」改成「用 Slack mrkdwn 格式」。

**Q7：Claude 為什麼不直接 GSC OAuth 自己抓資料？**

A：技術上可以 — `claude -p` 配 MCP server 接 GSC API，讓 Claude 自己查、自己分析、自己寫信。**但複雜度爆炸**。MCP server 要寫、要除錯、要管 OAuth state。**90% 的場景 bash + Python 已經夠**，bash 抓資料、Claude 分析資料、bash 寄信 — 三件事各自簡單。**過度設計是寫程式的最大原罪**，YAGNI 優先。

## 延伸資源

- 系列前篇（故事版）：[我請 AI 每天早上 9 點寄 SEO 報告給我](/blog/ai-daily-seo-email-bot/)
- 系列主文：[我把買網域+整站搬家交給 AI 跑](/blog/ai-buy-domain-migration-yanchen-app/)
- Claude Code CLI 官方：https://claude.com/code
- Claude Code stateless mode（`claude -p`）官方說明：https://docs.claude.com/en/docs/claude-code/cli-reference
- `env -u` 變數清除（macOS / Linux）：`man env`
- macOS launchd 教學：https://www.launchd.info/
- 前篇講的 GSC API + Firestore + SMTP TLS 全套，這篇 build on top

---

兩篇湊起來，這個系列的 message 很單純：

**第 1 階段（前篇）**：把 cron + GSC + SMTP 串起來，得到「每天有信」 — 解決「我去找它」的動線問題。

**第 2 階段（本篇）**：把 Claude 插到 cron 跟信箱中間，得到「信會解讀」 — 解決「raw 數據需要我自己腦補」的判斷成本問題。

階段 1 把資料從「儀表板」搬到「信箱」、階段 2 把資料從「數字」翻譯成「動作建議」。**每一步都是把人從『多想 10 分鐘』裡解放出來** — 真正的 AI 自動化，是讓你**不用想**，不是讓你「看 AI 想了什麼很驚奇」。

如果你也想做，從前篇的 8 步驟開始抄，抄完套用本篇的 Step 4（35 行 bash）就有 Claude 分析了。整個改造 30 分鐘，**之後每天 30 秒讀信**。
