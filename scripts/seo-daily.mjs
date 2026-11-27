#!/usr/bin/env node
/**
 * seo-daily.mjs — 產出 yanchen.app 的「SEO 候選優化清單」。
 *
 * 資料來源：
 *   - GSC 28 天 query×page：有 GSC_CLIENT_ID / GSC_CLIENT_SECRET / GSC_REFRESH_TOKEN 時直接打
 *     Search Console API；沒有時改用 public/gsc-daily/*.json 最近 28 個檔加總（每日只存前 50 列，較不完整）。
 *   - 站上 HTML：抓 sitemap 內所有頁面，算內鏈、canonical、JSON-LD。
 *   - seo/optimization-log.json：已改過的頁面，14 天觀察期內不再列為候選，並列出到期待回看的項目。
 *
 * 用法：node scripts/seo-daily.mjs [--out <path>] [--no-crawl]
 *   預設輸出 seo/candidates/<今天>.json（已 gitignore）。
 */
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://yanchen.app';
const GSC_SITE = 'sc-domain:yanchen.app';
const GSC_DAILY_DIR = path.join(REPO, 'public', 'gsc-daily');
const LOG_PATH = path.join(REPO, 'seo', 'optimization-log.json');
const WINDOW_DAYS = 28;
const GSC_LAG_DAYS = 3;
const OBSERVE_DAYS = 14;
const CRAWL_CONCURRENCY = 6;
const FETCH_TIMEOUT_MS = 20000;

const args = process.argv.slice(2);
const argValue = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' });
const outPath = path.resolve(argValue('--out') ?? path.join(REPO, 'seo', 'candidates', `${today}.json`));
const doCrawl = !args.includes('--no-crawl');

const addDays = (ymd, n) => {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const round = (n, digits = 1) => Math.round(n * 10 ** digits) / 10 ** digits;

async function fetchWithTimeout(url, init = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** 只保留 yanchen.app 根網域的路徑；fb.yanchen.app 等子網域回 null。 */
function toSitePath(page) {
  if (page.startsWith('/')) return page;
  try {
    const u = new URL(page);
    return u.hostname === 'yanchen.app' ? u.pathname : null;
  } catch {
    return null;
  }
}

// ---------- GSC ----------

async function gscAccessToken() {
  const { GSC_CLIENT_ID, GSC_CLIENT_SECRET, GSC_REFRESH_TOKEN } = process.env;
  if (!GSC_CLIENT_ID || !GSC_CLIENT_SECRET || !GSC_REFRESH_TOKEN) return null;
  const res = await fetchWithTimeout('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GSC_CLIENT_ID,
      client_secret: GSC_CLIENT_SECRET,
      refresh_token: GSC_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) throw new Error(`GSC token HTTP ${res.status}`);
  const data = await res.json();
  if (!data.access_token) throw new Error('GSC token 回應沒有 access_token');
  return data.access_token;
}

async function gscQuery(token, body) {
  const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(GSC_SITE)}/searchAnalytics/query`;
  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`GSC query HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return (await res.json()).rows ?? [];
}

const toMetric = (r) => ({
  impressions: r.impressions,
  clicks: r.clicks,
  ctr: round((r.clicks / Math.max(r.impressions, 1)) * 100, 2),
  position: round(r.position, 1),
});

async function loadFromApi(token, startDate, endDate) {
  const base = { startDate, endDate, rowLimit: 1000 };
  const [qp, pages] = await Promise.all([
    gscQuery(token, { ...base, dimensions: ['query', 'page'] }),
    gscQuery(token, { ...base, dimensions: ['page'] }),
  ]);
  return {
    queryPages: qp.map((r) => ({ query: r.keys[0], page: r.keys[1], ...toMetric(r) })),
    pages: pages.map((r) => ({ page: r.keys[0], ...toMetric(r) })),
  };
}

/** 每日檔加總；position 以曝光加權平均（近似值）。 */
async function loadFromDailyFiles(startDate, endDate) {
  const files = (await readdir(GSC_DAILY_DIR))
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .filter((f) => f.slice(0, 10) >= startDate && f.slice(0, 10) <= endDate);
  const qpMap = new Map();
  const pageMap = new Map();
  const add = (map, key, base, r) => {
    const cur = map.get(key) ?? { ...base, impressions: 0, clicks: 0, posSum: 0 };
    cur.impressions += r.impressions;
    cur.clicks += r.clicks;
    cur.posSum += r.position * r.impressions;
    map.set(key, cur);
  };
  for (const f of files) {
    const day = JSON.parse(await readFile(path.join(GSC_DAILY_DIR, f), 'utf8'));
    for (const r of day.queries ?? []) add(qpMap, `${r.query}\u0000${r.page}`, { query: r.query, page: r.page }, r);
    for (const r of day.pages ?? []) add(pageMap, r.page, { page: r.page }, r);
  }
  const finish = ({ posSum, ...r }) => ({ ...r, ...toMetric({ ...r, position: posSum / Math.max(r.impressions, 1) }) });
  return { queryPages: [...qpMap.values()].map(finish), pages: [...pageMap.values()].map(finish), files: files.length };
}

// ---------- 站上 HTML ----------

async function sitemapPaths() {
  const index = await (await fetchWithTimeout(`${SITE}/sitemap-index.xml`)).text();
  const sitemaps = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const paths = [];
  for (const sm of sitemaps) {
    const xml = await (await fetchWithTimeout(sm)).text();
    for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      const p = toSitePath(m[1]);
      if (p) paths.push(p);
    }
  }
  return [...new Set(paths)];
}

