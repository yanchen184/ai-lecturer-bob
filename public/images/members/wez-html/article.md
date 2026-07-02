# wez-html:一行指令把任何前端推上內網,拿到一個常駐網址

推一個 demo 給同事看,以前我要做五件事:rsync 推檔到內網某台機器、ssh 進去找個沒被佔的 port、起 `python -m http.server`、把 URL 貼群組、然後兩個月後忘記清,垃圾留在機器上長灰塵。

五件事裡真正有價值的只有第四件——「同事拿到一個能點的網址」。其他四件都是雜務。

所以我寫了 `wez-html`:一句 CLI 把資料夾推上內網,回一個常駐 URL,結束。

```bash
$ wez_upload_html ./frontend yc
✅ http://your-server:8090/frontend/  · uploader=yc  size=39.0K
```

這篇拆解它怎麼做到、我為什麼選 Go single binary + 純檔案儲存這種「無資料庫」路線、KV store 怎麼讓純靜態頁也能存資料,以及一個我踩到自己坑的 TTL 故事。專案是 MIT,repo 在 [github.com/yanchen184/wez-html](https://github.com/yanchen184/wez-html),想自架的可以直接拿去用。

## 這東西解決的是「demo 部署」不是「網站託管」

先講清楚定位,免得用錯。

`wez-html` 只服務一種情境:**信任環境(公司 LAN / VPN)裡,快速把靜態內容變成一個可分享的網址**。內網 demo、PoC、個人賽作品、臨時 landing page、投影片——這些丟上去幾秒就好。

它不是拿來做對外 production 站的。沒有 HTTPS(要對外請用 nginx / Caddy 反代)、身份制但不驗證(下面會講)、也沒有關聯式資料庫。想清楚這條界線,它就很好用;拿它當正式主機,會踩到每一個「限制」段列的雷。

| 適合 | 不適合 |
|---|---|
| 內網 demo / PoC / 個人賽作品 | 對外 production 站 |
| 臨時 landing page、靜態投影片 | 需要長期穩定對外 URL |
| 純靜態檔 + 輕量 CRUD | 關聯式 query、複雜 schema |
| VPN / 辦公室 LAN 信任環境 | 公網開放 |

## 我實際跑一次:build → 部署 → 讀回

repo clone 下來,一行 `make build` 出兩個 binary(CLI + server),我本機起 server 實測整條路走得通。

```bash
make build       # 出 bin/wez_upload_html + bin/wez-html-server
./bin/wez-html-server --listen 127.0.0.1:8091 --root /tmp/wez-test --public-url http://127.0.0.1:8091 &
```

另開一個 terminal,把一個資料夾推上去:

```bash
$ echo '<h1>hi from wez-html</h1>' > /tmp/demo-site/index.html
$ ./bin/wez_upload_html /tmp/demo-site bob --server http://127.0.0.1:8091

✅ 上傳完成
   URL:        http://127.0.0.1:8091/demo-site/
   Uploader:   bob
   Size:       26 B / 1 files
```

`curl` 回來的就是我推上去的內容,不是「build 成功」的假訊號:

```bash
$ curl -s http://127.0.0.1:8091/demo-site/
<h1>hi from wez-html</h1>
```

從打指令到網址能點,沒有第二步。

![wez-html Web 管理介面:站台列表、上傳者、線上天數與一鍵刪除](/images/members/wez-html/web-ui.png)

## 設計決策:為什麼是「Go single binary + 純檔案」

寫這種小工具最容易犯的錯,是照著大專案的架構抄:塞一個資料庫、包一層 ORM、再拉個 Redis 做 cache。對一個內網 demo 平台,這些全是負債。

我選了相反的方向:

- **Go single binary。** server 跟 CLI 各編一支,沒有 runtime 依賴,`scp` 上去配一個 systemd unit 就跑。要換機器就換一個檔,不用管 Node 版本、不用 `pip install`、不用開 port 給資料庫。
- **純檔案儲存。** 每個站台就是 `/var/lib/wez-html/<site>/` 底下一坨檔,旁邊一個 `.meta.json` 記元資料。備份就是 `tar`,搬遷就是 `rsync`,出事直接進資料夾看,沒有一層資料庫擋在中間。
- **Web UI 用 `embed.FS` 內嵌。** 管理介面的 HTML 直接編進 binary,不用另外部署前端。single binary 名副其實,一個檔就是全部。

`.meta.json` 長這樣,我實測部署後直接讀出來:

```json
{
  "site": "demo-site",
  "uploader": "bob",
  "uploaded_at": "2026-07-02T14:50:46+08:00",
  "src_path": "/tmp/demo-site",
  "size_bytes": 26,
  "files": 1
}
```

`uploader` 這個欄位是刻意的——它做**身份追溯,但不驗證**。上傳時填個 identity,之後只有同一個 identity 能刪這個站。內網信任模型下,這一層剛好夠:同事不會故意刪你的站,但誰推的、多久了、原始路徑在哪,全查得到。真要做認證是另一個量級的工程,對這個情境是過度設計。

## KV store:讓純靜態頁也能存資料

純靜態站有個天花板:存不了狀態。一個記分板、一個投票、一個留言板,只要「重整後資料還在」就得有後端。

所以每個站台我都附一份輕量 JSON key-value store,四個 REST endpoint:

```text
GET    /<site>/api/kv           # 列出所有 key
GET    /<site>/api/kv/<key>     # 讀一個 key
PUT    /<site>/api/kv/<key>     # 寫(body 必須是合法 JSON)
DELETE /<site>/api/kv/<key>     # 刪
```

前端幾行就能用,不用自己架後端:

```js
const KV = '/' + location.pathname.split('/')[1] + '/api/kv';

await fetch(KV + '/score-1', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ player: 'Alice', score: 42 }),
});

const data = await (await fetch(KV + '/score-1')).json();
```

我實測 PUT 進去再 GET 回來,原封不動:

```bash
$ curl -X PUT .../demo-site/api/kv/score-1 -d '{"player":"Alice","score":42}'
{"key":"score-1","size_bytes":29,"status":"ok"}
$ curl .../demo-site/api/kv/score-1
{"player":"Alice","score":42}
```

限制我寫死在 code 裡,不是文件講講而已:單一 value ≤ 256 KB、一站 ≤ 1000 keys / 10 MB 總量。這是「demo 等級資料」的刻意上限——它防的是有人拿它當正式資料庫,不是效能不夠。同一站台的人都讀寫得到、沒有 transaction、沒有 query,這幾條界線要記牢。

`examples/scoreboard/` 是一頁把 KV CRUD 全用上的完整記分板,推上去就是一個能玩的 demo。

![scoreboard 記分板 demo:一頁靜態 HTML 用 KV store 做完整增刪改查](/images/members/wez-html/scoreboard-demo.png)

## 踩到自己坑:TTL 欄位還在寫,但 sweeper 已經停用

這是我覺得最值得寫的一段,因為它是「規劃跟現實對不上」的活標本。

最初設計是站台有 TTL,過期自動被 reaper(背景 sweeper)清掉——符合「demo 用完就該消失」的直覺。但實際用下來發現不對:demo 常常「臨時」變成半長期參考,自動清掉反而讓人罵。於是我把行為改成**永久常駐、不自動下架**,要刪自己刪。

問題是,我改的是「行為」,沒把「痕跡」清乾淨。我本機實測部署,`.meta.json` 裡照樣寫著 `ttl_days: 30`、`expires_at`,CLI 輸出也還印「到期:2026-08-01」——但 reaper 其實已經停用,那個日期永遠不會生效。binary 裡 `internal/reaper/` 整包還留著,`meta` 還有 `Expired()` / `DaysLeft()` 這些沒人呼叫的方法。

這不是 bug,站台不會真的被清。但它是一個很典型的坑:**改需求時只改了主流程,留下一堆「還在跑但沒有意義」的殘留欄位和死碼**。使用者看到「到期日」會困惑,下一個接手的人看到 `reaper/` 會以為它還在運作。教訓很直接——砍功能要連著它的輸出、欄位、死碼一起砍,不然這些殘留會變成下一個人的考古題。

## 三種入口,挑順手的用

同一個後端,三個進去的方式:

1. **CLI**——`wez_upload_html ./folder yc`,推資料夾或單一 HTML。加 PATH 後全域可用。
2. **Web UI**——開 `http://your-server:8090/`,拖檔進去、填 identity、送出。不碰 terminal 的同事走這條。
3. **Claude Code plugin**——`/wez:upload-html`,除了推現成檔,還能「一句中文需求,Claude 直接寫整頁含 KV 整合的 HTML 再推上去」。這個入口把「我想要一個問卷畫圓餅圖的頁」直接變成一個線上網址,中間的寫 code 跟部署都不用自己動手。

## 限制,先看清楚再用

- **不支援 HTTPS。** 對外一定要 nginx / Caddy 反代,別直接曝到公網。
- **identity 不驗證。** 別人知道你的 identity 就能刪你的站——這是內網信任模型的取捨,換來零認證成本。
- **檔案上限**:單檔 ≤ 50 MB、單站 ≤ 500 MB、共 ≤ 10,000 檔(在 `internal/archive/archive.go` 可改)。
- **KV 不是資料庫**:沒 transaction、沒 query、沒跨站認證。

這些不是「還沒做」,是刻意的邊界。它們定義了 wez-html 是什麼:一個把「內網分享靜態內容」壓到極簡的工具,不多也不少。

## 想自己架

repo 是 MIT,`make build` 出 binary,`make deploy` 配好 SSH 跟 sudo 就能推到你自己的內網機器。要接 Claude Code plugin 走 [wezoomtek-claude-code-plugin](https://github.com/yanchen184/wezoomtek-claude-code-plugin)。

如果你手上也有那種「推個 demo 卻要搞半天」的痛,這個工具就是為那個痛寫的。
