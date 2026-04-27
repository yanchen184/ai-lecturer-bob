# 文章 ↔ 課程原文 對應表

> 對應 `src/data/k8sLessons.ts` 的 40 篇 K8s 部落格文章。
> 課程原文位於：`/Users/yanchen/workspace/learning/k8s-course-site/docs/`
> 用途：寫每篇文章內文時，對照課程原稿擷取重點，確保不偏離教學弧線。
>
> 命名速查：
> - `*-final.md` = PPT + 逐字稿合一稿（簡報視角）
> - `*-v3-part*.md` / `*-v4-*.md` = 錄影逐字稿（口語視角）
> - 寫文章時優先看 final，需要口語例子時翻 v3/v4

---

## Group 1 · K8s 入門概念（#1-8）

> 主要對應：Day 4 上午（K8s 全貌 + 環境搭建）

| # | slug | 課程原文 |
|---|------|---------|
| 1 | kubernetes-intro | `k8s-day4-overview-ppt.md`、`k8s-day4-morning-final.md` (Slide 1-3)、`k8s-day4-morning-v3-part1.md` (4-1) |
| 2 | docker-vs-kubernetes | `k8s-day4-morning-final.md` (Slide 2-4)、`k8s-day4-morning-v3-part1.md` (4-1, 4-2) |
| 3 | k8s-eight-concepts-overview | `k8s-course-structure.md`、`k8s-day4-overview-ppt.md`（八大概念全貌） |
| 4 | k8s-architecture-master-worker | `k8s-day4-morning-final.md` (Slide 5-7)、`k8s-day4-morning-v3-part1.md` (4-3) |
| 5 | k3d-vs-minikube-local-setup | `k8s-day4-morning-final.md` (Slide 8-9)、`k8s-day4-morning-v3-part2.md` (4-5, 4-6) |
| 6 | kube-system-explore | `k8s-day4-morning-final.md` (Slide 10-11)、`k8s-day4-morning-v3-part2.md` (4-7) |
| 7 | k8s-yaml-basics | `k8s-day4-morning-final.md` (Slide 12-13)、`k8s-day4-morning-v3-part3.md` (4-8) |
| 8 | first-pod-crud | `k8s-day4-afternoon-v3-part1.md` (Loop 1)、`k8s-day4-commands.md` |

## Group 2 · Pod 進階 + Workload（#9-16）

> 主要對應：Day 4 下午 + Day 5 Loop 1-3

| # | slug | 課程原文 |
|---|------|---------|
| 9 | pod-lifecycle-troubleshoot | `k8s-day4-afternoon-v3-part1.md` (Loop 2：排錯) |
| 10 | sidecar-pattern | `k8s-day4-afternoon-v3-part1.md` (Loop 2：Sidecar) |
| 11 | kubectl-advanced-tips | `k8s-day4-commands.md`、`k8s-day4-afternoon-v3-part3.md`（port-forward 等） |
| 12 | pod-env-mysql | `k8s-day4-afternoon-v3-part3.md`（Loop 4：MySQL）、`k8s-day4-commands.md` |
| 13 | deployment-intro | `k8s-day4-afternoon-v3-part3.md` (Loop 5：Deployment 入門)、`k8s-day5-final.md` (Slide Loop 1) |
| 14 | deployment-scale | `k8s-day5-final.md`、`k8s-day5-v3-part1.md` (Loop 1-2：擴縮容) |
| 15 | rolling-update-rollback | `k8s-day5-final.md`、`k8s-day5-v3-part2.md` (Loop 3) |
| 16 | self-healing-labels-selector | `k8s-day5-final.md`、`k8s-day5-v3-part2.md`（Labels 與自我修復） |

## Group 3 · Networking（#17-23）

> 主要對應：Day 5 下午 + Day 6 上午

