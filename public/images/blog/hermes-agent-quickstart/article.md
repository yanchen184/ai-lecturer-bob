> **TL;DR**（一分鐘看懂）
> - **不用懂 Python、不用買 GPU**，5 分鐘把 Hermes Agent 裝起來、講第一句中文
> - 三步驟：**裝 uv → 裝 hermes-cli → 給它一把 API key**
> - 公開 API 三選一：**Anthropic Claude / OpenAI / 本機 Ollama 免費**（推薦 Anthropic，最穩）
> - 不會碰你內網、不會碰你公司憑證，純粹拿來試水溫看 Hermes 長怎樣
> - 想接公司內網 LLM（像我接 Breeze2）→ 看 [Mac 安裝實戰篇](/blog/hermes-agent-mac-install/)，這篇先學會「能跑」

---

> **📚 Hermes Agent 系列 — 這是第 2 篇 / 共 5 篇**
>
> 1. [入門篇](/blog/hermes-agent-intro/) — 這 AI 工具到底在幹嘛?
> 2. **👉 最簡安裝(你在這)— 5 分鐘把它跑起來**
> 3. [沙盒篇](/blog/hermes-agent-sandbox/) — 怎麼讓它不弄壞電腦
> 4. [Mac 安裝實戰](/blog/hermes-agent-mac-install/) — 接公司內網 LLM(工程師硬版)
> 5. [結構分析](/blog/hermes-agent-academic/) — 為什麼它擠進 OpenRouter #2
>
> **建議順序**:[入門篇](/blog/hermes-agent-intro/)(知道它是什麼)→ 這篇(動手跑)→ [沙盒篇](/blog/hermes-agent-sandbox/)(玩瘋之前先學保護)
> **跳過這篇的情境**:你電腦已經有 Python 環境、會自己 pip install,或是直接要接內網 LLM → 跳[實戰篇](/blog/hermes-agent-mac-install/)

## 📌 這篇要回答的問題

