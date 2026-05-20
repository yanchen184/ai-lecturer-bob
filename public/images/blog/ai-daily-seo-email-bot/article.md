# 我請 AI 每天早上 9 點寄 SEO 報告給我，從想到能用花了 1 小時

> 這是「我把買網域+整站搬家交給 AI 跑」系列的第 3 篇。主文：[我把買網域+整站搬家交給 AI 跑：人類只花 15 分鐘的 8 步驟流程](/blog/ai-buy-domain-migration-yanchen-app/)，前一篇：[AI 抓到 Cloudflare 1.1.1.1 在騙我 30 分鐘](/blog/ai-caught-cloudflare-dns-lying/)。

## TL;DR

把 yanchen.app 搬完家之後，我有了一個新需求：**每天早上想看一眼昨天的 SEO 狀況**。

但我不想登入 Google Search Console、不想開儀表板、不想自己挑 metric。我想要的是：每天早上 9 點，信箱自動有一封信，標題 `📊 SEO 日報 2026-05-19`，內文有昨天的 UV/PV、GSC 單日表現、近 7 天 Top 查詢、近 7 天 Top 頁面、近 28 天 Top 10。

我跟 Claude Code 講了上面這段話，**1 小時後我收到第一封信**。

整個 pipeline 是：launchd cron → bash 腳本 → curl 打 GSC API + Firestore → Python 組信 → SMTP TLS 寄到 Gmail。其中 SMTP TLS 設定 / GSC OAuth refresh token / launchd plist 三件事我從來沒設過，全部 AI 寫好我只是按 enter。

這篇是這套東西的完整覆盤 + 你想抄回家自己用的話該怎麼改。

## 目錄

1. 為什麼想要每天的 SEO 信
2. 一張圖看整個 pipeline
3. 五個元件，AI 各寫了什麼
4. 我自己做了什麼（其實只有 3 件）
5. 5 個踩坑
6. 抄回家自己用：要改哪幾個地方
7. FAQ

## 1. 為什麼想要每天的 SEO 信

搬完家之後，每天我都會想：

- 昨天有多少人來？
- 大家是搜什麼進來的？
- 有沒有哪篇文章突然 traffic 暴漲？
- GSC 有沒有什麼新的查詢開始被觸發？

這些資料 GSC 都有，但要看的話我得：開瀏覽器 → 登入 Google → 切到 GSC → 選 property → 改日期範圍 → 看 Performance → 切到 query / page tab → 把畫面看一遍。

每天做這套動作要 5 分鐘，而且 5 分鐘裡我只是在「點按鈕」而不是「看資料」。**動線太重**，重到我每天早上根本不會打開來看，於是搬家辛苦設定的 SEO 變成黑盒子。

我要的是「打開信箱就看到」，不是「我去找它」。

## 2. 一張圖看整個 pipeline

```
   ┌────────────────────┐
   │  macOS launchd     │ 每天 09:00 Asia/Taipei 觸發
   │  com.bob.daily-    │
   │  seo-email.plist   │
   └─────────┬──────────┘
             │
             ▼
   ┌────────────────────┐
   │  daily-seo-email   │ bash 腳本，~/.claude/scripts/
   │  .sh               │
   └─────────┬──────────┘
             │
       ┌─────┴──────────────────────────┐
       │                                │
       ▼                                ▼
   ┌──────────┐                  ┌──────────────┐
   │ GSC API  │                  │ Firestore    │
   │ (OAuth)  │                  │ runQuery     │
   └────┬─────┘                  └──────┬───────┘
        │  查詢/頁面/曝光/點擊            │  UV / PV
        │  3 個 rowLimit 不同的 query    │  bob_visitors / bob_post_views
        ▼                                ▼
   ┌──────────────────────────────────────────┐
   │   Python (inline heredoc) 組信內文       │
   └────────────────────┬─────────────────────┘
                        ▼
              ┌────────────────────┐
              │ SMTP TLS (465)     │
              │ Gmail App Password │
              └─────────┬──────────┘
                        ▼
              📬 bobchen184@gmail.com
```

整個東西是一支 213 行的 bash 檔，每天 09:00 跑一次，跑完寫 log 到 `~/.claude/logs/daily-seo-email-YYYYMMDD-HHMMSS.log`。

