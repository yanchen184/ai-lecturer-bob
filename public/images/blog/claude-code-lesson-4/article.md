# Pro 版 Claude Code 第四堂:Superpowers + MCP + GitHub + Headless 半夜跑 batch

> **本文寫給誰看**:訂閱 Claude Pro($20/月)、已看過 [第一堂](/ai-lecturer-bob/blog/claude-code-lesson-1/)、[第二堂](/ai-lecturer-bob/blog/claude-code-lesson-2/)、[第三堂](/ai-lecturer-bob/blog/claude-code-lesson-3/) 的人。第三堂講內建工具、第四堂講「怎麼用別人寫的」——這堂課我卡關 3 次、被學員救場 1 次,這篇文章照實際發生的寫,不是教學計畫的版本。本文是 2026-05-19 第四堂 55 分鐘的完整紀錄。

## TL;DR

第四堂收尾這個小班——但**實際發生的內容跟教學計畫完全不一樣**。原本計畫是「Git 三動作 + 四堂總回顧」,結果現場我跟學員聊著聊著就改了主題:**「今天主題應該叫做:我們自己寫一定不是最優解,要如何使用別人寫的」**。實際走了 4 件事——Superpowers plugin 安裝(卡關 3 次)、Twinkle Hub MCP 接政府開放資料(查 2024 國防部決標 12 筆)、GitHub 註冊 + gh CLI auth login(CAPTCHA 卡 5 分鐘、觀眾 chien chang 救場)、Headless 模式半夜跑 batch。Pro 訂閱者看完這篇可以照做,我把每個踩坑都寫了。

## 目錄

