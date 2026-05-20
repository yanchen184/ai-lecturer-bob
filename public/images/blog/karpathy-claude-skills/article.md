> **TL;DR**
> - 本文解決：看到「卡巴西的 Claude Skill 紅到 108k stars」想知道值不值得裝？
> - 推薦給：已經在用 Claude Code、看到中文圈 KOL 推 Karpathy 規則、不確定要不要照搬的工程師
> - 讀完你會知道：四條規則內容是什麼、跟你既有 rules 重疊多少、哪兩條真的值得抄、為什麼不建議整份裝。

<img src="/images/blog/karpathy-claude-skills/github-repo.png" alt="forrestchang/andrej-karpathy-skills GitHub repo 社群預覽 — Karpathy Claude Code skills 108k stars" style="border-radius: 8px; margin: 1rem 0; width: 100%;" />

## 📌 目錄

1. [卡巴西是誰，為什麼這份檔案紅到 108k stars](#卡巴西是誰為什麼這份檔案紅到-108k-stars)
2. [四條規則完整解析](#四條規則完整解析)
3. [跟你既有 Claude Code 設定重複多少](#跟你既有-claude-code-設定重複多少)
4. [真的值得抄的兩條](#真的值得抄的兩條)
5. [從 0 開始：兩種安裝方式](#從-0-開始兩種安裝方式)
6. [我自己的判斷與調整](#我自己的判斷與調整)
7. [延伸資源](#延伸資源)

## 🧠 卡巴西是誰，為什麼這份檔案紅到 108k stars

「卡巴西」是中文圈對 **Andrej Karpathy** 的音譯——前 OpenAI 創始成員、Tesla AI 前主管、現在做 Eureka Labs。他在 2026 年初的一則貼文裡列了 LLM 寫程式時最常踩的坑：

- 沒搞清楚假設就動手
- 不會主動承認自己困惑
- 一被叫去寫 code 就過度抽象
- 改了不該改的鄰近檔案
- 不知道「做完」長什麼樣

這些觀察本身沒什麼特別，**特別的是有人把它寫成了 70 行的 `CLAUDE.md`**——開發者 **Forrest Chang** 把 Karpathy 的觀察整理成四條可執行的行為規範，放上 GitHub 取名 `andrej-karpathy-skills`。

repo 一週衝到 43k stars，現在 108k。**這是 GitHub 上少數「不靠程式碼、只靠文字檔」紅起來的 repo**。

它的本質是一個 `CLAUDE.md`——你可以把它放到任何 Claude Code 專案根目錄，Claude 啟動時會自動讀進 system prompt，把這四條規則套用到那個專案的所有對話。

## ⭐ 四條規則完整解析

直接抄官方原文（[forrestchang/andrej-karpathy-skills/CLAUDE.md](https://github.com/forrestchang/andrej-karpathy-skills/blob/main/CLAUDE.md)），不改寫：

### 1. Think Before Coding — 動手前先想清楚

> **Don't assume. Don't hide confusion. Surface tradeoffs.**

執行細則：

- 把假設講出來。不確定就問。
- 如果有多種解讀，**列出來**，不要默默挑一個。
- 如果有更簡單的做法，**講出來**，必要時推回需求。
- 有任何不清楚的點，停下，講出**到底哪裡卡住**，問。

這條打的是 LLM 最常見的毛病：**自信地往錯方向衝**。

### 2. Simplicity First — 最小可行程式碼

> **Minimum code that solves the problem. Nothing speculative.**

執行細則：

- 不要寫沒被要求的功能
- 不要為一次性 code 做抽象
- 不要加沒被要求的「彈性」「可配置性」
- 不要為不可能發生的情境加 error handling
- 寫了 200 行，能寫成 50 行就重寫

對照問題：**「資深工程師會說這太複雜嗎？」** 會就簡化。

### 3. Surgical Changes — 只動該動的

> **Touch only what you must. Clean up only your own mess.**

執行細則：

- **不要**「順手」改鄰近的 code、註解、格式
- **不要**重構沒壞的東西
- 對齊既有風格，**就算你覺得自己會寫得更好**
- 看到無關的 dead code，**講出來，不要刪**
- 你的改動製造的孤兒 import / variable / function 才該你清

驗收標準：**每一行改動都能直接追溯到使用者的需求**。

### 4. Goal-Driven Execution — 目標驅動

> **Define success criteria. Loop until verified.**

把任務轉成可驗證的目標：

- 「加 validation」→ 「寫測試驗無效輸入，讓它通過」
- 「修 bug」→ 「寫一個能重現 bug 的測試，讓它通過」
- 「重構 X」→ 「重構前後測試都要通過」

多步任務時，先講出簡短計畫 + 驗證點。

## ⚖️ 跟你既有 Claude Code 設定重複多少

如果你已經用 Claude Code 一陣子、有自己的 `~/.claude/rules/` 或 CLAUDE.md，先別急著裝。我把 Karpathy 的四條規則跟「Claude Code 預設行為 + 常見社群 rule set」對齊一下：

| Karpathy 規則 | Claude Code 內建 system prompt | 常見社群 rule | 重疊度 |
|---|:---:|:---:|:---:|
| Think Before Coding | △ 部分 | ✓ Plan-first / Planner agent | **高** |
| Simplicity First | ✓ 「不要超過任務需要的功能」 | ✓ KISS / YAGNI | **高** |
| Surgical Changes | △ 部分（prefer Edit > Write） | ✓ Coding-style 不可變動 | **中** |
| Goal-Driven Execution | ✗ 沒明說 | ✓ TDD workflow | **中** |

**真正空白的，只有兩個地方：**

1. **「多種解讀要列出來，不要默默挑一個」** — 這條 Claude Code 預設沒有。預設行為比較傾向「猜一個合理的開始做」。
2. **「每一行改動都能追溯到使用者需求」** — 這個驗收標準很犀利。沒有這條的話，code review 沒有具體判準。

其餘四條的精神大部分被既有 rule 蓋掉。

## 🔥 真的值得抄的兩條

如果你不想整份裝（後面解釋為什麼不建議），這兩條我會單獨抄進自己的 rule：

### 抄第一條：「If multiple interpretations exist, present them - don't pick silently.」

把這句加進 `~/.claude/rules/common/coding-style.md` 的 ambiguity 段落。

**為什麼有用：** Claude 默默挑一個解讀去做，你看完成品才發現方向錯了——這個成本是返工。叫它先列出來給你選，前置 30 秒換掉幾十分鐘的返工。

### 抄第二條：「Every changed line should trace directly to the user's request.」

把這句加進 code-reviewer agent 的 system prompt。

**為什麼有用：** 這是一個**單一驗收標準**，不需要主觀判斷。看 diff 時逐行問「這行對應使用者哪句話？」答不出來就是順手改，砍掉。

這比「請 review 一下這段 code 寫得好不好」具體得多。

## ⚡ 從 0 開始：兩種安裝方式

### 前置需求

- **Claude Code CLI**：`/plugin` 指令需要 plugin 系統，2026-04 之後版本內建。沒裝的去 [docs.claude.com/en/docs/claude-code/setup](https://docs.claude.com/en/docs/claude-code/setup)。
- **Git**：clone repo 或用 curl 下載。
- 沒了。**這是純 markdown 規範，不需要 Node / Python。**

### A. Plugin 方式（全域生效）

```bash
/plugin marketplace add forrestchang/andrej-karpathy-skills
/plugin install andrej-karpathy-skills@karpathy-skills
```

裝完之後 Claude Code 啟動時會自動載入這四條規則。

### B. 單檔放專案根目錄（只對該專案生效）

```bash
curl -o CLAUDE.md https://raw.githubusercontent.com/forrestchang/andrej-karpathy-skills/main/CLAUDE.md
```

這個方式更靈活——只在你想守規矩的專案放，其他專案不受影響。**我推薦這個**。

### 怎麼接到既有 rule

如果你已經有 CLAUDE.md，**不要直接覆蓋**。把 Karpathy 那四條附在你現有規則後面，前面加一行：

```markdown
## Karpathy 行為規範（補充）

以下規則來自 Karpathy 對 LLM coding 失誤的觀察，跟我的既有 rules 互補：

[四條規則內容]
```

這樣兩套規則並存，不會撞車。

## 📅 我自己的判斷與調整

我自己 5-6 年 Java 後端 + 2 年 AI 工程，企業內訓帶過 10-50 場。看完這份 `CLAUDE.md` 我的結論：

**裝法分三種，按場合選：**

| 場合 | 建議 |
|---|---|
| Claude Code 新手，沒寫過自己的 rules | **整份裝**，當教練 |
| 已有自己的 rules（像我），跟既有設定重疊 80% | **只抄那兩條空白點** |
| 有公司 / 團隊 rules 不能改 | **看，不裝** —— 拿這四條當 review checklist |

**為什麼不建議無腦整份裝：**

- 你的 rules 比 Karpathy 70 行版本詳細很多倍
- 規則會撞車（例：你的 TDD workflow vs Karpathy Goal-Driven，兩套都要求你「先寫測試」）
- Plugin 載入會吃 system prompt token，重複規則 = 浪費 context

**最後一個踩坑提醒：** 看到 KOL 推「神仙 prompt」「神級 CLAUDE.md」就想抄是人之常情，但 prompt 跟工具一樣會生鏽。Karpathy 這份 2026-01 的觀察，到 2026-05 已經有部分被 Claude Code 內建吸收。**留意原始發文時間**，不要拿一年前的規則套到今天的工具。

> 我輩修行之人，以聖的標準要求自己，以凡的眼光理解別人。

## 🔗 延伸資源

- [forrestchang/andrej-karpathy-skills (GitHub)](https://github.com/forrestchang/andrej-karpathy-skills)
- [CLAUDE.md 原檔](https://github.com/forrestchang/andrej-karpathy-skills/blob/main/CLAUDE.md)
- [Andrej Karpathy 個人網站](https://karpathy.ai/)
- [Karpathy's CLAUDE.md Skills File: The Complete Guide (antigravity.codes)](https://antigravity.codes/blog/karpathy-claude-code-skills-guide)
- [Claude Code 官方 Plugin 文件](https://docs.claude.com/en/docs/claude-code/plugins)