1. [安裝前要準備什麼](#安裝前要準備什麼)
2. [Step 1：裝 uv（Python 套件管理器）](#step-1裝-upython-套件管理器)
3. [Step 2：裝 hermes-cli](#step-2裝-hermes-cli)
4. [Step 3：給它一把 API key](#step-3給它一把-api-key)
5. [第一句話：hermes -z "你好"](#第一句話hermes--z-你好)
6. [三家 provider 怎麼選](#三家-provider-怎麼選)
7. [跑完想刪掉怎麼辦](#跑完想刪掉怎麼辦)
8. [下一步該看什麼](#下一步該看什麼)

---

## 🎯 安裝前要準備什麼

**最少需要的**：

| 項目 | 為什麼要 | 沒有怎麼辦 |
|---|---|---|
| **macOS / Linux / WSL2** | Hermes Agent 是 CLI 工具 | Windows 原生 PowerShell 不建議,裝 WSL2 比較順 |
| **網路** | 裝套件 + 呼叫 LLM | 真的離線想跑 → 走 Ollama 走本機,但要先有網下載 model |
| **AI 服務 API key 或 Ollama** | LLM 不會憑空冒出來 | 三家擇一,下面講 |
| **15 分鐘** | 從 0 到第一句 "你好" | 5 分鐘是熟手時間,新手保留 15 |

**不需要**：

- ❌ 不用懂 Python（uv 會處理）
- ❌ 不用裝 Anaconda
- ❌ 不用裝 Docker（這篇沒用沙盒,如果要用看[沙盒篇](/blog/hermes-agent-sandbox/)）
- ❌ 不用會用 vim
- ❌ 不用 GPU、不用付 ChatGPT Plus

如果你連終端機長怎樣都不知道,Mac 開「終端機」(spotlight 搜 Terminal)、Windows 開「PowerShell」或「Windows Terminal」。看到一個黑黑的視窗、有個閃爍的游標,你就準備好了。

---

## 📦 Step 1：裝 uv（Python 套件管理器）

**uv 是什麼**：一個用 Rust 寫的超快 Python 套件管理工具。比 pip 快 10-100 倍。Hermes Agent 推薦用 uv 安裝、官方文件也是這條路。

**為什麼不用 pip**：pip 慢、套件衝突難解、`pip install hermes-cli` 在新系統上常常會跟系統 Python 打架。uv 自帶獨立環境管理,裝壞了刪掉重來零負擔。

### macOS / Linux / WSL2

複製這行貼到終端機:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

跑完它會印一行類似:

```
Installed uv to /Users/你/.local/bin/uv
```

**重要**:重開終端機,或執行 `source ~/.zshrc`（zsh）/ `source ~/.bashrc`（bash）讓 PATH 生效。

**驗證**:

```bash
uv --version
```

看到類似 `uv 0.5.x` 就 OK。

### Windows（PowerShell）

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

但說真的,Windows 直接走 WSL2 比較不會掉坑。原生 PowerShell 跑 hermes 偶爾會遇到 path 翻譯問題。

---

## 🚀 Step 2：裝 hermes-cli

```bash
uv tool install hermes-cli
```

uv tool install 會把 hermes 裝成全域 CLI 指令,任何資料夾都能用,不會污染你其他 Python 環境。

跑完應該看到:

```
Installed 1 executable: hermes
```

**驗證**:

```bash
hermes --version
```

看到 `0.13.x` 就成功了（截至 2026 年 5 月,最新是 v0.13.0）。

**如果遇到 `command not found: hermes`**:

PATH 沒有 uv 的 bin 目錄。手動加:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

寫到 `~/.zshrc` 或 `~/.bashrc` 讓它永久生效。

---

## 🔑 Step 3：給它一把 API key

Hermes Agent **本身不是 LLM**,它是個「殼」,真正回答你的是後面的 AI(Claude / GPT / Llama 等)。所以你要先給它一把 key。

**三家擇一**(下面有比較表):

### 選項 A:Anthropic Claude(推薦新手)

1. 去 https://console.anthropic.com 註冊
2. 左邊 menu「API Keys」→「Create Key」
3. 複製出來的 `sk-ant-api03-xxxxxxxx`

**儲值**:免費試用會給 5 美金,夠你玩到飽好幾天。用完去「Plans & Billing」儲值,**最少 5 美金**。

**設環境變數**:

```bash
export ANTHROPIC_API_KEY="sk-ant-api03-你的key"
```

寫到 `~/.zshrc` 永久生效。

### 選項 B:OpenAI(GPT-5 / GPT-4o)

1. 去 https://platform.openai.com/api-keys
2. 「Create new secret key」
3. 複製 `sk-proj-xxxxxxxx`

```bash
export OPENAI_API_KEY="sk-proj-你的key"
```

OpenAI 一定要先儲值才能用 API(沒有免費額度給新帳號)。最少 5 美金。

### 選項 C:Ollama(本機免費,不用 API key)

如果你電腦有點力氣(Mac M 系列、16GB RAM 以上)、想完全免費 + 不傳資料到外網:

```bash
# 1. 裝 Ollama
brew install ollama          # Mac
# Linux/WSL: curl -fsSL https://ollama.com/install.sh | sh

# 2. 跑起來
ollama serve &

# 3. 抓一個 model(7B 約 4GB)
ollama pull llama3.2
```

**設 Hermes 走 Ollama**:不用 API key,但要設 base URL:

```bash
export OPENAI_API_KEY="ollama"   # 隨便填,Ollama 不檢查
export OPENAI_BASE_URL="http://localhost:11434/v1"
```

---

## 🎉 第一句話:`hermes -z "你好"`

設好 key,在終端機打:

```bash
hermes -z "你好,你是誰?用繁體中文回答"
```

**`-z` 是什麼**:zero-shot,一次性執行模式。給一句話、它回一段話、結束。不會進入互動模式。最適合新手第一次測試。

**用 Anthropic 預期看到**:

```
我是 Claude,Anthropic 開發的 AI 助理。今天有什麼可以幫你的嗎?
```

**用 OpenAI 預期看到**:

```
我是 ChatGPT,OpenAI 開發的大型語言模型...
```

**看到回應就代表成功了**。你已經把 Hermes Agent 跑起來了。

### 進階一點:讓它做點事

```bash
hermes -z "幫我看現在這個資料夾有幾個檔案"
```

它會自己用 `bash` 工具跑 `ls | wc -l`、看結果、回答你。**這時候你才看到 Agent 的味道**——不是只回字,是真的會動手。

### 進入互動模式

直接打:

```bash
hermes
```

進到一個聊天介面,可以連續對話。打 `/exit` 或 Ctrl+D 離開。

---

## 🤔 三家 provider 怎麼選

| 項目 | Anthropic Claude | OpenAI GPT | Ollama(本機) |
|---|---|---|---|
| **新手友善度** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| **效果** | 寫 code 第一名 | 通用最強 | 看 model 大小,中文偏弱 |
| **價格** | 免費 5 美金試用 + 用多少算多少 | 須先儲值,$0.0025/1k tokens | 免費(但要硬體) |
| **要不要網路** | 要 | 要 | 不要(model 抓完後) |
| **資料隱私** | 傳到 Anthropic | 傳到 OpenAI | 完全在你電腦 |
| **適合誰** | 第一次玩、寫 code | 已經有 OpenAI 帳號 | 隱私敏感 / 不想付錢 |

**最簡單的建議**:

- 你只是想試試看 → **Anthropic Claude**,5 美金試用額度,玩到底
- 你已經在用 ChatGPT Plus → 不夠,還是要另外開 API key,直接用 Anthropic
- 你電腦很猛 + 不想付錢 + 不在乎慢 → **Ollama**
- 你公司有內網 LLM(像 MediaTek Breeze2 / 自架 vLLM)→ 那是另一個故事,看[實戰篇](/blog/hermes-agent-mac-install/)

---

## 🗑️ 跑完想刪掉怎麼辦

如果試完發現「啊我不喜歡」,完整移除:

```bash
# 1. 刪掉 hermes-cli
uv tool uninstall hermes-cli

# 2. 刪掉 uv 本身(可選)
rm -rf ~/.local/share/uv ~/.local/bin/uv

# 3. 刪掉設定檔
rm -rf ~/.config/hermes ~/.cache/hermes

# 4. 拿掉環境變數
# 編輯 ~/.zshrc,把 export ANTHROPIC_API_KEY=... 那行刪掉
```

清乾淨,你電腦回到裝之前的狀態,沒有任何殘留。

---

## 🚀 下一步該看什麼

走到這裡你已經會:

- ✅ 用 uv 裝 hermes-cli
- ✅ 給 Hermes 一把 API key
- ✅ 跑 `hermes -z` 跟它對話
- ✅ 看它用工具動手做事

**接下來可以看的**:

1. **想了解 Hermes 跟一般 AI 對話差在哪、Agent 是什麼概念** → [入門篇:這 AI 工具到底在幹嘛?](/blog/hermes-agent-intro/)
2. **想讓它幫你做事但又怕它把電腦弄壞** → [沙盒篇:7 種隔離環境怎麼選](/blog/hermes-agent-sandbox/)
3. **想接公司內網 LLM(不用 OpenAI / Anthropic)** → [Mac 安裝實戰:接 Breeze2 內網 LLM](/blog/hermes-agent-mac-install/)
4. **想知道為什麼這工具突然紅起來** → [OpenRouter 第 2 名的結構性原因](/blog/hermes-agent-academic/)

---

## ❓ 常見疑問

**Q1:裝 uv 安全嗎?那個 curl | sh 看起來很可怕**

A:`curl | sh` 確實是「直接從網路跑腳本」的高風險動作,但 uv 是 Astral 公司的官方安裝方式,腳本掛在 astral.sh 自家網域。如果擔心,可以先 `curl https://astral.sh/uv/install.sh -o install.sh`、自己 `less install.sh` 看一遍再跑。

**Q2:必須要付錢嗎?5 美金的 Anthropic 試用夠用嗎?**

A:**不一定要付**。Anthropic 給的 5 美金試用對「日常玩玩」綽綽有餘——Claude Sonnet 4 一輪對話大概 0.01-0.05 美金,5 美金可以聊 100-500 輪。完全不想付錢就走 Ollama 本機。

**Q3:Windows 一定要裝 WSL2 嗎?直接 PowerShell 不行?**

A:PowerShell 也能裝,但**遇到問題比較難 debug**。Hermes 內部會跑 bash 指令、處理 Unix-style 路徑,WSL2 環境一致性好很多。建議:你已經是 Windows 工程師、習慣 PowerShell → 試;你是純新手 → 直接走 WSL2 Ubuntu。

**Q4:`hermes -z` 跟 `hermes`(互動模式)差在哪?**

A:`-z` = 一次性,給一句、回一段、結束(zero-shot)。`hermes` 不帶參數 = 進入互動模式,像 ChatGPT 一樣連續對話,可以參考前面的上下文。新手測試用 `-z`,實際工作流用互動模式。

**Q5:我要不要把 API key 寫在 `.env` 檔案而不是 `~/.zshrc`?**

A:Hermes 本身**不會讀專案的 `.env`**,它讀的是當前 shell 環境變數。你要嘛寫 `~/.zshrc`(永久)、要嘛在跑指令前手動 `export ANTHROPIC_API_KEY=...`(一次性)。如果你在做 git 專案、有 `.env`,記得 `.env` 一定要進 `.gitignore`,不要 commit。

**Q6:有圖形介面版本嗎?**

A:Hermes Agent 沒有官方 GUI。如果你完全不能接受終端機,看看 **Claude Desktop**(Anthropic 出的,GUI、Mac/Windows 都有)或 **Cursor**(IDE 整合)。但 CLI 工具是 Hermes 的設計哲學,要它變 GUI 等於變另一個產品。

**Q7:裝完發現我電腦上有以前裝的 Python,會衝突嗎?**

A:不會。uv 自己管環境,不會碰你系統 Python。`uv tool install` 把 hermes 裝在 `~/.local/bin/hermes`、依賴隔離在 uv 自己的快取資料夾。要砍只砍 `uv tool uninstall hermes-cli` 就乾淨。

---

**寫完了。把這篇放在書籤,下次要重裝、要教朋友、要在新機器上跑,直接照三步驟複製貼上,15 分鐘搞定。**

如果你跑到第 3 步卡住、或想接公司內網不想用公開 API,看[Mac 安裝實戰篇](/blog/hermes-agent-mac-install/)有完整的 Breeze2 內網 LLM 對接路徑(那篇給工程師看的、比較硬)。