| # | slug | 課程原文 |
|---|------|---------|
| 17 | clusterip-service | `k8s-day5-final.md`、`k8s-day5-v3-part2.md`（Loop 4-5：Service） |
| 18 | nodeport-three-services | `k8s-day5-final.md`、`k8s-day5-v3-part2.md`（NodePort）、`k8s-day5-v3-part3.md`（三種 Service） |
| 19 | dns-namespace | `k8s-day5-final.md`、`k8s-day5-v3-part3.md` (Loop 6-7：DNS + Namespace) |
| 20 | daemonset-cronjob | `k8s-day5-final.md`、`k8s-day5-v3-part3.md` (Loop 8) |
| 21 | service-ingress-end-to-end | `k8s-day5-v3-part3.md` (Loop 8 結尾整合)、`k8s-day6-v3-part1.md` (Loop 3：整合實作) |
| 22 | kubernetes-ingress-intro | `k8s-day6-final.md` (Slide Loop 1)、`k8s-day6-v3-part1.md` (Loop 1：Ingress) ✅ 已寫完 |
| 23 | ingress-host-tls | `k8s-day6-final.md`（Host-based + TLS 段）、`k8s-day6-v3-part1.md` (Loop 1 後半) |

## Group 4 · 配置與儲存（#24-29）

> 主要對應：Day 6 下午

| # | slug | 課程原文 |
|---|------|---------|
| 24 | configmap-intro | `k8s-day6-final.md` (Slide Loop 2：ConfigMap)、`k8s-day6-v3-part1.md` (Loop 2) |
| 25 | secret-rbac-mysql | `k8s-day6-final.md` (Slide Loop 2-3)、`k8s-day6-v3-part1.md` (Loop 3：Secret) |
| 26 | ingress-configmap-secret-integration | `k8s-day6-v3-part1.md` (Loop 3：整合實作) |
| 27 | pv-pvc-intro | `k8s-day6-final.md`、`k8s-day6-v3-part2.md` (Loop 4-5：PV/PVC) |
| 28 | storageclass-statefulset-mysql | `k8s-day6-final.md`、`k8s-day6-v3-part2.md` (Loop 6-7：StatefulSet) |
| 29 | helm-intro | `k8s-day6-final.md` (Slide Loop 8)、`k8s-day6-v3-part2.md` (Loop 8：Helm) |

## Group 5 · 維運與生產就緒（#30-37）

> 主要對應：Day 7 全天

| # | slug | 課程原文 |
|---|------|---------|
| 30 | probe-liveness-readiness-startup | `k8s-day7-final.md`、`k8s-day7-v4-morning.md`（Probe 段，若已重整到 Loop 結構） |
| 31 | resource-limits-qos-oomkilled | `k8s-day7-final.md`（Resource limits 段） |
| 32 | hpa-autoscale-loadtest | `k8s-day7-final.md`、`k8s-day7-v4-morning.md` (Loop 1：HPA) |
| 33 | rbac-readonly-user | `k8s-day7-final.md`、`k8s-day7-v4-morning.md` (Loop 2：RBAC) |
| 34 | networkpolicy-intro | `k8s-day7-final.md`（NetworkPolicy 段） |
| 35 | deploy-from-zero-12-steps-upper | `k8s-day7-v4-afternoon-loop3.md`（從零部署：前 6 步） |
| 36 | deploy-from-zero-12-steps-lower | `k8s-day7-v4-afternoon-loop3.md`（從零部署：後 6 步 + Helm 對比） |
| 37 | deploy-loadtest-failure-sim | `k8s-day7-v4-afternoon-shorturl.md`（壓測 + 故障模擬，學員實作） |

## Group 6 · 速查表 + Roadmap（#38-40）

> 對應整門課的整理 / 串連型內容

| # | slug | 課程原文 |
|---|------|---------|
| 38 | kubectl-cheatsheet | `k8s-day4-commands.md`、`k8s-day5-commands.md`、`day3-commands.md` 彙整 |
| 39 | k8s-yaml-cheatsheet | 各 day final 的 YAML 範例彙整 |
| 40 | k8s-learning-roadmap | `k8s-syllabus.md`、`k8s-course-structure.md`、本人經驗 |

---

## 寫文章 SOP

1. **打開對應的課程原文**（先 final，需要口語細節再翻 v3/v4）
2. **抓出 hook**（為什麼讀者需要這個概念？）
3. **依「3 個重點 + 2 段範例 + 1 個下集預告」結構寫**
4. **保留因果鏈伏筆**（這篇結尾要鋪下一篇的問題）
5. **回填到 `src/data/k8sLessons.ts`**，把 stub 換成完整內容
6. **跑 `PUBLISH_OVERRIDE_DATE=YYYY-MM-DD npm run build`** 預覽