## 3. 五個元件，AI 各寫了什麼

### 3.1 launchd plist（macOS 定時任務）

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist ...>
<plist version="1.0">
<dict>
  <key>Label</key><string>com.bob.daily-seo-email</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/zsh</string>
    <string>/Users/yanchen/.claude/scripts/daily-seo-email.sh</string>
  </array>
  <key>StartCalendarInterval</key>
  <dict>
    <key>Hour</key><integer>9</integer>
    <key>Minute</key><integer>0</integer>
  </dict>
  <key>RunAtLoad</key><false/>
  <key>StandardOutPath</key>
  <string>/Users/yanchen/.claude/logs/daily-seo-email-launchd.log</string>
  <key>StandardErrorPath</key>
  <string>/Users/yanchen/.claude/logs/daily-seo-email-launchd.err</string>
</dict>
</plist>
```

AI 直接幫我寫好、塞到 `~/Library/LaunchAgents/`，跑 `launchctl bootstrap gui/$(id -u) <plist>` 載入。

這東西我從來沒寫過。我之前用 cron，但 macOS 推薦走 launchd（cron 是 deprecated）。AI 直接走推薦路徑，沒給我「要不要用 cron」的選擇題。

### 3.2 GSC OAuth refresh token

GSC API 要 OAuth，但 OAuth 流程有 4 步（client_id → 跳轉同意 → code → exchange）。AI 的做法是：

1. 拿我 `~/.claude/credentials.md` 裡的 GSC client_id / client_secret / refresh_token（之前設過別的服務時就拿到了）
2. 用 refresh_token 換 access_token（curl 一行就好）
3. 直接拿 access_token 打 `webmasters/v3/sites/.../searchAnalytics/query`

如果之前沒設過，AI 會帶你跑一次「console.cloud.google.com → 開 project → 開 Search Console API → 建 OAuth client → 拿 refresh token」這套，本來這套要 30 分鐘自己摸索，AI 帶著走 10 分鐘可以走完。

### 3.3 三個 GSC query

我要的不是「一個」報告，是「**昨天** + **近 7 天 Top** + **近 28 天 Top**」三個視角的對照。所以 AI 寫了三個 query：

| Query | dateRange | dimensions | rowLimit |
|---|---|---|---|
| 單日（GSC 有 3-4 天延遲） | yesterday-4d | query | 10 |
| 近 7 天 Top 查詢 | last 7 days | query | 5 |
| 近 7 天 Top 頁面 | last 7 days | page | 5 |
| 近 28 天 Top 10 | last 28 days | query | 10 |

每個 query 後面接一段 Python heredoc 解析 JSON、組成「曝光 X｜點擊 Y｜CTR Z%｜排名 N」的人類可讀字串。

關鍵設計：**`GSC_DATE` 用 yesterday-4d**，因為 GSC 有 3-4 天的資料延遲。AI 知道這件事，我不知道 — 如果是我自己寫，我會用 yesterday，然後每天都看到「無曝光數據」然後以為 SEO 壞了。

### 3.4 Firestore UV / PV 統計

UV / PV 走另一條路：我網站用 Firestore 存 `bob_visitors` 和 `bob_post_views` 兩個 collection，每次訪客來就寫一筆。

統計昨天的方式：用 Firestore 的 `runQuery` API，給一個複合 filter（`timestamp >= 昨天 00:00 + Asia/Taipei` AND `timestamp <= 昨天 23:59 + Asia/Taipei`），數回傳的 document 數量。

```bash
START_TS="${YESTERDAY}T00:00:00+08:00"
END_TS="${YESTERDAY}T23:59:59+08:00"
# ...用 timestampValue 做 GREATER_THAN_OR_EQUAL / LESS_THAN_OR_EQUAL filter
```

`+08:00` 這個細節很重要 — Firestore 認 ISO 8601，但 timezone offset 不能寫錯，不然會少算 8 小時的資料。AI 直接寫對。

### 3.5 SMTP TLS

```python
ctx = ssl.create_default_context(cafile=certifi.where())
with smtplib.SMTP_SSL('smtp.gmail.com', 465, timeout=20, context=ctx) as s:
    s.login(GMAIL_USER, GMAIL_PASS)
    s.send_message(msg)
