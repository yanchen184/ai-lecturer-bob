> **TL;DR**
> - 本文解決：部落格每寫一篇都要手動畫架構圖、改一次重畫一次的問題
> - 推薦給：寫技術部落格、會用 Spring Boot / React、想用文字管理流程圖的工程師
> - 讀完你會知道：Kroki 是什麼、為什麼自架比公服務穩、Astro 怎麼接、踩坑點在哪

我寫這個部落格兩個月，每篇要附 3 張以上的圖。**多數時間花在開 Figma / draw.io 拖拉那種人類根本不該做的事**。文字才是我擅長的東西，圖只是文字的視覺化結果——我為什麼要手畫？

這篇是我把部落格的圖表流程從「**手動截圖**」改造成「**markdown 寫文字、build 時自動產 SVG**」的完整紀錄。換到 Kroki 之後，**架構類、流程類的圖再也不用開 Figma**。

成品架構長這樣：

<img src="/ai-lecturer-bob/images/blog/kroki-self-host-diagram-pipeline/pipeline-architecture.svg" alt="Kroki self-host build pipeline 架構圖" style="border-radius: 8px; margin: 1rem 0; width: 100%; background: #fff; padding: 16px;" />

**這張圖本身就是用 Kroki 產的**——我在 markdown 寫了 7 行 Mermaid 語法，build 時 inline SVG 進 HTML，部署完讀者看到的就是這張。

## 📌 目錄

