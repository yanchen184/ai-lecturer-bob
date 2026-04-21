/**
 * RSS 2.0 feed — `/rss.xml`。
 * 使用 @astrojs/rss 產生器，build 時生成。
 */
import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getAllPublishedPosts } from '../lib/firestore';
import { withBase } from '../lib/url';

export async function GET(context: APIContext): Promise<Response> {
  const posts = await getAllPublishedPosts();
  const site = context.site?.toString() ?? 'http://localhost:4321/';

  return rss({
    title: 'AI 講師陳彥彤YC — 部落格',
    description:
      '後端工程師的技術筆記。Spring Boot、React、MySQL、Redis 實戰踩坑紀錄。',
    site,
    items: posts.map((post) => ({
      title: post.title,
      description: post.excerpt,
      link: withBase(`/blog/${post.slug}`),
      pubDate: new Date(post.publishDate),
      categories: [post.category, ...post.tags],
      author: post.author,
    })),
    customData: '<language>zh-Hant</language>',
  });
}