```

`certifi.where()` 這個 detail 我之前踩過 — macOS 自帶的 Python 不會自動找到系統 CA，要明確指定 `certifi` bundle。AI 也是直接寫對。

Gmail App Password 用的是「應用程式密碼」（不是登入密碼）—  Google 帳號設定裡開啟 2FA 之後才能產，產出來的 16 碼一次性顯示，存進 `credentials.md`。

## 4. 我自己做了什麼

整個 pipeline 我親自做的事情：

1. **建 Gmail App Password**（5 分鐘）— 這個 AI 不能代做，因為要登入 Google 帳號 + 2FA。
2. **複製 plist 到 LaunchAgents + bootstrap**（30 秒）— AI 給指令我貼到 terminal。
3. **第一次手動跑一次驗證**（1 分鐘）— `bash ~/.claude/scripts/daily-seo-email.sh` 跑一次，確認信真的有寄到。

其他 60 分鐘 AI 全包：寫 bash、寫 Python heredoc、調 GSC query、處理 timezone、debug SMTP（第一次跑因為 timeout 太短失敗，AI 自己加大 timeout 重跑）、設 launchd plist、寫 fallback 訊息（如果 GSC token 失敗會寄精簡版 + 列出失敗步驟）。

## 5. 5 個踩坑

### 5.1 GSC 資料延遲 3-4 天

第一次跑出來「昨天無曝光數據」我以為 GSC API 壞了。AI 說「GSC 有 3-4 天延遲，這是正常的，要查的話用 `yesterday-4d`」。改完馬上有資料。

教訓：**GSC 不是 real-time analytics，是 Google 內部 batch process 完才放出來的**。

### 5.2 sc-domain property URL 編碼

GSC API 的 site path 不是 `yanchen.app` 也不是 `https://yanchen.app/`，是 `sc-domain:yanchen.app` 然後 URL encode 成 `sc-domain%3Ayanchen.app`。第一版我（請 AI）寫成 `yanchen.app` 直接 404。

教訓：**Domain property 在 API 裡是 `sc-domain:` 前綴**，跟 URL-prefix property 完全不同寫法。

### 5.3 SMTP_SSL 用 465 不是 SMTP + STARTTLS 用 587

兩條路徑都能寄，但 Gmail 跟 SMTP_SSL 465 + App Password 組合最穩。AI 直接走這條，沒有走 587 + starttls 的 dance。

### 5.4 launchd plist 要 `bootstrap` 不是 `load`

`launchctl load` 是舊 API，macOS 12+ 推薦用 `launchctl bootstrap gui/$(id -u) <plist>`。AI 走新 API，所以未來 macOS 升版不會壞。

### 5.5 cron 是 deprecated，用 launchd

macOS 還是支援 cron 但官方說 deprecated。AI 預設走 launchd，這在 LLM 知識裡是「macOS 上做定時任務的標準答案」。如果是 Linux 它就會走 systemd-timer 或 crontab。**不用問它選哪個 — 它知道。**

## 6. 抄回家自己用

如果你想抄這套去自己的網域 / 信箱用，要改的地方：

| 變數 | 原值 | 改成 |
|---|---|---|
| `GSC_CLIENT_ID` / `GSC_CLIENT_SECRET` / `GSC_REFRESH_TOKEN` | 我的 | 你自己的 OAuth credentials |
| `GSC_SITE_ENC` | `sc-domain%3Ayanchen.app` | `sc-domain%3A你的網域` |
| `FB` URL | `forbidden-beauty` Firestore project | 你的 project ID + API key（如果沒用 Firestore 就刪掉這段） |
| `GMAIL_USER` / `GMAIL_PASS` / `TO` | 我的 | 你自己的 |
| plist 路徑 `/Users/yanchen/...` | 我的 | 你 `$HOME` 路徑 |

把 `daily-seo-email.sh` 跟對應 plist 抄到你機器，改完 5 個變數，跑一次 `bash ./daily-seo-email.sh` 看有沒有信，有了就 `launchctl bootstrap` 進去。

