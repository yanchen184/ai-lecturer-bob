/**
 * SEO 監控腳本 - AI講師陳彥彤
 * 執行方式: node scripts/monitor.js
 */

const https = require('https');
const http = require('http');

const SITE_URL = 'https://yanchen184.github.io/ai-lecturer-bob/';
const KEYWORDS = [
  'AI講師',
  'AI講師陳彥彤',
  '陳彥彤 AI',
  '人工智慧講師',
  'ChatGPT講師',
  'AI教學',
];

function checkSite(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const startTime = Date.now();

    protocol.get(url, (res) => {
      const responseTime = Date.now() - startTime;
      resolve({
        status: res.statusCode,
        responseTime,
        headers: res.headers
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('   🤖 AI講師陳彥彤 - SEO 監控報告');
  console.log('   📅 ' + new Date().toLocaleString('zh-TW'));
  console.log('═══════════════════════════════════════════════════════\n');

  // 檢查網站狀態
  console.log('🌐 網站健康檢查:');
  console.log('─────────────────────────────────────────────────────────');

  try {
    const result = await checkSite(SITE_URL);
    console.log(`   ✅ 狀態碼: ${result.status}`);
    console.log(`   ⚡ 回應時間: ${result.responseTime}ms`);
    console.log(`   🔗 URL: ${SITE_URL}`);
  } catch (error) {
    console.log(`   ❌ 錯誤: ${error.message}`);
  }

  // 生成搜尋連結
  console.log('\n🔍 Google 搜尋連結 (手動檢查排名):');
  console.log('─────────────────────────────────────────────────────────');

  KEYWORDS.forEach((keyword, i) => {
    const url = `https://www.google.com/search?q=${encodeURIComponent(keyword)}`;
    console.log(`   ${i + 1}. "${keyword}"`);
    console.log(`      ${url}\n`);
  });

  // 檢查索引狀態連結
  console.log('📊 索引檢查連結:');
  console.log('─────────────────────────────────────────────────────────');
  console.log(`   site: 查詢: https://www.google.com/search?q=site:yanchen184.github.io/ai-lecturer-bob`);
  console.log(`   cache: 查詢: https://webcache.googleusercontent.com/search?q=cache:${encodeURIComponent(SITE_URL)}`);

  // SEO 工具連結
  console.log('\n🛠️ SEO 工具:');
  console.log('─────────────────────────────────────────────────────────');
  console.log('   • Google Search Console: https://search.google.com/search-console/');
  console.log('   • PageSpeed Insights: https://pagespeed.web.dev/analysis?url=' + encodeURIComponent(SITE_URL));
  console.log('   • Rich Results Test: https://search.google.com/test/rich-results?url=' + encodeURIComponent(SITE_URL));
  console.log('   • Schema Validator: https://validator.schema.org/');

  // 提交索引
  console.log('\n📤 加速 Google 收錄:');
  console.log('─────────────────────────────────────────────────────────');
  console.log('   1. 前往 Google Search Console 驗證網站');
  console.log('   2. 提交 Sitemap: https://yanchen184.github.io/ai-lecturer-bob/sitemap.xml');
  console.log('   3. 使用「網址檢查」工具請求編入索引');
  console.log('   4. 在社群媒體分享網站連結產生反向連結');

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('   監控完成！建議每週執行一次追蹤排名變化');
  console.log('═══════════════════════════════════════════════════════\n');
}

main().catch(console.error);
