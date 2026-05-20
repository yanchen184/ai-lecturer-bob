# 我以為 DNS 設錯了，結果是 AI 抓到 Cloudflare 1.1.1.1 在騙我 30 分鐘

> 這是「我把買網域+整站搬家交給 AI 跑」系列的第 2 篇。主文：[我把買網域+整站搬家交給 AI 跑：人類只花 15 分鐘的 8 步驟流程](/blog/ai-buy-domain-migration-yanchen-app/)

## TL;DR

我把 NS 從 Porkbun 切到 Cloudflare 之後，用 `dig @1.1.1.1 yanchen.app NS` 查 — Cloudflare 自己的 1.1.1.1 resolver 跟我說「還沒生效」，整整 30 分鐘。我差點就以為 NS 沒切成功，準備回 Porkbun 重新檢查。

是 AI（Claude Code）多打了三家 — `8.8.8.8`、`9.9.9.9`、`208.67.222.222` — 同時對驗才抓到：**三家都回新 NS，只有 1.1.1.1 還抱著舊的 cache**。也就是說 NS 早就切過去了，1.1.1.1 自己 stale cache 騙了我。

教訓：**DNS 驗證不能只信一家 resolver**，而 AI 工程師（願意一次打四家做交叉比對）剛好在這件事上比人類強，因為人類懶得多打。

## 目錄

1. 故事：那 30 分鐘我做了什麼
2. AI 跟我說「再驗一次」是什麼意思
3. 為什麼 1.1.1.1 會騙人
4. 多 resolver 對驗 SOP（給人類用 vs 給 AI 用）
5. 順便：哪些 DNS 工具值得學一次
6. AI 在這件事上比人類強在哪
7. FAQ

## 1. 故事：那 30 分鐘我做了什麼

時間軸還原一下。

- **00:00** 在 Porkbun 後台把 nameserver 從預設改成 `anirban.ns.cloudflare.com` + `carrera.ns.cloudflare.com`
- **00:02** 跑 `dig @1.1.1.1 yanchen.app NS`，回的還是 Porkbun 的 NS。正常，DNS 沒這麼快
- **00:10** 再跑一次，還是 Porkbun。開始有點緊張
- **00:20** 第三次，還是 Porkbun。Google 一下「NS 切換要多久」，文章說「通常 5-30 分鐘」。再等
- **00:28** 第四次，還是 Porkbun。**我準備回 Porkbun 後台檢查是不是哪裡按錯了**

這時候 Claude Code（我把整個搬家流程交給它跑）說了一句話：

> 「先別動 Porkbun。`1.1.1.1` 可能在 cache 舊紀錄，我打 8.8.8.8 跟 9.9.9.9 同時驗證一下。」

它跑了三個 dig：

```bash
dig @8.8.8.8 yanchen.app NS +short        # → anirban.ns.cloudflare.com.
                                          #   carrera.ns.cloudflare.com.
dig @9.9.9.9 yanchen.app NS +short        # → anirban.ns.cloudflare.com.
                                          #   carrera.ns.cloudflare.com.
dig @208.67.222.222 yanchen.app NS +short # → anirban.ns.cloudflare.com.
                                          #   carrera.ns.cloudflare.com.
```

三家都回新 NS。只有 1.1.1.1 還在說舊的。

**那一刻才確認：DNS 早就切過去了，根本不用回 Porkbun。**

從 00:28 開始往下做的所有事 — 設 GitHub Pages CNAME、改 17 個檔案的 URL、跑 CI/CD、設 GSC sc-domain — 全部是基於這個「DNS 其實已經對了」的判斷在跑。

如果不是 AI 多打三家，我會浪費至少 1 小時在 Porkbun 後台找一個根本不存在的 bug。

## 2. AI 跟我說「再驗一次」是什麼意思

這件事真正讓我吃驚的不是 1.1.1.1 騙人 — 那是 DNS 系統本來就有的特性，**真正讓我吃驚的是 AI 主動建議「換一家 resolver 再打一次」**。

回想我自己過去搞 DNS 是怎麼除錯的：

```
打 → 失敗 → 看到失敗 → 緊張 → 回後台檢查 → 沒問題 → 再打 → 失敗 → 更緊張
```

完全沒有「換 resolver」這個步驟。因為我心裡的模型是「DNS 就是 DNS，打哪家都一樣」。

而 AI 的心裡模型是：

```
打 1.1.1.1 → 結果 X
打 8.8.8.8 → 結果 Y
打 9.9.9.9 → 結果 Z
比對 X/Y/Z → 如果分歧，分歧的那家有問題；如果一致，結果可信
```