1. [Kroki 是什麼](#kroki-是什麼)
2. [為什麼不直接用 kroki.io 公服務](#為什麼不直接用-krokiio-公服務)
3. [Kroki vs Mermaid Live vs PlantUML server 比較](#kroki-vs-mermaid-live-vs-plantuml-server-比較)
4. [整合 Astro 的三個關鍵設計決策](#整合-astro-的三個關鍵設計決策)
5. [從 0 開始：Docker 自架完整步驟](#從-0-開始docker-自架完整步驟)
6. [GitHub Actions 加 service container](#github-actions-加-service-container)
7. [改 markdown parser 攔截 kroki block](#改-markdown-parser-攔截-kroki-block)
8. [踩坑紀錄](#踩坑紀錄)
9. [心法與成本拆解](#心法與成本拆解)
10. [常見問題](#常見問題)
11. [延伸資源](#延伸資源)

## 🔍 Kroki 是什麼

[Kroki](https://kroki.io/) 是 [yuzutech 維護的開源服務](https://github.com/yuzutech/kroki)，**用一個 HTTP API 把文字描述轉成圖表**。MIT 授權、4.1k stars，目前最新版 v0.30.1（2026-03-02）。

它最大的賣點是**一個 endpoint 包辦 23+ 種圖表引擎**：

- 流程圖：Mermaid、Graphviz、D2、Nomnoml
- UML：PlantUML、C4-PlantUML
- DB schema：DBML、Erd
- 架構圖：Structurizr、Excalidraw
- 序列圖：SeqDiag、Mermaid sequence
- 業務流程：BPMN
- 數據視覺化：Vega、Vega-Lite
- 其他：TikZ（LaTeX 公式）、WaveDrom（時序圖）、Svgbob（ASCII art）

**為什麼一個服務要包 23 種？** 因為每個引擎背後都是不同語言寫的（Graphviz C、PlantUML Java、Mermaid JS、D2 Go），各自要不同 binary、不同 deps。Kroki 把它們全包成 docker image，**你只要打 HTTP API，後面誰跑的不用管**。

<img src="/ai-lecturer-bob/images/blog/kroki-self-host-diagram-pipeline/github-repo.png" alt="Kroki yuzutech GitHub repo 預覽：4.1k stars、MIT 授權" style="border-radius: 8px; margin: 1rem 0; width: 100%;" />

最簡單的用法：

```bash
curl https://kroki.io/graphviz/svg --data-raw 'digraph G {Hello->World}'
```

回來就是 SVG，沒有 API key、沒有註冊、不用付錢。

## ⚠️ 為什麼不直接用 kroki.io 公服務

聽起來公服務超方便，那為什麼這篇講「自架」？

**因為我在研究這個工具的當下，公服務就掛了。**

```bash
# 我跑這條指令的時候
curl https://kroki.io/graphviz/svg --data-raw 'digraph G {Hello->World}'
# 結果：Operation timed out after 15004 milliseconds with 0 bytes received
```

連最簡單的 `digraph G {Hello->World}`（24 bytes payload）都 timeout。kroki.io 首頁活著（Cloudflare 回 200），但**後面的渲染 cluster 沒回應**。

**這是個系統性風險，不是偶發**：

- 公服務由 Exoscale 贊助免費跑，沒有 SLA 承諾
- 全球流量打同一個 instance
- 你部落格圖片要靠它活著——它掛你就破圖

如果你用方案「**讀者瀏覽器直接連 kroki.io**」，**現在這分鐘所有圖都壞了**。我親自踩到這顆地雷，所以這篇直接跳過公服務、講自架。

## ⚖️ Kroki vs Mermaid Live vs PlantUML server 比較

工程師選工具最常見的對照組：

| 特徵 | Kroki（自架） | Mermaid Live | PlantUML public server |
|------|:---:|:---:|:---:|
| 支援引擎數 | 23+ | 1（Mermaid） | 1（PlantUML） |
| 自架難度 | 一行 docker run | 自架 server 不存在 | 中等（要設 Java） |
| 離線可用 | ✓ | ✗（編輯器 only） | △（自架才行） |
| API 形式 | REST | 無 | REST |
| URL 編碼方式 | deflate + base64url | hash 形式 | encode 形式 |
| 適合場景 | 多引擎並用、企業內網 | Mermaid 單一場景 | 老牌 UML 專案 |

**結論**：如果你只用 Mermaid 一種引擎，GitHub README 直接寫 ` ```mermaid ` 就好，不需要 Kroki。但**你部落格通常會混 Mermaid + PlantUML + DBML + 偶爾 D2**，Kroki 才有意義。

## 🛠️ 整合 Astro 的三個關鍵設計決策

我這個部落格是 Astro SSG + Firestore 撈 markdown。整合過程做了三個決策，每個都影響後面的所有事。

### 決策 1：build 時 inline SVG，不要 runtime fetch

**問題**：要把 SVG 寫死進 HTML，還是 HTML 寫 `<img src="https://kroki.io/...">` 讓瀏覽器抓？

**選擇**：build 時 inline。

**為什麼**：
- 不依賴 kroki.io 活著（已驗證它會掛）
- 圖文是 SVG，**Google 搜尋可索引 SVG 內容**
- HTML 自包，CDN 友善

**代價**：build 變慢（mermaid 第一次 11 秒、PlantUML 2.4 秒）。但這只發生在 GitHub Actions build 時，讀者完全感覺不到。

### 決策 2：本機跟 GHA 都用同一個 docker compose

**問題**：本機開發要不要也跑 Kroki？

**選擇**：要，而且用同一份 `docker-compose.kroki.yml`。

**為什麼**：
- 本機 `npm run dev` 也需要 Kroki，不然 markdown parser 抓不到圖
- 同一份 compose file 確保本機跟 GHA 跑同樣的 Kroki 版本（避免「本機過、GHA 過、線上掛」）
- macOS 開機自動啟動，之後感覺不到它存在

### 決策 3：parser 攔截 `kroki:<type>` 而不是 ` ```mermaid `

**問題**：要不要攔截 ` ```mermaid ` 這種已經很常見的 fenced code block？

**選擇**：不要，用 `kroki:` prefix 顯式區分。

**為什麼**：
- ` ```mermaid ` 有歧義——GitHub README 也吃這個，讀者可能以為是 GitHub native
- `kroki:mermaid` 一看就知道是這個部落格的客製 syntax
- 未來想換引擎、想關閉某個引擎都好處理

寫法是這樣：

````markdown
```kroki:mermaid
graph LR
  A[使用者] --> B[Next.js]
  B --> C[Spring Boot]
  C --> D[(MSSQL)]
```
````

## 🚀 從 0 開始：Docker 自架完整步驟

### 前置需求

| 項目 | 用途 | 確認指令 |
|------|------|----------|
| Docker Desktop 24+ | 跑 Kroki container | `docker --version` |
| docker compose v2 | 多 container 編排 | `docker compose version` |
| 對外 8000 port 沒被佔 | Kroki 預設 port | `lsof -i :8000` 應該沒輸出 |

macOS：`brew install --cask docker`。Linux：照 Docker 官方安裝指引。

### 建立 docker-compose

在專案 root 建 `docker-compose.kroki.yml`：

```yaml:docker-compose.kroki.yml
services:
  kroki:
    image: yuzutech/kroki
    restart: unless-stopped
    depends_on:
      - mermaid
    environment:
      - KROKI_MERMAID_HOST=mermaid
    ports:
      - "8000:8000"

  mermaid:
    image: yuzutech/kroki-mermaid
    restart: unless-stopped
    expose:
      - "8002"
```

**為什麼 mermaid 要拆出來？** Kroki 主 container 是 JVM-based，但 Mermaid 引擎是 JavaScript + headless browser。把 headless browser 跟 JVM 塞一起會記憶體爆掉，所以 Kroki 設計成把 Mermaid（還有 BPMN、Excalidraw）拆成 sidecar container。

**`restart: unless-stopped`** 是關鍵：重開機自動起來，之後完全感覺不到它存在。

### 啟動

```bash
docker compose -f docker-compose.kroki.yml up -d
```

第一次跑要 pull image（kroki ~570MB、kroki-mermaid ~400MB），看你網速 1-3 分鐘。

### 驗證

```bash
# 1. container 起來沒
docker ps --filter "name=kroki"

# 2. API 通沒通
curl -sf http://localhost:8000/ -o /dev/null && echo "OK"

# 3. 真的渲染一張圖
curl -X POST http://localhost:8000/mermaid/svg \
  -H "Content-Type: text/plain" \
  --data 'graph LR; A --> B' \
  -o test.svg
open test.svg
```

看到 SVG 圖跳出來就成功了。

## ⚡ GitHub Actions 加 service container

關鍵改動：把 Kroki 也設成 service container，build 步驟透過 `localhost:8000` 連線。

```yaml:.github/workflows/deploy.yml
jobs:
  build:
    runs-on: ubuntu-latest
    services:
      kroki-mermaid:
        image: yuzutech/kroki-mermaid
      kroki:
        image: yuzutech/kroki
        ports:
          - 8000:8000
        env:
          KROKI_MERMAID_HOST: kroki-mermaid
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - name: Wait for Kroki
        run: |
          for i in $(seq 1 30); do
            if curl -sf http://localhost:8000/ -o /dev/null; then
              echo "Kroki is ready"; exit 0
            fi
            sleep 2
          done
          echo "Kroki failed to start"; exit 1
      - run: npm run build
        env:
          KROKI_ENDPOINT: http://localhost:8000
```

**幾個 GHA 特有眉角：**

- `services` 容器之間用 service name 當 hostname（`kroki-mermaid`），不是 `localhost`
- 從 `runs-on` 的 host 連 services 才用 `localhost:<port>`
- service container 啟動跟 step 是 race condition，**一定要加 wait for ready loop**
- `KROKI_ENDPOINT` 環境變數讓 build script 知道要打哪裡

## 🔧 改 markdown parser 攔截 kroki block

我這個部落格的 markdown parser 是 `src/lib/markdown.ts`，純 regex 不走 remark/rehype。**這反而比 unified 那套好接**——一個檔案改完就生效。

兩個關鍵函數：

**1. `buildKrokiUrl()` — 編碼 GET URL**

```typescript
import pako from 'pako';

function encodeKrokiPath(source: string): string {
  const utf8 = new TextEncoder().encode(source);
  const compressed = pako.deflate(utf8, { level: 9 });
  let binary = '';
  for (let i = 0; i < compressed.length; i += 1) {
    binary += String.fromCharCode(compressed[i]);
  }
  const b64 = Buffer.from(compressed).toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_');
}

export function buildKrokiUrl(
  type: string,
  source: string,
  format: 'svg' | 'png' = 'svg',
): string {
  const path = encodeKrokiPath(source);
  return `${KROKI_ENDPOINT}/${type}/${format}/${path}`;
}
```

**Kroki encoding 規格**（[官方規範](https://docs.kroki.io/kroki/setup/encode-diagram/)）：

1. UTF-8 encode
2. zlib deflate（level 9 最高壓縮）
3. base64 encode
4. URL-safe 化（`+` → `-`、`/` → `_`）

**2. `inlineKrokiImages()` — build 時 fetch SVG 寫死**

```typescript
export async function inlineKrokiImages(
  html: string,
  endpoint: string = KROKI_ENDPOINT,
): Promise<string> {
  const figureRe =
    /<figure data-kroki="([^"]+)" data-kroki-source="([^"]+)"><img [^>]*\/><\/figure>/g;

  const matches: Array<{ full: string; type: string; source: string }> = [];
  let m: RegExpExecArray | null;
  while ((m = figureRe.exec(html)) !== null) {
    const source = Buffer.from(m[2], 'base64').toString('utf-8');
    matches.push({ full: m[0], type: m[1], source });
  }

  if (matches.length === 0) return html;

  const results = await Promise.all(
    matches.map(async ({ type, source }) => {
      try {
        const res = await fetch(`${endpoint}/${type}/svg`, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: source,
        });
        if (!res.ok) return { ok: false as const, svg: '' };
        const svg = await res.text();
        return { ok: true as const, svg };
      } catch {
        return { ok: false as const, svg: '' };
      }
    }),
  );

  let result = html;
  matches.forEach((entry, i) => {
    const r = results[i];
    if (!r.ok) return; // fall back to <img>
    const cleanSvg = r.svg
      .replace(/<\?xml[^>]*\?>\s*/g, '')
      .replace(/<!DOCTYPE[^>]*>\s*/g, '');
    result = result.replace(
      entry.full,
      `<figure data-kroki="${entry.type}" data-kroki-inlined="true">${cleanSvg}</figure>`,
    );
  });

  return result;
}
```

**這個函數的設計重點：**

- **並行 fetch**：多張圖同時打，不是 sequential（一篇 5 張圖 sequential 要 50+ 秒）
- **失敗保留 `<img>` fallback**：Kroki 掛了就退回 runtime 抓，不會 break build
- **清掉 XML declaration**：SVG 帶 `<?xml ?>` header 塞進 HTML 會解析錯誤
- **同步 markdown parser 跟 async inline 拆開**：sync 部分純算 URL、不依賴網路；async 部分才打 Kroki

Astro page frontmatter 呼叫：

```typescript:src/pages/blog/[slug].astro
const { html: rawHtml, toc } = renderMarkdown(post.content);
const html = await inlineKrokiImages(rawHtml);
```

## 🐛 踩坑紀錄

### 坑 1：Mermaid 第一次 render 52 秒

剛起 Kroki container 第一次打 mermaid endpoint：

```
Request received POST /mermaid/svg
Convert took 52460ms
```

**原因**：Kroki 主 container 是 JVM、kroki-mermaid 是 Node + Puppeteer。**JVM 冷啟動 + headless Chrome warmup 兩個都要熱身**。第二次只要 11 秒，第三次更快。

**解法**：
- 本機開發 `restart: unless-stopped` + 開機自動拉起，**讓 container 永遠 warm**
- GHA build 每次 cold start 無解，但 GHA 是 background job，多 50 秒沒人在意
- 真的不能忍受可以加一段「build 開始前 dummy 打一個 mermaid request 預熱」

### 坑 2：ARM Mac 跑 amd64 image 超慢

M1/M2 Mac 跑 `yuzutech/kroki`（只有 amd64 image）：

```
ERROR Server error: java.io.InterruptedIOException: Process was forcibly killed
(not responding after TimeValue{duration: 5, timeUnit: SECONDS} seconds)
```

PlantUML 5 秒 timeout 因為 emulation 太慢。**解法**：

- 短期：本機開發只用 mermaid（kroki-mermaid 是 Node-based，效能正常）
- 長期：跑 Linux x86 機器當 build server，或等官方出 ARM image

GHA 跑 `ubuntu-latest`（x86_64）完全沒這問題。

### 坑 3：`Content-Type` 設錯 504

我第一次寫 fetch 用了 `Content-Type: text/plain`，**官方 curl 範例其實是 `application/x-www-form-urlencoded`**（curl `--data-raw` 預設）。

實測發現 **Kroki 兩種都吃**，所以這不是錯誤的根因——但這個迷思讓我繞了一圈才發現 kroki.io 公服務根本就是掛的。

教訓：**API 連不上時先確認對方活著，不要先懷疑自己的 client code**。

### 坑 4：SVG 帶 XML declaration 破 HTML

直接把 Kroki 回的 SVG 塞進 HTML：

```html
<?xml version="1.0" encoding="UTF-8"?>
<svg>...</svg>
```

HTML parser 看到 `<?xml ?>` 會炸。**解法**是 inline 前先清掉：

```typescript
const cleanSvg = r.svg
  .replace(/<\?xml[^>]*\?>\s*/g, '')
  .replace(/<!DOCTYPE[^>]*>\s*/g, '');
```

PlantUML 也會在 SVG 前加 `<?plantuml 1.2026.1?>` 這種 instruction，同樣清掉。

## 💡 心法與成本拆解

<img src="/ai-lecturer-bob/images/blog/kroki-self-host-diagram-pipeline/before-after.svg" alt="改造前後對比：Figma 拖拉流程 vs markdown 直接寫 Mermaid" style="border-radius: 8px; margin: 1rem 0; width: 100%; background: #fff; padding: 16px;" />

### 真正的時間賬

| 項目 | 改造前 | 改造後 |
|------|-------|-------|
| 一張架構圖（簡單）| Figma 3-5 分鐘 | 寫 5 行 Mermaid，30 秒 |
| 改一個節點名稱 | Figma 開檔 + 改 + 匯出，1-2 分鐘 | 改一個字、重 push，git 自動 build |
| 文章 review 時想加圖 | 想到要重開 Figma 就不想加了 | 寫 4 行 markdown，當下加 |
| 圖文版本控制 | 二進位檔，無法 diff | git diff 看得到改了什麼 |

**真正的收益不是「省時間」，是「降低想加圖的心理門檻」**。心理門檻一降，文章圖文比就會自然上升。

### 一次性建置成本

| 步驟 | 時間 |
|------|------|
| 研究 Kroki、決定方案 | ~30 分鐘（聊 + 看 docs） |
| 寫 docker-compose | 5 分鐘 |
| 改 markdown.ts | 30 分鐘 |
| GHA workflow 改 service container | 15 分鐘 |
| 端到端驗證 + 踩坑 | 30 分鐘 |
| **合計** | **~2 小時** |

兩小時換之後**每篇文章 5-10 分鐘**的截圖時間。寫到第 12 篇就回本。

### 換工具的哲學

我前面講過：「**文字才是我擅長的東西，圖只是文字的視覺化結果**」。這套價值觀換成工程實踐就是：

- 能用文字描述的東西，就用文字
- 文字能進 git，圖檔不能（或進了會很醜）
- 文字能 grep、能 LLM 處理、能批次改

**Kroki 不是萬能藥**——複雜的示意圖（畫一個流程加 emoji 加箭頭加標註）還是該開 Figma。但架構圖、流程圖、ER 圖、序列圖這四種 80% 場景，文字搞定。

## ❓ 常見問題

### Kroki 是什麼？跟 Mermaid 比有什麼差別？

Kroki 是統一的圖表渲染 server，**一個 API 包 23+ 種引擎**（Mermaid、PlantUML、D2、DBML 等）。Mermaid 本身只是其中一個引擎，Kroki 是上層平台。如果你只用 Mermaid，GitHub README 內建支援就夠了；要混多種引擎才需要 Kroki。

### 我可以直接用 kroki.io 公服務不自架嗎？

技術上可以，但**公服務沒有 SLA、會掛**。我寫這篇時公服務就掛了好幾小時。如果你的部落格圖片靠 `https://kroki.io/...` URL 抓，**公服務掛你就破圖**。自架（docker run 一行）才穩。

### 自架 Kroki 要多少資源？

最小設定（kroki + kroki-mermaid 兩個 container）佔記憶體 ~500MB-1GB，CPU 閒置時幾乎 0%。一台 1GB 記憶體的 VPS 跑得動。本機開發直接 docker compose，開機自動啟動之後感覺不到它存在。

### 我用 GitHub Pages 部署，build 變慢多少？

GHA service container 起 Kroki 大約 30-60 秒，加上每張 mermaid 第一次 cold start 11 秒。**整體 build 從 25 秒變 ~80 秒**。如果你一週發兩篇文，這個成本可以忽略。

### 踩過最大的坑是什麼？

ARM Mac 跑 amd64 docker image 會讓 PlantUML 5 秒 timeout。**解法是本機開發主用 mermaid（Node-based，沒這問題），GHA build 是 x86_64 沒這問題**。第二大是 Kroki 公服務真的會掛——這直接決定我選自架方案。

## 🔗 延伸資源

- [Kroki 官方網站](https://kroki.io/)
- [Kroki GitHub repo（yuzutech/kroki）](https://github.com/yuzutech/kroki)
- [Kroki Docker 安裝官方文件](https://docs.kroki.io/kroki/setup/use-docker-or-podman/)
- [Kroki diagram encoding 規範](https://docs.kroki.io/kroki/setup/encode-diagram/)
- [本站相關文章：Astro SSG 從 React 遷移踩坑](/ai-lecturer-bob/blog/blog-create-skill-overview/)
- [pako（zlib deflate JS 實作）](https://github.com/nodeca/pako)
