/**
 * Giscus 留言設定（GitHub Discussions 後端）。
 *
 * repoId / categoryId 在 GitHub Discussions 開啟 + 裝好 giscus app 後，
 * 到 https://giscus.app 填 repo 取得。填進來留言區才會渲染（空字串時整段不顯示）。
 *
 * 這支是公開設定（repoId / categoryId 本就會出現在前端 HTML，非機密）。
 */
export const GISCUS = {
  /** owner/repo */
  repo: 'yanchen184/ai-lecturer-bob' as const,
  /** giscus.app 給的 data-repo-id（R_kg... 開頭），開好 Discussions 後填入 */
  repoId: '',
  /** Discussions 分類名稱，建議用 "Announcements"（只有維護者能開新討論，避免灌水） */
  category: 'Announcements' as const,
  /** giscus.app 給的 data-category-id（DIC_kw... 開頭） */
  categoryId: '',
  /** 每個 pathname 對應一個 discussion */
  mapping: 'pathname' as const,
  /** 主題：跟著系統明暗，可改 'light' / 'dark' / 'noborder_light' 等 */
  theme: 'light' as const,
  /** 介面語言 */
  lang: 'zh-TW' as const,
};