它把「resolver 本身也是個有狀態的東西、有可能壞掉、有可能 cache」當成預設假設。

這個差異不是知識量的差異，是**思考方式的差異**：人類傾向於「相信工具不會錯」，AI 傾向於「工具是另一個變數」。

## 3. 為什麼 1.1.1.1 會騙人

技術上的解釋很無聊但要交代一下，不然這篇變成情緒勒索文。

DNS resolver 是有 **negative cache** 的。當你在 NS 還沒切換的時候打 `1.1.1.1`，它會去問 root server → TLD server → 取得當時的 NS 紀錄（Porkbun 的）→ 快取一段時間（通常是 TTL 的時長，可能 1 小時或更長）。

然後你切了 NS。但 `1.1.1.1` 不會主動去 refetch — 它要等自己的 cache TTL 到期才會去重抓。

問題是 **Cloudflare 的 1.1.1.1 用的是非常激進的 cache 策略**，目的是降低查詢延遲。對一般使用者來說這是優點，對「正在切 DNS 的工程師」來說這是惡夢。

| Resolver | TTL 行為 | 適合用來 |
|---|---|---|
| 1.1.1.1 (Cloudflare) | 激進 cache，stale 比較久 | 一般瀏覽（快） |
| 8.8.8.8 (Google) | 中等 | 一般瀏覽 |
| 9.9.9.9 (Quad9) | 偏短，有過濾惡意網域 | 一般瀏覽 + 安全 |
| 208.67.222.222 (OpenDNS) | 中等 | 一般瀏覽 |
| `dig +trace`（不指定 resolver） | 從 root 開始追，無 cache | **DNS 切換驗證** |

最後一個 `dig +trace` 才是真正可靠的驗證方式，但語法長、輸出冗、人類懶得用。AI 不會懶。

## 4. 多 resolver 對驗 SOP

這是我這次學到、之後 NS 切換一定會跑的標準流程。

### 4.1 給人類用的快速版

```bash
# 同時打四家，看是不是一致
for ns in 1.1.1.1 8.8.8.8 9.9.9.9 208.67.222.222; do
  echo "=== $ns ==="
  dig @$ns yanchen.app NS +short
done
```

判讀方式：
- **四家都一樣** → 信
- **三家一樣、一家不同** → 那一家在 cache，DNS 其實已經對了
- **四家都不一樣** → 真的有問題，回後台檢查

### 4.2 給 AI 用的完整版

如果你跟我一樣讓 AI 跑這件事，叫它跑這個 prompt：

```
驗證 yanchen.app 的 NS 切換狀態：
1. 同時打 1.1.1.1 / 8.8.8.8 / 9.9.9.9 / 208.67.222.222
2. 比對四家結果是否一致
3. 跑 dig +trace yanchen.app NS 看權威解
4. 報告：是切過去了還是還沒、如果不一致，哪家在說謊
```

### 4.3 進階：直接問權威 NS

如果還是不放心，跳過所有 resolver，直接問權威 NS 自己：

```bash
dig @anirban.ns.cloudflare.com yanchen.app NS +short
dig @carrera.ns.cloudflare.com yanchen.app NS +short
```

權威 NS 自己回什麼，就是真相。但前提是你的網域已經把 NS 改成它了 — 雞生蛋蛋生雞的問題還是要靠 +trace 解。

## 5. 順便：哪些 DNS 工具值得學一次

既然講到這邊，順手把這次搬家用到的工具列一下，每個都附「人類懶得記就抄這行」版本。

| 工具 | 用途 | 抄這行 |
|---|---|---|
| `dig` | 主力 DNS 查詢工具 | `dig @8.8.8.8 yanchen.app NS +short` |
| `dig +trace` | 從 root 追到權威 | `dig +trace yanchen.app NS` |
| `nslookup` | dig 的小弟，輸出較友善 | `nslookup -type=NS yanchen.app 8.8.8.8` |
| `whois` | 看 registrar / NS 設定 | `whois yanchen.app \| grep -i name.server` |
| https://dnschecker.org | 全球各地 resolver 同時打 | 網頁，貼網域進去就好 |
| https://www.whatsmydns.net | 同上，UI 更友善 | 同上 |

`dnschecker.org` 跟 `whatsmydns.net` 是「給人類用的多 resolver 對驗工具」 — 但每次都要開瀏覽器、貼網域、等載入。AI 跑 `dig` 比較快，而且結果可以直接餵下一步。

## 6. AI 在這件事上比人類強在哪

