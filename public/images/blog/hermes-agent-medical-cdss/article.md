> **TL;DR**
> - 本文解決:LLM 給的醫療建議怎麼讓醫師敢用?「ChatGPT 看一下」這種等級在臨床決策上不夠
> - 推薦給:在做領域 AI(醫療 / 法務 / 金融 / 工控)的工程師、想看 LLM 怎麼接 RAG + sandbox + skill 的人
> - 讀完你會知道:Hermes Agent 怎麼把「skill 定義 → 沙盒公式 → RAG 文獻 → LLM 決策」串成可審計 round-trip,以及為什麼這四件套缺一個都不能上臨床

## 📌 目錄

1. [為什麼 ChatGPT 等級的醫療 AI 不能用](#為什麼-chatgpt-等級的醫療-ai-不能用)
2. [我選 Hermes Agent 的理由](#我選-hermes-agent-的理由)
3. [完整架構:8-step pipeline](#完整架構8-step-pipeline)
4. [round-trip 證據鏈:一個血脂治療決策的全紀錄](#round-trip-證據鏈一個血脂治療決策的全紀錄)
5. [Skill 兩層 schema:knowledge vs policy 為什麼要分](#skill-兩層-schemaknowledge-vs-policy-為什麼要分)
6. [沙盒公式:不准 LLM 自己算數](#沙盒公式不准-llm-自己算數)
7. [踩過的坑](#踩過的坑)
8. [Hermes vs 其他 Agent 框架在醫療場景的差別](#hermes-vs-其他-agent-框架在醫療場景的差別)
9. [❓ 常見問題](#-常見問題)
10. [🔗 延伸資源](#-延伸資源)

## 為什麼 ChatGPT 等級的醫療 AI 不能用

我跟合作醫院做心血管領域的血脂治療 CDSS(臨床決策支援系統)。一句話:**病人後續吃哪種血脂藥、什麼時候回診、要不要升階到 PCSK9i**,這套系統要給醫師一個建議。

第一版用 ChatGPT API 包一層 prompt engineering,3 個月後砍掉重做。原因:

- **LLM 算錯數還很有自信** — ASCVD 10 年風險公式 LLM 自己心算,給出像那麼一回事的數字,實際差 5-15 個百分點
- **沒有引用來源** — 醫師問「你說 LDL < 70 是哪本指引?」,LLM 編一個聽起來合理的頁碼,後來查不到
- **同樣的病人每次給不同答案** — temperature 0 也救不了,prompt 沒有強制結構就是會飄
- **不可審計** — 出事不知道是 LLM 哪個 token 想錯,沒辦法 root cause

醫師看完一句話:「**這種東西出事誰負責?**」

那一刻我才搞清楚,**領域 AI 跟「ChatGPT 包一層」是兩種東西**。前者要的不是「夠聰明」,是「可被信任 + 可被審計 + 可被演化」。

![Hermes Agent 醫療 CDSS 架構圖](/images/blog/hermes-agent-medical-cdss/architecture.svg)

## 我選 Hermes Agent 的理由

[Hermes Agent](/ai-lecturer-bob/blog/hermes-agent-intro/) 是 NousResearch 開源的 agent runtime。我看上它的不是「跑 LLM」,是它預設了四件事:

| 機制 | 解決什麼問題 |
|---|:---|
| **skill 機制(SKILL.md)** | LLM 不需要每次都把整本指引塞 prompt,呼叫 `skill_view(name)` 才拉,token 省 80% |
| **sandbox `execute_code`** | LLM 不准自己算 — 公式預先寫成 Python module,LLM 只能 `execute_code` 呼叫 |
| **MCP server 接 RAG** | LLM 自主 `mcp_xxx_search(query)`,拿真實文獻 chunk 回 prompt,不是 LLM 編 |
| **JSONL session trace** | 每一次 tool call、每一段 LLM 輸出,全寫成 JSONL,出事可以 replay |

把這四件套接起來 = **每個決策有「skill 定義 → 公式回傳值 → RAG 引用 chunk → LLM 最終 JSON」四段證據**。醫師問哪一步,我都答得出來。

這就是我說的「round-trip 證據鏈」。

> 第一次裝 Hermes 還沒上手? [Hermes Agent 5 分鐘安裝教學](/ai-lecturer-bob/blog/hermes-agent-quickstart/) 從 0 到第一句 `hermes -z` 跑起來。

## 完整架構:8-step pipeline

整套 CDSS 的調度長這樣(已通用化、把實際內網 port 跟服務名抽掉):

```
clinical-api (Spring Boot, :8080)
    │
    │ POST /analyze (完整 PatientState,含時序)
    ▼
─────────────── Step 1 ───────────────
ai-service router (:8090)
    │
    │ Pydantic schema validator (只擋髒資料,不壓平)
    ▼
─────────────── Step 2 ───────────────
HermesAnalyzer
    │
    │ build_prompt:
    │   ├─ PatientState 完整序列化進 prompt
    │   │   (現用處方、近期 LAB、診斷史完整序列化,不挑欄位)
    │   │
    │   ├─ 工具清單列給 LLM:
    │   │   - skill_view(name)         ← Step 3:讀 SKILL.md
    │   │   - execute_code(python)     ← Step 4:跑公式
    │   │   - search_literature(query) ← Step 5:撈 PDF quote(MCP)
    │   │
    │   └─ SKILL.md 教 LLM 何時用哪個工具
    │
    ▼
hermes -z subprocess (LLM 自己編排 Step 3-5 順序)
    │
    │ 典型走法(LLM 自決):
    │   1. skill_view("lipid-secondary")        ← Step 3
    │   2. execute_code() 跑 ldl_at_goal()      ← Step 4
    │   3. 公式回 False → 從 prompt 看 LAB 軌跡  ← Step 2 的 raw data
    │   4. search_literature("ezetimibe LDL")    ← Step 5
    │   5. 拿到 quote → 生 decision JSON
    ▼
─────────────── Step 6 ───────────────
validator (schema + session log 審計)
    │
    │ persist_summary 寫 ai_summary
    ▼
回傳 AnalyzeResponse → 給醫師看(reviewer-only)
```

重點不是流程多花俏,是**每一步 LLM 做了什麼都有 JSONL 紀錄**。出事不需要靠「LLM 為什麼這樣想」這種玄學問題,直接攤開 trace。

![round-trip 證據鏈 4 段:skill → formula → RAG → JSON](/images/blog/hermes-agent-medical-cdss/pipeline.svg)

## round-trip 證據鏈:一個血脂治療決策的全紀錄

挑一個範例 trace 看實際走法。**所有數字、年齡、藥名、PDF 名都改成範例值**,但決策邏輯跟真實場景一致。

**範例情境**:中年成人,已用高強度 statin(範例 Statin A 20 mg QD)60 週以上。最新 LDL-C = 75 mg/dL,目標 < 55。

### Step 1 — LLM 主動拉 skill 定義

```
skill_view(name="lipid-secondary")
```

→ 回傳 SKILL.md 全文(含 output schema、formula 名單、決策階梯規則)。LLM 看完才知道「這個科別的決策 schema 長什麼樣、有哪些公式可以呼叫」。

### Step 2 — LLM 跑沙盒公式

```python
execute_code({"code": "from formulas.lipid import ldl_at_goal_extreme, needs_pcsk9i; ..."})
```

→ 公式真實回傳:

```json
{
  "at_goal": false,
  "pcsk9": {
    "need": false,
    "reason": "週數未滿:ezetimibe 僅 0 週 (需 ≥ 6),先讓 step 1+2 跑滿",
    "target_used": 55.0,
    "blocked_by": ["ezetimibe 僅 0 週 (需 ≥ 6)"]
  }
}
```

→ formula 算出「未達標,但 PCSK9i 也還不該升 — 先補 ezetimibe」,sandbox 公式跟「6 週評估」門檻邏輯一致。

### Step 3 — LLM 自主呼叫 RAG

```
mcp_rag_search({
  "query": "二級預防 高強度 statin 後 LDL 仍高 加入 ezetimibe",
  "disease_tags": ["hyperlipidemia"]
})
```

→ RAG 真實回傳(pgvector 真實 chunk):

```json
{
  "chunk_id": 15,
  "source": "local_lipid_guideline_2025.pdf",
  "section": "4. Management — part 8/13",
  "disease_tag": "hyperlipidemia",
  "similarity": 0.7432
}
```

→ 證明 round-trip 完整:FastMCP stdio server → asyncpg → pgvector `chunks` 表 → similarity search → 真實 chunk 內容回到 LLM 上下文。

### Step 4 — LLM 最終決策 JSON

```json
{
  "decision": {
    "action": "escalate",
    "rationale": "已用高強度 statin (Statin A 20 mg QD) 滿 60 週,但 LDL-C 75 mg/dL 未達極高風險目標 < 55,依指引階梯需加 ezetimibe...",
    "prescriptions": [
      {
        "drug": "Statin A",
        "atc": "C10AAxx",
        "dose": "20 mg QD",
        "status": "continue",
        "why": "現用高強度 statin,維持基礎治療"
      },
      {
        "drug": "Ezetimibe",
        "atc": "C10AX09",
        "dose": "10 mg QD",
        "status": "add",
        "why": "高強度 statin 治療後 LDL-C 仍未達標,依血脂管理路徑 page 4 階梯式治療加入 ezetimibe。"
      }
    ],
    "follow_up_weeks": 6,
    "citations": [
      {"source": "local_lipid_guideline_2025", "page": "4"}
    ],
    "confidence": 0.88,
    "escalation": null
  }
}
```

### 為什麼這四段缺一個都不行

- **沒 Step 1**:LLM 不知道這科決策 schema,輸出格式亂飄
- **沒 Step 2**:LLM 自己心算 → 概率錯 → 不可審計
- **沒 Step 3**:沒有引用來源 → 醫師不認 → 「你說的這個指引在哪?」
- **沒 Step 4 結構化 JSON**:回給 frontend 解析失敗 → 不能上 production

**這就是「能跑 demo」跟「能進臨床」的差別**。Demo 級只要做 Step 4;臨床級四段全要,而且要可審計。

## Skill 兩層 schema:knowledge vs policy 為什麼要分

Hermes 的 SKILL.md frontmatter 我刻意拆成兩段:

```yaml
skills:
  config:
    outputs: { decision: { ... 結構化 schema ... } }

    knowledge:                    # ← bootstrap loop 寫(PDF → 這裡)
      upstream_literature: [...]
      required_formulas: [...]

    policy:                       # ← feedback loop 寫(醫師覆核 → 這裡)
      thresholds: {ldl_target_secondary: 70, ldl_target_very_high: 55}
      treatment_ladder: [...]
      overrides: []
```

為什麼分?**owner 不同**:

- `knowledge` 段 — 從 PDF mining 出來,owner 是「指引本身」。指引更新才會動。
- `policy` 段 — 醫師覆核累積出來,owner 是「實際照護的醫師」。指引沒變但臨床現場學到的細節走這。

兩段如果混在一起,**更新衝突會無解** — 指引改了想 patch knowledge,但 policy 已經被醫師調過,你 diff 出來分不清哪是指引、哪是現場經驗。

這條教訓很硬:**領域 AI 的 schema 必須反映 owner 邊界**,不是寫起來爽。

## 沙盒公式:不准 LLM 自己算數

`formulas/lipid/` 是 6 支純 Python 函式。我在 SKILL.md 明寫:

> 禁止自己手算 LDL 達標、PCSK9i 是否該升階。**必須 `execute_code` 呼叫 `formulas.lipid` 模組**。

為什麼?因為:

1. **deterministic 算法給 deterministic 工具做** — `ldl_at_goal_extreme(75)` 就是 `False`,沒有「LLM 創意空間」
2. **公式可單元測試** — 改公式要寫測試,跟 LLM 推理無關
3. **公式可被臨床 reviewer 看懂** — 醫師看 Python 比看 prompt engineering 容易多了
4. **trace 看得到參數** — `execute_code({"code": "ldl_at_goal_extreme(75)"})` 入參出參全在 JSONL

這條設計來自一個血淚教訓:**早期版本讓 LLM 自己算 LDL 達標**,跑 100 個案出來,有 4 個 LLM 把 `<` 看成 `≤`,差一條命。

把 deterministic 算法從 LLM 手上收回來,**錯誤率歸零**。

## 踩過的坑

### 坑 1:LLM 漏列現用藥

最早 schema 只要求列「新開的藥」,結果 LLM 給 `prescriptions: [Ezetimibe]`,把病人正在吃的 statin 漏掉。adapter 用 `_carry_over_current_meds` 黑盒子救網,但 trace 看不到 LLM 是不是有真的審過現用藥。

**解法**:Prescription schema 加 `status` 必填(`continue / add / change / stop`),prompt 內加「處方輸出規則段」強制 LLM 列**現用 + 新增/異動**完整清單,每筆標 status。adapter backfill 退為 P001 救網 fallback,trace 看得到 LLM 真審過。

### 坑 2:RAG 多 PDF aggregate cross-bleed

單份 PDF 的 RAG retrieval 92% 命中(N=64),但接 3 份 PDF aggregate 之後掉到 69% [53-82%] (N=36)。原因:lipid 跟 DM 的詞彙重疊,query 「LDL 達標」會把 DM 指引的 chunk 也撈上來。

**解法**:還沒完美解,目前用 `disease_tags` pre-filter 做粗篩,但真正要解需要 query-side disambiguator。這條開誠布公寫在 README 的「現況限制」表,不假裝沒事。

### 坑 3:hermes subprocess timeout

hermes -z 預設沒 timeout,跑 RAG + 多輪推理會卡到 300 秒以上。後來在 runner.py 設 90s 上限,timeout 一律 retry 一次,還是不過就 fallback 到 legacy v5 規則引擎(deterministic 但決策粗)。

**解法**:`subprocess.run(timeout=90)`,timeout 計入 SLO,超過閾值的單發 alert。

## Hermes vs 其他 Agent 框架在醫療場景的差別

| 框架 | RAG 自主呼叫 | sandbox code | skill 機制 | trace 可審計 | 適合醫療? |
|---|:---:|:---:|:---:|:---:|:---:|
| Hermes Agent | ✓ MCP | ✓ execute_code | ✓ SKILL.md | ✓ JSONL | **✓** |
| LangChain Agents | △ 要自己接 | ✗ 預設無 | ✗ | △ verbose log | △ |
| AutoGPT / BabyAGI | ✗ | ✗ | ✗ | ✗ | ✗ |
| Claude Code (CLI) | ✓ MCP | ✓ Bash | ✓ skills/ | ✓ session log | △ 偏 dev 用 |

簡單講:**Hermes 把「醫療 AI 需要的紀律」內建進框架預設**,其他框架你要自己拼。

> 想看 Hermes 在其他場景的應用? [OpenRouter 排行榜 Hermes Agent 為什麼第 2](/ai-lecturer-bob/blog/hermes-agent-academic/) 拆它的結構性優勢。

## ❓ 常見問題

### Hermes Agent 適合做哪類領域 AI?

需要「LLM + 領域知識 + 結構化決策 + 可審計」的場景都適合:醫療 CDSS、法務文件審查、金融風控、工控故障診斷。共通點是「LLM 給的答案要有引用 + 公式 + 可被覆查」。如果你的場景只需要「跟使用者聊天」,Hermes 對你過殺。

### LLM 算數錯誤怎麼徹底解?

把 deterministic 算法**全部**寫成 module,LLM 只能呼叫不能自算。skill 內明寫「禁止自己算 X」,沙盒不執行算數 = 沒爭議。我做完這層之後算數錯誤率歸零。

### RAG 為什麼不直接塞 prompt?

塞 prompt 三個問題:(1) token 上限撐不住一整本指引(2) LLM 看 1 萬字會抓重點失誤(3) prompt 變大 latency 跟成本同步爆。讓 LLM 自己 query RAG 才拉相關段落,精準度跟成本同時好。

### Hermes 跟 Claude Code 在這場景上的差別?

Claude Code 偏開發者 CLI(寫 code、改 repo),[Hermes Agent](/ai-lecturer-bob/blog/hermes-agent-intro/) 偏 production 級 agent runtime(可嵌服務、subprocess 調度、JSONL trace)。我這套醫療系統用 Hermes 是因為需要把它包在 FastAPI 後面當 production 服務跑,Claude Code 不是設計來做這件事的。

### 這套架構好複製嗎?

skill 庫 + sandbox formula + RAG MCP 三件套要 40 小時左右半手工,但**架構是通用的**,你只要把領域指引換成你的、formula 換成你的算法、PDF 換成你的文獻就能套。我寫了 RECREATE_SOP 在 repo 裡。

### 醫師願意用嗎?

**會用 + 會覆核**才是目標。我們的設計是 reviewer-only,AI 給建議、醫師最後決定。覆核資料 → feedback → 累積到門檻自動 patch SKILL.md → 系統自演化。醫師會用是因為「我改的東西真的被學進去」,而不是「我每次都要從頭教 AI」。

## 🔗 延伸資源

- [Hermes Agent 完全新手指南](/ai-lecturer-bob/blog/hermes-agent-intro/) — 系列 pillar,從 0 認識 Hermes
- [Hermes Agent 5 分鐘安裝教學](/ai-lecturer-bob/blog/hermes-agent-quickstart/) — 跨平台安裝完整步驟
- [AI Agent 沙盒怎麼選?7 種隔離方案比較](/ai-lecturer-bob/blog/hermes-agent-sandbox/) — execute_code 沙盒實測
- [OpenAI API proxy 補洞:Mac + FastAPI + launchd 接內網 LLM](/ai-lecturer-bob/blog/hermes-agent-mac-install/) — 醫院內網 LLM 接法
- [OpenRouter 排行榜 Hermes Agent 為什麼第 2](/ai-lecturer-bob/blog/hermes-agent-academic/) — 結構性原因拆解
- [Hermes Agent GitHub](https://github.com/NousResearch/hermes-agent) — 官方 repo
- [Model Context Protocol(MCP)](https://modelcontextprotocol.io/) — RAG 接 LLM 的標準協議

---

> 我輩修行之人,以聖的標準要求自己,以凡的眼光理解別人。
