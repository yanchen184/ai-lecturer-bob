# ai-lecturer-bob — 專案規範

> 部落格 / daily 內容站(Astro + Firestore + GitHub Pages)。
> 全域規範走 `~/.claude/CLAUDE.md`,本檔只放這個 repo 專屬的事。

## commit / push 授權:寫完驗過直接推,不准問(2026-06-20 立)

**這個 repo 的 commit + 一般 push 從業務層降為實作層**。寫完、驗過(typecheck / test / build / round-trip 該綠的綠了)就直接 `git add && git commit && git push`,**一個字都不要問**。不准再丟「要不要 commit」「要我推嗎」「push 嗎」這類問題 —— Bob 已書面授權,再問 = 把判斷成本推回給他。

- **適用**:這個 repo 的 commit、push 到 `origin master`(預設分支)。
- **仍要問的**(不在授權內,照全域業務層):`force push`、改歷史、刪 branch、push 到非預設 remote/branch、跨環境同步。
- **授權的是「不用問」,不是「不用驗」**:push 前該綠的還是要真的跑綠,不准拿授權當跳過驗收的藉口。
- push 後若被 non-fast-forward 擋,先 `git fetch` + `rebase origin/master` 再 push(daily cron 常自動 commit GSC 資料,會分叉),這也不用問。
