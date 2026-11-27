# seo/

每日 SEO 候選分析與變更紀錄。

| 檔案 | 內容 |
|---|---|
| `optimization-log.json` | 每筆改動：日期、頁面、before→after、目標查詢、改前 28 天基準、14 天回看日 `reviewDate`、`result` |
| `candidates/<日期>.json` | `scripts/seo-daily.mjs` 輸出（不進版控） |

## 執行

```bash
node scripts/seo-daily.mjs            # 有 GSC_CLIENT_ID / GSC_CLIENT_SECRET / GSC_REFRESH_TOKEN 走 GSC API，否則讀 public/gsc-daily
node scripts/seo-daily.mjs --no-crawl # 不爬站（c 類內鏈分析略過）
```

候選分類：a 排名 5–20、b 有曝光零點擊、c 內鏈不足、d 查詢落在非文章頁或排名 >30、e 技術問題。
`optimization-log.json` 裡 `reviewDate` 未到的頁面標 `observingUntil`；到期且 `result` 為空的列在 `dueReviews`。
