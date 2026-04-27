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

**重點：K8s 不是取代 Docker，是「管理一堆 Docker 容器的平台」**。Docker 還在,只是現在多了一個老闆叫 K8s。

## K8s 是怎麼來的？

不是純學術產物，是 Google 用了 15 年的 Borg 系統「整理重寫」開源出來的。

- **2003**：Google 內部用 Borg 管理數十億容器
- **2014**：Google 把 Borg 的經驗整理成開源版本，取名 Kubernetes（希臘語「舵手」的意思）
- **2015**：捐給 CNCF（Cloud Native Computing Foundation）
- **2026 年的今天**：AWS、Azure、GCP、阿里雲全部支援，**已經是業界標準**

換句話說,你學 K8s **不是學一個工具,是學一個產業共識**。

## Docker vs K8s：到底差在哪？

最常被問的問題,直接給結論:

> **Docker 解決「怎麼跑一個容器」,K8s 解決「怎麼跑一堆容器還要它們互相溝通、自動修復、自動擴縮」**。

兩個不是替代關係,是搭配關係:

\`\`\`
Docker:  把應用打包成容器     ── 製造業
K8s:     管理一堆容器在叢集跑   ── 物流業
\`\`\`

實務上的工作流程:

1. **開發階段**:用 Docker 寫 Dockerfile、build image
2. **部署階段**:把 image 推到 registry,寫 K8s YAML 告訴 K8s 怎麼跑

如果你還沒用過 Docker,先把 Docker 學會再來 K8s。**沒有 Docker 基礎直接學 K8s 會很痛**,因為 K8s 的最小單位 Pod 就是「容器的延伸」,不懂容器看 Pod 會卡。

## 你會在哪些地方遇到 K8s？

- **雲端服務**:AWS EKS、GCP GKE、Azure AKS,都是託管 K8s
- **自架伺服器**:用 kubeadm、k3s、k3d、minikube 自己裝
- **開發機**:用 minikube 或 k3d 在本機跑「迷你 K8s」練習
- **CI/CD**:GitLab Runner、GitHub Actions 的執行環境很多就是 K8s

**一句話**:只要你公司規模超過 10 個工程師、後端服務超過 5 個,九成機率會用到 K8s。

## 學 K8s 真的有那麼難嗎？

老實講——**前 3 天很痛,過了第 4 天就會覺得「啊就這樣」**。

K8s 的痛點不是抽象,是「概念多」:Pod、Deployment、Service、Ingress、ConfigMap、Secret、Volume、StatefulSet... 一口氣丟給你會爆。

但這些概念**有清楚的因果鏈**——每一個都是「上一個解決不了的問題」才出現的:

\`\`\`
Pod        ← 容器要包一層
Service    ← Pod IP 會變,要穩定的入口
Ingress    ← Service 網址醜,要域名
ConfigMap  ← 設定不能寫死在 image 裡
Secret     ← 密碼不能明文
Volume     ← Pod 重啟資料就消失
Deployment ← Pod 自己掛了不會自動補
StatefulSet← DB 這種有狀態的服務需要固定身份
\`\`\`

**順著因果鏈學,就不會亂**。這也是這個系列的鋪陳方式——從第 1 篇到第 40 篇,每一篇都是上一篇沒解決的問題引出來的。

## 重點整理

- **Docker 撐不住的場景**:跨機器、故障恢復、彈性擴縮容、滾動更新、服務發現——這 5 件事 Docker Compose 一個都不會
- **K8s 是 Google Borg 的開源版**,現在是業界標準
- **Docker 跟 K8s 不是二選一**,是上下游搭配
- **K8s 看起來概念多,但全部都有因果關係**——順著學就不會迷路

## 下一步

如果你還沒用過 Docker,先去學 Docker。如果 Docker 已經 OK 了,下一篇我們會用一張圖把 [Docker 跟 K8s 的差別](/blog/k8s/docker-vs-kubernetes) 講得更清楚,讓你**回家可以用 30 秒跟同事解釋**這兩個東西的關係。
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
    content: stub('Docker vs Kubernetes：差在哪？', 'Docker 跟 K8s 不是二選一，而是上下游。Docker 把程式打包成容器，K8s 負責讓這些容器在叢集裡跑得順、出問題自動修。'),
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
    content: stub('K8s 八大核心概念', 'Pod 是最小單位 → Pod IP 會變所以要 Service → Service 網址醜所以要 Ingress → 設定寫死所以要 ConfigMap → 密碼明文所以要 Secret → 資料消失所以要 Volume → 單點故障所以要 Deployment → DB 特殊所以要 StatefulSet。'),
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
    content: stub('K8s 架構', 'Master Node = 老闆（決策），Worker Node = 員工（執行）。kubectl 下指令給 API Server，Scheduler 決定派給哪個 Worker，kubelet 在 Worker 上實際把容器跑起來。'),
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
    content: stub('本地 K8s 環境：k3d vs minikube', '想學 K8s 不用真的開雲端，本地電腦就能跑。k3d 啟動快、佔資源少；minikube 文件多、社群大。這篇給你實測比較。'),
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
    content: stub('探索 kube-system', 'K8s 自己的核心元件也是用 Pod 跑的，全部住在 kube-system namespace。這篇帶你逐個認識：CoreDNS（叢集內 DNS）、kube-proxy（網路）、traefik（k3s 內建 Ingress Controller）。'),
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
    content: stub('K8s YAML 基礎', 'YAML = 「給 K8s 的訂單」。每張訂單都有四個固定欄位：apiVersion（用哪版 API）、kind（要建什麼）、metadata（叫什麼名字）、spec（規格）。'),
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
    content: stub('第一個 Pod', '這篇實作：寫 YAML → kubectl apply → kubectl get → kubectl describe → kubectl logs → kubectl exec → kubectl delete。看完你就會 K8s 最基礎的 CRUD 五招。'),
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
    content: stub('Pod 排錯', 'CrashLoopBackOff 不是 K8s 壞了，是你的容器一直自己掛。ImagePullBackOff 是 Image 名字打錯或私有 registry 沒設密碼。這篇教你怎麼用 describe + logs 兩招定位。'),
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
    content: stub('Sidecar 模式', '主容器專心做事，旁邊配一個小容器幫忙處理日誌、metrics 或網路。這篇用 nginx 寫日誌 + busybox tail 即時看日誌的經典範例。'),
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
    content: stub('kubectl 進階技巧', 'port-forward = 「私人通道」連進 Pod；dry-run=client 不真的建只看 YAML；-w 即時看 status 變化。三招會了就跟一般教學程度甩開。'),
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
    content: stub('K8s 上的 MySQL', 'YAML 的 env 區塊就是 docker -e 的等價寫法。但實務上密碼不能寫在 YAML 裡，所以還會接 ConfigMap 跟 Secret。這篇先學最基本的寫法。'),
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
    content: stub('Deployment 入門', 'Deployment 管 ReplicaSet，ReplicaSet 管 Pod。你只要跟 Deployment 說「我要 3 份 nginx」，剩下的它幫你顧。這篇實作 scale、rollout、delete 三件事。'),
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
    content: stub('kubectl scale 擴縮容', 'kubectl scale deploy/myapp --replicas=5 一行指令搞定。新 Pod 自動加入 Service 後面、流量自動均分。這就是 K8s 最迷人的地方。'),
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
    content: stub('滾動更新 + 回滾', 'set image 觸發更新，K8s 一個一個換 Pod；rollout status 看進度；rollout undo 退回上一版。這就是「零停機部署」的最簡單實作。'),
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
    content: stub('Labels 與自我修復', 'Deployment 不認 Pod 名字，它認 label。selector matchLabels 對到 3 個 Pod 你 delete 一個，它馬上發現「少一個」就建一個新的。這就是自我修復的本質。'),
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
    content: stub('ClusterIP Service', 'Pod IP 隨時會變，所以 K8s 給每組 Pod 一個固定的 ClusterIP。這個 IP 只在叢集內可見，但永遠指向最新一批 Pod。這就是「服務發現」最簡單的實作。'),
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
    content: stub('K8s 三種 Service', 'ClusterIP（叢集內）、NodePort（每個節點開 port）、LoadBalancer（雲商給公網 IP）。新手最常用 NodePort，正式環境一律 LoadBalancer + Ingress。'),
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
    content: stub('K8s DNS 與 Namespace', '同 namespace 內：直接 mysql-svc。跨 namespace：mysql-svc.production。完整 FQDN：mysql-svc.production.svc.cluster.local。這篇用 nslookup 帶你看穿 CoreDNS。'),
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
    content: stub('DaemonSet 與 CronJob', 'DaemonSet：每個 Node 一份（監控 agent 必備）。CronJob：K8s 的 crontab，schedule 用 cron 語法（"*/5 * * * *"）。這篇實作 fluentd DaemonSet + 每天備份 CronJob。'),
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
    content: stub('Pod → Deployment → Service → Ingress', '這篇是 group 1+2+3 的總集篇。學員寫一份 nginx Deployment、開 ClusterIP Service、套 Ingress 路由，從瀏覽器一路通到 Pod。看完你就知道整個 K8s 部署在做什麼。'),
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

下一篇會接著講 **HTTPS / TLS 怎麼設**，以及 cert-manager 自動續憑證。
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
    content: stub('Ingress Host + TLS', 'Host-based 用域名分流（適合微服務各自有名字），TLS 讓網站走 HTTPS。實務上配 cert-manager + Let\'s Encrypt 自動申請憑證、自動續期，幾乎零維護。'),
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
    content: stub('ConfigMap 教學', 'ConfigMap 解決「設定寫死」的問題。兩種用法：env 注入（適合單一變數）、Volume 掛載（適合整個設定檔，如 nginx.conf）。'),
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
    content: stub('Secret 教學', 'Secret 跟 ConfigMap 用法幾乎一樣，但內容是 base64（注意：base64 不是加密，只是編碼）。真正的安全來自 RBAC，控制誰能 kubectl get secret。'),
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
    content: stub('Ingress + ConfigMap + Secret 整合', '一份 nginx Deployment（用 ConfigMap 注入 config）、一份 MySQL Deployment（用 Secret 注入密碼）、一份 Ingress 對外。這就是中型網站在 K8s 上的標準長相。'),
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
    content: stub('PV 與 PVC 入門', 'PersistentVolume = 實體儲存（NFS / EBS / hostPath）。PersistentVolumeClaim = Pod 跟 K8s 申請「我要 5G 空間」。兩個對上後，Pod 死了資料還在。'),
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
    content: stub('StorageClass + StatefulSet', 'StorageClass = 自動建 PV 的「規則」，省掉手動。StatefulSet 跟 Deployment 像，但每個 Pod 有固定名字（mysql-0、mysql-1）跟自己的 PVC，適合 DB / Kafka / Zookeeper。'),
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
    content: stub('Helm 入門', 'Helm = K8s 的 npm / apt。helm install mysql bitnami/mysql 一行指令幫你建好 Deployment + Service + Secret + PVC + StatefulSet。這篇實作裝 Redis 跟 MySQL 兩個常見 Chart。'),
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
    content: stub('K8s Probe 三種健康檢查', 'Liveness fail → 殺掉重啟；Readiness fail → 從 Service 摘下；Startup 是給慢啟動的 Java / Spring Boot 用，沒過之前另外兩個 Probe 不會跑。'),
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
    content: stub('Resource limits 與 QoS', 'requests 跟 limits 設一樣 → Guaranteed。requests < limits → Burstable。都不設 → BestEffort（OOM 時第一個被殺）。實務上一律用 Burstable 才能既保證又能 burst。'),
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
    content: stub('HPA 自動擴縮', 'HPA 看 metrics-server 的 CPU 數據，超過 threshold 就加 Pod，閒下來就縮。實戰：hey -z 60s -c 50 http://nginx-svc → kubectl get hpa --watch 看 Pod 自動長出來。'),
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
    content: stub('RBAC 只讀使用者', 'Role = 「能做什麼」（verbs: get/list/watch）。RoleBinding = 「誰能做」（綁 ServiceAccount 或 User）。這篇從零建一個只能查 Pod 的 viewer 帳號。'),
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
    content: stub('NetworkPolicy 入門', 'NetworkPolicy 用 label 寫規則：「只有 frontend 能連 backend、只有 backend 能連 db、其他全部擋」。注意：要支援 NetworkPolicy 的 CNI（Calico / Cilium）才有效。'),
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
    content: stub('從零部署 12 步（上）', '從空叢集到能跑的網站：Step 1 namespace → 2 Deployment → 3 Service → 4 Ingress → 5 ConfigMap → 6 Secret。每一步都有 YAML 範例 + 驗證指令。'),
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
    content: stub('從零部署 12 步（下）', '7 PV/PVC → 8 StatefulSet DB → 9 HPA → 10 Probe → 11 RBAC → 12 NetworkPolicy。做完整套就是「生產就緒」的標準。'),
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
    content: stub('壓測與故障模擬', '壓測（hey / k6）→ HPA 真的擴容了嗎？故障模擬（delete pod、cordon node）→ 服務有中斷嗎？做完這兩個你才能放心上線。'),
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
    content: stub('kubectl 50 指令大全', '查狀態（get/describe/logs/top）、改設定（apply/edit/patch/scale）、排錯（exec/port-forward/cp/debug）、進階（dry-run/diff/rollout）。50 個分類整理直接抄。'),
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
    content: stub('K8s YAML 模板大全', '八大資源各一份完整可用的 YAML，每行加註解。實戰時直接 copy paste 改名字就能用，省下翻文件的時間。'),
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
    content: stub('K8s 學習路線圖', '0~3 月：基礎（這 40 篇）。3~6 月：CKA 證照 + 寫 Operator。6~12 月：Service Mesh（Istio / Linkerd）+ GitOps（ArgoCD）。1 年後：多叢集、Edge K8s、自建 Platform。'),
  },
];