function parsePage(html) {
  const pick = (re) => html.match(re)?.[1]?.trim() ?? null;
  const links = new Set();
  for (const m of html.matchAll(/<a\s[^>]*href="([^"#?]+)/g)) {
    const p = toSitePath(m[1].startsWith('/') ? m[1] : m[1].startsWith('http') ? m[1] : `/${m[1]}`);
    if (p) links.add(p.endsWith('/') ? p : `${p}/`);
  }
  return {
    title: pick(/<title>([^<]*)<\/title>/),
    h1: pick(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.replace(/<[^>]+>/g, '').trim() ?? null,
    canonical: pick(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/) ?? pick(/<link[^>]+href="([^"]+)"[^>]+rel="canonical"/),
    description: pick(/<meta[^>]+name="description"[^>]+content="([^"]*)"/),
    jsonLdTypes: [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)].flatMap((m) => {
      try {
        const j = JSON.parse(m[1]);
        return (Array.isArray(j) ? j : j['@graph'] ?? [j]).map((x) => x['@type']).flat();
      } catch {
        return ['(invalid JSON-LD)'];
      }
    }),
    links: [...links],
  };
}

async function crawl(paths) {
  const result = new Map();
  let i = 0;
  const worker = async () => {
    while (i < paths.length) {
      const p = paths[i++];
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const res = await fetchWithTimeout(`${SITE}${p}`);
          result.set(p, res.ok ? { status: res.status, ...parsePage(await res.text()) } : { status: res.status });
          if (res.status < 500) break;
        } catch (e) {
          result.set(p, { status: 0, error: String(e.message ?? e) });
        }
      }
    }
  };
  await Promise.all(Array.from({ length: CRAWL_CONCURRENCY }, worker));
  return result;
}

// ---------- 分類 ----------

const NON_ARTICLE_PREFIXES = ['/blog/topics/', '/blog/tags/', '/blog/tag/', '/blog/page/', '/blog/category/'];
const isArticle = (p) =>
  /^\/blog\/(k8s\/)?[^/]+\/$/.test(p) && p !== '/blog/k8s/' && !NON_ARTICLE_PREFIXES.some((x) => p.startsWith(x));

function underObservation(log, sitePath) {
  return log.find((e) => e.page === sitePath && e.reviewDate >= today);
}

