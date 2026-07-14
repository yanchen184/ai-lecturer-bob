/**
 * llms.txt — AEO(Answer Engine Optimization)入口檔,`/llms.txt`。
 * 讓 ChatGPT / Perplexity / Claude 等 AI 引擎快速理解站點定位與文章清單。
 * 規格:https://llmstxt.org/ — H1 + blockquote 摘要 + 分區連結清單。
 * build 時從 Firestore 生成,與 rss.xml.ts 同資料源。
 */
import type { APIContext } from 'astro';
import { getAllPublishedPosts, type BlogPost } from '../lib/firestore';
import { withBase } from '../lib/url';

export async function GET(context: APIContext): Promise<Response> {
  const posts = await getAllPublishedPosts();
  const site = (context.site?.toString() ?? 'https://yanchen.app/').replace(/\/$/, '');
  const url = (post: BlogPost) => `${site}${withBase(`/blog/${post.slug}`)}`;

  const byCategory = new Map<string, BlogPost[]>();
  for (const post of posts) {
    const list = byCategory.get(post.category) ?? [];
    list.push(post);
    byCategory.set(post.category, list);
  }

  const sections = [...byCategory.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .map(([category, list]) => {
      const items = list
        .map((post) => `- [${post.title}](${url(post)}): ${post.excerpt}`)
        .join('\n');
      return `## ${category}\n\n${items}`;
    })
    .join('\n\n');

  const body = `# AI 講師陳彥彤YC — 部落格

> 繁體中文的 AI 工程實戰筆記。主題涵蓋 Claude Code / AI agent 工作流、Kubernetes 教學系列、Spring Boot 與前後端開發踩坑紀錄。所有文章皆為第一手實測,附可重現步驟。

作者:陳彥彤(YC),職訓局講師 + 全端開發者。

- [首頁](${site}${withBase('/')})
- [文章列表](${site}${withBase('/blog')})
- [RSS](${site}${withBase('/rss.xml')})

${sections}
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