這節是給「想用 AI 做 infra 工作但還在猶豫的人」看的。

| 場景 | 人類傾向 | AI 傾向 |
|---|---|---|
| 工具回奇怪結果 | 相信工具，懷疑自己 | 把工具當變數，再驗一次 |
| 跨工具驗證 | 嫌麻煩，只打一家 | 一次打 4 家、自動比對 |
| 失敗時的下一步 | 回後台檢查設定（高情緒） | 先換 resolver / 換時段重打（冷靜） |
| 結果不一致時 | 焦慮，反覆重打同一家 | 列出不一致細節，推斷哪家 stale |
| 紀錄成本 | 心理紀錄，不寫下來 | 預設留 log，下次可重現 |

不是 AI 比較聰明 — 是 **AI 沒有「我已經做完了，不想再驗一次」這個情緒**。它願意把同一件事打四次，人類不會。

DNS 是 infra 工作裡最容易踩這種坑的領域：你看不到、摸不到、它有 cache、它有 propagation、它的失敗訊息很模糊。**這是 AI 工程師主場**。

## 7. FAQ

**Q1: 我可以直接設 TTL 很短來避免這問題嗎？**

A: 可以但有副作用。把 TTL 設成 60 秒，cache 失效快、切換驗證輕鬆，但 DNS 查詢量會暴漲、終端使用者的瀏覽延遲也會增加。建議只在「準備切換的前 24 小時」把 TTL 暫時降到 60-300 秒，切完再調回正常的 3600-86400。

**Q2: 為什麼 Cloudflare 1.1.1.1 cache 這麼激進？**

A: 因為 Cloudflare 主推「全球最快的 resolver」這個賣點。激進 cache 是達成「最快」的手段之一，trade-off 就是「切 DNS 的時候會看到舊資料比較久」。對一般人是優點，對在做 DNS 切換的人是惡夢。Cloudflare 沒做錯什麼，是 cache 策略選擇的問題。

**Q3: 如果四家 resolver 都不一致怎麼辦？**

A: 那真的是有東西壞了。順序：（1）跑 `dig +trace yanchen.app NS` 看權威 NS 是什麼；（2）對著權威 NS 直接問 `dig @<authoritative-ns> yanchen.app NS`；（3）如果連權威 NS 都回奇怪結果，回 registrar（Porkbun / Cloudflare）後台看 NS 設定有沒有打錯字。99% 是第一步就破案。

**Q4: 這個經驗對非 DNS 場景有什麼啟發？**

A: 「同一個事實，問多個來源交叉驗證」這件事在很多 infra debug 場景都成立。例子：（1）API status 不一致 → 同時打 production / staging / 從不同地區的 server；（2）SSL 憑證問題 → 同時用 curl / openssl s_client / 瀏覽器 / SSL Labs；（3）GitHub Actions 跑很久 → 同時看 workflow log / API status / Twitter @githubstatus。AI 在「我懶得多查」這個地方贏很多次。

**Q5: 那我以後就不用 1.1.1.1 了嗎？**

A: 不用為了這件事換 resolver。日常瀏覽 1.1.1.1 真的最快，繼續用。但**做 DNS 切換的時候多開幾個對驗**，就好。

**Q6: AI 怎麼知道要打多家？是它聰明還是它被訓練過？**

A: 兩者都有，但更接近後者。Claude / GPT 這類 LLM 在訓練資料裡看過大量「DNS debug」的對話、文章、Stack Overflow 答案，「stale cache 就要多家對驗」這個 pattern 在資料裡反覆出現。所以它不是即時推理出來的 — 是「這類問題的標準操作」內化在裡面。**但這已經夠用了**，因為人類連這個標準操作都常常忘記。

## 延伸資源

- 主文：[我把買網域+整站搬家交給 AI 跑](/blog/ai-buy-domain-migration-yanchen-app/)
- 系列下一篇：[我請 AI 每天早上 9 點寄 SEO 報告給我](/blog/ai-daily-seo-email-bot/)
- Cloudflare 1.1.1.1 官方文件：https://developers.cloudflare.com/1.1.1.1/
- `dig` 完整 man page：`man dig`（macOS / Linux 本機就有）
- DNS Checker（多 resolver 對驗）：https://dnschecker.org

---

下一篇要講的是怎麼讓 AI 幫我搭一個每天早上自己寄 SEO 報告到信箱的 launchd cron + GSC API pipeline。從「想到」到「能用」我花 1 小時，AI 寫 90% 的 code，包括我自己沒打算學的 SMTP TLS 設定。