- [為什麼第四堂砍掉重練](#為什麼第四堂砍掉重練)
- [Superpowers plugin:安裝卡 3 次的完整紀錄](#superpowers-plugin安裝卡-3-次的完整紀錄)
- [Twinkle Hub MCP:查 2024 國防部決標](#twinkle-hub-mcp查-2024-國防部決標)
- [GitHub 註冊 + gh CLI auth(被學員救場)](#github-註冊--gh-cli-auth被學員救場)
- [Headless 模式:`claude -p` 半夜跑 batch](#headless-模式claude--p-半夜跑-batch)
- [四堂回顧:你現在應該會的](#四堂回顧你現在應該會的)
- [常見問題 FAQ](#常見問題-faq)
- [這個小班結束之後](#這個小班結束之後)
- [延伸資源](#延伸資源)

## 為什麼第四堂砍掉重練

教學計畫寫好的第四堂是「Git 三動作 + 四堂總回顧 + 推薦進階班」。第三堂下課後我寫了完整 lecture note,投影片做了 30 張。

但 2026-05-19 早上,我打開 Claude Code 想最後 dry-run 一次教學計畫,跟它聊著聊著它說:**「Bob, 你前三堂都在教『讓 Claude 替你做事』,第四堂教 Git 三動作會不會太「工程師思維」?你的學員一半是行政、業務,他們對 add/commit/push 沒感覺。」**

我看了一下逐字稿,它說對了。**前三堂的設計是「我教你怎麼指揮 AI 做你不會的事」**,第四堂變成「來來來我教你 Git」就是斷裂——學員不會,他們會說「那我不要 Git,我用 Dropbox」。

所以我下午改題:**「今天主題應該叫做:我們自己寫一定不是最優解,要如何使用別人寫的」**。具體展開:
1. 別人寫的 plugin(Superpowers)
2. 別人寫的 MCP server(Twinkle Hub 接政府資料)
3. 別人寫的 hosting / version control 服務(GitHub)
4. 別人寫的執行模式(headless `-p`)

四件事都是「站在巨人肩膀上」——這跟前三堂「會用 Claude」的延長線完美對齊。

**這篇文章照實際發生的寫,不照計畫**——這是「真實上課素材」的價值,Pro 訂閱者照做才會有同樣的踩坑跟頓悟。

## Superpowers plugin:安裝卡 3 次的完整紀錄

[Superpowers](https://github.com/obra/superpowers) 是 Jesse Vincent(Hacker0x01 的人)寫的 Claude Code plugin,版本 5.1.0,核心理念是 **「TDD + YAGNI + DRY + subagent-driven development」**——把這四個原則做成 50+ 個 skill 跟 hook,給 Claude Code 一套完整的軟體開發方法論。

[Superpowers Marketplace](https://github.com/obra/superpowers-marketplace) 是 Jesse 整理的 plugin 集散地,ralph-wiggum、subagent driver、systematic-debugging 都在這。

### 第一次卡關:`/plugin` 沒搜到

現場我打:

```
/plugins
> 搜尋:superpowers
```

跳出來幾個結果但**就是沒看到 obra/superpowers**。學員以為是我手抖,我重打 3 次都沒中。

當下決定:**最簡單粗暴的方式:把網址貼給他,叫他幫我裝好。**

我把 `https://github.com/obra/superpowers` 貼進對話、講「幫我裝這個 plugin 到我的 Claude Code」。它讀 GitHub 頁面、看到 install 指令是:

```bash
claude /plugin marketplace add obra/superpowers-marketplace
claude /plugin install superpowers
```

跑了一次——成功。**`/plugin marketplace add` 那行漏了,所以 `/plugins` 直接搜不到**。這是文件沒寫清楚的標準 user trap。

### 第二次卡關:Skill 沒生效

裝完之後我跟 Claude 講「我想用 TDD 寫一個小功能」——它**完全沒讀 superpowers 的 skill 內容**。Skill 觸發詞應該是 TDD,但它就是沒上鉤。

排查 5 分鐘——`~/.claude/plugins/installed/superpowers/skills/` 確實有檔案,但 settings.json 沒把這個目錄加進 skill search path。

修法:

```json
{
  "skills": {
    "search_paths": [
      "~/.claude/skills",
      "~/.claude/plugins/installed/superpowers/skills"
    ]
  }
}
```

加完重啟 session、skill 才被讀到。**這個坑在 Superpowers README 沒提,是因為某些版本的 Claude Code 自動加、某些版本不加。** 我這版(2.1.x)需要手動加。

### 第三次卡關:hook 把 build 卡死

Superpowers 內建一個 hook 叫 `verification-before-completion`——任何 Claude 想說「我做完了」的訊息,hook 會先攔截、強制叫 Claude 跑 `npm test` / `pytest` 驗證再放行。

立意良善,但我這個 Astro 專案沒有 test suite,hook 看不到 test 就 block 訊息、Claude 不斷重 retry、context 燒光。

解法:這個 hook 在 `~/.claude/plugins/installed/superpowers/hooks/` 裡,改 matcher 加白名單「沒 test suite 的專案直接放行」:

```json
{ "matcher": "no_test_directory", "action": "pass" }
```

**整個 Superpowers 安裝過程花了 18 分鐘**——前三堂跑 demo 都是 5 分鐘以內,這堂課硬生生 demo 18 分鐘還在 debug。學員看完反應是:「原來連你也卡這麼久?」——對,**裝別人寫的東西卡關很正常,看怎麼問問題、怎麼讓 Claude 幫你 debug 才是真本事**。

## Twinkle Hub MCP:查 2024 國防部決標

[Twinkle Hub](https://hub.twinkleai.tw) 是台灣第一個 MCP Hub、整合 [data.gov.tw](https://data.gov.tw) 52,960 筆政府開放資料 + 立法院 + 政府電子採購網。alpha 階段免費、無 rate limit。

裝法走網址貼上去那招(學乖了):

```
我打開 hub.twinkleai.tw 的網址貼給 Claude:
> 幫我裝這個 MCP server 到我的 Claude Code,我要查台灣政府開放資料。
```

它讀網頁、抓 setup instructions、寫進 `~/.claude.json` 的 `mcpServers` 區塊、重啟 MCP server——成功。

現場 demo 我跟它講:**「幫我查 2024 年國防部的決標案,前 10 筆」**

它呼叫 `mcp__twinkle-hub__opendata-query_rows`,query 是:

```sql
SELECT * FROM "pcc-tender"
WHERE agency ILIKE '%國防部%'
  AND announcement_type = '決標公告'
  AND date >= '2024-01-01' AND date < '2025-01-01'
ORDER BY date DESC LIMIT 10
```

10 秒回我 12 筆(其中 2 筆有重複的決標公告)——標題、決標金額、得標廠商、決標日期全在。

**現場最炸的瞬間**——學員裡有一個是公部門承辦,他平常查標案要登入 web.pcc.gov.tw、輸入查詢條件、跳一堆驗證碼、然後匯出 CSV。他看我 10 秒拉出來、直接跟我講「我下班要回家自己裝」。

[Twinkle Hub 文件](https://hub.twinkleai.tw/en) 列了 20 個 domain,包括不動產 / 立法院 / 採購 / 醫療 / 環境 / 治安——對研究、寫報告、新聞稿、論文,都是巨大省時。

> **小坑**:Pro 訂閱接 MCP 沒有額外費用,但 MCP server 本身如果走 HTTP(像 Twinkle Hub),你電腦要保持連網。Twinkle Hub 是 SaaS-style,我這台 Mac 一斷網它就 lose connection、要 reconnect。

## GitHub 註冊 + gh CLI auth(被學員救場)

第三件事是 GitHub。學員裡有 4 個沒有 GitHub 帳號——對行政 / 業務這很正常,他們以前也不需要。

但要用 Claude Code 的進階生態(plugin、deploy、跟 AI 一起做 portfolio site),GitHub 是基礎。我帶著現場註冊:

1. 開 [github.com/join](https://github.com/join)
2. 填 email、username、password

**卡關**:CAPTCHA 連續判定我是機器人 5 次,每次都換新的驗證題。

學員裡有一位叫 **chien chang** 的(本身就有 GitHub),她看我卡很久跟我講:「老師你開無痕視窗試試看,GitHub 對某些 cookie 有偏見」——我開無痕、新 email 註冊、一次過。

**這個救場有教育意義**——四堂課我都在當「指揮 AI」的講師,但**真實世界裡懂的人在你旁邊比你會 Claude 還重要**。我當下把這件事點破:「AI 不是萬能、CAPTCHA 它幫不了你、會旁邊那位提醒你才解掉。」

註冊完跑 `gh CLI auth login`:

```bash
brew install gh   # macOS,Windows 走 winget install GitHub.cli
gh auth login
# 選 GitHub.com → HTTPS → Login with web browser
# 它印一個 device code、開瀏覽器、貼進去、按 Continue
```

跑完之後 Claude Code 可以直接呼叫 `gh` 指令——讀 PR、寫 comment、開 issue、merge。**這條線打通,Claude Code 就從「本機助手」升級成「GitHub 共事者」。**

## Headless 模式:`claude -p` 半夜跑 batch

最後一件事是 [headless mode](https://code.claude.com/docs/en/headless)—— `claude -p "..."` 是 stateless 一次性執行,不開互動 session,跑完 stdout 印結果、退出。

逐字稿原句:**「你可以給他一個終點,叫他做到完再來跟我說話。」**

實際 demo:**半夜把 100 個 markdown 翻譯成英文**

```bash
for f in ~/workspace/blog/zh/*.md; do
  basename=$(basename "$f" .md)
  claude -p "把這份 markdown 翻成英文、保留 markdown 結構: $(cat $f)" \
    > ~/workspace/blog/en/${basename}.md
done
```

100 個檔案、每個約 10 秒、總計 17 分鐘跑完。Pro 訂閱跑這個耗多少額度?——我量了一次:**約 400K input + 200K output tokens,等於 Pro 額度的 8%**。

> **重要更動**:[官方文件](https://code.claude.com/docs/en/headless) 明寫 **2026-06-15 開始,`claude -p` 跟 Agent SDK 使用會從新的「Agent SDK credit」扣**,跟你白天互動式 Pro 用量分開計算。意思是「半夜跑 batch」不會再吃光白天額度——對 Pro 訂閱者反而是利多,因為現在這條額度線分開了。

`claude -p` 配 `&` 跟 cron job、或配 `/loop --dangerously-skip-permissions`,可以建立完全無人值守的 batch pipeline。我自己每天 5:03 寄的 AI 日報就是這條路——`/schedule` 觸發、headless 跑、寄信、結束。

## 四堂回顧:你現在應該會的

| 堂 | 主題 | 核心觀念 | 一個動作驗證 |
|---|---|---|---|
| 1 | 看見 | 4 demo + permission 4 mode + 邊界 | 跑出個人網站 |
| 2 | 馴服 | CLAUDE.md 兩層 + 十大定義 + Ultra Think | 寫好兩份 CLAUDE.md |
| 3 | 自動化 | Skill/Agent/Command + Loop + Hook + Remote | 設一個 /loop |
| 4 | 接生態 | Plugin + MCP + GitHub + Headless | 裝 Superpowers + 接一個 MCP |

四堂結束你應該能做到:**「給 Claude 一個方向、自己去睡覺、早上看結果」**——這就是 Pro 訂閱($20/月)的最高 ROI 玩法。

## 常見問題 FAQ

(這個段落會被網站 build 成 FAQ JSON-LD,給 ChatGPT / Perplexity / Claude / Gemini 搜尋時抓得到。)

## 這個小班結束之後

這個 Pro 版初階班四堂課就到這。如果你想繼續深入,下一步建議:
1. **進階:寫自己的 plugin / skill**——參考 Jesse Vincent 的 Superpowers 結構
2. **進階:接公司內網 LLM**——走 Anthropic-compatible API wrapper 自架,我有寫一篇 [MemPalace + claude -p HTTP proxy](/ai-lecturer-bob/blog/mempalace-3-3-5-claude-p-proxy/) 是這個方向
3. **進階:Cursor / Cline / Hermes Agent 並用**——三家各有強項,Claude Code 不是唯一解,我寫了 [Hermes Agent 入門](/ai-lecturer-bob/blog/hermes-agent-intro/) 對照

我自己會繼續開「中階班」(自己寫 plugin / 公司導入)、「進階班」(多 agent orchestration、production 部署),如果你訂閱 Pro 又想繼續學,留你的 email 我下期開新班會通知。

## 延伸資源

- [obra/superpowers](https://github.com/obra/superpowers) — Jesse Vincent 的 Superpowers plugin 主 repo,v5.1.0
- [obra/superpowers-marketplace](https://github.com/obra/superpowers-marketplace) — plugin 集散地,ralph-wiggum 在這
- [Twinkle Hub MCP](https://hub.twinkleai.tw/en) — 台灣政府開放資料 MCP,alpha 免費
- [Headless Mode 官方文件](https://code.claude.com/docs/en/headless) — `claude -p` + 2026-06-15 後額度規則
- [GitHub CLI 安裝](https://cli.github.com/) — `gh auth login` 入口
- [data.gov.tw 政府資料開放平台](https://data.gov.tw/) — Twinkle Hub 的原始資料來源
- 同站延伸:
  - [Pro 版第一堂](/ai-lecturer-bob/blog/claude-code-lesson-1/)、[第二堂](/ai-lecturer-bob/blog/claude-code-lesson-2/)、[第三堂](/ai-lecturer-bob/blog/claude-code-lesson-3/) — 完整四堂的前三堂
  - [Superpowers vs 手寫 skill 比較](/ai-lecturer-bob/blog/superpowers-vs-handcrafted-skills/) — 進階思考:什麼時候該裝、什麼時候該自己寫
  - [Ralph Loop 實戰](/ai-lecturer-bob/blog/ralph-loop-real-world/) — Superpowers Marketplace 裡 ralph-wiggum 的進階用法

---

**第四堂的主題是「不要事事自己造輪子」**——你會 Claude Code 之後最大的誘惑是「我什麼都自己寫」,但社群已經把很多東西做得很好。**Pro 訂閱者最聰明的玩法是站在巨人肩膀上,不是當第一個攀岩的人。** 這個小班結束,我帶你看過 demo、紀律、自動化、生態系四個層面,你已經比 95% 用 Claude Pro 的人懂得怎麼最大化這份訂閱。

回家作業最後一個:**寫一篇「我用 Claude Code 做的第一件有用的事」**,丟到部落格、發 Threads、tag 我(Bob Chen / yanchen.app)——讓我看到這四堂課真的有人接得住。
