/**
 * 文章系列（series）定義。
 *
 * Single source of truth：列表頁的「閱讀系列」區塊照這個檔案產
 * 出。新系列加一筆即可，不需要動 Firestore schema。
 *
 * 比對策略：給每個系列一個 matcher（tag 或 slug prefix），build 時
 * 從 posts 撈出符合條件的文章、依 order 或 publishDate 排序。
 */
import type { BlogPost } from './firestore';

interface SeriesMeta {
  /** 短代號，URL/anchor 用 */
  key: string;
  /** 顯示名稱 */
  label: string;
  /** 系列一句話介紹（顯示在展開區頂部） */
  description: string;
  /**
   * 比對策略：
   * - byTag：post.tags 包含某 tag
   * - bySlugPrefix：post.slug 開頭符合
   */
  match:
    | { type: 'byTag'; tag: string }
    | { type: 'bySlugPrefix'; prefix: string };
  /**
   * 排序策略：
   * - 'order'：手動指定（用 slugOrder 陣列）
   * - 'date-asc'：按 publishDate 由舊到新（系列導讀通常用這個，因為要從第一篇開始讀）
   * - 'date-desc'：由新到舊
   */
  sort: 'order' | 'date-asc' | 'date-desc';
  /** sort='order' 時的明確順序 */
  slugOrder?: string[];
  /** 強調色（hex 或 css 變數），預設用主題黃 */
  accent?: string;
}

/**
 * 已定義的系列。
 *
 * 順序 = 列表頁顯示順序。新系列要露出就加在這。
 */
const seriesList: SeriesMeta[] = [
  {
    key: 'hermes',
    label: 'Hermes Agent 入門',
    description:
      'NousResearch 開源的 OpenAI-compatible CLI agent。從「為什麼要用」到 macOS 安裝、學術用法、Sandbox 安全、接內網 LLM。',
    match: { type: 'byTag', tag: 'Hermes Agent' },
    sort: 'order',
    slugOrder: [
      'hermes-agent-intro',
      'hermes-agent-quickstart',
      'hermes-agent-mac-install',
      'hermes-agent-sandbox',
      'hermes-agent-academic',
    ],
  },
  {
    key: 'claude-code-class',
    label: 'Claude Code 初階班(Pro 版)',
    description:
      '專為 Claude Pro 訂閱者($20/月)寫的四堂實戰課:Spec 思維與資安、CLAUDE.md 馴服、Skill/Agent/Loop 自動化、Plugin/MCP/GitHub 接生態系。',
    match: { type: 'byTag', tag: '初階班系列' },
    sort: 'order',
    slugOrder: [
      'claude-code-lesson-1',
      'claude-code-lesson-2',
      'claude-code-lesson-3',
      'claude-code-lesson-4',
    ],
  },
  {
    key: 'claude-code',
    label: 'Claude Code 全系列',
    description:
      'Anthropic 的官方 CLI agent。Plugin、Hook、Remote Control、Skill、Ralph Loop... 25+ 篇實戰筆記。',
    match: { type: 'byTag', tag: 'Claude Code' },
    sort: 'date-desc',
  },
];

export interface SeriesGroup {
  meta: SeriesMeta;
  posts: BlogPost[];
}

/**
 * 從所有 posts 中產出系列分組。
 *
 * 邏輯：對每個 SeriesMeta 跑 matcher、過濾出符合的文章、排序。
 * 找不到任何文章的系列會被跳過（避免空塊）。
 */
export function buildSeriesGroups(posts: BlogPost[]): SeriesGroup[] {
  return seriesList
    .map((meta) => {
      const matched = posts.filter((p) => {
        if (meta.match.type === 'byTag') {
          return p.tags.includes(meta.match.tag);
        }
        return p.slug.startsWith(meta.match.prefix);
      });

      let sorted: BlogPost[];
      if (meta.sort === 'order' && meta.slugOrder) {
        const orderMap = new Map(meta.slugOrder.map((s, i) => [s, i]));
        sorted = matched
          .filter((p) => orderMap.has(p.slug))
          .sort(
            (a, b) =>
              (orderMap.get(a.slug) ?? 999) - (orderMap.get(b.slug) ?? 999),
          );
      } else if (meta.sort === 'date-asc') {
        sorted = [...matched].sort((a, b) =>
          a.publishDate.localeCompare(b.publishDate),
        );
      } else {
        sorted = [...matched].sort((a, b) =>
          b.publishDate.localeCompare(a.publishDate),
        );
      }

      return { meta, posts: sorted };
    })
    .filter((g) => g.posts.length > 0);
}
