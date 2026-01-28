/**
 * 部落格文章資料
 * 程式講師陳彥彤的專業文章 - SEO 優化內容
 */

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  publishDate: string;
  updateDate?: string;
  category: string;
  tags: string[];
  readingTime: number;
  featured: boolean;
}

export const blogPosts: BlogPost[] = [
  {
    id: '1',
    slug: 'springboot-high-concurrency',
    title: 'Spring Boot 高併發系統設計實戰：程式講師的電商經驗分享',
    excerpt: '分享在電商核心系統中處理高併發的實戰經驗，包含 Redis 快取策略、分布式鎖、資料庫優化等技術，系統每日處理上萬筆 API 請求。',
    content: `
## 程式講師的實戰經驗

作為一名程式講師，我經常被問到：「如何設計一個能處理高併發的系統？」這篇文章將分享我在電商核心系統的實戰經驗。

## 系統背景

在電商核心系統團隊工作期間，我負責智能倉儲系統(WMS)、訂單管理系統(MOX)的開發與維護。系統每日處理上萬筆 API 請求，平均延遲需維持在 200ms 以下。

## 高併發解決方案

### 1. Redis 快取策略

作為程式講師，我在課程中特別強調快取設計的重要性：

\`\`\`java
@Service
public class InventoryService {
    @Cacheable(value = "inventory", key = "#skuId")
    public Inventory getInventory(String skuId) {
        return inventoryRepository.findBySkuId(skuId);
    }

    @CacheEvict(value = "inventory", key = "#skuId")
    public void updateInventory(String skuId, int quantity) {
        // 更新庫存邏輯
    }
}
\`\`\`

透過這個策略，我們成功降低資料庫讀取壓力約 20%。

### 2. 分布式鎖實作

在處理庫存扣減時，必須確保不會發生超賣問題：

\`\`\`java
public boolean deductInventory(String skuId, int quantity) {
    String lockKey = "lock:inventory:" + skuId;
    RLock lock = redissonClient.getLock(lockKey);

    try {
        if (lock.tryLock(5, 10, TimeUnit.SECONDS)) {
            // 執行庫存扣減
            return true;
        }
    } finally {
        lock.unlock();
    }
    return false;
}
\`\`\`

### 3. 資料庫優化

程式講師在教學中必須強調的 MySQL 優化要點：
- 合理設計 Index，避免全表掃描
- 大表使用 Partition 策略
- 定期執行 Housekeeping 清理歷史資料

## 總結

身為程式講師，我深知理論與實戰的差距。這些經驗都來自真實的電商系統，希望能幫助正在學習後端開發的你。
    `,
    author: '陳彥彤',
    publishDate: '2024-01-15',
    updateDate: '2024-03-01',
    category: '後端開發',
    tags: ['程式講師', 'Spring Boot', '高併發', 'Redis', '後端開發'],
    readingTime: 8,
    featured: true,
  },
  {
    id: '2',
    slug: 'fullstack-architecture-guide',
    title: 'React + Spring Boot 全端專案架構指南：程式講師的最佳實踐',
    excerpt: '從系統設計到實作部署，完整的全端專案開發流程與最佳實踐。程式講師陳彥彤分享前後端分離架構的設計心得。',
    content: `
## 為什麼選擇 React + Spring Boot？

作為程式講師，我經常需要評估各種技術組合。React + Spring Boot 是目前最受企業歡迎的全端組合之一，原因如下：

1. **Spring Boot** 提供完善的後端生態系統
2. **React** 擁有最活躍的前端社群
3. 前後端分離架構便於團隊協作

## 專案架構設計

### 後端架構（Spring Boot）

程式講師推薦的標準專案結構：

\`\`\`
src/
├── controller/     # API 入口
├── service/        # 業務邏輯
├── repository/     # 資料存取
├── entity/         # 資料實體
├── dto/            # 資料傳輸物件
└── config/         # 配置類別
\`\`\`

### 前端架構（React）

\`\`\`
src/
├── components/     # 可重用元件
├── pages/          # 頁面元件
├── hooks/          # 自訂 Hooks
├── services/       # API 呼叫
└── utils/          # 工具函數
\`\`\`

## API 設計規範

程式講師在授課時強調的 RESTful 設計原則：

- 使用正確的 HTTP 方法（GET, POST, PUT, DELETE）
- 統一的錯誤處理格式
- JWT 認證與授權機制

## 部署策略

使用 Docker + CI/CD 實現自動化部署：

\`\`\`yaml
# docker-compose.yml
version: '3'
services:
  frontend:
    build: ./frontend
    ports:
      - "80:80"
  backend:
    build: ./backend
    ports:
      - "8080:8080"
\`\`\`

## 結語

全端開發需要同時掌握前後端技術，這正是程式講師課程設計的核心理念。歡迎參加我的全端專案實作班！
    `,
    author: '陳彥彤',
    publishDate: '2024-02-20',
    category: '全端開發',
    tags: ['程式講師', 'React', 'Spring Boot', '全端開發', '系統架構'],
    readingTime: 10,
    featured: true,
  },
  {
    id: '3',
    slug: 'mysql-performance-optimization',
    title: 'MySQL 效能優化實戰：Index、Partition 與 Housekeeping 經驗分享',
    excerpt: '從電商系統實戰經驗分享 MySQL 效能優化技巧，包含索引設計、分區策略、查詢優化，讓資料庫效能提升 10 倍。',
    content: `
## 程式講師的資料庫優化心得

在多年的後端開發經驗中，我發現資料庫效能往往是系統瓶頸的主要來源。這篇文章分享我在電商系統中的實戰優化經驗。

## Index 設計原則

### 1. 選擇正確的欄位建立索引

程式講師在教學中常強調的 Index 設計原則：

\`\`\`sql
-- 良好的複合索引設計
CREATE INDEX idx_order_status_date
ON orders (status, created_at);

-- 查詢時充分利用索引
SELECT * FROM orders
WHERE status = 'PENDING'
AND created_at > '2024-01-01';
\`\`\`

### 2. 避免 Index 失效的情況

- 對索引欄位使用函數
- 使用 OR 連接非索引欄位
- LIKE 以 % 開頭

## Partition 策略

當單表資料量超過 1000 萬筆時，建議使用分區：

\`\`\`sql
CREATE TABLE orders (
    id BIGINT,
    created_at DATE,
    ...
) PARTITION BY RANGE (YEAR(created_at)) (
    PARTITION p2023 VALUES LESS THAN (2024),
    PARTITION p2024 VALUES LESS THAN (2025)
);
\`\`\`

## Housekeeping 策略

定期清理歷史資料是維持效能的關鍵：

\`\`\`java
@Scheduled(cron = "0 0 2 * * ?")
public void cleanupOldLogs() {
    int deleted = logRepository.deleteByCreatedAtBefore(
        LocalDateTime.now().minusMonths(3)
    );
    log.info("Cleaned up {} old logs", deleted);
}
\`\`\`

## 結語

資料庫優化是後端工程師的必備技能。作為程式講師，我會在課程中深入講解這些實戰技巧。
    `,
    author: '陳彥彤',
    publishDate: '2024-03-10',
    category: '資料庫',
    tags: ['程式講師', 'MySQL', '效能優化', '資料庫', 'Index'],
    readingTime: 7,
    featured: false,
  },
  {
    id: '4',
    slug: 'redis-distributed-lock-cache',
    title: 'Redis 分布式鎖與快取策略設計：避免超賣問題的實戰指南',
    excerpt: '深入解析 Redis 在高併發系統中的應用，包含分布式鎖實作、快取穿透防護、樂觀鎖機制。程式講師的電商系統實戰經驗。',
    content: `
## 為什麼需要分布式鎖？

在分散式系統中，多個服務實例可能同時操作相同資源。作為程式講師，我以電商庫存系統為例說明：

當兩個使用者同時購買最後一件商品，如果沒有適當的鎖機制，就會發生超賣。

## Redis 分布式鎖實作

### 基本實作

\`\`\`java
public boolean acquireLock(String key, String value, long expireTime) {
    Boolean result = redisTemplate.opsForValue()
        .setIfAbsent(key, value, expireTime, TimeUnit.SECONDS);
    return Boolean.TRUE.equals(result);
}
\`\`\`

### 使用 Redisson 實作

程式講師推薦使用 Redisson 處理複雜場景：

\`\`\`java
@Service
public class InventoryService {
    @Autowired
    private RedissonClient redissonClient;

    public boolean deductStock(String skuId, int quantity) {
        RLock lock = redissonClient.getLock("lock:stock:" + skuId);
        try {
            if (lock.tryLock(3, 10, TimeUnit.SECONDS)) {
                // 檢查庫存 -> 扣減庫存
                return doDeduct(skuId, quantity);
            }
        } finally {
            if (lock.isHeldByCurrentThread()) {
                lock.unlock();
            }
        }
        return false;
    }
}
\`\`\`

## 快取策略設計

### 快取穿透防護

\`\`\`java
public Product getProduct(String id) {
    // 先查快取
    Product cached = cacheService.get("product:" + id);
    if (cached != null) return cached;

    // 查資料庫
    Product product = productRepository.findById(id);

    // 空值也快取（防穿透）
    cacheService.set("product:" + id,
        product != null ? product : EMPTY_PRODUCT,
        product != null ? 3600 : 60);

    return product;
}
\`\`\`

## 結語

Redis 是後端開發必備的技能之一。作為程式講師，我會在課程中詳細講解這些進階應用。
    `,
    author: '陳彥彤',
    publishDate: '2024-04-05',
    category: '後端開發',
    tags: ['程式講師', 'Redis', '分布式鎖', '快取', '高併發'],
    readingTime: 9,
    featured: false,
  },
  {
    id: '5',
    slug: 'event-driven-architecture',
    title: '從電商系統學習事件驅動架構：RabbitMQ 實戰經驗分享',
    excerpt: '以電商核心系統為例，分享事件驅動架構的設計原則與 RabbitMQ 實戰經驗。程式講師帶你理解現代微服務架構。',
    content: `
## 什麼是事件驅動架構？

作為程式講師，我經常用電商系統來解釋事件驅動架構的概念。

當使用者完成訂單後，系統需要：
1. 更新庫存
2. 發送確認郵件
3. 通知物流系統
4. 更新數據報表

傳統同步呼叫會造成效能瓶頸，而事件驅動架構可以完美解決這個問題。

## RabbitMQ 基礎

### 生產者

\`\`\`java
@Service
public class OrderEventPublisher {
    @Autowired
    private RabbitTemplate rabbitTemplate;

    public void publishOrderCreated(Order order) {
        OrderCreatedEvent event = new OrderCreatedEvent(order);
        rabbitTemplate.convertAndSend(
            "order.exchange",
            "order.created",
            event
        );
    }
}
\`\`\`

### 消費者

\`\`\`java
@Component
public class InventoryEventHandler {
    @RabbitListener(queues = "inventory.queue")
    public void handleOrderCreated(OrderCreatedEvent event) {
        // 扣減庫存邏輯
        inventoryService.deduct(event.getSkuId(), event.getQuantity());
    }
}
\`\`\`

## 設計原則

程式講師在教學中強調的事件驅動設計原則：

1. **事件不可變** - 一旦發布就不應修改
2. **冪等處理** - 消費者需能處理重複事件
3. **事件版本控制** - 方便向後相容
4. **監控與追蹤** - 完善的日誌記錄

## 實際應用場景

在電商系統中，我們使用事件驅動處理：
- 訂單狀態變更
- 庫存同步
- 價格更新通知
- 使用者行為追蹤

## 結語

事件驅動架構是現代分散式系統的核心概念。作為程式講師，我會在進階課程中深入講解這些架構設計。
    `,
    author: '陳彥彤',
    publishDate: '2024-05-12',
    category: '系統架構',
    tags: ['程式講師', '事件驅動', 'RabbitMQ', '系統架構', '微服務'],
    readingTime: 8,
    featured: true,
  },
];

export const getBlogPostBySlug = (slug: string): BlogPost | undefined => {
  return blogPosts.find((post) => post.slug === slug);
};

export const getFeaturedPosts = (): BlogPost[] => {
  return blogPosts.filter((post) => post.featured);
};

export const getPostsByCategory = (category: string): BlogPost[] => {
  return blogPosts.filter((post) => post.category === category);
};

export const getAllCategories = (): string[] => {
  return [...new Set(blogPosts.map((post) => post.category))];
};

export const getAllTags = (): string[] => {
  const allTags = blogPosts.flatMap((post) => post.tags);
  return [...new Set(allTags)];
};
