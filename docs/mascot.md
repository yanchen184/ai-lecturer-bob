# 部落格吉祥物角色規範

部落格封面裡那隻白髮、芥末黃圍巾的 chibi 小人。畫封面時把設定圖當參考圖餵給生圖模型，並引用本檔的固定提示詞。

- 設定圖：`public/images/mascot/character-sheet.png`（線上 `https://yanchen.app/images/mascot/character-sheet.png`）
- 無標註原圖（餵模型用）：`public/images/mascot/character-sheet-raw.png`
- 特徵來源：2026-10-25 盤點 `public/images/blog/*/cover.png` 共 52 張，45 張有此角色，取多數一致的特徵。

## 跟首頁大頭照的關係

| | 部落格吉祥物（本檔） | 首頁大頭照 `public/images/character/` |
|---|---|---|
| 用途 | 部落格封面、文內插圖 | 首頁 Hero／About |
| 比例 | 約 2.5 頭身 chibi | 正常比例青年 |
| 圍巾 | 芥末黃針織 | 棕色 |
| 衣服 | 米白毛衣、炭灰褲、深棕短靴 | 白外套、棕色星星 T 恤、白褲 |

兩套是不同的圖，封面不要拿首頁大頭照當參考圖。

## 固定特徵

| 部位 | 規格 |
|---|---|
| 比例 | 約 2.5 頭身，頭大身小 |
| 頭髮 | 蓬亂白／銀髮，頭頂翹起一兩撮，瀏海蓋額頭；正面耳朵被頭髮蓋住，側面露一點耳朵 |
| 臉 | 圓形實心黑豆眼帶一個白色反光點，兩頰粉紅腮紅，小嘴 |
| 圍巾 | 芥末黃粗針織羅紋圍巾，在脖子繞一圈，一端垂在胸前，兩端有短流蘇 |
| 上衣 | 寬鬆米白針織毛衣，袖子到手腕 |
| 褲子 | 炭灰色長褲，褲管反摺 |
| 鞋 | 深棕色綁帶短靴 |
| 手臂 | 從肩膀接出，每隻手臂接一隻手；圍巾只在脖子上，跟手臂分開 |
| 線條 | 墨黑手繪筆線，淡平塗上色 |

## 色票

| 用途 | 色碼 |
|---|---|
| 圍巾芥末黃 | `#FAC32A` |
| 毛衣米白 | `#F2EBDC` |
| 褲子炭灰 | `#352E29` |
| 靴子深棕 | `#483526` |
| 線條墨黑 | `#0A0A0A` |
| 紙底 | `#FAFAF7` |

圍巾、毛衣、褲子、靴子四色取自 `character-sheet-raw.png` 該部位的像素中位數；線條與紙底照 `cover-base-prompt.txt`。圍巾黃跟封面強調色 `#F5D547` 是兩個顏色：封面強調色照 `#F5D547`，圍巾照 `#FAC32A`。

## 個性與動作

好奇、愛動手的工程學徒。在封面裡一定在跟主題互動：指著節點、推拉桿、拿放大鏡檢查、搬箱子、拉線。不當角落裡的作者頭像。

表情集：專注、開心、驚訝（帶汗滴）、擔心、下定決心、得意（閉眼笑）。

## 不可以

- 畫成正常比例的動漫少年，或換成棕色圍巾、星星 T 恤
- 穿深色外套、黃色外套、戴帽子、戴眼鏡
- 手臂從圍巾長出來，或拿東西的手沒有握住物件
- 加第二個角色
- 圖裡出現文字、字母、數字

## 固定提示詞（英文，原文貼進生圖 prompt）

```text
Mascot (KEEP FIXED every time, match the attached character sheet exactly): one small
chibi character, about 2.5 heads tall, drawn in the same hand-drawn ink line style.
Messy fluffy white / silver hair with one or two strands sticking up, bangs over the
forehead. Big round solid black dot eyes with a tiny white
highlight, pink blush on both cheeks, tiny mouth. A chunky ribbed mustard-yellow
(#FAC32A) knitted scarf wrapped once around the neck, one end hanging down the chest,
short fringe at both ends. Oversized cream (#F2EBDC) knit sweater, charcoal (#352E29)
trousers with rolled cuffs, dark brown (#483526) short boots. Each arm starts at the
shoulder and ends in one small hand; the scarf stays around the neck and never becomes
an arm. Every held object is gripped by a hand. No jacket, no hat, no glasses, no
realistic anime-teen proportions, no brown scarf.
```

## 怎麼用

1. 生封面時把 `character-sheet-raw.png` 當參考圖附上（Codex CLI：`codex exec -i <path>`）。
2. prompt 用 `~/.claude/skills/blog-create/gen-cover.sh --print "<subject>"` 產生，裡面的 Mascot 段落就是上面的固定提示詞。
3. 生完照 `~/.claude/skills/blog-create/references/visuals.md` 的 checklist 裁切放大檢查角色。
