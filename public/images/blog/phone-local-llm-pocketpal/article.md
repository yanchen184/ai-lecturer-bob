> **TL;DR**
> - 本文解決：想用自己的手機跑 LLM，但不知道要裝什麼 app、能跑多大的模型、能不能進開發工作流
> - 推薦給：好奇手機算力極限的工程師、想在離線環境用 AI 的人、評估 on-device AI 可行性的開發者
> - 讀完你會知道：PocketPal AI / LLMFarm / MLC Chat 三大主流 app 怎麼選、iPhone 15 Plus 真實能跑哪些模型、為什麼「手機算力幫電腦」是死路

## 📌 目錄

1. [手機跑 LLM 真的有人在用嗎](#手機跑-llm-真的有人在用嗎)
2. [三大主流 app 比較](#三大主流-app-比較)
3. [iPhone 15 Plus 真實能跑什麼模型](#iphone-15-plus-真實能跑什麼模型)
4. [PocketPal AI 從 0 開始安裝](#pocketpal-ai-從-0-開始安裝)
5. [我實際試的模型與 prompt](#我實際試的模型與-prompt)
6. [踩到的坑](#踩到的坑)
7. [手機算力能不能餵電腦](#手機算力能不能餵電腦)
8. [時間成本拆解與心法](#時間成本拆解與心法)
9. [❓ 常見問題](#-常見問題)
10. [🔗 延伸資源](#-延伸資源)

## 🧠 手機跑 LLM 真的有人在用嗎

先說結論：**有，但「跑得動」跟「實用」是兩回事。**

2026 年 5 月的現況：iOS / Android 都有成熟的本地 LLM app，旗艦機種 1B-3B 量級的模型可以跑出堪用速度。**PocketPal AI** 是 [a-ghorbani/pocketpal-ai](https://github.com/a-ghorbani/pocketpal-ai) 維護的開源 app，2025 年 1 月上線、2026 年 4 月時 iOS + Android 累計 500K+ 下載，是目前最熱門的選擇。

但「最熱門」不代表「主流」。真正讓所有 iPhone 用戶都在「跑 on-device AI」的其實是 **Apple Intelligence**——Apple 在系統內塞了一個約 3B 參數的 foundation model，限 iPhone 15 Pro 以上（A17 Pro / M1+）才支援。多數人在用 on-device AI 卻不自覺，因為它包裝在「摘要通知」「改寫訊息」這類功能裡。

主動裝 app 在手機跑 LLM 的，目前還是小眾，集中在三種人：

1. **隱私需求重**：醫療筆記、敏感對話、出差到不能連雲端的環境
2. **開發者測試** on-device 部署可行性
3. **嚐鮮黨**，裝兩天就回去用 ChatGPT / Claude

<img src="/images/blog/phone-local-llm-pocketpal/pocketpal-github.png" alt="PocketPal AI GitHub repo 首頁，本地手機 LLM 開源 app" style="border-radius: 8px; margin: 1rem 0; width: 100%;" />

## ⚖️ 三大主流 app 比較

iOS 平台有三個常被推薦的選項：**PocketPal AI**、**LLMFarm**、**Private LLM**。Android 主流是 **PocketPal AI**、**MLC Chat**、**Google AI Edge Gallery**。

| 功能 | PocketPal AI | LLMFarm | MLC Chat |
|------|:------------:|:-------:|:--------:|
| 平台 | iOS + Android | iOS + macOS | Android（iOS 有但較舊） |
| 引擎 | llama.cpp | llama.cpp + ggml | TVM Unity + NPU |
| 模型格式 | GGUF | GGUF | MLC 編譯後格式 |
| HuggingFace 直接抓 | ✓ | △（手動） | ✗ |
| NPU 加速 | ✗（CPU/Metal） | ✗ | ✓（Snapdragon Hexagon） |
| 內建 benchmark | ✓ | △ | ✗ |
| 免費 | ✓ | ✓ | ✓ |
| License | MIT | MIT | Apache 2.0 |

**選擇邏輯：**

- **iOS 首選 PocketPal AI**：UI 最友善、可直接從 HuggingFace 抓模型、內建 benchmark 可實測自己手機的極限
- **想試多種引擎的工程師選 LLMFarm**：更彈性、可調參數多、但 UI 沒 PocketPal 親切
- **Android 旗艦選 MLC Chat**：唯一吃得到 NPU 加速，在 Galaxy S25 Ultra 上跑 Qwen3 1.7B 可衝到 ~40 tok/s（CPU-only 同機種只 8-12 tok/s）

如果你的 Android 是中階以下，**MLC 的 NPU 優勢吃不到**，跟 PocketPal 沒差，那就用 PocketPal 介面比較好。

```kroki:mermaid
flowchart TD
    A[想在手機跑本地 LLM] --> B{平台}
    B -->|iOS| C{用途}
    B -->|Android 旗艦<br/>有 Hexagon NPU| D[MLC Chat<br/>40 tok/s on Qwen3 1.7B]
    B -->|Android 中階| E[PocketPal AI]
    C -->|單純試玩 / 翻譯 / 改寫| F[PocketPal AI<br/>UI 最友善]
    C -->|工程師多參數調校| G[LLMFarm<br/>llama.cpp 直接控]
    C -->|系統級整合<br/>iPhone 15 Pro+| H[Apple Intelligence<br/>內建 3B 模型]
```

<img src="/images/blog/phone-local-llm-pocketpal/llmfarm-github.png" alt="LLMFarm GitHub repo，iOS macOS 本地 LLM 工程師選項" style="border-radius: 8px; margin: 1rem 0; width: 100%;" />

## ⚡ iPhone 15 Plus 真實能跑什麼模型

這是最容易誤導的部分。網路上很多文章寫「iPhone 跑 LLM 沒問題」，但**沒講清楚是哪一代、跑多大、什麼速度**。

依據 [PromptQuorum 2026 mobile LLM 報告](https://www.promptquorum.com/local-llms/mobile-local-llms) 與 [Argmax iPhone 17 inference benchmark](https://www.argmaxinc.com/blog/iphone-17-on-device-inference-benchmarks)：

| 機種 | 晶片 | RAM | 跑 3B 模型速度 | 實用性 |
|------|------|:---:|:------------:|:------:|
| iPhone 17 | A19 Pro | 12GB | ~14 tok/s | 堪用 |
| iPhone 16 (非 Pro) | A18 | 8GB | ~3 tok/s | 卡 |
| **iPhone 15 Plus** | **A16** | **6GB** | **預估 5-8 tok/s** | **吃緊** |
| iPhone 14 Pro | A16 | 6GB | 同 15 Plus | 吃緊 |

PromptQuorum 明文寫「**RAM 8GB 以下手機跑本地 LLM 不實用**」。iPhone 15 Plus 是 6GB，剛好踩在門檻下方。

<img src="/images/blog/phone-local-llm-pocketpal/mlc-llm-github.png" alt="MLC LLM GitHub repo，Android Snapdragon NPU 加速本地 LLM 引擎" style="border-radius: 8px; margin: 1rem 0; width: 100%;" />

**結論：iPhone 15 Plus 的甜蜜點是 1B-2B 模型，不是 3B。** 推薦這幾個：

| 模型 | 大小（Q4） | 跑速預估 | 適合場景 |
|------|:---------:|:--------:|---------|
| Llama 3.2 1B Instruct | ~700MB | 20-30 tok/s | 翻譯、改寫、簡單問答 |
| Qwen3 1.7B | ~1.2GB | 15-25 tok/s | 中文對話 |
| Gemma 2 2B | ~1.6GB | 10-15 tok/s | 通用、Google 出品 |
| Phi-3.5 mini 3.8B | ~2.3GB | 5-8 tok/s | 邏輯/coding 偏強，但會慢 |

> 跑速數字是依 A16 vs A18 比例外推，**實測請用 PocketPal 內建 benchmark 自己跑一次**，不同 iOS 版本與後台狀態都會影響。

## 🚀 PocketPal AI 從 0 開始安裝

**前置需求**

| 項目 | 用途 | 怎麼確認 |
|------|------|---------|
| iPhone（iOS 16+） | 安裝 app | 設定 → 一般 → 關於本機 |
| 至少 4GB 可用儲存空間 | 模型檔下載用（1.5GB 模型 + buffer） | 設定 → 一般 → iPhone 儲存空間 |
| Apple ID | App Store 安裝 | 設定頂部頭像 |
| 穩定 WiFi | 首次下載模型（300MB-2GB） | 設定 → Wi-Fi |
| （可選）HuggingFace 帳號 | 抓 gated 模型用，公開模型不需要 | huggingface.co |

**安裝 + 抓第一個模型**

1. App Store 搜 **PocketPal AI**（開發者：LLM Ventures，圖示是袋鼠）→ 安裝
2. 開 app，跳過引導 → 進主畫面 → 左上選單 → **Models**
3. 點右下 `+` 號 → **Add from Hugging Face**
4. 搜 `Llama-3.2-1B-Instruct-GGUF` → 選 [`bartowski/Llama-3.2-1B-Instruct-GGUF`](https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF) → 挑 **Q4_K_M** 版本（檔案約 770MB）→ Download
5. 下載完點模型卡片 → **Load**（第一次載入要 3-5 秒）
6. 回 **Chat** tab → 開始對話

**驗證裝起來了**

```
在 Chat 輸入：請用一句話介紹你自己

預期：3-10 秒內出現回應，畫面下方顯示 tok/s 數字
```

如果沒看到 tok/s 數字 → 模型沒 load 成功，回 Models 重點一次 Load。

**內建 benchmark 跑一次**（強烈建議）

主選單 → **Benchmark** → 選剛下載的模型 → Start。會跑出三個數字：

- **Prompt processing**：模型「吃」你輸入內容的速度
- **Token generation**：模型「吐字」的速度（這是你日常感受到的速度）
- **Memory usage**：跑這個模型佔多少 RAM

這份數字之後挑模型可以拿來對照，知道哪一台手機跑哪個模型甜蜜點在哪。

## ✍️ 我實際試的模型與 prompt

裝完之後我跑了三個情境，分享給你參考。

**情境一：離線翻譯**

```
Prompt: 把下面這段話翻成自然的英文：
「我下週要去日本出差，幫我訂一間京都車站附近的旅館，預算單晚 1 萬日圓內。」

Llama 3.2 1B 回應（~20 tok/s）：
"I'm going on a business trip to Japan next week. Could you book me a hotel
near Kyoto Station for under 10,000 yen per night?"

評：可用。語法正確、語氣自然，飛航模式下能跑就贏。
```

**情境二：把口語訊息改成正式 email**

```
Prompt: 把這段 LINE 訊息改成正式商業 email：
「老師我下週請假喔 因為要去婚禮 之後補課可以嗎」

Qwen3 1.7B 回應（~15 tok/s）：
（生出一封 200 字 email，稱謂、請假事由、補課請求都有）

評：結構完整，但用詞偏中規中矩，不夠俐落。3B 以上會更好，但 1.7B 已堪用。
```

**情境三：請它寫 coding**

```
Prompt: 寫一個 Python function 算費氏數列第 n 項，要 O(n)

Phi-3.5 mini 3.8B 回應（~6 tok/s，明顯比前兩個慢）：
（正確產出 iterative 版本 + 簡單註解）

評：1B 模型寫不出正確的，需要 3B+ 才穩。但 6 tok/s 真的慢，你會邊看它打字邊覺得不如直接打開 ChatGPT。
```

**真實使用建議：**

- 翻譯 / 改寫 / 簡單問答 → 1B 模型，速度感受最好
- 中文場景 → Qwen3 系列（阿里出，中文 native）優於 Llama
- 寫 code / 邏輯推理 → 3B 以上才堪用，但要忍受慢
- 連續對話超過 5 輪 → context 變長後速度明顯掉，定期開新對話

## 🔥 踩到的坑

裝起來後實際用，這幾個坑很容易讓人氣噗噗，先講免得你被嚇到。

### 坑 1：手機發燙、電量狂掉

實測連續對話 10-15 分鐘，手機背蓋明顯燙手、電量大概掉 5-10%。[ItsFoss 在 Snapdragon 8 Gen 2 上的測試](https://itsfoss.com/android-on-device-ai/)是 **90 分鐘掉 50% 電**。

**為什麼：** LLM 推論 CPU/GPU/Neural Engine 全速跑，跟玩 3A 遊戲類似的負擔。

**解法：** 沒有，這是物理限制。對策：

- 用完隨手退出 app（PocketPal 有 auto offload，但有時會殘留）
- 不要邊充電邊跑（雙重發熱會更快觸發降頻）
- 重度使用配無線充電板 + 風扇

### 坑 2：長對話越來越慢

對話 context 超過 2K tokens 之後，token generation 速度會掉 30-50%。

**為什麼：** Attention 計算量隨 context 長度二次方成長，手機算力撐不住。

**解法：** 養成「一個話題開一個新對話」的習慣，不要把所有對話塞同一個 session。PocketPal 主選單 → 左上「+」開新對話。

### 坑 3：模型載入失敗 / app 被系統殺

6GB RAM 的 iPhone 15 Plus 跑 2B 以上模型，**只要切到別的 app 一段時間，回來 PocketPal 通常要重新載入模型**（5-10 秒等待）。

**錯誤訊息範例：**

```
Model not loaded. Tap to reload.
```

**為什麼：** iOS 記憶體吃緊時會把 background app 的 memory 釋放掉，PocketPal 的模型是 in-memory 狀態。

**解法：** 跑 LLM 時不要同時開大量 app（特別是相機、地圖、瀏覽器多分頁），或乾脆接受「每次回來等 5 秒重 load」的事實。

### 坑 4：Q4 量化在複雜推理上會崩

[ItsFoss 文章](https://itsfoss.com/android-on-device-ai/)提到「4-bit 模型在複雜推理上會 struggle，需要 8-bit 才穩」。我自己測也是，3B 模型 Q4 寫遞迴函式偶爾會 off-by-one。

**解法：** 如果你的手機 RAM 夠（8GB+），考慮抓 Q5_K_M 或 Q8_0 版本，犧牲一點速度換準確度。iPhone 15 Plus 6GB 沒這個本錢，乖乖用 1B 模型。

## 💻 手機算力能不能餵電腦

很多人裝完手機 LLM 之後會冒這個念頭：「手機閒置時間長，能不能讓電腦 call 手機的模型，當算力共享？」

**結論：技術上可行，實務上沒意義。**

| 比較項 | 手機跑 LLM | 電腦跑 LLM（Ollama） |
|---|---|---|
| 速度（7B 模型） | 跑不動 | 50-100 tok/s（M1 以上） |
| 速度（3B 模型） | 5-14 tok/s | 80-150 tok/s |
| 上下文上限 | 2K-4K 後變慢 | 32K+ 輕鬆 |
| 發熱 / 電池 | 嚴重 | 沒事 |
| 同時用其他 app | 容易被系統殺 | 沒影響 |

**反過來才合理：** 電腦跑 Ollama，手機當 client 連回家裡電腦。出門也能用自己的本地模型（透過 Tailscale 或 Cloudflare Tunnel）。

如果你的真實需求是「閒置算力不要浪費」，更划算的方向是：

1. **桌機 / 筆電裝 Ollama**：跑 `qwen2.5-coder:7b` 或 `qwen3:8b`，接 [Continue.dev](https://continue.dev) 進 VS Code 當 inline completion，省 Copilot 月費
2. **批次處理任務丟本地**：課程逐字稿轉條列、log 分類、commit message 草稿——這類「大量、簡單、不需頂級智能」的任務跑一晚不花錢
3. **手機 LLM 當「在場」工具**：通勤試 prompt、構思內容，回家用 Claude / Ollama 精修

## 💰 時間成本拆解與心法

把這次「裝手機 LLM 玩玩看」的成本攤開：

| 階段 | 時間 |
|------|------|
| 裝 PocketPal AI + 下載第一個模型 | 5-10 分鐘 |
| 試 10 個 prompt 感受速度 | 15 分鐘 |
| 跑 benchmark + 換模型測試 | 20 分鐘 |
| 接受「這就是上限」並回去用雲端 LLM | 5 秒 |

**心法：**

1. **手機本地 LLM 是「能力檢驗工具」，不是生產力工具**。它讓你直觀理解 1B / 3B / 7B 模型的差異、量化的代價、context 的成本——這對做 AI 產品決策很有幫助
2. **不要期待替代 ChatGPT / Claude**。雲端模型背後是 200B+ 參數 + TPU 叢集，你手機那 6GB RAM 跑的東西在 IQ 上不是同一個物種
3. **隱私 / 離線情境真的有需求才裝**。如果你只是好奇，玩半天會卸載。但醫療、法律、出差海外網路爛的場景，這玩意能救命

> 📅 **如果你裝完想再玩深一點：** 試試把 Mac 裝起 [Ollama](https://ollama.com)，跑 `qwen2.5-coder:7b`，再透過 [Tailscale](https://tailscale.com) 從手機 PocketPal 接過去——這樣手機當 thin client，背後是電腦的算力，相當於自己的 ChatGPT。這條路才是「手機 + 本地 LLM」真正划算的玩法。

## ❓ 常見問題

### 用手機跑本地 LLM 跟用 ChatGPT App 差在哪？

完全不同等級的東西。ChatGPT App 是把問題送到 OpenAI 的雲端伺服器（GPT-4 / GPT-5 等 200B+ 參數模型），回傳結果。手機本地 LLM 是在你的手機 CPU/GPU 直接跑 1B-3B 參數模型，速度慢、智能差很多，但完全離線、隱私 100% 留在手機。

### iPhone 15 Plus 6GB RAM 真的能跑嗎？會不會壞機？

能跑，1B-2B 模型完全沒問題，跑 3B 會吃緊但不會壞機，iOS 會自動管理記憶體。長期重度使用唯一的擔憂是電池壽命——LLM 推論是高負載，跟玩遊戲一樣，每天跑 1 小時持續半年才會明顯感受到電池健康度下降。

### Apple Intelligence 跟 PocketPal 差在哪？要不要兩個都裝？

不衝突。Apple Intelligence 是 iOS 內建、深度整合到通知摘要 / 訊息改寫 / Siri，限 iPhone 15 Pro 以上才支援。PocketPal 是獨立 app，所有 iPhone 都能裝，可自己挑模型、看 token 速度、跑 benchmark。Apple Intelligence 是「無感的便利」，PocketPal 是「主動的實驗」。

### 我手機 LLM 能不能用來開發 / 餵電腦呼叫？

技術可行，實務沒意義。手機算力遠輸電腦，跑 3B 也只有電腦的 1/5-1/10 速度，還要解 IP / port / 電池管理。**反過來做才對**：電腦跑 Ollama，手機當遠端 client。如果你的真實需求是閒置算力榨乾，把預算投在桌機 RAM 升級比較划算。

### Android 也能裝嗎？選哪個 app？

可以。Android 旗艦（Snapdragon 8 Gen 3 以上、12GB+ RAM）首選 **MLC Chat**——唯一吃得到 Snapdragon Hexagon NPU 加速，跑 Qwen3 1.7B 可衝到 ~40 tok/s。中階手機或不在意 NPU 的，用跨平台的 **PocketPal AI** 介面比較好。Google AI Edge Gallery 也是選項，跑 Google 自家 Gemma 系列。

## 🔗 延伸資源

- [PocketPal AI GitHub](https://github.com/a-ghorbani/pocketpal-ai) — 原始開源 repo，issue 區可看其他人手機的 benchmark
- [LLMFarm 官網](https://llmfarm.space/) — iOS + macOS 替代方案
- [MLC LLM 官方](https://github.com/mlc-ai/mlc-llm) — Android NPU 優化引擎
- [Apple Foundation Models 官方介紹](https://machinelearning.apple.com/research/introducing-apple-foundation-models) — 想了解 Apple Intelligence 背後 3B 模型的設計
- [Hugging Face GGUF 模型搜尋](https://huggingface.co/models?library=gguf) — PocketPal / LLMFarm 模型來源
- [本站相關文章：Karpathy LLM Wiki 跑兩週實測](https://yanchen.app/blog/karpathy-llm-wiki/) — 想理解 LLM 底層概念
