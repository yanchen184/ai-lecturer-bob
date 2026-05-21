/**
 * K8s 系列教學文章資料。
 *
 * 順序對齊作者實體 7 堂課的因果鏈（第 4~7 堂）：
 *   Docker 扛不住 → K8s → Pod → Service → Ingress → Config → Storage → Production
 *
 * 排程策略：從 2026-04-28 起每天一篇自動上線（共 40 天）。
 * 每篇對應一個 Google 搜尋關鍵字，目標：完全 0 基礎讀者。
 *
 * 內文撰寫狀態：
 *   - #22 ingress-intro：完整內文（pilot）
 *   - 其他 39 篇：metadata + 短 stub，等排程驗證完後批次補完整內文
 */

import type { K8sLesson } from '../lib/k8s';

/**
 * 產生 stub 內文（尚未撰寫完整文章時用）。
 * 排程上線後若還沒寫完，至少不是 404，而是合理的「即將上線」頁面。
 */
const stub = (title: string, hook: string) => `
## ${title}

${hook}

> 這篇文章正在撰寫中，預計近期完成。如果你想第一時間收到通知，可以先看其他已上線的章節。

## 這篇會講到

- 為什麼需要這個概念（從上一篇沒解決的問題接過來）
- 從零開始的 hands-on 範例
- 新手最常踩的坑與排錯
- 重點整理 + 下一篇預告

繼續學習其他章節，回到 [K8s 教學首頁](/blog#k8s)。
`;

export const k8sLessons: K8sLesson[] = [
  // ====== Group 1: basics — 入門基礎（對應第 4 堂上午）======
  {
    slug: 'kubernetes-intro',
    order: 1,
    group: 'basics',
    title: 'Kubernetes 是什麼？為什麼 Docker 不夠用，需要 K8s？',
    excerpt:
      '一個容器跑得很順，但十個、一百個怎麼管？這就是 Docker 撐不住、Kubernetes 登場的原因。這篇用最白話的方式講清楚 K8s 解決什麼問題、跟 Docker 是什麼關係，新手第一篇就看這個。',
    publishDate: '2026-04-28',
    tags: ['Kubernetes', '入門', 'Docker', 'K8s 是什麼'],
    readingTime: 9,
    content: `
## 先從一個真實場景開始

想像你在一間電商公司上班，你的系統長這樣：

- 前端網站
- 後端 API
- MySQL 資料庫
- Redis 快取
- 訊息佇列

一開始用 Docker，每個服務 \`docker run\` 一下就好了，幾分鐘搞定。後來流量大了，每個服務要跑 3 份分散流量。再加上測試環境、預備環境，**全部加起來可能要 30 個容器**。

雙十一來了，流量翻五倍。你打開 SSH，準備一台一台機器去 \`docker run\`，腦袋已經開始痛了。然後**其中一台機器掛了**，上面 12 個容器全沒了。你還沒搞清楚怎麼修，**老闆問你版本要怎麼更新才不中斷服務**。

這時候 Docker 一個指令救不了你了。**這就是 Kubernetes 存在的理由**。

## Docker Compose 不能幫忙嗎？

可以——但只限一台機器。

| 容器數量 | 適合的工具 | 為什麼 |
|---|---|---|
| 1~5 個 | \`docker run\` | 手動跑就夠 |
| 5~20 個 | Docker Compose | 一份 \`docker-compose.yml\` 全部起 |
| 跨多台機器 / 上百容器 | **Kubernetes** | Compose 做不到的全部都做得到 |

Docker Compose 的設計就是「**單機**多容器管理工具」。**跨機器、自動故障恢復、自動擴縮容**——這三件事它通通做不到，但生產環境又通通需要。

## Kubernetes 解決哪 5 個問題？

K8s（K + 8 個字母 + s = Kubernetes，因為太長了所以縮寫）的核心職責就是這 5 件事：

| 問題 | Docker 怎麼處理 | K8s 怎麼處理 |
|---|---|---|
| **調度**：容器該放哪台機器？ | 你自己 SSH 上去跑 | Scheduler 自動挑空閒的機器 |
| **故障恢復**：機器掛了上面的容器怎辦？ | 你自己重新部署 | 自動把容器搬到其他健康的機器重建 |
| **彈性擴縮**：流量來了要加容器 | 手動 \`docker run\` 多開 | 一行指令把 3 份擴成 10 份，甚至看 CPU 自動擴 |
| **滾動更新**：升級版本不能停機 | 自己寫腳本一個一個換 | 內建滾動更新，零停機 |
| **服務發現**：容器之間怎麼互找？ | IP 寫死，IP 變了就掛 | 內建 DNS，用名字找 |

**重點：K8s 不是取代 Docker，是「管理一堆 Docker 容器的平台」**。Docker 還在，只是現在多了一個老闆叫 K8s。

## K8s 是怎麼來的？

不是純學術產物，是 Google 用了 15 年的 Borg 系統「整理重寫」開源出來的。

- **2003**：Google 內部用 Borg 管理數十億容器
- **2014**：Google 把 Borg 的經驗整理成開源版本，取名 Kubernetes（希臘語「舵手」的意思）
- **2015**：捐給 CNCF（Cloud Native Computing Foundation）
- **2026 年的今天**：AWS、Azure、GCP、阿里雲全部支援，**已經是業界標準**

換句話說，你學 K8s **不是學一個工具，是學一個產業共識**。

## Docker vs K8s：到底差在哪？

最常被問的問題，直接給結論：

> **Docker 解決「怎麼跑一個容器」,K8s 解決「怎麼跑一堆容器還要它們互相溝通、自動修復、自動擴縮」**。

兩個不是替代關係，是搭配關係：

\`\`\`
Docker:  把應用打包成容器     ── 製造業
K8s:     管理一堆容器在叢集跑   ── 物流業
\`\`\`

實務上的工作流程：

1. **開發階段**:用 Docker 寫 Dockerfile、build image
2. **部署階段**:把 image 推到 registry,寫 K8s YAML 告訴 K8s 怎麼跑

如果你還沒用過 Docker,先把 Docker 學會再來 K8s。**沒有 Docker 基礎直接學 K8s 會很痛**,因為 K8s 的最小單位 Pod 就是「容器的延伸」，不懂容器看 Pod 會卡。

## 你會在哪些地方遇到 K8s？

- **雲端服務**:AWS EKS、GCP GKE、Azure AKS,都是託管 K8s
- **自架伺服器**:用 kubeadm、k3s、k3d、minikube 自己裝
- **開發機**:用 minikube 或 k3d 在本機跑「迷你 K8s」練習
- **CI/CD**:GitLab Runner、GitHub Actions 的執行環境很多就是 K8s

**一句話**:只要你公司規模超過 10 個工程師、後端服務超過 5 個，九成機率會用到 K8s。

## 學 K8s 真的有那麼難嗎？

老實講——**前 3 天很痛，過了第 4 天就會覺得「啊就這樣」**。

K8s 的痛點不是抽象，是「概念多」:Pod、Deployment、Service、Ingress、ConfigMap、Secret、Volume、StatefulSet... 一口氣丟給你會爆。

但這些概念**有清楚的因果鏈**——每一個都是「上一個解決不了的問題」才出現的：

\`\`\`
Pod        ← 容器要包一層
Service    ← Pod IP 會變，要穩定的入口
Ingress    ← Service 網址醜，要域名
ConfigMap  ← 設定不能寫死在 image 裡
Secret     ← 密碼不能明文
Volume     ← Pod 重啟資料就消失
Deployment ← Pod 自己掛了不會自動補
StatefulSet← DB 這種有狀態的服務需要固定身份
\`\`\`

**順著因果鏈學，就不會亂**。這也是這個系列的鋪陳方式——從第 1 篇到第 40 篇，每一篇都是上一篇沒解決的問題引出來的。

## 重點整理

- **Docker 撐不住的場景**:跨機器、故障恢復、彈性擴縮容、滾動更新、服務發現——這 5 件事 Docker Compose 一個都不會
- **K8s 是 Google Borg 的開源版**,現在是業界標準
- **Docker 跟 K8s 不是二選一**,是上下游搭配
- **K8s 看起來概念多，但全部都有因果關係**——順著學就不會迷路

## 下一步

如果你還沒用過 Docker,先去學 Docker。如果 Docker 已經 OK 了，下一篇我們會用一張圖把 [Docker 跟 K8s 的差別](/blog/k8s/docker-vs-kubernetes) 講得更清楚，讓你**回家可以用 30 秒跟同事解釋**這兩個東西的關係。

> 📅 **下一篇（2026-04-29 已上線）**：[Docker 和 Kubernetes 差在哪？一張圖看懂兩者關係](/blog/k8s/docker-vs-kubernetes)
> 用最簡單的比喻：Docker 把應用裝箱、K8s 是貨運公司，兩個一起用才完整。

> 📚 **完整系列總覽**：[K8s 系列教學首頁](/blog/#k8s)（共 40 課，按學習路徑順序排）
`,
  },
  {
    slug: 'docker-vs-kubernetes',
    order: 2,
    group: 'basics',
    title: 'Docker 和 Kubernetes 差在哪？一張圖看懂兩者關係',
    excerpt:
      'Docker 是打包工具、K8s 是管理工具，兩個不是替代關係，是搭配關係。這篇用最簡單的比喻講清楚：Docker 把應用裝箱、K8s 是貨運公司，兩個一起用才完整。',
    publishDate: '2026-04-29',
    tags: ['Docker', 'Kubernetes', '比較', '差別'],
    readingTime: 7,
    content: `
## 最常被問的問題：Docker 跟 K8s 是不是二選一？

**不是**。這個誤解害很多人學 K8s 學得很痛。

一句話講清楚：

> **Docker 是「打包工具」，K8s 是「管理工具」。Docker 把應用變成容器，K8s 負責把這些容器跑在叢集上**。

兩個是上下游，**全部都要會**。

## 一張圖看懂兩者關係

\`\`\`
[ 開發階段 ]                 [ 部署階段 ]

寫 Dockerfile      ─────►   寫 K8s YAML
docker build               kubectl apply
docker push                ↓
↓                          K8s 把容器跑在叢集上
產出 image                  ↓
                          自動處理：調度 / 擴縮 / 故障恢復 / 滾動更新
   Docker                    Kubernetes
   做的事                     做的事
\`\`\`

開發人員寫 Dockerfile 把程式打包成 image，然後把 image 推到 registry（Docker Hub、ECR 等）。**K8s 從 registry 拉 image，把它跑成容器**——這就是兩者的銜接點。

## 比喻：Docker 是裝箱、K8s 是貨運公司

| 角色 | 對應到 Docker | 對應到 K8s |
|---|---|---|
| 工廠 | 寫程式（你的 source code） | — |
| 裝箱 | Dockerfile + docker build | — |
| 貨櫃 | image | — |
| 運送 | docker run（一個一個運） | K8s（一次運一整批） |
| 倉儲管理 | — | K8s（哪個貨櫃放哪、壞了換哪個） |
| 配送調度 | — | K8s（流量大就多派幾台） |

Docker 把「應用程式」變成可以重複部署的標準化貨櫃。K8s 是管理一堆貨櫃的物流系統。**沒有貨櫃就沒有東西可以運，沒有物流就只有一堆貨櫃堆在角落**。

## 功能對照表

直接列給你看，差別在哪一目了然：

| 能力 | Docker / Compose | Kubernetes |
|---|---|---|
| 跑一個容器 | ✅ \`docker run\` | ✅ Pod |
| 多容器組合 | ✅ docker-compose.yml（單機） | ✅ Deployment + Service（跨機） |
| 跨多台機器 | ❌ | ✅ |
| 自動擴縮容 | ❌ | ✅（HPA） |
| 自動故障恢復 | ❌ | ✅（Controller Manager） |
| 滾動更新 | ❌（要自己寫腳本） | ✅ 內建 |
| 服務發現 | ❌（IP 寫死） | ✅ DNS |
| 設定管理 | 環境變數 | ✅ ConfigMap / Secret |
| 持久化儲存 | volume | ✅ PV / PVC |

**Docker Compose 在「單機跑多容器」這件事上很強，但生產環境一定是跨機器**——這時候 Compose 就力不從心，K8s 的全部功能才開始發揮。

## 那 K8s 底層用什麼跑容器？

這個是進階問題，但很多人會搞混所以先講：

K8s 不直接用 Docker Engine，而是用 **containerd** 或 **CRI-O** 這類「Container Runtime」。有趣的是，**Docker Engine 底下也是用 containerd**——containerd 才是真正做事的那個。

\`\`\`
你寫 Dockerfile → docker build → image
                                   ↓
                  K8s 拿 image → containerd → 跑成容器
\`\`\`

Docker 在 K8s 世界的角色是「**製造 image 的工具 + 開發階段的測試環境**」，**生產環境跑的不是 Docker，是 containerd**。但你寫的 Dockerfile、build 出來的 image，K8s 100% 都吃。

## 工作流程：開發到上線

實際工作中你會這樣用兩者：

1. **本地開發**：用 Docker
   - 寫 Dockerfile
   - \`docker build\` 出 image
   - \`docker run\` 在本機測試
2. **推到 Registry**：
   - \`docker push\` 把 image 傳上去
3. **K8s 拉去跑**：
   - 寫 YAML 告訴 K8s 怎麼跑（要幾份、開哪個 port、用什麼設定）
   - \`kubectl apply\` 部署到叢集
   - K8s 自動處理排程、健康檢查、滾動更新

**Docker 跟 K8s 的銜接點就在 image 這個東西**。

## 學習順序：先 Docker、再 K8s

我給新手最常見的建議：

- **沒碰過 Docker 直接學 K8s** → 你會卡在 Pod。Pod 是「容器的延伸」，沒有容器概念看 Pod 會一頭霧水。
- **Docker 已經 OK 了** → 直接學 K8s，會發現很多概念其實 Docker 已經教過你了，只是規模放大。

最低門檻：你要會寫 Dockerfile、會 \`docker run\`、知道什麼是 image、什麼是 container、什麼是 volume。**這四件事 OK 就可以開始學 K8s**。

## 30 秒跟同事解釋的版本

如果同事問你 Docker 跟 K8s 差在哪，你可以這樣講：

> 「Docker 是把應用程式打包成容器的工具，每個容器就像一個迷你的 Linux。K8s 是管理一大堆容器的平台，負責把容器跑在好幾台機器上、流量大了自動加機器、機器掛了自動搬。Docker 是基礎，K8s 是放大版的管理者，兩個都要會。」

## 重點整理

- **Docker 解決「怎麼把應用變成容器」**，K8s 解決「**怎麼管一堆容器**」
- **不是替代關係，是上下游關係**——image 是兩者的銜接
- **單機用 Docker Compose、跨機用 K8s**——這是最簡單的判斷標準
- **K8s 底層的 Container Runtime 通常是 containerd**，但你寫的 Dockerfile 完全相容
- **學 K8s 之前 Docker 一定要會**，不然會卡在 Pod 概念

## 下一步

知道兩者關係後，下一篇我們把 [K8s 的 8 個核心概念一次搞懂](/blog/k8s/k8s-eight-concepts-overview)——Pod、Service、Ingress、ConfigMap、Secret、Volume、Deployment、StatefulSet 全部用因果鏈串起來，**看完一張表就記住**。

> 📅 **下一篇（2026-04-30 已上線）**：[K8s 八大核心概念總覽](/blog/k8s/k8s-eight-concepts-overview)
> 一次看懂 8 個 K8s 名詞，每個都是因為「上一個解決不了」才出現，用因果鏈串起來最好記。

> 📚 **完整系列總覽**：[K8s 系列教學首頁](/blog/#k8s)（共 40 課，按學習路徑順序排）
`,
  },
  {
    slug: 'k8s-eight-concepts-overview',
    order: 3,
    group: 'basics',
    title: 'K8s 八大核心概念總覽：Pod、Service、Ingress、ConfigMap、Secret、Volume、Deployment、StatefulSet',
    excerpt:
      '一次看懂 K8s 最常出現的 8 個名詞。每個都是因為「上一個解決不了」才出現的，用因果鏈串起來最好記。',
    publishDate: '2026-04-30',
    tags: ['Kubernetes', '概念', 'Pod', 'Service', 'Deployment'],
    readingTime: 10,
    content: `
## 第一次看 K8s 文件，被名詞淹沒？

打開 Kubernetes 官方文件，扣除 install / cluster admin 的部分，光是「核心物件」就有 **30+ 個名詞**。新手第一個反應通常是：

> 「這個我不用學一年嗎？」

**不用**。實務上你 80% 的時間只會用到 8 個概念。這篇把這 8 個一次列清楚，**用因果鏈串起來最好記**。

## 因果鏈：一個解決不了，下一個就出現

K8s 的概念不是隨機堆疊的，是「上一個解決不了的問題」催生下一個。順著這條鏈看：

\`\`\`
問題：怎麼跑容器？
 └─► Pod（容器的包裝）

問題：Pod 會掛、IP 會變，怎麼穩定存取？
 └─► Service（穩定的入口）

問題：Service 是 IP:Port 醜爆，要域名怎麼辦？
 └─► Ingress（HTTP 路由器）

問題：DB 地址寫死在 image 裡，每次改要重 build？
 └─► ConfigMap（外部化設定）

問題：密碼放 ConfigMap 是明文，洩漏怎麼辦？
 └─► Secret（敏感資料管理）

問題：Pod 重啟資料就消失，DB 怎麼辦？
 └─► Volume（資料持久化）

問題：Pod 自己掛了不會自動補，怎辦？
 └─► Deployment（管副本 + 自我修復）

問題：DB 每個副本要有獨立身份和儲存，Deployment 不行
 └─► StatefulSet（有狀態應用）
\`\`\`

每一行都是「**前一個工具不夠用**」推出下一個。**順著這條鏈學，不會迷路**。

## 八大概念一句話定義

| # | 概念 | 一句話 | 對照 Docker |
|---|---|---|---|
| 1 | **Pod** | 一個或多個容器的包裝，K8s 最小調度單位 | \`docker run\` 一個容器 |
| 2 | **Service** | 一組 Pod 的穩定入口，帶負載均衡 | \`-p\` port mapping + DNS |
| 3 | **Ingress** | HTTP/HTTPS 路由器，依域名/路徑分流 | nginx 反向代理 |
| 4 | **ConfigMap** | 設定檔（明文，不放密碼） | \`-e ENV=value\` |
| 5 | **Secret** | 敏感資料（Base64 編碼，配合 RBAC） | \`.env\` 檔 |
| 6 | **Volume** | 資料持久化，掛在 Pod 外 | \`docker volume\` |
| 7 | **Deployment** | 無狀態應用副本管理 + 滾動更新 | \`compose --scale\` |
| 8 | **StatefulSet** | 有狀態應用（DB），固定身份+獨立儲存 | Docker 沒對應 |

不要每個都背細節，**先背「白話定義」+「Docker 對照」**，等實作的時候再補細節。

## 它們之間怎麼組合？

實際部署一個系統，這 8 個會這樣組起來：

\`\`\`
                        外部使用者
                            ↓
                       【 Ingress 】
                       域名/路徑路由
                            ↓
                      【 Service 】
                      穩定 IP + 負載均衡
                            ↓
              ┌─────────────────────────┐
              │     【 Deployment 】      │
              │     管 3 個 Pod 副本      │
              │   ┌──────────────────┐  │
              │   │ Pod  Pod  Pod    │  │
              │   └──┬──────────┬────┘  │
              └──────┼──────────┼───────┘
                     │          │
                【ConfigMap】 【Secret】
                  設定         密碼
                     │          │
                  【Volume】
                  持久化資料
\`\`\`

**讀法**：使用者打 \`https://app.example.com\` → Ingress 接到 → 轉給 Service → Service 隨機派給其中一個 Pod → Pod 用 ConfigMap 拿設定、用 Secret 拿密碼、把資料寫到 Volume。

## 這 8 個概念的「重要性順序」

如果你只能花 1 週學，這是優先順序：

1. **Pod**（最基礎，所有東西都建立在這上面）
2. **Deployment**（90% 的應用都用 Deployment 部署）
3. **Service**（部署完一定要讓人連得到）
4. **ConfigMap + Secret**（設定管理，幾乎一定會用）
5. **Volume**（DB / 檔案上傳一定要）
6. **Ingress**（對外網址，生產環境必備）
7. **StatefulSet**（DB 才用得到，不急）

**前 3 個是核心**，懂了就能跑起一個服務。其他 5 個是「碰到再學」，不用一次學完。

## 還有哪些「不在這 8 個裡」的常見東西？

順便把另外幾個常聽到的列出來，**不是核心但會遇到**：

- **Namespace**：環境隔離（dev / staging / prod 切開）
- **Node**：機器本身（叢集裡每一台實體機/VM）
- **Job / CronJob**：跑一次性任務 / 定時任務
- **DaemonSet**：每台 Node 一定要跑一份的（log 收集 agent 之類）
- **HPA**（Horizontal Pod Autoscaler）：自動擴縮容
- **RBAC**：權限管理
- **PV / PVC**：Volume 的「實體」與「申請書」

這些後面的文章會逐一展開。**現在記得名字就好**。

## 學的時候千萬不要做的事

1. **不要一口氣把 30 個概念全背完** → 會忘光
2. **不要直接看 Helm chart** → Helm 是把上面這些東西打包，沒看過原型直接看打包的會更亂
3. **不要跳過 Pod 直接學 Service** → 不懂 Pod 連 Service 都看不懂
4. **不要在心裡幻想架構，要動手寫 YAML** → 概念看 10 篇文章不如實作 1 次

## 重點整理

- K8s 概念多但**有清楚因果鏈**：每個都是前一個解決不了才出現
- **8 個核心概念**：Pod / Service / Ingress / ConfigMap / Secret / Volume / Deployment / StatefulSet
- **學習優先順序**：Pod → Deployment → Service 是最重要的三個
- **Docker 對照表**幫助記憶——80% 的概念在 Docker 都有對應或類似的東西

## 下一步

知道有哪 8 個了，下一篇先看 [K8s 整體架構：Master 和 Worker 在做什麼](/blog/k8s/k8s-architecture-master-worker)——把這 8 個概念跑在「叢集裡」是怎麼一回事，**API Server / Scheduler / Controller / kubelet 各司其職**搞清楚。

> 📅 **下一篇（2026-05-01 已上線）**：[Kubernetes 架構：Master Node 和 Worker Node 在做什麼？](/blog/k8s/k8s-architecture-master-worker)
> 用「公司組織」比喻講清楚 API Server / Scheduler / Controller / kubelet 各自的職責。

> 📚 **完整系列總覽**：[K8s 系列教學首頁](/blog/#k8s)（共 40 課，按學習路徑順序排）
`,
  },
  {
    slug: 'k8s-architecture-master-worker',
    order: 4,
    group: 'basics',
    title: 'Kubernetes 架構：Master Node 和 Worker Node 在做什麼？',
    excerpt:
      'K8s 是一個叢集（cluster），裡面有兩種角色：Master 負責下指令、Worker 負責跑容器。這篇用「公司組織」比喻講清楚 API Server / Scheduler / Controller / kubelet 各自的職責。',
    publishDate: '2026-05-01',
    tags: ['Kubernetes', '架構', 'Master', 'Worker', 'API Server'],
    readingTime: 9,
    content: `
## 為什麼要懂 K8s 架構？

新手常見的疑問：

> 「我會 \`kubectl apply -f xxx.yaml\`，這樣不夠嗎？要懂底層架構幹嘛？」

**會用 yaml 是 30 分，懂架構是 70 分**。差別在這裡：

- 不懂架構：Pod 卡在 \`Pending\` 你只會盯著螢幕
- 懂架構：你會看 events、檢查 scheduler、看 node 狀態，**3 分鐘定位**

而且 K8s 出問題時，9 成是「**某個組件沒回應**」——不知道組件有哪些，根本不知道從哪裡查。

## K8s 架構：Master + Worker

K8s 是一個**叢集**（cluster），由兩種角色的機器組成：

\`\`\`
┌──────────────── 整個 K8s 叢集 ────────────────┐
│                                                │
│   Master Node                                  │
│   ┌────────────────────────┐                  │
│   │ 「決策層」（管理者）       │                  │
│   │  • 決定 Pod 跑哪台        │                  │
│   │  • 監控所有資源狀態        │                  │
│   │  • 接收 kubectl 指令      │                  │
│   └────────────────────────┘                  │
│                                                │
│   Worker Node 1   Worker Node 2   Worker N    │
│   ┌──────────┐    ┌──────────┐    ┌────────┐ │
│   │「執行層」  │    │「執行層」  │    │「執行層」│ │
│   │  跑 Pod   │    │  跑 Pod   │    │ 跑 Pod  │ │
│   └──────────┘    └──────────┘    └────────┘ │
└────────────────────────────────────────────────┘
\`\`\`

**比喻**：
- Master Node = 公司管理層（決策、調度、監控）
- Worker Node = 員工（實際執行工作）
- kubectl = 你發給管理層的工作單

**重點**：你的應用程式跑在 Worker，不是 Master。Master 不跑你的東西，它的工作就是「管理」。

## Master Node 上的四大組件

Master 上有 4 個組件，缺一個叢集就掛：

### 1. API Server — 叢集的大門

**職責**：所有請求的唯一入口。

\`\`\`
你 ──► kubectl ──► API Server ──► 其他組件
\`\`\`

不管是你打 \`kubectl get pods\`、Dashboard 點按鈕、還是組件之間互通，**全部都要先走 API Server**。它做三件事：

- **驗證身份**（你是誰？token 有效嗎？）
- **檢查權限**（你能不能做這件事？RBAC）
- **轉發請求 + 寫狀態到 etcd**

比喻：公司大門 + 接待處 + 保全。

### 2. etcd — 叢集的大腦

**職責**：儲存整個叢集的狀態。

etcd 是一個 key-value 資料庫（類似 Redis 但保證一致性）。它記了：

- 叢集裡有哪些 Node、狀態如何
- 部署了哪些 Pod、跑在哪台 Node、健康嗎
- 你定義的所有 Deployment / Service / ConfigMap...

**重要：etcd 只存「叢集狀態」，不存你的應用資料**。MySQL 裡的訂單不會跑到 etcd。

備份 etcd = 備份整個叢集設定。**etcd 掛了 = 叢集記憶喪失**，是正式環境最重要的備份對象。

### 3. Scheduler — 調度員

**職責**：新 Pod 該分配到哪個 Worker？

當你建立一個 Pod，Scheduler 會：

1. 列出所有 Node 的資源狀況（CPU、記憶體還剩多少）
2. 過濾掉「裝不下」的 Node（資源不夠）
3. 在剩下的 Node 裡挑一個最適合的（負載最低）
4. 把這個決定寫回 etcd

**例**：Node A 用了 80% CPU、Node B 用了 20% → 新 Pod 派給 Node B。

新手最常見的錯：以為 Pod 卡在 \`Pending\` 是 Pod 壞了，**通常是 Scheduler 找不到合適的 Node**（資源不夠 / nodeSelector 沒節點符合 / 有 taint）。

### 4. Controller Manager — 自我修復的引擎

**職責**：持續監控「現狀 vs 期望」是否一致，不一致就修。

\`\`\`
你說：「我要 3 個 nginx Pod」（期望狀態，存 etcd）
Controller Manager 一直在問：「現在真的有 3 個嗎？」
  ├─ 有 → 沒事
  └─ 只剩 2 個（一個掛了）→ 通知 Scheduler 補一個
\`\`\`

K8s 的「**自我修復**」、「**自動擴縮容**」、「**滾動更新**」全部都是 Controller Manager 在背後做。

它裡面有很多種 Controller：Deployment Controller、ReplicaSet Controller、Node Controller、Job Controller... 每個負責一種資源。

## Worker Node 上的三大組件

Worker 上的組件比較少，3 個：

### 1. kubelet — 節點管家

**職責**：管理這個 Node 上的所有 Pod。

\`\`\`
API Server: 「kubelet，幫我在你的 Node 上跑一個 nginx Pod」
kubelet:    「收到」── 呼叫 Container Runtime 把容器跑起來
            （定時回報 Pod 健康狀態給 API Server）
\`\`\`

**比喻**：每個 Worker 上的「值班 leader」，接收指令、回報狀況。

### 2. Container Runtime — 真正跑容器的引擎

**職責**：拉 image、建容器、啟停容器。

K8s 不直接跑容器，它叫 Container Runtime 去跑。常見的：

- **containerd**（K8s 主流，輕量）
- **CRI-O**（Red Hat 系統用）
- **Docker Engine**（早期支援，1.24 後移除直接支援）

**注意**：Docker Engine 的底層也是用 containerd，所以 Docker 跟 K8s 不衝突，**只是 K8s 直接用 containerd 更輕量**。

### 3. kube-proxy — 網路轉發

**職責**：實作 Service 的網路規則（讓 Service 真正能用）。

當你建立一個 Service，kube-proxy 在每個 Node 上維護一張轉發表：

\`\`\`
Service 10.0.0.5:80 → 後端 Pod IP1:8080 / Pod IP2:8080 / Pod IP3:8080
\`\`\`

請求進到 Service 的虛擬 IP，kube-proxy 把它**負載均衡**轉到後端某個 Pod。

技術上是用 iptables 或 IPVS 實作的——不用記細節，知道「Service 能轉發是 kube-proxy 的功勞」就夠。

## 一個完整流程：你打了 \`kubectl apply\` 之後發生什麼

\`\`\`
你輸入：kubectl apply -f deployment.yaml（要 3 個 nginx Pod）

1️⃣ kubectl  ────► API Server
   送請求過去

2️⃣ API Server
   驗證身份 + 權限 → 通過
   把「要 3 個 nginx Pod」寫進 etcd

3️⃣ Deployment Controller（在 Controller Manager 裡）
   發現有個新 Deployment → 建立 ReplicaSet
   ReplicaSet Controller 發現要 3 個 Pod → 建 3 個 Pod 物件

4️⃣ Scheduler
   發現有 3 個 Pod 還沒分配 Node
   挑 Node：Pod-1 → Node-A, Pod-2 → Node-B, Pod-3 → Node-C
   把決定寫回 etcd

5️⃣ kubelet（各 Node 上的）
   發現 etcd 說「你要跑這個 Pod」
   呼叫 Container Runtime → 拉 image → 跑容器
   回報「Pod Running」給 API Server

6️⃣ Controller Manager
   持續監控：3 個 Pod 都活著嗎？
   有一個掛了 → 立刻補新的
\`\`\`

**整個流程平均 5~10 秒**。中間任何一個組件掛了都會卡住。

## 怎麼親眼看到這些組件？

K8s 自己的組件就是用 Pod 跑的，住在 \`kube-system\` namespace：

\`\`\`bash
kubectl get pods -n kube-system
\`\`\`

你會看到：

- coredns（叢集內 DNS）
- kube-proxy（每個 Node 一份）
- kube-apiserver（API Server 本身）
- kube-scheduler
- kube-controller-manager
- etcd

**對，連 K8s 自己也是用 K8s 在管自己**。這個叫「**自舉（self-hosted）**」設計。

## 重點整理

- K8s = **Master 管理層 + Worker 執行層**，叢集架構
- **Master 4 組件**：API Server（大門）+ etcd（資料庫）+ Scheduler（調度）+ Controller Manager（自我修復）
- **Worker 3 組件**：kubelet（管家）+ Container Runtime（跑容器）+ kube-proxy（網路）
- 你打 \`kubectl apply\` 走完整個流程：**API Server → etcd → Controller → Scheduler → kubelet → Container Runtime**
- **不懂架構排錯會很痛**——Pod Pending 通常是 Scheduler 問題、Pod 起不來通常是 kubelet 拉不到 image

## 下一步

架構懂了，但目前都是紙上談兵。下一篇我們**真的把 K8s 裝起來**：[k3d 跟 minikube 怎麼選？新手安裝指南](/blog/k8s/k3d-vs-minikube-local-setup) ——本機跑一個迷你 K8s 叢集，跟著做後面所有實戰。

> 📅 **下一篇（2026-05-02 已上線）**：[本地裝 K8s：k3d 與 minikube 怎麼選？新手安裝指南](/blog/k8s/k3d-vs-minikube-local-setup)
> k3d 輕量快、minikube 老牌穩，實測比較加完整安裝步驟（macOS / Windows / Linux）。

> 📚 **完整系列總覽**：[K8s 系列教學首頁](/blog/#k8s)（共 40 課，按學習路徑順序排）
`,
  },
  {
    slug: 'k3d-vs-minikube-local-setup',
    order: 5,
    group: 'basics',
    title: '本地裝 K8s：k3d 與 minikube 怎麼選？新手安裝指南',
    excerpt:
      '想練習 K8s 不用買雲端，本地就能裝。k3d 輕量快、minikube 老牌穩，這篇實測比較給你建議，附完整安裝步驟（macOS / Windows / Linux）。',
    publishDate: '2026-05-02',
    tags: ['Kubernetes', 'k3d', 'minikube', '本地安裝', 'k3s'],
    readingTime: 8,
    content: `
## 學 K8s 不一定要花錢開雲端

新手常見誤會：「**K8s 不是要好多台機器嗎？我哪有錢？**」

事實是：**本地一台筆電就能跑完整 K8s 叢集**。市面上有好幾個工具讓你在本機跑「迷你版 K8s」，學習練手綽綽有餘。最熱門的兩個：

- **minikube** — 老牌、文件多、社群大
- **k3d** — 輕量、啟動快、可以跑多節點

兩個我都用過，這篇直接給你結論 + 實測比較 + 安裝步驟。

## 一句話結論

**新手 / 跟教學文做** → minikube\
**進階 / 想模擬多節點** → k3d\
**完全不知道選哪個** → minikube，因為網路上絕大多數教學是用 minikube

不會錯的選擇就是 minikube。但 k3d 真的快很多，**用過就回不去**。

## 實測比較表

我在 M2 MacBook Air 16GB 跑了一輪：

| 項目 | minikube | k3d |
|---|---|---|
| **啟動時間** | 50–90 秒 | **5–15 秒** ⚡ |
| **記憶體佔用** | ~2 GB | **~500 MB** |
| **預設 Driver** | docker / virtualbox / hyperkit | **docker** |
| **多節點支援** | 1 個指令加 \`--nodes=N\` | 1 個指令加 \`--agents=N\` |
| **內建 Ingress Controller** | 要 \`addons enable ingress\` | **預設就有 traefik** |
| **內建 Dashboard** | \`minikube dashboard\` 一鍵開 | 沒有，要自己裝 |
| **跟 Docker 整合** | 共用 Docker Daemon 較複雜 | **直接用本機 Docker** |
| **教學文件量** | ⭐⭐⭐⭐⭐（超多） | ⭐⭐⭐（夠用） |
| **社群活躍** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

**我的看法**：學習階段用 minikube，因為大部分教學文可以直接照抄。**熟了之後換 k3d**，啟動快、佔資源少，每天工作幾十次重啟叢集差距巨大。

## minikube 是什麼？

K8s 官方主推的「**單節點模擬叢集**」工具。它在你的本機跑一個 VM 或 Docker 容器，裡面塞一整套 K8s。

特色：

- **Master + Worker 合在同一個節點**（單機模擬叢集）
- 底層 Driver 可選：docker、virtualbox、hyperkit、podman、kvm2
- **Addons 機制**：dashboard、ingress、metrics-server 一行指令安裝
- 文件超完整，新手友善

**限制**：
- 預設單節點，多節點要加參數但效率不如 k3d
- 啟動慢（VM 要起來）

## k3d 是什麼？

把 **k3s（Rancher 的輕量 K8s）** 包進 Docker 容器跑的工具。一個 Node = 一個 Docker container，**所以開叢集快得不可思議**。

特色：

- **超輕量**——k3s 把 K8s 砍掉很多生產用不到的東西，記憶體佔用是 minikube 的 1/4
- **多節點原生支援**——\`--agents=3\` 直接給你 3 個 Worker
- 用 Docker 跑，不用 VM，**啟動秒級**
- **預設裝 traefik**（Ingress Controller），不用額外設定就有 Ingress

**限制**：
- 教學文件比 minikube 少
- 一些 K8s 功能 k3s 砍掉了（一般學習用不到，但要知道）

## minikube 安裝步驟

### macOS

\`\`\`bash
# 用 brew
brew install minikube

# 啟動
minikube start

# 驗證
kubectl get nodes
\`\`\`

第一次啟動會下載 K8s image，可能要 1~2 分鐘。

### Windows

\`\`\`powershell
# 用 winget
winget install Kubernetes.minikube

# 或用 chocolatey
choco install minikube

# 啟動
minikube start --driver=docker
\`\`\`

**注意**：Windows 建議先裝好 Docker Desktop，並用 \`--driver=docker\` 啟動。

### Linux

\`\`\`bash
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

minikube start --driver=docker
\`\`\`

### 常用指令

\`\`\`bash
minikube status          # 看叢集狀態
minikube stop            # 暫停（保留狀態）
minikube delete          # 完全刪除（重來一次）
minikube dashboard       # 打開圖形介面
minikube addons enable ingress    # 裝 Ingress Controller
\`\`\`

## k3d 安裝步驟

### macOS

\`\`\`bash
brew install k3d

# 建立叢集（1 master + 2 worker）
k3d cluster create mycluster --agents 2

# 驗證
kubectl get nodes
\`\`\`

### Windows

\`\`\`powershell
# 用 chocolatey
choco install k3d

# 或下載 release
# https://github.com/k3d-io/k3d/releases

k3d cluster create mycluster --agents 2
\`\`\`

### Linux

\`\`\`bash
curl -s https://raw.githubusercontent.com/k3d-io/k3d/main/install.sh | bash

k3d cluster create mycluster --agents 2
\`\`\`

### 常用指令

\`\`\`bash
k3d cluster list                       # 列叢集
k3d cluster stop mycluster             # 暫停
k3d cluster delete mycluster           # 刪除
k3d cluster create mycluster \\
  --agents 3 \\
  --port "8080:80@loadbalancer"        # 把 Ingress 80 port mapping 到本機 8080
\`\`\`

## 安裝完先做這 3 個檢查

不管 minikube 還是 k3d，裝完先跑這三個指令確認：

\`\`\`bash
# 1. Node 是 Ready
kubectl get nodes
# NAME       STATUS   ROLES           AGE   VERSION
# minikube   Ready    control-plane   1m    v1.28.x

# 2. 系統 Pod 都活著
kubectl get pods -n kube-system
# 應該全部 Running

# 3. 跑一個 nginx 測試
kubectl run test-nginx --image=nginx
kubectl get pods
# 應該 1~2 秒看到 Running
kubectl delete pod test-nginx
\`\`\`

**這三個過了，叢集就 100% 可用**。後面所有教學就靠它。

## 常見坑

1. **Docker Desktop 沒開** → minikube / k3d 都會起不來
2. **記憶體不夠** → minikube 預設要 2 GB，可以 \`minikube start --memory=4096\` 加大
3. **k3d port mapping 沒設** → Ingress 通了但本機連不到，因為沒把 port 映射出來
4. **Apple Silicon (M 系列) 用 virtualbox** → 不支援，要用 \`--driver=docker\` 或 \`--driver=hyperkit\`

## 我自己的選擇

**寫教學、做 demo** → minikube\
（因為 reader 大部分用 minikube，文件可以照抄）

**個人開發、寫 K8s YAML 練手** → k3d\
（每天 \`k3d cluster delete && create\` 試各種設定，5 秒重啟省時間）

兩個都裝起來占不了多少空間，**我建議都裝**。需要哪個用哪個。

## 重點整理

- 學 K8s **不用花錢開雲端**，本機就能跑完整叢集
- **minikube**：老牌穩、文件多、新手首選
- **k3d**：輕量快、多節點方便、進階首選
- **新手別猶豫，先用 minikube**——絕大多數教學文都是用它
- 安裝完先跑「\`kubectl get nodes\` + \`kubectl get pods -n kube-system\` + 跑個 nginx」三個檢查

## 下一步

叢集裝起來了，下一篇我們**真的進去摸 K8s 肚子**：[\`kubectl get pods -n kube-system\` 在看什麼](/blog/k8s/kube-system-explore)——把架構圖上的組件，**一個一個在實際 Pod 列表裡找出來認**，看完你會對 K8s 有全新的認識。

> 📅 **下一篇（2026-05-03 已上線）**：[kubectl get pods -n kube-system 在看什麼？K8s 自己也是用 Pod 跑](/blog/k8s/kube-system-explore)
> 看 kube-system namespace 裡的 coredns / kube-proxy / traefik，等於看懂 K8s 自己怎麼運作。

> 📚 **完整系列總覽**：[K8s 系列教學首頁](/blog/#k8s)（共 40 課，按學習路徑順序排）
`,
  },
  {
    slug: 'kube-system-explore',
    order: 6,
    group: 'basics',
    title: 'kubectl get pods -n kube-system 在看什麼？K8s 自己也是用 Pod 跑',
    excerpt:
      'K8s 安裝完，先別急著部署應用，先看叢集本身。kube-system namespace 裡跑的 coredns、kube-proxy、traefik，是 K8s 自己的「五臟六腑」。看懂這些，等於看懂 K8s 怎麼運作。',
    publishDate: '2026-05-03',
    tags: ['Kubernetes', 'kube-system', 'kubectl', 'CoreDNS'],
    readingTime: 7,
    content: `
## K8s 怎麼跑自己的組件？

新手以為 API Server、Scheduler 是「裝在主機上的程式」。**錯**。

K8s 用一個非常優雅的設計：**它自己的核心組件也是 Pod**。全部住在一個叫 \`kube-system\` 的 namespace 裡。

這個叫「**自舉（self-hosting）**」——K8s 用 K8s 的方式管理自己。**看懂這件事，K8s 架構就完全打通**。

## 一行指令看到 K8s 的五臟六腑

裝好 minikube 或 k3d 之後（[沒裝看這篇](/blog/k8s/k3d-vs-minikube-local-setup)），打開終端機輸入：

\`\`\`bash
kubectl get pods -n kube-system
\`\`\`

\`-n\` 是 namespace 的縮寫，指定看 \`kube-system\` 這個系統 namespace。

如果你用 minikube，輸出大概長這樣：

\`\`\`
NAME                               READY   STATUS    AGE
coredns-5d78c9869d-xxxxx           1/1     Running   2m
etcd-minikube                      1/1     Running   2m
kube-apiserver-minikube            1/1     Running   2m
kube-controller-manager-minikube   1/1     Running   2m
kube-proxy-yyyyy                   1/1     Running   2m
kube-scheduler-minikube            1/1     Running   2m
storage-provisioner                1/1     Running   2m
\`\`\`

**驚不驚喜？這就是 K8s 的全部「核心組件」**——每一個都是 Pod。

## 一個一個來認

### 1. kube-apiserver — 大門

\`\`\`
kube-apiserver-minikube
\`\`\`

K8s 的唯一入口。所有 \`kubectl\` 指令、所有組件之間的溝通，**全部走它**。

它掛了 = 整個叢集失聯（其他組件還在跑，但你完全沒辦法操作）。

### 2. etcd — 大腦 / 資料庫

\`\`\`
etcd-minikube
\`\`\`

key-value 資料庫，記錄叢集所有狀態。

- 你建的每一個 Pod / Deployment / ConfigMap，**最終都存在這裡**
- 它掛了 = 叢集記憶喪失，所有狀態消失
- **正式環境最重要的備份對象**

### 3. kube-scheduler — 調度員

\`\`\`
kube-scheduler-minikube
\`\`\`

新 Pod 該跑在哪個 Node？由它決定。

它的工作就一件事：**看每個 Node 的資源狀況，挑最適合的**。

實務上你看到 Pod 卡 \`Pending\` 8 成都是 scheduler 找不到合適的 Node。

### 4. kube-controller-manager — 自我修復引擎

\`\`\`
kube-controller-manager-minikube
\`\`\`

K8s 的「自動駕駛」——一直比對「**現狀 vs 期望**」，不一致就修。

裡面有一堆 controller：

- Deployment Controller
- ReplicaSet Controller
- Node Controller
- Job Controller
- ...

**自我修復、自動擴縮容、滾動更新，全部是它做的**。

### 5. kube-proxy — 網路代理（每個 Node 一份）

\`\`\`
kube-proxy-yyyyy
\`\`\`

注意這個 Pod 名字不像其他組件帶 \`-minikube\`，因為它**每個 Node 都要跑一份**——所以是 DaemonSet 部署的。

它的工作：**讓 Service 真正能轉發請求**。

維護一張轉發表（用 iptables 或 IPVS）：

\`\`\`
Service 10.0.0.5:80
  ↓ kube-proxy 攔截
  └─► 隨機派給後端 Pod 1 / Pod 2 / Pod 3
\`\`\`

### 6. coredns — 叢集內部 DNS

\`\`\`
coredns-5d78c9869d-xxxxx
\`\`\`

K8s 的 DNS 服務。**讓 Pod 之間用「名字」互相找**。

\`\`\`
mysql.default.svc.cluster.local  → 解析成 → Service IP
\`\`\`

沒有它的話，Pod 只能用 IP 找對方——而 Pod IP 會變，整個系統就崩了。**coredns 是 Service 能用的關鍵**。

預設是 2 份（高可用），你會看到兩個 \`coredns-xxxxx\` Pod。

### 7. storage-provisioner — 動態 Volume 配置（minikube 專屬）

\`\`\`
storage-provisioner
\`\`\`

minikube 內建的，當你建立 PVC 要儲存空間時，它幫你動態生出 PV。

正式叢集不會有這個——會用 cloud provider 的（AWS EBS、GCP Persistent Disk 等）。

## 看更深一層：每個 Pod 在跑什麼？

選一個 Pod 看它的細節：

\`\`\`bash
kubectl describe pod kube-apiserver-minikube -n kube-system
\`\`\`

往下看會看到：

- **Image**：\`registry.k8s.io/kube-apiserver:v1.28.x\`（API Server 是個容器）
- **Command**：\`kube-apiserver --advertise-address=... --etcd-servers=...\`（啟動參數）
- **Volumes**：mount 了憑證、設定檔
- **Container Runtime**：containerd

你會發現 **API Server 就是一個 Linux 程式 + 一堆參數**——沒有什麼神秘的。

## 「節點」也藏在這裡：用 \`-A\` 看全部

加 \`-A\`（all namespaces）一次看全：

\`\`\`bash
kubectl get pods -A
\`\`\`

你會看到：

- \`kube-system\`：剛才那一堆系統組件
- \`default\`：你的應用 Pod 會放這裡
- \`kube-public\`：公開資訊（很少用）
- \`kube-node-lease\`：Node 心跳記錄

## 用 k3d / k3s 會看到什麼不同？

k3s 是輕量版，會多幾個自己的東西：

\`\`\`
NAME                                      READY   STATUS    AGE
coredns-77ccd57875-xxxxx                  1/1     Running   1m
local-path-provisioner-957fdf8bc-xxxxx    1/1     Running   1m
metrics-server-648b5df564-xxxxx           1/1     Running   1m
helm-install-traefik-crd-xxxxx            0/1     Completed 1m
helm-install-traefik-xxxxx                0/1     Completed 1m
svclb-traefik-xxxxx                       2/2     Running   1m
traefik-768bdcdcdd-xxxxx                  1/1     Running   1m
\`\`\`

**多了幾樣**：

- **traefik**：k3s 內建的 Ingress Controller（minikube 要自己裝）
- **metrics-server**：metric 收集（給 \`kubectl top\` 和 HPA 用的）
- **local-path-provisioner**：本地儲存

**少了幾樣**（k3s 砍掉的）：
- 預設 Pod 列表看不到 \`kube-apiserver\`、\`kube-scheduler\`、\`etcd\`——它們**全部塞進一個叫 \`k3s\` 的程式裡**了，沒有獨立 Pod
- 學習階段差別不大，正式生產要注意

## 實作練習：找到每個組件的「日誌」

挑 API Server 看它的 log：

\`\`\`bash
kubectl logs kube-apiserver-minikube -n kube-system | head -20
\`\`\`

你會看到一堆 K8s 內部運作的訊息。**這就是所有 \`kubectl\` 操作背後的「真相」**——你的每個指令都會在這裡留下痕跡。

## 如果你看不到這些 Pod 怎麼辦？

幾種常見情況：

1. **沒加 \`-n kube-system\`** → \`kubectl get pods\` 預設只看 \`default\` namespace，當然空的
2. **某個 Pod 不是 Running** → 叢集有問題，跑 \`kubectl describe pod xxx -n kube-system\` 看 Events
3. **completely empty** → minikube / k3d 沒啟動，跑 \`minikube status\` 或 \`k3d cluster list\` 確認

## 看懂這些之後，K8s 不再是黑盒

**重點**：你對 K8s 之前的恐懼，9 成來自「**我不知道它在幹嘛**」。

現在你知道了：

- 它的「大門」是一個叫 kube-apiserver 的 Pod
- 它的「資料庫」是 etcd
- 它的「自動修復」是 controller-manager
- 它的「DNS」是 coredns

**全部都是 Pod，全部都看得到、查得到、可以 describe 的東西**。沒有黑盒。

## 重點整理

- K8s 自己的組件**全部用 Pod 跑**，住在 \`kube-system\` namespace
- \`kubectl get pods -n kube-system\` 一次看光所有核心組件
- **七個常見組件**：kube-apiserver / etcd / scheduler / controller-manager / kube-proxy / coredns / storage-provisioner
- k3s/k3d 跟 minikube 不太一樣（k3s 把多個組件塞成一個程式），**多了 traefik / metrics-server**
- **看懂這些 = 把 K8s 的黑盒打開**

## 下一步

組件都認完了，現在你需要學「怎麼跟 K8s 說話」——下一篇進入 [K8s YAML 完整教學：apiVersion / kind / metadata / spec 四大區塊](/blog/k8s/k8s-yaml-basics)，**這是 K8s 的「公文格式」**，看完所有 K8s YAML 都看得懂。

> 📅 **下一篇**：[K8s YAML 完整教學：apiVersion / kind / metadata / spec 四大區塊](/blog/k8s/k8s-yaml-basics)
> 把這篇看到的所有 Pod，學會用 YAML 自己寫出來——四大區塊認完，K8s 的「公文格式」全打通。

> 📚 **完整系列總覽**：[K8s 系列教學首頁](/blog/#k8s)（共 40 課，按學習路徑順序排）
`,
  },
  {
    slug: 'k8s-yaml-basics',
    order: 7,
    group: 'basics',
    title: 'K8s YAML 完整教學：apiVersion、kind、metadata、spec 四大區塊',
    excerpt:
      'K8s 所有資源都是 YAML 寫的。新手看到一堆 indent 直接放棄？這篇用最簡單的 Pod YAML 拆解四個必備欄位，看完再看任何 K8s YAML 都不會怕。',
    publishDate: '2026-05-04',
    tags: ['Kubernetes', 'YAML', '教學', 'apiVersion'],
    readingTime: 10,
    content: `
## K8s 為什麼要學 YAML？

K8s 所有東西都是 YAML 寫的。Pod、Deployment、Service、ConfigMap... 全部是 YAML。

**比喻**：YAML 是你發給 K8s 的「訂單」。你用 YAML 描述「我要 3 個 nginx Pod、開 80 port、用這個 image」，K8s 照著做。

很多新手看到 YAML 一堆縮排就放棄。**其實只要記住四個區塊**，所有 K8s YAML 都看得懂。

## 四大區塊：所有 YAML 都長這樣

\`\`\`yaml
apiVersion: v1          # 1️⃣ 用哪一版 API
kind: Pod               # 2️⃣ 要建什麼
metadata:               # 3️⃣ 叫什麼名字、有什麼標籤
  name: my-nginx
  labels:
    app: web
spec:                   # 4️⃣ 規格——真正的「內容」
  containers:
    - name: nginx
      image: nginx:1.25
      ports:
        - containerPort: 80
\`\`\`

**全部 K8s YAML 都是這四個區塊**。記住這個模板就贏一半。

## 1️⃣ apiVersion — 用哪一版 API

K8s 持續演進，每種資源的 API 有版本號。常見的：

| 資源 | apiVersion |
|---|---|
| Pod / Service / ConfigMap / Secret | \`v1\` |
| Deployment / ReplicaSet / DaemonSet / StatefulSet | \`apps/v1\` |
| Ingress | \`networking.k8s.io/v1\` |
| Job / CronJob | \`batch/v1\` |
| HorizontalPodAutoscaler | \`autoscaling/v2\` |

**怎麼知道某個資源用哪個 apiVersion？**

\`\`\`bash
kubectl explain pod                      # 看 Pod 的 apiVersion
kubectl explain deployment               # 看 Deployment 的
kubectl api-resources                    # 看全部資源跟它們的 apiVersion
\`\`\`

**新手最常踩**：寫 Deployment 用了 \`v1\` → ✗（要 \`apps/v1\`）。不確定先 \`kubectl explain\` 一下。

## 2️⃣ kind — 要建什麼

宣告資源類型，**字母大小寫嚴格**：

| ✅ 對 | ❌ 錯 |
|---|---|
| \`Pod\` | \`pod\` |
| \`Deployment\` | \`deployment\` |
| \`Service\` | \`service\` |
| \`ConfigMap\` | \`configmap\` |

**字首大寫不能漏**——大小寫錯誤是新手第二常見的錯。

## 3️⃣ metadata — 名片資訊

「**這個資源叫什麼？貼什麼標籤？**」

\`\`\`yaml
metadata:
  name: my-nginx                    # 必填，namespace 內唯一
  namespace: default                # 沒寫預設就 default
  labels:
    app: web                        # 標籤——後面 Service 用 selector 找 Pod 就靠這個
    env: production
  annotations:
    description: "frontend nginx"   # 註解，給人看，不是給程式邏輯用
\`\`\`

**重點**：

- **name**：必填，同 namespace + 同 kind 內唯一
- **labels**：後面 Service 找 Pod、Deployment 認 ReplicaSet **全靠它**——超重要
- **annotations**：放給工具或人看的註解（如 deployer 是誰、change ticket 編號）

## 4️⃣ spec — 真正的內容

這個區塊**每種資源都不一樣**。Pod 的 spec 寫 container；Deployment 的 spec 寫 replicas + template；Service 的 spec 寫 selector + ports。

最簡單的 Pod spec：

\`\`\`yaml
spec:
  containers:
    - name: nginx                   # container 名字
      image: nginx:1.25             # 用哪個 image
      ports:
        - containerPort: 80         # 容器內開哪個 port
      env:                          # 環境變數
        - name: GREETING
          value: "Hello"
      resources:                    # 資源限制
        requests:
          memory: "128Mi"
          cpu: "100m"
        limits:
          memory: "256Mi"
          cpu: "200m"
\`\`\`

**\`kubectl explain pod.spec\` 會列出所有可用欄位**——這個指令是 K8s 自帶的最強學習工具。

## 完整範例：寫第一個 Pod

把四個區塊湊起來：

\`\`\`yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-first-pod
  labels:
    app: nginx
spec:
  containers:
    - name: web
      image: nginx:1.25-alpine
      ports:
        - containerPort: 80
\`\`\`

存成 \`pod.yaml\`，跑：

\`\`\`bash
kubectl apply -f pod.yaml          # 建立
kubectl get pods                    # 確認
kubectl delete -f pod.yaml         # 刪除
\`\`\`

**會這個你就會 K8s 一半了**。

## YAML 的 5 個踩坑

### 1. 縮排只能用「空格」，**不能用 Tab**

\`\`\`yaml
spec:
  containers:        # 用 2 個空格 ✅
    - name: nginx    # 用 4 個空格 ✅

spec:
\\tcontainers:        # 用 Tab ❌ K8s 直接拒絕
\`\`\`

VS Code 設定 \`editor.tabSize: 2\` + \`editor.insertSpaces: true\` 一勞永逸。

### 2. 冒號後面**一定要有空格**

\`\`\`yaml
name: nginx        ✅
name:nginx         ❌
\`\`\`

### 3. 列表用 \`-\`，**\`-\` 後面也要空格**

\`\`\`yaml
containers:
  - name: nginx          ✅
  -name: nginx           ❌
\`\`\`

### 4. 字串裡有特殊字元要加引號

\`\`\`yaml
value: "true"            ✅（因為 true 會被當成 boolean）
value: "192.168.1.1"     ✅（IP 字串建議加引號）
value: "$(ENV_NAME)"     ✅（有 $ 的）
\`\`\`

### 5. 一個檔案放多個資源用 \`---\` 隔開

\`\`\`yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  key: value
---
apiVersion: v1
kind: Service
metadata:
  name: my-service
spec:
  ...
\`\`\`

**\`---\` 是 YAML 標準的「文件分隔符」**——一個檔案放整個應用全部 YAML 很方便。

## 看不懂某個欄位？這個指令救命

**最重要的學習工具**：

\`\`\`bash
kubectl explain pod                      # Pod 整體
kubectl explain pod.spec                 # 看 spec 有哪些欄位
kubectl explain pod.spec.containers      # 看 container 有哪些欄位
kubectl explain deployment.spec.template # 階層深沒關係，一直 . 下去
\`\`\`

\`kubectl explain --recursive\` 會把整個樹狀結構一次列出來——**遇到不會寫的 YAML 一定先 explain**。

## 不想自己寫怎麼辦？讓 K8s 給你模板

\`\`\`bash
# 用 --dry-run 產生 Deployment YAML 範本
kubectl create deployment nginx --image=nginx --replicas=3 --dry-run=client -o yaml > deploy.yaml

# 用 expose 產生 Service YAML
kubectl expose deployment nginx --port=80 --dry-run=client -o yaml > svc.yaml
\`\`\`

\`--dry-run=client\` 表示「不真的建，只生 YAML 給我看」。**新手寫 YAML 就靠這招**——產生模板再改。

## 重點整理

- K8s 所有資源都是 YAML，**永遠四個區塊**：\`apiVersion\` + \`kind\` + \`metadata\` + \`spec\`
- **apiVersion** 不同資源不同版本，不確定就 \`kubectl explain\`
- **kind** 字母大小寫嚴格（\`Pod\` 不是 \`pod\`）
- **metadata** 的 \`labels\` 後面 Service 認 Pod 全靠它
- **spec** 各資源不一樣，**\`kubectl explain\` 是最強的查詢工具**
- 5 個坑：用空格不用 Tab、冒號要空格、\`-\` 要空格、特殊字元加引號、多資源用 \`---\` 分隔
- 不想自己寫用 \`kubectl ... --dry-run=client -o yaml\` 生模板

## 下一步

YAML 文法看懂了，下一篇直接動手：[第一個 Pod 完整 CRUD](/blog/k8s/first-pod-crud)——\`apply\` / \`get\` / \`describe\` / \`logs\` / \`exec\` / \`delete\` 五招完整跑一遍，**做完你就有 K8s 基礎實戰能力**。

> 📅 **下一篇**：[第一個 Pod 完整 CRUD：建立、查看、修改、刪除一次教完](/blog/k8s/first-pod-crud)
> 把剛寫的 YAML 真的 \`apply\` 進叢集,五個指令跑完就有基礎實戰能力。

> 📚 **完整系列總覽**：[K8s 系列教學首頁](/blog/#k8s)（共 40 課，按學習路徑順序排）
`,
  },
  {
    slug: 'first-pod-crud',
    order: 8,
    group: 'basics',
    title: '第一個 Pod 完整 CRUD：建立、查看、修改、刪除一次教完',
    excerpt:
      '寫完第一份 Pod YAML，下一步就是 kubectl apply。這篇從零跑出第一個 nginx Pod，學會 get / describe / logs / exec / delete 五個必背指令。',
    publishDate: '2026-05-05',
    tags: ['Kubernetes', 'Pod', 'kubectl', 'CRUD', '教學'],
    readingTime: 10,
    content: `
## 學完概念，動手才是真的

前面六篇全都在講概念。現在**真的把第一個 Pod 跑起來**——這篇做完，你會 \`kubectl\` 的五個核心指令：

\`\`\`
apply → get → describe → logs → exec → delete
\`\`\`

**這 5 招會了，新手到中階就過關了**。

## 前置準備

裝好 minikube 或 k3d（[沒裝看這篇](/blog/k8s/k3d-vs-minikube-local-setup)），確認叢集活著：

\`\`\`bash
kubectl get nodes
# NAME       STATUS   ROLES           AGE   VERSION
# minikube   Ready    control-plane   3m    v1.28.x
\`\`\`

\`STATUS\` 是 \`Ready\` 就 OK。

## Step 1：寫 YAML

開一個檔案 \`my-nginx.yaml\`：

\`\`\`yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-nginx
  labels:
    app: web
spec:
  containers:
    - name: nginx
      image: nginx:1.25-alpine
      ports:
        - containerPort: 80
\`\`\`

四個區塊都齊：\`apiVersion\` / \`kind\` / \`metadata\` / \`spec\`。看不懂的回去看 [K8s YAML 完整教學](/blog/k8s/k8s-yaml-basics)。

## Step 2：apply — 建立 Pod

\`\`\`bash
kubectl apply -f my-nginx.yaml
# pod/my-nginx created
\`\`\`

\`apply -f\` 是「**用這份 YAML 建立資源**」。如果 Pod 已存在會做更新（叫做「reconcile」）。

**為什麼不是 \`kubectl create\`？**

- \`create\` = 第一次建立（已存在會錯）
- \`apply\` = 不存在就建立、存在就更新（**最常用，記這個就好**）

## Step 3：get — 看狀態

\`\`\`bash
kubectl get pods
# NAME       READY   STATUS    RESTARTS   AGE
# my-nginx   1/1     Running   0          10s
\`\`\`

幾秒鐘內 \`STATUS\` 會從 \`ContainerCreating\` 變成 \`Running\`。

**\`get\` 的進階用法**：

\`\`\`bash
kubectl get pods -o wide                   # 加 IP、Node 等資訊
kubectl get pods -w                        # watch 模式，狀態變化即時看
kubectl get pod my-nginx -o yaml           # 把這個 Pod 的完整 YAML 印出
kubectl get pod my-nginx -o json           # 同上但 JSON 格式
kubectl get all                            # 看 default namespace 全部資源
kubectl get pods -n kube-system            # 看 kube-system namespace
\`\`\`

\`-w\` 特別好用——你可以開另一個 terminal 跑 \`-w\`，主視窗操作 Pod，**狀態變化即時看到**。

## Step 4：describe — 詳細資訊（排錯主力）

\`\`\`bash
kubectl describe pod my-nginx
\`\`\`

輸出**很長**，但重點看這幾段：

\`\`\`
Name:         my-nginx
Namespace:    default
Labels:       app=web
Status:       Running
IP:           10.244.0.5
Containers:
  nginx:
    Image:        nginx:1.25-alpine
    Image ID:     ...
    Port:         80/TCP
    State:        Running
    Ready:        True
    Restart Count: 0
Events:
  Type    Reason     Age   From    Message
  ----    ------     ----  ----    -------
  Normal  Scheduled  10s   ...     Successfully assigned default/my-nginx to minikube
  Normal  Pulling    10s   kubelet Pulling image "nginx:1.25-alpine"
  Normal  Pulled     8s    kubelet Successfully pulled image
  Normal  Created    8s    kubelet Created container nginx
  Normal  Started    8s    kubelet Started container nginx
\`\`\`

**最重要的是 \`Events\` 段**——按時間順序記錄發生了什麼。Pod 出問題第一個看這裡：

- \`ImagePullBackOff\` → image 名字錯 / 沒權限
- \`CrashLoopBackOff\` → 容器啟動失敗一直重試
- \`FailedScheduling\` → Scheduler 找不到合適的 Node

**describe 是 K8s 排錯第一指令**——記住這句。

## Step 5：logs — 看容器在說什麼

\`\`\`bash
kubectl logs my-nginx
\`\`\`

會看到 nginx 的標準輸出：

\`\`\`
/docker-entrypoint.sh: /docker-entrypoint.d/ is not empty, will attempt to perform configuration
...
2026/04/27 10:30:00 [notice] 1#1: nginx/1.25.x
2026/04/27 10:30:00 [notice] 1#1: start worker processes
\`\`\`

**進階用法**：

\`\`\`bash
kubectl logs my-nginx -f                   # follow 模式（即時 tail）
kubectl logs my-nginx --tail=20            # 只看最後 20 行
kubectl logs my-nginx --since=5m           # 5 分鐘內的
kubectl logs my-nginx -p                   # 上一次崩潰前的 log（除錯神器）
\`\`\`

\`-p\` 超重要：**容器崩了重啟，原本的 log 會被覆蓋**。\`-p\` 看的是「上一次運行」的 log，**找崩潰原因靠這個**。

## Step 6：exec — 進到容器裡面

像 \`docker exec -it\` 一樣，**直接進 Pod 裡的容器**：

\`\`\`bash
kubectl exec -it my-nginx -- sh
\`\`\`

進去後就是容器裡的 shell：

\`\`\`
/ # ls
bin   docker-entrypoint.d   etc    ...
/ # ps
PID   USER    TIME  COMMAND
    1 root    0:00 nginx: master process nginx
   29 nginx   0:00 nginx: worker process
/ # exit
\`\`\`

**注意 \`--\` 之後是要在容器內執行的指令**——這是 \`kubectl\` 跟 Docker 不太一樣的地方。

不想進去互動，想跑單一指令：

\`\`\`bash
kubectl exec my-nginx -- ls /etc/nginx
kubectl exec my-nginx -- cat /etc/nginx/nginx.conf
\`\`\`

## Step 7：在瀏覽器看到 nginx 頁面（port-forward）

Pod 起來了，但你怎麼從瀏覽器連到它？**最簡單的方法是 port-forward**：

\`\`\`bash
kubectl port-forward pod/my-nginx 8080:80
# Forwarding from 127.0.0.1:8080 -> 80
\`\`\`

開瀏覽器打 \`http://localhost:8080\` → 看到 \`Welcome to nginx!\` 頁面 🎉

**這個指令會佔據 terminal**——關掉 terminal 就斷線。要長期對外用 Service / Ingress（後面文章會教）。

## Step 8：delete — 刪掉

\`\`\`bash
# 用名字刪
kubectl delete pod my-nginx

# 或用 YAML 刪
kubectl delete -f my-nginx.yaml
\`\`\`

刪掉後 \`kubectl get pods\` 就空了。

## 故意搞壞看看：image 名字打錯

把 \`my-nginx.yaml\` 的 image 改成 \`nginx:not-exist\`：

\`\`\`bash
kubectl apply -f my-nginx.yaml
kubectl get pods
# NAME       READY   STATUS         RESTARTS   AGE
# my-nginx   0/1     ErrImagePull   0          10s
\`\`\`

**\`ErrImagePull\`** → 拉不到 image。等一下會變 **\`ImagePullBackOff\`**（K8s 會用指數退避重試）。

跑 \`describe\` 看 Events：

\`\`\`bash
kubectl describe pod my-nginx | grep -A 5 Events
# Events:
#   Type     Reason          ...    Message
#   Warning  Failed          ...    Failed to pull image "nginx:not-exist": ...
#   Warning  ImagePullBackOff ...   Back-off pulling image "nginx:not-exist"
\`\`\`

**3 步排錯流程**：
1. \`get\` 看 STATUS 異常 → 知道有問題
2. \`describe\` 看 Events → 看到具體錯誤訊息
3. 改 YAML → \`apply\` 一次（K8s 會自動更新）

## 五招速查表

| 動作 | 指令 |
|---|---|
| 建立 / 更新 | \`kubectl apply -f xxx.yaml\` |
| 列出 | \`kubectl get pods\` |
| 詳細資訊 / 排錯 | \`kubectl describe pod xxx\` |
| 看日誌 | \`kubectl logs xxx -f\` |
| 進容器 | \`kubectl exec -it xxx -- sh\` |
| 刪除 | \`kubectl delete pod xxx\` |

**這 6 個會了，K8s 基礎實戰就過關**。

## 重點整理

- 寫 YAML → \`kubectl apply\` 是 K8s 最常用的工作流
- **\`get\` 看狀態、\`describe\` 排錯、\`logs\` 看輸出、\`exec\` 進容器、\`delete\` 刪掉**
- \`describe\` 的 **Events 段**是排錯第一手線索
- \`logs -p\` 看上次崩潰的 log，**找崩潰原因必備**
- \`port-forward\` 是「**從本機連 Pod 的最簡單方法**」（生產環境用 Service / Ingress）
- 故意搞壞 → \`describe\` 看 Events → 改 YAML → re-apply 是排錯標準流程

## 下一步

成功跑了第一個 Pod，下一篇你**故意搞壞 Pod 學排錯**：[Pod 生命週期與排錯：CrashLoopBackOff、ImagePullBackOff 怎麼解](/blog/k8s/pod-lifecycle-troubleshoot)——把 K8s 最常見的兩種錯誤搞清楚，**真實工作 80% 的 Pod 問題都是這兩種**。

> 📅 **下一篇**：[Pod 生命週期與排錯：CrashLoopBackOff、ImagePullBackOff 怎麼解](/blog/k8s/pod-lifecycle-troubleshoot)
> 把這篇學到的 describe / logs 拉到實戰,把 K8s 最常見的兩種錯誤一次搞懂。

> 📚 **完整系列總覽**：[K8s 系列教學首頁](/blog/#k8s)（共 40 課，按學習路徑順序排）
`,
  },

  // ====== Group 2: workload-basics — 工作負載基礎（對應第 4 堂下午 + 第 5 堂上午）======
  {
    slug: 'pod-lifecycle-troubleshoot',
    order: 9,
    group: 'workload',
    title: 'Pod 生命週期與排錯：CrashLoopBackOff、ImagePullBackOff 怎麼解？',
    excerpt:
      'Pod 不是 Running 就是好的，還有 Pending、CrashLoopBackOff、ImagePullBackOff、Error 一堆狀態。這篇用「故意搞壞」的方式逐個觸發，讓你看到時不會慌。',
    publishDate: '2026-05-06',
    tags: ['Kubernetes', 'Pod', '排錯', 'CrashLoopBackOff', 'ImagePullBackOff'],
    readingTime: 11,
    content: `
## Pod 跑起來了，但狀態不是 Running？

[上一篇](/blog/k8s/first-pod-crud)我們跑起了第一個 Pod，YAML 對的、Image 對的，一切順利。但現實工作裡，**有一半的時間你都在處理「狀態不是 Running」的 Pod**。

\`kubectl get pods\` 一看，STATUS 那欄是 \`ImagePullBackOff\` 或 \`CrashLoopBackOff\` — K8s 不會像朋友一樣告訴你「你 Image 名字打錯了」，它只給你一個狀態碼，然後你自己查。

這篇教你兩件事：**Pod 各種狀態代表什麼**，以及**碰到問題該怎麼一步一步定位**。

## Pod 真正的 phase 只有 4 種

K8s API 裡 Pod 的 phase 其實只有：

| Phase | 意思 |
|:---|:---|
| \`Pending\` | 排隊中（Scheduler 還沒分配 Node） |
| \`Running\` | 正常運行 |
| \`Succeeded\` | 跑完正常結束（exit 0） |
| \`Failed\` | 跑完非正常結束（exit 非 0） |

但你 \`kubectl get pods\` 看到的 STATUS 欄常出現別的字，比如 \`ContainerCreating\`、\`CrashLoopBackOff\`、\`Terminating\`。**這些不是 phase，是容器的 waiting reason 或 K8s 給人類看的友善顯示值**。先區分這兩層，後面看狀態才不會混亂。

## 三個常踩的錯誤狀態

| 狀態 | 意思 | 常見原因 | 第一步排錯 |
|:---|:---|:---|:---|
| \`ContainerCreating\` | 容器還在 Waiting | 拉 Image、掛 Volume、套 Secret | \`describe pod\` 看 Events |
| \`ErrImagePull\` | 拉 Image 失敗 | 名字拼錯、tag 不存在 | \`describe pod\` |
| \`ImagePullBackOff\` | 重複拉失敗，退避中 | 同上 | \`describe pod\` |
| \`CrashLoopBackOff\` | 反覆 crash + 重啟 | 程式啟動就掛 | \`logs\` 看輸出 |

### ErrImagePull → ImagePullBackOff

你寫了 \`image: ngin\`（少一個 x），K8s 拉不到 → 第一次失敗顯示 \`ErrImagePull\` → 重試還是失敗 → 進入退避，狀態變 \`ImagePullBackOff\`。

**BackOff 是 K8s 很重要的概念**：每次重試的間隔越來越長，避免無限快速失敗把 Node 搞爛。

### CrashLoopBackOff（指數退避）

Image 拉到了、容器建好了，但程式一啟動就 crash。K8s 自動重啟，又 crash，又重啟…形成 loop。

退避策略：第一次等 10 秒重啟，第二次 20 秒，第三次 40 秒，第四次 80 秒…**最長 5 分鐘封頂**。

所以你如果觀察 RESTARTS 欄位，會發現數字一直長，但每次重啟之間越等越久 — 這不是 K8s 放棄了，是它在退避中。

常見原因：
- 程式碼有 bug，啟動就報錯退出
- 設定檔有問題（環境變數沒給、ConfigMap 沒掛）
- 依賴的服務連不上（DB 連線字串錯）
- \`command\` 寫錯，找不到執行檔

## 排錯三兄弟（記住這三招）

碰到任何 Pod 問題，固定流程：

\`\`\`bash
# 1. 看狀態
kubectl get pods

# 2. 看 Events（90% 的問題在這）
kubectl describe pod <pod-name>

# 3. 看程式日誌
kubectl logs <pod-name>
\`\`\`

**三步的分工**：
- \`get pods\` 告訴你「方向」（Image 問題？程式問題？資源問題？）
- \`describe\` 看 Events 告訴你「為什麼啟動不了」（K8s 在做什麼、發生什麼錯誤）
- \`logs\` 告訴你「為什麼啟動了又掛」（程式自己印的錯誤訊息）

## 實戰：故意把 Pod 搞壞

### Case 1：Image 名字打錯

\`\`\`yaml
# pod-broken.yaml
apiVersion: v1
kind: Pod
metadata:
  name: broken-pod
spec:
  containers:
  - name: broken
    image: ngin   # 故意少一個 x
    ports:
    - containerPort: 80
\`\`\`

\`\`\`bash
kubectl apply -f pod-broken.yaml
# pod/broken-pod created  ← 注意！created ≠ running

kubectl get pods
# STATUS: ErrImagePull → ImagePullBackOff（來回切換）

kubectl describe pod broken-pod
# 拉到最下面 Events:
# Failed to pull image "ngin": manifest unknown
\`\`\`

修復：

\`\`\`bash
kubectl delete pod broken-pod
# 改 YAML 的 image: ngin → image: nginx:1.27
kubectl apply -f pod-broken.yaml
kubectl get pods   # Running
\`\`\`

> ⚠️ **永遠改 YAML 重新 apply，不要用 \`kubectl edit\`**：edit 改的東西不會反映回 YAML 檔，下次再 apply 同樣的錯又出現。

### Case 2：程式啟動就掛（CrashLoopBackOff）

\`\`\`yaml
# pod-crash.yaml
apiVersion: v1
kind: Pod
metadata:
  name: crash-pod
spec:
  containers:
  - name: crash-test
    image: busybox:1.36
    command: ["/bin/sh", "-c", "echo hello && exit 1"]
\`\`\`

\`\`\`bash
kubectl apply -f pod-crash.yaml
kubectl get pods
# STATUS: CrashLoopBackOff, RESTARTS: 3, 4, 5...

kubectl describe pod crash-pod
# Events: Back-off restarting failed container

kubectl logs crash-pod
# hello   ← 程式有印再退出

kubectl logs crash-pod --previous
# 看「上一個已死掉的容器」的 log（生產環境很常用）
\`\`\`

> 💡 **\`/bin/sh -c\` 為什麼必要**：\`exit\` 是 shell 內建指令、不是執行檔。直接寫 \`command: ["exit", "1"]\` 會找不到檔案。一律用 \`/bin/sh -c "整串指令"\` 包起來。

## logs 是空的怎麼辦？

如果程式還沒印任何東西就 crash（比如 OOM 或 segfault），\`logs\` 會是空的。這時：

1. \`kubectl logs <pod> --previous\` 看上一輪
2. \`kubectl get events --sort-by=.metadata.creationTimestamp\` 看叢集事件（Node 磁碟滿了之類更底層的問題）
3. \`describe\` 看 Events 區塊裡的 OOMKilled / Error 訊息

## 重點整理

- Pod phase 真正只有 4 種：Pending / Running / Succeeded / Failed
- ContainerCreating、CrashLoopBackOff 是 STATUS 顯示值，不是 phase
- BackOff = 退避，每次重試間隔越來越長
- 排錯三兄弟：\`get pods\` → \`describe pod\` → \`logs\`
- describe 解決「啟動不了」，logs 解決「啟動了又掛」
- \`logs --previous\` 看上一個已死容器的日誌

## 下一步

排錯會了，但有些容器**故意要兩個一起跑** — 比如 nginx 寫日誌、旁邊放個小工具讀日誌轉發出去。下一篇講[多容器 Pod 與 Sidecar 模式](/blog/k8s/sidecar-pattern)：什麼時候要把容器塞同一個 Pod、什麼時候該拆開。

> 📚 **完整系列總覽**：[K8s 系列教學首頁](/blog/#k8s)（共 40 課，按學習路徑順序排）
`,
  },
  {
    slug: 'sidecar-pattern',
    order: 10,
    group: 'workload',
    title: 'Sidecar Pattern 是什麼？一個 Pod 跑兩個容器的正確姿勢',
    excerpt:
      '一個 Pod 通常一個容器，但你也可以放兩個。這個「副駕駛」模式叫 Sidecar，常用來收日誌、抓 metrics、做網路代理。這篇實作一個 nginx + busybox 共享 Volume 的範例。',
    publishDate: '2026-05-07',
    tags: ['Kubernetes', 'Sidecar', 'Pattern', 'Pod', '日誌'],
    readingTime: 9,
    content: `
## 一個 Pod 通常一個容器，但你也可以塞兩個

[上一篇](/blog/k8s/pod-lifecycle-troubleshoot)學完排錯，我們現在處理一個常見場景：**nginx 寫了一堆 access log，老闆要把這些日誌即時收集到集中式日誌系統去**。你會怎麼做？

直覺做法 1：在 nginx 容器裡再裝一個 Fluentd → ❌ 違反「一個容器一件事」原則。

直覺做法 2：另外跑一個 Pod 去讀 nginx 的日誌 → ❌ 兩個 Pod 各自有檔案系統，要搞跨 Pod 共享儲存太麻煩。

K8s 提供更優雅的方案：**同一個 Pod 裡放兩個容器**，一個跑 nginx 寫日誌，一個跑 busybox 讀日誌轉發出去。它們**共享同一個 Volume**，nginx 寫進去 busybox 直接讀出來。這就是 **Sidecar 模式**。

## Sidecar = 摩托車 + 邊車

主容器負責核心業務（nginx 服務 Web 請求），Sidecar 像掛在旁邊的邊車，負責輔助功能（收日誌）。邊車不是主角，但它讓主角的工作更完整。

**生產環境最常見的 3 種 Sidecar**：

| 用途 | 主容器 | Sidecar |
|:---|:---|:---|
| 日誌收集 | nginx / app | Fluentd / Filebeat |
| 流量代理 | app | Envoy（Istio Service Mesh） |
| 監控指標 | app | Prometheus Exporter |

## 同一個 Pod 的容器共享什麼？

**1. 共享網路（同一個 IP）**
- 兩個容器看到的 IP 都一樣
- 互相用 \`localhost\` 通訊
- nginx 監聽 80 → Sidecar 用 \`localhost:80\` 連它

**2. 共享儲存（同一個 Volume）**
- nginx 寫到 \`/var/log/nginx/access.log\`
- Sidecar 掛同一個 Volume，看到同一批檔案

**就像兩個人住同一間房子**：找室友不用打電話，吼一聲就行；冰箱也是同一個。

## emptyDir：Pod 內的臨時共用資料夾

K8s 最簡單的 Volume 類型：

- Pod 建立時自動出現
- Pod 刪除時自動消失
- 不需要 PV / PVC
- 適合「主容器寫、Sidecar 讀」這種臨時共享

> ⚠️ emptyDir 不適合存重要資料（Pod 一刪就沒了），它就是兩個容器之間的暫存通道。

## 實作：nginx + busybox 收日誌

\`\`\`yaml
# pod-sidecar.yaml
apiVersion: v1
kind: Pod
metadata:
  name: sidecar-pod
  labels:
    app: sidecar-demo
spec:
  containers:
  - name: nginx
    image: nginx:1.27
    ports:
    - containerPort: 80
    volumeMounts:
    - name: shared-logs
      mountPath: /var/log/nginx
  - name: log-reader
    image: busybox:1.36
    command:
    - /bin/sh
    - -c
    - |
      while [ ! -f /var/log/nginx/access.log ]; do
        sleep 1
      done
      tail -f /var/log/nginx/access.log
    volumeMounts:
    - name: shared-logs
      mountPath: /var/log/nginx
  volumes:
  - name: shared-logs
    emptyDir: {}
\`\`\`

### 三個關鍵細節

**1. nginx 的 symlink 行為**

nginx 官方 Image 預設把 \`access.log\` symlink 到 \`/dev/stdout\`。但我們把 emptyDir 掛到 \`/var/log/nginx\` 後，會**覆蓋掉 symlink**，nginx 改寫到真實檔案。這正是我們要的（Sidecar 才讀得到）。

**2. busybox 的 while 等待**

\`\`\`bash
while [ ! -f /var/log/nginx/access.log ]; do
  sleep 1
done
tail -f /var/log/nginx/access.log
\`\`\`

為什麼不直接 \`tail -f\`？因為**同一個 Pod 的容器是同時啟動的**，K8s 不保證誰先跑起來。如果 busybox 比 nginx 早，access.log 還不存在，\`tail -f\` 會直接報錯 crash。

加 while 等待避免這個 race condition。**多容器 Pod 很常見的小技巧**，記住。

**3. volumes 在 spec 層級、不在 container 裡**

Volume 是給整個 Pod 共享的，所以定義在 \`spec.volumes\`（與 \`spec.containers\` 同層），然後每個容器各自用 \`volumeMounts\` 掛載。

## 部署 + 驗證

\`\`\`bash
kubectl apply -f pod-sidecar.yaml

kubectl get pods
# READY: 2/2  ← 兩個容器都 ready 才會顯示 2/2
# 1/2 表示有一個還沒 ready，等幾秒再看

# 進 nginx 容器（多容器 Pod 必須加 -c 指定）
kubectl exec -it sidecar-pod -c nginx -- /bin/sh
apt-get update && apt-get install -y curl
curl localhost
curl localhost
curl localhost
exit

# 看 Sidecar 收到的日誌
kubectl logs sidecar-pod -c log-reader
# 你會看到 3 行 access log
\`\`\`

> 💡 **多容器 Pod 操作必須加 \`-c\`**：\`exec\`、\`logs\` 都要用 \`-c <container-name>\` 指定哪個容器，不然 K8s 會問你選哪個。

## 多容器 Pod vs 多個獨立 Pod

判斷標準很簡單：**拿掉一個容器，另一個還能不能正常工作**？

|  | 多容器 Pod | 多個獨立 Pod |
|:---|:---|:---|
| 何時用 | 緊密耦合 | 獨立運作 |
| 網路 | 共享 IP，用 localhost | 各自有 IP |
| 擴縮容 | 一起擴一起縮 | 獨立擴縮 |
| 生命週期 | 一起生一起死 | 各自獨立 |
| 範例 | nginx + log collector | nginx + mysql |

**範例對比**：
- nginx + 日誌收集器：日誌收集器拿掉 → nginx 還能跑；nginx 拿掉 → 日誌收集器沒事做。**緊密耦合，同 Pod**。
- nginx + MySQL：互相獨立，且 nginx 可能擴 5 個但 MySQL 不要擴。**拆開放兩個 Pod**。

預設原則：**一個 Pod 一個容器**。只有真的需要共享網路或共享儲存時才考慮多容器 Pod。

## 重點整理

- Sidecar = 主容器 + 輔助容器，共享網路 + 共享儲存
- 同一個 Pod 的容器有相同 IP，可用 localhost 通訊
- emptyDir 是 Pod 內臨時共用資料夾，Pod 刪就消失
- 多容器 Pod 是同時啟動，注意 race condition（用 while 等待）
- nginx 掛 emptyDir 到 \`/var/log/nginx\` 會覆蓋 symlink、改寫真檔案
- \`exec\` / \`logs\` 多容器 Pod 必須加 \`-c\`
- 判斷標準：拿掉一個容器，另一個還能不能活

## 下一步

到這裡你會單一 Pod、會多容器 Pod、會排錯。但 \`kubectl\` 其實還有很多進階技巧 — 下一篇講[kubectl 進階：port-forward、dry-run、--watch](/blog/k8s/kubectl-advanced-tips)，三招會了就跟一般教學程度甩開。

> 📚 **完整系列總覽**：[K8s 系列教學首頁](/blog/#k8s)（共 40 課，按學習路徑順序排）
`,
  },
  {
    slug: 'kubectl-advanced-tips',
    order: 11,
    group: 'workload',
    title: 'kubectl 進階：port-forward、dry-run、--watch 你都會用嗎？',
    excerpt:
      'kubectl 不是只有 get / apply / delete。port-forward 讓你連進 Pod、--dry-run=client 先看 YAML 對不對、-w 即時觀察狀態變化。會這些等於從新手變熟手。',
    publishDate: '2026-05-08',
    tags: ['kubectl', '進階', 'port-forward', 'dry-run'],
    readingTime: 8,
    content: `
## kubectl 不是只有 get / apply / delete

學完 [Pod CRUD](/blog/k8s/first-pod-crud) 跟 [Sidecar](/blog/k8s/sidecar-pattern) 後，你已經會基本的 kubectl 操作。但 kubectl 有很多進階技巧，**會這幾招你就從新手變熟手**：

- \`-o wide\` / \`-o yaml\` / \`-o jsonpath\` — 看更多欄位、看完整資源、提取單一欄位
- \`port-forward\` — 不開 Service 也能臨時連進 Pod
- \`--dry-run=client\` — 自動產生 YAML 模板（再也不用背欄位）
- \`explain\` — 內建文件查欄位定義
- \`--watch\` / \`-w\` — 即時觀察狀態變化

這篇逐一示範。

## \`-o wide\`：看 Pod IP 跟 Node

\`\`\`bash
kubectl get pods
# 預設只看到 NAME / READY / STATUS / RESTARTS / AGE

kubectl get pods -o wide
# 多了 IP / NODE / NOMINATED NODE / READINESS GATES
\`\`\`

實用場景：
- 想確認 Pod 跑在哪個 Node 上（多節點叢集除錯）
- 想知道 Pod IP 直接 curl

## \`-o yaml\`：看完整的 K8s 資源定義

\`\`\`bash
kubectl get pod my-nginx -o yaml
\`\`\`

K8s 會印出**完整的 Pod YAML**，包括你沒寫但 K8s 自動填的欄位（status、events、defaults）。

實用場景：
- 想確認某個欄位有沒有生效
- 想 copy 現成的 Pod YAML 改一改用

也可以只取單一欄位（jsonpath）：

\`\`\`bash
kubectl get pod my-nginx -o jsonpath='{.status.podIP}'
# 印出 Pod IP

kubectl get pods -o jsonpath='{.items[*].metadata.name}'
# 印出所有 Pod 名字（空白分隔）
\`\`\`

## \`port-forward\`：臨時通道連進 Pod

Pod 跑在叢集裡面，你電腦上打 \`http://localhost:8080\` 連不到 — Service / Ingress 還沒學。先用 \`port-forward\` 開個臨時通道：

\`\`\`bash
kubectl port-forward pod/my-nginx 8080:80
# 把 Pod 的 80 port 映射到你電腦的 8080
# 終端機會卡住，這是正常的（通道在運作）

# 開另一個終端機
curl http://localhost:8080
# 會看到 nginx 歡迎頁
\`\`\`

按 Ctrl+C 停止 port-forward → 通道斷掉。

> ⚠️ port-forward **只是除錯工具**，不是正式對外的方式。終端機關掉就斷，而且它直接連 Pod、繞過 Service。正式對外要用 Service / Ingress（Day 5、Day 6 會教）。

## \`--dry-run=client\`：自動產生 YAML 模板

不用再背 \`apiVersion: v1\`、\`kind: Pod\` — 用 \`kubectl run\` 加 \`--dry-run=client -o yaml\` 自動產：

\`\`\`bash
kubectl run my-nginx --image=nginx:1.27 --dry-run=client -o yaml
\`\`\`

輸出：

\`\`\`yaml
apiVersion: v1
kind: Pod
metadata:
  creationTimestamp: null
  labels:
    run: my-nginx
  name: my-nginx
spec:
  containers:
  - image: nginx:1.27
    name: my-nginx
    resources: {}
  dnsPolicy: ClusterFirst
  restartPolicy: Always
status: {}
\`\`\`

直接導出存檔：

\`\`\`bash
kubectl run my-nginx --image=nginx:1.27 --dry-run=client -o yaml > pod.yaml
\`\`\`

**Deployment 也行**：

\`\`\`bash
kubectl create deployment nginx-deploy --image=nginx:1.27 --replicas=3 \\
  --dry-run=client -o yaml > deployment.yaml
\`\`\`

Service：

\`\`\`bash
kubectl expose deployment nginx-deploy --port=80 --target-port=80 \\
  --dry-run=client -o yaml > service.yaml
\`\`\`

## \`kubectl explain\`：內建文件查欄位

忘記某個欄位怎麼寫？不用查文件：

\`\`\`bash
kubectl explain pod.spec
# 列出 spec 底下所有欄位 + 說明

kubectl explain pod.spec.containers
# 列出 containers 列表的每個欄位

kubectl explain pod.spec.volumes
# 看支援哪些 Volume 類型（emptyDir、hostPath、configMap、secret、persistentVolumeClaim 等）

kubectl explain --recursive pod.spec.containers
# 把 containers 底下所有層級全展開
\`\`\`

## \`--watch\` / \`-w\`：即時觀察狀態變化

\`\`\`bash
kubectl get pods --watch
# 終端機停在那裡，每當有 Pod 狀態變化就多印一行
# 按 Ctrl+C 停止
\`\`\`

實用場景：
- 觀察 Pod 從 Pending → ContainerCreating → Running 的過程
- 觀察 CrashLoopBackOff 的退避節奏（10s → 20s → 40s）
- 觀察 Deployment 滾動更新（新 Pod 起來 → 舊 Pod 收掉）

## 自動補全 + alias（讓打字快 5 倍）

**bash 自動補全**：

\`\`\`bash
# 加到 ~/.bashrc 或 ~/.zshrc
source <(kubectl completion bash)   # bash
source <(kubectl completion zsh)    # zsh
\`\`\`

之後可以 Tab 補完 Pod 名字、context、namespace…

**alias**：

\`\`\`bash
# 加到 ~/.bashrc / ~/.zshrc
alias k=kubectl
\`\`\`

之後 \`k get pods\` 就行。再進階一點可以裝 [kubectl-aliases](https://github.com/ahmetb/kubectl-aliases)，幾百個常用組合。

## 縮寫對照表（背起來打字快）

| 完整 | 縮寫 |
|:---|:---|
| pods | po |
| services | svc |
| deployments | deploy |
| replicasets | rs |
| statefulsets | sts |
| daemonsets | ds |
| persistentvolumes | pv |
| persistentvolumeclaims | pvc |
| configmaps | cm |
| namespaces | ns |

組合用：

\`\`\`bash
k get deploy,rs,po
# 一行看完 Deployment + ReplicaSet + Pod
\`\`\`

## 重點整理

- \`-o wide\` 看 Pod IP / Node，\`-o yaml\` 看完整定義，\`-o jsonpath\` 取單一欄位
- \`port-forward\` 是臨時除錯通道，不是正式對外方式
- \`--dry-run=client -o yaml\` 自動產 YAML 模板，告別背欄位
- \`kubectl explain\` 是內建文件，比 Google 快
- \`--watch\` 即時觀察狀態變化
- 設好 \`source <(kubectl completion)\` + \`alias k=kubectl\` 打字快 5 倍

## 下一步

\`kubectl run\` 預設不能傳環境變數，但 MySQL 一定要 \`MYSQL_ROOT_PASSWORD\`。下一篇示範[在 K8s 上跑 MySQL：環境變數注入](/blog/k8s/pod-env-mysql)，學會 \`env\` 區塊的三種寫法。

> 📚 **完整系列總覽**：[K8s 系列教學首頁](/blog/#k8s)（共 40 課，按學習路徑順序排）
`,
  },
  {
    slug: 'pod-env-mysql',
    order: 12,
    group: 'workload',
    title: '在 K8s 上跑 MySQL：環境變數注入完整教學',
    excerpt:
      '直接用 docker run mysql 行，但 K8s 上要怎麼傳 MYSQL_ROOT_PASSWORD？env 區塊怎麼寫？這篇從零跑起 MySQL Pod，學會 env / envFrom / valueFrom 三種寫法。',
    publishDate: '2026-05-09',
    tags: ['Kubernetes', 'MySQL', '環境變數', 'env'],
    readingTime: 9,
    content: `
## 直接 docker run mysql 行，K8s 上要怎麼傳密碼？

\`docker run\` 跑 MySQL 你會這樣寫：

\`\`\`bash
docker run -e MYSQL_ROOT_PASSWORD=root1234 -d mysql:8.0
\`\`\`

\`-e\` 注入環境變數。但 K8s 沒有 \`-e\` 參數 — 它是聲明式的，要寫在 YAML 裡。

這篇學 \`env\` 區塊的三種寫法：**直接寫值、從 ConfigMap、從 Secret**。

## 不給密碼會怎樣？親身體驗一下

先寫個沒密碼的 MySQL Pod：

\`\`\`yaml
# mysql-no-env.yaml
apiVersion: v1
kind: Pod
metadata:
  name: mysql-broken
spec:
  containers:
  - name: mysql
    image: mysql:8.0
    ports:
    - containerPort: 3306
\`\`\`

\`\`\`bash
kubectl apply -f mysql-no-env.yaml
kubectl get pods
# STATUS: CrashLoopBackOff   ← 跟你預期的一樣

kubectl logs mysql-broken
# [ERROR] [Entrypoint]: Database is uninitialized and password option is not specified
# You need to specify one of the following: -e MYSQL_ROOT_PASSWORD ... etc.
\`\`\`

MySQL 啟動時要建一個 root 帳號，必須先給密碼。沒給就拒絕啟動。

清掉重來：

\`\`\`bash
kubectl delete pod mysql-broken
\`\`\`

## 寫法 1：直接寫值（env + value）

\`\`\`yaml
# mysql.yaml
apiVersion: v1
kind: Pod
metadata:
  name: mysql
spec:
  containers:
  - name: mysql
    image: mysql:8.0
    ports:
    - containerPort: 3306
    env:
    - name: MYSQL_ROOT_PASSWORD
      value: "root1234"
    - name: MYSQL_DATABASE
      value: "mydb"
    - name: MYSQL_USER
      value: "appuser"
    - name: MYSQL_PASSWORD
      value: "app1234"
\`\`\`

\`\`\`bash
kubectl apply -f mysql.yaml
kubectl get pods
# STATUS: Running

# 進去確認
kubectl exec -it mysql -- mysql -uroot -proot1234
mysql> SHOW DATABASES;
# information_schema, mydb, mysql, performance_schema, sys
mysql> exit
\`\`\`

**對應 docker run**：

| Docker | K8s YAML |
|:---|:---|
| \`-e MYSQL_ROOT_PASSWORD=root1234\` | \`env: - name: MYSQL_ROOT_PASSWORD; value: "root1234"\` |
| \`-e MYSQL_DATABASE=mydb\` | \`env: - name: MYSQL_DATABASE; value: "mydb"\` |

> ⚠️ \`value\` 一定要是字串，**寫數字記得加引號**：\`value: "3306"\` 不是 \`value: 3306\`。

## 寫法 2：從 ConfigMap 取（不敏感的設定）

把非敏感的設定（資料庫名、port、log level）放 ConfigMap，密碼類放 Secret。**分開管理才好維護**。

ConfigMap：

\`\`\`yaml
# mysql-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: mysql-config
data:
  MYSQL_DATABASE: "mydb"
  MYSQL_USER: "appuser"
\`\`\`

Pod 引用：

\`\`\`yaml
spec:
  containers:
  - name: mysql
    image: mysql:8.0
    env:
    - name: MYSQL_DATABASE
      valueFrom:
        configMapKeyRef:
          name: mysql-config
          key: MYSQL_DATABASE
    - name: MYSQL_USER
      valueFrom:
        configMapKeyRef:
          name: mysql-config
          key: MYSQL_USER
\`\`\`

## 寫法 3：從 Secret 取（密碼類）

Secret：

\`\`\`bash
# 用指令建（base64 自動處理）
kubectl create secret generic mysql-secret \\
  --from-literal=MYSQL_ROOT_PASSWORD=root1234 \\
  --from-literal=MYSQL_PASSWORD=app1234
\`\`\`

Pod 引用：

\`\`\`yaml
spec:
  containers:
  - name: mysql
    image: mysql:8.0
    env:
    - name: MYSQL_ROOT_PASSWORD
      valueFrom:
        secretKeyRef:
          name: mysql-secret
          key: MYSQL_ROOT_PASSWORD
    - name: MYSQL_PASSWORD
      valueFrom:
        secretKeyRef:
          name: mysql-secret
          key: MYSQL_PASSWORD
\`\`\`

> 📖 ConfigMap 跟 Secret 在 [Day 6](/blog/k8s/configmap-intro) 會深入教，這裡先看寫法。

## 寫法 4：envFrom 一次塞整包（懶人寫法）

如果 ConfigMap / Secret 裡所有 key 都要當環境變數，逐個寫太煩：

\`\`\`yaml
spec:
  containers:
  - name: mysql
    image: mysql:8.0
    envFrom:
    - configMapRef:
        name: mysql-config
    - secretRef:
        name: mysql-secret
\`\`\`

ConfigMap / Secret 裡的每個 key 都會自動變成環境變數。**省事，但少了「明確指定哪些變數」的清晰度**，看你取捨。

## 確認環境變數有進去

\`\`\`bash
kubectl exec mysql -- env | grep MYSQL
# MYSQL_ROOT_PASSWORD=root1234
# MYSQL_DATABASE=mydb
# MYSQL_USER=appuser
# MYSQL_PASSWORD=app1234
\`\`\`

## 三種寫法對照表

| 寫法 | 用途 | 特點 |
|:---|:---|:---|
| \`value: "xxx"\` | 不敏感、固定值 | 直接寫死在 YAML |
| \`valueFrom.configMapKeyRef\` | 不敏感、要分離 | 改 ConfigMap 不用改 Pod |
| \`valueFrom.secretKeyRef\` | 密碼、Token | 跟程式碼分離、能用 RBAC 管權限 |
| \`envFrom\` | 整包塞 | 偷懶，但欄位不夠明確 |

## 真實工作的最佳實踐

\`\`\`
資料庫名、user、port、log level → ConfigMap
密碼、API Token、TLS 憑證 → Secret
程式內部固定值 → 直接 value
\`\`\`

**永遠不要把密碼 \`value: "xxx"\` 寫在 YAML 然後 commit 到 Git**。即使是私有 repo 也一樣。

## 重點整理

- K8s 沒有 \`docker run -e\`，環境變數寫在 \`env\` 區塊
- 直接寫值用 \`value: "xxx"\`（記得字串加引號）
- 從 ConfigMap 取用 \`valueFrom.configMapKeyRef\`
- 從 Secret 取用 \`valueFrom.secretKeyRef\`
- \`envFrom\` 一次塞整包（省事但欄位不明確）
- 密碼類**永遠**用 Secret，不要 commit 到 Git

## 下一步

到目前為止你的 Pod 都是「一個人做事」 — Pod 一掛就什麼都沒了。下一篇正式進入 [Deployment 入門](/blog/k8s/deployment-intro)：從一個人做事變成一個團隊做事，刪 Pod 自動補回。

> 📚 **完整系列總覽**：[K8s 系列教學首頁](/blog/#k8s)（共 40 課，按學習路徑順序排）
`,
  },
  {
    slug: 'deployment-intro',
    order: 13,
    group: 'workload',
    title: 'Deployment 是什麼？為什麼不直接用 Pod？',
    excerpt:
      'Pod 自己掛了不會自動補，刪了就沒了。Deployment 是 Pod 的「保母」：跑幾份、版本是什麼、掛了怎麼辦，全部交給 K8s 照顧。',
    publishDate: '2026-05-10',
    tags: ['Kubernetes', 'Deployment', '入門', 'ReplicaSet'],
    readingTime: 9,
    content: `
## 直接建 Pod 有什麼問題？親身體驗一下

\`\`\`bash
kubectl run lonely-nginx --image=nginx:1.27
kubectl get pods   # Running，看起來很好

kubectl delete pod lonely-nginx
kubectl get pods   # 空的。沒了。沒人幫你補。
\`\`\`

如果這是生產環境，使用者現在正看著錯誤頁面。你要嘛半夜爬起來手動補，要嘛等到上班才發現。

**這就是「一個人做事」的脆弱**。一個人倒了事情就停了。

我們需要的是：**告訴 K8s「我要三個 nginx Pod，你幫我維持。少了一個你就自動補」**。這個東西就是 Deployment。

## Deployment YAML 跟 Pod YAML 差在哪？

\`\`\`yaml
# pod.yaml（你已經很熟了）
apiVersion: v1
kind: Pod
metadata:
  name: my-nginx
spec:
  containers:
  - name: nginx
    image: nginx:1.27
    ports:
    - containerPort: 80
\`\`\`

\`\`\`yaml
# deployment.yaml（多了三樣東西）
apiVersion: apps/v1                    # 不同！
kind: Deployment                       # 不同！
metadata:
  name: nginx-deploy
spec:
  replicas: 3                          # 新！要幾個副本
  selector:                            # 新！怎麼找 Pod
    matchLabels:
      app: nginx
  template:                            # 新！Pod 的模板
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.27
        ports:
        - containerPort: 80
\`\`\`

差異對照：

| 欄位 | Pod | Deployment |
|:---|:---|:---|
| \`apiVersion\` | \`v1\` | \`apps/v1\` |
| \`kind\` | \`Pod\` | \`Deployment\` |
| 容器定義位置 | \`spec.containers\` | \`spec.template.spec.containers\` |
| 多了什麼 | 沒有 | \`replicas\` + \`selector\` + \`template\` |

## 三個新欄位的意義

### 1. \`replicas: 3\` — 要維持幾個 Pod

寫 3 就維持 3 個、寫 5 就維持 5 個。Deployment 最核心的設定。

### 2. \`selector.matchLabels\` — 怎麼找到自己的 Pod

Deployment 不認 Pod 名字，**它認 label**。\`matchLabels: app=nginx\` 意思是：「所有 label 有 app=nginx 的 Pod，那些就是我管的」。

### 3. \`template\` — Pod 的模板

長得跟 Pod YAML 幾乎一樣（但不寫 \`apiVersion\` 跟 \`kind\`，因為 Deployment 已經知道這是 Pod 模板）。

> ⚠️ **\`selector\` 和 \`template.metadata.labels\` 必須一致**！如果 selector 寫 \`app: nginx\`、template labels 寫 \`app: web\`，Deployment 找不到自己的 Pod、會以為 Pod 不夠然後一直建，永遠停不下來。

## 三層關係：Deployment → ReplicaSet → Pod

\`\`\`
┌─────────────────────────────────────┐
│           Deployment                │  ← 你管這個
│  ┌───────────────────────────────┐  │
│  │         ReplicaSet            │  │  ← 自動建立，你不用管
│  │  ┌───────┐ ┌───────┐ ┌─────┐ │  │
│  │  │ Pod 1 │ │ Pod 2 │ │Pod 3│ │  │  ← 自動維持數量
│  │  └───────┘ └───────┘ └─────┘ │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
\`\`\`

**分工**：
- Deployment：管理「版本」（換 Image 時怎麼滾動更新、怎麼 rollback）
- ReplicaSet：管理「數量」（少了一個馬上補）
- Pod：實際在跑的容器

你只跟 Deployment 互動，ReplicaSet K8s 自動幫你管。

## 部署 + 驗證三層

\`\`\`bash
kubectl apply -f deployment.yaml
# deployment.apps/nginx-deploy created

# 驗證三層
kubectl get deployments
# nginx-deploy   READY 3/3   AVAILABLE 3

kubectl get replicasets
# nginx-deploy-7d8c5f6b9   DESIRED 3   CURRENT 3   READY 3

kubectl get pods
# nginx-deploy-7d8c5f6b9-abc12   Running
# nginx-deploy-7d8c5f6b9-xyz45   Running
# nginx-deploy-7d8c5f6b9-def67   Running

# 一行看三層
kubectl get deploy,rs,pods
\`\`\`

Pod 名字格式：\`<deployment-name>-<replicaset-hash>-<pod-random>\`。

## 重點實驗：刪 Pod 看自動補回

\`\`\`bash
# 隨便挑一個 Pod 名字
kubectl delete pod nginx-deploy-7d8c5f6b9-abc12

# 馬上看
kubectl get pods
# 還是 3 個！但有一個 AGE 是幾秒鐘 ← K8s 自動補了一個新的
\`\`\`

ReplicaSet 持續監控：發現從 3 變 2 → 不符合 \`replicas: 3\` → 自動建一個新的補上。**整個過程你什麼都不用做**。

對比剛才的 \`lonely-nginx\`：
- 直接 \`kubectl run\` 的 Pod：刪掉就沒了
- 透過 Deployment 的 Pod：刪掉自動補回
- 想真的不要了？刪 Deployment：\`kubectl delete deployment nginx-deploy\`

## 擴縮容一行搞定

\`\`\`bash
# 雙十一流量暴增，3 → 5
kubectl scale deployment nginx-deploy --replicas=5
kubectl get pods   # 5 個

# 流量過了，5 → 2
kubectl scale deployment nginx-deploy --replicas=2
kubectl get pods   # 多的被砍掉，剩 2 個
\`\`\`

跟 Docker Compose 對比：

| 動作 | Docker Compose | K8s |
|:---|:---|:---|
| 擴到 5 個 | \`docker compose up --scale web=5\` | \`kubectl scale deploy xxx --replicas=5\` |
| 自動補 Pod | 做不到（除非 Swarm） | Deployment 自動補 |
| 跨機器分散 | 做不到（除非 Swarm） | Scheduler 自動分配 Node |

## 從一個人到一個團隊

\`\`\`
Pod = 一個人做事
  └─ 生病就停工，沒人頂

Deployment = 一個團隊做事
  └─ 有人倒了馬上有人頂上
  └─ 半夜 Pod 掛了 → K8s 自動補
  └─ 你睡得安穩，明天看監控才知道發生過
\`\`\`

## 重點整理

- 不要直接建 Pod，要透過 Deployment 管理 Pod
- Deployment YAML 比 Pod 多三樣：\`replicas\` / \`selector\` / \`template\`
- 三層關係：Deployment → ReplicaSet → Pod（ReplicaSet 你不用管）
- selector 跟 template labels **必須一致**
- 刪 Pod 自動補回 = 自我修復
- \`kubectl scale\` 一行擴縮容
- \`kubectl delete deployment\` 才是真的刪掉

## 下一步

維持 3 個 Pod 會了，但實際工作中**會用更頻繁的是擴縮容跟更新**。下一篇講[Deployment 擴縮容：從 3 個到 100 個一行搞定](/blog/k8s/deployment-scale)，順便看 K8s 在多節點叢集怎麼自動分散 Pod。

> 📚 **完整系列總覽**：[K8s 系列教學首頁](/blog/#k8s)（共 40 課，按學習路徑順序排）
`,
  },
  {
    slug: 'deployment-scale',
    order: 14,
    group: 'workload',
    title: 'kubectl scale 擴縮容實戰：流量大了怎麼辦？',
    excerpt:
      '流量翻倍要擴容、半夜沒人要縮容。Deployment 一個 scale 指令搞定，不用重啟、不用停機。這篇實測 3 → 5 → 2 的全流程。',
    publishDate: '2026-05-11',
    tags: ['Kubernetes', 'scale', '擴縮容', 'Deployment'],
    readingTime: 7,
    content: `
## 平常 3 個 Pod 夠用，週年慶流量 10 倍怎麼辦？

[上一篇](/blog/k8s/deployment-intro)講了 Deployment 怎麼維持副本數。這篇要回答更實用的問題：**流量暴增的時候怎麼擴 Pod？流量退了又怎麼縮回來？**

電商網站平常每秒一千個請求，三個 Pod 處理綽綽有餘。週年慶預估十倍流量 — 一秒一萬個請求。三個 Pod 撐爆，回應時間從 100ms 飆到 5 秒，使用者直接關掉，營收腰斬。

解法：**加 Pod**。三個不夠就加到十個，回應時間就回來了。

## 一行指令搞定

\`\`\`bash
kubectl scale deployment my-nginx --replicas=10
\`\`\`

就這樣。Deployment 副本數從 3 變 10，K8s 自動建 7 個新 Pod，**Scheduler 還會把它們分散到不同的 Node**，讓每台機器負擔均衡。

## 背後機制：4 個架構元件接力

我們把第四堂的[架構知識](/blog/k8s/k8s-architecture-master-worker)串起來看：

\`\`\`
你打 kubectl scale
   ↓
API Server 把 replicas: 3 改成 10、寫進 etcd
   ↓
Controller Manager 監控到差異（期望 10、實際 3，差 7 個）
   ↓
Scheduler 看各 Node 資源、決定哪 7 個 Pod 放哪台
   ↓
各 Node 上的 kubelet 拉 Image、啟動容器
\`\`\`

跟「建一個 Pod」的流程**一模一樣**，只是這次一口氣建 7 個。架構沒變、量變了。

## 縮容也是一行指令

週年慶結束，流量退回正常：

\`\`\`bash
kubectl scale deployment my-nginx --replicas=3
\`\`\`

K8s 會砍掉多的 7 個 Pod。砍哪 7 個？K8s 有自己的策略（考慮 Pod 啟動時間、Node 負載等等），你不用管細節。

如果你的叢集跑在雲端，**多餘的 Pod 佔著運算資源是要花錢的**。所以縮容跟擴容一樣重要。

## 水平擴縮容 vs 垂直擴縮容

| 方式 | 做法 | K8s 對應 |
|:---|:---|:---|
| 水平擴縮容（Horizontal） | 加減副本數量，每副本規格不變 | \`kubectl scale\` / HPA |
| 垂直擴縮容（Vertical） | 加大單個 Pod 的 CPU / 記憶體 | requests / limits |

**比喻**：餐廳生意太好，水平擴容是多請幾個廚師，垂直擴容是給廚師更大的鍋。一台機器的 CPU 有上限、不能無限加，所以**生產環境最常用水平擴縮容**。

## 對照 Docker：跨機器分散是 K8s 獨有

\`\`\`bash
# Docker Compose 也能擴
docker compose up --scale web=10
# 但 10 個容器全擠在同一台機器上 ❌
\`\`\`

K8s 的 \`scale\` 是跨 Node 的，**Pod 自動分散到不同機器**，每台都出一份力。這是本質的差異。

## 實作：在 k3s 多節點看分散

\`\`\`bash
# 建 Deployment
kubectl create deployment my-nginx --image=nginx --replicas=3

# 看 Pod 跑在哪個 Node
kubectl get pods -o wide
# NAME              ...  NODE
# my-nginx-xxx-aaa  ...  k3s-master
# my-nginx-xxx-bbb  ...  k3s-worker1
# my-nginx-xxx-ccc  ...  k3s-master
\`\`\`

Pod 自動分散在兩個 Node 上。

擴到 10：

\`\`\`bash
kubectl scale deployment my-nginx --replicas=10
kubectl get pods -o wide
# 10 個 Pod 自動分散到兩個 Node
\`\`\`

縮回 3：

\`\`\`bash
kubectl scale deployment my-nginx --replicas=3
kubectl get pods
# 7 個 Pod 變成 Terminating，最後剩 3 個
\`\`\`

> ⚠️ \`scale\` 的對象是 **Deployment**，不是 Pod。Pod 沒有副本概念。

## 觀察 Pod 即時變化

開兩個終端：

\`\`\`bash
# 終端 1：持續觀察
kubectl get pods --watch

# 終端 2：快速連打（每次間隔幾秒）
kubectl scale deployment my-nginx --replicas=5
kubectl scale deployment my-nginx --replicas=8
kubectl scale deployment my-nginx --replicas=10
kubectl scale deployment my-nginx --replicas=3
\`\`\`

終端 1 你會看到 Pod 快速增加、快速減少。**這就是第七堂 [HPA 自動擴縮](/blog/k8s/hpa-autoscale-loadtest) 幫你做的事**：流量大自動加、流量小自動砍，連 \`scale\` 指令都不用打。

## scale 0 = 暫停服務

\`\`\`bash
kubectl scale deployment my-nginx --replicas=0
kubectl get deploy
# READY: 0/0   ← Pod 全砍但 Deployment 還在

kubectl scale deployment my-nginx --replicas=3
kubectl get pods   # Pod 又回來了
\`\`\`

維護某個服務時很有用：暫停不用刪 Deployment，留著之後再起來。

## 看擴縮容歷史

\`\`\`bash
kubectl describe deployment my-nginx | grep -A 20 Events
# Events 區塊會記錄每次 scale：
# Scaled up replica set my-nginx-xxx to 5
# Scaled down replica set my-nginx-xxx to 1
\`\`\`

排查問題時非常有用。

## 重點整理

- 擴縮容一行指令：\`kubectl scale deployment xxx --replicas=N\`
- scale 的對象是 **Deployment 不是 Pod**
- 背後流程跟建單一 Pod 一模一樣，只是量變
- K8s 的 scale 是跨 Node 的（Docker Compose 做不到）
- 水平擴縮容（加副本）比垂直擴縮容（加 CPU / 記憶體）常用
- \`scale 0\` 暫停服務不刪 Deployment
- describe 的 Events 看擴縮容歷史

## 下一步

副本數會調了，但**版本要更新時怎麼辦**？v1 換 v2 時不能停服務。下一篇講[滾動更新與回滾：零停機部署](/blog/k8s/rolling-update-rollback)，逐步替換的精髓。

> 📚 **完整系列總覽**：[K8s 系列教學首頁](/blog/#k8s)（共 40 課，按學習路徑順序排）
`,
  },
  {
    slug: 'rolling-update-rollback',
    order: 15,
    group: 'workload',
    title: '滾動更新 vs 回滾：零停機部署 nginx 1.26 → 1.27 全流程',
    excerpt:
      '更新版本不用停機，K8s 一個一個 Pod 換掉。但新版本壞了怎麼辦？kubectl rollout undo 一個指令就退回上一版。這篇實測整段流程。',
    publishDate: '2026-05-12',
    tags: ['Kubernetes', '滾動更新', '回滾', 'rollout'],
    readingTime: 10,
    content: `
## API 有新版本，怎麼把 v1 換成 v2？

[上一篇](/blog/k8s/deployment-scale)學完擴縮容，這篇處理另一個現實問題：**版本更新**。

你的 API 跑 nginx 1.26，新版本 1.27 開發完了。要把線上 v1.26 換成 v1.27。怎麼做？

最土的方法：把舊 Pod 全砍 → 用新 Image 建一批。問題是**舊的砍掉、新的還沒起來那段時間，使用者看到 502 Bad Gateway**。電商網站幾秒空窗就是幾萬塊損失，金融系統幾秒可能整筆交易出錯。

**生產環境不允許這樣做**。K8s 用一個叫「滾動更新（Rolling Update）」的策略解這個問題。

## 滾動更新核心：逐步替換

四個字：**逐步替換**。不是全砍全建，是一個一個來。

3 個 Pod 跑 v1，要更新到 v2：

\`\`\`
初始：[v1] [v1] [v1]
  ↓ 建 1 個 v2
       [v1] [v1] [v1] [v2]
  ↓ 健康檢查通過 → 砍 1 個 v1
       [v1] [v1] [v2]
  ↓ 建 1 個 v2，砍 1 個 v1
       [v1] [v2] [v2]
  ↓ 建 1 個 v2，砍 1 個 v1
       [v2] [v2] [v2]
\`\`\`

任何時刻都有 Pod 在服務，使用者請求不會落空。**像接力賽，下一棒跑起來上一棒才放手**，沒有沒人跑的空檔。

## 背後機制：新舊 ReplicaSet 的蹺蹺板

[Deployment 三層關係](/blog/k8s/deployment-intro)：Deployment → ReplicaSet → Pod。

滾動更新的秘密在 ReplicaSet 這層：

\`\`\`
觸發更新時：
  Deployment 建一個全新的 ReplicaSet
   ↓
  舊 ReplicaSet（管 v1）副本數從 3 → 0
  新 ReplicaSet（管 v2）副本數從 0 → 3
   ↓
  蹺蹺板，一邊下去一邊上來
\`\`\`

你 \`kubectl get rs\` 會看到兩個 ReplicaSet：一個 READY 是 3（新版）、另一個 READY 是 0（舊版）。

**舊的不會被刪掉**，副本數歸零還在 — 因為要留著給回滾用。

## 觸發滾動更新

最佳實踐：**改 YAML 再 apply**。

\`\`\`bash
# 1. 取出現在的 YAML
kubectl get deployment my-nginx -o yaml > deployment.yaml

# 2. 改 image: nginx:1.26 → image: nginx:1.27（編輯器手動改）

# 3. apply 觸發更新
kubectl apply -f deployment.yaml

# 4. 看更新進度
kubectl rollout status deployment/my-nginx
# Waiting for deployment "my-nginx" rollout to finish: 1 out of 3 new replicas have been updated...
# Waiting for deployment "my-nginx" rollout to finish: 2 out of 3 new replicas have been updated...
# deployment "my-nginx" successfully rolled out
\`\`\`

驗證：

\`\`\`bash
# 看 Pod 名字（hash 變了，因為新 ReplicaSet）
kubectl get pods

# 看兩個 ReplicaSet
kubectl get rs
# my-nginx-aaa   DESIRED 3   CURRENT 3   READY 3   ← 新版 1.27
# my-nginx-bbb   DESIRED 0   CURRENT 0   READY 0   ← 舊版 1.26

# 看當前 Image
kubectl describe deployment my-nginx | grep Image
# Image: nginx:1.27
\`\`\`

## 還有一個快捷方式：set image

\`\`\`bash
kubectl set image deployment/my-nginx nginx=nginx:1.27
\`\`\`

不用改檔案直接觸發更新。但**生產環境推薦改 YAML 再 apply**，因為：

- YAML 跟 Git 版本控制一致
- 團隊看檔案就知道現在跑什麼版本
- \`set image\` 改了不會反映到你的 YAML 檔

## 回滾：一行指令救命

v2 上線後使用者回報 bug，老闆衝過來說「趕快退回去」：

\`\`\`bash
kubectl rollout undo deployment/my-nginx
\`\`\`

**Deployment 把舊 ReplicaSet 重新擴回 3、新的縮到 0**。因為舊 ReplicaSet 還在、舊 Image 還在 Node 快取，回滾通常 30 秒搞定 — **不需要重新 build、不需要重推 Registry**。

## rollout history：看部署歷史

\`\`\`bash
kubectl rollout history deployment/my-nginx
# REVISION  CHANGE-CAUSE
# 1         <none>
# 2         <none>
# 3         <none>
\`\`\`

每次部署都記一個 revision。要回到特定版本：

\`\`\`bash
kubectl rollout undo deployment/my-nginx --to-revision=2
\`\`\`

> 💡 K8s 預設保留最近 10 個版本（由 \`spec.revisionHistoryLimit\` 控制）。

## 實戰：故意推一個壞版本看 K8s 怎麼保護你

\`\`\`bash
# YAML 把 image 改成 nginx:99.99（不存在）
kubectl apply -f deployment.yaml

kubectl get pods
# 新 Pod: ImagePullBackOff
# 舊 Pod: 還活著！
\`\`\`

K8s **不會把所有舊 Pod 砍光才建新的**，滾動更新的安全機制讓舊 Pod 保留。所以：

- 服務沒有完全更新成功
- 但也沒有完全掛掉
- 使用者依然能訪問到舊版

\`\`\`bash
# 救命稻草
kubectl rollout undo deployment/my-nginx
\`\`\`

舊 Pod 恢復、壞掉的新 Pod 砍掉，服務回正常。**真實工作中超常見**：開發人員打錯 tag、推了問題 Image、滾動更新卡住。別慌，\`rollout undo\` 一行搞定。

## 滾動更新指令速查

| 操作 | 指令 |
|:---|:---|
| 觸發更新 | 改 YAML → \`kubectl apply\` |
| 看進度 | \`kubectl rollout status deployment/xxx\` |
| 回上一版 | \`kubectl rollout undo deployment/xxx\` |
| 回特定版本 | \`kubectl rollout undo deployment/xxx --to-revision=N\` |
| 看歷史 | \`kubectl rollout history deployment/xxx\` |
| 暫停 | \`kubectl rollout pause deployment/xxx\` |
| 恢復 | \`kubectl rollout resume deployment/xxx\` |

## 對照 Docker：K8s 大幅領先

| 功能 | Docker Compose | K8s |
|:---|:---|:---|
| 滾動更新 | 沒有 | 內建 |
| 健康檢查切換 | 沒有 | 內建 |
| 一行回滾 | 沒有 | \`rollout undo\` |
| 版本歷史 | 沒有 | \`rollout history\` |

Docker Compose \`up -d\` 換 Image 就是直接砍舊建新，**有空窗期**。Docker Swarm 有滾動更新但很多人不用。K8s 的滾動更新是生產環境的標配。

## 重點整理

- 滾動更新 = 逐步替換，零停機
- 背後是新舊 ReplicaSet 的蹺蹺板
- 觸發方式：改 YAML → apply（生產推薦）或 \`set image\`（快捷）
- 舊 ReplicaSet 保留著，回滾就是把它擴回來
- \`rollout status\` 看進度、\`rollout history\` 看歷史、\`rollout undo\` 救命
- 推壞 Image 不會把舊 Pod 砍光，滾動更新有保護機制

## 下一步

更新會了。但 Deployment 怎麼**找到**自己的 Pod？答案不是 Pod 名字，而是 **labels**。下一篇講[Labels 與自我修復：K8s 怎麼認自己的 Pod](/blog/k8s/self-healing-labels-selector)，把 Day 4-5 的 Deployment 故事收尾。

> 📚 **完整系列總覽**：[K8s 系列教學首頁](/blog/#k8s)（共 40 課，按學習路徑順序排）
`,
  },
  {
    slug: 'self-healing-labels-selector',
    order: 16,
    group: 'workload',
    title: 'K8s 自我修復原理：Labels 和 Selector 在做什麼？',
    excerpt:
      '為什麼 delete pod 之後 K8s 自動補一個？因為 Deployment 用 selector 一直在數「我管的 label 有幾個 Pod」，少一個就補一個。這篇用 label 拆穿 K8s 的魔法。',
    publishDate: '2026-05-13',
    tags: ['Kubernetes', '自我修復', 'Labels', 'Selector'],
    readingTime: 9,
    content: `
## Deployment 怎麼知道哪些 Pod 屬於自己？

[Deployment](/blog/k8s/deployment-intro) 你已經會用了。但有沒有想過：

- 你刪一個 Pod，Deployment 是怎麼**發現少一個**的？
- 同一個叢集跑 nginx 跟 httpd 兩個 Deployment，K8s 怎麼**分得出哪些 Pod 屬於誰**？
- Pod 名字有 hash 不固定，**Deployment 用什麼追蹤 Pod**？

答案不是 Pod 名字，而是 **Labels（標籤）+ Selector（選擇器）**。這是 K8s 整個資源關聯的核心機制。

## Labels = Pod 上的便利貼

每個 Pod 都可以貼任意數量的 label：

\`\`\`yaml
metadata:
  name: my-nginx
  labels:
    app: nginx       # 應用名稱
    tier: frontend   # 層級
    env: prod        # 環境
    version: v1      # 版本
\`\`\`

Label 是 key-value pair。**愛貼幾個就貼幾個**，K8s 不會限制。

## Selector = 告訴 K8s「我要找哪些 Pod」

Deployment 用 selector 找自己的 Pod：

\`\`\`yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deploy
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx     # 找 app=nginx 的 Pod
  template:
    metadata:
      labels:
        app: nginx   # template 建出來的 Pod 會有這個 label
    spec:
      containers:
      - name: nginx
        image: nginx:1.27
\`\`\`

**ReplicaSet 持續監控**：「目前有幾個 \`app=nginx\` 的 Pod？少一個就建一個。」

## ⚠️ selector 跟 template labels 必須一致

這是 Deployment 最常踩的坑。

\`\`\`yaml
spec:
  selector:
    matchLabels:
      app: nginx       # 我要找 app=nginx
  template:
    metadata:
      labels:
        app: web       # ❌ 但建出的 Pod label 是 app=web
\`\`\`

結果：
- ReplicaSet 找不到自己建的 Pod（label 不符）
- 以為「Pod 不夠」一直建新的
- **永遠停不下來**

寫 Deployment YAML 時務必檢查這兩處 label 一致。

## 自我修復的真正原理

\`\`\`
1. Deployment 設 replicas: 3
   ↓
2. ReplicaSet 用 selector「app=nginx」找 Pod
   ↓
3. 你 kubectl delete pod my-nginx-xxx
   ↓
4. ReplicaSet 重新查：app=nginx 的 Pod 只剩 2 個
   ↓
5. 期望 3 但實際 2 → 用 template 建一個新的
\`\`\`

**Deployment 從來不認 Pod 名字、只認 label**。只要 label 對得上，新 Pod 就被「認領」。

## 實作：手動驗證 label 機制

\`\`\`bash
kubectl create deployment nginx-deploy --image=nginx:1.27 --replicas=3

# 看 Pod label
kubectl get pods --show-labels
# NAME                            ...  LABELS
# nginx-deploy-xxx-aaa  ...  app=nginx-deploy,pod-template-hash=xxx
# nginx-deploy-xxx-bbb  ...  app=nginx-deploy,pod-template-hash=xxx
# nginx-deploy-xxx-ccc  ...  app=nginx-deploy,pod-template-hash=xxx
\`\`\`

K8s 自動加了：
- \`app=nginx-deploy\`（你的 selector）
- \`pod-template-hash=xxx\`（給 ReplicaSet 區分版本用，滾動更新會看到不同 hash）

## 用 label 篩選 Pod

\`\`\`bash
# 篩 app=nginx-deploy
kubectl get pods -l app=nginx-deploy

# 多個條件用逗號（AND）
kubectl get pods -l app=nginx-deploy,tier=frontend

# 反向選擇
kubectl get pods -l app!=nginx-deploy
\`\`\`

實用場景：

\`\`\`bash
# 一次刪除所有 app=test 的 Pod
kubectl delete pods -l app=test

# 看所有 prod 環境的 Pod
kubectl get pods --all-namespaces -l env=prod
\`\`\`

## 「孤兒 Pod」實驗

如果你**直接修改 Pod 的 label** 把它跟 Deployment 切斷會怎樣？

\`\`\`bash
# 看一下 Deployment 跟 Pod
kubectl get pods -l app=nginx-deploy
# 3 個 Pod

# 改其中一個 Pod 的 label，把 app 改成別的
kubectl label pod nginx-deploy-xxx-aaa app=orphan --overwrite

# 馬上看
kubectl get pods -l app=nginx-deploy
# 只剩 2 個！

kubectl get pods
# 但總共有 4 個 Pod！
# nginx-deploy-xxx-aaa（label app=orphan）  ← 孤兒，不歸 Deployment 管
# nginx-deploy-xxx-bbb（label app=nginx-deploy）
# nginx-deploy-xxx-ccc（label app=nginx-deploy）
# nginx-deploy-xxx-NEW（label app=nginx-deploy）  ← Deployment 補的新 Pod
\`\`\`

**Deployment 看到 \`app=nginx-deploy\` 的 Pod 變 2 個，立刻補一個新的**。原本那個 Pod 還活著、但 label 不符 → 變孤兒，Deployment 不再管它（你要自己 \`kubectl delete pod\` 殺掉）。

這個實驗很清楚地展示了 **K8s 的關聯都是 label 驅動的**。

## Service 也是用 label 找 Pod

不只 Deployment，[後面學的 Service](/blog/k8s/clusterip-service) 也一樣：

\`\`\`yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx-svc
spec:
  selector:
    app: nginx     # ← 把流量送到所有 app=nginx 的 Pod
  ports:
  - port: 80
\`\`\`

label = K8s 整個世界的關聯機制。掌握 label 就掌握 K8s。

## 自我修復的場景

實際工作中 K8s 自我修復救過很多次：

| 情境 | K8s 怎麼救 |
|:---|:---|
| Pod OOM 被 kernel kill | ReplicaSet 補新 Pod |
| Node 當機 | 上面所有 Pod 被自動排到別台 Node |
| 你誤刪 Pod | 馬上補回來 |
| 容器 crash 退出 | restartPolicy 重啟 |

不需要你寫腳本、不需要你半夜爬起來，**這就是 K8s 比 Docker 強的核心**。

## 重點整理

- K8s 用 label + selector 關聯資源（不認名字）
- Deployment 的 \`selector.matchLabels\` 必須跟 \`template.metadata.labels\` 一致
- ReplicaSet 持續監控 label 對得上的 Pod 數量，少了就補
- \`kubectl get pods -l key=value\` 用 label 篩選
- 改 Pod label 會讓它脫離 Deployment 變孤兒
- Service 也用 label 找 Pod
- 自我修復不是黑魔法，就是 ReplicaSet 持續比對 label 跟期望數量

## 下一步

Deployment + Pod 的故事告一段落。但**外面怎麼連到 Pod**？Pod IP 隨時會變、Pod 還會被 K8s 搬到別的 Node。下一篇進入 Service 的世界：[ClusterIP：固定 IP 解決 Pod IP 飄忽問題](/blog/k8s/clusterip-service)。

> 📚 **完整系列總覽**：[K8s 系列教學首頁](/blog/#k8s)（共 40 課，按學習路徑順序排）
`,
  },

  // ====== Group 3: networking — 網路與服務（對應第 5 堂下午 + 第 6 堂上午）======
  {
    slug: 'clusterip-service',
    order: 17,
    group: 'networking',
    title: 'ClusterIP Service 入門：Pod 之間怎麼互相找到？',
    excerpt:
      'Pod IP 會變、不能寫死。Service 給你一個固定的虛擬 IP（ClusterIP），永遠指向那群 Pod。這篇用 busybox curl nginx-svc 實測叢集內部通訊。',
    publishDate: '2026-05-14',
    tags: ['Kubernetes', 'Service', 'ClusterIP', '網路'],
    readingTime: 9,
    content: `
## Pod 跑起來了，外面怎麼連進去？

[到 Day 5 Deployment 為止](/blog/k8s/self-healing-labels-selector)，我們的 Pod 管得好好的：擴縮容、滾動更新、自我修復都會了。但是有個現實問題沒解決：

**Pod 跑起來了，但 Pod 有三個常見的痛點**：

1. **Pod IP 會變** — 你刪一個 Pod 重建，IP 從 \`10.42.0.15\` 變成 \`10.42.0.20\`。前端寫死 IP 連線就斷了
2. **流量該分給誰** — 三個 Pod 副本，使用者該連哪一個？三個人都連同一個就浪費了擴容
3. **Pod IP 是叢集內部虛擬 IP** — 你瀏覽器打不開

K8s 的解法是 **Service**。Service 給你一個**永遠不變的 IP + 自動負載均衡**。Pod 怎麼換、怎麼重建都不影響。

## ClusterIP：Service 的預設類型

Service 有三種類型，這篇先講最常用的 **ClusterIP**：

- 給 Service 一個**叢集內部的虛擬 IP**
- IP **永遠不變**（只要 Service 存在）
- 自動把流量負載均衡到後面的 Pod
- 自動 DNS 解析（用 Service 名字就能連）

> ⚠️ ClusterIP 只在叢集內可見。外面的瀏覽器連不上 — 那是 [NodePort](/blog/k8s/nodeport-three-services) 的工作。

## Service 怎麼找到後面的 Pod？

答案還是 **[label + selector](/blog/k8s/self-healing-labels-selector)**：

\`\`\`yaml
# service-clusterip.yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx-svc
spec:
  type: ClusterIP        # 預設值，可省略
  selector:
    app: nginx           # ← 找所有 app=nginx 的 Pod
  ports:
  - port: 80             # Service 監聽的 port
    targetPort: 80       # 轉發到 Pod 的 port
\`\`\`

> 💡 **黃金法則重申**：Deployment selector / Pod template labels / Service selector 三者必須一致。寫錯一個 Service 就找不到 Pod。

## port vs targetPort 怎麼分？

- \`port: 80\` — Service 自己監聽的 port（別人連 Service 用這個）
- \`targetPort: 80\` — 轉發到 Pod 容器的哪個 port（最終接收請求的地方）

兩個通常一樣。但你也可以讓 Service 開 8080、Pod 開 80：

\`\`\`yaml
ports:
- port: 8080         # 別人連 nginx-svc:8080
  targetPort: 80     # 實際送到 Pod 的 80
\`\`\`

對照 \`docker run -p 8080:80\`：左邊 8080 = port，右邊 80 = targetPort。

## 部署 + 驗證

\`\`\`bash
kubectl apply -f service-clusterip.yaml

# 看 Service
kubectl get svc
# nginx-svc   ClusterIP   10.43.0.150   <none>   80/TCP

# 10.43.0.150 就是 ClusterIP，永遠不變
\`\`\`

## Endpoints：Service 背後的 Pod IP 列表

K8s 在背後維護一個 Endpoints 物件，記錄 Service 對應到哪些 Pod IP：

\`\`\`bash
kubectl get endpoints nginx-svc
# ENDPOINTS: 10.42.0.15:80, 10.42.1.8:80, 10.42.2.12:80
\`\`\`

這三個就是 nginx Deployment 的三個 Pod IP。

**Pod 重建/擴容時，Endpoints 自動更新** — 你完全不用手動改。

## 從另一個 Pod 連進去測試

\`\`\`bash
# 開一個臨時 Pod 測試
kubectl run test-curl --image=curlimages/curl --rm -it --restart=Never -- sh

# 進到 shell 後
curl http://nginx-svc
# 看到 nginx 歡迎頁

# 完整 DNS 名字也行
curl http://nginx-svc.default.svc.cluster.local

# 多打幾次，K8s 自動負載均衡到不同 Pod
\`\`\`

## DNS 名字格式：用 Service 名字就能連

K8s 內建 CoreDNS，每個 Service 自動註冊一筆 DNS 紀錄：

\`\`\`
完整：<svc-name>.<namespace>.svc.cluster.local
同 namespace：<svc-name>
跨 namespace：<svc-name>.<namespace>
\`\`\`

實際例子：
- \`nginx-svc\` ← 在 default namespace 內，這樣就行
- \`nginx-svc.default\` ← 跨 namespace 連
- \`nginx-svc.default.svc.cluster.local\` ← 完整 FQDN

## 自動更新驗證：刪 Pod 看 Endpoints

\`\`\`bash
kubectl get endpoints nginx-svc
# 記下三個 IP

kubectl delete pod nginx-deploy-xxx-aaa
# Deployment 自動補新 Pod（IP 變了）

# 等幾秒
kubectl get endpoints nginx-svc
# 三個 IP 中有一個變了 ← Service 自動偵測 + 更新
\`\`\`

**Service 幫你解決的問題**：Pod 隨便掛、隨便重建、IP 怎麼變都沒關係，Service 地址永遠不變、流量永遠到健康的 Pod。

## 連不上 Service 怎麼辦？常見排錯

固定排錯流程：

\`\`\`bash
# 1. 看 endpoints 有沒有 IP
kubectl get endpoints nginx-svc
# 空的 → selector 沒對上
# 有 IP → 走第 2 步

# 2. 確認 selector 跟 Pod label 一致
kubectl describe svc nginx-svc | grep Selector
# Selector: app=nginx
kubectl get pods --show-labels
# 確認 Pod 的 LABELS 有 app=nginx

# 3. 確認 targetPort 跟容器實際監聽的 port 一致
\`\`\`

90% 的 Service 連不上是 **selector 對不上**或 **targetPort 寫錯**。

## 對照 Docker Compose

| 功能 | Docker Compose | K8s ClusterIP |
|:---|:---|:---|
| 服務名稱 DNS | \`http://api:8080\` | \`http://nginx-svc:80\` |
| 跨 Node | 做不到 | ✅ |
| 自動負載均衡 | 簡單輪詢 | kube-proxy 真的負載均衡 |
| 健康檢查踢 Pod | 做不到 | ✅ |

概念一樣，但 K8s 多了跨節點 + 健康檢查 + 真負載均衡。

## 重點整理

- ClusterIP = 叢集內部的穩定 IP，永遠不變
- 用 \`selector\` + label 找後面的 Pod
- \`port\` 是 Service 監聽的、\`targetPort\` 是 Pod 容器監聽的
- 用 \`<svc-name>\` 在同 namespace 直接連
- Endpoints 自動更新（Pod 變動跟著動）
- 連不上 → 先看 Endpoints 是否為空 → selector → targetPort

## 下一步

ClusterIP 解決了**叢集內部**的連線。但**外面的使用者**怎麼連？這就要用 [NodePort、LoadBalancer 和三種 Service 的差異](/blog/k8s/nodeport-three-services)。

> 📅 **下一篇**：[NodePort 是什麼？K8s 三種 Service 怎麼選？](/blog/k8s/nodeport-three-services)
> 把這篇學到的 ClusterIP 升級到「外面也連得到」,順便講清楚 LoadBalancer 跟雲端的關係。

> 📚 **完整系列總覽**：[K8s 系列教學首頁](/blog/#k8s)（共 40 課，按學習路徑順序排）
`,
  },
  {
    slug: 'nodeport-three-services',
    order: 18,
    group: 'networking',
    title: 'NodePort 是什麼？K8s 三種 Service（ClusterIP / NodePort / LoadBalancer）怎麼選？',
    excerpt:
      'ClusterIP 只在叢集內看得到，外面連不進來。NodePort 把每個 Node 的 port 開出來，外網就能連。這篇講清楚三種 Service 的差別與適用場景。',
    publishDate: '2026-05-15',
    tags: ['Kubernetes', 'NodePort', 'LoadBalancer', 'Service'],
    readingTime: 9,
    content: `
## ClusterIP 的天花板

[上一篇](/blog/k8s/clusterip-service) ClusterIP 把多個 Pod 變成一個固定的虛擬 IP，叢集內所有 Pod 都能用 \`mysql-svc\` 連到 MySQL。

**但問題來了**：你的瀏覽器在叢集**外面**。

ClusterIP 只在叢集內部可見。你打 \`curl 10.96.0.5\` 從筆電完全沒反應 — 因為那是 K8s 內部的虛擬網段。

外面要連進來，需要把 Service 從叢集內「往外開一道門」。這就是 **NodePort**。

## NodePort 是什麼？

NodePort 在**每個 Node** 上都開一個指定的 port（範圍 30000-32767），任何打到 \`Node IP:NodePort\` 的流量會被導到對應的 Pod。

\`\`\`
外部使用者
    ↓ curl <Node IP>:30080
┌─────────────────────────┐
│ Node 1 :30080 ─┐         │
│ Node 2 :30080 ─┼─→ Pod   │   ← 任何 Node 都行
│ Node 3 :30080 ─┘         │
└─────────────────────────┘
\`\`\`

**重點**：不是只有 Pod 所在的 Node 開 port，是**每個 Node 都開**。你打哪個 Node IP 都會通。

## 三個 Port 在做什麼？

NodePort YAML 看起來會有三個 port，新手最容易混。

\`\`\`yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx-nodeport
spec:
  type: NodePort
  selector:
    app: nginx
  ports:
    - nodePort: 30080      # ① Node 上對外的 port
      port: 80             # ② Service 在叢集內的 port
      targetPort: 80       # ③ Pod 容器裡的 port
\`\`\`

流量路線（從外到內）：

\`\`\`
外面 curl <Node IP>:30080  ← ① nodePort
        ↓
Service ClusterIP:80       ← ② port（叢集內依然有 ClusterIP）
        ↓
Pod 容器:80                ← ③ targetPort
\`\`\`

**口訣**：
- \`nodePort\` = 對外
- \`port\` = 對內（給叢集內其他 Pod 用，跟 ClusterIP 一樣）
- \`targetPort\` = 容器

NodePort 沒有取代 ClusterIP — 它是「在 ClusterIP 上面**再加一層**對外的入口」。叢集內依然可以 \`curl nginx-nodeport:80\`，外面也可以 \`curl <Node IP>:30080\`。

## 從外面驗證

部署完後：

\`\`\`bash
$ kubectl get svc nginx-nodeport
NAME             TYPE       CLUSTER-IP      PORT(S)
nginx-nodeport   NodePort   10.96.50.10     80:30080/TCP

$ kubectl get nodes -o wide
NAME           INTERNAL-IP
k3d-cluster1   192.168.97.2
\`\`\`

從**任何一台 Node** 連 30080：

\`\`\`bash
$ curl 192.168.97.2:30080
<h1>Welcome to nginx!</h1>
\`\`\`

**重點觀察**：

1. \`PORT(S)\` 顯示 \`80:30080\` — 80 是叢集內的 port，30080 是 Node 對外的
2. 多 Node 叢集，**每個 Node 都會聽 30080**，連哪台都行
3. 流量到 Node 後，K8s 會幫你轉發到對應 Pod（即使 Pod 不在這台 Node 上）

## LoadBalancer：雲端的玩法

NodePort 的問題：**使用者要記 IP 和 port**。\`192.168.97.2:30080\` 不能上 production。

正式環境的做法是 **LoadBalancer**：

\`\`\`yaml
spec:
  type: LoadBalancer
  selector:
    app: nginx
  ports:
    - port: 80
      targetPort: 80
\`\`\`

\`\`\`bash
$ kubectl get svc
NAME    TYPE           EXTERNAL-IP       PORT(S)
nginx   LoadBalancer   34.123.45.67      80:31234/TCP
\`\`\`

\`EXTERNAL-IP\` 是雲商給你的**公網 IP**。直接 \`curl 34.123.45.67\` 就能連。

**關鍵**：LoadBalancer 只在**雲環境**（GKE / EKS / AKS）有效。你要 K8s 跟雲商對接：

- GKE → 自動建立 Google Cloud Load Balancer
- EKS → 自動建立 AWS ELB
- 地端 / 自家機房 → \`EXTERNAL-IP\` 永遠是 \`<pending>\`，沒人接

地端要用 LoadBalancer 得自己裝 [MetalLB](https://metallb.universe.tf/) 模擬。

## 三種 Service 比較表

| 類型 | 對外可見？ | 怎麼用 | 適用場景 |
|------|----------|-------|---------|
| **ClusterIP** | ❌ 只叢集內 | \`mysql-svc:3306\` | 內部 service-to-service |
| **NodePort** | ✅ 叢集內 + Node IP | \`<Node IP>:30080\` | 開發測試、地端 demo |
| **LoadBalancer** | ✅ 公網 IP | \`<External IP>:80\` | 雲端 production |

**遞進關係**（包含關係）：

\`\`\`
LoadBalancer
  └─ 包含 NodePort
       └─ 包含 ClusterIP
\`\`\`

LoadBalancer 建好時，K8s 會**自動幫你開一個 NodePort**，再讓雲商的 LB 把流量導到 NodePort。NodePort 也內建一個 ClusterIP 供叢集內使用。所以建一個 LoadBalancer Service，三種能力都有。

## 怎麼選？

| 情境 | 用什麼 |
|------|-------|
| 後端 API 給其他 Pod 用 | ClusterIP（預設） |
| 本機 k3d/minikube 開發 | NodePort |
| 公司內網 demo | NodePort |
| 雲端 production（單一服務） | LoadBalancer |
| 雲端 production（多個服務） | **Ingress**（下一篇） |

**為什麼 production 不直接用 LoadBalancer？**

每開一個 LoadBalancer 在 GCP / AWS 都要花錢（一個月幾十美金）。公司有 30 個微服務 = 30 個 LoadBalancer = 一個月幾百美金。

**Ingress** 讓你只開一個 LoadBalancer，依路徑（\`/api\` / \`/admin\`）導到不同 Service，省錢又彈性。

## 對照 Docker

| Docker | Kubernetes |
|--------|-----------|
| \`docker run -p 8080:80\` | NodePort：\`30080:80\` |
| \`docker run\` 沒開 port | ClusterIP：只能 container 之間連 |
| 雲端負載平衡器手動接 | LoadBalancer：K8s 自動建 |

NodePort 最像 Docker 的 \`-p\`，但有個關鍵差：Docker 的 port 只在那台機器上開；NodePort **每個 Node 都開**。

## 排錯：NodePort 連不到

**現象 1**：\`curl <Node IP>:30080\` 沒回應

\`\`\`bash
# 確認 Service type
$ kubectl get svc
TYPE        # ClusterIP？ → 你忘了改 NodePort

# 確認 nodePort 真的開了
$ kubectl describe svc nginx-nodeport | grep NodePort
NodePort: <unset> 30080/TCP

# 確認 Pod 跑起來
$ kubectl get endpoints nginx-nodeport
ENDPOINTS         # 有 IP 才代表 Pod 接得上
\`\`\`

**現象 2**：Endpoints 是空的

通常是 \`selector\` 跟 Pod 的 \`labels\` 對不上。回去 [Labels 那篇](/blog/k8s/self-healing-labels-selector) 檢查。

**現象 3**：本機 curl 有回應，外面沒有

防火牆。雲端 VM 的 security group / 公司網路防火牆要開 30000-32767 範圍。

## 重點整理

- NodePort 在**每個 Node** 上開一個 port（30000-32767），讓外面連得到
- 三個 port：\`nodePort\`（對外）/ \`port\`（叢集內）/ \`targetPort\`（容器）
- LoadBalancer = 雲商公網 IP，地端要 MetalLB
- 包含關係：LoadBalancer ⊃ NodePort ⊃ ClusterIP
- Production 多服務用 **Ingress**，只開一個 LoadBalancer 省錢

## 下一步

NodePort 解決了「外面進來」的問題。但如果你有 10 個 Pod 跑在叢集裡，每個 Pod 之間怎麼**互相找到對方**？

K8s 內部是怎麼把 \`mysql-svc\` 解析成 IP 的？跨 namespace 又怎麼連？

下一篇：[K8s DNS 與 Namespace：用名字找服務](/blog/k8s/dns-namespace)。

> 📅 **下一篇**：[K8s DNS 與 Namespace：用名字找服務](/blog/k8s/dns-namespace)
> CoreDNS 怎麼把 Service 名字變成 IP、跨 namespace 怎麼連——把這篇的網路打通到「**名字**」這層。

> 📚 **完整系列總覽**：[K8s 系列教學首頁](/blog/#k8s)（共 40 課，按學習路徑順序排）
`,
  },
  {
    slug: 'dns-namespace',
    order: 19,
    group: 'networking',
    title: 'K8s DNS 與 Namespace：用名字找服務，跨 Namespace 怎麼連？',
    excerpt:
      '叢集內不用記 IP，直接用名字 mysql-svc 連得到。換個 namespace 就要寫 mysql-svc.production。這篇用 nslookup 看 K8s 內部 DNS 怎麼運作。',
    publishDate: '2026-05-16',
    tags: ['Kubernetes', 'DNS', 'Namespace', 'CoreDNS'],
    readingTime: 8,
    content: `
## 為什麼要學 DNS？

[Service 篇](/blog/k8s/clusterip-service)我們說「程式裡寫 \`mysql-svc:3306\` 就能連到 MySQL」，但**到底是誰在做這件事？** \`mysql-svc\` 又不是 IP，K8s 怎麼解析的？

答案是 **CoreDNS** — K8s 內建的 DNS 服務。

這篇要回答兩個問題：

1. 為什麼用名字而不是 IP？
2. 跨 namespace 連線怎麼寫？

## 為什麼不直接用 ClusterIP 的 IP？

技術上沒人擋你。\`kubectl get svc\` 看到 IP 是 \`10.43.0.150\`，你寫死在程式裡也能跑。

**但**：

- ClusterIP 雖然比 Pod IP 穩，**Service 重建後會變**（你刪一次 \`mysql-svc\` 重建，新 IP 就變了）
- 一個叢集裡 30 個微服務 = 30 個 ClusterIP，**沒人記得起來**
- 換 namespace、換叢集、跨環境部署，IP 全變

就像手機通訊錄。你不會背朋友的手機號碼，你存名字。

K8s 的「通訊錄」就是 **CoreDNS**。

## CoreDNS 是什麼？

K8s 叢集裡內建的 DNS 服務，跑在 \`kube-system\` namespace。

\`\`\`bash
$ kubectl get pods -n kube-system | grep coredns
coredns-77ccd57875-abc12   1/1     Running
\`\`\`

它做的事很單純：

> **每建一個 Service，CoreDNS 自動註冊一筆 DNS 記錄。**

你建一個叫 \`nginx-svc\` 的 Service → CoreDNS 記住「\`nginx-svc\` 對應 \`10.43.0.150\`」。任何 Pod 查 \`nginx-svc\`，CoreDNS 就回那個 IP。

**Pod 怎麼知道要找 CoreDNS？** K8s 在每個 Pod 啟動時自動寫好 \`/etc/resolv.conf\`：

\`\`\`bash
$ kubectl exec -it <pod> -- cat /etc/resolv.conf
search default.svc.cluster.local svc.cluster.local cluster.local
nameserver 10.43.0.10    # ← CoreDNS 的 ClusterIP
\`\`\`

你完全不用設定，curl / wget / nslookup 都會自動走 CoreDNS。

## DNS 名字的三種寫法

| 寫法 | 什麼時候用 |
|------|-----------|
| \`nginx-svc\` | 同一個 namespace 內（**最常用**） |
| \`nginx-svc.dev\` | 跨 namespace |
| \`nginx-svc.dev.svc.cluster.local\` | 完整 FQDN |

完整格式拆解：

\`\`\`
nginx-svc . dev . svc . cluster.local
   ↑       ↑    ↑      ↑
 Service  ns  固定   叢集網域
\`\`\`

\`/etc/resolv.conf\` 裡的 \`search\` 設定會幫你補後綴。所以同 namespace 用短名，K8s 自動補上 \`.default.svc.cluster.local\`；跨 namespace 至少要寫到 namespace。

## Namespace 是什麼？

Namespace = 叢集裡的「資料夾」，用來分類 / 隔離資源。

最常見用途：**隔離環境**。

\`\`\`
┌──── default ────┐    ┌──── dev ────┐    ┌──── prod ────┐
│ nginx-svc       │    │ nginx-svc   │    │ nginx-svc    │
│ (你的測試)       │    │ (1.26)      │    │ (1.27)       │
└────────────────┘    └─────────────┘    └──────────────┘
\`\`\`

三個 namespace 都有 \`nginx-svc\`，**互不衝突**。如果都擠在 default，K8s 會擋你 — 同 namespace 不允許同名 Service。

K8s 預設四個 namespace：

| Namespace | 用途 |
|-----------|------|
| \`default\` | 你沒指定就在這 |
| \`kube-system\` | K8s 系統元件（CoreDNS、kube-proxy） |
| \`kube-public\` | 公開資源（很少用） |
| \`kube-node-lease\` | 節點心跳（不用管） |

⚠️ **注意**：Namespace 是**邏輯隔離不是網路隔離**。default 的 Pod 預設可以用 \`nginx-svc.dev.svc.cluster.local\` 連到 dev 的服務。要做網路隔離得用 [NetworkPolicy](/blog/k8s/networkpolicy-intro)。

## 用 nslookup 看穿 CoreDNS

開一個臨時 busybox Pod 來查：

\`\`\`bash
$ kubectl run dns-test --image=busybox:1.36 --rm -it --restart=Never -- sh

/ # nslookup nginx-svc
Server:    10.43.0.10
Address:   10.43.0.10:53

Name:      nginx-svc.default.svc.cluster.local
Address:   10.43.0.150
\`\`\`

兩個重點：
- \`Server: 10.43.0.10\` → 那是 CoreDNS 的 ClusterIP
- 你問 \`nginx-svc\`，CoreDNS 回的是完整 FQDN \`nginx-svc.default.svc.cluster.local\` 對應 \`10.43.0.150\`

直接 wget 試試：

\`\`\`bash
/ # wget -qO- http://nginx-svc
<h1>Welcome to nginx!</h1>

# 完整 FQDN 也行
/ # wget -qO- http://nginx-svc.default.svc.cluster.local
<h1>Welcome to nginx!</h1>
\`\`\`

兩個寫法指向同一個 Service。

## 跨 Namespace 實作

\`\`\`bash
# 1. 建 dev namespace
$ kubectl create namespace dev

# 2. 在 dev 部署 nginx
$ kubectl create deployment nginx-dev --image=nginx:1.27 -n dev
$ kubectl expose deployment nginx-dev --port=80 -n dev

# 3. 從 default 跨 namespace 連線
$ kubectl run cross-test --image=busybox:1.36 --rm -it --restart=Never \\
    -- wget -qO- http://nginx-dev.dev.svc.cluster.local
<h1>Welcome to nginx!</h1>
\`\`\`

關鍵：busybox 在 \`default\`，要連 \`dev\` 的服務，**必須帶上 namespace**：\`nginx-dev.dev\`（或完整 FQDN）。

## kubectl 操作 Namespace

\`\`\`bash
# 看所有 namespace
$ kubectl get namespaces

# 看特定 namespace 的所有資源
$ kubectl get all -n dev

# 看所有 namespace 的 Pod
$ kubectl get pods -A
\`\`\`

**常見坑**：跑 kubectl 忘記加 \`-n dev\`，資源全跑到 default 去。
**排錯**：\`kubectl get pods -A | grep <name>\`，看資源到底跑去哪了。

## 對照 Docker

| Docker | Kubernetes |
|--------|-----------|
| Compose 服務名（\`mysql\`） | Service name（\`mysql-svc\`） |
| 不同 Compose project = 不同 network | 不同 namespace |
| 內建 DNS（compose 版） | CoreDNS（叢集版） |

Docker Compose 也有用名字找服務的能力，但只在同一個 \`docker network\` 內。K8s 的 CoreDNS 是叢集級的，所有 namespace 共用同一套 DNS 解析機制。

## 重點整理

- 用名字不用 IP — Service 重建 IP 會變、人腦記不住
- CoreDNS 跑在 \`kube-system\`，每建一個 Service 自動註冊 DNS
- 三種寫法：\`name\` / \`name.ns\` / \`name.ns.svc.cluster.local\`
- 同 ns 用短名，跨 ns 至少帶上 namespace
- Namespace 是**邏輯**隔離，不是網路隔離

## 下一步

到目前為止學的都是「我要 N 個 Pod」。但有些情境是「**每台 Node 都要一個**」（日誌收集 agent、監控 agent），有些是「**每天凌晨備份一次**」（定時任務）。

這就要用 [DaemonSet 與 CronJob](/blog/k8s/daemonset-cronjob)。

> 📅 **下一篇**：[DaemonSet 與 CronJob：每台 Node 跑一個、定時任務怎麼做](/blog/k8s/daemonset-cronjob)
> Deployment 之外另外兩種 workload——一個解「每台 Node 一份」、一個解「定時跑」。

> 📚 **完整系列總覽**：[K8s 系列教學首頁](/blog/#k8s)（共 40 課，按學習路徑順序排）
`,
  },
  {
    slug: 'daemonset-cronjob',
    order: 20,
    group: 'networking',
    title: 'DaemonSet 與 CronJob：每台 Node 都要跑一份 vs 定時任務',
    excerpt:
      'DaemonSet = 每個 Node 都要保證跑一份（適合監控、日誌收集）；CronJob = K8s 版的 crontab（定時備份、清檔）。這篇實作兩個常見場景。',
    publishDate: '2026-05-17',
    tags: ['Kubernetes', 'DaemonSet', 'CronJob', 'crontab'],
    readingTime: 9,
    content: `
## Deployment 解不了的兩個問題

到目前為止學的 Deployment、Service、DNS 都假設一件事：**「我要 N 個 Pod」**。

但工作上有兩個情境，Deployment 用起來很彆扭：

1. **每台 Node 都要跑一份**（日誌收集 agent、監控 agent）
2. **定時跑一次就結束**（每天備份資料庫、每 5 分鐘清暫存）

第一個情境用 \`replicas\` 死命湊數量，Scheduler 還可能把兩個 Pod 放在同一台 Node。
第二個情境用 Deployment 根本不對 — Deployment 的 Pod 跑完會被自動拉起，**陷入無限重啟**。

K8s 各自有專門的 workload 對應這兩個情境：**DaemonSet** 與 **CronJob**。

## DaemonSet：每台 Node 一份

「Daemon」就是 Linux 的守護程序。**DaemonSet 確保每個 Node 上剛好跑一個 Pod，不多不少**。

\`\`\`
┌─ Node 1 ──┐  ┌─ Node 2 ──┐  ┌─ Node 3 ──┐
│ log-agent │  │ log-agent │  │ log-agent │
└──────────┘  └──────────┘  └──────────┘
\`\`\`

新 Node 加入叢集 → 自動建 Pod
Node 移除 → Pod 跟著消失
**完全不用手動管理副本數**。

典型應用：
- **日誌收集**：Fluentd / Filebeat 收集每台機器上所有容器的 stdout
- **監控 agent**：Prometheus Node Exporter 收 CPU / 記憶體
- **網路 plugin**：kube-proxy 本身就是 DaemonSet

\`\`\`bash
$ kubectl get daemonsets -n kube-system
NAME           DESIRED   CURRENT   READY
kube-proxy     3         3         3       # 你的叢集 3 台 Node
\`\`\`

DESIRED = 你的 Node 數量。**K8s 自動算的**，你不能（也不該）改。

### DaemonSet YAML

\`\`\`yaml
apiVersion: apps/v1
kind: DaemonSet            # ← 不是 Deployment
metadata:
  name: log-collector
spec:
  # ⚠️ 沒有 replicas！由 Node 數量決定
  selector:
    matchLabels:
      app: log-collector
  template:
    metadata:
      labels:
        app: log-collector
    spec:
      containers:
        - name: collector
          image: busybox:1.36
          command: ["sh", "-c", "while true; do echo \\"[$(date)] $(hostname)\\"; sleep 30; done"]
\`\`\`

跟 Deployment **唯一的差別**：\`kind: DaemonSet\` + 沒有 \`replicas\`。

部署後驗證：

\`\`\`bash
$ kubectl apply -f daemonset.yaml
$ kubectl get pods -o wide -l app=log-collector
NAME                  STATUS    NODE
log-collector-abc12   Running   k3d-cluster-server-0
log-collector-def34   Running   k3d-cluster-agent-0
log-collector-ghi56   Running   k3d-cluster-agent-1
\`\`\`

每個 Node 上**剛好一個** Pod，沒例外。

## CronJob：K8s 版的 crontab

如果你寫過 Linux \`crontab\`，CronJob 對你就是直覺的延伸。

> CronJob = Cron 排程 + Job

**Job** 在 K8s 裡是「跑一次就結束」的 workload。**CronJob** 按時程定時建立 Job。

### CronJob YAML

\`\`\`yaml
apiVersion: batch/v1            # ← 不是 apps/v1
kind: CronJob
metadata:
  name: hello-cron
spec:
  schedule: "*/1 * * * *"       # 每分鐘
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: Never  # ← 必填，不能是 Always
          containers:
            - name: hello
              image: busybox:1.36
              command: ["sh", "-c", "echo 'Hello!'; date"]
\`\`\`

幾個關鍵：

1. \`apiVersion: batch/v1\`（**不是** \`apps/v1\`，跟 Deployment 不同 group）
2. \`schedule\` 用 5 欄位 cron 語法：分 / 時 / 日 / 月 / 週
3. \`restartPolicy: Never\` 或 \`OnFailure\`（**不能 Always**，否則跑完又重啟）
4. 嵌套很深：\`CronJob → jobTemplate → template → containers\`（多了一層 Job）

### 常用 schedule

| 語法 | 意思 |
|------|------|
| \`*/1 * * * *\` | 每分鐘 |
| \`*/5 * * * *\` | 每 5 分鐘 |
| \`0 * * * *\` | 每小時整點 |
| \`0 3 * * *\` | 每天凌晨 3 點 |
| \`0 0 * * 0\` | 每週日午夜 |

### 觀察 CronJob 運作

\`\`\`bash
$ kubectl apply -f cronjob.yaml
$ kubectl get cronjobs
NAME         SCHEDULE      LAST SCHEDULE
hello-cron   */1 * * * *   <none>             # 還沒到時間

# 等一分鐘
$ kubectl get jobs
NAME                  COMPLETIONS   AGE
hello-cron-28503210   1/1           45s        # 跑出第一個 Job

$ kubectl get pods
NAME                        STATUS
hello-cron-28503210-xkz9p   Completed          # ← 不是 Running！

$ kubectl logs hello-cron-28503210-xkz9p
Hello!
Sun Apr 27 03:00:01 UTC 2026
\`\`\`

**重點**：CronJob 的 Pod 狀態是 \`Completed\` 不是 \`Running\`。新手常以為出錯，其實這就是正常的 — 任務跑完就該結束。

K8s 預設保留最近 3 個成功 Job + 1 個失敗 Job。要調整用：

\`\`\`yaml
spec:
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 1
\`\`\`

## 三者比較

| 項目 | Deployment | DaemonSet | CronJob |
|------|-----------|-----------|---------|
| 副本數 | 你指定 \`replicas\` | 每 Node 一個（自動） | 每次觸發一個 |
| Pod 狀態 | 長期 Running | 長期 Running | 跑完 Completed |
| 用途 | 無狀態應用 | 節點級服務 | 定時任務 |
| 有 \`replicas\`？ | ✅ | ❌ | ❌ |
| API group | \`apps/v1\` | \`apps/v1\` | \`batch/v1\` |

## 對照 Docker

| Docker | Kubernetes |
|--------|-----------|
| \`docker run\` 在每台機器手動跑 | DaemonSet 自動每台一份 |
| 宿主機 \`crontab\` + \`docker exec\` | CronJob |
| Compose \`restart: 'no'\` 一次性容器 | Job（CronJob 內層） |

DaemonSet 取代了「手動 SSH 上每台機器跑 docker」的痛苦。CronJob 把 cron 和容器合在一起，schedule、重試、歷史紀錄全內建。

## 踩坑：Pod 是 Completed 不是 Running

CronJob 最常被誤判：

\`\`\`bash
$ kubectl get pods
NAME                        STATUS
hello-cron-...              Completed   # ← 正常！
hello-cron-...              Error       # ← 真的有問題
\`\`\`

\`Completed\` = 任務成功跑完，正確結果。
\`Error\` / \`CrashLoopBackOff\` = 真的有問題，看 logs。

## 重點整理

- **DaemonSet**：每 Node 一個，沒有 \`replicas\`。日誌、監控 agent 用這個。
- **CronJob**：定時跑一次，\`apiVersion: batch/v1\`。
- CronJob 的 Pod 跑完是 \`Completed\` **不是** \`Running\`。
- \`restartPolicy: Never\` 必填，不能 Always。
- 三者不重疊：應用 / 節點 / 排程，各管各的。

## 下一步

到第五堂結尾，你已經能用 K8s 部署完整的微服務架構：Deployment + Service + DNS。

但**從外面進來**還只能用 NodePort \`Node IP:30080\`。生產環境要乾淨的網域路徑（\`/api\` / \`/admin\`），就要用 [Ingress 把 Service 串起來](/blog/k8s/service-ingress-end-to-end)。

> 📅 **下一篇**：[Service + Ingress 端到端串通](/blog/k8s/service-ingress-end-to-end)
> 把 NodePort 升級成「網域 + 路徑」的入口,微服務正式長得像個生產系統。

> 📚 **完整系列總覽**：[K8s 系列教學首頁](/blog/#k8s)（共 40 課，按學習路徑順序排）
`,
  },
  {
    slug: 'service-ingress-end-to-end',
    order: 21,
    group: 'networking',
    title: '從零串起完整鏈路：Pod → Deployment → Service → Ingress 一條龍',
    excerpt:
      '前面學了一堆零件，這篇把它們組起來：寫一份 Deployment、暴露成 Service、用 Ingress 路由，從外網一路打進 Pod。這就是 K8s 部署的標準流程。',
    publishDate: '2026-05-18',
    tags: ['Kubernetes', '完整鏈路', 'Pod', 'Deployment', 'Service', 'Ingress'],
    readingTime: 12,
    content: `
## 為什麼要把它們串起來？

前 20 篇我們把 K8s 的零件一個一個拆開講：

- [Pod](/blog/k8s/first-pod-crud)：最小執行單位
- [Deployment](/blog/k8s/deployment-intro)：管 N 個 Pod
- [Service](/blog/k8s/clusterip-service)：固定的入口
- [Ingress](/blog/k8s/kubernetes-ingress-intro)：對外的網域路由

**但工作上你不會「只建一個 Pod」，而是一次部署一整條鏈路。** 這篇把它們組起來，做一次端到端部署。

完成後從瀏覽器打 \`http://demo.local/\`，流量會一路穿過：

\`\`\`
你的瀏覽器
    ↓
Ingress（對外網域、路徑路由）
    ↓
Service（叢集內 DNS、固定 IP）
    ↓
Pod（你的容器，可能 3 個副本）
\`\`\`

## 完整流程：6 個檔案

我們要部署一個 nginx 服務，從零到 Ingress：

\`\`\`
Step 1：建 Namespace            → 隔離環境
Step 2：寫 Deployment            → 定義「3 個 nginx 副本」
Step 3：寫 ClusterIP Service     → 叢集內固定入口
Step 4：寫 Ingress              → 對外路由 demo.local
Step 5：本機 hosts 設定          → 把 demo.local 指到 Node IP
Step 6：瀏覽器驗證 + 排錯
\`\`\`

## Step 1：建 Namespace

\`\`\`bash
$ kubectl create namespace demo
\`\`\`

**為什麼第一步是這個？** 真實工作上不會把資源直接丟到 \`default\`。一個專案 = 一個 namespace，避免互相干擾。

## Step 2：Deployment

\`\`\`yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deploy
  namespace: demo                # ← 注意每個資源都要寫
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
        - name: nginx
          image: nginx:1.27
          ports:
            - containerPort: 80
\`\`\`

\`\`\`bash
$ kubectl apply -f deployment.yaml
$ kubectl get pods -n demo
NAME                            READY   STATUS
nginx-deploy-7d8c9f-abc12       1/1     Running
nginx-deploy-7d8c9f-def34       1/1     Running
nginx-deploy-7d8c9f-ghi56       1/1     Running
\`\`\`

3 個 Pod 跑起來。但**現在還連不到** — Pod IP 隨時會變，沒有穩定入口。

## Step 3：ClusterIP Service

\`\`\`yaml
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx-svc
  namespace: demo
spec:
  type: ClusterIP                # 預設值，可省略
  selector:
    app: nginx                   # ← 對應 Pod labels
  ports:
    - port: 80
      targetPort: 80
\`\`\`

\`\`\`bash
$ kubectl apply -f service.yaml
$ kubectl get svc -n demo
NAME        TYPE        CLUSTER-IP      PORT(S)
nginx-svc   ClusterIP   10.43.0.150     80/TCP

# 從叢集內驗證
$ kubectl run test --image=busybox:1.36 --rm -it --restart=Never -n demo \\
    -- wget -qO- http://nginx-svc
<h1>Welcome to nginx!</h1>
\`\`\`

叢集內的 Pod 已經能用 \`nginx-svc:80\` 連到。**但外面的瀏覽器還是連不上**。

## Step 4：Ingress

\`\`\`yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: nginx-ingress
  namespace: demo
spec:
  ingressClassName: traefik       # k3d 預設用 traefik
  rules:
    - host: demo.local
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: nginx-svc   # ← 對應 Service 名稱
                port:
                  number: 80
\`\`\`

\`\`\`bash
$ kubectl apply -f ingress.yaml
$ kubectl get ingress -n demo
NAME            CLASS     HOSTS         ADDRESS          PORTS
nginx-ingress   traefik   demo.local    192.168.97.2     80
\`\`\`

\`ADDRESS\` 顯示 Ingress Controller 的對外 IP。如果是 \`<none>\`，表示 Ingress Controller 還沒裝（k3d / minikube 預設都有）。

## Step 5：本機 hosts 設定

Ingress 用 \`demo.local\` 路由，但這個網域 DNS 不認識。最簡單做法：把它寫進 \`/etc/hosts\`。

\`\`\`bash
# macOS / Linux
$ sudo vim /etc/hosts

# 加一行
192.168.97.2  demo.local
\`\`\`

\`192.168.97.2\` 就是上一步 \`ADDRESS\` 顯示的 IP。

## Step 6：瀏覽器驗證

\`\`\`bash
$ curl http://demo.local/
<h1>Welcome to nginx!</h1>
\`\`\`

或直接打開瀏覽器輸入 \`http://demo.local/\`。

**完整鏈路通了**：

\`\`\`
瀏覽器 demo.local
    ↓ DNS（hosts）→ 192.168.97.2:80
Ingress Controller (Traefik)
    ↓ host=demo.local, path=/
nginx-svc:80 (ClusterIP)
    ↓ selector app=nginx
nginx-deploy 的 3 個 Pod 之一
\`\`\`

## 排錯：每一層都能單獨驗證

這條鏈路最棒的是**每一段都能拆開測**。任何一段斷了，從下往上一層一層看：

| 症狀 | 檢查 |
|------|------|
| 瀏覽器轉圈圈 | \`curl http://demo.local/\` 看 status code |
| \`curl: Could not resolve host\` | hosts 沒設好，\`ping demo.local\` 看 IP |
| \`curl\` 通但 404 | Ingress \`host\` 寫錯，\`kubectl describe ingress\` |
| Ingress 通但 503 | Service 沒 endpoint，\`kubectl get endpoints -n demo\` |
| Service 沒 endpoint | Pod labels 跟 selector 對不上，\`kubectl get pods --show-labels\` |
| Pod 不是 Running | \`kubectl describe pod\` + \`kubectl logs\` |

**口訣**：從外往內，每層用 \`kubectl get / describe\` 看一眼。

## 真實工作的差別

正式環境跟這個 demo 主要差三件事：

1. **Ingress 走 HTTPS** — 加 TLS Secret + cert-manager 自動續憑證（[下一篇](/blog/k8s/ingress-host-tls)）
2. **多服務分流** — \`/api → backend-svc\`、\`/admin → admin-svc\`（一個 Ingress 管多個 Service）
3. **DNS 不靠 hosts** — 公司網域 \`api.company.com\` 指到 LoadBalancer 的公網 IP

但底層原理完全一樣。學會這條鏈路，後面只是疊功能上去。

## 對照 Docker Compose

| Docker Compose | Kubernetes |
|---------------|-----------|
| \`docker-compose.yml\` 一份 | 4 份 YAML（Namespace + Deploy + Svc + Ingress） |
| \`ports: 8080:80\` | NodePort 或 Ingress |
| \`networks\` | Namespace + DNS |
| \`docker-compose up\` | \`kubectl apply -f .\` |

K8s 確實比 Compose 囉嗦，但**換來的是對外路由、副本管理、自我修復、滾動更新全內建**。一個 docker-compose.yml 在 prod 撐不住，K8s 這套可以。

## 重點整理

- 完整鏈路：Namespace → Deployment → Service → Ingress
- ClusterIP 對內、Ingress 對外，**Service 和 Ingress 是兩件事**
- 排錯順序從外往內，每層拆開驗證
- \`/etc/hosts\` 是本機開發的方便做法，prod 走真 DNS
- 3 + 1 個 YAML 檔，apply 完就有完整服務

## 下一步

你已經把整條 K8s 部署鏈路串起來了。Ingress 在這篇只是路由的「最外層配角」,下一篇單獨拆開講:[Kubernetes Ingress 是什麼？怎麼從 NodePort 升級到 Ingress](/blog/k8s/kubernetes-ingress-intro)——把 path-based 路由的細節、Ingress Controller 是什麼、為什麼比 NodePort 好,完整講清楚。

> 📅 **下一篇**：[Kubernetes Ingress 是什麼？怎麼從 NodePort 升級到 Ingress](/blog/k8s/kubernetes-ingress-intro)
> 把這篇用過的 Ingress 拉出來單獨講——Controller 是什麼、path-based 路由完整原理、跟 NodePort 的差別。

> 📚 **完整系列總覽**：[K8s 系列教學首頁](/blog/#k8s)（共 40 課，按學習路徑順序排）
`,
  },
  // ====== #22 Pilot：完整 Ingress 內文 ======
  {
    slug: 'kubernetes-ingress-intro',
    order: 22,
    group: 'networking',
    title: 'Kubernetes Ingress 入門：從 NodePort 的醜網址到一個 IP 走天下',
    excerpt:
      '學完 NodePort 才發現網址長得像 http://192.168.1.100:30080，使用者根本不會用。Ingress 就是 K8s 上的 Nginx 反向代理，讓你用標準 80 port、用路徑或域名分流。這篇從零講清楚 Ingress 跟 Ingress Controller 的差別、怎麼寫第一份 YAML、怎麼用 curl 驗證、新手最常踩的三個坑。',
    publishDate: '2026-05-19',
    tags: ['Kubernetes', 'Ingress', 'Traefik', '網路', '新手入門'],
    readingTime: 12,
    content: `
## 為什麼需要 Ingress？先看 NodePort 的痛

如果你已經學過 NodePort，那網址大概長這樣：

\`\`\`
http://192.168.1.100:30080
\`\`\`

這個網址要丟給使用者用？不可能。**沒有人會記 IP，更不會記一個五位數的 port**。

我們要的是這種：

\`\`\`
http://myapp.com
http://myapp.com/api
http://www.myapp.com
\`\`\`

標準的 80 port、用域名、用路徑分流。但 NodePort 給你的 port 範圍是 **30000–32767**，永遠開不到 80。

這個問題在 Docker 時代怎麼解？**用 Nginx 反向代理**：所有流量打進 Nginx，Nginx 看 URL 路徑或域名再轉給對應的容器。

K8s 上的等價解法叫 **Ingress**。

## Ingress 跟 Ingress Controller 是兩個東西，不要搞混

新手最常被卡住的地方就是這個。Ingress 不是一個東西，是兩個：

| 名稱 | 是什麼 | 比喻 |
|---|---|---|
| **Ingress（YAML）** | 一份路由規則的設定檔 | 寫滿路徑的「電話簿」 |
| **Ingress Controller** | 真正跑在叢集裡的 Pod，監聽 80/443 | 負責接電話、查電話簿、轉接的「總機小姐」 |

光寫 Ingress YAML 不會發生任何事，**它只是一份規則**。要有 Controller 拿著這份規則去聽 80 port、實際處理請求，才會運作。

### 常見的 Ingress Controller

- **Nginx**：最普及，K8s 官方維護
- **Traefik**：現代化、自動發現服務、k3s 預設內建
- **HAProxy**：高效能、企業常見

**標準 K8s 不內建任何 Controller**，要自己裝。但如果你用 **k3s**（輕量版 K8s，本地測試很常用），它預設幫你裝好 **Traefik**，可以直接用。

這篇用 k3s + Traefik 示範。如果你用 minikube，把後面範例的 \`ingressClassName: traefik\` 改成 \`nginx\` 即可（記得先 \`minikube addons enable ingress\`）。

## 重點整理

- **NodePort 給的 port 是 30000-32767，沒辦法給使用者用**。Ingress 就是為了讓你用標準 80/443 而存在
- **Ingress（YAML 規則）跟 Ingress Controller（實際運作的 Pod）是兩個東西**，少了任何一個都不會動
- **k3s 預設裝 Traefik，\`ingressClassName\` 填 \`traefik\`**；minikube 是 nginx
- **三個必填**：\`apiVersion: networking.k8s.io/v1\`、\`pathType\`、\`ingressClassName\`
- **Path-based 適合前後端共域名**，Host-based 適合微服務各自有域名，**實務常混用**
- **Ingress 後面的 Service 用 ClusterIP 就好**，不要再開 NodePort

## 下一步

Path-based 路由跑通了，但實務上多數網站要走 HTTPS、要管多個 host（\`api.example.com\` / \`admin.example.com\`）。下一篇 [Ingress Host-based 路由 + TLS](/blog/k8s/ingress-host-tls)會教你怎麼把這篇的 Ingress 升級到生產可用，含 cert-manager 自動申請 Let's Encrypt 憑證。

> 📅 **下一篇**：[Ingress Host-based 路由 + TLS：怎麼讓網站走 HTTPS？](/blog/k8s/ingress-host-tls)
> 把這篇學到的 path-based 升級成 host-based + HTTPS，cert-manager 自動續憑證一次教完。

> 📚 **完整系列總覽**：[K8s 系列教學首頁](/blog/#k8s)（共 40 課，按學習路徑順序排）
`,
  },
  {
    slug: 'ingress-host-tls',
    order: 23,
    group: 'networking',
    title: 'Ingress Host-based 路由 + TLS：怎麼讓網站走 HTTPS？',
    excerpt:
      'Path-based 是 myapp.com/api，Host-based 是 api.myapp.com。實務上微服務通常用 Host-based + TLS。這篇實作 cert-manager 自動申請 Let\'s Encrypt 憑證。',
    publishDate: '2026-05-20',
    tags: ['Kubernetes', 'Ingress', 'TLS', 'HTTPS', 'cert-manager'],
    readingTime: 11,
    content: `
## Path-based 的天花板

[Ingress 入門篇](/blog/k8s/kubernetes-ingress-intro)我們用 **path-based** 路由：

\`\`\`
myapp.com/         → frontend-svc
myapp.com/api      → api-svc
myapp.com/admin    → admin-svc
\`\`\`

簡單清楚，但**有個前提**：所有服務都掛在**同一個域名**底下。

工作上常常不是這樣。比如：

- 公開站 \`www.example.com\` 給使用者
- API \`api.example.com\` 給開發者
- 後台 \`admin.example.com\` 給內部

三個域名 = 三個不同的團隊 / 不同的權限 / 不同的證照。硬塞同一個域名管理會很亂。

這就是 **Host-based routing** 的場景。

## Host-based vs Path-based

| 方式 | URL 範例 | 適合 |
|------|---------|------|
| **Path-based** | \`myapp.com/\` + \`myapp.com/api\` | 前後端同一產品 |
| **Host-based** | \`www.myapp.com\` + \`api.myapp.com\` | 微服務 / 多團隊 |

Docker 的對照：
- Path-based ≈ Nginx 一個 \`server\` 底下多個 \`location\`
- Host-based ≈ Nginx 多個 \`server\` 各自有不同的 \`server_name\`

## Host-based YAML

跟 path-based 結構幾乎一樣，差別在 \`rules\` 裡多一個 \`host\` 欄位：

\`\`\`yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
spec:
  ingressClassName: traefik
  rules:
    - host: www.myapp.local         # ← 第一個域名
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend-svc
                port:
                  number: 80
    - host: api.myapp.local         # ← 第二個域名
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: api-svc
                port:
                  number: 3000
\`\`\`

兩個 host 各自一條規則。底下也可以再接 \`paths\`（host + path 混用）。

## 本機驗證

開發環境用 \`/etc/hosts\` 把網域指到本機：

\`\`\`bash
$ sudo vim /etc/hosts

# 加兩行（IP 是 Ingress Controller 的 ADDRESS）
192.168.97.2  www.myapp.local
192.168.97.2  api.myapp.local
\`\`\`

然後驗證：

\`\`\`bash
$ curl http://www.myapp.local/
Server: 10.42.0.5:80 (frontend-deploy-abc)
Message: Hello from frontend

$ curl http://api.myapp.local/
Server: 10.42.0.7:80 (api-deploy-xyz)
Message: Hello from api
\`\`\`

**同一個 IP 192.168.97.2，不同域名導到不同 Service。** Ingress Controller 看 HTTP 請求的 \`Host:\` header 來分流。

## TLS：為什麼一定要 HTTPS？

把網站改成 HTTPS 三個理由：

1. **瀏覽器強制** — Chrome / Firefox 對 \`http://\` 顯示「不安全」，使用者直接退出
2. **資安** — 明文傳輸密碼 / Token 會被中間人攔截
3. **API 規範** — 大部分第三方服務（Google、Stripe）只接受 HTTPS callback

K8s 怎麼做？把 TLS 憑證放進 **Secret**，Ingress 引用它。

## 手動配 TLS（理解原理）

### Step 1：產生憑證並存進 Secret

\`\`\`bash
# 開發用：自簽憑證
$ openssl req -x509 -nodes -days 365 -newkey rsa:2048 \\
    -keyout tls.key -out tls.crt \\
    -subj "/CN=www.myapp.local"

# 把憑證存進 K8s Secret
$ kubectl create secret tls myapp-tls \\
    --cert=tls.crt --key=tls.key \\
    -n demo
\`\`\`

\`kubectl create secret tls\` 是專門存 TLS 的指令。\`type: kubernetes.io/tls\` 是固定型別。

### Step 2：Ingress 加上 \`tls\` 區塊

\`\`\`yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
spec:
  ingressClassName: traefik
  tls:                              # ← 新增這段
    - hosts:
        - www.myapp.local
        - api.myapp.local
      secretName: myapp-tls         # ← 對應 Secret 名稱
  rules:
    - host: www.myapp.local
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend-svc
                port:
                  number: 80
\`\`\`

### Step 3：用 HTTPS 連

\`\`\`bash
$ curl -k https://www.myapp.local/    # -k 忽略自簽憑證警告
\`\`\`

正式環境**絕對不能用自簽**，瀏覽器會擋。下面用 cert-manager 自動申請正式憑證。

## cert-manager + Let's Encrypt

工作上沒人手動產憑證 — 90 天到期、要續、要 rotate，全人工搞會出事。

[**cert-manager**](https://cert-manager.io/) 是 K8s 上的標準解：

- 從 [Let's Encrypt](https://letsencrypt.org/)（免費的公信 CA）自動申請憑證
- 自動寫進 Secret（你只要在 Ingress 引用名字）
- 到期前自動續，零維護

### 工作原理

\`\`\`
Ingress 加 annotation
  ↓
cert-manager 偵測到，向 Let's Encrypt 申請
  ↓
Let's Encrypt：「證明你擁有 www.example.com」
  ↓
cert-manager 用 HTTP-01 challenge 自動回答
  ↓
拿到憑證 → 寫進 Secret
  ↓
Ingress Controller 自動 reload，HTTPS 上線
\`\`\`

### Ingress 接 cert-manager

\`\`\`yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod   # ← 這行
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - www.example.com
      secretName: www-tls           # cert-manager 會自動建這個 Secret
  rules:
    - host: www.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend-svc
                port:
                  number: 80
\`\`\`

部署完幾分鐘後 \`www-tls\` Secret 自動出現，HTTPS 就通了。

## 排錯重點

| 症狀 | 檢查 |
|------|-----|
| HTTPS 證書錯誤 | \`kubectl describe certificate -n demo\` 看 cert-manager 狀態 |
| 連不到 host | \`/etc/hosts\` 沒設好，\`ping www.myapp.local\` 確認 IP |
| 一直走 HTTP | \`Ingress\` 的 \`tls\` 區塊忘了加 |
| 自簽憑證瀏覽器擋 | Production 換成 cert-manager + Let's Encrypt |

## 重點整理

- **Path-based**：同域名分路徑，前後端同產品
- **Host-based**：多域名各分流，微服務 / 多團隊
- TLS = 憑證放進 \`type: kubernetes.io/tls\` 的 Secret + Ingress \`spec.tls\` 引用
- 開發用 \`openssl\` 自簽，**正式用 cert-manager + Let's Encrypt**
- cert-manager 自動申請 / 自動續期 / 寫進 Secret，Ingress 只要加一個 annotation

## 下一步

到這裡你已經能把整個服務從 Pod 部到對外 HTTPS 網域。

但**設定值** 怎麼管？比如資料庫連線字串、API key、debug flag — 寫死在 image 裡不行（換環境就要重 build），寫進 YAML 也不對（密碼裸奔）。

下一篇進入第 4 組：[ConfigMap：把設定從程式裡抽出來](/blog/k8s/configmap-intro)。

> 📅 **下一篇**：[ConfigMap 教學：把設定從 Image 抽出來的正確姿勢](/blog/k8s/configmap-intro)
> 從網路進到「設定」這層——資料庫連線、API endpoint、debug flag 該怎麼塞給 Pod。

> 📚 **完整系列總覽**：[K8s 系列教學首頁](/blog/#k8s)（共 40 課，按學習路徑順序排）
`,
  },

  // ====== Group 4: config — 設定與儲存（對應第 6 堂下午）======
  {
    slug: 'configmap-intro',
    order: 24,
    group: 'config',
    title: 'ConfigMap 教學：把設定從 Image 抽出來的正確姿勢',
    excerpt:
      '設定寫死在 Image，每次改都要 build 一次。ConfigMap 把設定獨立出來，env 注入或 Volume 掛載兩種用法，這篇全部教完。',
    publishDate: '2026-05-21',
    tags: ['Kubernetes', 'ConfigMap', '設定', 'env'],
    readingTime: 9,
    content: `
## 設定寫死在 Image 是不行的

很多人剛接觸 K8s 會這樣寫 Dockerfile：

\`\`\`dockerfile
ENV DB_HOST=192.168.1.50
ENV DB_PORT=3306
ENV LOG_LEVEL=info
\`\`\`

build → push → deploy。看起來沒事，但有三個問題：

**問題 1：環境不同要建不同 Image**

dev 的資料庫 \`dev-db:3306\`、prod 的 \`prod-db:3306\`。難道要 build \`myapp:dev\` 和 \`myapp:prod\` 兩個 Image？多一個 staging 就是三個。多個地區就是六個。荒謬。

**問題 2：改個設定就要重 build**

只是把 \`LOG_LEVEL\` 從 \`info\` 改成 \`debug\` 看一下日誌 → 改 Dockerfile → push → deploy。走完整套 CI/CD pipeline。

**問題 3：敏感資料外洩風險**

如果有密碼寫在 Image 裡，只要有人能 \`docker pull\`，\`docker inspect\` 就看光了。

## ConfigMap：把設定獨立出來

[Pod env 篇](/blog/k8s/pod-env-mysql)我們用 \`env: value\` 把變數寫在 Pod YAML 裡。ConfigMap 把這件事**升級**：設定獨立成一個資源，多個 Pod 共用。

\`\`\`
ConfigMap (app-config)            ┌─ Pod A 用 envFrom 引用
  MESSAGE: Hello from ConfigMap   │
  USERNAME: admin                 ├─ Pod B 用 envFrom 引用
  LOG_LEVEL: info                 │
                                  └─ Pod C 掛成檔案
\`\`\`

對照 Docker：\`docker run -e KEY=value\` 的升級版，但設定統一管理。

## 三種建立方式

### 1. \`--from-literal\`（最快）

\`\`\`bash
$ kubectl create configmap app-config \\
    --from-literal=MESSAGE="Hello from ConfigMap" \\
    --from-literal=USERNAME=admin
\`\`\`

適合臨時測試、簡單 key-value。

### 2. \`--from-file\`（整個檔案）

\`\`\`bash
$ kubectl create configmap nginx-conf \\
    --from-file=nginx.conf
\`\`\`

把整個檔案存進 ConfigMap，**key = 檔名、value = 檔案內容**。適合 \`nginx.conf\`、\`my.cnf\` 這種設定檔。

### 3. YAML（**最推薦**）

\`\`\`yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  MESSAGE: "Hello from ConfigMap"
  USERNAME: "admin"
  LOG_LEVEL: "info"
\`\`\`

YAML 可以放 Git，做版本管理 / Code Review / GitOps。**正式環境就用這個**。

## 兩種注入方式

| 方式 | 適合 | 改了會自動更新嗎？ |
|------|------|------------------|
| **環境變數**（envFrom / env） | key-value 設定 | ❌ 要重啟 Pod |
| **Volume 掛載** | 設定檔（nginx.conf） | ✅ 30-60 秒自動同步 |

### 方式 A：envFrom 一次塞全部

\`\`\`yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-with-config
spec:
  replicas: 1
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
        - name: app
          image: yanchen184/k8s-demo-app:latest
          envFrom:
            - configMapRef:
                name: app-config       # ← 整包注入
\`\`\`

\`envFrom\` 把 ConfigMap **所有 key** 一次變成環境變數。比逐一寫 \`env: valueFrom: configMapKeyRef\` 簡潔。

### 方式 B：env.valueFrom（單一 key）

只想拿其中一個 key：

\`\`\`yaml
env:
  - name: APP_LOG_LEVEL
    valueFrom:
      configMapKeyRef:
        name: app-config
        key: LOG_LEVEL
\`\`\`

可以順便改名（\`LOG_LEVEL\` → \`APP_LOG_LEVEL\`）。

## envFrom 的更新行為

跑 demo 看一下：

\`\`\`bash
$ kubectl apply -f configmap-literal.yaml
$ curl http://<NODE-IP>/frontend
Server: 10.42.0.5:80
Message: Hello from ConfigMap
Username: admin

# 改 ConfigMap
$ kubectl edit configmap app-config
# MESSAGE: "Hello Updated"

# 再 curl
$ curl http://<NODE-IP>/frontend
Message: Hello from ConfigMap         # ← 還是舊值！
\`\`\`

**為什麼沒更新？** 環境變數是 process 啟動時讀一次就定死了，後來改 ConfigMap 跑著的 process 不會知道。

讓新值生效：

\`\`\`bash
$ kubectl rollout restart deployment/app-with-config
$ curl http://<NODE-IP>/frontend
Message: Hello Updated                # ← 現在對了
\`\`\`

**口訣**：env 注入 = 改完要重啟。

## Volume 掛載：適合 nginx.conf

ConfigMap 也能掛成檔案，每個 key 變一個檔案：

\`\`\`yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: nginx-config
data:
  default.conf: |
    server {
      listen 80;
      location /healthz {
        return 200 'OK';
        add_header Content-Type text/plain;
      }
    }
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-custom
spec:
  replicas: 1
  selector:
    matchLabels:
      app: nginx-custom
  template:
    metadata:
      labels:
        app: nginx-custom
    spec:
      containers:
        - name: nginx
          image: nginx:1.27
          volumeMounts:
            - name: config
              mountPath: /etc/nginx/conf.d   # ← 整個目錄
      volumes:
        - name: config
          configMap:
            name: nginx-config
\`\`\`

掛載後容器裡會有 \`/etc/nginx/conf.d/default.conf\`，內容就是 ConfigMap 的 \`default.conf\` 那段。

### 熱更新驗證

\`\`\`bash
$ kubectl exec deploy/nginx-custom -- cat /etc/nginx/conf.d/default.conf
# 看到 'OK'

# 改 ConfigMap，把 OK 改成 HEALTHY
$ kubectl edit configmap nginx-config

# 等 30-60 秒
$ kubectl exec deploy/nginx-custom -- cat /etc/nginx/conf.d/default.conf
# 變成 'HEALTHY' — 不用重啟 Pod！

# 但 Nginx process 還用舊設定，要 reload
$ kubectl exec deploy/nginx-custom -- nginx -s reload
\`\`\`

**重點**：Volume 掛載，檔案會自動更新（30-60 秒），但**應用程式自己要會 reload**（Nginx \`-s reload\`、Node.js / Spring Boot 通常做不到，要重啟）。

## ⚠️ subPath 的坑

如果你只想掛**一個檔案**而不是整個目錄：

\`\`\`yaml
volumeMounts:
  - name: config
    mountPath: /app/config.json
    subPath: config.json           # ← 只掛這個檔
\`\`\`

**用了 \`subPath\` 就不會自動更新。** 這是 K8s 已知行為。

取捨：
- 要熱更新 → 不用 \`subPath\`，掛整個目錄
- 接受重啟 → 用 \`subPath\` 不影響周圍其他檔案

## 對照 Docker

| Docker | Kubernetes |
|--------|-----------|
| \`-e KEY=value\` | env / envFrom + ConfigMap |
| \`--env-file .env\` | envFrom: configMapRef |
| \`-v ./nginx.conf:/etc/nginx/...\` | Volume + ConfigMap 掛載 |

K8s 結構化更多但邏輯一致：**設定獨立、Image 純粹、不同環境用不同 ConfigMap**。

## 重點整理

- 設定**永遠不要寫死在 Image**，用 ConfigMap
- 三種建法：\`--from-literal\` / \`--from-file\` / **YAML（推薦）**
- env 注入：簡單、改了要重啟
- Volume 掛載：自動更新、但 \`subPath\` 例外
- 熱更新後應用程式自己要會 reload
- ConfigMap 是**明文**儲存，密碼不能放這

## 下一步

ConfigMap 解決了一般設定。但**密碼、API Key、TLS 憑證**怎麼辦？

\`kubectl get configmap app-config -o yaml\` 任何人都看光光，這顯然不行。下一篇：[Secret + RBAC：K8s 怎麼存密碼才不會洩漏](/blog/k8s/secret-rbac-mysql)。

> 📚 **完整系列總覽**：[K8s 系列教學首頁](/blog/#k8s)（共 40 課，按學習路徑順序排）
`,
  },
  {
    slug: 'secret-rbac-mysql',
    order: 25,
    group: 'config',
    title: 'Secret 教學：K8s 怎麼存密碼才不會明文洩漏？',
    excerpt:
      'ConfigMap 是明文，密碼放進去等於放在街上。Secret 用 base64 編碼存（不是加密），配 RBAC 控誰能看，才是正解。這篇實作 MySQL 密碼用 Secret 注入。',
    publishDate: '2026-05-22',
    tags: ['Kubernetes', 'Secret', '密碼', 'RBAC', 'base64'],
    readingTime: 10,
    content: `
## ConfigMap 的安全死角

[上一篇](/blog/k8s/configmap-intro) ConfigMap 漂亮地解決了「設定寫死」問題。但隨手做個實驗：

\`\`\`bash
$ kubectl create configmap db-config \\
    --from-literal=DB_PASSWORD=my-secret-pw

$ kubectl get configmap db-config -o yaml
apiVersion: v1
data:
  DB_PASSWORD: my-secret-pw         # ← 明文！
kind: ConfigMap
\`\`\`

**任何能跑 kubectl 的人都看得到密碼**。如果這份 YAML 還 commit 到 Git，全世界都看得到。

ConfigMap 只能放非敏感設定。密碼 / API Key / 憑證要用 **Secret**。

## Secret 跟 ConfigMap 哪裡不一樣？

短答：**用法幾乎一樣，但有兩個關鍵差別**。

| 項目 | ConfigMap | Secret |
|------|-----------|--------|
| 儲存格式 | 明文 | Base64 編碼 |
| \`kubectl describe\` | 直接顯示值 | 只顯示大小 |
| 用途 | 一般設定 | 密碼、API Key、TLS |
| RBAC 預設 | 不嚴格 | **嚴格控管** |

## 建立 Secret

最快的方式：

\`\`\`bash
$ kubectl create secret generic db-cred \\
    --from-literal=username=admin \\
    --from-literal=password=my-secret-pw
\`\`\`

注意 \`generic\` 對應 \`type: Opaque\`（最常用的通用型）。

\`\`\`bash
$ kubectl describe secret db-cred
Type:  Opaque
Data
====
password:  12 bytes        # ← 不顯示值
username:  5 bytes
\`\`\`

跟 ConfigMap 不一樣，\`describe\` **不會直接秀值**。算是一道防線（防止操作失誤把密碼貼上 Slack）。

## ⚠️ Base64 ≠ 加密

新手最容易誤會的地方。試一下：

\`\`\`bash
$ kubectl get secret db-cred -o yaml
apiVersion: v1
data:
  password: bXktc2VjcmV0LXB3
  username: YWRtaW4=
kind: Secret

# 隨便挑一個 decode
$ echo "bXktc2VjcmV0LXB3" | base64 -d
my-secret-pw                    # ← 馬上還原
\`\`\`

Base64 只是**編碼**（換個格式呈現），不是加密。任何人拿到 Secret 都能 decode。

**那 Secret 的安全靠什麼？** 靠 **RBAC**（Role-Based Access Control）— 控制誰能 \`kubectl get secret\`。

## RBAC：誰能讀 Secret？

預設情況，誰只要能跑 kubectl 對著叢集，就能讀所有 Secret。**這是不對的**。

正式環境的做法：

\`\`\`yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: production
  name: secret-reader
rules:
  - apiGroups: [""]
    resources: ["secrets"]
    resourceNames: ["db-cred"]    # ← 只允許讀這個 Secret
    verbs: ["get"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: alice-secret-reader
  namespace: production
subjects:
  - kind: User
    name: alice
roleRef:
  kind: Role
  name: secret-reader
  apiGroup: rbac.authorization.k8s.io
\`\`\`

Alice 在 \`production\` namespace **只能讀 \`db-cred\`** 這一個 Secret，其他 Secret 連列表都看不到。

RBAC 細節到 [第七堂的 RBAC 篇](/blog/k8s/rbac-readonly-user)展開，這裡先知道：**Secret 的安全靠的不是 Base64，是 RBAC**。

## Secret 三種類型

\`\`\`bash
$ kubectl get secret -A
NAME              TYPE
db-cred           Opaque
default-token-x   kubernetes.io/service-account-token
myapp-tls         kubernetes.io/tls
docker-pull       kubernetes.io/dockerconfigjson
\`\`\`

| 類型 | 用途 | 怎麼建 |
|------|------|-------|
| **Opaque** | 通用（密碼、API Key） | \`kubectl create secret generic\` |
| **kubernetes.io/tls** | TLS 憑證（Ingress HTTPS） | \`kubectl create secret tls\` |
| **kubernetes.io/dockerconfigjson** | 拉私有 Image 的帳密 | \`kubectl create secret docker-registry\` |

90% 的場景用 Opaque。tls 在 [Ingress + TLS 篇](/blog/k8s/ingress-host-tls)用過。

## 注入到 Pod：跟 ConfigMap 一樣

語法幾乎相同，只是把 \`configMapRef\` 換成 \`secretRef\`、\`configMapKeyRef\` 換成 \`secretKeyRef\`。

### envFrom：整包注入

\`\`\`yaml
spec:
  containers:
    - name: app
      image: yanchen184/k8s-demo-app:latest
      envFrom:
        - configMapRef:
            name: app-config       # ← 一般設定
        - secretRef:
            name: db-cred          # ← 密碼
\`\`\`

### env.valueFrom：單一 key

\`\`\`yaml
env:
  - name: DB_PASSWORD
    valueFrom:
      secretKeyRef:
        name: db-cred
        key: password
\`\`\`

## MySQL 範例：完整配 Secret

\`\`\`yaml
apiVersion: v1
kind: Secret
metadata:
  name: mysql-cred
type: Opaque
stringData:                       # ← 用 stringData 不用自己 base64
  MYSQL_ROOT_PASSWORD: my-secret-pw
  MYSQL_USER: appuser
  MYSQL_PASSWORD: app-pw
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mysql
spec:
  replicas: 1
  selector:
    matchLabels:
      app: mysql
  template:
    metadata:
      labels:
        app: mysql
    spec:
      containers:
        - name: mysql
          image: mysql:8.0
          envFrom:
            - secretRef:
                name: mysql-cred  # ← 帳密整包進來
          ports:
            - containerPort: 3306
\`\`\`

> 💡 \`stringData\` 是寫 YAML 時的便利，K8s 收到後會自動轉成 \`data\` 的 base64。手寫時用這個比較直覺，不用自己 \`echo -n 'xxx' | base64\`。

驗證：

\`\`\`bash
$ kubectl apply -f mysql-secret.yaml
$ kubectl exec -it deploy/mysql -- mysql -u appuser -p
Enter password: app-pw
mysql>
\`\`\`

## ⚠️ 不要把 Secret YAML commit 到 Git

\`stringData: my-secret-pw\` 直接 commit 上去 = 全世界都看得到密碼。

正式環境兩個做法：

### 1. Sealed Secret（推薦）

[Sealed Secret](https://github.com/bitnami-labs/sealed-secrets) 用 RSA 把 Secret 加密成 \`SealedSecret\`，**只有叢集裡的 controller 能解密**。

\`\`\`bash
$ kubeseal -f mysql-secret.yaml -o yaml > mysql-sealed.yaml
\`\`\`

\`mysql-sealed.yaml\` 裡面是加密過的字串，**安全 commit 到 Git**。部署時 controller 自動解密成真正的 Secret。

### 2. 外部 Secret 管理（HashiCorp Vault / AWS Secrets Manager）

把密碼存在專業的密碼管理服務，K8s 用 [External Secrets Operator](https://external-secrets.io/) 同步進來。適合大型組織。

## 對照 Docker

| Docker | Kubernetes |
|--------|-----------|
| \`-e DB_PASSWORD=xxx\` | Secret + envFrom |
| \`docker login\` 個人 \`.docker/config.json\` | \`kubernetes.io/dockerconfigjson\` |
| TLS 憑證手動放容器 | \`kubernetes.io/tls\` |
| Vault / dotenv 放本機 | Sealed Secret 上 Git |

Docker 的密碼管理普遍是「想辦法不要 commit \`.env\`」。K8s 把這件事做成資源類型，更結構化。

## 重點整理

- 密碼用 Secret 不是 ConfigMap，至少 \`describe\` 不會直接秀值
- **Base64 不是加密**，安全靠 RBAC
- 用法幾乎跟 ConfigMap 一樣（換 \`secretRef\` / \`secretKeyRef\`）
- 寫 YAML 用 \`stringData\` 比較方便
- Secret YAML **不要** 直接 commit 到 Git，用 Sealed Secret

## 下一步

ConfigMap + Secret 都會了。但工作上常常**兩個一起用** — Ingress + ConfigMap 設置 nginx config + Secret 放憑證，整個串起來。

下一篇實戰：[Ingress + ConfigMap + Secret 整合實作](/blog/k8s/ingress-configmap-secret-integration)。

> 📚 **完整系列總覽**：[K8s 系列教學首頁](/blog/#k8s)（共 40 課，按學習路徑順序排）
`,
  },
  {
    slug: 'ingress-configmap-secret-integration',
    order: 26,
    group: 'config',
    title: 'Ingress + ConfigMap + Secret 整合實作：完整網站部署 demo',
    excerpt:
      '前面零件學完，這篇把它們全部串起來：nginx 用 ConfigMap 注入設定、MySQL 用 Secret 拿密碼、Ingress 對外路由。完整實作一個有資料庫的網站。',
    publishDate: '2026-05-23',
    tags: ['Kubernetes', '整合', 'Ingress', 'ConfigMap', 'Secret'],
    readingTime: 13,
    content: `
## 把零件組成一個網站

前面 25 篇我們學了 K8s 的所有基本零件：

- [Pod / Deployment](/blog/k8s/deployment-intro) — 跑容器
- [Service](/blog/k8s/clusterip-service) — 固定入口
- [Ingress](/blog/k8s/kubernetes-ingress-intro) — 對外網域
- [ConfigMap](/blog/k8s/configmap-intro) — 一般設定
- [Secret](/blog/k8s/secret-rbac-mysql) — 密碼

這篇把它們**全部串起來**部署一個有資料庫的網站，模擬真實工作的長相：

\`\`\`
瀏覽器 myshop.local
    ↓
Ingress
    ↓
frontend Service ──┬─→ frontend Pod (用 ConfigMap 注入 MESSAGE / USERNAME)
                   │     └─ envFrom Secret 拿 PASSWORD
                   │
                   └─→ MySQL Pod (用 Secret 注入帳密)
\`\`\`

## 我們要部署什麼？

兩個 Deployment：

1. **frontend** — \`yanchen184/k8s-demo-app\`（簡單的 PHP，回應四行：Server / Message / Username / Password）
2. **MySQL** — \`mysql:8.0\` 用密碼啟動

兩個 Service（ClusterIP）+ 一個 Ingress。

## Step 1：建 Namespace

\`\`\`bash
$ kubectl create namespace demo
$ kubectl config set-context --current --namespace=demo  # 預設都用 demo
\`\`\`

## Step 2：ConfigMap（公開設定）

\`\`\`yaml
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: demo
data:
  MESSAGE: "Hello from Production"
  USERNAME: "admin"
  LOG_LEVEL: "info"
\`\`\`

## Step 3：Secret（敏感資料）

\`\`\`yaml
# secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secret
  namespace: demo
type: Opaque
stringData:
  PASSWORD: "user-password-123"
---
apiVersion: v1
kind: Secret
metadata:
  name: mysql-secret
  namespace: demo
type: Opaque
stringData:
  MYSQL_ROOT_PASSWORD: "root-pw-456"
  MYSQL_DATABASE: "shopdb"
  MYSQL_USER: "shopuser"
  MYSQL_PASSWORD: "shop-pw-789"
\`\`\`

> 💡 一份 YAML 用 \`---\` 分隔可以放多個資源。

## Step 4：Frontend Deployment + Service

\`\`\`yaml
# frontend.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend-deploy
  namespace: demo
spec:
  replicas: 3
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
        - name: frontend
          image: yanchen184/k8s-demo-app:latest
          ports:
            - containerPort: 80
          envFrom:
            - configMapRef:
                name: app-config       # ← 一次注入 ConfigMap
            - secretRef:
                name: app-secret       # ← 一次注入 Secret
---
apiVersion: v1
kind: Service
metadata:
  name: frontend-svc
  namespace: demo
spec:
  type: ClusterIP
  selector:
    app: frontend
  ports:
    - port: 80
      targetPort: 80
\`\`\`

## Step 5：MySQL Deployment + Service

\`\`\`yaml
# mysql.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mysql-deploy
  namespace: demo
spec:
  replicas: 1
  selector:
    matchLabels:
      app: mysql
  template:
    metadata:
      labels:
        app: mysql
    spec:
      containers:
        - name: mysql
          image: mysql:8.0
          ports:
            - containerPort: 3306
          envFrom:
            - secretRef:
                name: mysql-secret     # ← 帳密整包進來
---
apiVersion: v1
kind: Service
metadata:
  name: mysql-svc
  namespace: demo
spec:
  type: ClusterIP
  selector:
    app: mysql
  ports:
    - port: 3306
      targetPort: 3306
\`\`\`

⚠️ MySQL 沒有持久化儲存（Pod 重啟資料會掉）。下一篇 [PV/PVC](/blog/k8s/pv-pvc-intro) 補上。

## Step 6：Ingress

\`\`\`yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: shop-ingress
  namespace: demo
spec:
  ingressClassName: traefik
  rules:
    - host: myshop.local
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend-svc
                port:
                  number: 80
\`\`\`

## 一次 apply

\`\`\`bash
$ kubectl apply -f .
configmap/app-config created
secret/app-secret created
secret/mysql-secret created
deployment.apps/frontend-deploy created
service/frontend-svc created
deployment.apps/mysql-deploy created
service/mysql-svc created
ingress.networking.k8s.io/shop-ingress created

$ kubectl get all -n demo
NAME                                  STATUS    READY
pod/frontend-deploy-6b8c-abc12        Running   1/1
pod/frontend-deploy-6b8c-def34        Running   1/1
pod/frontend-deploy-6b8c-ghi56        Running   1/1
pod/mysql-deploy-7f9d-xyz12           Running   1/1

NAME                  TYPE        CLUSTER-IP      PORT(S)
service/frontend-svc  ClusterIP   10.43.0.150     80/TCP
service/mysql-svc     ClusterIP   10.43.0.200     3306/TCP
\`\`\`

## 驗證鏈路

\`\`\`bash
# 1. /etc/hosts 加上
$ echo "192.168.97.2 myshop.local" | sudo tee -a /etc/hosts

# 2. 對外 curl
$ curl http://myshop.local/
Server: 10.42.0.5:80 (frontend-deploy-6b8c-abc12)
Message: Hello from Production       # ← ConfigMap
Username: admin                       # ← ConfigMap
Password: user-password-123           # ← Secret

# 3. 從 frontend 連 MySQL
$ kubectl exec -it deploy/frontend-deploy -n demo -- sh
/ # apk add mysql-client
/ # mysql -h mysql-svc -u shopuser -p$MYSQL_PASSWORD -e "SHOW DATABASES;"
+--------------------+
| Database           |
+--------------------+
| information_schema |
| shopdb             |              # ← Secret 設定的 MYSQL_DATABASE
+--------------------+
\`\`\`

**完整鏈路通了**：
- 外面 \`myshop.local\` → Ingress → frontend-svc → frontend Pod
- frontend Pod 用 \`mysql-svc:3306\` 連 MySQL
- 帳密來自 Secret，**沒有任何寫死**

## 改設定不用重 build

工作上最常見的需求：把 \`MESSAGE\` 改一下。

\`\`\`bash
$ kubectl edit configmap app-config -n demo
# MESSAGE: "Hello from Staging"

# envFrom 注入 → 要重啟 Pod
$ kubectl rollout restart deployment/frontend-deploy -n demo

$ curl http://myshop.local/
Message: Hello from Staging           # ← 改了
\`\`\`

**沒有重 build Image，沒有重 push，沒有改 Dockerfile**。這就是 ConfigMap 的價值。

## 排錯：每層拆開驗證

| 症狀 | 檢查 |
|------|-----|
| 外面 curl 不通 | \`/etc/hosts\` 設好了？\`kubectl get ingress\` ADDRESS 對嗎？ |
| Ingress 通但 503 | \`kubectl get endpoints frontend-svc\` 看 Pod 接上沒 |
| Pod 起不來 | \`kubectl describe pod\`，看 ConfigMap / Secret 是否找不到 |
| 環境變數空的 | \`kubectl exec ... -- env\` 確認注入了 |
| MySQL 連不上 | 在 frontend Pod 內 \`nslookup mysql-svc\` 看 DNS |

從外往內，每層用 \`get\` / \`describe\` 看一眼。

## 工作上的下一步

到這個架構你已經能上線一個簡單的網站。但實際工作環境會再加：

- **TLS** — Ingress + cert-manager（[已講過](/blog/k8s/ingress-host-tls)）
- **持久化** — MySQL 不能掉資料，要 [PV / PVC](/blog/k8s/pv-pvc-intro)
- **多副本資料庫** — [StatefulSet](/blog/k8s/storageclass-statefulset-mysql)
- **健康檢查** — [Liveness / Readiness Probe](/blog/k8s/probe-liveness-readiness-startup)
- **資源限制** — [HPA + Resource Limits](/blog/k8s/hpa-autoscale-loadtest)

## 重點整理

- 一個完整網站 = Namespace + ConfigMap + Secret + Deployment×N + Service×N + Ingress
- ConfigMap 放公開設定、Secret 放密碼，兩者用 \`envFrom\` 同時注入
- MySQL 用 Service name 就能被 frontend 連到（CoreDNS）
- 改設定 → \`edit\` ConfigMap → \`rollout restart\`，**不用重 build**
- 排錯：從外往內每層 \`get\` / \`describe\`

## 下一步

到這裡 MySQL Pod 重啟，**資料會全部不見**（容器是無狀態的）。要在 K8s 上跑資料庫，必須學持久化儲存。

下一篇：[PV / PVC：K8s 怎麼讓 Pod 用磁碟](/blog/k8s/pv-pvc-intro)。

> 📚 **完整系列總覽**：[K8s 系列教學首頁](/blog/#k8s)（共 40 課，按學習路徑順序排）
`,
  },
  {
    slug: 'pv-pvc-intro',
    order: 27,
    group: 'config',
    title: 'PV 和 PVC 是什麼？K8s 怎麼存資料才不會 Pod 重啟就消失？',
    excerpt:
      'Pod 重啟 = 資料消失，Container 本來就無狀態。PV 是「實體儲存」、PVC 是「申請單」，兩個搭配讓資料活在 Pod 之外。',
    publishDate: '2026-05-24',
    tags: ['Kubernetes', 'PV', 'PVC', '儲存', '持久化'],
    readingTime: 10,
    content: `
## Pod 重啟資料就消失

到目前為止你部署的所有東西都是無狀態的：nginx、frontend、API server。Pod 死了再起一個一模一樣的就好。

但**資料庫不行**。

[上一篇](/blog/k8s/ingress-configmap-secret-integration)整合實作裡的 MySQL 一刪 Pod、資料就**全部不見**。為什麼？

容器的檔案系統是**短暫的**。Pod 刪除後，容器內所有寫入的檔案（包括 MySQL 的 \`/var/lib/mysql\` 資料）跟著消失。下次 Pod 重啟，是從乾淨的 Image 重新開始。

\`\`\`bash
$ kubectl exec mysql-pod -- mysql -e "INSERT INTO users VALUES('Alice');"
$ kubectl delete pod mysql-pod
$ kubectl exec mysql-pod -- mysql -e "SELECT * FROM users;"
ERROR: Table 'users' doesn't exist     # ← 整個資料庫都沒了
\`\`\`

要保住資料，需要 K8s 的持久化儲存：**PV + PVC**。

## PV vs PVC：停車位的比喻

K8s 把儲存拆成兩個資源：

- **PersistentVolume（PV）** — 一塊**實際的儲存空間**（管理員建）
- **PersistentVolumeClaim（PVC）** — Pod 對儲存的**申請單**（開發者寫）

用停車場當比喻：

\`\`\`
┌── 停車場（K8s 管理員）─────────────────────┐
│  PV-1: 10GB SSD                           │
│  PV-2: 50GB HDD                           │
│  PV-3: 5GB SSD                            │
└──────────────────────────────────────────┘
                    ↑ 配對（Binding）
┌── 開發者 ─────────────────────────────────┐
│  PVC-A: "我要 5GB"     → 配到 PV-3        │
│  PVC-B: "我要 10GB"    → 配到 PV-1        │
└──────────────────────────────────────────┘
                    ↓
                Pod 用 PVC 掛載
\`\`\`

**為什麼要拆兩個？** 職責分離。

- 基礎架構團隊管 PV：「公司有幾台 NAS、幾顆 SSD、各自多大」
- 應用開發團隊寫 PVC：「我的 App 要 10GB ReadWriteOnce」
- 開發者**不需要知道底層是 NFS 還是 SSD**，反正 K8s 會配給你

## 對照 Docker

| Docker | Kubernetes |
|--------|-----------|
| \`docker volume create mydata\` | 建 PV |
| \`docker run -v mydata:/var/lib/mysql\` | PVC + Pod \`volumeMounts\` |
| 自動建 + 掛載合在一起 | **拆成兩步**（PV / PVC 分離） |

Docker 把建 volume 和掛 volume 合成一步，K8s 拆開是為了大型組織的職責分離。小團隊覺得麻煩 → 用 [StorageClass](/blog/k8s/storageclass-statefulset-mysql) 自動建 PV，下一篇講。

## PV YAML

\`\`\`yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: local-pv
spec:
  capacity:
    storage: 2Gi                    # 這塊 PV 有 2GB
  accessModes:
    - ReadWriteOnce                 # 只允許一個 Node 同時讀寫
  persistentVolumeReclaimPolicy: Retain   # PVC 刪了資料保留
  storageClassName: manual          # 給 PVC 配對用的標籤
  hostPath:
    path: /tmp/k8s-pv-data          # 用 Node 本機目錄當儲存
\`\`\`

幾個關鍵欄位：

### \`accessModes\`：誰能讀寫？

| Mode | 縮寫 | 行為 | 適合 |
|------|------|------|------|
| \`ReadWriteOnce\` | RWO | 一個 Node 可讀寫 | **資料庫**（最常用） |
| \`ReadOnlyMany\` | ROX | 多個 Node 可唯讀 | 靜態檔案 |
| \`ReadWriteMany\` | RWX | 多個 Node 可讀寫 | 共享檔案（需 NFS） |

⚠️ RWO 是「同時間一個 **Node**」不是「一個 Pod」 — 同 Node 上的多個 Pod 可以共用。

### \`persistentVolumeReclaimPolicy\`：PVC 刪了 PV 怎辦？

| Policy | 行為 | 適合 |
|--------|------|------|
| \`Retain\` | PV 和資料保留，管理員手動處理 | **生產環境**（資料不能丟） |
| \`Delete\` | PV 和資料一起砍 | 開發環境 / 雲端（PVC 刪 EBS 磁碟也刪，省錢） |

正式環境**永遠用 Retain**。\`kubectl delete pvc\` 不小心打錯就 game over 了。

### \`hostPath\`（學習用）

\`hostPath\` 用 Node 本機的某個目錄當儲存。**只能在學習 / 單機叢集用**，因為：

- 多 Node 叢集，Pod 換到別台 Node 就找不到資料
- Node 本身掛掉，資料就跟著沒
- 沒做容錯 / 備份

正式環境用 NFS / Ceph / 雲商磁碟（GCE PD / AWS EBS）。

## PVC YAML

\`\`\`yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: local-pvc
spec:
  accessModes:
    - ReadWriteOnce               # ← 跟 PV 對應
  resources:
    requests:
      storage: 1Gi                # 我要 1GB（PV 有 2GB，夠）
  storageClassName: manual        # ← 跟 PV 對應
\`\`\`

PVC 不指定 PV 名字，K8s 會看 \`storageClassName\` + \`accessModes\` + 容量去**自動配對**。

## 配對流程

\`\`\`bash
$ kubectl apply -f pv.yaml
$ kubectl apply -f pvc.yaml

$ kubectl get pv,pvc
NAME           CAPACITY   ACCESS MODES   STATUS    CLAIM
pv/local-pv    2Gi        RWO            Bound     default/local-pvc

NAME             STATUS   VOLUME      CAPACITY
pvc/local-pvc    Bound    local-pv    2Gi
\`\`\`

\`STATUS: Bound\` = 配對成功。注意：

- PVC 申請 1GB，但配到的 PV 是 2GB → **整顆 PV 都歸 PVC 用**（一夫一妻制）
- 想要剛好 1GB？多建一個 1GB PV，K8s 自動挑最接近的

## Pod 用 PVC

\`\`\`yaml
apiVersion: v1
kind: Pod
metadata:
  name: mysql-with-pvc
spec:
  containers:
    - name: mysql
      image: mysql:8.0
      env:
        - name: MYSQL_ROOT_PASSWORD
          value: rootpw
      volumeMounts:
        - name: data
          mountPath: /var/lib/mysql   # MySQL 資料目錄
  volumes:
    - name: data
      persistentVolumeClaim:
        claimName: local-pvc          # ← 掛 PVC
\`\`\`

容器內的 \`/var/lib/mysql\` 寫入會落到 PVC 對應的 PV 實體儲存。

## 驗證資料持久化

\`\`\`bash
# 1. 寫資料
$ kubectl exec mysql-with-pvc -- mysql -prootpw -e "
  CREATE DATABASE shop;
  USE shop;
  CREATE TABLE users(name VARCHAR(20));
  INSERT INTO users VALUES('Alice');
"

# 2. 砍 Pod
$ kubectl delete pod mysql-with-pvc

# 3. 重建 Pod（同一個 PVC）
$ kubectl apply -f mysql-pod.yaml

# 4. 看資料
$ kubectl exec mysql-with-pvc -- mysql -prootpw -e "USE shop; SELECT * FROM users;"
+-------+
| name  |
+-------+
| Alice |               # ← 資料還在！
+-------+
\`\`\`

對照沒掛 PVC 的版本：資料消失 vs 資料還在。**這就是 PV / PVC 的價值**。

## 排錯

| STATUS | 意思 | 怎麼處理 |
|--------|------|---------|
| \`Bound\` | 配對成功 | 正常 |
| \`Pending\` | PVC 找不到合適 PV | 檢查 \`storageClassName\` / 容量是否匹配 |
| \`Lost\` | PV 不見了 | PV 被手動刪除？hostPath 目錄被砍？ |

\`Pending\` 最常見，看一下原因：

\`\`\`bash
$ kubectl describe pvc local-pvc
Events:
  Warning  ProvisioningFailed  no available volume plugin matches
\`\`\`

通常是：
1. \`storageClassName\` 跟 PV 對不上
2. 沒有 PV 容量夠大
3. \`accessModes\` 不一致

## 重點整理

- 容器是無狀態的，要保資料必須用 PV
- PV = 實體儲存（管理員建），PVC = 申請單（開發者寫）
- K8s 自動配對（看 \`storageClassName\` / \`accessModes\` / 容量）
- \`accessModes\` 90% 用 \`ReadWriteOnce\`
- 生產用 \`Retain\`，**永遠不要用 Delete**
- \`hostPath\` 只能學習用，正式用 NFS / 雲商磁碟

## 下一步

PV 是手動建的 — 但工作上資料庫要 5GB、API 服務要 10GB、Cache 要 2GB...每個都管理員手動建，太累了。

下一篇：[StorageClass + StatefulSet 自動建 PV](/blog/k8s/storageclass-statefulset-mysql)。

> 📚 **完整系列總覽**：[K8s 系列教學首頁](/blog/#k8s)（共 40 課，按學習路徑順序排）
`,
  },
  {
    slug: 'storageclass-statefulset-mysql',
    order: 28,
    group: 'config',
    title: 'StorageClass + StatefulSet：在 K8s 上跑 MySQL 的正確做法',
    excerpt:
      '手動建 PV 太煩，StorageClass 自動佈建。Deployment 不適合跑 DB（Pod 名字會變），StatefulSet 給每個 Pod 固定身份。這篇實作 StatefulSet MySQL。',
    publishDate: '2026-05-25',
    tags: ['Kubernetes', 'StorageClass', 'StatefulSet', 'MySQL', 'DB'],
    readingTime: 11,
    content: `
## 手動建 PV 的痛點

[上一篇](/blog/k8s/pv-pvc-intro) PV / PVC 教完後你發現一個問題：**PV 是管理員手動建的**。

小規模還好。但企業環境：

- 3 個叢集
- 50 個微服務
- 每個都要 PVC

管理員每天工作就是建 PV、刪 PV、改 PV。建大了浪費、建小了不夠用。

這叫**靜態佈建（Static Provisioning）**。K8s 還支援**動態佈建（Dynamic Provisioning）**：開發者寫 PVC，K8s **自動建 PV**。

| | 靜態佈建 | 動態佈建 |
|--|----------|---------|
| 流程 | 管理員建 PV → PVC 配對 | PVC 一建 → PV 自動冒出來 |
| 適合 | 學習、小規模 | **生產環境** |
| 需要 | — | StorageClass |

## StorageClass：自動建 PV 的工廠

StorageClass 告訴 K8s「**當有人建 PVC，用什麼方式自動建 PV**」。像個工廠模板，訂單進來自動生產，不用每次重新畫圖。

\`\`\`yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: local-path
provisioner: rancher.io/local-path     # ← 用什麼 provisioner 建 PV
reclaimPolicy: Delete
\`\`\`

好消息：**k3s 內建一個 default StorageClass**：

\`\`\`bash
$ kubectl get storageclass
NAME                   PROVISIONER             DEFAULT
local-path (default)   rancher.io/local-path   true
\`\`\`

\`(default)\` 表示 PVC 沒指定 \`storageClassName\` 就自動用這個。

不同雲商有不同的 provisioner：

| 環境 | Provisioner | 自動建什麼 |
|------|------------|-----------|
| k3s | rancher.io/local-path | Node 本機目錄 |
| AWS EKS | ebs.csi.aws.com | EBS 磁碟 |
| GKE | pd.csi.storage.gke.io | Persistent Disk |
| Azure AKS | disk.csi.azure.com | Azure Disk |

你 PVC 寫一樣的 YAML，換到不同雲端，PV 自動換對應的儲存。

### 動態佈建 PVC

\`\`\`yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: dynamic-pvc
spec:
  storageClassName: local-path        # ← 不要自己建 PV
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
\`\`\`

\`\`\`bash
$ kubectl apply -f pvc.yaml
$ kubectl get pv,pvc
NAME            CAPACITY   STATUS    CLAIM
pv/pvc-abc12    1Gi        Bound     default/dynamic-pvc

NAME              STATUS   VOLUME       CAPACITY
pvc/dynamic-pvc   Bound    pvc-abc12    1Gi
\`\`\`

**沒有手動建 PV，K8s 自動產出 \`pvc-abc12\` 這顆 PV**。整個過程開發者完全不用碰 PV。

## 但是 — 資料庫不能用 Deployment

有了動態佈建，可以正式跑 MySQL 了。但**用 Deployment 跑 MySQL 有四個致命問題**：

### 問題 1：Pod 名稱隨機

Deployment 的 Pod 叫 \`mysql-deploy-7d8c-abc12\` — random hash，**每次重建名字都變**。MySQL 主從架構誰是主誰是從？

### 問題 2：沒有啟動順序

3 個副本同時啟動。但 MySQL 主從複製要主庫**先**起來、拿到 binlog position、從庫**再**連上去同步。同時起會打架。

### 問題 3：所有 Pod 共用同一個 PVC

Deployment 的 \`volumes\` 區塊只能寫一個 PVC，所有 Pod 都掛到那一個。**3 個 MySQL 同時寫同一塊磁碟 = 資料毀滅**。

### 問題 4：沒有穩定的網路身份

Service 會做負載均衡，連線隨機分到後端 Pod。但**寫入要送主庫、讀取送從庫**怎麼區分？

→ 這就是為什麼 K8s 有 **StatefulSet**。

## StatefulSet：給有狀態應用用的

StatefulSet 跟 Deployment 像，但給三個保證：

| 保證 | 內容 |
|------|------|
| **穩定的身份** | Pod 名固定 \`mysql-0\` / \`mysql-1\` / \`mysql-2\` |
| **獨立的儲存** | 每個 Pod 自動建獨立 PVC |
| **有序的生命週期** | 啟動 0 → 1 → 2，刪除 2 → 1 → 0 |

對照表：

| | Deployment | StatefulSet |
|--|-----------|-------------|
| Pod 名 | random hash | 固定序號 \`mysql-0\` |
| 啟動 | 同時 | 有序 0 → 1 → 2 |
| 刪除 | 隨機 | 反序 2 → 1 → 0 |
| PVC | 共用 | **每個 Pod 獨立** |
| DNS | 只有 Service DNS | **每個 Pod 自己的 DNS** |

## Headless Service：每個 Pod 自己的 DNS

StatefulSet 必須搭 **Headless Service**（無頭 Service）。

\`\`\`yaml
apiVersion: v1
kind: Service
metadata:
  name: mysql-headless
spec:
  clusterIP: None              # ← 這個是 Headless 的標誌
  selector:
    app: mysql-sts
  ports:
    - port: 3306
\`\`\`

\`clusterIP: None\` 意思是「**不要做負載均衡**」。

普通 Service：你連 \`mysql-svc\` → 隨機分到後面某個 Pod。
Headless Service：每個 Pod 自己有 DNS：

\`\`\`
mysql-0.mysql-headless.default.svc.cluster.local  → mysql-0 Pod
mysql-1.mysql-headless.default.svc.cluster.local  → mysql-1 Pod
mysql-2.mysql-headless.default.svc.cluster.local  → mysql-2 Pod
\`\`\`

應用就能精準連到「我要連主庫 \`mysql-0\`、讀 \`mysql-1\`」。

## StatefulSet YAML

\`\`\`yaml
apiVersion: apps/v1
kind: StatefulSet              # ← 不是 Deployment
metadata:
  name: mysql
spec:
  serviceName: mysql-headless  # ← 對應 Headless Service
  replicas: 2
  selector:
    matchLabels:
      app: mysql-sts
  template:
    metadata:
      labels:
        app: mysql-sts
    spec:
      containers:
        - name: mysql
          image: mysql:8.0
          envFrom:
            - secretRef:
                name: mysql-secret
          volumeMounts:
            - name: mysql-data
              mountPath: /var/lib/mysql
  # ★ 重點：volumeClaimTemplates
  volumeClaimTemplates:
    - metadata:
        name: mysql-data
      spec:
        accessModes:
          - ReadWriteOnce
        resources:
          requests:
            storage: 1Gi
        # 不寫 storageClassName 就用 default（k3s 是 local-path）
\`\`\`

跟 Deployment 三個關鍵差別：

1. \`kind: StatefulSet\`
2. \`serviceName\` 指向 Headless Service
3. \`volumeClaimTemplates\` 取代 \`volumes\` — **每個 Pod 自動建獨立 PVC**

## 觀察有序啟動

\`\`\`bash
$ kubectl apply -f statefulset-mysql.yaml
$ kubectl get pods -w

NAME       READY   STATUS              AGE
mysql-0    0/1     ContainerCreating   2s
mysql-0    1/1     Running             10s
mysql-1    0/1     Pending             10s     # ← mysql-0 Ready 後才開始
mysql-1    0/1     ContainerCreating   12s
mysql-1    1/1     Running             20s
\`\`\`

**mysql-0 完全 Ready，mysql-1 才開始建**。Deployment 不會這樣。

## 自動建的 PVC

\`\`\`bash
$ kubectl get pvc
NAME                    STATUS   VOLUME       CAPACITY
mysql-data-mysql-0      Bound    pvc-abc12    1Gi
mysql-data-mysql-1      Bound    pvc-def34    1Gi
\`\`\`

每個 Pod 自己一個 PVC，命名格式 \`<volumeClaimTemplate-name>-<pod-name>\`。完全自動。

## 砍 Pod 驗證資料持久化

\`\`\`bash
# 1. 建資料
$ kubectl exec mysql-0 -- mysql -prootpw -e "CREATE DATABASE testdb;"

# 2. 砍 mysql-0
$ kubectl delete pod mysql-0

# 3. StatefulSet 自動重建，名字還是 mysql-0
$ kubectl get pods
NAME       STATUS
mysql-0    Running     # ← 名字沒變
mysql-1    Running

# 4. 資料還在
$ kubectl exec mysql-0 -- mysql -prootpw -e "SHOW DATABASES;"
testdb       # ← 還在！
\`\`\`

關鍵：**新建的 mysql-0 自動掛回 \`mysql-data-mysql-0\` PVC**。資料完全保留。

## scale 行為

\`\`\`bash
$ kubectl scale statefulset mysql --replicas=3
# mysql-2 才被建

$ kubectl scale statefulset mysql --replicas=2
# mysql-2 先被刪，mysql-0、mysql-1 留著
\`\`\`

**有序建立，反序刪除**。確保資料庫主從關係不被破壞。

## 重點整理

- StorageClass 把「手動建 PV」自動化，PVC 一建 PV 自動冒出來
- k3s 內建 \`local-path\` 是 default，PVC 不用指定 \`storageClassName\` 就 work
- Deployment 跑 DB 四個問題：名字、順序、共用 PVC、沒網路身份
- StatefulSet 三保證：穩定身份 / 獨立儲存 / 有序生命週期
- 必須搭 Headless Service（\`clusterIP: None\`）
- \`volumeClaimTemplates\` 自動為每個 Pod 建獨立 PVC

## 下一步

到這邊你的目錄有 7-8 個 YAML 檔了：Secret、ConfigMap、StatefulSet、Headless Service、PVC、Ingress... 一個 MySQL 就這麼多。再加上 Redis、Elasticsearch — 整個系統幾十個檔案。

而且 dev / staging / prod 三個環境，replicas / Image tag / 密碼都不同，你要維護三套？

下一篇：[Helm — K8s 的套件管理器](/blog/k8s/helm-intro)。

> 📚 **完整系列總覽**：[K8s 系列教學首頁](/blog/#k8s)（共 40 課，按學習路徑順序排）
`,
  },
  {
    slug: 'helm-intro',
    order: 29,
    group: 'config',
    title: 'Helm 是什麼？K8s 的 npm，一個指令裝好整套服務',
    excerpt:
      '一份 MySQL 部署可能要 5 個 YAML（Deployment、Service、Secret、ConfigMap、PVC）。Helm 把它們打包成一個 Chart，helm install 一個指令搞定。',
    publishDate: '2026-05-26',
    tags: ['Kubernetes', 'Helm', 'Chart', '套件管理'],
    readingTime: 9,
    content: `
## 你寫過幾份 YAML？

開一個 MySQL 服務，最少要寫幾份 YAML？

- Deployment / StatefulSet（跑 MySQL 容器）
- Service（讓別人連得到）
- Secret（密碼）
- ConfigMap（my.cnf 設定）
- PVC（資料儲存）

**5 份 YAML，只為了一個 MySQL**。

如果你的專案有 MySQL、Redis、RabbitMQ、Elasticsearch，就要寫 20 份 YAML。每個環境（dev / staging / prod）還要再複製一份，改幾個 namespace 跟密碼。

這就是 **Helm 要解決的問題**。

## Helm 是什麼？

**Helm = Kubernetes 的套件管理器**。

如果你用過：
- Ubuntu \\\`apt install nginx\\\`
- macOS \\\`brew install postgresql\\\`
- Node.js \\\`npm install express\\\`
- Python \\\`pip install requests\\\`

那 Helm 就是 K8s 版本：

\\\`\\\`\\\`bash
helm install my-mysql bitnami/mysql
\\\`\\\`\\\`

**一行指令**，背後幫你建好 Deployment + Service + Secret + ConfigMap + PVC，全部都裝好。

## 四個核心概念

### 1. Chart — 套件包

一個 Chart 就是「**一包 YAML 模板 + 預設參數**」。例如 \\\`bitnami/mysql\\\` 這個 Chart，裡面已經寫好 MySQL 部署需要的所有 K8s 資源模板。

### 2. Release — 安裝後的實例

當你 \\\`helm install my-mysql bitnami/mysql\\\`，這個 \\\`my-mysql\\\` 就是 Release 名字。

**同一個 Chart 可以裝很多次**，每次給不同的 Release 名稱：

\\\`\\\`\\\`bash
helm install mysql-dev bitnami/mysql
helm install mysql-staging bitnami/mysql
helm install mysql-prod bitnami/mysql
\\\`\\\`\\\`

三個 Release，三組獨立的 MySQL，互不干擾。

### 3. Repository — Chart 倉庫

就像 npm registry、Docker Hub，Helm 也有官方/第三方倉庫。最知名的是 **Bitnami**（VMware 出的，品質高）。

\\\`\\\`\\\`bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
\\\`\\\`\\\`

加完之後，就可以搜尋裡面有什麼：

\\\`\\\`\\\`bash
helm search repo bitnami | grep -i mysql
\\\`\\\`\\\`

### 4. values.yaml — 參數設定檔

Chart 是模板，**不同人裝會有不同需求**：要多少記憶體、密碼是什麼、要不要開 metrics。

這些都寫在 \\\`values.yaml\\\` 給 Helm 吃：

\\\`\\\`\\\`yaml
# values.yaml
auth:
  rootPassword: "MySecretPassword123"
  database: "myapp"
primary:
  persistence:
    size: 10Gi
metrics:
  enabled: true
\\\`\\\`\\\`

\\\`\\\`\\\`bash
helm install my-mysql bitnami/mysql -f values.yaml
\\\`\\\`\\\`

## 實作：用 Helm 裝 MySQL

從零開始走一遍：

\\\`\\\`\\\`bash
# 1. 加倉庫
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# 2. 看看 Chart 長什麼樣
helm show values bitnami/mysql > mysql-values.yaml

# 3. 改你要的設定（如資料庫名稱、密碼）
vim mysql-values.yaml

# 4. 安裝
helm install my-mysql bitnami/mysql -f mysql-values.yaml

# 5. 看安裝了什麼
kubectl get all -l app.kubernetes.io/instance=my-mysql
\\\`\\\`\\\`

你會看到一次冒出 StatefulSet、Service、Secret、ConfigMap、PVC——**全部一氣呵成**。

## 升級與回滾

Helm 最香的地方在這。

### 升級

改了 values.yaml？\\\`helm upgrade\\\` 一行搞定：

\\\`\\\`\\\`bash
helm upgrade my-mysql bitnami/mysql -f mysql-values.yaml
\\\`\\\`\\\`

### 看版本歷史

\\\`\\\`\\\`bash
helm history my-mysql
# REVISION  STATUS    DESCRIPTION
# 1         deployed  Install complete
# 2         deployed  Upgrade complete
# 3         deployed  Upgrade complete
\\\`\\\`\\\`

### 回滾

升級壞掉？回到上一版：

\\\`\\\`\\\`bash
helm rollback my-mysql 2
\\\`\\\`\\\`

**這就是套件管理器的威力**。手寫 YAML 沒這個能力——你只能自己 git revert 然後 kubectl apply。

## 常用指令清單

| 指令 | 作用 |
|------|------|
| \\\`helm repo add\\\` | 加倉庫 |
| \\\`helm search repo\\\` | 搜尋 Chart |
| \\\`helm show values\\\` | 看 Chart 預設參數 |
| \\\`helm install\\\` | 安裝 |
| \\\`helm list\\\` | 看裝過哪些 Release |
| \\\`helm upgrade\\\` | 升級 |
| \\\`helm history\\\` | 看版本歷史 |
| \\\`helm rollback\\\` | 回滾 |
| \\\`helm uninstall\\\` | 移除 |

## Helm vs Docker Compose

很多人會比較這兩個：

| | Docker Compose | Helm |
|---|---|---|
| 用在哪 | 單機 Docker | K8s 集群 |
| 一份 YAML | docker-compose.yml | 整個 Chart |
| 多環境 | 自己抽 .env | values-dev.yaml / values-prod.yaml |
| 版本管理 | 沒有 | helm history / rollback |
| 共享生態 | 沒有官方 registry | Bitnami / ArtifactHub |

**Compose 是給開發用的，Helm 是生產等級的部署工具**。

## 重點整理

- **Helm = K8s 的 apt / brew / npm**：一個指令裝好整套服務
- **Chart**：模板包；**Release**：安裝後的實例；**Repository**：倉庫；**values.yaml**：參數
- **\\\`helm install / upgrade / rollback\\\`**：版本管理三劍客
- **生產環境必備**：手寫 YAML 沒辦法做版本回滾
- **Bitnami Chart 品質高**：MySQL、Redis、PostgreSQL 等開箱即用

## 下一步

到目前為止，你已經會「**部署應用**」了。但部署只是開始——上線後會遇到一堆問題：

- 應用卡住了，K8s 怎麼知道？
- 應用記憶體爆了，K8s 怎麼處理？
- 流量突然變大，怎麼自動擴容？
- 不該動的人在亂動我的 Pod，怎麼擋？

下一篇進入 **Group 5：生產就緒**。先從第一個問題開始：[Probe — K8s 怎麼判斷你的應用還活著？](/blog/k8s/probe-liveness-readiness-startup)

> 📚 **完整系列總覽**：[K8s 系列教學首頁](/blog/#k8s)（共 40 課，按學習路徑順序排）
`,
  },

  // ====== Group 5: ops — 生產就緒（對應第 7 堂）======
  {
    slug: 'probe-liveness-readiness-startup',
    order: 30,
    group: 'ops',
    title: 'K8s Probe 完整教學：Liveness、Readiness、Startup 三種健康檢查',
    excerpt:
      'Pod 顯示 Running 不代表服務正常。Probe 是 K8s 的「敲門檢查」：Liveness 看活著沒、Readiness 看能接流量沒、Startup 給慢啟動程式緩衝。',
    publishDate: '2026-05-27',
    tags: ['Kubernetes', 'Probe', 'Liveness', 'Readiness', '健康檢查'],
    readingTime: 11,
    content: `
## Pod Running ≠ 服務正常

凌晨三點，你的 API 服務「Running」狀態，但客戶反映：**首頁打不開**。

\\\`\\\`\\\`bash
kubectl get pods
NAME              READY   STATUS    RESTARTS   AGE
my-api-xxx        1/1     Running   0          3h
\\\`\\\`\\\`

看起來一切正常。但你 curl 一下：

\\\`\\\`\\\`bash
curl http://my-api/health
# (沒回應，hang 住...)
\\\`\\\`\\\`

**Pod 是活的，但程式卡死了**。可能是：
- Java 應用 OOM 但沒有 crash，只是 GC 不停
- Node.js event loop 卡住（同步阻塞）
- 死鎖、無窮迴圈
- 連到外部資料庫的連線池耗盡

K8s 怎麼知道？答案就是 **Probe（健康檢查）**。

## 三種 Probe，各司其職

K8s 提供三種 Probe，每一種解決不同的問題：

| Probe | 問的問題 | 失敗怎麼辦 | 用在哪 |
|-------|---------|-----------|-------|
| **livenessProbe** | 你還活著嗎？ | **重啟容器** | 偵測死鎖、卡死 |
| **readinessProbe** | 你準備好接流量了嗎？ | **從 Service 摘下** | 啟動中、暫時過載 |
| **startupProbe** | 你啟動完了嗎？ | **重啟容器** | 啟動慢的應用（Java） |

用餐廳比喻：

- **liveness** = 廚師還有心跳嗎？沒有就換一個。
- **readiness** = 廚師準備好出菜沒？還沒好就先不送單進去。
- **startup** = 廚師還在熱鍋嗎？等他熱好再檢查其他的。

## 三種檢查方式

每種 Probe 都可以用以下三種方式來檢查：

| 方式 | 說明 | 適合 |
|------|------|------|
| **httpGet** | 打 HTTP，回 200-399 算過 | Web API |
| **tcpSocket** | 嘗試連線該 port | MySQL、Redis 等非 HTTP |
| **exec** | 在容器內執行指令，exit 0 算過 | 自訂檢查邏輯 |

## YAML 寫法

\\\`\\\`\\\`yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-probe-demo
spec:
  template:
    spec:
      containers:
      - name: api
        image: my-api:1.0
        ports:
        - containerPort: 80
        livenessProbe:
          httpGet:
            path: /healthz
            port: 80
          initialDelaySeconds: 10
          periodSeconds: 10
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /ready
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
        startupProbe:
          httpGet:
            path: /healthz
            port: 80
          failureThreshold: 30
          periodSeconds: 10
\\\`\\\`\\\`

### 關鍵參數

| 參數 | 意義 |
|------|------|
| \\\`initialDelaySeconds\\\` | 啟動後等多久才開始檢查 |
| \\\`periodSeconds\\\` | 多久檢查一次 |
| \\\`timeoutSeconds\\\` | 等多久算超時 |
| \\\`failureThreshold\\\` | 連續失敗幾次才算掛 |
| \\\`successThreshold\\\` | 連續成功幾次算恢復（readiness 用） |

## Liveness 失敗會怎樣？

實作一次給你看：

\\\`\\\`\\\`bash
# 進去 Pod，把 /healthz 端點故意搞壞
POD=$(kubectl get pods -l app=api-probe-demo -o jsonpath='{.items[0].metadata.name}')
kubectl exec $POD -- rm /app/healthz

# 觀察 Pod 狀態
kubectl get pods -l app=api-probe-demo -w
\\\`\\\`\\\`

你會看到：

\\\`\\\`\\\`
NAME              READY   STATUS    RESTARTS
api-probe-demo    1/1     Running   0
api-probe-demo    0/1     Running   1   ← 重啟了！
api-probe-demo    1/1     Running   1   ← 恢復
\\\`\\\`\\\`

**RESTARTS 變成 1**——K8s 偵測到 liveness 失敗，自動重啟容器。

## Readiness 失敗會怎樣？

關鍵差別：**不重啟，但摘掉流量**。

\\\`\\\`\\\`bash
# 看 Service 的 Endpoints
kubectl get endpoints my-api-svc
# NAME         ENDPOINTS                          AGE
# my-api-svc   10.42.0.5:80,10.42.0.6:80          5m

# 把 10.42.0.5 的 readiness 弄壞
# 等 5 秒後再看：
kubectl get endpoints my-api-svc
# NAME         ENDPOINTS              AGE
# my-api-svc   10.42.0.6:80           5m   ← 10.42.0.5 不見了！
\\\`\\\`\\\`

**這就是 readiness 的精髓**——程式還活著，但暫時不健康（如資料庫連線斷了），K8s 就先不要把流量送過來，等它恢復再說。

## 為什麼要 startupProbe？

Java / Spring Boot 啟動可能要 30-60 秒。如果只設 livenessProbe：

\\\`\\\`\\\`yaml
livenessProbe:
  httpGet:
    path: /healthz
  initialDelaySeconds: 5     # ← 5 秒後就開始檢查
  failureThreshold: 3        # ← 連續失敗 3 次就重啟
\\\`\\\`\\\`

結果：
1. Pod 啟動，5 秒後開始檢查
2. Spring Boot 還沒啟動完，每次檢查都失敗
3. 連續失敗 3 次，K8s 把容器重啟
4. **永遠啟動不起來**——陷入「啟動 → 失敗 → 重啟」迴圈

**解法是 startupProbe**：

\\\`\\\`\\\`yaml
startupProbe:
  httpGet:
    path: /healthz
  failureThreshold: 30     # 失敗 30 次才放棄
  periodSeconds: 10        # 每 10 秒一次 → 最多容忍 5 分鐘啟動
\\\`\\\`\\\`

**startupProbe 沒過之前，liveness 和 readiness 都不會跑**。等啟動好了，才換成正常的 liveness 監控。

## 三個 Probe 該怎麼配？

最佳實踐：

\\\`\\\`\\\`yaml
# 啟動慢 → startupProbe 寬鬆
startupProbe:
  failureThreshold: 30
  periodSeconds: 10

# 活著就好 → liveness 簡單一點
livenessProbe:
  failureThreshold: 3
  periodSeconds: 10

# 流量精細控制 → readiness 嚴格
readinessProbe:
  failureThreshold: 1
  periodSeconds: 5
\\\`\\\`\\\`

**Liveness 不要設太嚴格**——容易誤殺正在處理請求的 Pod。**Readiness 要敏感**——出問題趕快摘流量，恢復後再回來。

## 重點整理

- **Pod Running ≠ 程式正常**，要有 Probe 才知道
- **Liveness 失敗 → 重啟**，**Readiness 失敗 → 摘流量**，**Startup 給慢啟動緩衝**
- 三種檢查方式：**httpGet / tcpSocket / exec**
- Java 應用幾乎都需要 startupProbe，避免啟動迴圈
- Liveness 寬鬆、Readiness 敏感，避免誤殺

## 下一步

健康檢查有了，**但程式還是會吃光記憶體 / CPU**。一個 Pod 失控吃掉 16GB 記憶體，會把整個 Node 拖垮，其他 Pod 全部跟著掛。

下一篇：[Resource Limits 與 OOMKilled — 怎麼防止單一 Pod 拖垮整個 Node](/blog/k8s/resource-limits-qos-oomkilled)

> 📚 **完整系列總覽**：[K8s 系列教學首頁](/blog/#k8s)（共 40 課，按學習路徑順序排）
`,
  },
  {
    slug: 'resource-limits-qos-oomkilled',
    order: 31,
    group: 'ops',
    title: 'Resource limits 與 QoS：OOMKilled 是什麼？怎麼避免一個 Pod 吃光記憶體？',
    excerpt:
      '一個 Pod 沒設限制，吃光 Node 記憶體，整台機器跟著倒。requests 是「保證有」、limits 是「最多吃」，配出 Guaranteed / Burstable / BestEffort 三種 QoS。',
    publishDate: '2026-05-28',
    tags: ['Kubernetes', 'Resource', 'limits', 'QoS', 'OOMKilled'],
    readingTime: 10,
    content: `
## 一個 Pod 拖垮一整台 Node

凌晨四點，你被告警吵醒：

> 「整個 cluster 不正常，Pod 一直被驅逐（Evicted）。」

你登入查看：

\\\`\\\`\\\`bash
kubectl top nodes
NAME           CPU%   MEMORY%
worker-1       95%    98%      ← 這台快爆了
\\\`\\\`\\\`

\\\`\\\`\\\`bash
kubectl top pods -n production
NAME                     CPU     MEMORY
data-job-xxx             100m    14Gi    ← 兇手在這
\\\`\\\`\\\`

一個 \\\`data-job\\\` Pod 沒設記憶體限制，吃光了 Node 的 16GB。其他 Pod 全部跟著掛——這就是「**鄰居效應**」。

**解法：Resource requests + limits**。

## requests vs limits — 兩個概念，一次搞清楚

| | requests（請求） | limits（限制） |
|---|------|------|
| 比喻 | 預約座位 | 最多坐幾個 |
| 影響 | Scheduler 排程依據 | 容器執行時的天花板 |
| 超過怎樣 | 不會超過（保證給你） | CPU 被節流、記憶體 OOMKilled |

\\\`\\\`\\\`yaml
spec:
  containers:
  - name: api
    image: my-api:1.0
    resources:
      requests:
        cpu: "100m"        # 0.1 顆 CPU
        memory: "64Mi"     # 保底
      limits:
        cpu: "500m"        # 最多 0.5 顆
        memory: "128Mi"    # 超過就 OOMKilled
\\\`\\\`\\\`

### CPU 單位

- \\\`1\\\` = 1 顆 CPU
- \\\`500m\\\` = 0.5 顆（500 millicpu）
- \\\`100m\\\` = 0.1 顆

### 記憶體單位

- \\\`Mi\\\` = MiB（1024 進位）
- \\\`Gi\\\` = GiB
- \\\`128M\\\` 跟 \\\`128Mi\\\` 不一樣（前者是 1000 進位）——**永遠用 \\\`Mi\\\` / \\\`Gi\\\`**

## CPU 超過 vs 記憶體超過

關鍵差別：

| | CPU 超過 limits | 記憶體超過 limits |
|---|------|------|
| 後果 | **節流（Throttle）**——程式變慢 | **OOMKilled**——直接殺掉 |
| 可恢復 | 可以，等流量降 | 不可，要重啟 |

**這是因為：CPU 是可壓縮資源（compressible），記憶體不是**。記憶體不夠就只能殺。

## 三種 QoS（Quality of Service）

K8s 根據你怎麼設 requests/limits，給 Pod 一個 QoS 等級。**Node 資源不夠時，這個等級決定誰先被殺**。

| QoS | 條件 | 被殺優先順序 |
|------|------|-------------|
| **Guaranteed** | requests = limits（每個容器都設且相等） | **最後被殺** |
| **Burstable** | 有設 requests，但 requests ≠ limits | 中間 |
| **BestEffort** | **完全沒設 requests 和 limits** | **最先被殺** |

### BestEffort 為什麼危險

\\\`\\\`\\\`yaml
# 沒寫 resources，就是 BestEffort
spec:
  containers:
  - name: api
    image: my-api:1.0
    # 沒有 resources!
\\\`\\\`\\\`

當 Node 資源緊張時，K8s 第一個犧牲的就是這種 Pod。**生產環境絕對不能 BestEffort**。

### 該選 Guaranteed 還是 Burstable？

- **Guaranteed**（requests = limits）：資源保證、最穩定，但**浪費**——預留的資源用不完也鎖住
- **Burstable**（requests < limits）：彈性好，平常用 requests 的量，需要時可 burst 到 limits

**實務上絕大多數選 Burstable**——平常省資源，尖峰能爆量。

## 實作：手動觸發 OOMKilled

\\\`\\\`\\\`yaml
# oom-demo.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: oom-demo
spec:
  replicas: 1
  selector:
    matchLabels:
      app: oom-demo
  template:
    metadata:
      labels:
        app: oom-demo
    spec:
      containers:
      - name: stress
        image: progrium/stress
        args: ["--vm", "1", "--vm-bytes", "256M", "--timeout", "60s"]
        resources:
          limits:
            memory: "128Mi"   # 限 128，但程式要吃 256
\\\`\\\`\\\`

\\\`\\\`\\\`bash
kubectl apply -f oom-demo.yaml
kubectl get pods -w
\\\`\\\`\\\`

你會看到：

\\\`\\\`\\\`
NAME           READY   STATUS              RESTARTS
oom-demo       0/1     OOMKilled           1
oom-demo       0/1     CrashLoopBackOff    2
oom-demo       0/1     CrashLoopBackOff    3      ← 一直重啟
\\\`\\\`\\\`

### 確認是不是 OOMKilled

\\\`\\\`\\\`bash
kubectl describe pod oom-demo-xxx
# Last State:     Terminated
#   Reason:       OOMKilled        ← 在這
#   Exit Code:    137
\\\`\\\`\\\`

**Exit Code 137 = SIGKILL（128 + 9）**，記憶體超標被強制殺掉的標誌。

## 看到 OOMKilled 怎麼辦？

排查順序：

1. \\\`kubectl describe pod\\\` 確認是 OOMKilled
2. \\\`kubectl top pod\\\` 看實際用量
3. **判斷：是 limits 太小，還是程式 memory leak？**
   - 如果尖峰流量正常但被殺 → 加大 limits
   - 如果用量持續成長不下降 → 程式有 leak，先修 bug

**慘案案例**：把 limits 設太小（像 64Mi）跑 Java 應用，JVM 啟動就炸。Java 應用 limits 至少 512Mi 起跳。

## 重點整理

- **requests = 保底（排程依據）**，**limits = 天花板（執行限制）**
- **CPU 超過 → 節流**，**記憶體超過 → OOMKilled**
- 三種 QoS：**Guaranteed > Burstable > BestEffort**
- **生產環境至少要 Burstable**，BestEffort 第一個被殺
- **Exit Code 137 = OOMKilled** 的標誌
- 看到 OOMKilled，先分清楚是「limits 設太小」還是「程式有 leak」

## 下一步

設好 Resource limits，單一 Pod 不會拖垮 Node。**但流量爆漲怎麼辦？**

雙 11 流量 10 倍，固定 3 個 Pod 撐不住——**該自動擴容了**。

下一篇：[HPA 自動擴縮 — K8s 怎麼根據 CPU 自動加 Pod](/blog/k8s/hpa-autoscale-loadtest)

> 📚 **完整系列總覽**：[K8s 系列教學首頁](/blog/#k8s)（共 40 課，按學習路徑順序排）
`,
  },
  {
    slug: 'hpa-autoscale-loadtest',
    order: 32,
    group: 'ops',
    title: 'HPA 自動擴縮容：流量一來自動加 Pod，壓測實戰',
    excerpt:
      '手動 kubectl scale 來不及，HPA 看 CPU / Memory 自動加減 Pod。這篇用 hey 工具壓測 nginx，看著 Pod 從 1 個自動長到 10 個，再自動縮回去。',
    publishDate: '2026-05-29',
    tags: ['Kubernetes', 'HPA', '自動擴縮容', '壓測', 'autoscale'],
    readingTime: 11,
    content: `
## 為什麼需要 HPA？

電商網站的場景：

- 平常：2 個 Pod 撐得住流量
- 雙 11 大促：流量翻 10 倍，2 個 Pod 直接被打爆
- 凌晨 3 點：沒人逛，10 個 Pod 閒在那邊浪費錢

手動的解法是 \\\`kubectl scale\\\`：

\\\`\\\`\\\`bash
kubectl scale deployment my-api --replicas=10   # 大促前
kubectl scale deployment my-api --replicas=2    # 大促後
\\\`\\\`\\\`

但你不可能 24 小時盯著儀表板。**該自動化了**。

**HPA = Horizontal Pod Autoscaler**——K8s 看 CPU 使用率，**自動**幫你加減 Pod。

## HPA 怎麼運作？

\`\`\`
[Metrics Server] ── 每 15 秒收集 Pod CPU/Memory 用量
        │
        ▼
     [HPA]  ── 比對 target（如 50%），算出該幾個 Pod
        │
        ▼
   [Deployment] ── 改 replicas
        │
        ▼
     [Pods]  ── 自動增減
\`\`\`

## 前提：Resource requests 一定要設

\\\`\\\`\\\`yaml
resources:
  requests:
    cpu: "100m"
    memory: "64Mi"
  limits:
    cpu: "500m"
    memory: "128Mi"
\\\`\\\`\\\`

**為什麼？因為 HPA 算的是百分比**。

「CPU 使用率 50%」是相對於 **requests** 的 50%。如果 \\\`requests: 100m\\\`，使用率 50% 就是 50m。沒設 requests，HPA 沒辦法算百分比，**直接擺爛不擴容**。

## 安裝 metrics-server

HPA 需要 metrics-server 才能取得 CPU 數據。

\\\`\\\`\\\`bash
# minikube
minikube addons enable metrics-server

# k3s（內建，不用裝）
# 自動已啟用
\\\`\\\`\\\`

確認跑起來：

\\\`\\\`\\\`bash
kubectl top nodes
kubectl top pods
\\\`\\\`\\\`

如果 \\\`kubectl top\\\` 顯示數字，就 OK 了。

## HPA YAML

\\\`\\\`\\\`yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-resources-demo   # 要擴縮的 Deployment
  minReplicas: 1
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 50   # CPU 超過 50% 就擴容
\\\`\\\`\\\`

關鍵欄位：

| 欄位 | 意義 |
|------|------|
| \\\`scaleTargetRef\\\` | 要擴縮哪個 Deployment |
| \\\`minReplicas\\\` | 最少幾個 Pod |
| \\\`maxReplicas\\\` | 最多幾個 Pod（防失控） |
| \\\`averageUtilization\\\` | 觸發擴容的 CPU 閾值（%） |

## 實作：壓測讓 Pod 自動長出來

### Step 1：部署 HPA

\\\`\\\`\\\`bash
kubectl apply -f hpa.yaml
kubectl get hpa
# NAME      REFERENCE                       TARGETS         MINPODS   MAXPODS   REPLICAS
# api-hpa   Deployment/api-resources-demo   <unknown>/50%   1         10        1
\\\`\\\`\\\`

剛建立會看到 \\\`<unknown>\\\`，等 30 秒就會變成 \\\`0%/50%\\\`。

### Step 2：壓力測試

開兩個終端：

**終端 1（觀察）：**
\\\`\\\`\\\`bash
kubectl get hpa -w
\\\`\\\`\\\`

**終端 2（壓測）：**
\\\`\\\`\\\`bash
# 進去 Pod 內部，無限呼叫 API
kubectl run -i --tty load-generator --rm \\\\
  --image=busybox --restart=Never -- \\\\
  /bin/sh -c "while true; do wget -q -O- http://api-svc; done"
\\\`\\\`\\\`

### Step 3：看 HPA 自動加 Pod

終端 1 你會看到：

\\\`\\\`\\\`
NAME      TARGETS    REPLICAS
api-hpa   0%/50%     1
api-hpa   125%/50%   1     ← 流量來了
api-hpa   125%/50%   3     ← 自動加到 3 個
api-hpa   85%/50%    3
api-hpa   85%/50%    5     ← 還是太高，再加
api-hpa   50%/50%    5     ← 平衡了
\\\`\\\`\\\`

按 Ctrl+C 停掉壓測：

\\\`\\\`\\\`
api-hpa   10%/50%    5     ← 流量降了
api-hpa   0%/50%     5     ← 但還沒縮
... 等 5 分鐘 ...
api-hpa   0%/50%     1     ← 縮回去了
\\\`\\\`\\\`

## 為什麼縮容比擴容慢？

**擴容快（30 秒內反應），縮容慢（預設 5 分鐘）**——這是故意的。

**原因**：流量是波動的。如果剛降一點就馬上縮，等下流量又來，又得擴，**Pod 一直開開關關**反而災難。

可以微調 \\\`behavior\\\`：

\\\`\\\`\\\`yaml
spec:
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300   # 觀察 5 分鐘才縮
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
\\\`\\\`\\\`

## HPA 沒效？三步驟排查

| 症狀 | 排查 |
|------|------|
| TARGETS 一直 \\\`<unknown>\\\` | metrics-server 沒裝或沒跑 |
| TARGETS 是 \\\`<unknown>/50%\\\` 但 Pod 有跑 | Deployment 沒設 requests |
| CPU 100% 但不擴容 | 沒到 maxReplicas 嗎？看 HPA event |

\\\`\\\`\\\`bash
kubectl describe hpa api-hpa   # 看 events 區塊找原因
\\\`\\\`\\\`

## 重點整理

- **HPA = K8s 自動 scale**：流量大自動加、流量小自動砍
- **必須設 \\\`resources.requests\\\`**——HPA 算的是百分比
- **必須有 metrics-server**——HPA 看不到數據就擺爛
- **擴容快（30s）、縮容慢（5min）**——避免抖動
- 進階版：VPA（垂直擴縮）、KEDA（事件驅動擴縮）

## 下一步

服務有 Probe、有 limits、有自動擴容——**但誰都能 \\\`kubectl delete pod\\\` 把它砍掉**。

實習生不小心 \\\`kubectl delete deployment\\\`，整個服務就沒了。**該管權限了**。

下一篇：[RBAC — 讓只讀帳號真的只能讀](/blog/k8s/rbac-readonly-user)

> 📚 **完整系列總覽**：[K8s 系列教學首頁](/blog/#k8s)（共 40 課，按學習路徑順序排）
`,
  },
  {
    slug: 'rbac-readonly-user',
    order: 33,
    group: 'ops',
    title: 'K8s RBAC 教學：建一個只讀帳號給工程師查問題',
    excerpt:
      'admin 權限給每個工程師太危險。RBAC 用 Role + RoleBinding 把權限綁到使用者：你只能 get pod、不能刪、不能改。這篇實作只讀帳號完整流程。',
    publishDate: '2026-05-30',
    tags: ['Kubernetes', 'RBAC', '權限', 'Role', 'ServiceAccount'],
    readingTime: 11,
    content: `
## 一個共用 admin 帳號的災難

某公司新進工程師第一天上班，主管丟了一個 \\\`config\\\` 檔給他：

> 「這是 K8s 的 kubeconfig，所有環境都用這個。」

新人為了清測試環境的舊資源，下了：

\\\`\\\`\\\`bash
kubectl delete namespace prod
\\\`\\\`\\\`

**整個生產環境消失了**。為什麼？因為那個 kubeconfig 是 **cluster-admin**，所有人共用。

K8s 怎麼避免這種事？答案是 **RBAC（Role-Based Access Control）**。

## RBAC 的邏輯就三個字

> **誰** + **能做什麼** + **綁定起來**

| 概念 | K8s 物件 |
|------|---------|
| 誰 | User / Group / **ServiceAccount** |
| 能做什麼 | **Role** / ClusterRole |
| 綁定起來 | **RoleBinding** / ClusterRoleBinding |

## 四個物件，先記範圍

| 物件 | 作用範圍 | 用途 |
|------|---------|------|
| **Role** | 單一 Namespace | 定義「能對什麼資源做什麼動作」 |
| **ClusterRole** | 整個叢集 | 同上，但跨 Namespace |
| **RoleBinding** | 單一 Namespace | 把 Role 綁到某人身上 |
| **ClusterRoleBinding** | 整個叢集 | 把 ClusterRole 綁到某人身上 |

用門禁卡比喻：

- **Role** = 門禁卡（只能進 3F 研發部）
- **ClusterRole** = 萬能卡（所有樓層都能進）
- **RoleBinding** = 把門禁卡發給某個人
- **ClusterRoleBinding** = 把萬能卡發給某個人

## ServiceAccount = Pod 的身份

人類用 \\\`kubectl\\\` 是透過 User 認證。**Pod 呢？**

Pod 也常常需要呼叫 K8s API（如 ingress-controller、Prometheus、ArgoCD 等）。Pod 的身份就是 **ServiceAccount**。

\\\`\\\`\\\`bash
# 每個 Namespace 預設都有一個 default
kubectl get sa
# NAME      SECRETS   AGE
# default   1         5d
\\\`\\\`\\\`

## Role YAML：拆解 verbs

\\\`\\\`\\\`yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: default
  name: pod-viewer
rules:
- apiGroups: [""]                    # core API（Pod, Service 這些）
  resources: ["pods", "pods/log"]
  verbs: ["get", "list", "watch"]    # 只能查不能改
\\\`\\\`\\\`

關鍵欄位：

| 欄位 | 說明 |
|------|------|
| \\\`apiGroups: [""]\\\` | 空字串代表 core API（Pod, Service, ConfigMap） |
| \\\`apiGroups: ["apps"]\\\` | apps 群組（Deployment, StatefulSet） |
| \\\`resources\\\` | 哪些資源（pods, services, deployments...） |
| \\\`verbs\\\` | 動作：get / list / watch / create / update / delete |

**沒寫 \\\`create / delete\\\`，這個 Role 就是只讀的**。

## 實作：從零做一個 viewer 帳號

完整 YAML（一份檔案搞定 SA + Role + Binding）：

\\\`\\\`\\\`yaml
# rbac-viewer.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: viewer-sa
  namespace: default
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: default
  name: pod-viewer
rules:
- apiGroups: [""]
  resources: ["pods", "pods/log"]
  verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: pod-viewer-binding
  namespace: default
subjects:
- kind: ServiceAccount
  name: viewer-sa
  namespace: default
roleRef:
  kind: Role
  name: pod-viewer
  apiGroup: rbac.authorization.k8s.io
\\\`\\\`\\\`

\\\`\\\`\\\`bash
kubectl apply -f rbac-viewer.yaml
\\\`\\\`\\\`

## 驗證：用 \\\`--as\\\` 模擬身份

\\\`--as\\\` 讓 kubectl **假裝**自己是某個 SA，不用真的去切 kubeconfig。

### 應該成功的：

\\\`\\\`\\\`bash
kubectl get pods --as=system:serviceaccount:default:viewer-sa
# 正常顯示 Pod 清單 ✅
\\\`\\\`\\\`

### 應該被擋的：

\\\`\\\`\\\`bash
kubectl run test --image=nginx \\\\
  --as=system:serviceaccount:default:viewer-sa
# Error from server (Forbidden): pods is forbidden:
# User "system:serviceaccount:default:viewer-sa" cannot create resource "pods"
\\\`\\\`\\\`

\\\`\\\`\\\`bash
kubectl delete deployment nginx \\\\
  --as=system:serviceaccount:default:viewer-sa
# Error: deployments.apps is forbidden ✅
\\\`\\\`\\\`

**這就是 RBAC 在保護你**——viewer-sa 只能查不能改，Role 沒寫的權限通通沒有。

## 更實用：給人用的 kubeconfig

上面只是用 \\\`--as\\\` 模擬。真實情境是給工程師一份 kubeconfig：

\\\`\\\`\\\`bash
# 為 viewer-sa 建立 token（K8s 1.24+）
TOKEN=$(kubectl create token viewer-sa)

# 從現有 kubeconfig 拿 cluster CA
CA=$(kubectl config view --raw -o jsonpath='{.clusters[0].cluster.certificate-authority-data}')
SERVER=$(kubectl config view --raw -o jsonpath='{.clusters[0].cluster.server}')

# 寫一份只讀的 kubeconfig
cat <<EOF > viewer.kubeconfig
apiVersion: v1
kind: Config
clusters:
- cluster:
    certificate-authority-data: $CA
    server: $SERVER
  name: local
contexts:
- context:
    cluster: local
    user: viewer-sa
  name: local
current-context: local
users:
- name: viewer-sa
  user:
    token: $TOKEN
EOF
\\\`\\\`\\\`

把 \\\`viewer.kubeconfig\\\` 給工程師，他用：

\\\`\\\`\\\`bash
KUBECONFIG=viewer.kubeconfig kubectl get pods    # OK
KUBECONFIG=viewer.kubeconfig kubectl delete pod  # Forbidden
\\\`\\\`\\\`

## 內建 ClusterRole 速查

K8s 已經幫你準備好幾個常用的 ClusterRole，**先用內建的，不要自己寫**：

| ClusterRole | 用途 |
|-------------|------|
| \\\`view\\\` | 唯讀（除了 Secret） |
| \\\`edit\\\` | 可改但不能管權限 |
| \\\`admin\\\` | Namespace 內全權 |
| \\\`cluster-admin\\\` | 上帝視角（很危險） |

例如要給某人「所有 Namespace 唯讀」：

\\\`\\\`\\\`bash
kubectl create clusterrolebinding alice-view \\\\
  --clusterrole=view \\\\
  --serviceaccount=default:alice-sa
\\\`\\\`\\\`

## 重點整理

- **RBAC = 誰 + 能做什麼 + 綁定起來**
- **Role / RoleBinding** 只在一個 Namespace；**ClusterRole / ClusterRoleBinding** 跨叢集
- **ServiceAccount = Pod 的身份**；每個 Namespace 都有 default
- **沒寫的權限就是沒有**——白名單機制
- **\\\`--as\\\` 模擬身份**最快驗證權限
- **內建 view / edit / admin / cluster-admin** 多數情況夠用

## 下一步

權限管好了——但 **K8s 預設 Pod 之間網路全通**。前端 Pod 可以直連資料庫 Pod、開發 namespace 可以打到生產 namespace。

下一篇：[NetworkPolicy — 讓 Pod 之間有防火牆](/blog/k8s/networkpolicy-intro)

> 📚 **完整系列總覽**：[K8s 系列教學首頁](/blog/#k8s)（共 40 課，按學習路徑順序排）
`,
  },
  {
    slug: 'networkpolicy-intro',
    order: 34,
    group: 'ops',
    title: 'NetworkPolicy 入門：K8s 預設叢集內全通，怎麼鎖網路？',
    excerpt:
      '預設情況下，K8s 任何 Pod 都能連任何 Pod。生產環境這樣等於沒防火牆。NetworkPolicy 是 K8s 內建的網路 ACL，用 label 控制「誰能連誰」。',
    publishDate: '2026-05-31',
    tags: ['Kubernetes', 'NetworkPolicy', '網路安全', 'ACL'],
    readingTime: 10,
    content: `
## K8s 預設網路全通 — 這是個 bug 不是 feature

你做完 RBAC，覺得自己很安全。直到某次 Pen Test 報告：

> 「滲透測試發現，從 \\\`marketing\\\` namespace 的容器可直接連到 \\\`prod\\\` 的 MySQL Pod。」

你打開查看：

\\\`\\\`\\\`bash
# 在 marketing namespace 隨便找個 Pod
kubectl exec -it any-pod -n marketing -- sh

# 直接連得到 prod 的 MySQL！
> mysql -h mysql.prod.svc.cluster.local -uroot -p
\\\`\\\`\\\`

**原因：K8s 預設所有 Pod 之間網路全通**。這是 K8s 設計上的選擇——簡化網路。但對生產環境，這是個災難。

**解法：NetworkPolicy（Pod 等級的防火牆）**。

## NetworkPolicy 的邏輯

\\\`\\\`\\\`yaml
spec:
  podSelector:        # 這條規則套用在「誰」身上
    matchLabels: {role: db}
  policyTypes:
    - Ingress         # 管進來的流量
    - Egress          # 管出去的流量
  ingress:            # 允許進來的清單
    - from: [...]
      ports: [...]
  egress:             # 允許出去的清單
    - to: [...]
      ports: [...]
\\\`\\\`\\\`

**關鍵法則**：

> **只要對某個 Pod 套用了 NetworkPolicy，所有沒明確允許的流量都會被拒絕**——白名單機制。

## 名詞警告：跟 Ingress Controller 不一樣

NetworkPolicy 的 \\\`ingress\\\` 跟第六堂的 \\\`Ingress Controller\\\` **完全不同**！

| | NetworkPolicy ingress | Ingress Controller |
|---|------|------|
| 層級 | L3/L4（IP/Port） | L7（HTTP） |
| 管什麼 | Pod 之間的網路 | 從外面來的 HTTP 請求 |

名字一樣，意思不同——別混淆。

## 實作：「只有 API 能連 DB」

最常見的需求：API Pod 可連 DB，但前端 Pod 不能直連。

\\\`\\\`\\\`yaml
# networkpolicy-db.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: db-allow-api
  namespace: default
spec:
  podSelector:
    matchLabels:
      role: database         # 套用在 DB Pod 上
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          role: api          # 只允許帶 role=api 的 Pod
    ports:
    - protocol: TCP
      port: 3306
\\\`\\\`\\\`

意思是：

> 我（DB Pod）**只接受**帶 \\\`role=api\\\` 的 Pod 連到 TCP 3306。其他通通擋。

## 驗證流程

\\\`\\\`\\\`bash
kubectl apply -f networkpolicy-db.yaml

# 1. 從 API Pod 連 DB → 應該成功
kubectl exec -it api-xxx -- nc -zv db-svc 3306
# Connection to db-svc 3306 port [tcp/*] succeeded! ✅

# 2. 從前端 Pod 連 DB → 應該失敗
kubectl exec -it frontend-xxx -- nc -zv db-svc 3306
# (timeout 卡住... 表示被擋了) ✅
\\\`\\\`\\\`

## 三層架構的標準寫法

生產環境最常見的需求：

\`\`\`
[Ingress] → [Frontend] → [API] → [DB]
\`\`\`

對應的 NetworkPolicy：

| 層 | 規則 |
|------|------|
| Frontend | 只接受來自 Ingress Controller |
| API | 只接受來自 Frontend |
| DB | 只接受來自 API（port 3306） |

寫成 3 個 NetworkPolicy，**每層只開上一層**。實習生在 marketing namespace 想連 prod 的 DB？通通擋。

## 常見搭配：先擋全部，再開特定

進階做法是先 \\\`default deny all\\\`：

\\\`\\\`\\\`yaml
# 先擋掉這個 namespace 所有 ingress
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
  namespace: prod
spec:
  podSelector: {}        # 空的 = 全部 Pod
  policyTypes:
  - Ingress
\\\`\\\`\\\`

接著再用獨立的 NetworkPolicy 一個一個放行——**白名單最安全**。

## 跨 namespace 的 NetworkPolicy

要允許 \\\`monitoring\\\` namespace 的 Prometheus 抓 metrics：

\\\`\\\`\\\`yaml
ingress:
- from:
  - namespaceSelector:
      matchLabels:
        kubernetes.io/metadata.name: monitoring
    podSelector:
      matchLabels:
        app: prometheus
  ports:
  - protocol: TCP
    port: 9090
\\\`\\\`\\\`

**\\\`namespaceSelector\\\` + \\\`podSelector\\\` 並用**，限定「monitoring 命名空間裡，只有 Prometheus 那組 Pod」可進。

## 注意：NetworkPolicy 需要 CNI 支援

NetworkPolicy 是 **規範**，但實際執行靠 CNI 外掛：

| CNI | 支援 NetworkPolicy |
|-----|------|
| **Calico** | ✅ |
| **Cilium** | ✅（甚至支援 L7） |
| **k3s 預設** | ✅（內建 network policy controller） |
| **Flannel（純）** | ❌ |
| **AWS VPC CNI（基本版）** | ❌（要加 Calico） |

**寫了 NetworkPolicy 但沒擋住？**先確認你的 CNI 支援。

## 重點整理

- **K8s 預設全通**——這是設計而不是 bug，但生產環境必須補
- **NetworkPolicy = Pod 等級防火牆**，白名單機制
- **podSelector + policyTypes + ingress/egress** 三段式
- **名字陷阱**：NetworkPolicy 的 ingress ≠ Ingress Controller
- **CNI 必須支援**——k3s / Calico / Cilium 都行
- **實務做法**：先 default-deny-all，再獨立放行

## 下一步

到目前為止，你學了 K8s 八大概念加上生產維運的 5 個技巧。但是**全部串起來呢？**

下一篇開始 2 篇實戰：[從零部署一套完整服務（上）— 12 步流程的前 6 步](/blog/k8s/deploy-from-zero-12-steps-upper)

> 📚 **完整系列總覽**：[K8s 系列教學首頁](/blog/#k8s)（共 40 課，按學習路徑順序排）
`,
  },
  {
    slug: 'deploy-from-zero-12-steps-upper',
    order: 35,
    group: 'ops',
    title: '從零部署完整系統（上）：12 步驟把網站搬上 K8s（前 6 步）',
    excerpt:
      '空叢集到一個能跑的網站要做哪些事？這篇給你 12 步驟 SOP 的前 6 步：規劃命名空間 → 寫 Deployment → 開 Service → 設 Ingress → 注入 ConfigMap → 處理 Secret。',
    publishDate: '2026-06-01',
    tags: ['Kubernetes', '從零部署', '完整系統', 'SOP'],
    readingTime: 14,
    content: `
## 學完八大概念，但要怎麼串起來？

到目前為止，你學了：

- Pod / Deployment / Service / Ingress
- ConfigMap / Secret / PV/PVC / StatefulSet / Helm
- Probe / Resource limits / HPA / RBAC / NetworkPolicy

每個都會用，**但實戰一個完整網站要怎麼做？**

這 2 篇用 **12 個步驟**從**空 Namespace** 開始，部署一套真正可上線的應用。

## 目標架構

\`\`\`
使用者 → Ingress（myapp.local）
          ├── /     → frontend-svc → frontend Pod x2
          └── /api  → api-svc → api Pod x3（HPA）
                                    ↓
                           mysql-headless → mysql Pod x1
                                            （StatefulSet + PVC）

NetworkPolicy：前端 → API → DB，逐層隔離
所有 Pod：Probe + Resource limits
\`\`\`

## 12 步部署總覽

| 步驟 | 做什麼 | 對應第幾堂 |
|:---:|--------|:---:|
| 1 | 建 Namespace | 第 5 |
| 2 | 建 Secret（DB 密碼） | 第 6 |
| 3 | 建 ConfigMap（API 設定） | 第 6 |
| 4 | 部署 MySQL（StatefulSet + PVC） | 第 6 |
| 5 | 部署 API（Deployment + Probe + Resource） | 第 5+7 |
| 6 | 部署前端 | 第 5 |
| 7 | 建 Service | 第 5 |
| 8 | 建 Ingress | 第 6 |
| 9 | 設 NetworkPolicy | 第 7 |
| 10 | 設 HPA | 第 7 |
| 11 | 完整驗證 | 全部 |
| 12 | 壓測 HPA | 第 7 |

**這篇做前 6 步**，下一篇做後 6 步。

---

## Step 1：建 Namespace — 邏輯隔離

\\\`\\\`\\\`yaml
# namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: prod
\\\`\\\`\\\`

\\\`\\\`\\\`bash
kubectl apply -f namespace.yaml
kubectl get ns prod
# NAME   STATUS   AGE
# prod   Active   3s
\\\`\\\`\\\`

**之後所有資源都加 \\\`-n prod\\\`**——避免跟 default namespace 混。

---

## Step 2：建 Secret — DB 密碼

\\\`\\\`\\\`yaml
# secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: mysql-secret
  namespace: prod
type: Opaque
stringData:
  MYSQL_ROOT_PASSWORD: "rootpw"
  MYSQL_PASSWORD: "apppw"
  MYSQL_DATABASE: "appdb"
  MYSQL_USER: "appuser"
\\\`\\\`\\\`

\\\`\\\`\\\`bash
kubectl apply -f secret.yaml
kubectl get secret -n prod
\\\`\\\`\\\`

**注意**：這裡用 \\\`stringData\\\`，K8s 會自動幫你 Base64。生產環境應該改用 **Sealed Secrets** 或 **External Secrets Operator** 加密。

---

## Step 3：建 ConfigMap — 應用設定

\\\`\\\`\\\`yaml
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: api-config
  namespace: prod
data:
  LOG_LEVEL: "info"
  MAX_CONN: "100"
  DB_HOST: "mysql-headless"
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: frontend-nginx-config
  namespace: prod
data:
  default.conf: |
    server {
      listen 80;
      location / {
        root /usr/share/nginx/html;
      }
      location /api/ {
        proxy_pass http://api-svc/;
      }
    }
\\\`\\\`\\\`

\\\`\\\`\\\`bash
kubectl apply -f configmap.yaml
kubectl get cm -n prod
# api-config, frontend-nginx-config
\\\`\\\`\\\`

**前端 nginx 用 ConfigMap 掛載設定檔**——這是反向代理 \\\`/api/\\\` 到 API 的關鍵。

---

## Step 4：部署 MySQL — StatefulSet + PVC

\\\`\\\`\\\`yaml
# mysql-statefulset.yaml
apiVersion: v1
kind: Service
metadata:
  name: mysql-headless
  namespace: prod
spec:
  clusterIP: None       # Headless！
  selector:
    app: mysql
  ports:
  - port: 3306
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mysql
  namespace: prod
spec:
  serviceName: mysql-headless
  replicas: 1
  selector:
    matchLabels:
      app: mysql
  template:
    metadata:
      labels:
        app: mysql
    spec:
      containers:
      - name: mysql
        image: mysql:8.0
        envFrom:
        - secretRef:
            name: mysql-secret
        ports:
        - containerPort: 3306
        volumeMounts:
        - name: mysql-data
          mountPath: /var/lib/mysql
  volumeClaimTemplates:
  - metadata:
      name: mysql-data
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 1Gi
\\\`\\\`\\\`

\\\`\\\`\\\`bash
kubectl apply -f mysql-statefulset.yaml
kubectl get pods -n prod -w
# mysql-0   0/1   Pending
# mysql-0   0/1   ContainerCreating
# mysql-0   1/1   Running        ← 等到這個

kubectl get pvc -n prod
# mysql-data-mysql-0   Bound   pvc-xxx   1Gi
\\\`\\\`\\\`

**這一步串了 5 個概念**：StatefulSet + PVC + Headless Service + Secret + ConfigMap。

---

## Step 5：部署 API — 帶 Probe + Resource

\\\`\\\`\\\`yaml
# api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  namespace: prod
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
      - name: api
        image: my-api:1.0
        envFrom:
        - configMapRef:
            name: api-config
        - secretRef:
            name: mysql-secret
        ports:
        - containerPort: 8080
        resources:
          requests:
            cpu: "100m"
            memory: "128Mi"
          limits:
            cpu: "500m"
            memory: "256Mi"
        startupProbe:
          httpGet:
            path: /healthz
            port: 8080
          failureThreshold: 30
          periodSeconds: 10
        livenessProbe:
          httpGet:
            path: /healthz
            port: 8080
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          periodSeconds: 5
\\\`\\\`\\\`

\\\`\\\`\\\`bash
kubectl apply -f api-deployment.yaml
kubectl get pods -n prod -l app=api
# api-xxx-1   1/1   Running
# api-xxx-2   1/1   Running
# api-xxx-3   1/1   Running
\\\`\\\`\\\`

**單一 YAML 用了 5 個概念**：Deployment + ConfigMap + Secret + Probe + Resource。

---

## Step 6：部署前端 — 透過 ConfigMap 掛 nginx 設定

\\\`\\\`\\\`yaml
# frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: prod
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: nginx
        image: nginx:1.25
        ports:
        - containerPort: 80
        volumeMounts:
        - name: nginx-config
          mountPath: /etc/nginx/conf.d/default.conf
          subPath: default.conf
        resources:
          requests:
            cpu: "50m"
            memory: "64Mi"
          limits:
            cpu: "200m"
            memory: "128Mi"
      volumes:
      - name: nginx-config
        configMap:
          name: frontend-nginx-config
\\\`\\\`\\\`

\\\`\\\`\\\`bash
kubectl apply -f frontend-deployment.yaml
kubectl get pods -n prod -l app=frontend
# frontend-xxx-1   1/1   Running
# frontend-xxx-2   1/1   Running
\\\`\\\`\\\`

**重點：\\\`subPath\\\` 只掛單一檔案**——ConfigMap 預設掛整個目錄會把 \\\`/etc/nginx/conf.d/\\\` 蓋掉。

---

## 重點整理

- **12 步驟 SOP**：從 Namespace 開始、一層層加上去
- **Step 1-3 是準備**：邊界（Namespace）、機密（Secret）、設定（ConfigMap）
- **Step 4 最關鍵**：StatefulSet + PVC + Headless + Secret 一次串 5 個概念
- **Step 5 API 是濃縮版**：Deployment + Probe + Resource + ConfigMap + Secret
- **Step 6 前端配 nginx + ConfigMap subPath** 注意陷阱

## 下一步

到這裡，6 個 Pod 都跑起來了——但**還沒 Service、沒 Ingress、沒 HPA、沒安全設定**，外面還連不到。

下一篇：[從零部署完整系統（下）— 後 6 步：Service + Ingress + NetworkPolicy + HPA](/blog/k8s/deploy-from-zero-12-steps-lower)

> 📚 **完整系列總覽**：[K8s 系列教學首頁](/blog/#k8s)（共 40 課，按學習路徑順序排）
`,
  },
  {
    slug: 'deploy-from-zero-12-steps-lower',
    order: 36,
    group: 'ops',
    title: '從零部署完整系統（下）：12 步驟（後 6 步）+ 驗證',
    excerpt:
      '接續上篇 6 步，這篇做後 6 步：PV/PVC → StatefulSet DB → HPA → Probe → RBAC → NetworkPolicy。完整一套生產級部署。',
    publishDate: '2026-06-02',
    tags: ['Kubernetes', '從零部署', 'StatefulSet', 'HPA', 'Probe'],
    readingTime: 14,
    content: `
## 接續上篇：6 個 Pod 都跑起來了，但...

[上篇](/blog/k8s/deploy-from-zero-12-steps-upper) 完成了：

- ✅ Namespace / Secret / ConfigMap
- ✅ MySQL StatefulSet（1 個 Pod）
- ✅ API Deployment（3 個 Pod）
- ✅ 前端 Deployment（2 個 Pod）

但 Pod 跑起來不代表能用——**外面還連不到、內部還沒受保護、流量爆炸還不會自動擴**。

繼續：Step 7 → Step 12。

---

## Step 7：建 Service — Pod 之間怎麼找

\\\`\\\`\\\`yaml
# services.yaml
apiVersion: v1
kind: Service
metadata:
  name: api-svc
  namespace: prod
spec:
  selector:
    app: api
  ports:
  - port: 80
    targetPort: 8080
---
apiVersion: v1
kind: Service
metadata:
  name: frontend-svc
  namespace: prod
spec:
  selector:
    app: frontend
  ports:
  - port: 80
    targetPort: 80
\\\`\\\`\\\`

\\\`\\\`\\\`bash
kubectl apply -f services.yaml
kubectl get svc -n prod
# api-svc          ClusterIP   10.43.x.x   80/TCP
# frontend-svc     ClusterIP   10.43.x.x   80/TCP
# mysql-headless   ClusterIP   None        3306/TCP
\\\`\\\`\\\`

**3 個 Service 各司其職**：
- \\\`api-svc\\\`、\\\`frontend-svc\\\` 走負載均衡
- \\\`mysql-headless\\\` 是 Headless（StatefulSet 用）

---

## Step 8：建 Ingress — 對外入口

\\\`\\\`\\\`yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: myapp-ingress
  namespace: prod
spec:
  rules:
  - host: myapp.local
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: api-svc
            port:
              number: 80
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-svc
            port:
              number: 80
\\\`\\\`\\\`

\\\`\\\`\\\`bash
kubectl apply -f ingress.yaml
kubectl get ingress -n prod
\\\`\\\`\\\`

加一筆 \\\`/etc/hosts\\\`：

\\\`\\\`\\\`
127.0.0.1   myapp.local
\\\`\\\`\\\`

到這裡，**功能上已經完整了**——使用者可以透過 \\\`http://myapp.local\\\` 進來。但安全沒做。

---

## Step 9：設 NetworkPolicy — 三層隔離

\\\`\\\`\\\`yaml
# networkpolicy.yaml
# 規則 1：DB 只接受 API
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: db-policy
  namespace: prod
spec:
  podSelector:
    matchLabels:
      app: mysql
  policyTypes: [Ingress]
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: api
    ports:
    - protocol: TCP
      port: 3306
---
# 規則 2：API 只接受前端 + Ingress Controller
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-policy
  namespace: prod
spec:
  podSelector:
    matchLabels:
      app: api
  policyTypes: [Ingress]
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: ingress-nginx
    ports:
    - protocol: TCP
      port: 8080
---
# 規則 3：前端只接受 Ingress Controller
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: frontend-policy
  namespace: prod
spec:
  podSelector:
    matchLabels:
      app: frontend
  policyTypes: [Ingress]
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: ingress-nginx
\\\`\\\`\\\`

\\\`\\\`\\\`bash
kubectl apply -f networkpolicy.yaml
kubectl get networkpolicy -n prod
# db-policy, api-policy, frontend-policy
\\\`\\\`\\\`

**三層隔離**：實習生在 \\\`marketing\\\` namespace 想連 \\\`prod\\\` 的 DB？通通擋。

---

## Step 10：設 HPA — 自動擴縮

\\\`\\\`\\\`yaml
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-hpa
  namespace: prod
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
\\\`\\\`\\\`

\\\`\\\`\\\`bash
kubectl apply -f hpa.yaml
kubectl get hpa -n prod
# api-hpa   Deployment/api   0%/70%   3   10   3
\\\`\\\`\\\`

---

## Step 11：完整驗證 — 一覽你做了什麼

\\\`\\\`\\\`bash
kubectl get all -n prod
\\\`\\\`\\\`

你會看到一大堆東西：

\\\`\\\`\\\`
NAME                            READY   STATUS    RESTARTS
pod/api-xxx-1                   1/1     Running   0
pod/api-xxx-2                   1/1     Running   0
pod/api-xxx-3                   1/1     Running   0
pod/frontend-xxx-1              1/1     Running   0
pod/frontend-xxx-2              1/1     Running   0
pod/mysql-0                     1/1     Running   0

NAME                       TYPE        CLUSTER-IP
service/api-svc            ClusterIP   10.43.x.x
service/frontend-svc       ClusterIP   10.43.x.x
service/mysql-headless     ClusterIP   None

NAME                            READY
deployment.apps/api             3/3
deployment.apps/frontend        2/2

statefulset.apps/mysql          1/1

horizontalpodautoscaler.autoscaling/api-hpa   Deployment/api   0%/70%   3 10 3
\\\`\\\`\\\`

再看其他資源：

\\\`\\\`\\\`bash
kubectl get pvc,ingress,networkpolicy -n prod
# pvc/mysql-data-mysql-0   Bound   1Gi
# ingress/myapp-ingress    myapp.local
# networkpolicy/db-policy
# networkpolicy/api-policy
# networkpolicy/frontend-policy
\\\`\\\`\\\`

---

## Step 12：壓測 HPA — 驗證自動擴容

\\\`\\\`\\\`bash
# 終端 1：監控 HPA
kubectl get hpa -n prod -w

# 終端 2：壓測
kubectl run load-test --image=busybox:1.36 -n prod \\\\
  --rm -it --restart=Never -- \\\\
  sh -c "while true; do wget -qO- http://api-svc > /dev/null 2>&1; done"
\\\`\\\`\\\`

終端 1 你會看到 Pod 自動長：

\\\`\\\`\\\`
api-hpa   125%/70%   3
api-hpa   125%/70%   5
api-hpa   85%/70%    7
api-hpa   65%/70%    7   ← 平衡
\\\`\\\`\\\`

按 Ctrl+C 停壓測，等 5 分鐘 Pod 自動縮回 3 個。

**這就是生產就緒的完整樣貌**——自動擴、自動縮、不用手動。

---

## 跟 Helm 比起來呢？

如果用 Helm 做這件事，可能就是：

\\\`\\\`\\\`bash
helm install my-app ./my-chart -f prod-values.yaml
\\\`\\\`\\\`

**一行**。但前提是有人要先寫好 Chart——而那個寫 Chart 的人，**就是你剛才做這 12 步的功夫**。

| | 手寫 12 步 YAML | Helm Chart |
|---|------|------|
| 第一次部署 | 慢，要寫超多 | 快，一行 |
| 多環境部署 | 改 12 個 YAML | 換 values.yaml |
| 升級回滾 | 自己手動 | \\\`helm rollback\\\` |
| 學習曲線 | 高，每個概念都要懂 | 低，會 install / upgrade |
| 除錯 | 直觀，YAML 看得到 | 模板層多，要 \\\`helm template\\\` |

**先學手寫，再用 Helm**。沒打過底，Helm 出事就只能擺爛。

---

## 清理

\\\`\\\`\\\`bash
kubectl delete namespace prod
\\\`\\\`\\\`

**一行刪光**——這就是 Namespace 的好處。

## 重點整理

- **Step 7-8 開外部入口**：Service + Ingress
- **Step 9 三層 NetworkPolicy**：前端 → API → DB 逐層擋
- **Step 10 HPA**：CPU > 70% 自動擴到 10 個 Pod
- **Step 11 \\\`kubectl get all\\\`** 一覽全貌
- **Step 12 壓測**：實際看 HPA 動起來
- 學完手寫 12 步，**再用 Helm 才有底氣**

## 下一步

12 步部署完成了——但**真實的生產環境會出意外**。

- HPA 真的會擴嗎？
- 殺掉一個 Pod 真的會自動補嗎？
- 流量翻 10 倍時，DB 連線池會不會爆？

下一篇：[壓測 + 故障模擬 — 你的系統真的撐得住嗎？](/blog/k8s/deploy-loadtest-failure-sim)

> 📚 **完整系列總覽**：[K8s 系列教學首頁](/blog/#k8s)（共 40 課，按學習路徑順序排）
`,
  },
  {
    slug: 'deploy-loadtest-failure-sim',
    order: 37,
    group: 'ops',
    title: '部署完還沒結束：壓測 + 故障模擬，你的系統真的撐得住嗎？',
    excerpt:
      '部署上線只是開始。用 hey 壓測看 HPA 真的會擴容嗎？故意 kubectl delete pod 看 Deployment 真的會自動補嗎？這篇教你怎麼驗證系統可靠性。',
    publishDate: '2026-06-03',
    tags: ['Kubernetes', '壓測', '故障模擬', 'chaos engineering'],
    readingTime: 11,
    content: `
## 部署成功 ≠ 上線就 OK

[上一篇](/blog/k8s/deploy-from-zero-12-steps-lower)做完 12 步部署，所有 Pod 都 \\\`Running\\\`，Ingress 也通了。可以下班了嗎？

**不行**。Running 不代表撐得住流量。生產上線前你還要回答 3 個問題：

1. **HPA 真的會擴嗎？** — 流量翻 10 倍時自動長 Pod 嗎？
2. **Pod 死了真的會補嗎？** — 突然當機，多久恢復？
3. **DB 連線會不會爆？** — 連線池滿了 API 會怎樣？

回答這 3 題的方法叫做 **混沌工程（Chaos Engineering）**——主動製造故障，看系統怎麼反應。

## 場景設定：短網址服務

我們用一個簡單的短網址 API 為例：

\\\`\\\`\\\`
POST /shorten   { url } → { short_id }
GET  /:short_id → 302 redirect
\\\`\\\`\\\`

部署 4 個 Pod，配 HPA 1 → 10 個。

## 試煉 1：壓力測試

### 工具選擇

| 工具 | 適合 |
|------|------|
| **hey** | 簡單、輕量，3 秒上手 |
| **k6** | 進階腳本、有報告 |
| **Apache Bench (ab)** | 老牌，功能基本 |
| **wrk** | 純 C，性能極佳 |

我們用 **hey**：

\\\`\\\`\\\`bash
# Mac
brew install hey

# Linux
go install github.com/rakyll/hey@latest
\\\`\\\`\\\`

### 第一輪：基準（2 並發）

\\\`\\\`\\\`bash
hey -z 30s -c 2 http://myapp.local/api/healthz
\\\`\\\`\\\`

\\\`\\\`\\\`
Summary:
  Total:        30.00 s
  Requests:     1500
  Average RPS:  50
  Latency:      40ms (p99: 120ms)
  Status 200:   1500 (100%)
\\\`\\\`\\\`

✅ 基準正常。

### 第二輪：加壓（50 並發）

\\\`\\\`\\\`bash
# 終端 1：監控 HPA
kubectl get hpa -n prod -w

# 終端 2：壓測
hey -z 60s -c 50 http://myapp.local/api/health
\\\`\\\`\\\`

終端 1 該看到：

\\\`\\\`\\\`
api-hpa   125%/70%   3
api-hpa   125%/70%   5
api-hpa   90%/70%    7
api-hpa   65%/70%    7   ← HPA 工作中
\\\`\\\`\\\`

如果 Pod 沒擴：
- 確認 \\\`metrics-server\\\` 跑起來
- 確認 Deployment 有設 \\\`resources.requests\\\`
- 看 \\\`kubectl describe hpa api-hpa\\\` 的 events

### 第三輪：極限（500 並發）

\\\`\\\`\\\`bash
hey -z 60s -c 500 http://myapp.local/api/health
\\\`\\\`\\\`

這時候你應該開始看到：

\\\`\\\`\\\`
Status 200:    8000 (95%)
Status 503:    420  (5%)    ← 開始有失敗
Latency p99:   3500ms       ← 慢得很
\\\`\\\`\\\`

**這就是極限**。記下這個數字——它是你「該再加 maxReplicas」或「該優化 DB 連線池」的訊號。

## 試煉 2：故障模擬

### Test 1：殺 Pod

\\\`\\\`\\\`bash
# 邊壓測邊殺 Pod
kubectl delete pod -n prod -l app=api --field-selector=status.phase=Running --wait=false &

# 看 Deployment 的反應
kubectl get pods -n prod -l app=api -w
\\\`\\\`\\\`

**預期結果**：

- 舊 Pod 進入 \\\`Terminating\\\`
- 新 Pod 立刻被建立
- **Service 會自動把流量導到健康的 Pod**——但前提是 readinessProbe 設好了

如果壓測指標看到 503 飆升、然後迅速恢復——這就是 **K8s 自我修復** 在工作。

### Test 2：Cordon Node（模擬 Node 掛掉）

\\\`\\\`\\\`bash
# 看 Pod 在哪個 Node
kubectl get pods -n prod -o wide

# 把某個 Node 標記為「不要再排 Pod 上來」
kubectl cordon worker-1

# 把上面的 Pod 趕走（drain）
kubectl drain worker-1 --ignore-daemonsets --delete-emptydir-data
\\\`\\\`\\\`

**預期結果**：

- worker-1 上的 Pod 全部被驅逐
- K8s 自動在其他 Node 重新排 Pod
- 服務應該還是可用（因為 replicas ≥ 2）

完成後復原：

\\\`\\\`\\\`bash
kubectl uncordon worker-1
\\\`\\\`\\\`

### Test 3：DB 連線池爆掉

短網址服務最容易出事的是 DB 連線。模擬：

\\\`\\\`\\\`bash
# 故意把 DB 限制到 5 個連線
kubectl exec -it mysql-0 -n prod -- \\\\
  mysql -uroot -p -e "SET GLOBAL max_connections = 5;"

# 然後狂壓 API
hey -z 30s -c 100 http://myapp.local/api/shorten -m POST -d '{"url":"https://x"}'
\\\`\\\`\\\`

**這時候你會看到**：

- API Pod 卡住，等 DB 連線
- readiness 失敗，Pod 從 Service 摘下
- 流量全集中在剩下的 Pod
- 連鎖反應，**整個 API 雪崩**

**修法**：
- DB 設合理的 max_connections
- API 程式設 connection timeout
- 加上 connection pool（HikariCP / pgbouncer）

## 試煉 3：邊界數值

| 測試項 | 怎麼做 | 看什麼 |
|--------|-------|--------|
| **OOMKilled** | 壓到 Pod 記憶體爆 | RESTARTS 次數變化 |
| **Probe 設太嚴** | 把 liveness 設成 1 秒 fail | 整片 Pod 一直重啟 |
| **HPA maxReplicas 不夠** | 流量是 maxReplicas 的 2 倍 | 看 Pod 是否打滿後失敗 |
| **PVC 滿了** | 寫入超過 PVC 容量 | DB Pod 進入 CrashLoop |

## 為什麼要刻意搞壞？

> 「不要等到生產環境出事，才知道哪裡會壞。」

—— **Netflix Chaos Monkey**（始祖級混沌工程工具）

主動製造故障的好處：

- ✅ 用心理準備好的時候出事，比凌晨 3 點被叫醒好
- ✅ 驗證 Probe / HPA / Replicas 真的有用
- ✅ 找到「Resource limits 設多少才夠」的真實數字
- ✅ 練習團隊面對故障的反應流程

## 進階工具

| 工具 | 用途 |
|------|------|
| **Chaos Mesh** | K8s 原生混沌工程平台 |
| **Litmus** | 預設模板豐富 |
| **kube-monkey** | Netflix Chaos Monkey 的 K8s 版 |
| **k6** | 帶 chaos 模式的壓測 |

進階：把混沌測試**自動化**，每次部署上線前自動跑一輪。

## 重點整理

- **Running ≠ 撐得住**：上線前要壓測 + 故障演練
- **3 輪壓測**：基準 → 加壓 → 極限，找瓶頸
- **3 種故障**：殺 Pod、cordon Node、DB 爆連線
- **Chaos Engineering 的精神**：主動找弱點、不被動等出事
- 進階：用 **Chaos Mesh / Litmus** 做自動化混沌測試

## 下一步

到這裡，你已經會做完整的生產級部署、會壓測、會故障演練——**這就是「生產就緒」的標準了**。

接下來是 Group 6 的速查表，這 3 篇是隨手查的工具：[kubectl 速查表](/blog/k8s/kubectl-cheatsheet) → [YAML 範本速查表](/blog/k8s/k8s-yaml-cheatsheet) → [學習 Roadmap](/blog/k8s/k8s-learning-roadmap)

> 📚 **完整系列總覽**：[K8s 系列教學首頁](/blog/#k8s)（共 40 課，按學習路徑順序排）
`,
  },

  // ====== Bonus：長尾關鍵字 ======
  {
    slug: 'kubectl-cheatsheet',
    order: 38,
    group: 'ops',
    title: 'kubectl 指令大全：50 個必背指令分類整理',
    excerpt:
      '官方 cheat sheet 太雜，這篇按「查狀態 / 改設定 / 排錯 / 進階」四類整理 50 個最常用指令，新手到熟手都能直接抄。',
    publishDate: '2026-06-04',
    tags: ['kubectl', 'cheatsheet', '指令大全', 'Kubernetes'],
    readingTime: 8,
    content: `
## 為什麼還需要一份 cheatsheet？

官方的 kubectl cheat sheet 太雜——300 多個指令塞在同一頁，找不到重點。

實際上你 80% 時間只用其中 **不到 50 個指令**。這篇把它們**分四類**整理，讓你查得到、抄得快。

> 看完本系列前 37 篇，這份就是你工作中可以直接 Copy 的速查筆記。

---

## A. 查狀態（最常用）

### 看清單

\\\`\\\`\\\`bash
kubectl get pods                          # 預設 namespace
kubectl get pods -A                       # 所有 namespace
kubectl get pods -n prod                  # 指定 namespace
kubectl get pods -o wide                  # 含 IP / Node
kubectl get pods --show-labels            # 含 label
kubectl get pods -l app=api               # 用 label 篩
kubectl get pods --field-selector status.phase=Running
kubectl get all -n prod                   # 一眼看所有資源
\\\`\\\`\\\`

### 看詳情

\\\`\\\`\\\`bash
kubectl describe pod my-pod               # 包含 events，超好用
kubectl describe deployment my-app
kubectl describe node worker-1            # 看 Node 資源
\\\`\\\`\\\`

### 看 logs

\\\`\\\`\\\`bash
kubectl logs my-pod                       # 單一 Pod
kubectl logs my-pod -c container-name     # 多容器 Pod
kubectl logs -f my-pod                    # tail -f
kubectl logs my-pod --previous            # 看上次崩潰前的 log
kubectl logs -l app=api --tail=100        # 用 label 抓多 Pod logs
kubectl logs my-pod --since=10m           # 最近 10 分鐘
\\\`\\\`\\\`

### 看資源用量

\\\`\\\`\\\`bash
kubectl top nodes
kubectl top pods
kubectl top pods -n prod --containers
\\\`\\\`\\\`

---

## B. 改設定

### 套用 / 刪除

\\\`\\\`\\\`bash
kubectl apply -f deployment.yaml          # 建立或更新
kubectl apply -f ./manifests/             # 整個目錄
kubectl apply -k ./overlays/prod          # kustomize
kubectl delete -f deployment.yaml
kubectl delete pod my-pod
kubectl delete namespace prod             # 一行清光所有資源
\\\`\\\`\\\`

### 直接改

\\\`\\\`\\\`bash
kubectl edit deployment my-app            # 開編輯器即時改
kubectl scale deployment my-app --replicas=5
kubectl set image deployment/my-app api=my-api:2.0
kubectl rollout restart deployment my-app
\\\`\\\`\\\`

### 部署滾動

\\\`\\\`\\\`bash
kubectl rollout status deployment/my-app
kubectl rollout history deployment/my-app
kubectl rollout undo deployment/my-app             # 回上一版
kubectl rollout undo deployment/my-app --to-revision=2
kubectl rollout pause deployment/my-app
kubectl rollout resume deployment/my-app
\\\`\\\`\\\`

---

## C. 排錯

### 進入 Pod

\\\`\\\`\\\`bash
kubectl exec -it my-pod -- sh
kubectl exec -it my-pod -c sidecar -- bash
kubectl exec my-pod -- env                # 跑單一指令
\\\`\\\`\\\`

### 本機連 Pod

\\\`\\\`\\\`bash
kubectl port-forward pod/my-pod 8080:80
kubectl port-forward svc/my-svc 8080:80
kubectl port-forward deployment/my-app 8080:80
\\\`\\\`\\\`

### 檔案進出

\\\`\\\`\\\`bash
kubectl cp my-pod:/etc/hosts ./hosts                   # Pod → 本機
kubectl cp ./config.yaml my-pod:/app/config.yaml       # 本機 → Pod
\\\`\\\`\\\`

### 進階除錯

\\\`\\\`\\\`bash
kubectl debug my-pod -it --image=busybox          # 在 Pod 旁邊開 debug 容器
kubectl debug node/worker-1 -it --image=busybox   # 進 Node debug
\\\`\\\`\\\`

---

## D. 進階技巧

### Dry-run / Diff

\\\`\\\`\\\`bash
kubectl apply -f x.yaml --dry-run=client          # 不真的執行，只看會做什麼
kubectl apply -f x.yaml --dry-run=server          # 連 API server 驗證
kubectl diff -f x.yaml                            # 跟現狀差異
\\\`\\\`\\\`

### 快速產 YAML

\\\`\\\`\\\`bash
# 產 Pod YAML 不真的建立
kubectl run nginx --image=nginx --dry-run=client -o yaml > pod.yaml

# 產 Deployment YAML
kubectl create deployment my-app --image=nginx --dry-run=client -o yaml > deploy.yaml

# 產 Service YAML
kubectl expose deployment my-app --port=80 --dry-run=client -o yaml
\\\`\\\`\\\`

### Context / Namespace 切換

\\\`\\\`\\\`bash
kubectl config get-contexts
kubectl config current-context
kubectl config use-context my-cluster
kubectl config set-context --current --namespace=prod   # 切預設 namespace
\\\`\\\`\\\`

### 模擬身份（RBAC 除錯）

\\\`\\\`\\\`bash
kubectl auth can-i create deployments              # 我能建 Deployment 嗎
kubectl auth can-i delete pods --as=alice          # alice 能刪 Pod 嗎
kubectl get pods --as=system:serviceaccount:default:viewer-sa
\\\`\\\`\\\`

### JSON 路徑取值

\\\`\\\`\\\`bash
# 取第一個 Pod 的名字
kubectl get pods -o jsonpath='{.items[0].metadata.name}'

# 取所有 Pod 的 IP
kubectl get pods -o jsonpath='{.items[*].status.podIP}'

# Service 的 ClusterIP
kubectl get svc my-svc -o jsonpath='{.spec.clusterIP}'
\\\`\\\`\\\`

### Watch 模式

\\\`\\\`\\\`bash
kubectl get pods -w
kubectl get hpa -w
kubectl rollout status deployment/my-app -w
\\\`\\\`\\\`

---

## 常用別名（建議加進 .zshrc）

\\\`\\\`\\\`bash
alias k='kubectl'
alias kg='kubectl get'
alias kd='kubectl describe'
alias kl='kubectl logs -f'
alias ke='kubectl exec -it'
alias kctx='kubectl config use-context'
alias kns='kubectl config set-context --current --namespace'

# 看 Pod 在哪
alias kgp='kubectl get pods -o wide'

# 啟用 kubectl 自動補全（zsh）
source <(kubectl completion zsh)
\\\`\\\`\\\`

---

## 重點整理

- **80% 時間只用這 50 個指令**——背熟比什麼都重要
- **\\\`describe\\\` 比 \\\`get\\\` 更有用**：看 events 才知道為什麼失敗
- **\\\`logs --previous\\\` 是救命指令**：看崩潰前的最後一刻
- **\\\`--dry-run=client -o yaml\\\` 產 YAML 範本**比手寫快 10 倍
- **裝 \\\`k9s\\\` / \\\`kubectx\\\` / \\\`kubens\\\`** 這三個 CLI 工具，效率再翻倍

## 下一步

指令會了，但**寫 YAML 的時候還是會卡住**？下一篇給你 8 大資源的完整 YAML 模板：[K8s YAML 範例大全](/blog/k8s/k8s-yaml-cheatsheet)

> 📚 **完整系列總覽**：[K8s 系列教學首頁](/blog/#k8s)（共 40 課，按學習路徑順序排）
`,
  },
  {
    slug: 'k8s-yaml-cheatsheet',
    order: 39,
    group: 'ops',
    title: 'K8s YAML 範例大全：8 大資源完整模板',
    excerpt:
      'Pod / Deployment / Service / Ingress / ConfigMap / Secret / PVC / StatefulSet 八大資源各一份完整 YAML 模板，加註解、可直接改，省下查文件的時間。',
    publishDate: '2026-06-05',
    tags: ['Kubernetes', 'YAML', '範例', '模板'],
    readingTime: 9,
    content: `
## 寫 YAML 還在翻文件？

每次寫 \\\`Deployment\\\` 都要 Google「probe yaml example」？每次寫 \\\`StatefulSet\\\` 都要看一遍 [上篇 12 步部署](/blog/k8s/deploy-from-zero-12-steps-upper)？

這篇給你 **8 大資源的完整模板**——加註解、可直接抄、改個名字就能用。

> 建議存到 \\\`~/.kube-templates/\\\`，需要時 \\\`cp\\\` 一份來改。

---

## 1. Pod（最簡）

\\\`\\\`\\\`yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-pod                  # Pod 名字
  labels:
    app: demo                   # 用來給 Service 抓
spec:
  containers:
  - name: app
    image: nginx:1.25           # 永遠不要用 latest
    ports:
    - containerPort: 80
    env:
    - name: ENV_VAR
      value: "hello"
\\\`\\\`\\\`

> 實務上不會直接寫 Pod，都用 Deployment / StatefulSet 包起來。

---

## 2. Deployment（最常用）

\\\`\\\`\\\`yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  namespace: default
  labels:
    app: my-app
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1               # 滾動時最多多 1 個
      maxUnavailable: 0         # 滾動時不允許少 Pod
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: app
        image: my-app:1.0
        ports:
        - containerPort: 8080
        env:
        - name: ENV
          valueFrom:
            configMapKeyRef:
              name: my-config
              key: env
        resources:
          requests:
            cpu: "100m"
            memory: "128Mi"
          limits:
            cpu: "500m"
            memory: "256Mi"
        livenessProbe:
          httpGet:
            path: /healthz
            port: 8080
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          periodSeconds: 5
\\\`\\\`\\\`

---

## 3. Service（三種一起給）

\\\`\\\`\\\`yaml
# ClusterIP（叢集內部用）
apiVersion: v1
kind: Service
metadata:
  name: my-svc
spec:
  type: ClusterIP
  selector:
    app: my-app
  ports:
  - port: 80                    # Service 對外的 port
    targetPort: 8080            # Pod 裡的 port
---
# NodePort（每個 Node 開 port）
apiVersion: v1
kind: Service
metadata:
  name: my-svc-nodeport
spec:
  type: NodePort
  selector:
    app: my-app
  ports:
  - port: 80
    targetPort: 8080
    nodePort: 30080             # 30000-32767 之間
---
# Headless（StatefulSet 用）
apiVersion: v1
kind: Service
metadata:
  name: my-headless
spec:
  clusterIP: None               # 關鍵
  selector:
    app: my-app
  ports:
  - port: 80
\\\`\\\`\\\`

---

## 4. Ingress（含 TLS）

\\\`\\\`\\\`yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    cert-manager.io/cluster-issuer: letsencrypt-prod   # 用 cert-manager 自動發
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - app.example.com
    secretName: app-tls
  rules:
  - host: app.example.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: api-svc
            port:
              number: 80
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-svc
            port:
              number: 80
\\\`\\\`\\\`

---

## 5. ConfigMap

\\\`\\\`\\\`yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: my-config
data:
  # 簡單的鍵值
  LOG_LEVEL: "info"
  MAX_CONN: "100"

  # 整個檔案內容
  app.properties: |
    server.port=8080
    spring.application.name=my-app
\\\`\\\`\\\`

掛載到 Pod：

\\\`\\\`\\\`yaml
spec:
  containers:
  - name: app
    image: my-app:1.0
    envFrom:                          # 全部變環境變數
    - configMapRef:
        name: my-config
    volumeMounts:                     # 掛成檔案
    - name: config
      mountPath: /etc/app/app.properties
      subPath: app.properties
  volumes:
  - name: config
    configMap:
      name: my-config
\\\`\\\`\\\`

---

## 6. Secret

\\\`\\\`\\\`yaml
apiVersion: v1
kind: Secret
metadata:
  name: my-secret
type: Opaque
stringData:                       # 用 stringData，K8s 會自動 Base64
  DB_PASSWORD: "supersecret"
  API_KEY: "abcdef12345"
\\\`\\\`\\\`

掛載：

\\\`\\\`\\\`yaml
spec:
  containers:
  - name: app
    image: my-app:1.0
    env:
    - name: DB_PASSWORD
      valueFrom:
        secretKeyRef:
          name: my-secret
          key: DB_PASSWORD
\\\`\\\`\\\`

---

## 7. PVC

\\\`\\\`\\\`yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: my-pvc
spec:
  accessModes:
  - ReadWriteOnce                  # RWO 最常用（單機讀寫）
  resources:
    requests:
      storage: 10Gi
  storageClassName: local-path     # k3s 預設；雲端用 gp2 / standard
\\\`\\\`\\\`

掛到 Pod：

\\\`\\\`\\\`yaml
spec:
  containers:
  - name: app
    volumeMounts:
    - name: data
      mountPath: /data
  volumes:
  - name: data
    persistentVolumeClaim:
      claimName: my-pvc
\\\`\\\`\\\`

---

## 8. StatefulSet（DB 用）

\\\`\\\`\\\`yaml
apiVersion: v1
kind: Service
metadata:
  name: mysql-headless
spec:
  clusterIP: None
  selector:
    app: mysql
  ports:
  - port: 3306
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mysql
spec:
  serviceName: mysql-headless     # 必填
  replicas: 1
  selector:
    matchLabels:
      app: mysql
  template:
    metadata:
      labels:
        app: mysql
    spec:
      containers:
      - name: mysql
        image: mysql:8.0
        env:
        - name: MYSQL_ROOT_PASSWORD
          valueFrom:
            secretKeyRef:
              name: mysql-secret
              key: rootpw
        ports:
        - containerPort: 3306
        volumeMounts:
        - name: data
          mountPath: /var/lib/mysql
  volumeClaimTemplates:           # 自動為每個 Pod 建 PVC
  - metadata:
      name: data
    spec:
      accessModes: [ReadWriteOnce]
      resources:
        requests:
          storage: 10Gi
\\\`\\\`\\\`

---

## Bonus 1：HPA

\\\`\\\`\\\`yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: my-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
\\\`\\\`\\\`

---

## Bonus 2：NetworkPolicy

\\\`\\\`\\\`yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: db-allow-api
spec:
  podSelector:
    matchLabels:
      app: db
  policyTypes: [Ingress]
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: api
    ports:
    - protocol: TCP
      port: 3306
\\\`\\\`\\\`

---

## Bonus 3：CronJob

\\\`\\\`\\\`yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: nightly-backup
spec:
  schedule: "0 2 * * *"             # 每天凌晨 2 點
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: OnFailure
          containers:
          - name: backup
            image: my-backup:1.0
            command: ["/bin/sh", "-c", "backup.sh"]
\\\`\\\`\\\`

---

## YAML 寫作 5 個守則

1. **永遠寫 \\\`apiVersion\\\` + \\\`kind\\\`**——這兩個錯了什麼都不對
2. **永遠不要用 \\\`latest\\\` tag**——升級會莫名其妙
3. **\\\`labels\\\` 跟 \\\`selector.matchLabels\\\` 必須一致**——不然 Service 找不到 Pod
4. **\\\`namespace\\\` 寫清楚**——預設 default 容易出意外
5. **加 \\\`resources\\\` requests/limits**——不然 Pod 是 BestEffort，第一個被殺

## 下一步

到這裡你已經有完整的 K8s 知識+查表能力了。最後一篇：[K8s 學習路線圖 — 從零到生產就緒](/blog/k8s/k8s-learning-roadmap)，告訴你接下來該往哪走。

> 📚 **完整系列總覽**：[K8s 系列教學首頁](/blog/#k8s)（共 40 課，按學習路徑順序排）
`,
  },
  {
    slug: 'k8s-learning-roadmap',
    order: 40,
    group: 'ops',
    title: 'K8s 學習路線圖：從零到生產就緒，我走過的 7 個階段',
    excerpt:
      '學完這 40 篇文章你已經是中級 K8s 玩家了。下一步要學什麼？這篇給你完整路線：CKA 證照 → Operator → Service Mesh → GitOps → 多叢集。',
    publishDate: '2026-06-06',
    tags: ['Kubernetes', '學習路線', '路線圖', 'CKA', 'Roadmap'],
    readingTime: 10,
    content: `
## 學完 40 篇，你在哪？

恭喜你看完整個系列。你現在能做到的事：

- ✅ 從零部署 12 步、跑得起一套生產級服務
- ✅ Probe + Resource + HPA + RBAC + NetworkPolicy 都會配
- ✅ 看到 \\\`OOMKilled\\\` / \\\`CrashLoopBackOff\\\` / \\\`Pending\\\` 不會慌
- ✅ 會用 Helm 安裝套件、會壓測、會做故障演練

**這個程度，已經能應付 80% 公司的 K8s 工作了**。

但這只是 Day 1。生產環境的 K8s 是個無底洞——這篇給你完整路線圖：**從 Day 1 到 Day 365 怎麼學**。

---

## Stage 1：地基（0–3 個月）

> 你現在在這

**目標**：能夠獨立部署 + 排錯一個中型應用。

| 該會 | 該裝在腦子裡的東西 |
|------|------|
| 8 大概念 | Pod / Deployment / Service / Ingress / ConfigMap / Secret / PV / StatefulSet |
| 5 個維運技能 | Probe / Resource / HPA / RBAC / NetworkPolicy |
| 工具 | kubectl / Helm / k9s / kubectx / kubens |

**接下來該做的事**：
- 把這 40 篇做完整實作
- 在自己的小專案上跑一套
- 開始用 K8s 部署你日常的服務（Blog、Gitea、Vaultwarden 都行）

---

## Stage 2：考 CKA / CKAD（3–6 個月）

**為什麼考證照？**

- ✅ 強迫你補齊細節（很多概念你以為會，其實沒）
- ✅ 履歷 +1，跳槽時的入場券
- ✅ 100% 動手實作的考試，**沒有選擇題**

| 證照 | 適合 |
|------|------|
| **CKA**（Administrator） | 偏向叢集管理、排錯、安裝 |
| **CKAD**（Application Developer） | 偏向應用部署、資源配置 |
| **CKS**（Security） | 進階安全，要先通過 CKA |

**準備資源**：
- [Killer.sh](https://killer.sh) — 模擬考試環境
- [KodeKloud](https://kodekloud.com) — 互動式練習場
- 官方文件：考試時會開放查 [kubernetes.io](https://kubernetes.io/docs/)

**準備 2-3 個月**，**$395 USD**，2 小時動手考試。

---

## Stage 3：Operator + CRD（6–9 個月）

學會用 K8s 之後，下一步是**讓 K8s 為你工作**。

### 什麼是 Operator？

**用 K8s 去管理「不是 K8s 原生」的東西**——資料庫、Kafka、ML 工作流、自家的部署流程。

具體例子：
- 寫一個 \\\`MySQLCluster\\\` 自訂資源
- Operator 監聽這個資源，自動建 StatefulSet + 備份排程 + monitoring
- 對使用者來說，就一行：\\\`kubectl apply -f mycluster.yaml\\\`

### 學什麼

- **CRD（Custom Resource Definition）**：定義自訂資源
- **Operator pattern**：Controller + Reconcile loop
- **Operator SDK / Kubebuilder**：產生 Go 樣板的工具

**參考資源**：
- [operatorhub.io](https://operatorhub.io) — 看別人寫好的 Operator
- [Kubebuilder Book](https://book.kubebuilder.io)

---

## Stage 4：GitOps（6–9 個月，可跟 Stage 3 平行）

> 「\\\`kubectl apply\\\` 是上古時代的部署方式。」

**GitOps 的核心**：所有集群狀態都寫在 Git，**Git push = 部署**。

| 工具 | 主導者 | 特色 |
|------|--------|------|
| **ArgoCD** | Intuit | UI 漂亮、生態完整 |
| **Flux** | Weaveworks | CNCF 畢業、輕量 |

實際運作：

\`\`\`
你 git push
    ↓
ArgoCD 偵測 Git 改變
    ↓
自動把改動 apply 到集群
    ↓
集群狀態跟 Git 永遠一致
\`\`\`

**生產級團隊幾乎都在用 GitOps**——回滾就是 \\\`git revert\\\`。

---

## Stage 5：Service Mesh（9–12 個月）

**問題**：當你有 50 個微服務，怎麼處理：

- 服務間自動加密（mTLS）
- 流量金絲雀部署（10% 流量到新版本）
- 自動重試 / 熔斷 / 限流
- 詳細的 metrics / tracing

答案：**Service Mesh**——把這些網路功能從應用代碼抽出來。

| 工具 | 特色 |
|------|------|
| **Istio** | 功能最完整，但複雜 |
| **Linkerd** | 簡單、輕量，CNCF 畢業 |
| **Cilium Service Mesh** | 用 eBPF，效能好 |

**警告**：不是每個團隊都需要 Service Mesh。**少於 10 個服務就不要碰**——複雜度遠大於價值。

---

## Stage 6：Observability（持續累積）

K8s 預設能看的東西很少。生產環境必裝：

| 領域 | 工具 |
|------|------|
| **Metrics** | Prometheus + Grafana |
| **Logs** | Loki / ELK / Datadog |
| **Tracing** | Jaeger / Tempo |
| **All-in-one** | Datadog、New Relic（付費但省事） |

**入門路徑**：先裝 \\\`kube-prometheus-stack\\\` Helm Chart，把 Prometheus + Grafana + Alertmanager 一次裝好。

---

## Stage 7：進階主題（1 年後）

不一定每個都學，看工作需求：

| 主題 | 何時需要 |
|------|---------|
| **多叢集管理**（Karmada / Cluster API） | 跨地區、跨雲 |
| **Edge K8s**（k3s / KubeEdge） | IoT、邊緣運算 |
| **Platform Engineering**（Backstage） | 公司有 50+ 開發者 |
| **AI/ML on K8s**（Kubeflow / Ray） | ML 工作流 |
| **eBPF**（Cilium / Tetragon） | 進階網路 / 安全 |
| **WebAssembly**（Wasm + K8s） | 新世代 runtime |

---

## 一個務實建議：別追新技術

> 「Stage 1 + 2 是必須的，Stage 3 之後是『有問題才學』。」

很多人 K8s 還沒站穩就跑去學 Istio，**結果 Service Mesh 反而成了問題本身**。

**問自己 3 個問題**：

1. 我現在的工作會用到嗎？
2. 我現有的問題用基礎 K8s 解不掉？
3. 我有時間維護它的複雜度嗎？

3 個都「Yes」再學。不然先把 Stage 1-2 做扎實。

---

## 推薦資源

| 資源 | 用途 |
|------|------|
| [Kubernetes 官方文件](https://kubernetes.io/docs/) | 永遠的標準答案 |
| [CNCF Landscape](https://landscape.cncf.io) | 看完整生態 |
| [Learn Kubernetes the Hard Way](https://github.com/kelseyhightower/kubernetes-the-hard-way) | 從零搭一個叢集 |
| [Awesome K8s](https://github.com/ramitsurana/awesome-kubernetes) | 中文/英文資源大全 |
| Podcast: \\\`Kubernetes Podcast from Google\\\` | 通勤時聽 |

---

## 重點整理

- **Stage 1（這 40 篇）+ Stage 2（CKA）是 K8s 工程師的基本盤**
- **Stage 3-5（Operator / GitOps / Service Mesh）依公司規模選**
- **Observability 是貫穿所有階段的必修**
- **Stage 7 看興趣**——別亂跟新技術
- **生產經驗 > 證照**：在線上系統處理過故障，比 5 張證照都有用

## 結語

學 K8s 沒有終點，但你已經有了**最重要的地基**。

接下來的事是：**把這些東西用在你的真實工作上**。每出一次包、每修一個故障、每做一次部署，你的內力都會再厚一層。

> 「別把 K8s 學成又一張收集卡。**用它解你身邊的問題**，那才是工程的本質。」

—— 後續會持續更新文章，歡迎追蹤。

**回到** [K8s 系列首頁](/blog/k8s)

> 📚 **完整系列總覽**：[K8s 系列教學首頁](/blog/#k8s)（共 40 課，按學習路徑順序排）
`,
  },
];