如果你不用 Firestore 統計流量（大部分人都不用），把 Step 3 那段整個刪掉就好，剩下純 GSC 報告也很有用。

## 7. FAQ

**Q1: 為什麼不用現成工具像 Looker Studio / Mailchimp / Zapier？**

A: 三個原因。（1）Looker Studio 要登入才能看，違背「打開信箱就看到」原則；（2）Mailchimp / Zapier 都要錢，每月 $20-50，這個 pipeline 我自己跑 $0；（3）**我寫一次能改一輩子**，需求變了改 5 分鐘，不用等廠商更新。AI 寫程式碼之後，「自己 host」的成本大幅下降。

**Q2: launchd 跟 cron 比有什麼好處？**

A: launchd 在電腦睡覺時不會「漏跑」— 如果 09:00 你電腦在睡，醒來後它會補跑。cron 直接跳過那次。對筆電使用者特別重要。但缺點：plist XML 寫起來比 crontab 一行噁心，不過反正 AI 寫。

**Q3: 我不會 GSC API，這個門檻會不會太高？**

A: 不會。OAuth credential 設一次就一輩子能用，AI 帶著走 10 分鐘可以走完。最大的門檻其實是 **Google Cloud Console 介面太複雜**（開 project → 開 API → 建 OAuth client → 加 test user → 拿 refresh token）— 但有 AI 邊看邊指路就還好。

**Q4: 為什麼要把 GSC 跟 Firestore 兩邊資料合起來？**

A: 兩個視角不同：（1）Firestore 是「**真的有人來看**」的記錄，0 延遲，但只有我網站內的資料；（2）GSC 是「**Google 搜尋層的曝光/點擊**」，有 3-4 天延遲，但可以看到我網站外的 demand。合起來才完整 — 流量沒進來可能是 GSC 曝光太低、也可能是來了但 Firestore 沒打點。

**Q5: SMTP App Password 安全嗎？**

A: 比直接放主密碼安全得多 — App Password 只能用來寄信，不能登入帳號、不能改密碼。如果外洩你直接到 Google 帳號設定 revoke 那組就好，10 秒。**但別 commit 到 git**。我放在 `~/.claude/credentials.md`（git 忽略）+ 腳本內 hardcode（腳本也只放本機）。

**Q6: 信寄不到怎麼除錯？**

A: 看 log。`~/.claude/logs/daily-seo-email-YYYYMMDD-HHMMSS.log` 裡會有每一步 `[1]` `[2]` `[3]` 的標記，跟最後 `[5] EMAIL OK` 或 `[5] EMAIL FAIL: <reason>`。AI 寫的時候已經想好這件事，所以失敗訊息很清楚 — 不會是「就掛了」這種垃圾訊息。

**Q7: 整個 pipeline 我可以全部交給 AI 跑 + 維護嗎？**

A: 可以。Bob 的做法：（1）需求變了就跟 Claude Code 說「在報告裡加上 X」，它去改 `daily-seo-email.sh`；（2）報告壞了 paste log 給 AI 自己分析；（3）GSC API 改了直接讓 AI 看官方 doc 改 query。**我自己不維護，AI 維護**。

## 延伸資源

- 主文：[我把買網域+整站搬家交給 AI 跑](/blog/ai-buy-domain-migration-yanchen-app/)
- 系列前一篇：[AI 抓到 Cloudflare 1.1.1.1 在騙我 30 分鐘](/blog/ai-caught-cloudflare-dns-lying/)
- GSC API 官方文件：https://developers.google.com/webmaster-tools/v1/searchanalytics/query
- launchd 官方介紹：https://www.launchd.info/
- Gmail App Password 設定：https://support.google.com/accounts/answer/185833
- Firestore REST API runQuery：https://firebase.google.com/docs/firestore/reference/rest/v1/projects.databases.documents/runQuery

---

兩篇衛星文寫完了。主文 + 兩篇衛星文，整個系列的訊息很單純：**現在這個時間點，一個人 + AI 可以做出去年要小團隊才做得出來的東西**。買網域、切 DNS、搬整站、寫每天的監測 pipeline — 加起來幾小時、$ 0 月費。

如果你也想試試看，從主文那 8 步驟開始抄。