function classify({ queryPages, pages }, pageData, log) {
  const qp = queryPages
    .map((r) => ({ ...r, page: toSitePath(r.page) }))
    .filter((r) => r.page);
  const pg = pages.map((r) => ({ ...r, page: toSitePath(r.page) })).filter((r) => r.page);
  const tag = (r) => {
    const obs = underObservation(log, r.page);
    return obs ? { ...r, observingUntil: obs.reviewDate } : r;
  };

  const a = qp
    .filter((r) => r.position >= 5 && r.position <= 20 && r.impressions > 0)
    .sort((x, y) => y.impressions - x.impressions || x.position - y.position)
    .map(tag);

  const b = pg
    .filter((r) => r.impressions > 0 && r.clicks === 0)
    .sort((x, y) => y.impressions - x.impressions)
    .map((r) => tag({ ...r, topQueries: qp.filter((q) => q.page === r.page).sort((x, y) => y.impressions - x.impressions).slice(0, 3).map((q) => q.query) }));

  const inbound = new Map();
  for (const [from, d] of pageData) {
    for (const to of d.links ?? []) {
      if (to === from) continue;
      inbound.set(to, (inbound.get(to) ?? new Set()).add(from));
    }
  }
  const home = pageData.get('/');
  const homeLinks = new Set(home?.links ?? []);
  const potential = pg.filter((r) => isArticle(r.page) && r.impressions > 0).sort((x, y) => y.impressions - x.impressions);
  const k8sPages = [...pageData.keys()].filter((p) => p.startsWith('/blog/k8s/') && p !== '/blog/k8s/');
  const c = pageData.size === 0 ? { skipped: '未抓站上 HTML（--no-crawl）', homeMissingLinks: [], weakInbound: [], k8sSeries: [] } : {
    homeMissingLinks: potential.filter((r) => !homeLinks.has(r.page)).slice(0, 10).map((r) => ({ page: r.page, impressions: r.impressions, position: r.position })),
    weakInbound: potential
      .map((r) => ({ page: r.page, impressions: r.impressions, inboundCount: inbound.get(r.page)?.size ?? 0 }))
      .filter((r) => r.inboundCount < 3),
    k8sSeries: k8sPages
      .map((p) => {
        const outK8s = (pageData.get(p)?.links ?? []).filter((l) => l.startsWith('/blog/k8s/') && l !== p && l !== '/blog/k8s/');
        return { page: p, k8sOutLinks: outK8s.length, k8sInbound: [...(inbound.get(p) ?? [])].filter((f) => f.startsWith('/blog/k8s/')).length };
      })
      .filter((r) => r.k8sOutLinks < 2 || r.k8sInbound < 2),
  };

  // d. 有需求但沒有對應文章：落在非文章頁，或文章排名 > 30 的 query。
  const byQuery = new Map();
  for (const r of qp) {
    const cur = byQuery.get(r.query) ?? { query: r.query, impressions: 0, clicks: 0, bestPosition: Infinity, pages: [] };
    cur.impressions += r.impressions;
    cur.clicks += r.clicks;
    cur.bestPosition = Math.min(cur.bestPosition, r.position);
    cur.pages.push(r.page);
    byQuery.set(r.query, cur);
  }
  const d = [...byQuery.values()]
    .filter((q) => !q.pages.some(isArticle) || q.bestPosition > 30)
    .sort((x, y) => y.impressions - x.impressions);

  const e = [];
  for (const [p, data] of pageData) {
    if (data.status !== 200) {
      e.push({ page: p, issue: `HTTP ${data.status}${data.error ? ` ${data.error}` : ''}` });
      continue;
    }
    const expected = `${SITE}${p}`;
    if (!data.canonical) e.push({ page: p, issue: 'canonical 缺少' });
    else if (data.canonical !== expected) e.push({ page: p, issue: `canonical 不一致：${data.canonical}` });
    if (!data.h1) e.push({ page: p, issue: 'H1 缺少' });
    if (!data.description) e.push({ page: p, issue: 'meta description 缺少' });
    if (isArticle(p) && !data.jsonLdTypes.some((t) => /Article|BlogPosting|TechArticle/.test(String(t)))) {
      e.push({ page: p, issue: `文章頁沒有 Article 類 JSON-LD（現有：${data.jsonLdTypes.join(',') || '無'}）` });
    }
  }
  const sitemapSet = new Set(pageData.keys());
  for (const r of pg.filter((x) => isArticle(x.page))) {
    if (pageData.size && !sitemapSet.has(r.page)) e.push({ page: r.page, issue: 'GSC 有曝光但不在 sitemap' });
  }

  return { a, b, c, d, e };
}

