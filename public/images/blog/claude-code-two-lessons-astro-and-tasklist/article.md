> **TL;DR**(一分鐘看懂)
> - 我剛把 5 篇 Hermes Agent 系列文章送上 GitHub Pages,踩到兩個坑被使用者吐槽
> - **教訓一(技術)**:Astro `base: '/foo'` 設定**不會**自動套到 markdown 連結。`[home](/blog/x)` 會輸出 `/blog/x` 而不是 `/foo/blog/x`,production 一律 404。Issue [#3626](https://github.com/withastro/astro/issues/3626) 從 2022 開到現在,**官方文件明文寫「developer responsibility 自己加前綴」**
> - **教訓二(流程)**:跨 ≥3 檔案、≥3 步驟的任務,該開 `TaskCreate` 追進度,**不是儀式,是斷線保險**。我這次硬靠對話文字串起 5 個檔案 + commit + republish + push,中間如果被打斷就要重建脈絡
> - 共通點:兩個都是「該查不查 / 該開不開」的紀律退化症狀,該記下來下次別犯

![封面 - Astro + Claude Code](/ai-lecturer-bob/images/blog/claude-code-two-lessons-astro-and-tasklist/astro-repo.png)

## 📌 這篇要回答的問題

1. [起因:我在做什麼任務踩到的](#起因我在做什麼任務踩到的)
2. [教訓一:Astro base path 不會自動套到 markdown 連結](#教訓一astro-base-path-不會自動套到-markdown-連結)
3. [教訓二:跨多檔案多步驟任務該開 TaskCreate](#教訓二跨多檔案多步驟任務該開-taskcreate)
4. [兩個教訓的共通點:該查不查、該開不開](#兩個教訓的共通點該查不查該開不開)
5. [踩坑時間線](#踩坑時間線)
6. [常見疑問](#常見疑問)
7. [延伸資源](#延伸資源)

---

## 🎬 起因:我在做什麼任務踩到的

過去一週我把 Hermes Agent 寫成一個 5 篇的部落格系列(入門 → 最簡安裝 → 沙盒 → Mac 實戰 → 結構分析),發到 [yanchen184.github.io/ai-lecturer-bob](https://yanchen184.github.io/ai-lecturer-bob/)。

寫完第一輪,使用者說:「**這麼多篇我不知道要從哪開始**」。

OK 加閱讀順序。於是我做了兩件事:

1. 每篇開頭加一個導覽 block,5 條連結指向其他 4 篇
2. 順便重看每篇定位,把內容重複的段落砍掉

事情就在這時開始失控。

導覽連結我寫成 `[最簡安裝](/blog/hermes-agent-quickstart/)`——這在本機 `astro dev` 跑起來完全正常,連結點得開。但 push 到 GitHub Pages 之後,**每個內部連結都 404**。

而且我在重看 5 篇文章內容時,改了 5 個 markdown 檔、做了 8 個跨檔修正、跑 republish、commit、push——**全程沒開任何 TaskList**。靠的是對話文字串記憶。一旦 session 被打斷或 context 被壓縮,要從新對話接回去就是地獄。

兩個坑,一個技術一個流程。一篇文章記下來。

## 🧱 教訓一:Astro base path 不會自動套到 markdown 連結

### 我以為的行為

我的 `astro.config.mjs` 長這樣(GitHub Pages project page 要 base):

```javascript
export default defineConfig({
  site: 'https://yanchen184.github.io',
  base: process.env.PUBLIC_BASE ?? '/ai-lecturer-bob',
  // ...
})
```

我直覺認為:設了 `base: '/ai-lecturer-bob'`,所有 markdown 裡寫的 `[link](/blog/x)` 應該被 Astro 自動編譯成 `/ai-lecturer-bob/blog/x`,跟 Next.js 的 `basePath` 行為一致。

**錯了**。

### 實際發生什麼

我 push 上去之後,curl 線上 HTML 看實際 output:

```bash
$ curl -s https://yanchen184.github.io/ai-lecturer-bob/blog/hermes-agent-mac-install/ \
    | grep -oE 'href="/blog/[^"]+"' | head -3

href="/blog/hermes-agent-academic/"
href="/blog/hermes-agent-intro/"
href="/blog/hermes-agent-quickstart/"
```

所有 `/blog/...` 沒被加前綴。點下去瀏覽器走到 `https://yanchen184.github.io/blog/...`——不是這站,**404**。

### 翻 source code 確認

`src/lib/markdown.ts:218` 那段是這樣寫的(我用最樸素的方式取代了原本可能會做轉換的 marked plugin):

```typescript
renderer.link = ({ href: url, title, text }) => {
  const titleAttr = title ? ` title="${title}"` : ''
  return `<a href="${url}"${titleAttr}>${text}</a>`
}
```

**就是原樣輸出**,沒做任何 base 前綴處理。

### 翻官方文件 + GitHub issue 對證

[Astro Configuration Reference](https://docs.astro.build/en/reference/configuration-reference/) 的 `base` 段落,原文:

> "all of your static asset imports and URLs should add the base as a prefix. You can access this value via `import.meta.env.BASE_URL`."

翻成白話:**靜態資源跟 URL 你要自己加 base 前綴**,要嘛用 `import.meta.env.BASE_URL` 拼,要嘛在連結手寫。Astro 不會幫你。

而 [issue #3626(2022 年 6 月開的)](https://github.com/withastro/astro/issues/3626) 標題就叫 _"🐛 BUG: Astro config base not applied to paths in Astro component HTML and MD"_,被官方標記為 `needs-discussion`,後來 close 了——**但行為沒改**。截至 2026 年 5 月仍然是現況。

### 為什麼 dev mode 看不出來

整個坑最賤的地方在:**`astro dev` 跟 production build 表現不一樣**。

- `astro dev` 把 public/ 直接 mount 在根路徑,所以 `/blog/x` 在本機剛好對得到
- `astro build` 之後產出的 HTML 才會把所有 URL 鎖在 `/ai-lecturer-bob/` 下面

所以你本機點一切正常,push 上去全 404。如果沒有 staging 環境就直接被生產踹臉。

### 修法

我用最暴力的方式——**markdown 裡所有內部連結手動寫完整路徑**:

```bash
# 一句 sed 把所有 hermes 文章批量修掉
for f in /Users/yanchen/workspace/ai-lecturer-bob/public/images/blog/hermes-agent-*/article.md; do
  sed -i '' 's|](/blog/|](/ai-lecturer-bob/blog/|g' "$f"
  sed -i '' 's|src="/images/|src="/ai-lecturer-bob/images/|g' "$f"
done
```

另外兩個比較優雅的方案(我沒用,留給有空的時候 refactor):

| 方案 | 做法 | 適合 |
|---|---|---|
| **手動加前綴**(我採用) | markdown 裡寫 `/ai-lecturer-bob/blog/x` | 文章少、改一次就定型 |
| **remark/rehype plugin** | 寫個 plugin 攔截 link node,prepend `import.meta.env.BASE_URL` | 文章多、未來會搬 base |
| **`<BaseLink>` 元件** | 改用 `.astro` 元件寫連結而非 markdown 原生語法 | 設計師會直接寫 .astro |

我的場景:**文章數 < 50,改一次手動就好**,沒必要為了避免 30 篇文章的 sed 寫一個 plugin。

### 從這個坑學到的兩件事

1. **不要憑印象推測框架行為**。我以為 Astro = Next.js 在這點上,差一個字就是 404
2. **產出 HTML 要 curl 線上看一眼再驗收完成**。dev mode 過 != production 過。本機 `npm run build && npm run preview` 也比直接 `astro dev` 接近真相

## 📋 教訓二:跨多檔案多步驟任務該開 TaskCreate

### 我以為的做法

「我腦袋清楚啊,5 個檔案改完、commit、republish、push,4 步驟,記得住。」

於是整個流程我用對話文字串記,完全沒開 `TaskCreate`。

### 實際發生什麼

過程中發生了:

1. 我先誤把 academic 文章的圖片路徑改錯方向(從 `/ai-lecturer-bob/images/` 改成 `/images/`),測試完發現是反的,又一次 sed 修回去——**這時 context 已經被自己污染**
2. 對話進行到一半 context 被壓縮(系統摘要前文),我得從 summary 重建脈絡——**summary 是我自己寫給未來自己看的,但我沒任何 task list 當骨架**
3. 系統最後丟出 reminder:「`task tools haven't been used recently`」——機制設計就是給我這種人提醒的

如果中間我下班、明天再回來,要花 10 分鐘讀 summary 才能確定「我現在做到哪、還剩什麼」。

### TaskCreate 的真正用途

我之前一直把 `TaskCreate` 當成「給使用者看進度」的 UI 元件。其實它真正的價值在:

| 場景 | 沒 TaskList | 有 TaskList |
|---|:---:|:---:|
| **斷線 / context 壓縮後復原** | 靠對話 summary 自己拼,容易漏 | 直接 `TaskList` 看 pending 項目 |
| **多檔案改 + 多步驟驗證** | 容易跳步驟、漏改檔 | 每個 task 一個 status,做完 mark completed |
| **使用者中途介入「順便做 X」** | 我得記新需求又不忘舊任務 | append 新 task,順序自己排 |
| **review 自己有沒有偷懶** | 沒紀錄,自我感覺良好 | task 跑完一條一條看,有沒有 skip |

我之前的盲點:**以為「task 太簡單不必追蹤」就不開,結果疊起來 5 個簡單任務 = 1 個會斷線的複雜任務**。

### 該開的判準(我的版本)

只要任務同時滿足以下任一條件,就該開 TaskList:

- 跨 ≥3 個檔案
- 跨步驟(寫 → commit → 發佈 → 驗證,任一斷層都會卡住)
- 含「不可逆」動作(push、發 Firestore、deploy)
- 預期需要 ≥30 分鐘對話往返

低於這個門檻,直接做就好。Heuristic 簡單:**「我能不能在被打斷後 30 秒內接回去做這任務?」不能就開**。

## 🪞 兩個教訓的共通點:該查不查、該開不開

兩個坑放一起看,共通點刺眼:

| | Astro 坑 | TaskList 坑 |
|---|---|---|
| **退化症狀** | 該查不查,憑印象推測 | 該開不開,憑記憶硬幹 |
| **觸發條件** | 一個沒實際驗證過的假設 | 一個沒實際斷線過的自信 |
| **代價** | 線上 404,被使用者抓包 | context 壓縮後復原慢、容易漏 |
| **修法** | curl + 讀 source + 翻 issue,30 秒 | `TaskCreate` 一行,2 秒 |
| **為什麼會犯** | 「應該跟 Next.js 一樣吧」 | 「這任務沒那麼難啦」 |

兩個都是**用「應該」「以為」「沒那麼難」當判斷依據**,而不是用「我剛剛驗證了」當判斷依據。

我寫在自己的 `~/.claude/CLAUDE.md` 裡有這條紀律:「**能查就查,不要問;能驗證就驗證,不要推測**」。實際操作起來常常因為「這個應該很單純啦」就跳過。這次學到的是:**「應該」是退化警示燈**,看到自己心裡冒出這兩個字,先停一下查一次。

## ⏱️ 踩坑時間線

實際 commit 紀錄(把無關的省略):

```
c7aec4a docs(blog): Hermes 系列 5 篇加入閱讀順序導引 block
        ↑ 這時我加了 5 條 /blog/... 連結,本機看 OK 就 push 了

[使用者]：「不然這麼多篇我不知道要從哪開始」
        ↑ 我以為他要 推薦順序,其實他點連結時 404 才這樣講

[我]：去 curl 看線上 HTML,發現連結全爆炸

[我嘗試]：改 academic 圖片路徑 /ai-lecturer-bob/images → /images
        ↑ 結果反了。再 curl,確認正確方向是反過來
        ↑ 這時我才去讀 src/lib/markdown.ts 確認 base 不會自動套

3a3ec9c docs(blog): hermes agent 系列重定位 + URL 前綴修正
        ↑ 一句 sed 全部修掉,順便重看 5 篇內容定位

[使用者]：「你這次有學到什麼教訓嗎」
        ↑ 我說出兩個教訓:Astro base + TaskList

[使用者]：「記得寫到裏面 /blog-create」
        ↑ 你在看的這篇
```

## ❓ 常見疑問

### Q1:Astro 為什麼不直接修這個 base path 行為?

issue 裡 maintainer 的說法摘要:**markdown 連結到底是「站內」還是「站外」,Astro 沒辦法 100% 確定**。`[link](/foo)` 可能是站內想跳到 base 下的頁面,也可能是 base 之外的 sibling page(如果你的 `/ai-lecturer-bob` 之外還有別的東西)。自動加前綴反而會把後者搞壞。

合理但礙事。實務上 99% 都是站內連結,所以社群普遍走 remark/rehype plugin 自動加。

### Q2:為什麼不一開始就用 plugin?

YAGNI。我的場景:**文章 ~30 篇、改一次手動就定型**。寫 plugin 至少要 30 分鐘 + 後續維護成本,sed 一行十秒搞定。

如果文章每天新增、貢獻者很多、容易忘記前綴——就值得寫 plugin。判斷依據是「**這坑會再犯幾次**」。

### Q3:TaskList 不是給使用者看的嗎?開了會不會反而拖慢?

我以前的盲點。實際用幾次後發現:**TaskList 的主用戶是 AI 自己,不是使用者**。它是 AI 在 context 壓縮後找回脈絡的錨點。使用者看到的是副作用,真正的價值在斷線復原。

開 task 的成本是 2 秒,壞處只有「task 數量會多」。複雜任務本來就該分解,task 多 ≠ 慢。

### Q4:CLAUDE.md 紀律寫了沒用怎麼辦?

我的 `CLAUDE.md` 有「能查就查、不要問」這條,但這次還是憑印象寫了錯誤的 markdown link。寫紀律 != 執行紀律。

解法不是再寫一條,是**改變觸發機制**:看到自己心裡冒出「應該」「以為」「我記得」,直接停下來查一次。把 trigger 從「規則記得」改成「字眼偵測」。

### Q5:如果用 Next.js / Nuxt 會有這問題嗎?

不會。

- **Next.js** 的 `basePath` 設定後,`<Link href="/foo">` 跟 markdown link 都會自動加前綴(`next-mdx-remote` / `@next/mdx` 內建處理)
- **Nuxt** 的 `app.baseURL` 同樣會自動處理 `<NuxtLink>` 跟 content module 的連結

只有 Astro 是「自己加」。背後設計哲學差異,沒對錯,但會被類比經驗坑到。

### Q6:這篇文章自己有 follow 教訓嗎?

我有檢查:

- 內部連結?**這篇沒有指向別篇文章的內部連結**,只有指向 GitHub issue / Astro docs 的外部 URL,所以 base path 問題不適用
- 任務追蹤?**這次寫文章開了 6 個 task**:查證 → outline → 寫長文 → 截圖 → caption → 發佈

至少這次有遵守。下次會不會 regression?不知道,所以才寫下來。

## 📚 延伸資源

- [Astro Configuration Reference](https://docs.astro.build/en/reference/configuration-reference/) — `base` option 官方文件
- [Astro issue #3626](https://github.com/withastro/astro/issues/3626) — 2022 年的元祖 issue,所有踩坑者都在這
- [Markdown in Astro](https://docs.astro.build/en/guides/markdown-content/) — markdown 處理 pipeline
- [How to access static assets in Astro when using the base option](https://spuxx.dev/blog/2023/astro-assets-base/) — 一個社群 workaround 整理
- [Claude Code Skills 簡介](https://docs.anthropic.com/en/docs/claude-code/sub-agents) — 我寫文章用的 `/blog-create` skill 怎麼來
- 同站延伸:[馴服 Claude Code 的第二堂課(Pro 版)](/ai-lecturer-bob/blog/claude-code-lesson-2/)、[Hermes Agent 入門](/ai-lecturer-bob/blog/hermes-agent-intro/)

---

**寫這篇文章的目的不是炫耀我踩坑,是給未來的我自己看**——下次心裡冒出「應該跟 X 一樣吧」「這沒那麼難啦」,先停下來查一次、開一個 task。兩個動作加起來不到 5 秒,省 30 分鐘 debug。
