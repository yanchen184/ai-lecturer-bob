/**
 * SEO 監控腳本 - AI講師陳彥彤
 * 用於追蹤關鍵字排名和網站狀態
 */

interface MonitorResult {
  timestamp: string;
  keyword: string;
  status: 'checked' | 'error';
  notes: string;
}

const KEYWORDS = [
  'AI講師',
  'AI講師陳彥彤',
  '陳彥彤 AI',
  '人工智慧講師',
  'ChatGPT講師',
  'AI教學',
  '機器學習課程',
];

const SITE_URL = 'https://yanchen184.github.io/ai-lecturer-bob/';

async function checkSiteHealth(): Promise<void> {
  console.log('🔍 檢查網站健康狀態...\n');

  try {
    const response = await fetch(SITE_URL);
    console.log(`✅ 網站狀態: ${response.status} ${response.statusText}`);
    console.log(`📍 URL: ${SITE_URL}`);
  } catch (error) {
    console.log(`❌ 網站無法訪問: ${error}`);
  }
}

function generateSearchUrls(): void {
  console.log('\n🔗 Google 搜尋連結（手動檢查排名）:\n');

  KEYWORDS.forEach((keyword, index) => {
    const encodedKeyword = encodeURIComponent(keyword);
    const googleUrl = `https://www.google.com/search?q=${encodedKeyword}`;
    console.log(`${index + 1}. "${keyword}"`);
    console.log(`   ${googleUrl}\n`);
  });
}

function printMonitoringTips(): void {
  console.log('📊 SEO 監控建議:\n');
  console.log('1. 每週檢查一次關鍵字排名');
  console.log('2. 使用 Google Search Console 追蹤曝光和點擊');
  console.log('3. 監控網站載入速度 (PageSpeed Insights)');
  console.log('4. 檢查是否有 404 錯誤頁面');
  console.log('5. 確保 sitemap.xml 保持更新\n');

  console.log('🛠️ 有用的工具:');
  console.log('- Google Search Console: https://search.google.com/search-console/');
  console.log('- PageSpeed Insights: https://pagespeed.web.dev/');
  console.log('- Rich Results Test: https://search.google.com/test/rich-results');
  console.log('- Schema Validator: https://validator.schema.org/');
}

async function main(): Promise<void> {
  console.log('═══════════════════════════════════════════════');
  console.log('   AI講師陳彥彤 - SEO 監控報告');
  console.log('   ' + new Date().toLocaleString('zh-TW'));
  console.log('═══════════════════════════════════════════════\n');

  await checkSiteHealth();
  generateSearchUrls();
  printMonitoringTips();

  console.log('═══════════════════════════════════════════════');
}

main();
