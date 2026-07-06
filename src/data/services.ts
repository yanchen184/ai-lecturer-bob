/**
 * 顧問服務 / 企業內訓共用資料。
 * 首頁（index.astro）與服務頁（services.astro）共用同一份，改一處兩頁同步。
 */

export const CONTACT_EMAIL = 'bobchen184@gmail.com';

export interface ServiceCourse {
  persona: string;
  badge: string;
  title: string;
  problem: string;
  deliver: string[];
  duration: string;
  tags: string[];
}

export const courses: ServiceCourse[] = [
  {
    persona: 'HR / L&D / 學習發展窗口',
    badge: '01',
    title: 'AI 培訓菜單 · 工程師教工程師',
    problem: '老闆說要做 AI 培訓，但你怕找錯講師被工程同事嫌。',
    deliver: [
      '半天 / 一天 / 兩天三種規格，內容客製不是統一講義',
      '給你一份大綱、上課流程、Q&A 預演，可以直接上呈簽核',
      '結訓後給學員一份能帶回工位繼續用的 cheat sheet + 範例 repo',
    ],
    duration: '半天 ～ 兩天',
    tags: ['AI 內訓', 'LLM', 'RAG', '客製大綱'],
  },
  {
    persona: 'CTO / 技術主管 / 工程經理',
    badge: '02',
    title: 'AI 導入顧問 + 內訓套餐',
    problem: '你想推團隊用 AI，但團隊抗拒、不知從哪下手、怕做白工。',
    deliver: [
      '先做場景盤點：哪些痛點適合 AI、哪些不適合，講白話',
      '給可落地的技術選型 + 預算範圍 + 風險清單',
      '內訓 + 雙週 review，讓團隊邊做邊學、不是一場性消費',
    ],
    duration: '單次顧問 ／ 季度合作',
    tags: ['AI 導入', '架構顧問', '場景盤點', 'Workshop'],
  },
  {
    persona: '業務 / PM / 產品主管',
    badge: '03',
    title: '半天 AI 場景 Workshop',
    problem: '你想搞清楚「AI 對我們業務能做什麼、不能做什麼」，又怕被技術名詞繞暈。',
    deliver: [
      '半天 workshop，講白話、不丟英文縮寫',
      '帶著你跟團隊一起列 10-20 個業務場景，現場篩可行性',
      '結束後給一份「下一步該做什麼」的優先級清單',
    ],
    duration: '半天 workshop',
    tags: ['AI 場景盤點', 'PM 友善', '優先級清單'],
  },
];

export const faqs: { q: string; a: string }[] = [
  {
    q: '收費怎麼算？網站上為什麼看不到報價？',
    a: '我選擇「先聊需求再報價」，不放固定價格表。原因很直接：我想用「你們的需求對不對」來篩第一輪，不是用「價格能不能負擔」來篩——這兩件事篩出的客戶很不一樣。聊 30 分鐘了解你們團隊規模、對象、想做到什麼程度，價格我會直接告訴你，不繞圈子、不會有「先聊聊再追加」的情況。',
  },
  {
    q: '客製化流程是怎麼運作的？',
    a: '收到你的需求後我會回一份「課前訪談題庫」（你們團隊現在用什麼工具、卡在哪、想學完做到什麼），約一次 30-60 分鐘對焦會議，之後產出客製大綱給你內部簽核。簽核通過後我才開始備課、寫範例 repo——所以你拿到的東西會是針對你們團隊的，不是通用講義。',
  },
  {
    q: '可以開公司發票嗎？月結可以嗎？',
    a: '可以。我有公司行號，能開二聯 / 三聯發票，月結 30 / 60 也都接受。確認需求後我會發報價單，你內部簽核完回傳，課後 7 個工作日內開立發票。',
  },
  {
    q: '結訓後團隊還能繼續問問題嗎？',
    a: '可以。基本款：結訓後一個月內 email / Slack 群組 Q&A 不額外收費，避免學員回去卡住就放棄。延伸方案：雙週 review 顧問合作——做完一場內訓後最常被選的後續方案，把 AI 工具真的長到你們團隊的工作流裡。',
  },
];

/** 帶好主旨與問題清單的 mailto 連結 */
export const mailtoInquiry = (subject: string, body: string) =>
  `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

export const MAILTO_EXPLORE = mailtoInquiry(
  '[30 分鐘聊聊] 想先了解你的內訓模式',
  '嗨 YC，\n\n我是 ___（公司／團隊）___ 的 ___（職稱）___。\n\n我還在評估階段，想先約 30 分鐘聊聊：\n• 我們團隊狀況：\n• 在意的問題（不確定也沒關係）：\n• 方便的時段：\n\n謝謝！',
);

export const MAILTO_INQUIRY = mailtoInquiry(
  '[已有需求] AI 內訓 / 顧問 詢價',
  '嗨 YC，\n\n我是 ___（公司）___ 的 ___（職稱）___。\n\n我們的需求：\n• 想做的類型（內訓 / 顧問 / 兩者）：\n• 對象（工程師 / PM / 主管）：\n• 大概人數：\n• 預期時程：\n• 已知的場景或痛點：\n\n謝謝！',
);

/** 文章尾 CTA：依文章分類對應服務線 */
export interface BlogCtaVariant {
  eyebrow: string;
  heading: string;
  body: string;
  mailSubject: string;
}

export function ctaVariantFor(category: string, tags: string[]): BlogCtaVariant {
  const hay = `${category} ${tags.join(' ')}`.toLowerCase();

  if (/kubernetes|k8s|docker|容器|維運|部署/.test(hay)) {
    return {
      eyebrow: 'kubernetes 企業內訓',
      heading: '這篇教的東西，可以直接搬進你們團隊',
      body: '這系列 K8s 教材就是我企業內訓的現場講義——完全沒碰過 K8s 的工程師，一天課程加實機 lab 就能把服務部上去。如果你的團隊正要導入容器化，把這篇轉給你的主管或 HR，或直接寄信給我。',
      mailSubject: '[K8s 內訓] 看了你的 K8s 文章想聊聊',
    };
  }

  if (/claude|agent|ai|llm|rag|prompt|工作流/.test(hay)) {
    return {
      eyebrow: 'ai · claude code 企業內訓',
      heading: '想讓整個團隊都用上這套工作流？',
      body: '這篇寫的工具跟做法，就是我每天在 production 用、也在企業內訓現場教的同一套。如果你覺得有用，你的團隊大概也會覺得有用——把這篇轉給你的主管或 HR，或直接寄信給我，半天就能讓全隊上手。',
      mailSubject: '[AI 內訓] 看了你的文章想聊聊團隊導入',
    };
  }

  return {
    eyebrow: 'ai 內訓 · 導入顧問',
    heading: '你的團隊也在想怎麼用好 AI？',
    body: '我是邊做 production 邊教書的工程師——電商高併發 8 年、醫療 AI 平台從零到上線。企業內訓與導入顧問都做，教材就是我自己系統在跑的同一套 code。把這篇轉給決策的人，或直接寄信聊聊。',
    mailSubject: '[顧問服務] 看了你的文章想聊聊',
  };
}
