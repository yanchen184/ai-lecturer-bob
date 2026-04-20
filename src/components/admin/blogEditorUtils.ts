/**
 * AdminBlogEditor 用到的純函數工具
 * 抽出來方便測試、也避免主元件太臃腫。
 */

/**
 * 從 title 產生 slug
 * - 小寫
 * - 空白與底線轉連字號
 * - 保留中英文、數字、連字號
 * - 壓縮連續連字號
 */
export const slugifyTitle = (title: string): string => {
  return title
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\p{L}\p{N}-]/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * 粗估閱讀時間（分鐘），以中文字 + 英文字詞合計除以 200 計算
 * 字數過少時至少 1 分鐘
 */
export const estimateReadingTime = (content: string): number => {
  const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) ?? []).length
  const englishWords = (content.match(/[a-zA-Z]+/g) ?? []).length
  const total = chineseChars + englishWords
  return Math.max(1, Math.round(total / 200))
}

/**
 * 把逗號分隔的字串拆成 tag array，去空白並過濾空值
 */
export const parseTagsInput = (raw: string): string[] => {
  return raw
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
}

/** 今天的 YYYY-MM-DD 字串 */
export const todayISODate = (): string => {
  return new Date().toISOString().slice(0, 10)
}
