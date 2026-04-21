/**
 * 靜態部落格文章陣列 — Firestore 失敗時的 fallback。
 * 型別由 src/lib/firestore.ts 管理，這裡只 re-export 陣列。
 */

import type { BlogPost } from '../lib/firestore';

export const staticPosts: BlogPost[] = [
  {
    id: '1',
    slug: 'springboot-high-concurrency',
    title: 'Spring Boot 高併發：電商系統踩過的三個雷',
    excerpt: '電商核心系統每日處理上萬筆 API 請求時，我把 Redis 快取、分布式鎖、資料庫優化該踩的雷都踩過一輪。這篇寫三個讓我花最多時間救回來的問題，以及最後的解法。',
    content: `
## 寫在前面

這篇不是教科書，是我在電商 WMS/MOX 線上救火的流水帳。以下三個問題都是 staging 過測試、上 production 才炸的。

## 雷 #1：@Cacheable 在冷啟動瞬間把 DB 打爆

**情境**：促銷開始的那一秒，首頁商品頁 QPS 從 50 衝到 1500。我們的快取用 \`@Cacheable\`，TTL 設 10 分鐘。

**問題**：TTL 到期的那一瞬間，1500 個請求同時 miss cache，全部打進 DB。DB 直接 CPU 100%、連線池耗盡。

**一開始的錯誤修法**：把 TTL 拉長到 1 小時。問題根本沒解，只是把爆炸時間往後延。

**最後的解法**：

\`\`\`java
@Service
public class InventoryService {
    @Cacheable(
        value = "inventory",
        key = "#skuId",
        // sync=true 讓同一個 key 的並發請求只有一個打 DB
        sync = true
    )
    public Inventory getInventory(String skuId) {
        return inventoryRepository.findBySkuId(skuId);
    }
}
\`\`\`

\`sync = true\` 是關鍵。Spring Cache 會用 ConcurrentHashMap 鎖住同一個 key 的重複查詢，只讓第一個請求打 DB，其他等結果。這一行字，DB CPU 從 100% 降回 30%。

**但要注意**：\`sync = true\` 只對單一節點有效。多節點部署時，每個節點都會各打一次 DB。真的要跨節點去重，得上 Redis 的 \`SET NX\` 做分布式互斥，成本更高，一般不需要。

## 雷 #2：tryLock 後忘記檢查就直接扣庫存

**情境**：庫存扣減用 Redisson 分布式鎖。上線一週後，對帳發現有 3 筆超賣。

**問題**：第一版的程式碼長這樣：

\`\`\`java
// WRONG
public boolean deductInventory(String skuId, int quantity) {
    RLock lock = redissonClient.getLock("lock:inventory:" + skuId);
    try {
        if (lock.tryLock(5, 10, TimeUnit.SECONDS)) {
            inventoryRepository.deduct(skuId, quantity);
            return true;
        }
    } finally {
        lock.unlock(); // ← 這裡會噴 IllegalMonitorStateException
    }
    return false;
}
\`\`\`

兩個 bug：
1. \`tryLock\` 失敗時（回傳 false），\`finally\` 還是會執行 \`unlock\`，噴 \`IllegalMonitorStateException\`
2. 例外被吞掉，呼叫端收到 false 以為「沒鎖到」，**但其實庫存已經被另一個成功拿到鎖的請求扣走了**，結果又去走補償扣款邏輯 → 超賣

**修好的版本**：

\`\`\`java
public boolean deductInventory(String skuId, int quantity) {
    RLock lock = redissonClient.getLock("lock:inventory:" + skuId);
    boolean locked = false;
    try {
        locked = lock.tryLock(5, 10, TimeUnit.SECONDS);
        if (!locked) {
            throw new InventoryLockTimeoutException(skuId);
        }
        // 先檢查庫存，再扣 — 鎖的意義在這兩步之間
        Inventory current = inventoryRepository.findBySkuId(skuId);
        if (current.getQuantity() < quantity) {
            throw new InsufficientStockException(skuId);
        }
        inventoryRepository.deduct(skuId, quantity);
        return true;
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
        throw new InventoryLockTimeoutException(skuId);
    } finally {
        if (locked && lock.isHeldByCurrentThread()) {
            lock.unlock();
        }
    }
}
\`\`\`

兩個重點：
- **\`isHeldByCurrentThread()\` 一定要檢查**。leaseTime (10s) 到了但任務還沒跑完時，鎖已經被 Redisson 釋放，你這時候再 unlock 會噴例外
- **鎖裡面一定要包「讀+寫」兩個動作**。只包 write 等於沒鎖

## 雷 #3：MySQL index 加了卻沒被用到

**情境**：訂單查詢頁慢查詢從 200ms 飆到 3 秒。

一開始我加了索引：

\`\`\`sql
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
\`\`\`

\`EXPLAIN\` 顯示：**還是 full table scan**。

**原因**：我們的查詢是 \`WHERE status = 'PENDING' AND created_at > '2024-01-01'\`。MySQL 只會挑一個索引用，而且兩個單欄索引對這種組合查詢幫助很小。

**改成複合索引後**：

\`\`\`sql
DROP INDEX idx_orders_status ON orders;
DROP INDEX idx_orders_created_at ON orders;

CREATE INDEX idx_orders_status_created
  ON orders(status, created_at);
\`\`\`

查詢時間從 3 秒降到 80ms。

**踩坑點**：複合索引的欄位順序很重要。\`(status, created_at)\` 和 \`(created_at, status)\` 效果完全不同。規則是**等值查詢在前，範圍查詢在後**。

## 結語

這三個雷的共通點：都是在**高併發實際發生**時才炸出來，本機和 staging 測試都過。救火完會發現，解法本身都不難，難的是在爆炸當下找得出根因。

下次遇到類似情境可以先看：
- 快取雪崩 → 先確認 \`sync = true\` 或加 mutex
- 鎖詭異行為 → 確認 \`isHeldByCurrentThread\` 與 leaseTime
- index 沒生效 → \`EXPLAIN\` 看走的是哪個 key，再調複合索引順序
    `,
    author: '陳彥彤',
    publishDate: '2024-01-15',
    updateDate: '2024-03-01',
    category: '後端開發',
    tags: ['Spring Boot', '高併發', 'Redis', 'MySQL', '踩坑筆記'],
    readingTime: 8,
    featured: true,
  },
  {
    id: '2',
    slug: 'fullstack-architecture-guide',
    title: 'React + Spring Boot 全端專案：為什麼我最後把 service 層砍掉一半',
    excerpt: '帶學生做全端專案時，我最常被問「業務邏輯該放哪層」。教了兩年後，我自己的 service 層反而越寫越薄。這篇寫我對分層的實際判斷。',
    content: `
## 標準分層是起點，不是終點

多數教學會告訴你 Spring Boot 專案要這樣分：

\`\`\`
controller → service → repository → entity
\`\`\`

這個結構對 90% 的 CRUD 沒問題。但實際做完幾個專案後，我發現**有些 service 方法根本不該存在**。

## 什麼樣的 service 方法該砍

看這個常見寫法：

\`\`\`java
// Controller
@GetMapping("/users/{id}")
public UserDto getUser(@PathVariable Long id) {
    return userService.getUser(id);
}

// Service
public UserDto getUser(Long id) {
    User user = userRepository.findById(id)
        .orElseThrow(() -> new NotFoundException());
    return userMapper.toDto(user);
}
\`\`\`

\`UserService.getUser\` 做了什麼？查 DB + 轉 DTO。**沒有任何業務邏輯**。這個 service 方法純粹是為了「分層要完整」而存在。

我現在會這樣寫：

\`\`\`java
@GetMapping("/users/{id}")
public UserDto getUser(@PathVariable Long id) {
    User user = userRepository.findById(id)
        .orElseThrow(() -> new NotFoundException());
    return userMapper.toDto(user);
}
\`\`\`

少一層、少一個 mock、少一堆 boilerplate。

## 什麼時候 service 層真的有價值

當你有**跨 repository 的 transaction** 或 **非 CRUD 的業務規則**：

\`\`\`java
@Service
@Transactional
public class OrderService {
    // 這個方法值得存在：涉及三個 repository + 業務規則
    public Order placeOrder(PlaceOrderCommand cmd) {
        Inventory inv = inventoryRepository.lockAndGet(cmd.skuId());
        if (inv.getQuantity() < cmd.quantity()) {
            throw new InsufficientStockException();
        }
        inventoryRepository.deduct(cmd.skuId(), cmd.quantity());
        Order order = orderRepository.save(Order.from(cmd));
        paymentEventPublisher.publish(PaymentRequested.of(order));
        return order;
    }
}
\`\`\`

## 前端那側我也砍了類似的東西

React 這邊最常被硬湊出來的是**每個頁面都包一個 custom hook**：

\`\`\`tsx
// 砍掉這種
function useUserPage() {
    const [user, setUser] = useState();
    useEffect(() => { fetchUser().then(setUser); }, []);
    return { user };
}
\`\`\`

如果這個 hook 只被一個頁面用、只做一次 fetch，直接寫在 component 裡更清楚。React Query / SWR 已經把 cache/dedup 處理好，custom hook 多半只是在重複包裝。

## 判斷原則

我現在的判斷很簡單：**這一層如果刪掉，會不會讓程式變難懂或重複？**
- 會 → 保留
- 不會 → 刪掉

企業專案常見的過度分層（controller → facade → service → manager → repository → dao）大部分是歷史包袱，不是設計。新專案不需要複製這個結構。

## API 設計：從「資源」還是「動作」開始

RESTful 教科書說要以「資源」為核心：\`POST /orders\`、\`DELETE /orders/{id}\`。

實際上有很多東西不是 CRUD：
- 「確認訂單」是 PATCH 還是 POST？
- 「重新寄送發票」放哪個 endpoint？

我的做法：**不是 CRUD 的，老實用動詞**。

\`\`\`
POST /orders/{id}/confirm
POST /orders/{id}/resend-invoice
\`\`\`

這樣比硬湊成 \`PATCH /orders/{id} { action: "confirm" }\` 清楚 100 倍。不 RESTful？那又怎樣。

## 結語

分層和架構的價值在「讓複雜度可控」，不在「看起來很完整」。如果你的 service 層只是在做 \`return repository.find()\`，那它什麼都沒保護到。

下次寫新方法前，先問自己：拿掉這一層會少掉什麼？少不掉就別加。
    `,
    author: '陳彥彤',
    publishDate: '2024-02-20',
    category: '全端開發',
    tags: ['React', 'Spring Boot', '架構設計', '分層', 'REST API'],
    readingTime: 10,
    featured: true,
  },
  {
    id: '3',
    slug: 'mysql-performance-optimization',
    title: 'MySQL 效能優化：我把一個慢查詢從 8 秒調到 40ms 的過程',
    excerpt: '一個訂單歷史查詢上線一年後慢到無法使用。這篇紀錄我如何用 EXPLAIN 一步步定位、為什麼「加索引」不總是有效、以及最後真正解決問題的方法。',
    content: `
## 背景

一張 \`order_logs\` 表，累積到 4200 萬筆。後台「查某個客戶過去一年的訂單紀錄」這個查詢，從原本 200ms 飆到 8 秒，客服抱怨到我們必須處理。

## 第一步：EXPLAIN 看當下走的是什麼

原始查詢：

\`\`\`sql
SELECT * FROM order_logs
WHERE user_id = 12345
  AND created_at > '2023-04-01'
ORDER BY created_at DESC
LIMIT 50;
\`\`\`

\`EXPLAIN\` 結果：

\`\`\`
type: ALL
rows: 42000000
Extra: Using where; Using filesort
\`\`\`

**全表掃 + filesort**。4200 萬筆資料過濾 + 排序，8 秒還算客氣。

## 第二步：加索引，但加錯了

第一版修法（失敗）：

\`\`\`sql
CREATE INDEX idx_user_id ON order_logs(user_id);
\`\`\`

查詢時間：**3 秒**。

看起來有進步，但還是不能接受。\`EXPLAIN\`：

\`\`\`
type: ref
rows: 180000
Extra: Using where; Using filesort
\`\`\`

索引用了、rows 從 4200 萬降到 18 萬，但還在 filesort。因為 ORDER BY \`created_at\` 沒被索引覆蓋，MySQL 撈 18 萬筆後還得全部排一次。

## 第三步：複合索引 + 排序方向

第二版修法：

\`\`\`sql
DROP INDEX idx_user_id ON order_logs;

CREATE INDEX idx_user_created
  ON order_logs(user_id, created_at DESC);
\`\`\`

查詢時間：**40ms**。

\`EXPLAIN\`：

\`\`\`
type: ref
rows: 50
Extra: Using where
\`\`\`

filesort 消失了。關鍵是：
- \`(user_id, created_at)\` 讓 MySQL 走到某個 user 後，\`created_at\` 已經是有序的
- \`DESC\` 讓 ORDER BY 可以直接 backward scan，連反轉都不用

**MySQL 8.0 才支援 descending index**。8.0 以前這招沒用，你只能改用「先 inner query 拿 50 筆 id，再 join 回原表」的寫法。

## 第四步：不是每個慢查詢都該靠索引解

一年後，同一張表又變慢了（60 億筆）。這次我沒加索引。

看實際需求：**客服只查過去一年**。那就分區：

\`\`\`sql
ALTER TABLE order_logs
PARTITION BY RANGE (TO_DAYS(created_at)) (
    PARTITION p202301 VALUES LESS THAN (TO_DAYS('2023-02-01')),
    PARTITION p202302 VALUES LESS THAN (TO_DAYS('2023-03-01')),
    -- ...
    PARTITION p_future VALUES LESS THAN MAXVALUE
);
\`\`\`

分區後配合 partition pruning，查詢只掃特定月份的分區。加上前面那個複合索引，3 年舊資料的效能也維持在 50ms 內。

再加上每月把 3 年以上的分區搬去冷儲存：

\`\`\`java
@Scheduled(cron = "0 0 3 1 * ?")
public void archiveOldPartitions() {
    LocalDate cutoff = LocalDate.now().minusYears(3);
    List<String> partitions = getPartitionsOlderThan(cutoff);
    for (String p : partitions) {
        exportToColdStorage(p);
        dropPartition(p);
    }
}
\`\`\`

## 踩過的雷

- **\`LIKE '%keyword%'\` 永遠用不到索引**。這類需求改用全文索引或 ElasticSearch
- **對索引欄位用函數**（\`WHERE DATE(created_at) = '2024-01-01'\`）會讓索引失效。改成 \`created_at >= '2024-01-01' AND created_at < '2024-01-02'\`
- **OR 連接兩個不同欄位**往往索引失效。拆成 UNION 反而更快
- **太多單欄索引**會拖慢寫入。每寫一筆要更新 N 個索引樹

## 結語

慢查詢不是都靠「加索引」解決。我的判斷順序：
1. \`EXPLAIN\` 看當下走什麼、rows 多少、有沒有 filesort
2. 先確認 WHERE 能不能用到索引
3. 再確認 ORDER BY 能不能被索引覆蓋
4. 資料量超過 1000 萬考慮分區
5. 超過 5000 萬考慮冷熱分離

遇到看起來無解的慢查詢，通常是跳過了第 1 步就想直接修。
    `,
    author: '陳彥彤',
    publishDate: '2024-03-10',
    category: '資料庫',
    tags: ['MySQL', '效能優化', 'Index', 'Partition', '踩坑筆記'],
    readingTime: 9,
    featured: false,
  },
  {
    id: '4',
    slug: 'redis-distributed-lock-cache',
    title: 'Redis 分布式鎖：為什麼我不再推薦 Redlock',
    excerpt: '分布式鎖用 Redis 實作是常見選擇，但 Redlock 在生產環境有我親身踩過的問題。這篇寫為什麼多數場景 SETNX + fencing token 就夠用，以及什麼時候該換工具。',
    content: `
## 從一次超賣事故說起

電商庫存系統用 Redisson 的 \`RLock\`（底層是 Redlock 變體）。某次 Redis 主從切換的 5 秒空窗期，同一個 SKU 被扣了兩次庫存。

事後復盤：Redlock 在網路分區或主從延遲時**本質上無法保證互斥**。Martin Kleppmann 2016 的那篇批評不是空談。

這篇寫我現在的實際做法。

## 多數場景 SETNX 就夠

**先問一個問題**：你真的需要分布式鎖嗎？

很多「分布式鎖問題」其實是「並發更新問題」。如果資料庫支援，用 \`UPDATE ... WHERE version = ?\` 的樂觀鎖更可靠：

\`\`\`sql
UPDATE inventory
SET quantity = quantity - 1, version = version + 1
WHERE sku_id = ? AND version = ? AND quantity >= 1;
\`\`\`

影響筆數為 0 → 被別人搶先 → 重試或回傳錯誤。沒有鎖、沒有超時、沒有主從切換風險。

## 真的需要鎖時的最小實作

\`\`\`java
public class SimpleRedisLock {
    private final StringRedisTemplate redis;

    public String acquire(String key, Duration ttl) {
        String token = UUID.randomUUID().toString();
        Boolean ok = redis.opsForValue()
            .setIfAbsent("lock:" + key, token, ttl);
        return Boolean.TRUE.equals(ok) ? token : null;
    }

    public boolean release(String key, String token) {
        // Lua script: 只有持有者能釋放
        String script =
            "if redis.call('get', KEYS[1]) == ARGV[1] then " +
            "  return redis.call('del', KEYS[1]) " +
            "else return 0 end";
        Long result = redis.execute(
            new DefaultRedisScript<>(script, Long.class),
            List.of("lock:" + key),
            token
        );
        return Long.valueOf(1).equals(result);
    }
}
\`\`\`

三個重點：
1. **token 隨機**，避免誤釋放別人的鎖
2. **釋放用 Lua script**，保證「比對 + 刪除」原子性
3. **必須設 TTL**，持有者掛了鎖會自動過期

## Fencing token：真正的保險

即使 Redis 給你「你拿到鎖了」，你還是可能因為 GC pause、網路延遲，讓另一個請求也認為自己拿到鎖。真正的保護是 **fencing token**：

\`\`\`java
// 每次拿鎖附帶一個單調遞增的 token
long fenceToken = redis.opsForValue()
    .increment("fence:" + key);

// 寫入目標系統時帶上 token
inventoryRepository.deductWithFence(skuId, quantity, fenceToken);

// 目標系統檢查：如果收到比已處理更小的 token，拒絕
// UPDATE inventory SET ..., last_fence = ?
// WHERE sku_id = ? AND last_fence < ?
\`\`\`

這樣即使兩個請求「都以為自己有鎖」，只有 token 較大的那一個會成功寫入。

## 什麼時候該換工具

如果你的互斥需求需要**強一致**（金融、庫存、訂位），Redis 不是正確選擇。改用：
- **ZooKeeper / etcd**：基於共識演算法，主從切換時仍保證互斥
- **資料庫行鎖**：\`SELECT ... FOR UPDATE\`，強一致但吞吐較差
- **樂觀鎖**：如上面那個 UPDATE WHERE version

## 快取穿透防護

順帶提一下，很多「快取+鎖」的寫法其實是在解快取穿透：

\`\`\`java
public Product getProduct(String id) {
    Product cached = cacheService.get("product:" + id);
    if (cached != null) {
        return cached == NULL_MARKER ? null : cached;
    }

    Product product = productRepository.findById(id);
    // 空值用短 TTL 快取，防止惡意查不存在 ID 打爆 DB
    cacheService.set(
        "product:" + id,
        product != null ? product : NULL_MARKER,
        product != null ? Duration.ofHours(1) : Duration.ofMinutes(1)
    );
    return product;
}
\`\`\`

更嚴重的情境（知名商品被搶光瞬間）還要加 \`@Cacheable(sync = true)\` 或 BloomFilter。

## 結語

分布式鎖是最容易誤用的工具之一。我現在的順序是：
1. 能用樂觀鎖（DB UPDATE WHERE version）就用
2. 真需要鎖，先用 SETNX + Lua release
3. 強一致場景直接換 ZooKeeper 或 DB 行鎖
4. Redlock / RLock 我現在只用在「沒那麼致命、只是想省 DB 壓力」的場景

下次看到「Redis 分布式鎖」教學，先問：這個情境真的需要鎖嗎？
    `,
    author: '陳彥彤',
    publishDate: '2024-04-05',
    category: '後端開發',
    tags: ['Redis', '分布式鎖', '樂觀鎖', '高併發', '踩坑筆記'],
    readingTime: 11,
    featured: false,
  },
  {
    id: '5',
    slug: 'event-driven-architecture',
    title: '事件驅動架構：我們為什麼從 RabbitMQ 換到 Kafka，又換回來',
    excerpt: '電商核心系統用過 RabbitMQ、換到 Kafka、再換回 RabbitMQ。每次都有好理由。這篇寫三次選擇背後的真實原因，以及「訊息佇列」這個詞掩蓋了多少不同的使用情境。',
    content: `
## 前情提要

2022 年底：我們用 RabbitMQ 處理訂單事件。
2023 年中：換成 Kafka。
2023 年底：部分流量又搬回 RabbitMQ。

每次決策當下都有充分理由。這篇寫為什麼會這樣繞。

## 第一次：為什麼用 RabbitMQ

典型訂單流程：

\`\`\`java
@Service
public class OrderEventPublisher {
    private final RabbitTemplate rabbitTemplate;

    public void publishOrderCreated(Order order) {
        OrderCreatedEvent event = OrderCreatedEvent.from(order);
        rabbitTemplate.convertAndSend(
            "order.exchange",
            "order.created",
            event
        );
    }
}

@Component
public class InventoryEventHandler {
    @RabbitListener(queues = "inventory.queue")
    public void onOrderCreated(OrderCreatedEvent event) {
        inventoryService.deduct(event.getSkuId(), event.getQuantity());
    }
}
\`\`\`

選它的理由很實際：
- 團隊有人熟、上線快
- Spring AMQP 整合成熟
- 每秒幾百筆訊息完全夠用

這個階段一切都好。

## 第二次：為什麼改 Kafka

2023 年中公司決定要做**即時推薦**和**行為分析**。新需求：

- 所有使用者行為（點擊、瀏覽、加購物車）都要寫成事件
- QPS 從 500 跳到 15000
- 資料分析團隊要能 replay 過去 30 天的事件

這三點中：
- **高吞吐**：RabbitMQ 單機幾萬 QPS 勉強夠，但擴展靠複雜的 federation / shovel
- **事件重播**：RabbitMQ 訊息消費完就沒了，要另外存 snapshot
- **消費者獨立進度**：推薦系統和庫存系統要能獨立 offset，RabbitMQ 得開多個 queue 各 bind

Kafka 這三個是天生支援的。於是整個訂單流程搬過去。

## 第三次：為什麼搬回來

半年後發現幾個問題只在 Kafka 會遇到：

### 問題 1：低頻訊息的延遲很痛

對帳任務每天晚上跑一次、發一個訊息。Kafka consumer poll 的間隔讓這個訊息**平均延遲 2 分鐘**才被處理。RabbitMQ 是推模式，延遲不到 100ms。

### 問題 2：單一訊息優先處理做不到

「VIP 客戶下單要優先處理」這類需求，RabbitMQ 用 priority queue 兩行設定搞定。Kafka 沒有原生 priority，得自己分 topic + consumer 輪詢，複雜很多。

### 問題 3：訊息 schema 變更痛苦

Kafka 一個 topic 的訊息結構一旦上線就很難改。要加欄位得上 Schema Registry（Confluent/Apicurio）。RabbitMQ 因為訊息不持久、消費完就沒了，schema 變更影響只在「當下還沒處理完的訊息」。

## 最後的選擇：兩個都用

看使用情境分：

| 場景 | 用哪個 | 理由 |
|---|---|---|
| 訂單/支付/庫存事件 | RabbitMQ | 低延遲、可優先、量不大 |
| 使用者行為追蹤 | Kafka | 高吞吐、需 replay |
| 資料湖 ETL | Kafka | 持久化 + 多消費者獨立 offset |
| 跨服務命令 | RabbitMQ | RPC-like 場景延遲敏感 |

## 事件驅動要注意的四件事

不管用哪個工具：

**1. 事件設計不是 DTO 搬家**

錯誤：\`OrderUpdatedEvent { fullOrderObject }\`
正確：\`OrderShipped { orderId, shippedAt, trackingNo }\`

事件應該描述「發生什麼」，不是「訂單當前完整狀態」。

**2. 冪等性必須在消費者實作**

\`\`\`java
@RabbitListener(queues = "inventory.queue")
public void onOrderCreated(OrderCreatedEvent event) {
    // 先檢查這個 event 是否處理過
    if (processedEventRepository.exists(event.getEventId())) {
        return;
    }
    inventoryService.deduct(event.getSkuId(), event.getQuantity());
    processedEventRepository.save(event.getEventId());
}
\`\`\`

訊息重送（broker 重啟、consumer 重連）是常態。沒做冪等等於埋地雷。

**3. 死信佇列一定要配**

處理失敗的訊息不能無限重試。設定 DLX (dead letter exchange)，失敗 N 次後送到 DLQ 人工處理。

**4. 追蹤 ID 要貫穿**

每個事件帶一個 \`traceId\`，消費端 log 時也帶上。出事時才查得到事件從哪裡發、被誰消費。

## 結語

「要不要上訊息佇列？」是很多團隊問錯的問題。真正該問的是：
- 我需要的是**解耦**還是**非同步**？
- 量是 QPS 還是 events/day？
- 訊息失敗能容忍延遲多久？

答完這三題再選工具。我們繞一圈換回來不是壞事——踩過才會知道自己的場景實際長什麼樣。
    `,
    author: '陳彥彤',
    publishDate: '2024-05-12',
    category: '系統架構',
    tags: ['事件驅動', 'RabbitMQ', 'Kafka', '架構決策', '微服務'],
    readingTime: 11,
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