function dueReviews(log) {
  return log.filter((e) => e.reviewDate <= today && !e.result);
}

async function main() {
  const endDate = addDays(today, -GSC_LAG_DAYS);
  const startDate = addDays(endDate, -(WINDOW_DAYS - 1));
  const log = existsSync(LOG_PATH) ? JSON.parse(await readFile(LOG_PATH, 'utf8')) : [];

  let gsc;
  let source;
  const token = await gscAccessToken();
  if (token) {
    gsc = await loadFromApi(token, startDate, endDate);
    source = 'gsc-api';
  } else {
    gsc = await loadFromDailyFiles(startDate, endDate);
    source = `public/gsc-daily (${gsc.files} files)`;
  }

  let pageData = new Map();
  if (doCrawl) pageData = await crawl(await sitemapPaths());

  const candidates = classify(gsc, pageData, log);
  const report = {
    generatedAt: new Date().toISOString(),
    window: { startDate, endDate, days: WINDOW_DAYS },
    source,
    crawledPages: pageData.size,
    totals: {
      impressions: gsc.pages.filter((p) => toSitePath(p.page)).reduce((s, p) => s + p.impressions, 0),
      clicks: gsc.pages.filter((p) => toSitePath(p.page)).reduce((s, p) => s + p.clicks, 0),
    },
    queryPages: gsc.queryPages
      .map((r) => ({ ...r, page: toSitePath(r.page) }))
      .filter((r) => r.page)
      .sort((x, y) => y.impressions - x.impressions),
    candidates: {
      a_rank5to20: candidates.a,
      b_impressionsNoClicks: candidates.b,
      c_internalLinks: candidates.c,
      d_demandWithoutArticle: candidates.d,
      e_technical: candidates.e,
    },
    dueReviews: dueReviews(log),
  };

  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  const c = report.candidates;
  const obsNote = (r) => (r.observingUntil ? ` (觀察至 ${r.observingUntil})` : '');
  console.log(`[seo-daily] ${startDate}~${endDate} source=${source} imp=${report.totals.impressions} clk=${report.totals.clicks} crawled=${report.crawledPages}`);
  console.log(`  a 排名5-20: ${c.a_rank5to20.length}  ${c.a_rank5to20.slice(0, 5).map((r) => `「${r.query}」${r.page} pos=${r.position} imp=${r.impressions}${obsNote(r)}`).join(' | ')}`);
  console.log(`  b 有曝光零點擊: ${c.b_impressionsNoClicks.length}  ${c.b_impressionsNoClicks.slice(0, 5).map((r) => `${r.page} imp=${r.impressions}${obsNote(r)}`).join(' | ')}`);
  console.log(`  c 內鏈: 首頁未連 ${c.c_internalLinks.homeMissingLinks.length}、入鏈<3 ${c.c_internalLinks.weakInbound.length}、k8s 互鏈不足 ${c.c_internalLinks.k8sSeries.length}`);
  console.log(`  d 有需求無文章: ${c.d_demandWithoutArticle.length}  ${c.d_demandWithoutArticle.slice(0, 5).map((r) => `「${r.query}」imp=${r.impressions} best=${r.bestPosition}`).join(' | ')}`);
  console.log(`  e 技術: ${c.e_technical.length}  ${c.e_technical.slice(0, 5).map((r) => `${r.page} ${r.issue}`).join(' | ')}`);
  console.log(`  待回看: ${report.dueReviews.length}`);
  console.log(`  輸出: ${outPath}`);
}

main().catch((err) => {
  console.error(`[seo-daily] FAIL ${err.message ?? err}`);
  process.exit(1);
});
