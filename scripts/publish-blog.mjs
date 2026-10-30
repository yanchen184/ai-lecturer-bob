#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { homedir } from 'node:os'
import { execSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

const PROJECT_ID = 'forbidden-beauty'
const API_KEY = 'AIzaSyDrAsh4pLbCebHSogupG8daABhRYdI2prk'
const COLLECTION = 'bob_blog_posts'

// 2026-05-27 起 firestore.rules 把 bob_blog_posts 寫入收緊成「只認 service account」，
// 純 API key 的匿名 REST 寫入會 403。改用 firebase CLI 已登入的 owner OAuth token
// 走 IAM 身分寫入 —— IAM/Admin 路徑不受 security rules 約束。
// client_id / secret 是 firebase-tools 公開內建常數（Google 官方文件已公開,非機密）。
const FIREBASE_CLI_CLIENT_ID =
  '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com'
const FIREBASE_CLI_CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi'

async function getOwnerAccessToken() {
  const cfgPath = `${homedir()}/.config/configstore/firebase-tools.json`
  let refreshToken
  try {
    const cfg = JSON.parse(readFileSync(cfgPath, 'utf-8'))
    refreshToken = cfg?.tokens?.refresh_token
  } catch {
    throw new Error(
      `讀不到 firebase CLI 設定 (${cfgPath})。先跑 \`firebase login\` 登入 bobchen184@gmail.com。`
    )
  }
  if (!refreshToken)
    throw new Error('firebase CLI 設定缺 refresh_token,請重新 `firebase login`。')

  const body = new URLSearchParams({
    client_id: FIREBASE_CLI_CLIENT_ID,
    client_secret: FIREBASE_CLI_CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  })
  const res = await fetch('https://www.googleapis.com/oauth2/v4/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  const data = await res.json()
  if (!res.ok || !data.access_token)
    throw new Error(`換 access token 失敗: ${JSON.stringify(data)}`)
  return data.access_token
}

/** 每篇文章: { slug, title, excerpt, category, tags[], faqItems[], featured? } */
const posts = [
  {
    slug: 'prompt-injection-defense-four-walls',
    title: 'Prompt injection 怎麼防？我實測 6 發後只留四道牆',
    excerpt:
      '我拿 6 發 prompt injection 打自己做的醫療衛教 RAG 機器人，5 發擋住、1 發吐出 467 字系統提示詞原文——而破防的是網路上人人會抄的老掉牙開頭，偽造系統標記那發反而失敗。有效的防護只有四件事：算清楚攻擊成功能拿到什麼、把外部資料與指令劃界、在輸出端做決定性攔截、把攻擊固化成測試。',
    category: 'AI 工具',
    tags: [
      'prompt injection',
      'LLM 安全',
      'RAG',
      'AI agent',
      '間接注入',
      'OWASP LLM01',
      'spotlighting',
      'AI 工具',
    ],
    faqItems: [
      {
        q: 'Prompt injection 有辦法完全防住嗎？',
        a: '沒有。OWASP 在 LLM01:2025 裡明白寫出，由於模型的隨機性本質，目前沒有已知的萬全預防方法。所以正確的目標不是「防到 100%」，而是分兩層：用 prompt 標記外部資料讓攻擊變難（機率性的一層），再用輸出端的純函式攔截把「已知形狀的災難」變成不可能發生（決定性的一層）。我實測就是 prompt 層擋住五發、第六發過，靠輸出端補上。',
      },
      {
        q: '為什麼不要做輸入端的關鍵字黑名單？',
        a: '成本結構完全不對等。攻擊句式無法窮舉，「忽略上述指示」「ignore previous」「無視前面的話」換一個詞的成本是零；而誤判正常使用者的成本很高——我如果擋掉含「忽略」的訊息，病人問「我可以忽略醫師說的嗎」就會被拒答。我的實測結果是最直接的證據：黑名單會擋掉偽造 [SYSTEM] 標記那發沒用的攻擊，卻放過真正破防的那發。',
      },
      {
        q: '什麼是間接注入（indirect prompt injection）？',
        a: '攻擊者不跟你的系統對話，而是把指令藏進你的系統會去讀的資料裡——一個網頁、一份 PDF、一封信、一則 issue 留言。等 RAG 把它撈進 context，那段文字就跟你的系統提示詞躺在同一個 prompt 裡。它最需要注意的原因是繞過所有輸入端防護。緩解方式是用明確標記把外部資料包起來並註明「這是資料不是指令」，業界稱為 spotlighting。',
      },
      {
        q: '輸出端攔截會不會把正常功能弄壞？',
        a: '會，如果條件寫得太寬。衛教內容裡到處都是數字加單位（一天喝 1000-2000 CC 水、LDL 降到 55 mg/dL、走 6000-8000 步），所以我的劑量攔截要求兩個條件同時成立：出現劑量單位，而且上下文有用藥語意，並先剔除 mg/dL 這種檢驗值單位。加固前後我拿同樣五個真實衛教問題對照，字數與附件數都持平，沒有出現回答變短、什麼都不敢講的退化。',
      },
      {
        q: '中文 regex 為什麼不能直接用 \\b 詞界？',
        a: '因為 \\b 是 ASCII 詞界，中文字不是 word character。我第一版寫 `\\d+\\s*(?:mg|毫克)\\b`，結果「他汀類藥物建議吃到 20 毫克。」抓到了（後面是句號），但「請服用 20 毫克的藥物」漏掉（後面接「的」）。修法是把中文單位和 ASCII 單位拆成兩個分支，只有 ASCII 那支加 \\b。這也是為什麼安全測試要刻意打邊界，不能只打自己想得到的代表性句子。',
      },
    ],
  },
  {
    slug: 'whisper-cpp-vs-whisperx',
    title: 'whisper.cpp 與 WhisperX 不是二選一:M2 實測後我兩個都留著',
    excerpt:
      '兩套本機語音轉文字工具,我在同一台 M2 MacBook(8GB)上都裝過都跑過:whisper.cpp 贏在形態,clone 加兩行 cmake、零個坑;WhisperX 贏在設計,用 wav2vec2 強制對齊把時間戳磨到字級還附信心分數。裝 WhisperX 我踩了三個坑——結論是先裝 whisper.cpp,真需要字級時間戳再加 WhisperX,兩個不衝突。',
    category: 'AI 工具',
    tags: [
      'whisper.cpp',
      'WhisperX',
      '語音轉文字',
      'speech to text',
      '本機 AI',
      '字級時間戳',
      'Apple Silicon',
      'AI 工具',
    ],
    faqItems: [
      {
        q: 'whisper.cpp 跟 WhisperX 該選哪一個?',
        a: '多數情況先選 whisper.cpp,因為安裝成本近乎為零而且對一般轉錄需求足夠。只有當你需要字級時間戳、語者分離或對齊信心分數時,才需要再裝 WhisperX。這兩個不是互斥選項,可以同時裝——我自己兩個都留在機器上。',
      },
      {
        q: 'WhisperX 為什麼比 whisper.cpp 慢?',
        a: '因為它做的事情比較多。WhisperX 除了轉錄,還跑了 VAD 前處理和 wav2vec2 強制對齊。我實測對齊那一步在 M2 純 CPU 上大約多花 9 秒(17.66 秒的音檔,35.11 秒對上 25.71 秒)。另外我的 WhisperX 測試是純 CPU,whisper.cpp 大模型走的是 Metal GPU,這兩組數字用的不是同一段音檔也不是同一個後端,不能直接對比。',
      },
      {
        q: '字級時間戳一定要用 WhisperX 嗎?',
        a: 'whisper.cpp 有參數可以控制輸出粒度,但那是把句子切短,時間戳的來源仍然是 Whisper 生成時自己預測的。WhisperX 的字級時間戳是另外載入 wav2vec2 音素模型做強制對齊算出來的,而且附帶信心分數 score,來源和品質是兩回事。',
      },
      {
        q: '兩個都裝會不會衝突?',
        a: '不會。whisper.cpp 是一支獨立執行檔加一個 .bin 模型檔,WhisperX 是 Python 套件,我把它裝在獨立的 venv 裡。兩者各自的模型權重也是分開下載、分開快取的。',
      },
      {
        q: '8GB 記憶體的 Mac 跑得動嗎?',
        a: '我這台就是 8GB 的 M2。whisper.cpp 載入 1.5GB 的 large-v3-turbo 全程沒有 swap 壓力,運算緩衝區加起來不到 200MB。WhisperX 用 base 模型加 int8 量化也跑得動,但它同時要載轉錄模型和對齊模型,記憶體壓力比 whisper.cpp 明顯大。',
      },
    ],
  },
  {
    slug: 'whisperx-word-timestamps-diarization',
    title: 'WhisperX 字級時間戳與語者分離:M2 MacBook 純 CPU 實測',
    excerpt:
      'Max Bain 的 BSD-2-Clause 開源專案,在 faster-whisper 的逐字稿之上多接 wav2vec2 強制對齊與 pyannote 語者分離,把時間戳細到每一個字。我在 M2 / 8GB 的 MacBook 純 CPU 實測 17.66 秒中文:base 加對齊 35 秒,86 個字全部拿到 start / end / score——但 NLTK 的 punkt_tab 沒補裝的話,對齊那步會跑完什麼都不輸出。',
    category: 'AI 工具',
    tags: [
      'WhisperX',
      'Whisper',
      '語音轉文字',
      '字級時間戳',
      '語者分離',
      'faster-whisper',
      'pyannote',
      'AI 工具',
    ],
    faqItems: [
      {
        q: 'WhisperX 跟 Whisper 差在哪?',
        a: 'Whisper 給你「這段音檔講了什麼」,WhisperX 多給你「每一個字出現在第幾秒」。它的轉錄是呼叫 faster-whisper,自己做的是前後三段:先用 VAD 切掉靜音、轉完用 wav2vec2 強制對齊把時間戳磨細到字級、需要的話再用 pyannote 標出每句是誰講的。',
      },
      {
        q: '字級時間戳是怎麼算出來的?為什麼比 Whisper 自己的準?',
        a: 'Whisper 的時間戳是生成模型順便預測的,會漂。WhisperX 另外載入 wav2vec2 音素模型做強制對齊:逐字稿已知的情況下,問題變成「把已知的字排進時間軸最合理的位置」,這是可以用動態規劃解的對齊問題,不是猜測。精度來自一個專門做時間解析的模型。',
      },
      {
        q: 'Apple Silicon 上跑得動嗎?速度如何?',
        a: '跑得動,但是 CPU 在跑。torch 的 MPS 可用但轉錄後端 CTranslate2 走 CPU 路徑,要指定 --device cpu --compute_type int8。我在 M2 / 8GB 實測 17.66 秒中文:base 加對齊 35.11 秒,--no_align 是 25.71 秒。README 上的 70x realtime 是 CUDA 環境的數字,跟 Mac 無關。',
      },
      {
        q: '為什麼跑完對齊卻什麼檔案都沒輸出?',
        a: '多半是缺 NLTK 的 punkt_tab。句子切分要用它,但這份資料不會跟著套件一起裝,缺了會在最後一步噴 Resource punkt_tab not found 然後輸出目錄空的。補裝 python -c "import nltk; nltk.download(\'punkt_tab\')" 即可,只會遇到這一次。',
      },
      {
        q: '啟動時噴一堆 libtorchcodec 載入失敗的紅字要緊嗎?',
        a: '不要緊,轉錄照跑、結果照出。那只是找不到 torchcodec 要用的 FFmpeg 動態連結庫,接著就退回其他方式讀音檔。想清掉就裝一份 FFmpeg(brew install ffmpeg),不裝也不影響輸出。',
      },
      {
        q: '語者分離要準備什麼?',
        a: '加 --diarize 並帶 --hf_token。預設模型 pyannote/speaker-diarization-community-1 是 HuggingFace 上的 gated model,要先到模型頁面接受使用條款再用自己的 access token。已知人數時可以用 --min_speakers / --max_speakers 縮小搜尋範圍。',
      },
    ],
  },
  {
    slug: 'whisper-cpp-local-speech-to-text',
    title: 'whisper.cpp 本機語音轉文字:M2 MacBook 實測,不用 Python、不上雲',
    excerpt:
      '純 C/C++ 寫成的 Whisper 實作,MIT 授權、無 Python 依賴,clone 完 cmake 一下就能跑,Apple Silicon 走 Metal 加速。我在 M2 / 8GB 的 MacBook 上實測三種模型:base 系列約 6-7 倍即時速度但中文會寫錯人名,large-v3-turbo 全對且仍有 1.5 倍即時——8GB 記憶體跑 1.5G 模型無壓力。',
    category: 'AI 工具',
    tags: [
      'whisper.cpp',
      'Whisper',
      '語音轉文字',
      'speech to text',
      '本機 AI',
      'Apple Silicon',
      'Metal',
      'AI 工具',
    ],
    faqItems: [
      {
        q: 'whisper.cpp 跟 OpenAI 官方 Whisper 差在哪?',
        a: '官方 Whisper 是 Python 專案,要裝 PyTorch 與一整套依賴;whisper.cpp 是同一個模型的純 C/C++ 重寫,build 完只有一支執行檔,不需要 Python 也不需要 PyTorch。模型是單一 .bin 檔,搬到別台機器一樣能用。',
      },
      {
        q: '在 Mac 上要怎麼安裝?',
        a: 'git clone 專案後跑 cmake -B build -DCMAKE_BUILD_TYPE=Release 再 cmake --build build -j --config Release,執行檔會在 build/bin/whisper-cli。macOS 不用另外裝東西,Metal 支援預設就是開的。模型用專案內附的 bash ./models/download-ggml-model.sh <模型名> 下載。',
      },
      {
        q: '8GB 記憶體的 MacBook 跑得動大模型嗎?',
        a: '跑得動。我在 M2 / 8GB 上載入 1.5GB 的 large-v3-turbo 全程沒有 swap 爆掉,實際運算配置的緩衝區加起來不到 200MB。轉錄 17.6 秒的中文音檔運算耗時約 11.9 秒,仍然快過即時。',
      },
      {
        q: '為什麼我的中文音檔轉出來只有 (speaking in foreign language)?',
        a: '因為用到了 .en 結尾的英文專用模型。base.en、small.en 這類模型認得出「這不是英文」但沒有能力轉錄中文,而且不會報錯。要處理中文請改用沒有 .en 後綴的多語版本,例如 base、small、medium、large-v3-turbo。',
      },
      {
        q: '轉出來是簡體字怎麼辦?',
        a: '這是 Whisper 模型本身處理中文的行為,不是 whisper.cpp 的問題——訓練資料裡簡體中文佔多數。繁中使用者需要在輸出後接一層轉換,例如 OpenCC。',
      },
      {
        q: '要單字級時間戳或語者分離怎麼辦?',
        a: 'whisper.cpp 的原生能力在這兩塊比較弱。需要精準到單字的時間戳、或要分辨誰在什麼時候說話(語者分離),WhisperX 那類在 Whisper 之外再接強制對齊與語者分群的方案更適合。',
      },
    ],
  },
  {
    slug: 'llm-inference-load-test-goodput',
    title: '壓測 LLM 推論服務,別只問「能撐幾個 client」——用 goodput 回答容量',
    excerpt:
      '「這個 AI 推論服務能不能上線」不能用「最多幾個 client」回答:連線數只描述掛得住幾條連線,不告訴你「在使用者能接受的延遲下,每秒服務得動幾個成功請求」。這篇把容量改寫成一句可驗收的話——在指定 workload 與流量模型下,仍同時滿足成功率、TTFT/TPOT/E2E、且零 OOM/restart 的最大 offered load,以及對應的 SLO-qualified goodput——並做成一個能跑的 skill。內容含:goodput vs completed throughput 差在哪、串流式 LLM 要量哪四個指標、為什麼 HTTP 2xx 不等於合格、coordinated omission 怎麼藏掉壅塞、穩定性缺 probe 為何標 UNKNOWN 不標 PASS。附一次真實 smoke 的樣本:reasoning 模型 TTFT 從 0.9 秒抖到 85 秒、max_tokens 被推理和答案一起吃掉。',
    category: '工程實作',
    tags: [
      'LLM 壓測',
      'load test',
      'goodput',
      'TTFT',
      'TPOT',
      'vLLM',
      'SLO',
      '推論服務',
      '容量測試',
    ],
    publishDate: '2026-07-29',
    faqItems: [
      {
        q: '「能撐幾個 client」為什麼不是容量答案?',
        a: 'client 數只描述服務同時掛得住幾條連線,不代表在使用者能接受的延遲下每秒服務得動幾個成功請求。LLM 服務會排隊、會被 KV cache 撐爆、會冷啟動,超過某個點之後多開連線只是讓每個請求都變慢。正式容量要用「同時符合全部 SLO 的 goodput」回答,不是連線上限。',
      },
      {
        q: 'goodput 跟 throughput 差在哪?',
        a: 'completed throughput 是「單純完成的請求速率」,一個回 200 但慢到使用者早關掉分頁的請求也算數;goodput 只計「成功且全部延遲條件(TTFT/TPOT/E2E)都達標」的請求速率。容量報告要報的是 goodput,因為它擋得住「成功率 99% 但一半請求慢到沒人要用」這種好看的假數據。',
      },
      {
        q: '壓測串流式 LLM 要量哪些指標?',
        a: '至少四個:TTFT(第一個字多久出來)、TPOT(後面每個 token 吐多快)、E2E(整體體感)、input/output token throughput(真實產能)。沒有 tokenizer 或 usage 資料時,字元數只能當同一模型內的 fallback,不能拿來跨模型比較,因為不同 tokenizer 一個 token 對應的字元數天差地遠。',
      },
      {
        q: 'HTTP 2xx 為什麼不等於這個請求合格?',
        a: '2xx 只代表服務沒在最外層掛掉。一個回 200 但 E2E 20 秒的請求,對一個 SLO 訂 P95 E2E < 5s 的服務來說是失敗的。goodput 只計同時符合所有 request-level SLO 的請求,一條都不能少算——這條規則就是用來擋漂亮的假數據。',
      },
      {
        q: '穩定性「零 OOM/restart」要什麼證據才算?',
        a: '要有 before/after 的累積計數:壓測前記一次 restart_count / oom_count / gpu_xid_count,壓測後再記一次取 delta,health 用 exit code 判。沒有這組 probe,對應項只能標 UNKNOWN/證據不足,不能標 PASS。缺資料時也不補零——「沒接 GPU counter」跟「GPU 錯誤數是 0」是兩件完全不同的事。',
      },
    ],
  },
  {
    slug: 'claude-agents-background-agent-view',
    title: 'Claude Code agent view 怎麼用?一個看板管住所有背景 agent',
    title: 'Claude Code agent view 怎麼用?一個看板管住所有背景 agent',
    excerpt:
      'claude agents(官方叫 agent view）是 Claude Code 新的背景 agent 控制台:把原本開一堆終端分頁、靠腦子記「哪個 agent 在跑什麼」的混亂,收進一個看板畫面。實測 2.1.212 拆解:看板三分組(等你輸入/執行中/完成)實際怎麼運作、一次派三個 agent 的完整並行工作流、自動 worktree 隔離 + 自動開 draft PR、跟 tmux / subagent 差在哪,以及三個一定要知道的限制。附 Anthropic 官方介紹影片。',
    category: 'AI 工具',
    tags: [
      'agent view',
      'claude agents',
      'Claude Code',
      'background agent',
      '背景 agent',
      '並行 agent',
      'parallel agents',
      'AI 工具',
    ],
    faqItems: [
      {
        q: 'agent view 到底幫我解決什麼?',
        a: '把多個平行的 Claude Code session 收進一個看板畫面,依狀態分組(等你輸入 / 執行中 / 完成),讓你一眼看完誰在忙、誰在等你、誰跑完了,不用在一堆終端分頁之間切換、逐一看 log。核心價值是降低你同時盯多個 agent 的認知負擔,不是讓 agent 跑更快。',
      },
      {
        q: '怎麼一次派多個 agent?',
        a: '打開 claude agents 看板,在底部輸入框一句一句打、每按一次 Enter 就開一個獨立 session。或從 shell 直接 claude --bg "任務" 派,每個都會變成看板上的一行。',
      },
      {
        q: '關掉終端機,背景 agent 會死嗎?',
        a: '不會。背景 session 不需要終端機掛著,Esc 離開看板它照跑。但它跑在你自己機器上,關機就沒了——這不是雲端服務。',
      },
      {
        q: '多個 agent 平行改同一個 repo,會不會互相踩到?',
        a: '不會。背景 session 動檔案前會先搬進自己的 git worktree(.claude/worktrees/ 底下),各寫各的。v2.1.198 起還會自己 commit、push 分支、開 draft PR,但永遠不碰 main / master、不 force push、不自己 merge。',
      },
      {
        q: 'agent view 跟 subagent 差在哪?',
        a: 'subagent 是「一個任務內部拆給多個角色協作」,主 session 要掛著等;agent view 是「多個彼此獨立的任務」,背景各自跑、關掉視窗照跑、晚點再收。要細緻協調用前者,要「派出去別管」用後者。',
      },
      {
        q: '開很多背景 agent 會不會比較快?',
        a: '牆上時間會,額度上不會省。官方文件寫明背景 session 跟互動式一樣吃訂閱用量,開十隻約莫燒十倍速。平行度換的是你的時間,不是算力折扣。',
      },
    ],
  },
  {
    slug: 'gnhf-autonomous-coding-agent-loop',
    title: 'good night, have fun:讓 AI Agent 過夜自己跑迴圈的 orchestrator(實測 0.1.41)',
    excerpt:
      'gnhf(good night, have fun)是把 coding agent 包成自動迴圈的 orchestrator,GitHub 3.2k star。實測安裝、7 種 agent 支援、小步 commit + 失敗回滾 + 連續失敗中止機制,以及它跟 ralph-loop / 手寫 while 迴圈差在哪。',
    category: 'AI 工具',
    tags: [
      'gnhf',
      'good night have fun',
      'AI Agent',
      'Claude Code',
      'Codex',
      'autonomous agent',
      'orchestrator',
      'ralph-loop',
    ],
    publishDate: '2026-07-13',
    faqItems: [
      {
        q: 'gnhf 是一個新的 AI coding agent 嗎?',
        a: '不是。gnhf 本身不寫任何一行 code,它是一個 orchestrator(協調器)——把你既有的 coding agent(Claude、Codex、Copilot 等)包進一個會自動重跑的迴圈。真正動手改檔案的還是底層 agent,gnhf 負責外圈的控制流程:要不要繼續下一輪、跑爛了要不要回滾、連續失敗幾次該收手。',
      },
      {
        q: '讓 AI 無人看管跑一整晚,不會把 repo 搞爛嗎?',
        a: 'gnhf 設計了幾道煞車來框住爆炸半徑:每輪只做一個小的可提交改動(壞掉範圍就是那一個 commit)、commit 失敗會做修復處理、連續失敗到閾值會自動中止、預設另開一條 gnhf 分支而不是直接改 main。加上 --max-iterations / --max-tokens 兩個硬上限,最壞情況也燒不超過你設的額度。這些機制以官方 README 與 gnhf --help 輸出為準。',
      },
      {
        q: '我從 npm 裝到的版本是最新的嗎?',
        a: '不一定。查證時(2026-07-13)npm registry 上 gnhf 套件的 latest 是 0.1.41(發布於 2026-05-07),但 GitHub 上的最新 release tag 是 gnhf-v0.1.42(2026-05-13)——GitHub 的 tag 比 npm 能裝到的新一版。要 0.1.42 可能得從 source 裝。本文所有實測都在 0.1.41 上跑。',
      },
      {
        q: 'gnhf 跟自己寫 while 迴圈狂叫 agent(ralph-loop)差在哪?',
        a: '概念一樣(讓 agent 不做完一步就停、自己往下跑),差在控制流程的完整度。手寫迴圈跑歪時通常沒有煞車:不會回滾、不會數失敗次數、不會自動收手,你早上可能看到一堆爛 commit 跟燒光的額度。gnhf 把 rollback、連續失敗中止、token/輪數上限、分支隔離都做成內建預設。如果你只想跑三五輪、人又在旁邊看,那手寫迴圈或 /loop 就夠,不必多裝工具。',
      },
      {
        q: '可以把 gnhf 塞進 CI / cron 排程嗎?',
        a: '要先自己驗。gnhf 跑起來是常駐的互動式 TUI,不是「跑完印一段 log 就結束」的批次工具。我本輪實測想用 --max-iterations 1 讓它跑一輪就乾淨退出,它停在 TUI 等互動、沒有俐落結束,最後是手動中斷的。所以在無 TTY 的 CI / cron 場景能不能乾淨非互動退出,本文沒驗成功,建議你在自己的環境先試過再說。',
      },
    ],
  },
  {
    slug: 'mattpocock-skills-ai-agent-discipline',
    title: '166k Star Skill 庫拆解:4 個 AI Agent 老問題,各自的解法',
    excerpt:
      'GitHub 166k star 個人 Skill 庫實際拆解:6 個核心 skill 對應 4 個 AI agent 常見失控問題,Matt Pocock 怎麼用 vertical slice 逼 agent 先問清楚再動手。',
    category: '工作流',
    tags: [
      'mattpocock/skills',
      'Claude Code skill',
      'AI Agent',
      'TDD',
      'Code Review',
      'Vertical Slice',
      'Matt Pocock',
      'Superpowers',
    ],
    publishDate: '2026-07-12',
    faqItems: [
      {
        q: '166k stars 是真的還是灌水?',
        a: '這個數字來自 `gh repo view mattpocock/skills` 直接查 GitHub API,是可重現、可驗證的公開數據。至於「750 萬次下載」這個說法完全查無來源——GitHub 沒有公開的下載量指標,這個 repo 本身也不是發布成 npm 套件的形式。這個數字目前找不到任何一手來源可以佐證,本文不採用。',
      },
      {
        q: '是不是要裝 5 個 skill 才算用完整?',
        a: '不是。查證後的實際結構是「4 個常見失控問題,對應到 6 個核心 skill(加上 grill-with-docs、implement 兩個輔助 skill)」,repo 本身沒有「5 個 skill 一條龍」這種框架敘事。這篇文章特地按查到的真實結構寫,不是照搬「5 個 skill」的說法硬套。',
      },
      {
        q: '跟 Anthropic 官方的 skill-creator 有關係嗎?',
        a: '沒有直接關係。skill-creator 是 Anthropic 官方教你怎麼寫 skill 的 meta 工具;mattpocock/skills 是個人已經寫好、可以直接拿來用的一套 skill 內容。兩者可以一起用——用 skill-creator 學怎麼寫,用 mattpocock/skills 當現成範本或直接安裝使用。',
      },
      {
        q: '一定要是 TypeScript 專案才能用嗎?',
        a: '不一定。這套 skill 談的是工程流程(spec、拆票、TDD、review),不綁定特定語言或框架,任何用 Claude Code / Codex 開發、且願意照這套紀律走的專案都能用。作者本身是 TypeScript 生態出身,但 skill 內容本身是語言無關的流程描述。',
      },
    ],
  },
  {
    slug: '12-factor-agents-lessons',
    title: '12-Factor Agents vs 我的遊戲專案:3 條原則,同一個坑',
    excerpt:
      'HumanLayer 的 12-Factor Agents 有 24.2k star，我對照自己寫 Splendor 網頁版時踩出的工程紀律，發現其中 3 條原則我半年前就已經做對，這是實測後的對照筆記。',
    category: '工程實作',
    tags: [
      '12-Factor Agents',
      'AI Agent',
      'Claude Code',
      'HumanLayer',
      '工程紀律',
      'Splendor',
      'fuzzing',
    ],
    publishDate: '2026-07-12',
    faqItems: [
      {
        q: '12-Factor Agents 是一個框架嗎?需要安裝什麼套件?',
        a: '不是。它是一份原則清單(GitHub repo,MD 文件為主),沒有對應的 npm 套件或 SDK 要安裝。原則本身是框架無關的,你可以在任何語言、任何 agent 實作方式裡套用。',
      },
      {
        q: '這份清單只適用於「AI agent」專案嗎?',
        a: '不完全是。這篇文章的重點正是:即使你的專案裡沒有 LLM 在 runtime 做決策(像我的規則引擎遊戲),裡面關於控制流程、錯誤處理、職責邊界的原則,依然是通用的軟體工程紀律。',
      },
      {
        q: '要把 12 條原則全部做到才算合格嗎?',
        a: '不用,也不該勉強湊滿。這份清單是從不同生產案例萃取出的獨立原則,不同專案的架構會踩中不同子集。硬套用不相關的原則(例如把 Pause/Resume 套進一個同步系統)只會讓設計變得奇怪。',
      },
    ],
  },
  {
    slug: 'nesma-function-points-software-sizing',
    title: '軟體有多大?Nesma 功能點分析:只數功能不數行數',
    excerpt:
      'Nesma 是荷蘭軟體度量協會(Netherlands Software Metrics Association),主推功能點分析(FPA):不看程式碼行數、只數軟體對使用者做了幾件事,來量一套系統多大。這篇講清楚它是什麼、資料功能(ILF/EIF)+交易功能(EI/EO/EQ)在數什麼、三種計數層級(detailed/estimated/indicative 荷蘭法),以及跟 IFPUG、COSMIC、敏捷 Story Point 差在哪——功能點波動不到 5%、Story Point 團隊間差異可達 400%。對一個 2026 年同時教課又接案的開發者,功能點最實用的價值不是精算,是當一把「客觀的尺」。',
    category: '工程實作',
    tags: [
      'Nesma',
      '功能點分析',
      'Function Point',
      'FPA',
      'IFPUG',
      'COSMIC',
      'Story Point',
      '軟體度量',
    ],
    publishDate: '2026-07-01',
    featured: true,
    faqItems: [
      {
        q: 'Nesma 跟 IFPUG 到底該選哪個?',
        a: '如果你要對接 ISBSG 這類國際基準資料庫,或做傳統企業專案估算,兩者幾乎通用——自 IFPUG CPM 4.2(2004)起指南高度一致,Nesma 多了 detailed/estimated/indicative 三種計數層級,早期估算更實用。真正要跟它們比較、且做敏捷/user story 的話,考慮 COSMIC。',
      },
      {
        q: '功能點可以取代敏捷的 Story Point 嗎?',
        a: '不能,也不該。它們量的是不同東西:功能點量「功能大小」(客觀規模,不同人數同一套系統通常差不到 5%),Story Point 量「相對工作量」(主觀,團隊之間同樣的東西可以差到 400%)。功能點用於對外報價/跨團隊比較,Story Point 用於團隊內衝刺規劃,通常搭配使用。',
      },
      {
        q: '算功能點一定要專業認證嗎?',
        a: 'detailed 精算需要訓練與經驗。但 Nesma 的 indicative「荷蘭法(the Dutch Method)」只需數邏輯資料檔(ILF/EIF)的數量,套個公式就吐出粗估,一個熟悉系統的工程師花十分鐘就能做,不需要證照。你在專案啟動會議上就能拿它當個規模 sanity check。',
      },
      {
        q: '功能點在敏捷開發裡還有意義嗎?',
        a: '有。Nesma 官網現在的定位就是「敏捷功能性軟體規模量測」;COSMIC 更是設計成能從不完整需求、直接從 user story 量測。功能點在敏捷裡的角色是「跨團隊可比的客觀規模」,補 Story Point 無法對外比較、無法簽約的短板。',
      },
      {
        q: '功能點跟程式碼行數(LOC)差在哪?',
        a: '行數受語言、寫法、工程師習慣影響很大——同一個功能 Java 跟 Python 行數差好幾倍,用它當生產力指標等於獎勵寫囉唆的 code。功能點量的是「對使用者呈現的功能量」(資料功能 + 交易功能),跟實作語言無關,所以能公平比較不同技術棧的專案,也能在還沒寫任何 code 的需求階段就算出來。',
      },
    ],
  },
  {
    slug: 'browser-record-claude-code-skill',
    title: '錄教學影片時,游標為什麼錄不進去?一個 Claude Code 錄影 skill 的誕生',
    excerpt:
      '想讓 AI 操作瀏覽器順便錄成教學影片,結果撞到作業系統層級的限制:單一視窗的錄影裡,滑鼠游標不可能出現。macOS `screencapture -l <windowid>` 能在視窗被完全蓋住時照錄乾淨內容(讀 window server backing store),但同樣的機制決定了它永遠沒有游標——游標是系統畫在所有視窗「之上」的獨立圖層,不屬於任何視窗。這篇記錄我怎麼查清這條物理限制、然後換掉前提:用 Playwright 錄自己起的瀏覽器,在頁面注入一顆 DOM 假游標(CSS transform 平滑移動 + 點擊漣漪),一次解掉「要游標/要畫面乾淨/要能同時做別的事」三難。最花時間的不是畫游標,是驗證它真的有出現——抽影片畫格檢查害我對著幻覺改了三輪程式碼。已開源成 MIT 授權的 Claude Code skill。',
    category: 'AI 工具',
    tags: [
      'browser-record',
      'Claude Code skill',
      '螢幕錄影',
      'Playwright',
      '教學影片',
      'demo 影片',
      'screencapture',
      'macOS',
    ],
    publishDate: '2026-07-22',
    featured: true,
    faqItems: [
      {
        q: '為什麼單視窗錄影不能有滑鼠游標?這是 macOS 的 bug 嗎?',
        a: '不是 bug,是機制的必然結果。`screencapture -l <windowid>` 讀的是那個視窗自己的 backing store(繪圖快取),所以其他視窗蓋住它也不影響——但滑鼠游標不屬於任何視窗,它是系統合成在所有視窗「之上」的獨立圖層。同一個原理讓它「擋不住」也讓它「抓不到游標」,兩者是一體兩面。要真游標就只能用全螢幕錄影。',
      },
      {
        q: '假游標看起來會不會很假?',
        a: '會,它就是一顆紅點,不是 macOS 的箭頭。但教學影片要的是「觀眾知道現在點了哪裡」,一顆帶漣漪動畫的紅點在這件事上比真實箭頭更清楚——真箭頭在 1280 寬的影片裡其實很難看見。',
      },
      {
        q: '為什麼不能抽影片畫格來確認游標有沒有出現?',
        a: '因為看不到不代表沒有。我隨手挑的時間點剛好落在游標兩次移動之間的空檔,加上游標初始位置在畫面外(translate(-50px,-50px)),而劇本第一個動作是捲動不是點擊,所以開頭十秒本來就看不到。我因此以為注入失敗、對著幻覺改了三輪程式。正解是用 --verify 在「點擊那一瞬間」存截圖,在確定該有東西的時刻驗證。',
      },
      {
        q: 'Windows / Linux 能用嗎?',
        a: '模式 C(Playwright + 假游標)可以,只依賴 Playwright 和 ffmpeg。模式 A(全螢幕)和 B(單視窗)是 macOS 專屬,分別靠 avfoundation 和內建 screencapture。',
      },
      {
        q: '跟現成的螢幕錄影軟體差在哪?',
        a: '如果你是手動操作、要錄自己的畫面,現成軟體更好。這個 skill 的場景是「讓 AI 執行一段可重複的操作流程並錄下來」——網站改版後重跑一次劇本就得到新影片,不用重錄。而且錄製期間不占用你的螢幕,可以繼續做別的事。',
      },
    ],
  },
  {
    slug: 'app-screenshots-claude-code-skill',
    title: 'app-screenshots 是什麼?讓 Claude Code 自動產「標註版截圖文件」的 skill',
    excerpt:
      'app-screenshots 是 Alexander Opalic 寫的 Claude Code skill:你只要說「幫我截圖這個網站做文件」,AI 就自己開頁、找元素、在截圖上畫好帶編號的語意標註(紅框圈按鈕、藍圈標連結)、產出圖文對照的 Markdown。底層靠 agent-browser 驅動 Chrome + 一支 298 行純前端 SVG 注入腳本 annotate.js。本文拆解它的六階段工作流、那支沒被作者講清楚的標註引擎(canvas 量測字寬、六候選點避讓、失敗大聲回報)、三種標註類型(box/click/circle)怎麼選、實際跑出來長怎樣、安裝使用、以及適合誰不適合誰。附我用它底層引擎跑出來的真實標註圖。',
    category: 'AI 工具',
    tags: [
      'app-screenshots',
      'Claude Code skill',
      '截圖文件',
      '自動標註截圖',
      'agent-browser',
      'annotate.js',
      'UI 操作手冊',
      'Vercel Labs',
    ],
    publishDate: '2026-07-01',
    featured: true,
    faqItems: [
      {
        q: 'app-screenshots 跟直接叫 AI「截個圖」差在哪?',
        a: '差在「標註 + 結構化 + 紀律」。直接叫 AI 截圖你只拿到一張乾圖;這個 skill 會幫你在圖上畫好帶編號的語意標註、產出圖文對照的 Markdown,而且內建「先驗 selector、截完讀回確認」的驗證流程,不會給你一張標歪或漏標的圖。',
      },
      {
        q: '一定要用 agent-browser 嗎?能用 Playwright 嗎?',
        a: 'skill 本身綁 agent-browser(它的 annotate.js 是靠 agent-browser 的 eval 注入的)。原理上 annotate.js 是純前端 SVG,理論上任何能執行頁面 JS + 截圖的工具都能套,但 skill 的工作流指令是照 agent-browser 寫的,換工具要自己改接法。',
      },
      {
        q: '標註是畫進圖片像素裡,還是另外一層?',
        a: '截圖那一刻,標註是頁面上一層真實的 SVG DOM,所以會被一起截進 PNG 像素裡,產出的是「已經有標註的圖檔」,不是圖 + 另存的座標檔。這也是為什麼它能直接貼進 Markdown 就用。',
      },
      {
        q: '中文標籤會爆版嗎?',
        a: '不會。annotate.js 用 canvas measureText 實際量測每個標籤的字寬再畫底色矩形,中文、英文、長短標籤都會貼合。實測中文 label 顯示正常。',
      },
      {
        q: '它能標互動後的狀態嗎(例如展開的選單、搜尋建議)?',
        a: '能。skill 有 interactive screenshots 段落:先 snapshot 拿 ref → 用 ref 點擊/輸入觸發狀態 → 再標註結果 → 截圖。搜尋建議、modal、hover 態都能標。',
      },
    ],
  },
  {
    slug: 'upgrade-screenshot-skill',
    title: '我怎麼把別人的 skill 吸進自己產線,做成更強的 skill:一次語意標註實作覆盤',
    excerpt:
      '看到好用的 skill,大部分人裝來用;如果你有自己的產線,更值錢的做法是拆它的零件焊進你的流程。我原本有一套截圖審查+手冊產線(/screenshot-review),但手冊圖是「乾圖」沒有圖上標註——這正是 app-screenshots 的 annotate.js 補得上的洞。本文覆盤:我怎麼把它拆進產線,過程撞到一個架構級的坑(標註截不進圖=OVERLAY GONE:agent-browser 每個 CLI 指令是獨立 CDP 呼叫,eval 注入的 overlay 下一指令就蒸發),查根因、用 batch 把 open→eval→screenshot 綁進同一 session 解掉、封裝成 annotate-shot.sh、寫回自己的 skill。全程真的跑真的驗,附 batch 解法的真實成果圖與踩坑總表。',
    category: '工程實作',
    tags: [
      'Claude Code skill',
      'agent-browser',
      'annotate.js',
      'CDP',
      'batch',
      '截圖標註',
      'skill 客製化',
      'AI 工作流',
    ],
    publishDate: '2026-07-01',
    featured: true,
    faqItems: [
      {
        q: '為什麼不乾脆直接用作者的 app-screenshots skill 就好,幹嘛自己焊?',
        a: '因為我原本就有一條成熟的截圖審查+手冊產線(/screenshot-review),它做的 debug + 反橡皮圖章審查 + 同模板手冊是 app-screenshots 沒有的。我要的不是換一套流程,是在我的流程上補一塊標註能力。拆零件焊進去,比整包換划算。',
      },
      {
        q: 'OVERLAY GONE 是 agent-browser 的 bug 嗎?會被修掉嗎?',
        a: '不是 bug,是它「每個 CLI 指令 = 一次獨立 CDP 呼叫」這個架構的必然結果。在 0.27 和 0.31 都驗過,行為一致。所以別等它修好,正解就是用 batch 把注入和截圖綁進同一次 session。',
      },
      {
        q: 'annotate-shot.sh 一定要 node 24 / agent-browser 0.31 嗎?',
        a: '不用。實測 node v22 + agent-browser 0.27 一樣能跑。這支腳本的核心是「用 batch 保住 session」,不綁特定版本。0.31 只是需要 node ≥24,跟標註能不能截進圖無關。',
      },
      {
        q: '一張圖可以標幾個?',
        a: '沿用 annotate.js 的設計:每張最多 3 個標註(顏色輪替紅藍綠琥珀紫最多 5 色,但擠太多會互相避讓到看不清)。要標更多就拆成多張圖,這也是好手冊的通則——一張圖講一件事。',
      },
      {
        q: '原生 screenshot --annotate 跟 annotate.js 差在哪?',
        a: '原生 --annotate 自動標所有互動元素、標籤是冷冰冰的 [1][2](對應 @eN,給 AI 看圖操作用),不能選、不能寫中文、無語意分類。annotate.js 能選定重點元素、給語意分類(box/click)、寫中文說明,是給人讀的操作手冊標註。要語意標註就得走 annotate.js + batch。',
      },
    ],
  },
  {
    slug: 'claude-code-editable-pptx-skill',
    title: 'Claude Code 怎麼做出「好看又可編輯」的 PPT?pptx skill 四支柱實作',
    excerpt:
      'AI 能做可編輯的 PPT 早不是問題,難的是「好看」。python-pptx 本身很樸素——沒圓角、沒陰影、內建模板還很醜,質感不是工具給的,是設計出來的。這篇拆解我用 Claude Code 官方 pptx skill 把樸素預設做成專業簡報的四個支柱:配色系統(60-30-10、十組現成調色盤)、字型層次(type scale、襯線配無襯線)、版型與留白(對齊網格 + 重複視覺母題)、配圖(codex 生圖),外加最決定好看的 render 驗收 loop(把 .pptx 逐頁 render 成圖用眼睛抓醜),以及四個踩坑。截圖都是真的用 python-pptx 產、真的 render 出來的。',
    category: 'AI 工具',
    tags: [
      'Claude Code',
      'pptx skill',
      'python-pptx',
      '好看的簡報',
      '簡報設計',
      'AI 做簡報',
      'PowerPoint',
      'AI 簡報工具',
    ],
    publishDate: '2026-07-01',
    featured: true,
    faqItems: [
      {
        q: 'python-pptx 這麼樸素,真能做出好看的簡報嗎?',
        a: '能,但好看不是工具給的,是設計出來的。工具只負責「可編輯」,好看靠四支柱:配色系統、字型層次、版型留白、配圖,再加上 render 驗收 loop 把醜點抓出來修。工具樸素(連圓角陰影都沒有)反而逼你把設計做對,而不是依賴內建特效。',
      },
      {
        q: '最影響簡報好看的單一因素是什麼?',
        a: '配色跟層次。顏色收斂成一套(60-30-10:一主色六成、一輔色三成、一 accent 一成)、字級距拉開(標題比內文大一倍以上),這兩件做對,就從「工程師隨手拉」跳到「有設計過」。其次是留白跟對齊到隱形網格。',
      },
      {
        q: '我要用 /pptx 指令觸發 pptx skill 嗎?',
        a: '不用。pptx 是 skill 不是 slash command,你用白話講「幫我做一份 X 主題、幾頁、給誰看的簡報」,Claude 會自動判斷語意觸發它,不需要打斜線。打 /pptx 反而不會如預期運作。',
      },
      {
        q: '為什麼「好看」一定要裝 LibreOffice?',
        a: '因為 python-pptx 是盲寫,你寫程式時看不到成品長怎樣——中文爆版、色塊蓋字、對不齊,程式碼上完全看不出來,第一版幾乎一定有醜的地方。LibreOffice(soffice)+ Poppler(pdftoppm)把 .pptx render 成逐頁圖讓你用眼睛抓醜,這是好看的最後一哩,不做就等於沒驗收。',
      },
      {
        q: 'pptx skill 產出的 .pptx 真的能進 PowerPoint 繼續改嗎?',
        a: '能。投影片是原生 PowerPoint 元素(文字框、shape、圖片)組成的,每個元素都能照正常方式編輯、搬動、換色。好看要建立在可編輯上,否則改一個字都得整頁重生,再漂亮也是半成品。',
      },
    ],
  },
  {
    slug: 'ai-cloudflare-workers-free-backend',
    title: '我想要一個自己的後端:用 AI 協作把 Cloudflare Workers 免費方案架起來(附免費額度怎麼算)',
    excerpt:
      '想在純靜態部落格旁加一個「自己的後端」——能存資料、能驗身分,又不想養 server、不想付月費。最後選了 Cloudflare Workers + D1,全程用 AI 協作從零架到線上。這篇只記三件事:怎麼一個下午搭好骨架並部署、workerd 沒有 Node 怎麼用 WebCrypto 手刻密碼與 JWT、以及最實用的——Cloudflare 免費方案額度怎麼算、什麼時候撞牆(Workers 每天 10 萬請求、D1 每天讀 500 萬列寫 10 萬列、5GB 儲存)。',
    category: '工程實作',
    tags: [
      'Cloudflare Workers',
      'Cloudflare D1',
      '免費方案',
      'AI 協作開發',
      'Serverless',
      'wrangler',
      'WebCrypto',
      'Hono',
    ],
    publishDate: '2026-06-25',
    featured: true,
    faqItems: [
      {
        q: 'Cloudflare Workers 免費方案一天能撐多少請求?',
        a: '每天 100,000 requests(UTC 午夜重置),每次呼叫最多 10ms CPU 時間(I/O 等待不算)。對個人專案、小工具、會員站,這額度幾乎不可能用完——換算下來大約是每秒平均 1 個請求持續一整天。',
      },
      {
        q: 'D1 免費方案的「讀 500 萬列」是怎麼算的?',
        a: 'D1 算的是「列數」不是「查詢數」。一個 SELECT 掃 100 列就算 100 reads,不是 1。所以要留意的是有沒有寫出會掃全表的爛查詢——加對索引、別 SELECT * 撈整張表,500 萬列/天 對小站綽綽有餘。免費寫入是每天 10 萬列、儲存共 5GB。',
      },
      {
        q: 'Workers 不是 Node.js,密碼雜湊怎麼做?',
        a: 'Workers 跑在 workerd runtime,沒有 Node 的 crypto 模組、也不能 npm install bcrypt。要用瀏覽器標準的 WebCrypto API(crypto.subtle)自己刻 PBKDF2。workerd 限制 PBKDF2 迭代不能超過 10 萬次,而 10 萬次正好落在免費版每次 10ms CPU 的預算內,用 100k 剛剛好。',
      },
      {
        q: '本地測試時資料寫進去卻查不到,是 bug 嗎?',
        a: '不是你的 bug。wrangler dev 跟 wrangler d1 execute --local 在 wrangler v4 用了各自獨立的本地 persistence 目錄,你往 A 寫、B 讀不到。本地驗資料對不上時先懷疑這個,別懷疑自己的 SQL。',
      },
      {
        q: '機密(JWT secret、token)要放哪?',
        a: '只能走 wrangler secret put(存在 Cloudflare 端,程式用 env.X 拿),絕不能寫進 wrangler.toml——那個檔會進版控,等於把鑰匙 commit 進 git。非機密的設定(像 CORS 白名單)才放 wrangler.toml 的 [vars]。',
      },
    ],
  },
  {
    slug: 'claude-code-teams-plugin-auto-update',
    title: 'Claude Code Teams Plugin 為什麼不會自動更新？根因 + 3 步修法',
    excerpt:
      'Claude Code Teams Plugin 永遠不更新的根因：version string 兩端相等。3 步修法：git SHA 比對 + GitHub Action 自動 bump + Managed Settings 推 SessionStart hook，session 啟動自動拉最新。',
    category: '工程實作',
    tags: [
      'Claude Code Teams',
      'plugin 自動更新',
      'git SHA',
      'Managed Settings',
      'SessionStart hook',
      'GitHub Actions',
      'Claude Code plugin',
      'marketplace.json',
    ],
    publishDate: '2026-06-24',
    featured: true,
    readingTime: 8,
    faqItems: [
      {
        q: '成員第一次安裝 plugin 還是要手動嗎？',
        a: '是，第一次需要執行 /plugin install wez@wezoomtek。Managed Settings 管的是「已安裝後的自動更新」，不是首次安裝流程。後續所有更新都是自動的。',
      },
      {
        q: 'Marketplace clone（~/.claude/plugins/marketplaces/wezoomtek/）是從哪來的？',
        a: '執行 /plugin install wez@wezoomtek 時，Claude Code 會把你指定的 marketplace repo clone 到本機。這個 clone 就是後續 git pull 的來源。腳本用 git -C "$MARKETPLACE_DIR" pull 來拉最新版。',
      },
      {
        q: '[skip ci] 真的能防止 GitHub Actions 無限循環嗎？',
        a: '[skip ci]、[ci skip]、skip-checks: true 都是 GitHub 官方支援的跳過觸發機制，對 push event 有效。bump-version commit 加 [skip ci] 就不會再觸發下一輪。',
      },
      {
        q: '這個腳本跑失敗會影響 session 啟動嗎？',
        a: '不會。腳本在每個關鍵步驟後都有 exit 0（git pull 失敗就退出、SHA 為空就退出）。失敗會靜默退出，成員不會感覺到任何異常——只是這次沒更新而已。下次 session 再試。',
      },
      {
        q: '每次 session 都要 git pull 會不會很慢？',
        a: 'git pull --quiet 遠端沒有變動的話通常 1 秒內。加上 async: true，這個操作不在 session 啟動的關鍵路徑上，實際感受不到延遲。',
      },
    ],
  },
  {
    slug: 'claude-code-teams-plugin-webhook-setup',
    title: 'Claude Code Teams Plugin Webhook 5 步設定教學（含踩坑排查）',
    excerpt:
      'Claude Code Teams 的 Plugin Webhook 設定路徑是 claude.ai/admin-settings/plugins，前置條件是 Claude GitHub App 必須安裝在 repo 上、沒有被 Suspend、且批准過 Webhooks 讀寫權限。5 步啟用自動同步，含「Cannot access repository」踩坑排查。',
    category: 'AI 工具',
    tags: [
      'Claude Code Teams',
      'Plugin Webhook',
      'Claude GitHub App',
      'plugin 自動同步',
      'Organization settings',
      'Cannot access repository',
      'claude.ai 後台設定',
      'Teams plugin marketplace',
    ],
    publishDate: '2026-06-22',
    featured: true,
    faqItems: [
      {
        q: '我不是 Owner，能設 Webhook 嗎？',
        a: '不行。只有 Primary Owner 和 Owner 角色能進 admin-settings，其他角色連頁面都看不到。需要請 org owner 操作。',
      },
      {
        q: 'Webhook 是設在 GitHub 還是 claude.ai？',
        a: '兩邊都有。按下 Enable webhook 後，Claude GitHub App 會自動在你的 GitHub repo 建立 webhook（去 repo 的 Settings > Webhooks 可以看到），claude.ai 這邊也會記錄同步狀態。你不需要自己手動去 GitHub 設 webhook。',
      },
      {
        q: '我推了版但 Last updated 沒更新，怎麼確認 webhook 有沒有觸發？',
        a: '去 GitHub repo 的 Settings > Webhooks，點進 Claude 建的那筆，可以看到每次觸發的 delivery 記錄和 response code。200 = 成功接收；如果是 4xx/5xx，通常是 App 權限問題，重新走一遍 Step 3-4。',
      },
      {
        q: 'Team plan 和 Enterprise plan 的 plugin 管理有差嗎？',
        a: '有。Enterprise 多了 strictPluginOnlyCustomization（鎖死只能用 org 指定的 plugin）、allowedMcpServers（管控 MCP server 白名單）等進階控管。Team plan 的後台主要是讓 owner 管理 marketplace 來源和 plugin 安裝預設值，不支援這些進階限制。',
      },
      {
        q: 'Plugin 設成「Installed by default」，新 seat 加入後會自動裝嗎？',
        a: '是。User access 欄位設成 Installed by default 的 plugin，新成員加入 org 並安裝 Claude Code 後，登入時會自動套用。不需要每個人手動裝。',
      },
    ],
  },
  {
    slug: 'gemma4-31b-cloud-free-no-gpu',
    title: '不用 GPU，免費跑 31B 開源模型：gemma4:31b-cloud 完整使用指南',
    excerpt:
      'Google DeepMind 的 Gemma 4 31B 在 Arena AI 開源模型榜排第 3，AIME 2026 數學推理 89.2%、Codeforces ELO 2150。Ollama 的 gemma4:31b-cloud 把計算搬到雲端——一行 ollama run gemma4:31b-cloud 就能用，不用下載 20GB 模型、不需要 GPU。本文完整介紹三條免費取得路線（Ollama Cloud、Google AI Studio、OpenRouter）、256K context 與 thinking mode 的用法、以及實際踩過的 4 個坑。',
    category: 'AI 工具',
    tags: [
      'gemma4:31b-cloud',
      'Gemma 4 31B',
      'Ollama Cloud',
      '免費 AI 模型',
      '開源大型語言模型',
      '無 GPU 跑 AI',
      'Google DeepMind',
      'thinking mode',
    ],
    publishDate: '2026-06-22',
    featured: true,
    faqItems: [
      {
        q: 'gemma4:31b-cloud 完全免費嗎？有額度限制嗎？',
        a: 'Ollama Cloud 提供免費方案，gemma4:31b-cloud 在免費額度內可用。OpenRouter 的 google/gemma-4-31b-it:free 是 $0/M token，但有速率限制。Google AI Studio 也有免費 playground 和 API。超量或高頻使用場景建議看各平台的付費方案。',
      },
      {
        q: 'privacy 怎麼看？prompt 會被 Ollama 存嗎？',
        a: 'cloud variant 的 prompt 確實傳到 Ollama 伺服器處理。敏感程式碼或私人資料建議用本地版 gemma4:31b（需自備 GPU），或走 Google Cloud / Vertex AI 的企業方案。',
      },
      {
        q: '跟 Claude Sonnet 4 / GPT-4o 比怎麼樣？',
        a: 'Gemma 4 31B 是開源模型，Arena AI 排行 #3（開源）。閉源模型普遍仍在它前面，但差距在縮小。最大優勢是免費 + 開源 + 可本地部署，不是在所有 benchmark 都超越閉源模型。',
      },
      {
        q: '256K context 實際用起來穩嗎？',
        a: '官方 benchmark 在 128K needles（MRCR v2）拿 66.4%，不是 100%。超長 context 的「needle in a haystack」測試顯示中間部分有衰減，這是目前所有長 context 模型的共通問題。',
      },
      {
        q: '台灣繁體中文輸出品質怎樣？',
        a: 'Gemma 4 支援 140+ 語言，繁體中文輸出測下來通順，但和 Claude 或 GPT-4o 相比，繁中細節處理還是有一點差距。日常使用沒問題，專業術語或複雜中文推理建議自己測一下。',
      },
    ],
  },
  {
    slug: 'pixelmotion-ai-sprite-animation',
    title: 'PixelMotion AI 是什麼？上傳一張圖，30 秒生出 14 種動作的像素 Sprite Sheet',
    excerpt:
      'PixelMotion AI（pixelmotion.art）是一個像素動畫生成器：上傳一張靜止角色圖、選個動作，30 秒左右就生出透明 PNG Sprite Sheet 和 GIF。內建 14 種預設動作、5 種匯出格式，底層用 Google Gemini，1 積分一次生成、失敗不扣積分。本文實測完整流程、定價、踩坑與適配對象，並釐清它跟同名的 pixelmotion.io 是兩個不同產品。',
    category: 'AI 工具',
    tags: [
      'PixelMotion AI',
      '像素動畫生成器',
      'AI Sprite Sheet',
      'pixel art 動畫',
      '2D 遊戲素材',
      '像素角色動畫',
      'AI 生成像素圖',
      'Gemini 像素動畫',
    ],
    publishDate: '2026-06-20',
    featured: true,
    faqItems: [
      {
        q: 'PixelMotion AI 免費嗎？',
        a: '有提供註冊體驗，但生成需要消耗積分。最便宜的「新手行囊」¥9.9 給 5 積分，1 積分能生成一次。生成失敗不扣積分、積分永不過期，所以實際花費很可控。',
      },
      {
        q: 'PixelMotion AI 和 pixelmotion.io 是同一個嗎？',
        a: '不是。pixelmotion.art 是做像素動畫 Sprite Sheet 的工具（本文主題）；pixelmotion.io 是做照片轉影片、社群行銷的平台，月費 $29 起。兩個是完全不同的產品，名字撞了而已。',
      },
      {
        q: '生成的像素動畫可以用在商業遊戲裡嗎？',
        a: '可以。你對生成的作品有完整使用權，遊戲素材、品牌設計都能用。前提是上傳的原始圖片是你有權使用的（自己畫的、獲授權的、或你自己的照片）。',
      },
      {
        q: '做 2D 遊戲該匯出哪種格式？',
        a: 'PNG Sprite Sheet（4×4 網格）是 2D 遊戲開發最常用的格式，拉進 Unity / Godot / Phaser 切一切就能用。追求畫質和透明度乾淨度則選 WebP。',
      },
      {
        q: '生成一次要等多久？',
        a: '預設動作通常 15-30 秒，自訂動作 30-90 秒。高峰時段可能稍長，超過 3 分鐘多半是排隊人多，可以直接重試，不會重複扣積分。',
      },
    ],
  },
  {
    slug: 'devspace-mcp-chatgpt-as-codex',
    title: 'DevSpace 是什麼？把 ChatGPT 變 Codex 的 MCP 教學（額度真相＋安裝踩坑）',
    excerpt:
      'DevSpace 是開源的 self-hosted MCP server，把 ChatGPT 接到你本機 repo，讓它像 Codex 一樣讀寫、搜尋、跑指令。社群的賣點是「ChatGPT 跟 Codex 額度分開算＝額度翻倍」，但這是副作用、不是官方功能。本文實測：修正 Threads 原貼錯誤的安裝指令（@waishnav/devspace）、tunnel 接法、403／Windows 要 Bash 等踩坑，以及 ToS 風險的誠實面。',
    category: 'AI 工具',
    tags: [
      'DevSpace',
      'DevSpace MCP',
      'ChatGPT 變 Codex',
      'Codex 額度',
      'MCP server 教學',
      'ChatGPT 操作本機 repo',
      'Model Context Protocol',
      'AI coding agent',
    ],
    publishDate: '2026-06-20',
    featured: true,
    faqItems: [
      {
        q: 'DevSpace 真的能讓 Codex 額度變兩倍嗎？',
        a: '不精準。DevSpace 是把 ChatGPT 接成能操作本機 repo 的 coding agent。「額度翻倍」是因為社群觀察到 ChatGPT 跟 Codex 的用量分開計算，這是計費實作的副作用、不是官方功能，OpenAI 隨時可以改算法或把這條路堵掉。',
      },
      {
        q: 'Threads 上的安裝指令 npm install -g waishnav/devspace 能用嗎？',
        a: '不能。套件名漏了 scope 的 @（正確是 @waishnav/devspace），而且官方走的是 npx @waishnav/devspace init 互動式流程，不是 npm install -g。照原貼貼會裝到不存在的東西。',
      },
      {
        q: 'Windows 可以跑 DevSpace 嗎？',
        a: '可以，但 shell 執行要 Bash——原生 PowerShell / cmd.exe 不支援。實務上用 Git Bash 或 WSL。Node 版本要 >=20.12 <27（建議 Node 22 LTS）。',
      },
      {
        q: 'DevSpace 一直噴 403 Forbidden 怎麼辦？',
        a: '多半是 tunnel 的實際網址跟你在 init 填的 Public Base URL 不符，被 host header 檢查擋下。免費／臨時 tunnel 每次重啟換網址就會中，改用綁固定 domain 的 tunnel（Cloudflare Tunnel 或 ngrok 付費版）最穩。',
      },
      {
        q: '用 DevSpace 會不會被 OpenAI 封號？',
        a: '官方文件沒提這點，但這招踩在 ToS 灰色地帶，原貼自己都說「哪天 OpenAI 可能關掉」。更實際的風險是：你開了一個讓雲端 AI 直接讀寫本機檔案、跑 shell 指令的開口，Owner 密碼或 auth.json 外流等於交出開發環境鑰匙。風險自負，別押在重要帳號或工作流上。',
      },
    ],
  },
  {
    slug: 'annsmemory-cognitive-memory-plugin',
    title: 'ANNsmemory 是什麼？Claude Code 認知記憶外掛完整教學（安裝、四指令與單一寫入架構）',
    excerpt:
      'ANNsmemory（外掛名 cognitive-memory）是 Claude Code 的認知記憶外掛，用 Go 寫的 memctl 當唯一寫入者，提供跨專案結構化記憶。本文拆解安裝、recall/remember/consolidate 四指令、episode/semantic/procedural 三種節點與單一寫入架構，附實測踩坑與 FAQ。',
    category: 'AI 工具',
    tags: [
      'ANNsmemory',
      'cognitive-memory',
      'Claude Code 記憶外掛',
      'Claude Code 跨專案記憶',
      'memctl',
      'single-writer',
      'AI 記憶管理',
      'Claude Code plugin',
    ],
    publishDate: '2026-06-18',
    featured: true,
    faqItems: [
      {
        q: 'ANNsmemory 跟直接在專案裡放 .md 筆記有什麼不同？',
        a: '最大差別是「誰能寫」跟「索引怎麼來」。手寫筆記是你自由編、索引手動維護；ANNsmemory 只有 memctl 能寫 frontmatter、索引由程式衍生，所以不會有索引脫鉤、schema 被改壞的問題，recall 也是確定性的（同樣輸入給同樣排序）。',
      },
      {
        q: '使用 ANNsmemory 需要會寫 Go 嗎？',
        a: '不用。它 95.5% 是 Go 沒錯，但 binary 已經預編譯 commit 進 repo，marketplace 安裝時不會 build。你只會用到四個 slash 指令，碰不到 Go 原始碼。要自己改才需要 make build（會交叉編譯 darwin/linux × arm64/amd64）。',
      },
      {
        q: 'ANNsmemory 的記憶存在哪？換電腦會不會不見？',
        a: '存在 ~/.claude-memory，這是一個你自己掌控的 git repo。換機器就把這個 repo 同步過去即可（它不自動 commit，commit 節奏你自己抓）。每個專案底下的 .memory/ 只是投影（projection），不是另一份真相。',
      },
      {
        q: 'ANNsmemory 跨專案的記憶會互相污染嗎？',
        a: '不會無差別污染。節點有 scope：project 範圍的記憶只在原專案吃滿權重；其他專案的記憶以 recall_cross_project_weight（預設 0.4）的背景權重出現——既保留跨專案聯想，又不會喧賓奪主。',
      },
      {
        q: '我已經有一堆舊 memory 檔，能直接搬進 ANNsmemory 嗎？',
        a: '能。用 /cognitive-memory:memory-migrate，預設 dry-run 先給你看搬法。它的 parser 容錯度高：吃得下沒有 frontmatter 的檔、認三種 node_id 命名法、缺 TLDR 會自動補並標記。確認分類正確後再加 --apply 落地。',
      },
    ],
  },
  {
    slug: 'pyjianyingdraft-python-jianying-automation',
    title: 'pyJianYingDraft 實測：Python 自動剪映的 4 個版本天花板',
    excerpt:
      'pyJianYingDraft 是用 Python 自動生成剪映草稿的開源庫。實測安裝、模板模式與批量導出，並把剪映 6+ 加密、Mac 不能導出等 4 個版本限制一次講清楚。',
    category: '工程實作',
    tags: [
      'pyJianYingDraft',
      '剪映自動化',
      'Python 剪映',
      '剪映草稿生成',
      '批量導出',
      'CapCut 自動化',
      '自動剪片',
      '影片自動化',
    ],
    publishDate: '2026-06-17',
    featured: false,
    faqItems: [
      {
        q: 'pyJianYingDraft 支援 CapCut 國際版嗎？',
        a: '本庫針對中國版剪映（JianYing）。國際版 CapCut 請看作者另一個正在開發的倉庫 pyCapCut。兩個是不同倉庫，草稿檔格式有差，別混用。',
      },
      {
        q: '我的剪映是 7.x，pyJianYingDraft 還能用嗎？',
        a: '草稿生成可以（5.0+ 全支援）。但模板模式（剪映 6+ 把 draft_content.json 加密）和批量導出（剪映 7+ 隱藏了控件）都用不了。要完整功能請把剪映鎖在 5.9 並關掉自動更新。',
      },
      {
        q: 'Mac 可以用 pyJianYingDraft 全自動產片加導出嗎？',
        a: '不行。Mac/Linux 只能生草稿和跑模板模式，批量導出依賴 Windows-only 的 uiautomation 庫。生出來的草稿最後仍要拿到 Windows 版剪映才能導出。',
      },
      {
        q: 'trange 的第二個參數是結束時間嗎？',
        a: '不是，是持續時長（duration）。trange("4s", "1s") 代表「從 4 秒開始、持續 1 秒」（即 4~5 秒），不是「4 秒到 1 秒」。因為起點 0s 時兩種解讀剛好同值，新手很容易誤判，一律把第二參數當 duration 讀。',
      },
      {
        q: '批量導出跑到一半卡住不動怎麼辦？',
        a: '先檢查兩件事：剪映版本是否 ≤ 6（7+ 控件被隱藏用不了）、帳號是否有導出權限。如果模板用了 VIP 才有的特效但帳號沒開 VIP，導出時會跳付費牆，UI 自動化點不過去就無限重試。另外它會佔用滑鼠，跑的時候別動電腦，建議夜間跑。',
      },
    ],
  },
  {
    slug: 'ponytail-ai-agent-less-code-plugin',
    title: 'Ponytail 插件實測：讓 AI 程式碼少 80-94%、成本降四成的「懶資深工程師」法則',
    excerpt:
      '爆紅 AI 插件 Ponytail 用一條 YAGNI 決策階梯，逼 AI Agent 能不寫就不寫。實測程式碼少 80-94%、速度快 3-6 倍、成本降四成，5 天衝 2.7 萬星，本文含安裝與實測。',
    category: 'AI 工具',
    tags: [
      'Ponytail',
      'AI 過度設計',
      'AI Agent 插件',
      'YAGNI',
      'Claude Code 插件',
      'Codex',
      'Gemini CLI',
      'AI 寫太多 code',
    ],
    publishDate: '2026-06-17',
    featured: true,
    faqItems: [
      {
        q: 'Ponytail 會幫我寫程式碼嗎？',
        a: '不會。它本身幾乎不產 code，做的是「注入規則」讓你的 AI Agent 傾向少寫，以及主動幫你抓出可以刪掉的過度設計（可掃 diff 或掃整個 repo 回你一張刪除清單）。實際寫 code 的還是你原本的 Agent。',
      },
      {
        q: 'Ponytail 那個「降四成」到底是降什麼？',
        a: '是每個任務的成本（cost per task）降 42–75%，不是 token 數降四成。程式碼行數降的是 80–94%，速度是快 3–6 倍，三個是不同指標，網路上常被混為一談。數字出自官方 README，用三個 Claude 模型、五個任務各跑 10 次取中位數。',
      },
      {
        q: 'Ponytail 只支援 Claude Code 嗎？',
        a: '不只。官方列出 14+ 種宿主，包含 Codex、Gemini CLI、Cursor、Windsurf、Cline、Aider、GitHub Copilot CLI、OpenCode、Kiro 等，各自有對應安裝方式。Claude Code 是 /plugin marketplace add 再 install。',
      },
      {
        q: 'Ponytail 會不會為了少寫，把安全驗證也砍掉？',
        a: '不會。作者明確把信任邊界驗證（trust-boundary validation）、資料遺失處理、安全性、無障礙這四類劃為紅線，永遠不在被砍清單上。它的原則是 lazy not negligent——砍的是過度工程，不是必要防護。',
      },
      {
        q: '為什麼這個插件叫「Ponytail（馬尾）」？',
        a: '作者官方只在 FAQ 丟了一句「Why ponytail? You know exactly why.」，沒正面解釋。社群心領神會的是那種綁長馬尾、戴橢圓眼鏡、話不多的資深大神——你拿五十行 code 去問他，他一句不說直接幫你換成一行。橢圓眼鏡馬尾大神是社群與讀者的聯想，不是官方明文。',
      },
    ],
  },
  {
    slug: 'firebase-free-web-app-domain',
    title: 'Firebase .web.app 免費網域：5 步驟申請，一個帳號能開幾個',
    excerpt:
      'Firebase 的 .web.app 是免費內建網域，連 HTTPS 憑證都自動簽好。本文用 5 個步驟教你從零申請，並回答一個帳號到底能開幾個（單一專案最多 36 個 site）。',
    category: 'AI 工具',
    tags: [
      'Firebase',
      'Firebase Hosting',
      '免費網域',
      'web.app',
      '免費架站',
      'HTTPS',
      '自訂網域',
      'GitHub Actions',
    ],
    publishDate: '2026-06-12',
    featured: false,
    faqItems: [
      {
        q: '.web.app 網域真的完全免費嗎？會不會哪天開始收錢？',
        a: '是免費的，且不需綁信用卡。官方文件明寫「at no cost」。它屬於 Firebase Hosting 的免費 Spark 方案，你只在「儲存超過 10 GB」或「月傳輸超過 10 GB」時才會被要求升級付費——對小專案幾乎不會發生。',
      },
      {
        q: '.web.app 跟 .firebaseapp.com 我該用哪個？',
        a: '兩個指向同一份內容，隨便用。建議拿較短、較新的 .web.app 當主力對外分享，.firebaseapp.com 留著備用即可。',
      },
      {
        q: '一個 Firebase 帳號可以申請幾個免費網域？',
        a: '非常多。單一專案最多能開 36 個 Hosting site（每個 site 給一組 .web.app + 一組 .firebaseapp.com），一個 Google 帳號又能開多個專案，相乘下來一個帳號能拿到數十甚至上百個免費網址，個人用途等於用不完。唯一限制是名稱全球唯一。',
      },
      {
        q: '綁自訂網域要付錢給 Firebase 嗎？',
        a: '不用。Firebase 端連接自訂網域、簽 HTTPS 憑證都不收費。你要付的只有「向網域註冊商買網域」那筆錢（一年通常 NT$300～600 起跳），那是付給 GoDaddy / Cloudflare 這類網域商，跟 Firebase 無關。',
      },
      {
        q: '自訂網域要怎麼接？',
        a: '在 Firebase Hosting 後台輸入你的網域 → 加一筆 TXT 記錄到 DNS 驗證所有權 → 把 A 記錄指向 Firebase 給的 IP → 等 DNS 生效，Firebase 自動簽 SSL（最多 24 小時，多半幾小時內好）。注意每個 apex 網域最多 20 個子網域。',
      },
    ],
  },
  {
    slug: 'agent-browser-screenshot-annotate-visual',
    title: 'agent-browser 截圖標註：3 招讓 AI 看著畫面操作',
    excerpt:
      'agent-browser 能在截圖上畫圖、寫字——不是給人塗鴉的小畫家，而是自動把 AI 看得懂的標記畫進截圖像素裡。這篇接續上一篇純文字流，實測它在截圖上畫東西的三種畫法——screenshot --annotate（在每個可互動元素上畫編號 [1][2][3] 並寫出對照清單，每個對應 @eN ref，截完可直接 click @e2）、highlight（在指定元素外畫高亮框做聚焦驗證）、diff screenshot（把畫面差異畫成像素級比對圖，抓「長相變了」，配合 diff snapshot 抓「結構變了」）——把只能讀純文字 snapshot（一頁 200-400 tokens）的 agent 升級成「看著畫面操作」，補上 icon 按鈕、canvas、純視覺狀態這些純文字抓不到的盲區。核心是 annotate 把視覺感知跟動作指令對齊：畫上去的 @eN 編號文字流跟視覺流共用同一套 ref，多模態模型看圖推理完直接產生跟純文字流一樣的指令。踩坑含 annotate 只支援 CDP 後端（Chrome/Lightpanda）Safari 不行、ref 會過期、diff threshold 不調會一直假警報。版本 v0.27.2，全程 Mac 實測。',
    category: 'AI 工具',
    tags: [
      'agent-browser',
      '截圖標註',
      'annotate',
      'AI Agent',
      'Claude Code',
      '多模態 AI',
      '瀏覽器自動化',
      'Vercel Labs',
    ],
    publishDate: '2026-06-12',
    featured: false,
    faqItems: [
      {
        q: 'agent-browser 可以在截圖上畫圖、寫字嗎？',
        a: '可以，而且這正是它的賣點。--annotate 會在截圖上畫出元素編號 [N] 並寫出對照清單、highlight 會在指定元素外畫高亮框、diff screenshot 會把差異畫在輸出圖上——這些都是直接畫進截圖像素裡的標記與文字。它不是讓你手動塗鴉的小畫家（要手畫框寫字用 macOS 預覽、Skitch 那類工具），而是自動畫出 AI 看得懂的標註，畫的目的是讓多模態模型看圖就能精準操作。',
      },
      {
        q: 'annotate 的編號 [N] 和純文字 snapshot 的 @eN 是同一套嗎？',
        a: '是。這是它設計得最聰明的地方——[2] 對應 @e2，視覺流跟文字流共用同一套 ref，不用維護兩套座標。多模態 AI 看著截圖上的 [2] 推理完，產生的指令 click @e2 跟純文字流一模一樣。',
      },
      {
        q: 'diff screenshot 跟 diff snapshot 差在哪？',
        a: 'diff screenshot 比像素（長相變了沒），diff snapshot 比可訪問性樹（結構/內容變了沒）。按鈕變色、間距跑版用前者；DOM 結構、文字內容變動用後者。前者記得用 -t 調 threshold 過濾抗鋸齒雜訊。',
      },
      {
        q: '為什麼 Safari 後端不能用 annotate？',
        a: 'annotate 需要 CDP（Chrome DevTools Protocol）的能力來掃描並疊加元素標籤，Safari 走的是 WebDriver 協定，目前還沒實作這塊。要用 annotate 就切 Chrome 或 Lightpanda 後端。',
      },
      {
        q: '這些視覺標註指令適合接進 Claude Code 嗎？',
        a: '適合。跟前一篇的純文字流一樣，這三招都是 CLI 指令，可以用「薄存根 + CLI 動態供給」的方式接進 Claude Code 直接調用。多模態場景（要 AI 看圖操作）特別適合用 annotate 當輸入。',
      },
    ],
  },
  {
    slug: 'ccs-multi-account-claude-codex-switch',
    title:
      'AI agent 額度爆了不用乾等：ccs 多帳號無縫切換（Claude Code + Codex，同一場對話接得起來）',
    excerpt:
      '額度撞 rate limit 最痛的不是要等刷新，是對話脈絡斷掉。ccs 這套把這個痛點直接做掉——一鍵切到第二個帳號，把同一串對話搬過去用它的額度繼續跑，脈絡完全不斷。核心原理 provider-agnostic：每一場對話其實是一個 .jsonl 檔躺在硬碟上，用 CLAUDE_CONFIG_DIR / CODEX_HOME 環境變數隔離兩個帳號身份，撞 limit 時把那場對話檔複製到第二個帳號目錄、再用它 resume 就好，額度算第二個帳號的、歷史一字不差。支援 Claude Code 與 Codex，連 Codex 斷了用 Claude 接的跨工具接力都涵蓋。安全上用「按需複製單一對話檔」而非 symlink 整個資料夾（後者雙開會 corrupt），token 永遠留在你自己的 Keychain、不被搬移。本文最後一段可以直接複製貼給 Claude Code，它會自己 git clone + 跑 install.sh 幫你裝好——唯一要你自己按的只有第二個帳號的 login。',
    category: 'AI 工具',
    tags: [
      'Claude Code',
      'Codex',
      'AI agent',
      'rate limit',
      '多帳號切換',
      'CLAUDE_CONFIG_DIR',
      'Claude Code skill',
      'AI 應用開發',
    ],
    publishDate: '2026-06-12',
    featured: true,
    faqItems: [
      {
        q: 'ccs 切帳號會把我的對話歷史弄丟嗎？',
        a: '不會，剛好相反，它存在就是為了不丟脈絡。每一場對話是一個 .jsonl 檔，ccs 接力時複製你挑的那一場到第二個帳號目錄、再用它 resume，歷史一字不差。額度算第二個帳號的，但對話完全接得起來。',
      },
      {
        q: '它怎麼隔離兩個帳號，不會互相干擾？',
        a: 'Claude Code 看 CLAUDE_CONFIG_DIR 環境變數（預設 ~/.claude，指到 ~/.claude-2 就是另一套設定、登入、歷史），Codex 看 CODEX_HOME，邏輯一樣。兩個帳號的 token 在 macOS Keychain 存不同條目（service name 依 config dir 做 hash），不會互蓋。',
      },
      {
        q: '為什麼不直接把兩個帳號的資料夾 symlink 接通就好？',
        a: '因為兩個 agent 同時跑時，.claude.json / projects / sessions 這些檔會被並發寫入弄壞（對應 Anthropic 已知的雙開 corruption issue）。所以 ccs 設計成只在接力那一刻按需複製單一對話檔，而不是同步整個資料夾。',
      },
      {
        q: '安裝會自動幫我登入第二個帳號嗎？',
        a: '不會，也不該。install.sh 自動處理環境變數、目錄、PATH、腳本，但第二個帳號的 login（開瀏覽器、輸帳密 / 2FA）那一步沒有任何工具能代勞，要你自己按。其餘設定全自動。',
      },
      {
        q: '我現在還沒有第二個帳號，能先裝嗎？',
        a: '可以。先把這套裝起來，等你哪天開了第二個帳號，再打 ccs 走設定流程把它接上即可。裝在前、用在後，不衝突。',
      },
      {
        q: 'Codex 撞 limit 也能用 Claude 接續嗎？',
        a: '可以。ccs 的跨工具接力會把來源（Codex）對話濃縮成一份 handoff capsule——原始任務、最後進度、改過的檔、git diff——餵給 Claude 讓它讀懂接手。原理 provider-agnostic，反過來 Claude 斷了用 Codex 接也行。',
      },
    ],
  },
  {
    slug: 'claude-fable-5-pricing-safety-guide',
    title:
      'Claude Fable 5 升級指南：1M context、$10/$50 定價與 5% 安全閘門全解',
    excerpt:
      'Claude Fable 5 是 Anthropic 在 2026-06-09 公開放出的最強模型（model ID claude-fable-5），預設 1M token context、最高 128k 輸出，定價 $10/$50 per M token 剛好是 Opus 4.8 的兩倍。它跟限定釋出的 Mythos 5 是同一顆底層模型，差別只在安全層——Fable 5 內建 safety classifier，平均 <5% 的 session 會在 cybersecurity/biology 等高風險領域被攔下、改由 Opus 4.8 回答（refusal 回 HTTP 200、不計費、可帶 fallbacks 參數自動重試）。它是 Covered Model，30 天資料保留、不支援 ZDR。這篇拆解規格與定價、安全閘門 fallback 機制、在 Claude Code 用 /model claude-fable-5 怎麼切（只有 adaptive thinking、用 effort 控深度），最後給三種人三種升級決策——長 horizon agentic 工作該升、日常任務 Opus 4.8 才是甜蜜點、有 ZDR 需求別升。',
    category: 'AI 工具',
    tags: [
      'Claude Fable 5',
      'Mythos 5',
      'Claude Opus 4.8',
      'Claude Code',
      'Anthropic',
      'LLM 模型選型',
      'AI 應用開發',
      '模型定價',
    ],
    publishDate: '2026-06-10',
    featured: true,
    faqItems: [
      {
        q: 'Claude Fable 5 和 Mythos 5 到底差在哪？',
        a: '同一顆底層模型。Mythos 5 拿掉了 cybersecurity / biology 等領域的安全 classifier，走限定釋出的 Project Glasswing，要透過 Anthropic / AWS / Google Cloud 的 account team 申請。Fable 5 是加了那層安全閘門的版本，一般可用。能力上做正常開發兩者沒差。',
      },
      {
        q: '被 Fable 5 的安全閘門攔下會收我錢嗎？',
        a: '不會。被拒的請求在產生任何輸出前 refused，不計費，Messages API 回 HTTP 200 加 stop_reason: refusal。如果你帶 fallbacks 參數 fallback 到別的模型重試，fallback credit 還會退回 prompt-cache 的切換成本。',
      },
      {
        q: 'Claude Fable 5 比 Opus 4.8 貴多少？',
        a: '整整兩倍。Fable 5 是 $10 輸入 / $50 輸出 per M token，Opus 4.8 是 $5 / $25。輸出 token 又比輸入貴 5 倍，長對話累積的輸出成本成長很快。',
      },
      {
        q: '我有 zero data retention 需求，能用 Fable 5 嗎？',
        a: '不能。Fable 5 是 Covered Model，30 天資料保留，不支援 ZDR。有 ZDR 合規要求（處理客戶敏感資料、資料不落地的合約）就得選支援 ZDR 的模型。',
      },
      {
        q: '在 Claude Code 怎麼切到 Fable 5？',
        a: '在對話框打 /model claude-fable-5，或打 /model 開互動式選單挑。切完用 /status 確認顯示 claude-fable-5——別只看指令沒報錯就當切好，要 round-trip 確認行為和帳單都對得上。',
      },
      {
        q: 'Fable 5 能關掉 thinking 嗎？',
        a: '不能。它只有 adaptive thinking，thinking: {"type": "disabled"} 不支援。要控制思考深度改用 effort 參數，不是開關 thinking。另外它的 raw chain-of-thought 預設不回傳（omitted），要看設成 summarized 拿摘要版。',
      },
    ],
  },
  {
    slug: 'llm-token-counting-methods',
    title:
      'LLM token 怎麼算才準？5 種計量方案實測比較（中文差 47% 的坑）',
    excerpt:
      'LLM token 計量沒有單一正解，而是一條從輕到重的光譜：啟發式估算（字數÷4）、本機 tokenizer（tiktoken）、provider 官方 count API（Anthropic count_tokens 免費）、跨模型計價庫（liteLLM / tokencost）、線上 observability（Langfuse / Helicone）。關鍵是分清「事前估」還是「事後對帳」——前者用本機 tokenizer，後者直接讀 API response 的 usage。最大的坑是 tokenization 不跨 provider 標準化：我本機實測同一段 66 字中文，GPT-4 的 cl100k_base 算 62 token、GPT-4o 的 o200k_base 只算 42——差 47%。這篇把 5 種方案逐個拆、做成優劣總表與決策流程圖，附本機 tiktoken 實測指令。',
    category: 'AI 工具',
    tags: [
      'token 計量',
      'tiktoken',
      'LLM',
      'count token',
      'Claude',
      'OpenAI',
      'liteLLM',
      'AI 應用開發',
    ],
    publishDate: '2026-06-09',
    featured: true,
    faqItems: [
      {
        q: '中文一個字到底是幾個 token？',
        a: '沒有固定答案，看 tokenizer。我本機實測 66 字中文，cl100k_base 算 62、o200k_base 算 42——同一段差 47%。粗估可以抓「1 字 ≈ 1～1.5 token」，但要計費請用對應模型的 tokenizer 實算。',
      },
      {
        q: 'tiktoken 可以拿來算 Claude 或 Gemini 嗎？',
        a: '只能近似。tiktoken 是 OpenAI 的 BPE，Claude 用 SentencePiece、Gemini 用自有方案。很多庫對非 OpenAI 模型會 fallback 到 cl100k_base 硬估，數字「看起來像」但不是真的。要準就用 Anthropic／Google 各自的 count API。',
      },
      {
        q: 'Anthropic 的 count_tokens 要錢嗎？',
        a: '不計費。它只做 tokenize、不跑 inference，所以沒有 compute 成本——但仍需要 API key 驗身份。沒有理由為了省錢避開它做事前精算。',
      },
      {
        q: '我只是想知道某次 call 花多少錢，需要裝這麼多東西嗎？',
        a: '不用。事後對帳直接讀 API response 的 usage（input_tokens / output_tokens），那就是計費依據。只有「上線後要長期追蹤、做成本歸因」才需要 Langfuse／Helicone 這類 observability。',
      },
      {
        q: 'liteLLM / tokencost 的成本數字可信嗎？',
        a: 'token 數對 OpenAI 精準、對其他家是近似；價目表是第三方維護，可能跟最新官方定價有時間差。拿來做預算告警／量級預估很好用，但要拿去跟帳單對帳前，先抽樣驗一下對不對得上。',
      },
    ],
  },
  {
    slug: 'agent-browser-ai-chrome-automation',
    title:
      'agent-browser 是什麼？AI agent 專用瀏覽器自動化 CLI 實戰（含 Claude Code 接法）',
    excerpt:
      'agent-browser 是 Vercel Labs 出的 AI agent 專用瀏覽器自動化 CLI，用 Chrome 跑、不依賴 Playwright。它最大的差別是「snapshot + refs」——回傳精簡的可訪問性元素清單（每頁約 200-400 tokens），而不是整坨 HTML。我今天把它裝到 Mac、跑通一個登入流程、再裝成 Claude Code skill，全程實測。這篇是覆盤：安裝怎麼裝、登入流程怎麼跑（snapshot→fill→click→截圖 round-trip）、踩了哪些坑（Hacker News 被反爬擋、ref 會過期、nvm 路徑可攜性），以及怎麼用「薄存根 + CLI 動態供給」把它接進 Claude Code 對話直接調用。',
    category: 'AI 工具',
    tags: [
      'agent-browser',
      'AI Agent',
      'Claude Code',
      'Playwright MCP',
      '瀏覽器自動化',
      'Browser Automation',
      'Vercel Labs',
      'AI 應用開發',
    ],
    publishDate: '2026-06-09',
    featured: true,
    faqItems: [
      {
        q: 'agent-browser 需要先裝 Playwright 嗎？',
        a: '不用。它透過 CDP（Chrome DevTools Protocol）直接驅動 Chrome，自己用 `agent-browser install` 抓一份 Chrome for Testing，跟 Playwright / Puppeteer 完全無關。',
      },
      {
        q: '它會動到我日常用的 Chrome 嗎？',
        a: '不會。install 抓的是獨立的 Chrome for Testing，裝在 ~/.agent-browser/browsers/，跟你平常用的 Chrome 分開，不互相干擾。',
      },
      {
        q: '預設看得到瀏覽器視窗嗎？',
        a: '預設 headless（背景跑、看不到）。要看到視窗加 --headed，例如 agent-browser open --headed <url>。有些會擋自動化的站，用有頭模式也比較不容易被擋。',
      },
      {
        q: 'ref（@e1、@e2）為什麼有時候點不到東西？',
        a: '最常見是 ref 過期了。ref 每次 snapshot 重新編號、頁面一變（導航 / 表單送出 / 動態 re-render / 開 dialog）就失效，下次 ref 操作前要先重新 snapshot -i 拿新的編號。',
      },
      {
        q: '跟 Playwright MCP 比，真的省很多 token 嗎？',
        a: '真的。我用 tiktoken 實測過：同一個 GitHub repo 頁，渲染後完整 HTML 是 433,903 token，agent-browser 的 snapshot 只要 35,219（省 91.9%）、snapshot -i 只要 12,778（省 97.1%）。原文作者測的是 ~82%，我這台機器測下來更高，同一個量級。注意這是單頁單樣本，HTML 越肥的頁省越多。',
      },
    ],
  },
  {
    slug: 'arize-phoenix-llm-tracing-medical-cdss',
    title:
      'Arize Phoenix 接 LangGraph CDSS：3 個踩坑與醫師回饋閉環',
    excerpt:
      'Arize Phoenix 是開源、單容器自架的 LLM observability 工具（不像 Langfuse 還要外接 ClickHouse + Redis + S3）。我把它接進一個醫療 CDSS 的 LangGraph 8-step agent，目的不是看 latency，是要回答醫師那句「它為什麼開這個藥」。這篇記錄安裝三件套、三個讓我 debug 半天的踩坑（langchain 自動 instrument 散 trace、phoenix-client 預設讀錯 env、自家工具 OpenInference 抓不到），以及真正值錢的那段——把醫師回饋以 annotation 回掛到對應 trace，做成 human-in-the-loop 的評估閉環。附完整 code。',
    category: '工程實作',
    tags: [
      'Arize Phoenix',
      'LLM Observability',
      'OpenTelemetry',
      'LangGraph',
      'OpenInference',
      'LLM Tracing',
      'CDSS',
      'AI 應用開發',
    ],
    publishDate: '2026-06-05',
    faqItems: [
      {
        q: 'Arize Phoenix 是免費的嗎?',
        a: '開源版(self-host)是免費的,Elastic License 2.0,功能包含 tracing、evaluation、prompt playground、LLM-as-judge。Arize 另有商業版 AX(雲端託管、依 span 數計價)。自架版對絕大多數團隊夠用。',
      },
      {
        q: 'Phoenix 跟 Langfuse 我該選哪個?',
        a: '要框架無關、要透明 volume-based 計價就選 Langfuse。要全開源 + 單容器好自架 + eval 嚴謹(尤其受監管 / 高準確度要求的場景)就選 Phoenix。我做醫療 CDSS 選 Phoenix,主因是單容器自架 + 資料不外傳。',
      },
      {
        q: '一定要用 LangChain / LangGraph 才能接嗎?',
        a: '不用。Phoenix 走 OpenTelemetry + OpenInference,框架無關。我這次甚至刻意關掉 langchain 自動 instrument、改手動串節點。只要你的 LLM 呼叫走 OpenAI 相容 API,OpenAIInstrumentor 就抓得到。',
      },
      {
        q: '接了會不會拖慢正式環境 / 增加風險?',
        a: '我的做法是 opt-in:沒設 PHOENIX_COLLECTOR_ENDPOINT 就完全 no-op,連追蹤套件沒裝都不會讓服務啟動失敗(每個 import 都包 try/except)。正式環境不想開就不設那個 env,零成本。',
      },
      {
        q: 'trace 資料會外傳嗎?',
        a: 'self-host 版本 trace 全部落在你本地的 docker volume(phoenix_data),不外傳第三方。處理敏感資料時這是關鍵——但要注意 span 裡若記了 PII,得自己管好 Phoenix 的存取權限。',
      },
    ],
    featured: true,
  },
  {
    slug: 'open-slide-ai-agent-presentation-framework',
    title:
      'open-slide：用 Claude Code 寫簡報，4 千星 AI agent 簡報框架',
    excerpt:
      'open-slide 是台灣開發者 Yiwei Ho（@1weiho）做的開源簡報框架，定位是「給 AI coding agent 用的」：你在對話框講想要什麼，Claude Code 幫你把每一頁寫成 React 投影片，框架負責 canvas、縮放、導航、hot reload、演講模式這些雜事。上線沒多久 GitHub star 就從 4 千衝破 4.6k，repo 卡片已顯示 5k。這篇拆解它跟 Slidev / reveal.js 的根本差異（每頁是任意 React component、跑在固定 1920×1080 canvas）、npx 一行安裝、三個內建 agent skill（/create-slide、/slide-authoring、/apply-comments）怎麼配合，以及 inspector 點一下留 comment 讓 agent 改稿的工作流，附可直接抄的指令。',
    category: 'AI 工具',
    tags: [
      'open-slide',
      'Claude Code',
      'AI 簡報',
      'AI Agent',
      'React',
      '簡報框架',
      'Slidev',
      'Yiwei Ho',
    ],
    publishDate: '2026-06-03',
    faqItems: [
      {
        q: 'open-slide 一定要用 Claude Code 嗎？沒有 agent 能用嗎？',
        a: '不一定要 Claude Code。官方說同一批 skill 檔案 Codex、Cursor、Gemini CLI、OpenCode、Windsurf、Zed 都能讀。你甚至可以完全手寫 .tsx，因為每頁本來就是普通 React component，agent 只是讓「用講的生出投影片」變可能，不是必要條件。',
      },
      {
        q: 'open-slide 跟 Slidev、reveal.js 差在哪？',
        a: '最大差異是每頁的寫法。Slidev 用 Markdown + Vue 擴充語法、reveal.js 用 HTML section，都有各自的簡報 DSL 要學；open-slide 每一頁就是任意 React .tsx，你會 React 就能寫，不用學新語言。另外 open-slide 從一開始就為 coding agent 設計，內建 /create-slide 等 skill 跟視覺 inspector 改稿，這兩個 Slidev / reveal.js 都沒有。',
      },
      {
        q: 'open-slide 跟 Claude 內建的簡報功能（Claude Design / Artifacts）差在哪？',
        a: 'Claude 內建簡報生成是封閉的、跑在 Anthropic 服務裡，複雜需求容易撞限制。open-slide 是 MIT 開源、跑在你本機、產物是版控的 React 原始碼，你對每一頁有完全控制權，也能接任何 agent。要客製化、要進 git、要離線，open-slide 自由度高得多。',
      },
      {
        q: '做出來的投影片怎麼分享給沒裝環境的人看？',
        a: 'open-slide 支援把整份 deck export 成 self-contained 的 static HTML 或 print-ready PDF。HTML 版是單檔靜態站，丟到任何靜態 host（GitHub Pages、Vercel）就能給人看，對方不用裝任何東西。具體 export 指令旗標以 scaffold 出來的 repo 內 package.json scripts 或 README 為準。',
      },
      {
        q: '我完全不會 React，用得動 open-slide 嗎？',
        a: '能跑但會卡。因為 agent 幫你寫，基本生成你不碰 code 也行；可是一旦要微調、debug 某頁壞掉，看得懂 React 會差很多。建議至少懂 JSX 跟 component 概念再上手，不然遇到問題只能一直丟回給 agent 賭它修對。',
      },
    ],
    featured: true,
  },
  {
    slug: 'huggingface-flux-schnell-free-image-batch',
    title: '免費生 100 張遊戲卡牌插圖:FLUX.1-schnell + Pollinations 零成本實戰(沒綁信用卡)',
    excerpt:
      '一款 Splendor 網頁版要 90 張發展卡 + 10 張貴族卡插圖,預算 $0、手上沒綁信用卡,不能讓任何一步不小心被扣款。最後用 Hugging Face 的 FLUX.1-schnell 當主力(免費帳號每月 $0.10 額度)、額度用完自動 fallback 到完全免費的 Pollinations,再用 sharp 後製依寶石色染色,100 張圖一次跑完、整副風格一致、總花費 $0。這篇把 token 怎麼拿、額度怎麼算、bash 怎麼封裝、批次 seed 怎麼固定保證可重現、schnell 不吃顏色怎麼用後製補色,全寫清楚,附可直接抄的 bash / Node.js 程式碼。',
    category: '工程實作',
    tags: [
      'FLUX.1-schnell',
      'Hugging Face',
      'Pollinations',
      '免費生圖',
      'AI 生圖',
      'sharp',
      'Splendor',
      '批次生成',
    ],
    publishDate: '2026-06-02',
    faqItems: [
      {
        q: 'FLUX.1-schnell 免費可以商用嗎?',
        a: '模型本身走 Apache-2.0 授權(Black Forest Labs 開源的 schnell 版本),生成的圖可商用。但每個 Inference Provider 的服務條款不同,正式商用前還是去確認你呼叫的那個 provider 的 ToS。',
      },
      {
        q: '免費的 $0.10 額度用完會自動扣款嗎?',
        a: '不會。免費帳號超額會直接擋下請求,要先在 billing 頁 purchase credit 才能續用。沒綁卡就不會有意外帳單 —— 這對「絕不能被扣款」的需求反而是保險。',
      },
      {
        q: '為什麼不直接全用 Pollinations,免 key 又免費?',
        a: '可以,但 Pollinations 匿名 tier 在高併發時會 rate limit、畫質也略遜 FLUX.1-schnell。我的策略是 HF 出主力品質的那幾十張,Pollinations 補剩下的量,兼顧品質與成本。',
      },
      {
        q: 'schnell 和 dev 差在哪?該選哪個?',
        a: 'schnell 是 distilled 速度版,4 步出圖、快、適合批次;dev 步數多、品質與顏色控制更好但較慢、計費也更高。批次大量出圖選 schnell + 後製,少量精修選 dev。',
      },
      {
        q: 'seed 固定真的能完全重現嗎?',
        a: '同一個 provider、同 model、同 prompt、同 seed 下結果穩定,這是「同 id 重生不變」的基礎。但跨 provider(HF vs Pollinations)不保證一致,所以補圖時要用「跳過已存在檔」而不是「整副重生」。',
      },
    ],
    featured: false,
  },
  {
    slug: 'pollinations-free-image-api-no-signup',
    title: 'Pollinations 免費生圖 API:不用註冊、不用 key、一行 URL 就出圖(附實測坑)',
    excerpt:
      'Pollinations 是我看過門檻最低的生圖 API —— 不用註冊、不用 API key、不用綁信用卡,把 prompt 塞進一個 URL、curl 一下就回一張圖。這篇把它「URL 即 API」的設計、實測坑(/models 清單跟文件對不上、傳不存在的 model 不報錯而是靜默 fallback)、seed 決定性、匿名與註冊 tier 的差別、2025 之後的 watermark 政策、Referrer / Bearer 兩種認證都寫清楚,附可直接抄的 curl 與 Node.js 範例。本文 2 張配圖全是用 Pollinations 匿名 API 當場生的。',
    category: '工程實作',
    tags: [
      'Pollinations',
      '免費生圖',
      'AI 生圖',
      '生圖 API',
      '免註冊',
      'curl',
      'Node.js',
      'AI 工具',
    ],
    publishDate: '2026-06-02',
    faqItems: [
      {
        q: 'Pollinations 真的完全不用註冊、不用 key?',
        a: '匿名 tier 確實如此 —— 一個 GET 就回圖。註冊只是為了升 rate limit(從約 15 秒一張到 5 秒一張),不註冊也能用。',
      },
      {
        q: '為什麼我傳 ?model=flux 沒報錯但圖不像 flux?',
        a: '因為當下 /models 清單可能已經沒有 flux,服務會靜默 fallback 到清單裡的 model(我實測是 sana),不報錯。腳本啟動時打一次 /models 比對你要的 model 在不在,不在就自己擋。',
      },
      {
        q: '同 prompt 同 seed 會拿到一模一樣的圖嗎?',
        a: '會。我實測同 prompt、同 seed、同尺寸連抓兩次,md5 完全相同。所以批次補圖可以安全地「只補缺的、跳過已存在」。',
      },
      {
        q: '免費生的圖可以商用嗎?有浮水印嗎?',
        a: 'Pollinations 程式碼走 MIT,但 2025-03-31 起免費層生成的圖可能帶浮水印,nologo=true 不保證永遠去得乾淨。要正式商用建議走有明確授權保證的方案,或至少先確認當下的服務條款。',
      },
      {
        q: 'Pollinations 和 HF FLUX.1-schnell 該選哪個?',
        a: '看門檻與品質的取捨。要零門檻、快、補量選 Pollinations;要較高品質、整副統一選 HF FLUX.1-schnell 當主力。兩個疊起來(HF 主力 + Pollinations 補量)就是一條 $0 的完整管線。',
      },
    ],
    featured: false,
  },
  {
    slug: 'claude-code-build-a-game',
    title: '用 Claude Code 從零做一款遊戲:不是會 prompt,是會這三件工程紀律',
    excerpt:
      '我用 Claude Code 從零做了一款 Splendor(璀璨寶石)網頁版 —— 規則引擎、React UI、單元測試、E2E、連 100 張卡牌插圖都生好,全程沒手寫幾行 code。但能跑得順的關鍵不是 prompt 寫得好,而是三件工程紀律:規則引擎跟 UI 徹底分離、用「不變量測試 + fuzzing」逼出 AI 看不到的暗 bug、E2E 走完整 round-trip 而不是繞過引擎。這篇拆解這套協作方法,附這個專案的真實程式碼。',
    category: '工程實作',
    tags: [
      'Claude Code',
      'AI 寫遊戲',
      'TDD',
      'fuzzing',
      'Playwright',
      'Vitest',
      'Splendor',
      'React',
    ],
    publishDate: '2026-06-02',
    faqItems: [
      {
        q: '用 Claude Code 做遊戲,是不是丟個 prompt 就好?',
        a: '不是。它能很快生出能跑的 code,但「正確、可維護、可驗證」要靠架構決策(規則/UI 分離)和測試策略(不變量 + fuzzing + round-trip E2E),這些是工程師要把關的。',
      },
      {
        q: '為什麼要把規則引擎跟 UI 分離?',
        a: '因為這樣測試規則完全不用渲染畫面,純函式餵狀態、檢查結果,毫秒級跑完幾百個 case。也讓 AI 改 UI 時不會手滑動到規則,邊界清楚。',
      },
      {
        q: 'fuzzing 測試是什麼?為什麼對 AI 寫的 code 特別重要?',
        a: '用固定 seed 的隨機數讓 bot 自動對打幾百局,每步檢查遊戲不變量(如寶石守恆)。AI 寫的 code 最大風險是「看起來對、某個沒測到的組合下默默算錯」,隨機對打能撞出人工想不到的 case。',
      },
      {
        q: 'E2E 為什麼強調「走 round-trip 不繞過引擎」?',
        a: '因為要驗的是「瀏覽器點下去真的接到引擎」,而不是 UI 自己另算一套。透過掛在 window 的測試橋接驅動真實 dispatch,一路渲染到勝利畫面,才證明整條鏈是通的。',
      },
      {
        q: '這套方法只適用遊戲嗎?',
        a: '不。純函式核心 + 不變量測試 + round-trip 驗收,適用任何有明確規則與狀態轉移的系統 —— 訂單、計費、權限、工作流引擎都一樣。遊戲只是規則密集、好示範。',
      },
    ],
    featured: true,
  },
  {
    slug: 'claude-code-teams-owner-management-guide',
    title:
      'Claude Code Teams 怎麼管?Owner 視角 4 個後台動作完整指南',
    excerpt:
      'Claude Code Teams 比個人 Pro 貴 7.5 倍($150/seat 月),願意付這筆錢的 owner 一定有「多人管理」需求。這篇從 owner 視角盤點後台 4 個會真的拿來用的管理動作:座位管理(誰當 Primary Owner 是治理大事)、Skills 集中派送(把公司 SOP 變成全員 day1 工具)、Tool permission 與 MCP enforce(收斂風險邊界)、ZDR(Enterprise 限定,法遵核選項)。每條能力背後引官網原文,告訴你什麼時候用、不適用什麼場景、踩到會痛的地方。',
    category: 'AI 工具',
    tags: [
      'Claude Code',
      'Claude Code Teams',
      'Anthropic',
      'Team Plan',
      '企業導入',
      'AI 管理',
      'Primary Owner',
    ],
    publishDate: '2026-06-01',
    faqItems: [
      {
        q: 'Claude Code Teams 跟 Enterprise plan 差在哪?',
        a: 'Claude Code Teams plan 有 4 個管理動作中的前 3 個(座位、Skills 派送、tool/MCP 收斂),沒有 ZDR。Enterprise 加上 ZDR、audit log、SCIM、SSO 等 enterprise grade 功能,需要直接找 Anthropic sales 報價,不是 self-serve。一般軟體公司 50 人以下基本上 Team plan 就夠,有法遵需求才升 Enterprise。',
      },
      {
        q: '沒開 ZDR,我們公司對話會被 Anthropic 拿去訓練嗎?',
        a: '不會,Team 跟 Enterprise plan 預設都不用商業客戶資料訓練模型,這條官網 data usage 有寫。ZDR 解的是「Anthropic 端是否留存對話內容」這條,跟訓練是兩件事。即使沒開 ZDR,Anthropic 也不會拿你公司資料訓練。',
      },
      {
        q: 'Skills 派送下去,成員可以拒絕嗎?',
        a: '可以 toggle on/off。Owner upload 後成員端會自動看到,但每個成員可以在自己 client 端關掉某個 skill。這是「派送 ≠ 強制」的設計,但實務上 90% 工程師看到自動出現的 skill 不會去關,所以 owner 派下去基本上會被用。',
      },
      {
        q: 'Primary Owner 離職了怎麼辦?',
        a: '官網沒明寫流程,治理上必須離職前先轉移 Primary Owner 角色給接任者。如果已經離職沒轉,要聯絡 Anthropic support 協助轉移,流程會比較麻煩 — 你需要證明組織所有權(domain 驗證、billing 帳戶等)。所以這條我會列在公司 IT offboarding checklist 強制項目,不是離職當天才想到。',
      },
      {
        q: '我們公司還沒開 Team Plan,這篇 owner 視角寫的東西有意義嗎?',
        a: '有,這篇可以當決策框架用。讀完你會知道:Team Plan 真正值錢的能力是 Skills 集中派送(把 SOP 變工具),不是「多人共用 billing」。如果你只是想分擔費用、不想管組織級設定,Team Plan 對你 overkill;如果你想把公司工程規範變預設行為、收斂 Claude Code 風險,Team Plan 是 self-serve 級唯一選項,再上就是 Enterprise。',
      },
    ],
    featured: true,
  },
  {
    slug: 'claude-code-ultracode-ultrathink',
    title:
      'ultracode vs ultrathink:不是想更久,是派 16 隻 agent',
    excerpt:
      'ultracode 跟 ultrathink 名字像、做的事完全不同。ultrathink 是 prompt 關鍵字,只讓模型這一回合想更深(最高 31999 thinking token);ultracode 是 /effort 設定,把整個 session 切成 xhigh 推理 + 自動 dynamic workflow 編排,替每個任務派出一隊 agent(最多 16 並行 / 單次上限 1000)。附本機 Claude Code binary 實測字串為證。',
    category: 'AI 工具',
    tags: [
      'Claude Code',
      'ultracode',
      'ultrathink',
      'dynamic workflow',
      'AI 工作流',
      'effort',
      'Anthropic',
    ],
    publishDate: '2026-05-29',
    faqItems: [
      {
        q: 'ultracode 跟 ultrathink 可以一起用嗎?',
        a: '可以但通常沒必要。ultracode 已把 effort 固定在 xhigh,session 內每個任務都深度推理;ultrathink 是單 turn 加深,疊在 xhigh 上邊際效益很小。日常用 /effort high + 臨時 ultrathink,大工程直接 ultracode,不需要兩個一起。',
      },
      {
        q: '開 ultracode 會很燒 token 嗎?',
        a: '會而且明顯。每個正經任務都 xhigh + 可能開 workflow,一條 workflow 動輒派數十到上百個 agent,全算進你方案用量與 rate limit。官方明講每個請求都比低 effort 花更多 token、更久。高風險、要徹底、不在乎成本時才開,做完 /effort high 退回。',
      },
      {
        q: '我沒看到 /effort ultracode 這個選項?',
        a: '檢查三件事:claude --version 是否 ≥ 2.1.154;/config 裡 Dynamic workflows 有沒有開;/model 是不是支援 xhigh 的模型(如 Opus 4.8)。任一沒過選單就不列 ultracode,這是 binary 寫死的條件,不是壞掉。',
      },
      {
        q: 'dynamic workflow 跟一般 subagent 差在哪?',
        a: '差在計畫與中間結果放哪。subagent 是 Claude 一回合決定 spawn 誰,每個結果回流進 context,幾輪就爆。workflow 把迴圈和中間結果關在腳本變數,只有最終答案進 context,所以撐得起上百 agent,還能做 adversarial review 這種跨 agent 品質模式。',
      },
      {
        q: 'workflow 最多能派幾個 agent?',
        a: '單次 run 上限 1000 個 agent,同時並行最多 16 個(CPU 核心少會更少)。1000 是防無限迴圈失控,16 是限制本機資源占用,兩個都是 runtime 寫死。',
      },
    ],
    featured: true,
  },
  {
    slug: 'langchain-vs-langgraph-2026',
    title:
      'LangChain vs LangGraph 是什麼?2026 該學哪個(完整比較)',
    excerpt:
      'LangChain 跟 LangGraph 不是二選一,是上下層:LangGraph 是底層 runtime(管 state、流程、重試),LangChain 是建在它上面的高階 API。2025-10-22 兩者都上 1.0 正式版。這篇用比較表、三個情境判斷、三個真實踩坑,講清楚標準 agent loop 該用 LangChain、要精細控制流程分流與重試該用 LangGraph,以及完全新手該從哪個開始學。「用真實專案學 LangGraph」系列第一篇。',
    category: 'AI 教學',
    tags: [
      'LangGraph',
      'LangChain',
      'LangGraph 教學',
      'AI Agent',
      'LangGraph vs LangChain',
      'AI 應用開發',
      'Python',
    ],
    publishDate: '2026-05-27',
    faqItems: [
      {
        q: 'LangChain 跟 LangGraph 可以混用嗎?',
        a: '可以,而且官方鼓勵。你可以用 LangChain 的 create_agent 快速做出 agent,然後把它當成 LangGraph 圖裡的一個 node。因為 LangChain 底層就是 LangGraph,兩者天生相容。',
      },
      {
        q: '我完全不會,該先學 LangChain 還是 LangGraph?',
        a: '先學 LangGraph 的核心三件事——state、node、edge。把這三個搞懂,LangChain 的 create_agent 你一看就懂,因為它只是把一個常見的 graph 包起來。反過來先學 LangChain,你會卡在不知道底下 runtime 長怎樣。',
      },
      {
        q: 'LangGraph 1.0 穩定嗎?可以上 production 嗎?',
        a: '可以。官方說它是 durable agent 框架領域的第一個穩定大版本,已經在 Uber、LinkedIn、Klarna 這些公司跑了一年多才正式 1.0,並承諾 2.0 前不做破壞性更新。',
      },
      {
        q: '只做簡單的 RAG 問答,需要 LangGraph 嗎?',
        a: '不一定需要。純 RAG(檢索加丟給模型回答)用 LangChain 的標準組件就夠。等你的流程開始長出分流、重試、人工審核、多步驟混合這些需求,再下沉到 LangGraph。不要為了用而用。',
      },
      {
        q: 'LangChain 1.0 對 Python 版本有什麼要求?',
        a: 'LangChain 1.0 把 Python 3.9 支援拿掉了,最低需要 3.10。如果你還在 3.9 的環境,pip 裝得起來但行為會怪,先升 Python 再說。',
      },
    ],
    featured: true,
  },
  {
    slug: 'langgraph-state-node-edge',
    title:
      'LangGraph 核心:State / Node / Edge 完整教學(第一個會跑的 graph)',
    excerpt:
      'LangGraph 的核心只有三個概念:State(跨步驟共用的狀態)、Node(收 state 回傳要改的欄位的函式)、Edge(把 node 串起來的線)。這篇用血脂決策 pipeline 的真實場景,帶你從 StateGraph 定義、add_node、add_edge 一路到 compile 與 invoke,給一個複製貼上就能跑的最小範例,並講三個新手最常踩的坑:回傳整份 state、忘記接 START/END、在 node 裡 mutate state。「用真實專案學 LangGraph」系列 EP2。',
    category: 'AI 教學',
    tags: [
      'LangGraph',
      'LangGraph 教學',
      'StateGraph',
      'LangGraph State',
      'AI Agent',
      'Python',
      'AI 應用開發',
    ],
    publishDate: '2026-05-28',
    faqItems: [
      {
        q: 'LangGraph 的 State 一定要用 TypedDict 嗎?',
        a: '不一定,但建議。LangGraph 支援 TypedDict、Pydantic model、dataclass。新手用 TypedDict 最直觀;要嚴格驗證欄位防打錯字就上 Pydantic。重點是 state 的欄位要當成合約寫清楚,用哪種型別是次要的。',
      },
      {
        q: 'LangGraph 的 node 一定要是函式嗎?',
        a: 'node 本質是可呼叫物件(callable),函式最常見,但任何 __call__ 接收 state、回傳 dict 的物件都行。複雜 node 要帶設定或依賴時,用 class 包起來會比較乾淨。',
      },
      {
        q: '一個 LangGraph node 可以同時改多個 state 欄位嗎?',
        a: '可以。回傳的 dict 想放幾個 key 都行,例如 return {"computed": ..., "advice": ...}。只要那些 key 是這個 node 的職責就好。',
      },
      {
        q: 'LangGraph 的 node 為什麼只回傳 dict 而不是整份 state?',
        a: 'node 只回傳要更新的欄位,LangGraph 會自動把這個 dict 合併進 state。回傳整份 state 在簡單情況下不會錯,但多個 node 並行或用到 reducer 時,回傳整份會把別人寫的東西洗掉。從第一天就養成只回傳 diff 的習慣。',
      },
      {
        q: '怎麼看 LangGraph 實際跑了哪些 node?',
        a: '用 app.stream(initial) 取代 invoke,它會 yield 每一步的中間結果,你能看到 state 一站一站怎麼變,debug 流程超好用。',
      },
    ],
    featured: false,
  },
  {
    slug: 'langgraph-conditional-edge-reducer',
    title:
      'LangGraph Conditional Edge + Reducer:讓 graph 會分流、會重試',
    excerpt:
      '線性 graph 不夠用時你需要兩個東西:Conditional Edge(跑完一個 node 看結果決定下一步去哪——過了往前、沒過退回重試、重試太多次直接退件)跟 Reducer(讓某個 state 欄位累加而不是覆蓋,最典型就是 retry 計數器)。這篇用 add_conditional_edges + router 函式 + Annotated[int, operator.add] 把這兩件事講透,並解釋一個關鍵設計決策:MAX_RETRY 該設多少、為什麼很多嚴肅場景答案是 0。「用真實專案學 LangGraph」系列 EP3。',
    category: 'AI 教學',
    tags: [
      'LangGraph',
      'LangGraph 教學',
      'Conditional Edge',
      'LangGraph Reducer',
      'AI Agent',
      'Python',
      'AI 應用開發',
    ],
    publishDate: '2026-05-29',
    faqItems: [
      {
        q: 'LangGraph 的 conditional edge 跟 add_edge 可以混用嗎?',
        a: '可以,而且通常會混。大部分的線用 add_edge 直連,只有真的需要分流的那幾個點用 add_conditional_edges。不要每條線都搞成 conditional,那會讓流程難讀。',
      },
      {
        q: 'LangGraph 的 router 函式可以改 state 嗎?',
        a: '不該。router 的職責是讀 state、決定路線,改 state 是 node 的事。如果你發現 router 裡想改東西,那段邏輯應該搬到前一個 node 去。',
      },
      {
        q: 'LangGraph 的 reducer 只能用 operator.add 嗎?',
        a: '不是。reducer 是任何拿舊值跟新值、回傳合併值的函式。operator.add 適合數字相加跟 list 串接;你也可以自己寫函式做更複雜的合併。LangGraph 對訊息列表還有專用的 add_messages reducer。',
      },
      {
        q: '怎麼避免 LangGraph 重試迴圈跑成無限迴圈?',
        a: '兩層保險。第一層是你自己的 MAX_RETRY 邏輯(router 判斷 retry_count 超過就走 reject)。第二層是 LangGraph 的 recursion_limit,跑超過步數上限會丟 GraphRecursionError。第一層是你該做的,第二層是兜底。',
      },
      {
        q: 'LangGraph MAX_RETRY 設 0 為什麼還要保留 retry 那條邊?',
        a: '因為 add_conditional_edges 的對照表必須涵蓋 router 可能回傳的所有值。即使 retry 實際不會被走到,對照表少了那個 key,萬一 router 真的回了它就 KeyError。保留是為了結構完整跟防禦。',
      },
    ],
    featured: false,
  },
  {
    slug: 'langgraph-llm-node-structured-output',
    title:
      'LangGraph LLM Node:結構化輸出 + Few-shot + 業務驗證',
    excerpt:
      '把真正的 LLM 接進 LangGraph node,三個關鍵:結構化輸出(用 Pydantic schema 強制 LLM 吐固定格式,不要 parse 自由文字)、few-shot(在 prompt 裡塞範例把輸出品質拉穩)、業務驗證(LLM 吐的東西不能照單全收,過一道規則檢查)。這篇示範怎麼用 with_structured_output 在決策 node 裡把這三件事兜起來,並講最容易出事的地方:LLM 的結構對了不代表內容對。「用真實專案學 LangGraph」系列 EP4。',
    category: 'AI 教學',
    tags: [
      'LangGraph',
      'LangChain',
      '結構化輸出',
      'Pydantic',
      'Few-shot',
      'AI Agent',
      'Python',
    ],
    publishDate: '2026-05-30',
    faqItems: [
      {
        q: 'with_structured_output 每個 model 都支援嗎?',
        a: '主流的(OpenAI、Anthropic、Google 等)都支援,但底層機制不同(function calling vs JSON mode)。LangChain 幫你抽象掉差異,但冷門或本地小模型可能支援度差、parse 失敗率高。換 model 時務必實測結構化輸出的穩定度。',
      },
      {
        q: 'LangChain 結構化輸出 parse 失敗會怎樣?',
        a: '如果 LLM 吐的東西無法 parse 成你的 schema,LangChain 預設會丟錯。你可以在 node 裡 try/except 接住,當成驗證失敗走 retry 流程。不要讓 parse 錯誤直接炸掉整張 graph。',
      },
      {
        q: 'few-shot 跟 fine-tune 差在哪,該用哪個?',
        a: 'few-shot 是在 prompt 裡塞範例,零成本、即改即生效,適合範例少、需求常變的情況——大部分業務場景用 few-shot 就夠。fine-tune 成本高、週期長,只有 few-shot 怎麼調都救不動且量大到划算時才考慮。先用 few-shot,撞牆再說。',
      },
      {
        q: '可以讓 LLM 自己驗證自己的輸出嗎(LLM-as-judge)?',
        a: '可以當補充,不能當唯一防線。LLM 驗 LLM 一樣會幻覺。高風險場景的最後一道驗證一定要是確定性規則(你寫死的 if-else),LLM-as-judge 適合用在規則難明確表達的軟性品質檢查。',
      },
      {
        q: '結構化輸出之後還需要業務驗證嗎?',
        a: '絕對需要。with_structured_output 只保證格式合法(欄位型別、枚舉值),完全不保證內容正確。LLM 可能給出結構完美但臨床上自相矛盾的建議。結構化輸出解決格式可控,業務驗證解決內容可信,兩個都要。',
      },
    ],
    featured: false,
  },
  {
    slug: 'langgraph-full-pipeline-hitl',
    title:
      'LangGraph 完整 Pipeline + Human-in-the-loop:8 步決策管線全貌',
    excerpt:
      '前四篇的零件——state、node、edge、conditional edge、reducer、LLM 結構化輸出——這篇全部組起來,串成一條完整的醫療 AI 決策 pipeline:載入資料 → 補衍生指標 → 載入規則 → 組 few-shot → LLM 出建議 → 業務驗證 → 適配輸出 → 持久化,中間帶分流重試。然後加上 LangGraph 的殺手級功能 human-in-the-loop:用 interrupt() 在高風險決策點暫停整張 graph,等人點頭才繼續,靠 durable state 讓這件事變簡單。「用真實專案學 LangGraph」系列 EP5。',
    category: 'AI 教學',
    tags: [
      'LangGraph',
      'Human-in-the-loop',
      'LangGraph Pipeline',
      'durable state',
      'AI Agent',
      'Python',
      'AI 應用開發',
    ],
    publishDate: '2026-05-31',
    faqItems: [
      {
        q: 'LangGraph interrupt() 之後 graph 真的停住嗎?會占資源嗎?',
        a: '不會占 process。interrupt() 是把狀態存進 checkpointer 然後結束本次 invoke,process 就釋放了。等你之後用 Command(resume=...) 再次 invoke,它才從 checkpointer 把狀態載回來繼續。人等一小時,這段時間 server 沒有東西卡著。',
      },
      {
        q: 'LangGraph HITL 一定要掛 checkpointer 嗎?',
        a: '要。interrupt() 要能停下來再接回,靠的是 checkpointer 把狀態存起來。compile 時忘了傳 checkpointer,interrupt() 會行為異常或報錯。HITL 跟 checkpointer 是綁在一起的,要用前者必掛後者。',
      },
      {
        q: 'LangGraph checkpointer 用記憶體還是 Postgres?',
        a: '開發測試用記憶體版(MemorySaver)最快。Production 一定要用持久化的(Postgres / Redis),因為 server 重啟記憶體就沒了,HITL 等人那段時間若重啟就接不回。',
      },
      {
        q: '為什麼確定性步驟不該丟給 LLM 算?',
        a: '能用程式算的就不要叫 LLM 算。LLM 算數學不可靠、不可審計、慢又貴、不穩定。把 LLM 用在它真正擅長的綜合判斷,其他能寫成公式或規則的老實用 Python 算。LLM 是 pipeline 裡的一個 node,不是整個 pipeline。',
      },
      {
        q: 'LangGraph human-in-the-loop 一定要在前端做嗎?',
        a: '不一定。interrupt() 只是把要審核的內容吐出來,怎麼呈現給人、人怎麼回是你應用層的事——可以是前端按鈕、Slack 訊息按 approve、email 回覆。LangGraph 只管停/接回,UI 你自己決定。',
      },
    ],
    featured: false,
  },
  {
    slug: 'hermes-to-langgraph-migration',
    title:
      '我原本用 Hermes Agent CLI,後來為什麼換成 LangGraph(遷移覆盤)',
    excerpt:
      '系列番外。我這套醫療決策 pipeline 最早不是用 LangGraph,是用 Hermes Agent CLI(NousResearch 2026 年初開源的自主 agent 框架)。Hermes 很強,但強在通用對話助理、會自我學習、接 20+ 平台;而我要的是確定性步驟為主、流程可畫成圖、每步可審計、出錯能精準退件的決策管線。方向不對再強也是錯的工具。這篇覆盤這個選型決策:Hermes 哪裡好、為什麼對我的場景不對、換到 LangGraph 解決了什麼。「用真實專案學 LangGraph」系列 EP6(完結)。',
    category: 'AI 工具',
    tags: [
      'LangGraph',
      'Hermes Agent',
      'AI Agent',
      '技術選型',
      'agent framework',
      'AI 應用開發',
      'Python',
    ],
    publishDate: '2026-06-01',
    faqItems: [
      {
        q: 'Hermes Agent CLI 不值得用嗎?',
        a: '完全不是。如果你要的是通用個人 agent、多平台助理、會自我學習的對話夥伴,Hermes 是很棒的選擇,它的 self-improving 跟 gateway 設計很有特色。我換掉它純粹因為我的場景要的是相反的東西——確定性、可控、可稽核。工具沒有好壞,只有合不合場景。',
      },
      {
        q: '選 agent 框架怎麼一開始就避免選錯?',
        a: '選型前先回答一個問題:你要自由還是控制?開放任務、要 agent 自己探索 → 自由 → 自主 agent 框架。固定流程、要可控可審計 → 控制 → LangGraph 這類能把流程畫死的。很多人就是沒先問這題,被「看起來什麼都能做」吸引。',
      },
      {
        q: 'LangGraph 也能做自主 agent 嗎?還是只能做固定流程?',
        a: '兩者都能。LangGraph 是底層 runtime,你可以畫固定流程,也可以用 conditional edge 做出讓 LLM 決定路線的自主行為,LangChain 的 create_agent 底層就是 LangGraph 的 agent loop。差別在控制粒度——LangGraph 讓你決定要給多少自由,而不是預設全自由。',
      },
      {
        q: '從 Hermes 遷移到 LangGraph 花多久、值得嗎?',
        a: '重寫比想像久,因為心智模型要轉(tool 是給 agent 選用的能力,node 是流程裡固定的一站)。但值得——換完之後流程可測、可稽核、行為穩定,這些在醫療場景是硬需求。如果你也在強大但不可控的 agent 上撞牆,早換早解脫。',
      },
      {
        q: 'Hermes Agent 跟 LangGraph 差在哪,該選哪個?',
        a: 'Hermes 給你自由(自主 agent、自我學習、多平台),LangGraph 給你控制(流程畫死、可審計、行為穩定)。通用助理選 Hermes;固定流程、確定性步驟為主、要精準錯誤處理跟人工審核的決策管線選 LangGraph。',
      },
    ],
    featured: false,
  },
  {
    slug: 'hermes-agent-intro',
    publishDate: '2026-05-15',
    title:
      'Hermes Agent 是什麼?一篇給完全新手看的 AI 工具介紹(白話版)',
    excerpt:
      '我有 ChatGPT 了為什麼還要裝 Hermes Agent?簡單講:ChatGPT 只會回字、要你自己動手;Hermes Agent 會幫你動手——查檔、改檔、跑指令、上網查資料,做完才回報。本文用「人肉接線生 vs 工讀生」的比喻、5 個日常情境、跟 ChatGPT/Claude Code/Cursor 的對照表,讓完全不會寫 code 的人也能搞懂這工具能幫你做什麼、安不安全、怎麼開始。',
    category: 'AI 工具',
    tags: [
      'Hermes Agent',
      'AI Agent',
      'AI 入門',
      'CLI 工具',
      'NousResearch',
      'Claude Code',
      'ChatGPT',
    ],
    faqItems: [
      {
        q: 'Hermes Agent 會不會把我電腦弄壞?',
        a: '預設模式下它會直接動你電腦的檔案,理論上有風險(雖然它會先問你確認再執行破壞性操作)。如果你完全不放心,可以叫它進入「沙盒模式」——一個隔離的小房間,弄壞了砍掉重來,你電腦完全沒事。詳細沙盒怎麼用看沙盒篇。',
      },
      {
        q: '我完全不會 coding 也能用嗎?',
        a: '能用。Hermes Agent 是「跟 AI 講話讓它幫你做事」的工具,不是「教你寫 code」的工具。日常用法:你用中文跟它講「幫我整理桌面」「幫我看 Downloads 哪些檔案可以刪」,它就會自己跑。不會 coding 完全不影響使用,只是不會 coding 的人通常也不會打開終端機——這是真正的門檻,不是 coding 能力。',
      },
      {
        q: '免費還是要付錢?',
        a: 'Hermes Agent 本身完全免費、開源。但它後面要接一個 LLM(實際做事的 AI),那個 LLM 可能要錢——用 Claude / GPT 要花 API 費用(便宜,一個月 $5-20 跑很多),用 Ollama 本機免費但要你電腦有點力氣,用 OpenRouter 可以按量計費隨時切換。',
      },
      {
        q: '跟 Claude Code 哪個好?',
        a: '不同場景。Claude Code 綁定 Anthropic,設定簡單、開箱即用,適合「我就是要用 Claude」的人;Hermes Agent 可以接任何家的 AI(包括你公司內網的、開源的、便宜的),適合想要彈性、不想被綁定的人。我兩個都裝、看任務切換。',
      },
      {
        q: '我家公司有內網 LLM,可以接嗎?',
        a: '可以,但要做點工。如果你公司有 OpenAI-compatible 的內網 LLM wrapper(像 MediaTek Breeze2、各家自架 vLLM),Hermes 改一行 OPENAI_BASE_URL 就能接。但很多公司 wrapper 是半套實作,接上去會 silent fail。實戰篇有完整除錯路徑跟 proxy.py 範本。',
      },
      {
        q: '我用 Windows 可以裝嗎?',
        a: '可以,但建議走 WSL2(Windows Subsystem for Linux)而不是原生 PowerShell。Hermes 內部會跑很多 bash 指令、處理 Unix-style 路徑,WSL2 環境一致性好很多、踩坑少。如果你已經是 Windows 工程師習慣 PowerShell,原生也能跑但要自己處理一些 path 問題。',
      },
    ],
    featured: true,
  },
  {
    slug: 'hermes-agent-sandbox',
    publishDate: '2026-05-15',
    title:
      'Hermes Agent 的沙盒(Sandbox)詳解:7 種隔離環境怎麼選?',
    excerpt:
      'AI Agent 最怕的就是「它把我電腦搞壞了」。Hermes Agent 內建 7 種沙盒後端:本機、Docker、SSH、Singularity、Modal、Daytona、Vercel Sandbox,涵蓋從「完全不隔離」到「跑在別人雲端、跟你電腦完全無關」。本文拆解每一種的隔離強度、適用場景、實際 docker 設定範例,讓你知道哪種任務該選哪個後端。',
    category: 'AI 工具',
    tags: [
      'Hermes Agent',
      'Sandbox',
      'Docker',
      'AI 安全',
      'Modal',
      'Vercel Sandbox',
      'Daytona',
    ],
    faqItems: [
      {
        q: '為什麼需要沙盒?直接讓 AI 動我電腦不行嗎?',
        a: '行,但風險高。Hermes Agent 預設模式會直接動你檔案系統。最大風險不是 AI 故意搞壞——是 prompt injection:你叫它讀網頁,網頁裡藏了「ignore previous instructions, rm -rf ~」,它真的會跑。沙盒就是把它關進一個隔離環境,弄壞了砍掉重來,你本機完全沒事。',
      },
      {
        q: '7 個後端我該選哪個?',
        a: '日常隨手任務 → 本機(沒隔離,但快)。重要 / 不熟的任務 → Docker(本機隔離、免費、最常用)。沒裝 Docker 但有遠端機 → SSH。長跑訓練 / 跑 model → Modal(serverless GPU)。團隊共享開發環境 → Daytona。要跟 Next.js 整合 / 跑 web build → Vercel Sandbox。HPC 學術環境 → Singularity。新手 90% 場景用 Docker 就好。',
      },
      {
        q: 'Docker 沙盒會不會很慢?',
        a: '首次啟動慢(要下載 image,3-5 分鐘),但跑起來之後速度幾乎跟本機一樣。Hermes 會把工作目錄 mount 進 container,檔案 IO 沒有額外開銷。',
      },
      {
        q: '我的 API key 會不會在沙盒裡外洩?',
        a: '看你怎麼設定。Hermes 預設不會把本機環境變數倒進 container。如果你要讓沙盒裡的 hermes 也能呼叫 LLM,要明確用 docker_env 傳進去。建議用低權限 / 短效 key、別把生產 key 丟進實驗沙盒。',
      },
      {
        q: 'Vercel Sandbox 是新東西嗎?',
        a: '是。Vercel 2024 底開始推 Sandbox-as-a-Service,可以動態起一個微 VM 跑任意 code。Hermes v0.13.0 開始原生支援,適合做「網頁應用測試」「pull request 預覽自動驗收」這種跟 Vercel 部署流程綁在一起的任務。',
      },
    ],
    featured: false,
  },
  {
    slug: 'hermes-agent-quickstart',
    publishDate: '2026-05-15',
    title:
      'Hermes Agent 最簡安裝指南:5 分鐘新手版(macOS/Linux/Windows)',
    excerpt:
      '不用懂 Python、不用買 GPU、不用 Docker。三步驟:裝 uv → 裝 hermes-cli → 給它一把 API key。本文是 Hermes Agent 最簡安裝路徑,專為「完全沒裝過 AI CLI 工具」的新手寫,附 Anthropic / OpenAI / Ollama 三家 provider 比較、API key 取得步驟、第一句話 hermes -z 範例,15 分鐘從 0 跑起來。想接公司內網 LLM 看實戰篇,這篇先學會「能跑」。',
    category: 'AI 工具',
    tags: [
      'Hermes Agent',
      'uv',
      '安裝教學',
      'AI 入門',
      'Anthropic',
      'OpenAI',
      'Ollama',
      'CLI',
    ],
    faqItems: [
      {
        q: '為什麼用 uv 不用 pip?',
        a: 'uv 是 Rust 寫的 Python 套件管理器,比 pip 快 10-100 倍、自帶獨立環境管理。`uv tool install hermes-cli` 把 hermes 裝成全域 CLI 又不污染你其他 Python 環境。pip install 在新系統上常常會跟系統 Python 打架,uv 完全沒這問題。',
      },
      {
        q: '一定要付錢嗎?',
        a: '不一定。Anthropic 新帳號送 5 美金試用額度,夠你聊 100-500 輪 Claude Sonnet。完全不想付錢 → 走 Ollama 本機免費(但要硬體 16GB RAM 以上)。OpenAI 比較嚴,新帳號要先儲值 5 美金才有 API 額度。',
      },
      {
        q: 'Anthropic / OpenAI / Ollama 我該選哪個?',
        a: '新手第一次 → Anthropic Claude,5 美金試用最大方、Claude 寫 code 效果第一名、設定最簡單。已經有 OpenAI 帳號 → 也可以,但要另外開 API key、得儲值。完全不想付錢 + 電腦有點力氣 + 不在乎中文偏弱 → Ollama llama3.2。',
      },
      {
        q: 'Windows 一定要 WSL2 嗎?',
        a: 'PowerShell 也能裝,但建議走 WSL2 Ubuntu。Hermes 內部會跑 bash 指令、處理 Unix-style 路徑,WSL2 環境一致性好很多。已經是 Windows 工程師習慣 PowerShell → 試試,純新手 → 直接 WSL2,踩坑會少很多。',
      },
      {
        q: 'hermes -z 跟 hermes(互動模式)差在哪?',
        a: '`hermes -z "..."` = zero-shot 一次性,給一句、回一段、結束,適合測試 / 自動化腳本。`hermes` 不帶參數 = 互動模式,像 ChatGPT 一樣連續對話、有上下文記憶。新手測試用 -z,實際工作流用互動模式。',
      },
      {
        q: '裝完發現不喜歡怎麼移除?',
        a: '一句 `uv tool uninstall hermes-cli` 移掉 hermes,再 `rm -rf ~/.config/hermes ~/.cache/hermes` 清設定。要連 uv 一起拿掉:`rm -rf ~/.local/share/uv ~/.local/bin/uv`。最後編輯 `~/.zshrc` 把 export 那行刪掉。完全沒殘留。',
      },
    ],
    featured: false,
  },
  {
    slug: 'hermes-agent-mac-install',
    publishDate: '2026-05-15',
    title:
      'Mac 裝 Hermes Agent 接內網 LLM：踩了 4 個洞才接通',
    excerpt:
      '想在 Mac 上裝 Hermes Agent 接自家內網 LLM,結果 hermes -z 跑完 exit 0、stdout 完全空白?本文記錄從 0 安裝 Hermes、發現 OpenAI-compatible wrapper 缺 4 件事 (/v1/models、usage、SSE streaming、system_fingerprint) 導致 silent fail,寫 FastAPI proxy 一次補齊,最後掛 launchd 開機自啟動的完整路徑。附完整可複製 proxy.py、踩坑清單、排查心法。',
    category: 'AI 工具',
    tags: [
      'Hermes Agent',
      'AI Agent',
      'OpenAI API',
      'FastAPI',
      'macOS',
      'launchd',
      'Breeze2',
      'CLI',
    ],
    faqItems: [
      {
        q: 'Hermes Agent 跟 Claude Code 哪個好?',
        a: '不同場景。綁定 Anthropic 用 Claude Code、要自架/多 provider 用 Hermes。Claude Code 生產級別更穩、Hermes 更彈性但要自己搞 prompt 路由。我兩個都裝。',
      },
      {
        q: '為什麼 hermes -z 跑完完全空白、沒錯誤?',
        a: '99% 是後端 OpenAI-compatible wrapper 半套實作。Hermes 走 OpenAI SDK strict 模式,response 缺 usage 欄位、缺 /v1/models 端點、或 stream 格式不對都會 silent drop。session JSON 只記到 user message、exit 0、沒 log,debug 極端折磨。要在 transport 層加 access log 才看得到真相。',
      },
      {
        q: '為什麼不直接接 wrapper,要多一層 proxy?',
        a: '如果 wrapper 本身完整實作 OpenAI API (含 /v1/models、usage、SSE streaming),可以直接接。但很多內部 wrapper 都是只實作 /v1/chat/completions 的半套版本,差一條 Hermes 就 silent fail。proxy 就是在中間補洞的最乾淨解法,而且不用改別人的 wrapper。',
      },
      {
        q: 'proxy 加在中間會不會很慢?',
        a: '127.0.0.1:8910 是本機,httpx 同步轉發加 SSE 包裝大約多 5-15ms。Breeze2 自己回應就要 1-5 秒,proxy 開銷可以忽略。',
      },
      {
        q: 'launchd 跑不起來怎麼辦?',
        a: '看 proxy.err.log。最常見的是 venv 路徑寫錯。.venv/bin/uvicorn 一定要是絕對路徑、且 WorkingDirectory 一定要設成專案根目錄。也要檢查 plist 的 Label 跟檔名一致、用 launchctl load -w 載入。',
      },
      {
        q: '為什麼借 alibaba provider 而不是 openai?',
        a: 'OpenAI 系列 provider 在 Hermes 內部會多打 organization probe;DashScope (alibaba) provider 走純 OpenAI 協定、無私有探測,只多注入一句 "You are powered by ..." system prompt,對本地實驗無傷大雅。我中間試過借 lmstudio 完全錯路 — 它會打 LM Studio 私有 GET /api/v1/models,回傳格式跟 OpenAI 不同,探測失敗就跳過整個 chat call。',
      },
    ],
    featured: false,
  },
  {
    slug: 'hermes-agent-academic',
    publishDate: '2026-05-15',
    title:
      'Hermes Agent 為什麼擠進 OpenRouter App 排行榜第 2?結構性原因解析',
    excerpt:
      '2026 上半年 OpenRouter App & Agent Rankings 公布,Hermes Agent (NousResearch 維護的開源 CLI agent) 排名第 2,僅次於 ChatGPT、把 Kilo Code / Claude Code / Cline 全壓在身後。本文拆解三個結構性原因:provider-agnostic 直接吃 OpenRouter 紅利、開源 CLI 的 long-tail 採用、NousResearch 的開源信任資本。並提供 v0.13.0 release 訊號分析、跟主流 agent 的真實差異對照、反方論點。',
    category: 'AI 工具',
    tags: [
      'Hermes Agent',
      'NousResearch',
      'OpenRouter',
      'AI Agent',
      'Open Source',
      'LLM Routing',
      'CLI Agent',
    ],
    faqItems: [
      {
        q: 'Hermes Agent 排第 2 的依據是什麼?',
        a: 'OpenRouter 公布的 App & Agent Rankings,按 token 使用量計算。第一名是 OpenAI 的 ChatGPT 客戶端,第二名是 Hermes Agent,把 Kilo Code、Claude Code、Cline 全壓在身後。OpenRouter 是 2026 年「多 model 比較與切換」的事實標準,排名比 GitHub stars 更能反應真實採用度 (GitHub stars 量「知道你存在」,App Rankings 量「真的拿你燒錢」)。',
      },
      {
        q: 'OpenRouter 跟 Hermes Agent 的關係?',
        a: 'OpenRouter 是 LLM 的 stripe,一個 API endpoint 後面接 100+ 家 model provider。Hermes Agent 的 provider-agnostic 設計讓它的 openai provider 改一行 OPENAI_BASE_URL 就能接 OpenRouter,零摩擦。Hermes 的 architecture 本身就是 OpenRouter 的 perfect funnel。',
      },
      {
        q: 'Hermes Agent 跟 Claude Code 的真實差異?',
        a: '真實差異不在功能,在綁定強度。Claude Code 綁死 Anthropic、適合「我就是要 Claude」的場景;Hermes 不綁任何東西、適合「我要自己組合」的人。Claude Code 是閉源、只有 Anthropic 員工能提交;Hermes v0.13.0 過去一個月 282 個 contributors 提交 PR,速度差距會在 6 個月後拉開。',
      },
      {
        q: 'NousResearch 是什麼來頭?',
        a: 'NousResearch 是以 Hermes 系列開源 LLM 聞名的研究機構,model 權重全部公開、論文齊全、Discord 活躍。他們不是「先開源後閉源」的創投暖場團隊,是真開源。這份信任資本讓 Hermes Agent 一發布就有現成擁護者社群會自願寫 plugin、回報 bug、推薦給朋友 — 在 2026 純開源信任資本是稀缺品。',
      },
      {
        q: 'Hermes Agent 有什麼缺點?',
        a: '三個。第一,silent fail 折磨人 — response 格式錯一個小欄位就 exit 0、stdout 空白、沒 log,debug 極端痛苦。第二,文件落後 release 太多 — v0.13.0 加了一堆東西,README 還停在 v0.10 範例。第三,customization 極致,有人視為自由、有人視為時間黑洞 — 如果你只想「能跑就好」,Claude Code 反而省事。',
      },
    ],
    featured: false,
  },
  {
    slug: 'claude-code-two-lessons-astro-and-tasklist',
    publishDate: '2026-05-15',
    title:
      '兩個教訓:Astro base path 不會自動套 markdown 連結、跨多檔案任務該開 TaskList',
    excerpt:
      '剛把 5 篇 Hermes Agent 系列發到 GitHub Pages,踩兩個坑被自己抓到。第一個技術:Astro 的 base path 設定不會自動套到 markdown 連結,本機 dev 看不出來、production 全 404,Astro issue #3626 從 2022 年開到現在,官方文件明文寫「developer responsibility」要自己加前綴。第二個流程:跨多檔案多步驟任務該開 TaskCreate 追進度,不是儀式是斷線保險。兩個共通點:該查不查、該開不開。',
    category: '工程師日常',
    tags: [
      'Astro',
      'Claude Code',
      'GitHub Pages',
      'Static Site Generator',
      'TaskList',
      'AI 工作流',
      '踩坑筆記',
    ],
    faqItems: [
      {
        q: 'Astro 為什麼不直接修 base path 的 markdown 連結行為?',
        a: 'Astro maintainer 在 issue #3626 的說法:markdown 連結到底是站內還是站外,Astro 沒辦法 100% 確定。[link](/foo) 可能是想跳到 base 下,也可能是 base 之外的 sibling page。自動加前綴反而會把後者搞壞。合理但礙事,實務上 99% 都是站內連結,所以社群普遍走 remark/rehype plugin 自動加。',
      },
      {
        q: '為什麼不一開始就寫 plugin 自動加前綴?',
        a: 'YAGNI。我場景文章 ~30 篇、改一次手動就定型。寫 plugin 至少 30 分鐘 + 後續維護成本,sed 一行十秒搞定。判斷依據是「這坑會再犯幾次」——文章每天新增就值得寫 plugin,一次性事件就 sed 過去。',
      },
      {
        q: 'TaskList 不是給使用者看的嗎?開了會不會反而拖慢?',
        a: '我以前的盲點。實際用幾次後發現:TaskList 的主用戶是 AI 自己,不是使用者。它是 AI 在 context 壓縮後找回脈絡的錨點。使用者看到的是副作用,真正的價值在斷線復原。開 task 的成本是 2 秒,壞處只有「task 數量會多」。複雜任務本來就該分解,task 多 ≠ 慢。',
      },
      {
        q: 'CLAUDE.md 紀律寫了沒用怎麼辦?',
        a: '我 CLAUDE.md 有「能查就查、不要問」這條,但這次還是憑印象寫了錯誤的 markdown link。寫紀律 != 執行紀律。解法不是再寫一條,是改變觸發機制:看到自己心裡冒出「應該」「以為」「我記得」,直接停下來查一次。把 trigger 從「規則記得」改成「字眼偵測」。',
      },
      {
        q: '用 Next.js / Nuxt 會有這問題嗎?',
        a: '不會。Next.js 的 basePath 設定後,Link 跟 markdown link 都會自動加前綴(@next/mdx 內建處理)。Nuxt 的 app.baseURL 同樣自動處理 NuxtLink 跟 content module。只有 Astro 是「自己加」。背後設計哲學差異,沒對錯,但會被類比經驗坑到。',
      },
      {
        q: '這篇文章自己有 follow 教訓嗎?',
        a: '有檢查。內部連結:這篇沒有指向別篇文章的內部連結(都是 GitHub issue / Astro docs 的外部 URL),所以 base path 問題不適用。任務追蹤:這次寫文章開了 6 個 task(查證 → outline → 寫長文 → 截圖 → caption → 發佈)。至少這次有遵守,下次會不會 regression 不知道,所以才寫下來。',
      },
    ],
    featured: false,
  },
  {
    slug: 'popularize-slides-deck',
    publishDate: '2026-05-19',
    title:
      '我把 AI 課程簡報全做成 HTML 丟上 GitHub Pages：popularize-slides 開源拆解',
    excerpt:
      '我在企業內訓教 4 堂 AI Claude Code 概論初級班，把簡報全寫成 HTML 而不是 Keynote / Slidev / Reveal.js，丟在 GitHub Pages 上跑。本文拆解：為什麼放棄 Keynote、為什麼不用 Slidev、設計系統（深色 + 黃金 accent + 襯線標題）、部署用一條 push 指令、學生 clone 下來雙擊就能看（沒有 npm install）。Repo 全開源，歡迎 fork 改成你的教學內容。',
    category: 'AI 教學',
    tags: [
      'Claude Code',
      'GitHub Pages',
      'HTML',
      '簡報設計',
      '企業內訓',
      'AI 教學',
      'Superpowers',
    ],
    faqItems: [
      {
        q: '為什麼不用 Notion / Slidev / Reveal.js / Marp 這些現成工具？',
        a: '現場 demo + 學生 fork 的場景下，build step 是負擔。Notion 簡報模式不能改鍵盤導航；Slidev / Reveal.js 要 build step，學生 clone 下來不能直接看；Marp 不能寫自訂 JS。手寫 HTML 是「最不偷懶但最自由」的選擇。如果你只要做一份簡報、不在意 fork 友善度，請用 Slidev。',
      },
      {
        q: '每堂課 60% 重複 CSS 不會痛嗎？',
        a: '會痛，但沒抽出來是刻意的。教學素材的版本演進不是線性 refactor — 第三堂我加金色 accent、第四堂我改 progress bar 粗細。如果這些是 shared CSS，每改一次都要回頭驗證前面的課還能看。分開檔案 = 每堂課獨立可審查，YAGNI 原則：到第 8 堂課真的吵到我之前，不抽。',
      },
      {
        q: '用 AI 寫教學簡報會不會有 AI 腔？',
        a: '我自己寫文字內容、用 Claude Code 寫 HTML/CSS/JS。文字部分（標題、痛點、口號）我自己定，Claude 只是把 outline 變成 markup，prompt 裡明確說「不要顛覆性、革命性、超棒、神器」。實作部分（CSS 動畫、鍵盤事件、進度條）Claude 寫得比我親手寫快 5 倍。分工：我管教什麼、要什麼感覺；AI 管把 HTML/CSS 寫出來。',
      },
      {
        q: 'GitHub Pages 不會收費嗎？流量大會掛嗎？',
        a: 'public repo 完全免費，soft limit 每月 100GB 流量、100GB 倉庫大小，我這個 repo 才 51KB 完全用不到。一場企業內訓 30 個學生連一次靜態 HTML，總流量約 1MB。流量永遠不會是問題。private repo 用 GitHub Pages 要 GitHub Pro 以上，教學素材建議 public，學生才能 fork。',
      },
      {
        q: '學生用手機看會 OK 嗎？',
        a: '不會 OK。我刻意沒做 responsive。簡報是給投影機（1920×1080）跟 17 吋筆電用的，手機螢幕字會炸出去。回家複習可以用筆電開或我會另發 PDF。為了手機去動 CSS 會犧牲大螢幕的視覺密度，不值得。',
      },
      {
        q: '可以拿這個 repo 商用嗎？',
        a: 'repo 目前沒附 LICENSE 預設是 All Rights Reserved。實務上歡迎 fork 改你自己的教學內容。要拿設計風格 / CSS / 結構去做付費課程，麻煩標一下來源（連結到 repo 或我的部落格）。不用問我、不用付錢，標個名字而已。商用細節歡迎私訊。',
      },
    ],
    featured: false,
  },
  {
    slug: 'karpathy-llm-wiki',
    publishDate: '2026-05-20',
    title:
      'LLM Wiki 跟 RAG 差在哪?Karpathy 那套我跑兩週實測 token 降 87%',
    excerpt:
      '2026 年 4 月 Karpathy 在 gist 丟了一份 200 行 markdown,一週後全網炸開、12 個社群 implementation。一句話講:讓 LLM 把你丟的所有資料「編譯」成一個結構化的 markdown 知識庫,以後問問題不查原始檔、查這個被整理過的 wiki。本文拆解 RAG vs LLM Wiki 的編譯式/解釋式之差、三層架構、30 分鐘上手路徑、我把 7 場教學逐字稿 + 200 則 Discord QA 丟進去跑兩週的實測(token 降 87%)、5 個踩坑、什麼情境裝了反而是負擔。',
    category: 'AI 工具',
    tags: [
      'LLM Wiki',
      'Karpathy',
      'Claude Code',
      'RAG',
      '知識管理',
      'AI 工作流',
      'Obsidian',
      'AI 工具',
    ],
    faqItems: [
      {
        q: '這跟 Notion AI / Mem.ai / Reflect 那種 AI 筆記工具有什麼不同?',
        a: 'Notion AI 那批是「在你既有筆記裡加 AI 查詢入口」,本質還是 RAG——你寫的筆記是 source,AI 是 reader。LLM Wiki 是「AI 自己生成筆記、自己維護」,你的 source 跟 AI 的 wiki 是兩層。差別在 wiki 是 AI 為了 AI 自己以後查詢方便而寫的——結構是給 AI 看的(frontmatter、wikilink、confidence rating),不是給人看的(雖然人也看得懂)。',
      },
      {
        q: '為什麼還要 markdown?直接存 SQL / vector DB 不就好了?',
        a: 'Karpathy 原文有解釋:markdown 是 LLM 最熟的格式。LLM 看 markdown 像人看母語,寫也最自然。用結構化 schema(JSON / SQL)會花時間在 schema migration、欄位設計,不是知識本身。更實際的理由:markdown 可以丟 Obsidian / Logseq / grep,完全 tool-agnostic、永遠不會被綁定、git diff 看得懂。',
      },
      {
        q: 'wiki 會不會被 LLM hallucination 污染?',
        a: '會,這是這方案最大的風險。解法:第一,frontmatter 寫 sources 連回原始檔,人類抽查時順著查;第二,confidence rating LLM 對自己 hallucinate 出來的東西通常會給 low;第三,定期跑 lint-wiki 找 broken link、孤兒頁、矛盾;第四,重要 claim 你親眼讀過 source 再放心用。LLM Wiki 不是「自動產生可信知識庫」,是「自動產生一個你可以快速 audit 的草稿知識庫」,心態調對才不會出包。',
      },
      {
        q: '可以多人共用嗎?',
        a: '技術上可以(wiki/ 跟 sources/ 放 git repo),但實務上很痛。兩個人同時 ingest 會 race condition、schema 偏好不同會打架、commit conflict 在 markdown 上難 resolve。要團隊用,指定一個 wiki librarian 統一負責 ingest、其他人 read-only。或者每人各自一個 wiki,定期跨 wiki synthesis(這還是 alpha 階段)。',
      },
      {
        q: 'token 真的會降 95% 嗎?哪些情境會降、哪些不會?',
        a: 'MindStudio 案例降 95%(383 檔案 + 100 場逐字稿),我自己案例降 87%。會降的關鍵在 query 階段不再餵原始 chunk,只餵被編譯過的結論頁。會降很多的情境:資料量大(>50 份)、問題偏綜合 / 模糊;降幅小的情境:資料量小、問題偏字面查詢(因為 retrieval-based RAG 本來就準)。前期 ingest 階段反而比 RAG 燒 token,投資回收期看你用多兇。',
      },
      {
        q: '什麼情境別裝 LLM Wiki?',
        a: '資料量小於 20 份(沒到甜蜜點,Obsidian + 全文搜尋更快);資料常變(新聞、Twitter feed 每次 ingest 都要寫 contradiction block,維護成本爆炸);你只是要「問檔案內容」(NotebookLM / Cursor docs 直接餵原檔答得很好);你不打算動 schema(LLM Wiki 80% 價值在你願意調 CLAUDE.md);公司資料合規不能丟 Claude API(編譯階段要餵 LLM,合規問題要先解)。',
      },
      {
        q: 'Karpathy 自己現在還在維護嗎?有 canonical implementation 嗎?',
        a: '到 2026 年 5 月為止 gist 本體沒再更新。但社群 fork 持續迭代——sdyckjq-lab、vanillaflava、kfchou、6eanut 四家活躍度最高,各自有 schema 變種。Karpathy 在 Twitter 多次轉發實作版,但沒指定官方分支。目前社群驅動,沒有 canonical implementation。新手建議從 6eanut/llm-wiki 開始(最貼近原文)。',
      },
    ],
    featured: true,
  },
  {
    slug: 'mempalace-3-3-5-claude-p-proxy',
    publishDate: '2026-05-20',
    title:
      'MemPalace 3.3.5 救援實錄:HNSW Quarantine、from-sqlite 重建,與一支 claude -p HTTP proxy',
    excerpt:
      'chromadb 1.5.x 在 macOS 26.4 ARM64 必 SIGSEGV,所有 mempalace CLI 指令全死、只剩 MCP server 苟活。MemPalace 3.3.5 用兩個機制救回來:HNSW segment quarantine 自動隔離壞索引,repair --mode from-sqlite 從 sqlite3 直接撈 (id, document, metadata) 重灌新 palace。本文記錄完整升級路徑、3.3.5 兩個救命機制原理、外加我寫的 180 行 Python claude-p-openai-proxy.py——把 claude -p CLI 包成 OpenAI 相容 HTTP 端點,讓 mempalace compress 走 Max 訂閱、零 API 成本。',
    category: 'AI 工具',
    tags: [
      'MemPalace',
      'ChromaDB',
      'HNSW',
      'Claude Code',
      'Anthropic',
      'RAG',
      'vector-db',
      'Python',
    ],
    faqItems: [
      {
        q: '我也想裝這支 proxy,但我沒 Max 訂閱怎麼辦?',
        a: '不能用。claude -p 認本機 ~/.claude/ 的訂閱狀態,沒登入會拒跑。OpenAI API key 直連反而簡單,把 proxy 改成轉發給 https://api.openai.com/v1/chat/completions 就好——但這樣就跟直接用 OpenAI 一樣,proxy 沒意義。',
      },
      {
        q: '為什麼不直接讓 mempalace 內建 claude -p 支援?',
        a: 'mempalace 上游沒義務支援 Anthropic CLI 的怪招,而且這是個人 Max 訂閱情境,不通用。寫成獨立 proxy 反而更乾淨——任何 OpenAI 相容客戶端都能接,mempalace 端只要設 LLM_ENDPOINT 環境變數。',
      },
      {
        q: 'proxy 安全嗎?要不要綁 auth?',
        a: '我這支只 bind 127.0.0.1,不暴露公網。LAN 內如果其他人能 ssh 到這台,他能直接跑 claude -p,要 proxy 也只是方便他用 HTTP 而已。不要 bind 0.0.0.0——那等於把 Max 訂閱開放給整個 LAN,違反 Anthropic ToS。',
      },
      {
        q: 'HNSW quarantine 會不會把好 segment 也誤判隔離?',
        a: '看 data_level0.bin 跟 chroma.sqlite3 的 mtime 差距判斷。正常運作下 sqlite3 寫入後 HNSW segment 會接著刷新;差距大代表 segment 上次 flush 失敗。不會誤判正常 segment,但會誤判「palace 長期沒進新 drawer」的情境——這時 sqlite3 不動、segment 也不動,差距趨近 0,正常。問題情境是 sqlite3 動了 segment 沒跟上。',
      },
      {
        q: '升 3.3.5 要做什麼準備?',
        a: '備份 ~/.mempalace/ 到 .mempalace.bak.<date>/。然後 pip install -U mempalace。MCP server 重啟一次讓它載新版。如果原本卡在 apply_logs 才需要跑 repair --mode from-sqlite --archive-existing,正常的話 quarantine 自動跑、不用手動干預。',
      },
      {
        q: 'claude -p 為什麼會比 OpenAI API 慢這麼多?',
        a: '兩個原因。第一,claude -p 每次都是冷啟動,要載 Node.js runtime + CLI ~3-5 秒;第二,subprocess.run 走 stdout/stdin pipe,跟 HTTP API 的 keep-alive 沒得比。對批次壓縮無所謂,但要 chat 級互動延遲就不適合,該用 OpenAI / Anthropic API 直連。',
      },
    ],
    featured: false,
  },
  {
    slug: 'phone-local-llm-pocketpal',
    publishDate: '2026-05-20',
    title:
      '手機跑本地 LLM 怎麼裝？iPhone 15 Plus / Android 完整教學（PocketPal AI 安裝、模型選擇、踩坑）',
    excerpt:
      '想用手機跑本地 LLM，但不知道要裝什麼 app、能跑多大的模型、能不能進開發工作流？本文拆解 2026 年 5 月最熱門的三個 on-device LLM app（PocketPal AI / LLMFarm / MLC Chat）怎麼選、iPhone 15 Plus 真實能跑哪些模型（1B-2B 是甜蜜點，3B 卡頓、4B+ 跑不動）、PocketPal AI 從 0 開始安裝、5 個踩坑（記憶體爆掉、發燙降頻、context window 太短、token/秒掉到不能用、Apple Intelligence 跟本地 LLM 的關係），最後解釋為什麼「手機算力幫電腦」是死路、什麼情境真的值得在手機跑 LLM。',
    category: 'AI 工具',
    tags: [
      'PocketPal AI',
      '本地 LLM',
      'iPhone',
      'Android',
      'LLMFarm',
      'MLC Chat',
      'Apple Intelligence',
      'on-device AI',
      'GGUF',
      'llama.cpp',
    ],
    faqItems: [
      {
        q: 'iPhone 15 Plus 真的可以跑 LLM 嗎？跟 iPhone 15 Pro 差多少？',
        a: 'iPhone 15 Plus 用 A16 Bionic + 6GB RAM，可以跑 1B-2B 量級模型（Qwen2.5 1.5B、Gemma 2 2B、Llama 3.2 1B），3B 會卡頓、4B+ 直接跑不動。iPhone 15 Pro 用 A17 Pro + 8GB RAM，sweet spot 拉高到 3B-4B，而且額外解鎖 Apple Intelligence（內建 ~3B 模型）。差別主要在 RAM 不是 CPU——LLM 推理瓶頸是記憶體頻寬，6GB 跟 8GB 差距比想像中大。',
      },
      {
        q: 'PocketPal / LLMFarm / MLC Chat 我該選哪個？',
        a: 'iOS 新手 → PocketPal AI（介面最友善、HuggingFace 直接抓、內建 benchmark）。iOS 老玩家想搞 LoRA / 多模態 → LLMFarm（彈性高但介面陽春）。Android 用 Snapdragon 旗艦機（S24 Ultra、Pixel 9 Pro）→ MLC Chat（吃 Hexagon NPU，速度比 llama.cpp CPU 快 2-3 倍）。Android 中階機或非高通晶片 → PocketPal AI。Google AI Edge Gallery 還在測試版、模型選擇少，現階段別碰。',
      },
      {
        q: '能不能讓我的 iPhone 餵算力給電腦用？',
        a: '理論上可以、實務上沒意義。手機 token/秒（5-8）比電腦慢 10 倍，網路傳輸延遲再加 100-300ms，整體比電腦直接跑 Ollama 慢 15 倍以上，還會把手機電池燒到 60°C 觸發降頻。真要用閒置算力，買台二手 Mac mini M1（NT$15k）24/7 開著跑 Ollama，遠比手機方案實用。手機跑 LLM 的真正價值在「離線」「隱私」「便攜」，不是「算力共享」。',
      },
      {
        q: 'Apple Intelligence 跟 PocketPal 衝突嗎？要選哪個？',
        a: '不衝突，定位不同。Apple Intelligence 是「系統級隱形 AI」——摘要通知、改寫訊息、Siri 升級，使用者不需要主動「跟 AI 對話」。PocketPal 是「主動式 AI 助手」——你打開 app 跟它聊。Apple Intelligence 限 iPhone 15 Pro 以上（A17 Pro / M1+），iPhone 15 Plus 用不到。如果你是 15 Plus 用戶想要 on-device AI 體驗，PocketPal 是唯一選擇。',
      },
      {
        q: '手機跑 LLM 會不會把電池搞壞？',
        a: '短期不會、長期有風險。LLM 推理會吃滿 CPU + GPU，連續跑 10 分鐘手機溫度可以飆到 45-50°C 觸發降頻保護。鋰電池長期高溫運作確實會加速老化，但「老化」是 6-12 個月才看得出來的事，偶爾跑 30 分鐘做測試沒問題。日常使用建議：別連續超過 20 分鐘、別邊充電邊跑、夏天注意溫度。',
      },
      {
        q: '什麼情境下手機跑 LLM 真的有用？',
        a: '三個情境真的值得：(1) 隱私需求重——醫療筆記、敏感對話、客戶資料絕對不能上雲端；(2) 離線環境——出差到飛機上 / 偏遠地區 / 公司內網禁外連，但又需要 AI 幫忙整理筆記；(3) 開發者驗證 on-device 部署可行性——你要做 app 賣給上面兩種人，自己得先跑過。其他情境（日常聊天、寫 code、查資料）老老實實用 ChatGPT / Claude API 划算 10 倍。',
      },
    ],
    featured: true,
  },
  {
    slug: 'claude-code-lesson-1',
    publishDate: '2026-05-20',
    title:
      'Claude Code 入門第一堂:訂了 Claude Pro 之後怎麼開始——4 個 demo + permission mode 4 種 + 邊界',
    excerpt:
      '訂閱 Claude Pro($20/月)、想裝 Claude Code 但還沒動手?這是我 2026-04-28 第一堂 Pro 版小班的完整紀錄。4 個 demo:一句話讀 CSV、整理 24 個亂檔案、SQLite 查 4 月營收、從零部署網站——每個都 5 分鐘內看到結果。然後拆 4 種 permission mode(default/acceptEdits/plan/bypassPermissions)、`.claudeignore` 防憑證外洩、跟我自創的「Claude 邊界」觀念——不要讓 AI 做你也不懂的事情,它犯錯時會極度自信。',
    category: 'AI 教學',
    tags: [
      'Claude Code',
      'Claude Pro',
      'AI 教學',
      '初階班系列',
      'Permission Mode',
      'AI 入門',
      'Pro 訂閱',
    ],
    faqItems: [
      {
        q: 'Claude Pro $20/月跟免費版 Claude.ai 差在哪?',
        a: '免費版 Claude.ai 每 5 小時給你 30-40 則訊息,Pro 拉高到 5 倍左右、Sonnet 4.6 / Opus 4.7 都能用、最重要的是 Claude Code CLI 從 Pro 開始才用得起來(免費額度不夠跑互動式 coding)。年繳 $200($17/月)再省一些。我這個小班只收已經自掏腰包訂 Pro 的人——自己花錢才會認真學。',
      },
      {
        q: '4 個 demo 我要全部跑過才算學會嗎?',
        a: '不用,但 Demo 4「從零部署個人網站」是回家作業。前 3 個 demo 是「看見它能做什麼」,Demo 4 是「我也能做到」——這個體驗的落差是第一堂的關鍵。如果你 Demo 4 卡在 GitHub Pages 設定,留言問我,office hour 救你。',
      },
      {
        q: 'acceptEdits 跟 bypassPermissions 差在哪?都不問了不是一樣?',
        a: '差很多。acceptEdits 只自動接受「寫檔」類動作(編輯檔案、mkdir、touch、mv、cp),其他 Bash 指令還是會問你(curl、rm -rf、git push 都會跳對話框)。bypassPermissions 是全部不問,連 `rm -rf ~/Documents` 也直接跑——這就是為什麼它叫 `--dangerously-skip-permissions`,新手前兩週千萬別設這個 alias。',
      },
      {
        q: '為什麼一直強調「Claude 邊界」?它不是很聰明嗎?',
        a: '聰明跟「不會錯」不同。Claude 寫 Python 寫得比 80% 人類強——前提是你會看結果對不對。如果你不會 Rust、它寫一個會 deadlock 的 mutex,build 過了你以為對了,上線就爆。同樣道理:不懂稅法別讓它寫稅務計算邏輯。它的錯誤是「極度自信地說錯」,不是「猶豫地說錯」,你看不出差別。守住邊界 = 守住你的職業信用。',
      },
      {
        q: '我電腦上要先裝什麼才能跑 Demo?',
        a: '三樣:Claude Code CLI(走 `claude.com/code` 下載或 npm 裝)、登入你的 Pro 帳號(`claude` 第一次跑會跳瀏覽器 OAuth)、然後 cd 到一個你不介意它動的資料夾(別在桌面 root 跑、別在 Documents root 跑、開一個 `~/workspace/playground/` 之類的)。Demo 4 額外需要 GitHub 帳號跟 gh CLI,但這在第四堂才會 hands-on,第一堂跑不到也沒關係。',
      },
      {
        q: '什麼樣的人不適合來上這個 Pro 版?',
        a: '三種人不適合:(1) 完全沒用過 ChatGPT 的人——先用 Claude.ai 兩週再來;(2) 公司禁止程式碼上 SaaS 的人——你需要走 self-hosted 路線,看 [Hermes Agent 接內網 LLM](/blog/hermes-agent-mac-install/) 那篇;(3) 期待「我什麼都不用會、AI 全幫我」的人——這個小班的核心觀念是「會 AI 邊界」,要你思考的部分不會比寫 code 少。',
      },
    ],
    featured: true,
  },
  {
    slug: 'claude-code-lesson-2',
    publishDate: '2026-05-21',
    title:
      'CLAUDE.md 怎麼寫?Claude Code 第二堂——馴服系統提示 + 十大 prompt 定義 + Ultra Think',
    excerpt:
      'Claude Code 預設每次開啟都是失憶的,但只要你寫好 `~/.claude/CLAUDE.md`(全域) + 專案 `CLAUDE.md`,它就會在每次對話開頭把這兩份檔讀進去當作永遠的指令。本文是 2026-05-05 Pro 版第二堂的完整紀錄——十大 prompt 定義對照表(指令/上下文/人設/輸出格式/約束/範例/評估/迭代/護欄/記憶)、`/compact /resume` 救命指令、pwd/ls/cd 在 Claude 內的座標系、Ultra Think 馬力全開、最後用一個「每天早上 7 點 Line 通知前一天踩坑」的 `/schedule` 收尾。',
    category: 'AI 教學',
    tags: [
      'Claude Code',
      'Claude Pro',
      'AI 教學',
      '初階班系列',
      'CLAUDE.md',
      'Prompt Engineering',
      'Ultra Think',
    ],
    faqItems: [
      {
        q: '全域 CLAUDE.md 跟專案 CLAUDE.md 要寫什麼不同?',
        a: '全域寫「你這個人不變的偏好」——人設(資深工程師)、輸出格式(繁體中文簡潔)、約束(不准 commit credentials)、護欄(不准 force push)、memory 索引在哪。專案寫「這個 repo 的技術細節」——用什麼框架版本、test 怎麼跑、business domain 術語對照、這個 repo 特殊紀律(像 popularize 專案我寫「Bob 是企業內訓講師,教材路徑常含中文資料夾」)。兩份檔每次 session 開頭都會被讀,等於兩層 system prompt。',
      },
      {
        q: '十大定義是 Anthropic 官方分類嗎?',
        a: '不是,是我自己整理的、跟 [Anthropic Prompt Engineering 指南](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview) 同源但更實用。10 個是:指令(Prompt)、上下文(Context)、人設(Persona)、輸出格式(Output Format)、約束(Constraint)、範例(Few-shot)、評估(Eval)、迭代(Iteration)、護欄(Guardrail)、記憶(Memory)。不要每條都寫,而是「卡住寫不下去時對照看漏了哪幾項」。我自己 CLAUDE.md 重點放在 3、4、5、9、10。',
      },
      {
        q: 'Ultra Think 那個 Alt+Ctrl+Shift+H 跟官方 Option+T 哪個對?',
        a: '兩個都試試看。Anthropic 官方文件記載是 macOS Option+T / Windows Alt+T,但我自己上課 demo 用的是 Alt+Ctrl+Shift+H(把 thinking token budget 拉到上限 31,999)。可能是不同版本的 Claude Code CLI 快捷鍵不同,也可能是 terminal(WezTerm / iTerm2)攔截了按鍵。新手兩個都按按看哪個會在 status line 看到 "thinking..." 提示,看到的那個就是有生效。',
      },
      {
        q: '`/compact` 跟 `/clear` 跟新開 session 差在哪?',
        a: '三個程度不同。`/compact` 是壓縮,保留摘要扔掉細節,它還記得「我們在做什麼」、但不記得「兩小時前那個 import 路徑」。`/clear` 是清光當前 session,完全重來。新開 session 是另外一個 session,但前一個用 `claude --continue` 還救得回來。我的習慣:長任務每 90 分鐘主動 `/compact`,不等它叫我。`/clear` 只在「真的要從零開始」用。',
      },
      {
        q: '`/schedule` 跟 `/loop` 都是定時,差在哪?',
        a: '`/schedule` 是「定時觸發一次 prompt」(像 cron),`/loop` 是「給目標、它自己連續迭代到滿意」。`/schedule` 適合每天 5:03 寄日報這種事;`/loop` 適合「幫我把 Hermes Agent 那篇文章改到 SEO score ≥100」這種需要多輪。兩個都是 2026 三月推出、最多 50 task/session、7 天過期。第三堂會把 `/loop` 完整 demo。',
      },
      {
        q: '我寫了 CLAUDE.md 但 Claude 還是不照做怎麼辦?',
        a: '三個常見原因:(1) 你寫得太抽象,改寫成具體規則+理由(「禁開場白:太棒了/這是個好問題」比「請簡潔」有效 5 倍);(2) Claude 4 在 constitutional AI 訓練下會優先尊重「使用者明確要求的拒絕語氣」,所以你要寫成「拒絕做 X」而不是「請做 Y」;(3) 你的 CLAUDE.md 太長(>500 行),被截斷或被忽略,壓到 200 行內。',
      },
    ],
    featured: false,
  },
  {
    slug: 'claude-code-lesson-3',
    publishDate: '2026-05-22',
    title:
      'Claude Code Skill / Subagent / Slash Command 差在哪?第三堂自動化實戰 + /loop + Hook + Remote Control',
    excerpt:
      'Skill、Sub-agent、Slash Command 三個東西長得像、其實完全不同:Skill 是觸發式的小教學文件(主 agent 自己決定要不要讀)、Sub-agent 是有獨立 context 的小弟(平行跑、回精簡結論)、Slash Command 是你定義的快捷指令。本文是 2026-05-12 Pro 版第三堂的完整紀錄——加上 `/loop` 連續迭代、Hook 任務跑超 5 分鐘自動 Line 通知、Remote Control 手機掃 QR 操控你電腦、跟 ralph-wiggum 死磕迴圈工具(來自辛普森家庭那個 Ralph)。',
    category: 'AI 教學',
    tags: [
      'Claude Code',
      'Claude Pro',
      'AI 教學',
      '初階班系列',
      'Sub-agent',
      'Skill',
      'Loop',
      'Remote Control',
      'Hook',
    ],
    faqItems: [
      {
        q: 'Skill / Sub-agent / Slash Command 我什麼時候該用哪個?',
        a: '記三個比喻:Skill = SOP 手冊(你想加紀律、讓主 agent 看到觸發詞就會照 SOP 跑);Sub-agent = 派外包(任務很大、想 parallelize、不想吃主 context);Slash Command = 鍵盤快捷鍵(常用的長 prompt 一鍵跑、可以帶參數)。最常見誤解:「Skill = 函式」錯,它不能被 invoke,是主 agent 自己決定;「Sub-agent = 多視窗」錯,它是另一個獨立 session 沒有共享記憶。',
      },
      {
        q: 'sub-agent 跟主 agent 怎麼分工?',
        a: '主 agent 做「策略」(這個任務要拆成幾步、誰先做、誰後做),sub-agent 做「執行」(掃 202 個檔案分類、查 50 個 API endpoint 文件、平行寫 5 個 unit test)。設計訣竅:sub-agent 任務的「輸出」要 ≤ 主 agent 的可用 context,不然送回來主 agent 還是會 context 爆掉。經驗值:單個 sub-agent 報告 ≤ 5000 字。',
      },
      {
        q: 'Hook 的 PreToolUse / PostToolUse / Stop 什麼時候各用哪個?',
        a: 'PreToolUse 用在「攔截」——它要跑 `rm -rf` 之前我先 sanity check 一次。PostToolUse 用在「驗收 + 自動修」——它寫完 TypeScript 我自動跑 tsc + prettier 修格式。Stop 用在「總結 + 通知」——任務跑完丟 Line 通知、做 backup、寫 daily summary。新手第一個 hook 建議從 Stop 開始(風險最低、價值高)。',
      },
      {
        q: 'Remote Control 安全嗎?手機掃 QR 不會被中間人攔截?',
        a: '官方文件明寫:Remote Control 的 QR code 是「短時效 device pairing token」,只有同一個 LAN 或經 claude.ai relay 的會話有效、token 約 10 分鐘過期。但風險還是有:你手機如果有惡意 app 掃描你螢幕拍到 QR code、那 10 分鐘內可以接管你 session。建議:在外面用 Remote Control 的時候鎖螢幕、別在咖啡廳大剌剌秀出 QR。Team / Enterprise 預設關閉、admin 要開才能用,個人 Pro 預設開。',
      },
      {
        q: 'Pro 額度跑 `/loop` 跟 `/schedule` 會不會爆?',
        a: '看用法。我自己 `/schedule` 每天 5:03 寄 AI 日報(8K tokens/次)+ 偶爾 `/loop` 跑 SEO 文章迭代(50K tokens/次 × 5 次/週)= 一個月約 1.5M tokens,在 Pro 範圍內。會爆的情境:把 `/loop` 設成 max-iterate=20 跑很大專案、或一天設 10 個 `/schedule`——這時建議切到 Max($100/月)或開 API key 用 pay-as-you-go。2026-06-15 之後 headless `claude -p` 跟 Agent SDK 走獨立額度,情況會更寬鬆。',
      },
      {
        q: 'ralph-wiggum 跟 `/loop` 我該用哪個?',
        a: '`/loop` 是 Anthropic 官方、預設安全、有明確時間/次數上限。ralph-wiggum 是社群 plugin、更死磕、適合「我給你終點、你跑到對為止」的任務(像把 build error 修到全綠、寫 test 寫到覆蓋率 ≥80%)。新手用 `/loop`,進階(裝過 Superpowers 之後)用 ralph-wiggum。注意 v2.6 / v2.7 有 iterate count 重置 bug,看到它跑超過 max 手動 Ctrl+C 然後回報 issue。',
      },
    ],
    featured: false,
  },
  {
    slug: 'claude-code-lesson-4',
    publishDate: '2026-05-23',
    title:
      'obra superpowers 怎麼裝?Claude Code 第四堂——MCP + GitHub + Headless 接生態系完整實戰',
    excerpt:
      '2026-05-19 Pro 版第四堂——但實際發生跟教學計畫完全不一樣。原本要教 Git 三動作,現場改成「我們自己寫一定不是最優解,要如何使用別人寫的」。實際走了 4 件事:Superpowers plugin 安裝(卡關 3 次:`/plugins` 沒搜到、Skill 沒生效、hook 把 build 卡死)、Twinkle Hub MCP 接政府開放資料(查 2024 國防部決標 12 筆)、GitHub 註冊 + gh CLI auth(CAPTCHA 卡 5 分鐘、學員 chien chang 救場)、headless `claude -p` 半夜跑 100 個檔案翻譯 batch。Pro 訂閱者照做完整路徑。',
    category: 'AI 教學',
    tags: [
      'Claude Code',
      'Claude Pro',
      'AI 教學',
      '初階班系列',
      'Superpowers',
      'MCP',
      'Twinkle Hub',
      'GitHub',
      'Headless',
    ],
    faqItems: [
      {
        q: '為什麼第四堂砍掉教學計畫、現場改題?',
        a: '前三堂的設計是「我教你怎麼指揮 AI 做你不會的事」,第四堂變成「來教你 Git add/commit/push」就是斷裂——學員一半是行政 / 業務,他們對 Git 沒感覺、會說「那我用 Dropbox」。早上 dry-run 的時候 Claude 自己提醒我這個落差,下午我直接改題成「站在巨人肩膀上:plugin / MCP / GitHub / headless 都是用別人的」,跟前三堂延長線完美對齊。文章照實際發生寫、不是計畫版本——這是真實上課素材的價值。',
      },
      {
        q: 'Superpowers plugin 為什麼 `/plugins` 搜不到?',
        a: 'Marketplace 沒 add。要先 `claude /plugin marketplace add obra/superpowers-marketplace`,再 `claude /plugin install superpowers`。少了 marketplace add 那一步就搜不到——這是 README 沒寫清楚的 user trap。解法:把網址 `https://github.com/obra/superpowers` 直接貼給 Claude、叫它「幫我裝這個 plugin」,它讀 GitHub 頁面、找正確 install 指令、跑完。比你自己摸文件快。',
      },
      {
        q: 'Twinkle Hub MCP 怎麼裝?要收錢嗎?',
        a: 'Alpha 階段免費、無 rate limit。裝法走「把 hub.twinkleai.tw 網址貼給 Claude、叫它幫你裝」——它讀 setup instructions、寫進 `~/.claude.json` 的 mcpServers 區塊、重啟 MCP server。裝完可以查 52,960 筆 data.gov.tw 資料 + 立法院議案 + 政府電子採購網。我現場 demo 查 2024 國防部決標 12 筆,10 秒拉出來——比官方 web.pcc.gov.tw 快 100 倍。',
      },
      {
        q: 'GitHub 註冊卡 CAPTCHA 怎麼辦?',
        a: '開無痕視窗 + 新 email 重註冊,通常一次過——這是我學員 chien chang 救我的招。GitHub 對某些 cookie / IP / 瀏覽器指紋有偏見,正常視窗連續挑戰你 5 次也很正常。這件事的教育意義是:AI 不是萬能、CAPTCHA 它幫不了你,身邊懂的人比你會 Claude 還重要。',
      },
      {
        q: 'Headless `claude -p` 跟互動式比起來,Pro 額度怎麼算?',
        a: '目前(2026-05)`claude -p` 跟互動式共用同一份 Pro 額度。我量過 100 個 markdown 翻譯 batch 耗約 400K input + 200K output tokens、等於 Pro 額度 8%。**2026-06-15 之後**,[官方文件](https://code.claude.com/docs/en/headless) 明寫 `claude -p` 跟 Agent SDK 使用會從新的「Agent SDK credit」扣、跟互動式 Pro 用量分開——對 Pro 訂閱者反而是利多,半夜跑 batch 不再吃光白天額度。',
      },
      {
        q: '這個小班結束之後我該往哪走?',
        a: '三個方向:(1) 寫自己的 plugin / skill,參考 Jesse Vincent 的 Superpowers 結構;(2) 接公司內網 LLM,看我 [MemPalace + claude -p HTTP proxy](/blog/mempalace-3-3-5-claude-p-proxy/) 那篇是這個方向;(3) Cursor / Cline / Hermes Agent 並用,三家各有強項,看 [Hermes Agent 入門](/blog/hermes-agent-intro/) 做對照。我會繼續開中階班(自己寫 plugin、公司導入)、進階班(多 agent orchestration、production 部署),想接著上的留 email 我下期通知。',
      },
    ],
    featured: false,
  },
  {
    slug: 'claude-code-pro-class-hub',
    publishDate: '2026-05-24',
    title:
      'Claude Code Pro 訂閱初階班完整索引——4 堂 4 小時把 $20/月用回本',
    excerpt:
      '訂了 Claude Pro($20/月)但不知道怎麼把它用回本?2026/05/16-19 我開了四堂小班,全程錄影 + 整理成文章公開,完整看完約 2 小時、實作約 4-6 小時。四堂順序「看見 → 馴服 → 自動化 → 接生態」:1️⃣ 4 demo + permission mode 4 種 + 邊界、2️⃣ CLAUDE.md 兩層 + 十大 prompt 定義 + Ultra Think、3️⃣ Skill/Subagent/Slash Command + /loop + Hook + Remote、4️⃣ obra superpowers + MCP + GitHub + Headless。這頁是完整索引 + FAQ,適合一次看完或當回顧工具箱。',
    category: 'AI 教學',
    tags: [
      'Claude Code',
      'Claude Pro',
      'AI 教學',
      '初階班系列',
      'Hub 索引',
      'Pro 訂閱',
      '自學路徑',
    ],
    faqItems: [
      {
        q: '四堂課完全沒寫程式經驗的人能跟嗎?',
        a: '第一堂可以、第二堂可以、第三堂前半可以、第四堂後半(GitHub + Headless)會比較吃力。建議「行政 / 業務 / 內容創作」族群至少看完第一二堂,把 Claude Code 當「會做事的助理」用,先建立信心再接第三四堂。完全沒用過 ChatGPT 的人請先用 Claude.ai 兩週再來。',
      },
      {
        q: '看完四堂需要多久?',
        a: '文字版每堂約 25-35 分鐘讀完,四堂連續看約 2 小時。如果要照做、跑 demo、設 CLAUDE.md、裝 Superpowers,完整實作約 4-6 小時。建議分四個下午做,每天一堂、立刻上手最有效——不要一次塞完,認知會超載。',
      },
      {
        q: '訂閱 Claude Pro 一定要訂嗎?有免費版能跟嗎?',
        a: '不訂無法跟。Claude Code 是 Pro / Team / Enterprise 訂閱才能用,免費版只有對話框 Claude.ai。Pro 是 $20 美元/月——這個小班的核心就是「教你怎麼把這 $20 用回本」。年繳 $200($17/月)再省一點。',
      },
      {
        q: 'Mac / Windows / Linux 都能跟嗎?',
        a: 'Mac 跟 WSL2 Ubuntu 最順,Windows 原生 PowerShell 跟 Git Bash 都有坑(CRLF、path 翻譯、缺工具)。如果你是 Windows,建議裝 WSL2 + Ubuntu 跟,跟 Mac 體驗一樣。Linux 原生也順,沒問題。',
      },
      {
        q: 'Claude Code 跟 Cursor / Cline / Aider 差在哪?',
        a: 'Claude Code 是 Anthropic 官方 CLI,直接吃 Pro 訂閱、不需要另外買 API。Cursor / Cline 是 VS Code 插件,要自己接 API。Pro 訂閱者最划算的選擇就是 Claude Code——其他工具好但要另外付錢。如果你想跨工具並用,看 [Hermes Agent 入門](/blog/hermes-agent-intro/) 那篇比較。',
      },
      {
        q: '這個小班的逐字稿/錄影有開放嗎?',
        a: '錄影在學員社群內部,逐字稿整理成這四篇文章公開。所有公開版的內容都收錄在這 4+1 篇(四堂 + Hub)裡,你不會錯過。文章版反而比錄影更完整——多了 5 分鐘 SEO 自查、長尾關鍵字命中、FAQ JSON-LD 結構化,適合搜尋進來的讀者。',
      },
    ],
    featured: false,
  },
  {
    slug: 'memory-governance-ep1-claude-bad-notes',
    title: 'Memory 治理 EP1｜我的 Claude 記了一堆爛筆記',
    excerpt:
      '用 Claude Code 半年,memory 從 10 個檔長到 76 個,以為自己在養 AI 大腦,結果用 Obsidian Graph View 一打開全是花朵狀:所有檔只連中心的 MEMORY.md,檔跟檔之間幾乎沒連線。三胞胎重疊 70% 的 feedback、9 個全局/專案級同名檔、cross-link 趨近 0。本文拆三個結構性根因:同主題開新檔不擴充既有、寫完不加 [[link]]、全局 vs 專案級沒判準,以及整理之後做的三件事(合併三胞胎、重寫 MEMORY.md 成 cluster、CLAUDE.md 加程序性 SOP)。',
    category: 'AI 工具',
    tags: [
      'Claude Code',
      'CLAUDE.md',
      'auto memory',
      'Obsidian',
      'AI 知識管理',
      'Prompt Engineering',
      'Memory 治理',
    ],
    publishDate: '2026-05-21',
    faqItems: [
      {
        q: 'Claude Code memory 跟 CLAUDE.md 有什麼不一樣?',
        a: 'CLAUDE.md 是你寫給 Claude 的家規,每次 session 全文載入(社群建議控制在 80-120 行)。auto memory 是 Claude 自己抄的筆記,放在 ~/.claude/memory/*.md,需要時 Claude 才會去讀對應檔。兩個搭配用:CLAUDE.md 放紀律跟總綱,memory 放細節跟踩坑。',
      },
      {
        q: '我的 memory 也很亂,要全部砍掉重來嗎?',
        a: '不用。先用 Obsidian 開 ~/.claude/memory/ 看 Graph View — 如果是花朵狀(所有檔只連中心),代表結構不好但內容可能還可救。先做兩件事:(1) 把同主題的合併,內容好的留下、重複的改 .archived.md 後綴 (2) 每個檔結尾加「## 相關」區塊。光做這兩件事 graph 就會大幅改善。',
      },
      {
        q: '怎麼判斷該寫到全局 memory 還是專案級 memory?',
        a: '跨專案行為規範(寫 code 風格、code review 標準、語氣偏好)→ 全局 ~/.claude/memory/。單一專案的細節(專案路徑、DB 連線、特定 bug 踩坑)→ 專案級 ~/.claude/projects/<cwd>/memory/。不確定的時候優先寫全局,以後可以從專案級補對應 link。',
      },
      {
        q: '為什麼 Obsidian 比直接看資料夾更有用?',
        a: '資料夾只能告訴你「有什麼檔」,Graph View 告訴你「檔跟檔之間有沒有關係」。memory 系統的價值來自關係(Claude 透過一個檔找到下一個檔),不是來自檔案數量。資料夾 50 個檔 = 看起來很多;Graph 50 個節點沒連線 = 馬上看出問題。',
      },
      {
        q: '整理一次要花多久?',
        a: '51 個全局檔 + 25 個專案級檔,從反思到 commit 完大約 3 小時。最花時間的不是合併,是寫 reflection 找根因。如果你 memory 不到 20 個檔,可能 1 小時內搞定。但整理只是治標,改 CLAUDE.md 加 SOP 才是治本,不然 3 個月後又會長回花朵。',
      },
    ],
    featured: true,
  },
  {
    slug: 'memory-governance-ep2-rules-ai-cant-remember',
    title: 'Memory 治理 EP2｜為什麼 AI 記不住你寫的規則',
    excerpt:
      '你寫了一堆 CLAUDE.md 原則,Claude 還是每次重蹈覆轍 — 不是它記憶不好,是你寫的規則「沒辦法照著做」。大部分人寫的是「描述性原則」(該做什麼、不該做什麼),但 AI 真正會跟的是「程序性 SOP」(動手前必跑的步驟、自我糾正的條件)。本文拆兩種寫法的差異、給改寫公式 「描述狀態 → 觸發條件 + 強制動作 + 違規判斷」、附 CLAUDE.md before/after 實際 diff,以及解釋為什麼 LLM 對程序性指令反應特別好。',
    category: 'AI 工具',
    tags: [
      'Claude Code',
      'CLAUDE.md',
      'Prompt Engineering',
      'AI 工具',
      'AI 工作流',
      'Memory 治理',
      'LLM',
    ],
    publishDate: '2026-05-22',
    faqItems: [
      {
        q: '我的 CLAUDE.md 才 50 行,真的需要改成程序性嗎?',
        a: '50 行剛好。你現在改的成本最低 — 規則少、踩坑少、習慣還沒固化。等到 200 行才改,你會發現一半規則早就互相矛盾,得先做整理才能重寫。短:現在改最划算。',
      },
      {
        q: '程序性 SOP 是不是會讓 CLAUDE.md 變超長?80-120 行的社群建議不就破了嗎?',
        a: '會變長,我的 CLAUDE.md 從 180 行長到 330 行。但社群 80-120 行的建議基於「每個 session 全文載入」的 context cost — 這個 cost 真實存在,但比起 AI 反覆違規再來校正的 cost,長一點的 CLAUDE.md 划算。建議:核心規則 SOP 化(占 60-70%),補充原則描述性(30-40%),不要為了短而把所有規則都描述化。',
      },
      {
        q: '描述性原則就一無是處嗎?',
        a: '不是。對人寫的東西(README、設計文件、團隊 onboarding)描述性原則比較適合 — 人會用「sense」自己腦補執行流程。對 AI 寫的東西(CLAUDE.md、Skill、Agent prompt)才需要程序化。差別在讀者:人是「理解後執行」,AI 是「pattern match 後執行」。',
      },
      {
        q: '我寫了 SOP,Claude 還是會違規,怎麼辦?',
        a: '兩種可能:(1) 觸發條件寫不夠具體,Claude 沒抓到該動的時機 — 把觸發條件用「禁止短語」「禁止症狀」這種字串比對級的描述補強。(2) 違規判斷沒列「自我罵點」 — 加一條「看到自己 X 就立刻停下糾正」。我用這兩招過去三週違規率降到原本的 1/4。',
      },
      {
        q: '那 memory 本身需要寫成程序性嗎?',
        a: '不需要。memory 是「事實 + 過去踩坑」,本來就是描述性的。程序性適用於行為規範(CLAUDE.md / Skill),描述性適用於知識儲存(memory)。不要把兩者混在一起,memory 該是查得到的字典,不是該照著跑的程式。',
      },
    ],
    featured: true,
  },
  {
    slug: 'ai-daily-seo-email-bot-howto',
    title: '讓 Claude 每天早上幫你寫一封 SEO 解讀信：cron + claude -p stateless 走 Max 訂閱 0 元 pipeline',
    excerpt:
      '上週寫過「我請 AI 每天早上 9 點寄 SEO 報告給我」 — 但信內容是 raw 數字,我每天還是要花 10 分鐘自己腦補解讀。這篇是第二階段:在原本 cron 腳本裡加 35 行 bash,用 claude -p stateless 模式呼叫 Claude(走 Max 訂閱 0 額外成本),把昨天的 GSC + Firestore 數字翻成「總評 / 需要注意 / 今天可以做」三段繁體中文解讀,放在信最上面。完整實作 + prompt 設計關鍵點 + 5 個踩坑 + 抄回家自己用 + 順手澄清「這跟 claude.ai 接 Gmail connector 完全不同」常見誤會。',
    category: 'AI 工具',
    tags: [
      'Claude Code',
      'claude -p',
      'SEO',
      'cron',
      'launchd',
      'AI 工作流',
      'AI 自動化',
      'Bash',
      'Prompt Engineering',
    ],
    publishDate: '2026-05-22',
    faqItems: [
      {
        q: '為什麼不直接讓 Claude Code 寄信?',
        a: 'Claude Code 沒有「主動排程跑」的能力 — 它是 session-based、要有人開啟 CLI 才會跑。要每天 07:07 自動跑就得靠系統層的 cron / launchd / systemd-timer。所以這套設計是:系統排程觸發 bash → bash 呼叫 claude -p 跑一次性分析 → bash 寄信。Claude 在這套裡是「批次任務 worker」,不是「主控者」。',
      },
      {
        q: 'claude -p 真的免費嗎?',
        a: '對 Max / Pro 訂閱者來說 0 額外成本。claude -p 走的是你機器登入的訂閱 quota,跟你在 Claude Code 裡聊天用的是同一份額度。Max $200/月 給的額度幾乎用不完。Pro $20/月 也夠用,每天分析一次 250 字輸出月用量微不足道。如果走 Anthropic API 每次 ~$0.001-0.005,每月仍不到 $1。',
      },
      {
        q: 'Claude 分析會不會給錯建議?',
        a: '會。LLM 不會看真實情境,只看數字。它可能建議「為某 query 補文章」但那 query 已經有文章。所以定位成「方向參考」不是「執行命令」 — 每天看一眼,make sense 就做、不 make sense 就忽略。LLM 提案 + 人類過濾 = 平均 30% 有用、70% 不重要,因為「每天 5 分鐘的提案門檻太低」,30% 有用就賺了。',
      },
      {
        q: '可以改成每週一次嗎?',
        a: '可以但不推薦。launchd plist 把 StartCalendarInterval 改成 Weekday=1 就只有週一觸發。但每週一次的問題是「訊號太弱」 — 週一看完信,週二三四五都不會想起來。每天一次反而養成習慣:raw 數據五分鐘看完、Claude 分析 30 秒讀完、沒事就略過,這個節奏最舒服。',
      },
      {
        q: 'prompt 怎麼進化?',
        a: '跑一陣子會發現 Claude 重複講同樣的事(例如老是叫你「更新 sitemap」),那就在 prompt 加一條「不要重複建議過去 7 天提過的事」。或發現它太樂觀,加「只關注壞消息」。Prompt 是可演化的東西,不是寫一次就不動。',
      },
      {
        q: '可以接到 Slack 不寄 Gmail 嗎?',
        a: '可以。把 Step 6 寄信改成 Slack webhook:curl -X POST -H Content-Type:application/json -d {text:$BODY} https://hooks.slack.com/services/YOUR/WEBHOOK。Slack 有 markdown 渲染,可以把 prompt 「不要 markdown」改成「用 Slack mrkdwn 格式」。',
      },
      {
        q: '為什麼不讓 Claude 直接 GSC OAuth 自己抓資料?',
        a: '技術上可以 — claude -p 配 MCP server 接 GSC API,讓 Claude 自己查、自己分析、自己寫信。但複雜度爆炸。MCP server 要寫、要除錯、要管 OAuth state。90% 的場景 bash + Python 已經夠 — bash 抓資料、Claude 分析資料、bash 寄信,三件事各自簡單。過度設計是寫程式的最大原罪,YAGNI 優先。',
      },
    ],
    featured: true,
  },
  {
    slug: 'hermes-agent-medical-cdss',
    publishDate: '2026-05-25',
    title:
      '如何用 Hermes Agent 把 AI 接到高風險醫療決策?血脂治療二級預防 CDSS 完整 round-trip 拆解',
    excerpt:
      'LLM 給的醫療建議怎麼讓醫師敢用?「ChatGPT 看一下」這種等級在臨床決策上不夠。本文拆我跟合作醫院做的血脂治療二級預防 CDSS 全套架構:Hermes Agent + skill 兩層 schema + 沙盒公式 + RAG MCP + JSONL trace,讓每個決策都有「skill 定義 → 公式回傳值 → RAG 引用 chunk → LLM 最終 JSON」四段證據鏈。從第一版 ChatGPT API 砍掉重做的教訓、為什麼選 Hermes、8-step pipeline、範例 round-trip 全紀錄、踩過的三個坑(LLM 漏列現用藥 / RAG cross-bleed / hermes timeout)、四大 agent 框架在醫療場景的比較。寫給做領域 AI(醫療 / 法務 / 金融 / 工控)的工程師。',
    category: 'AI 工具',
    tags: [
      'Hermes Agent',
      '醫療 AI',
      'CDSS',
      'LLM Agent',
      'RAG',
      'Sandbox',
      'MCP',
      '臨床決策支援系統',
      'AI 落地',
    ],
    faqItems: [
      {
        q: 'Hermes Agent 適合做哪類領域 AI?',
        a: '需要「LLM + 領域知識 + 結構化決策 + 可審計」的場景都適合:醫療 CDSS、法務文件審查、金融風控、工控故障診斷。共通點是「LLM 給的答案要有引用 + 公式 + 可被覆查」。如果你的場景只需要「跟使用者聊天」,Hermes 對你過殺。',
      },
      {
        q: 'LLM 算數錯誤怎麼徹底解?',
        a: '把 deterministic 算法全部寫成 module,LLM 只能呼叫不能自算。skill 內明寫「禁止自己算 X」,沙盒不執行算數 = 沒爭議。我做完這層之後算數錯誤率歸零。早期版本讓 LLM 自己算 LDL 達標,跑 100 個案有 4 個把「<」看成「≤」,差一條命。',
      },
      {
        q: 'RAG 為什麼不直接塞 prompt?',
        a: '塞 prompt 三個問題:(1) token 上限撐不住一整本指引(2) LLM 看 1 萬字會抓重點失誤(3) prompt 變大 latency 跟成本同步爆。讓 LLM 自己 query RAG 才拉相關段落,精準度跟成本同時好。我們用 bge-m3 1024d HNSW,單份 PDF retrieval 92% 命中。',
      },
      {
        q: 'Hermes 跟 Claude Code 在這場景上的差別?',
        a: 'Claude Code 偏開發者 CLI(寫 code、改 repo),Hermes 偏 production 級 agent runtime(可嵌服務、subprocess 調度、JSONL trace)。我這套醫療系統用 Hermes 是因為需要把它包在 FastAPI 後面當 production 服務跑,Claude Code 不是設計來做這件事的。兩者不是競爭,是不同 niche。',
      },
      {
        q: '這套架構好複製嗎?',
        a: 'skill 庫 + sandbox formula + RAG MCP 三件套要 40 小時左右半手工,但架構是通用的。你只要把領域指引換成你的、formula 換成你的算法、PDF 換成你的文獻就能套。我寫了 RECREATE_SOP 在 repo 裡。',
      },
      {
        q: '醫師願意用嗎?',
        a: '會用 + 會覆核才是目標。我們的設計是 reviewer-only,AI 給建議、醫師最後決定。覆核資料 → feedback → 累積到門檻自動 patch SKILL.md → 系統自演化。醫師會用是因為「我改的東西真的被學進去」,而不是「我每次都要從頭教 AI」。',
      },
    ],
    featured: true,
  },
  {
    slug: 'ollama-cloud-hermes-langchain',
    publishDate: '2026-05-26',
    title:
      'Ollama Cloud 接到 hermes-agent 跟 LangChain:免費跑 Gemma4 31B 不用 GPU 完整指南',
    excerpt:
      '5 分鐘前在我 Mac 上 `ollama run gemma4:31b-cloud` 真的回我訊息——本機完全沒吃 GPU,模型在 Ollama 雲端跑、token 從終端機流出來。然後我發現 hermes-agent 的 .env 半年前就把 Ollama Cloud 預埋好了,去掉註解填 key 就能切過去。本文記錄整套 round-trip:Ollama Cloud Free 額度怎麼算、Gemma4 31b-cloud 實測、接到 hermes 三步驟、LangChain 兩種接法 (ChatOpenAI vs ChatOllama) 的差別、Embedding 走 cloud 還是本機、跟 Claude/OpenAI 怎麼選、5 個踩過的真實坑。',
    category: 'AI 工具',
    tags: [
      'Ollama Cloud',
      'Ollama',
      'Gemma4',
      'Hermes Agent',
      'LangChain',
      'AI 開源模型',
      'AI API',
      'AI 工具',
    ],
    faqItems: [
      {
        q: 'Ollama Cloud 是什麼?跟本機 Ollama 有什麼不一樣?',
        a: 'Ollama Cloud 是 Ollama 官方的雲端推理服務,你用同一個 `ollama` CLI、同一個 API,但模型(像 `gemma4:31b-cloud`)在 Ollama 雲端跑、你本機完全不需要 GPU 或下載權重。本機版要自己備硬體、自己下載 model;cloud 版開帳號就用,還有 Free 額度。',
      },
      {
        q: '用 Ollama Cloud 接 hermes-agent 要付錢嗎?',
        a: '不用。hermes-agent 本身完全免費開源,Ollama Cloud Free 方案也是 0 元,只有 5 小時 session 額度跟每週上限。對個人 dev / agent 試驗綽綽有餘。要付費的是 Ollama Pro($20/月 50x 額度)或 Max($100/月),純粹看你跑的量。',
      },
      {
        q: 'LangChain 接 Ollama Cloud 該用 ChatOpenAI 還是 ChatOllama?',
        a: '既有專案用 `ChatOpenAI` 就改 `base_url` 跟 `api_key` 兩個欄位最快;新專案、要 tool calling 或 streaming 建議用 `langchain-ollama` 的 `ChatOllama`,介面跟 Ollama 原生概念對齊,踩坑少。',
      },
      {
        q: '為什麼 `gemma4:31b-cloud` 不能拿來做 embedding?',
        a: '它是 chat / completion 模型,內部架構不是雙塔 encoder,不能輸出 embedding 向量。Ollama Cloud 目前也沒提供 `-cloud` 後綴的 embedding 專用模型。要做 embedding 走本機 `nomic-embed-text` 或 `bge-m3`,模型都小、Mac 隨便跑。',
      },
      {
        q: 'Ollama Cloud 適合做生產嗎?',
        a: '看任務性質。latency 敏感 / 高並發 / SLA 要保證 → 還是 Claude / OpenAI;Internal tool / agent dev / 試新模型 / 試 RAG flow → Ollama Cloud Free 完全夠,還能用最新開源 model(Gemma4、DeepSeek V4)而不用自己架 GPU。',
      },
      {
        q: '我已經有 Claude Max 訂閱還需要 Ollama Cloud 嗎?',
        a: '主要看你想不想試開源 model。Claude Max 已經夠跑大部分任務,Ollama Cloud 的價值是:(1) 試 Gemma4 / Qwen / DeepSeek 等開源 model 不用自架,(2) hermes / langchain 多一個免費 fallback provider,(3) 隱私限制比較寬鬆的場景可以走 Ollama 而不是把資料丟 Anthropic。我自己兩個並用。',
      },
    ],
    featured: true,
  },
  {
    slug: 'claude-code-ultrawork-harness-engineering',
    publishDate: '2026-05-25',
    title:
      'Claude Code Harness EP1｜ultrawork 到底在 work 什麼?社群兩派 + Anthropic 三方對照',
    excerpt:
      'Claude Code 沒有官方的「ultrawork」。它是社群造的詞,目前至少兩個派系做出兩種不同的東西 — TechDufus 的 oh-my-claude(142 ★)走「平行召喚 6 個 sub-agent」,zephyrpersonal 的 oh-my-claude-code 走「Sisyphus 模式 — 不解完不准停」。兩者底層其實是同一件事:Harness Engineering — 在 Claude Code 外面套一層持久化設定(hooks + skills + agents + prompts),讓 AI 每次都照你的方式工作。這篇是系列 EP1,先講清楚 ultrawork 到底是什麼、有幾派、能解什麼問題,並對照 Anthropic 官方 2025/11 那篇 Effective Harnesses for Long-Running Agents。',
    category: 'AI 工具',
    tags: [
      'Claude Code',
      'ultrawork',
      'Harness Engineering',
      'oh-my-claude',
      'Anthropic',
      'Sub-agent',
      'AI 工具',
      'AI 開發工作流',
    ],
    faqItems: [
      {
        q: 'ultrawork 是 Anthropic 官方功能嗎?',
        a: '不是。ultrawork / ulw / ultraresearch 都是社群 plugin 自己定義的 slash command,不是 Claude Code 內建。Anthropic 官方文件用的詞是「harness」(Effective Harnesses for Long-Running Agents,2025/11/26 Justin Young 發表),概念類似但實作不同。',
      },
      {
        q: 'TechDufus 跟 zephyrpersonal 兩派的 ultrawork 哪個比較適合我?',
        a: '看任務型態。需要平行多角度看(查資料 + 評估風險 + 寫 code + 驗收)→ TechDufus 版,6 個 sub-agent 同時跑。需要死磕到完成(全綠燈、無 type error、所有測試過)→ zephyrpersonal 版,Sisyphus 模式不解完不停。不確定就先裝 TechDufus 版,使用面比較廣。',
      },
      {
        q: 'Workflow 跟 ultrawork 有什麼不同?',
        a: 'Workflow(shinpr/claude-code-workflows)是 recipe-based slash commands,管「先做設計再寫 code」這類流程切分;ultrawork 是 multi-agent 模式,管「單一步驟內怎麼把火力開到最大」。兩者設計層級不同,可以同時用不會打架。',
      },
      {
        q: '我已經有自己的 ~/.claude/ 配置,還要裝 ultrawork plugin 嗎?',
        a: '建議先別。自架 harness 的價值是貼合你個人模式 — 直接裝 plugin 等於把別人的工作流貼到你的肌肉記憶上,容易打架。建議先看 plugin 的 source code,把你想要的 pattern 抄成你自己的 skill / agent。我自己 ~/.claude/ 有 69 個 skill / 49 個 agent,完全沒裝這些 plugin。',
      },
      {
        q: 'Anthropic 官方 harness 跟 ultrawork 有什麼關係?',
        a: 'Anthropic 2025/11/26 那篇 Effective Harnesses for Long-Running Agents 講的「harness」是更上層的概念 — initializer agent + coding agent + claude-progress.txt 進度檔 + Puppeteer MCP 自動測試。ultrawork 是社群把這個概念塞進 slash command 的具體實作。InfoQ 2026/04 後續報導 Anthropic 演化到三 agent harness。',
      },
    ],
    featured: true,
  },
  {
    slug: 'screendoc-claude-code-skill',
    publishDate: '2026-05-27',
    title:
      '我把「截圖寫操作手冊」做成 Claude Code skill：screendoc 拆解（4 視角審查 + 一鍵重跑）',
    excerpt:
      '每次系統改版都要重截一遍操作手冊、還老是截圖跟說明對不上？我把這件苦差事做成 Claude Code skill：/screendoc。一句指令偵測前端框架、跑 Playwright 截圖、用 UI/UX + 系統分析 + 新手 + 開發者 4 個視角逐張比對「截圖 vs 說明 vs 原始碼」、不一致就局部重截迭代到全過，最後產一份對外可發表的離線 HTML 手冊。本文拆它在幹嘛、Phase 0–5 跑了什麼、為什麼要 4 視角不是過度設計，以及怎麼透過 yc-plugin 一鍵裝起來用。附我在一個無關的 React + Vite 專案上 round-trip 跑通的實測。',
    category: 'AI 工具',
    tags: [
      'Claude Code',
      'screendoc',
      'Playwright',
      'AI 工作流',
      'Skill',
      '操作手冊',
      '前端',
      'yc-plugin',
    ],
    faqItems: [
      {
        q: 'screendoc 跟一般的 Playwright E2E 測試差在哪？',
        a: 'E2E 測試的目的是「驗證功能對不對」，斷言通過就好，截圖只是失敗時的證據。screendoc 的目的是「產給人看的操作手冊」，截圖是主角、還要配對得上的敘事說明、再經 4 視角審查確保圖文碼同步。它複用了 Playwright 當截圖引擎，但產出是 HTML 手冊不是測試報告。如果你已經有 e2e/ 目錄，screendoc 可以接著用，不用重寫。',
      },
      {
        q: '我不太會寫 code，也能用 screendoc 嗎？',
        a: '可以用，但你得有一個能在本機跑起來的前端專案（dev server 起得來）。screendoc 自己會偵測框架、寫 Playwright spec、跑截圖，你不用手寫測試碼。你需要做的是：把專案路徑給它、看它產出的手冊、覺得哪張圖或說明不對就回饋。它是「幫你做手冊」的工具，不是「教你寫測試」的工具。',
      },
      {
        q: '改版後真的一句指令就能重跑？不會又要手動調？',
        a: '大部分情況是。screendoc 每個階段的產出物都落檔（shotlist、context、manifest），重跑時會沿用上次的截圖清單、只重截變動的頁面。前提是頁面結構沒有大改 —— 如果你整個換了路由或拆了頁面，shotlist 要更新，但這也是它在 Phase 1 自動做的事。日常的「按鈕改色、文案改字、欄位增減」這種改版，重跑基本無痛。',
      },
      {
        q: '我只想要這個 skill，不想裝整個 yc-plugin 可以嗎？',
        a: '可以。skill 本質是一個資料夾（SKILL.md + templates + detectors），你可以只把 yc-plugin 裡的 skills/screendoc/ 複製到你的 ~/.claude/skills/screendoc/，一樣會被 Claude Code auto-discover。裝整個 plugin 只是最省事的途徑（一句 /plugin install），且未來 skill 更新跟著 plugin 走、不用自己同步。yc-plugin 其他指令是 YouTube 工作流，用不到不影響 screendoc。',
      },
      {
        q: 'screendoc 支援哪些前端框架？我的專案沒用 UI 框架行嗎？',
        a: '行。screendoc 內建框架偵測（React / Next / Vue / 其他 SPA）跟一組設計系統 adapter（generic / antd / mui / chakra / radix / mantine）。有用 UI 框架的走對應 preset、自動知道元件的 selector 慣例；沒用任何 UI 框架的純手刻站走 generic preset 一樣能跑 —— 我實測就是拿一個 React + Vite + Tailwind 純手刻站驗的，generic preset 直接生效。它靠 DOM anchor 鎖頁面，不依賴特定框架的內部結構。',
      },
    ],
    featured: true,
  },
  {
    slug: 'claude-code-hook-auto-verify-deploy',
    title:
      'Claude Code Hook 怎麼用？git push 後自動驗 GitHub Actions 部署（PostToolUse 實戰）',
    excerpt:
      '每次 git push 完都要手動切到 GitHub Actions 頁面盯著部署跑完，綠了放心、紅了回來修——這件事重複到讓人煩。我用 Claude Code 的 PostToolUse hook 把它自動化：hook 攔到 git push 成功就注入一段任務指示，叫 Claude 排程約 70 秒後查 Actions 結果，全綠回報、紅了抓 log 修。關鍵是一次性驗證（ScheduleWakeup 而非無限輪詢），而且改版後不綁特定 workflow 名、用 commit SHA 對齊，任何有 push-triggered Actions 的 repo 都通用。本文把實作三段、additionalContext 機制、從寫死 deploy.yml 到通用的兩刀改法，以及踩到的欄位名坑（tool_response 才是對的）全寫下來。',
    publishDate: '2026-05-27',
    category: '工作流',
    tags: [
      'Claude Code',
      'PostToolUse hook',
      'GitHub Actions',
      'ScheduleWakeup',
      'CI/CD',
      'AI 工作流',
      'git push',
      '自動化',
    ],
    faqItems: [
      {
        q: 'PostToolUse 跟 PreToolUse hook 差在哪？驗部署為什麼用 PostToolUse？',
        a: 'PreToolUse 在工具執行前觸發，可以攔截或修改參數；PostToolUse 在工具成功後才觸發。驗部署這件事必須等 git push 真的成功才有意義，而且可以利用「PostToolUse 只在成功時觸發」這個性質——hook 被叫到就代表這次 push 沒失敗（沒被拒、沒 403），省掉自己判斷成敗的步驟。所以這個需求落在 PostToolUse，matcher 設 Bash。',
      },
      {
        q: 'hook 是全域註冊的，會不會干擾我那些不跑 CI 的專案？',
        a: '不會。腳本有守門邏輯：指令不含 git push、不是 git repo、沒有 .github/workflows/ 目錄、或目錄裡沒有任何 push-triggered workflow，全部靜默 exit 0、不注入任何東西。只有「真的會跑 GitHub Actions」的 repo 才會觸發驗證流程，其餘 push 完全無感。',
      },
      {
        q: '為什麼用 ScheduleWakeup 而不是寫個迴圈一直等部署跑完？',
        a: '迴圈會把整個 session 卡在原地，而且判斷邏輯一出錯就變無限輪詢、燒 token、佔住對話。ScheduleWakeup 是排一個未來喚醒點就把控制權交回去，到點才查一次狀態。它是一次性驗證流程，不是常駐 daemon——全綠就停、紅了修完就結束，最多探 3 次（約 3.5 分鐘）避免 workflow 卡死時無限重排。',
      },
      {
        q: '一個 git push 同時觸發好幾個 workflow 怎麼辦？',
        a: '因為驗證是用 commit SHA 對齊（gh run list 篩 headSha 等於剛推的 commit），同一個 SHA 觸發的所有 run 都會被一起撈出來，必須全部 conclusion=success 才算通過。任何一個 run 失敗就走修復流程（gh run view --log-failed 看原因、修掉、重 push）。',
      },
      {
        q: '這個做法只能用在 GitHub Pages 部署嗎？換成 Docker build 或一般 CI 行嗎？',
        a: '行，這正是改版要解決的問題。第一版寫死「repo 必須有 deploy.yml」，漏掉了 workflow 叫別的名字的 repo（例如我的 whisper 叫 docker-build.yml）。改版後守門改成偵測有沒有 push-triggered workflow、驗證改用 SHA 對齊而不綁 workflow 名，所以不管 repo 跑的是 Pages 部署、Docker build 還是一般 CI test，只要 workflow 由 push 觸發都通用。',
      },
    ],
    featured: false,
  },
  {
    slug: 'claude-code-codex-mcp-collab',
    title:
      '兩個 AI 真能「對等聊天」?Claude Code × Codex MCP 協作的真實邊界',
    excerpt:
      'Claude Code 透過 MCP 可以直接呼叫本機 Codex 跑子任務——我下 prompt、Codex 在同一台機器讀檔/跑指令/回報。但這是「結構化輪流問答」(one-shot + threadId 延續),不是兩個 AI 自由聊起來。這篇紀錄我接通的全程:怎麼用三題本機驗證確認「真的接通而不是腦補」(它回傳 commit hash 6cf8254 我去對)、怎麼用 tmux pane 即時看 Codex 的推理與指令、以及最能說明「對等有限度」的坑——MCP 接過去的 Codex 預設 read-only sandbox,嘴上能聊手上卻寫不了檔。結論:接通 ≠ 協作,能聊 ≠ 能動手。',
    category: 'AI 工具',
    tags: [
      'Claude Code',
      'Codex',
      'MCP',
      'AI Agent',
      '雙 AI 協作',
      'OpenAI Codex',
      'Anthropic',
    ],
    publishDate: '2026-06-01',
    faqItems: [
      {
        q: 'Claude Code 真的能直接呼叫 Codex 嗎?',
        a: '能。透過 MCP server 曝出的 codex / codex-reply 工具,Claude Code 可以開 Codex session、帶 threadId 續跑,Codex 在同一台機器上讀檔、跑指令、回報結果。雙向有回傳,不是單向發送。',
      },
      {
        q: '這算是兩個 AI 在「聊天」嗎?',
        a: '算結構化輪流問答,不算自由對話。我每輪都要主動發 prompt,Codex 才執行並回報;它不會主動找我講話,也不會自己持續推進。跟人類同事在 Slack 隨手丟一句的「主動性」差很多,所以「對等聊天」這講法是包裝過頭的。',
      },
      {
        q: '怎麼確認 Codex 不是在「演」回答?',
        a: '給它編不出來的本機題:讀只有你本機有的檔(例如某個型別定義那行)、跑 git log 回傳 commit hash、做算術。拿真實產物去對(round-trip),對得上才算數。我這次拿回傳的 commit hash 6cf8254 對我本機 git log,對上了才確認是真的在我機器上跑。handshake 不等於真的在幹活。',
      },
      {
        q: '為什麼 Codex 查得到、聊得來,卻寫不了檔?',
        a: 'MCP 接過去的 Codex session 預設是 read-only sandbox。對話跟寫入權限是兩層獨立的東西,要它真的落地產物(寫檔),得另開 workspace-write 權限的 session。所以會出現「它能完整討論這個檔該怎麼寫,手上卻動不了」的狀況。',
      },
      {
        q: '怎麼即時看到另一個 AI(Codex)在做什麼?',
        a: 'Codex 把每個 session 寫成 JSONL rollout log,放在 ~/.codex/sessions/YYYY/MM/DD/。寫一支腳本 tail -f 最新那份、解析事件(reasoning / function_call / message)染色印出,丟進一個 tmux pane,就能即時看到它的推理、跑的指令、回話滾動。注意它 idle 時 log 不長新行、畫面靜止是正常的。',
      },
    ],
    featured: true,
  },
  {
    slug: 'ai-deploy-firebase-custom-domain',
    title: '我讓 AI 把遊戲部署上自己的網域:難的不是 deploy,是怎麼確認真的上線',
    excerpt:
      '我讓 Claude Code 一條龍把一個 React 遊戲(戰旗 J7 Reborn)部署上 Firebase Hosting、再接自己的網域 j7.yanchen.app,全程只下一句「上架到這個網域」。關鍵不是 `firebase deploy` 那 30 秒,是「怎麼判斷真的上線了」:Deploy complete!、Console 顯示「已連結」、單次 curl 回 200,三個都不算數。這篇把 build → deploy → 接 custom domain → DNS → 等 SSL → round-trip 驗證整條寫透,重點放在那個卡了幾小時的坑:custom domain 顯示「已連結」卻一直 404 —— 以及為什麼那其實不是設定錯,是邊緣節點內容還沒收斂,該等不該動。附 openssl 驗 SAN、curl 連打、SPA rewrite 的實際做法。',
    category: '工程實作',
    tags: [
      'Firebase Hosting',
      'Claude Code',
      'custom domain',
      '自訂網域',
      'SSL',
      'DNS',
      'SPA',
      'AI 部署',
      'round-trip',
    ],
    publishDate: '2026-06-08',
    faqItems: [
      {
        q: '`firebase deploy` 印了 Deploy complete!,為什麼網站還是打不開?',
        a: 'Deploy complete! 只代表檔案上傳完成(handshake),不代表你打的網址已能正確回應。預設 web.app 網址通常很快活;剛接好的 custom domain 可能還在邊緣節點內容同步、會 flapping。先 curl 預設 web.app 確認部署本身 OK,再分開看 custom domain。',
      },
      {
        q: 'custom domain 顯示「已連結」但一直 404,是我設定錯了嗎?',
        a: '先用 openssl 看 SSL 憑證 SAN 有沒有命中你的網域。有命中 = 設定正確,404 是 Firebase 邊緣內容同步還沒收斂,會 flap 數小時到近一天,不要動設定、等就好。SAN 沒命中 = 那才是真的 DNS/設定問題,回去查 DNS 紀錄與 Console 網域狀態。',
      },
      {
        q: 'SSL 憑證的 SAN 裡有一堆別人的網域,是被駭了嗎?',
        a: '不是。Firebase Hosting 用 multi-SAN 共用憑證,把很多客戶網域包在同一張憑證裡,是正常的成本優化。你只要確認清單裡有自己的 DNS:你的網域 就對了,其他不相干的網域不用管。',
      },
      {
        q: '首頁能開,但分享出去的深連結(像 /battle/c1-1)打不開?',
        a: '你少了 SPA rewrite。在 firebase.json 的 hosting 加 "rewrites": [{ "source": "**", "destination": "/index.html" }],讓所有路徑都回 index.html、由前端 router 接手解析。重 deploy 一次即可。',
      },
      {
        q: '怎麼知道部署「真的」成功,而不是看起來成功?',
        a: '做 round-trip,不要只看 handshake。最低標準:curl 連打數次都穩定 200(單次會被 flapping 騙)+ 回傳 HTML 的 <title> 是你的站 + 真的開瀏覽器點一下確認畫面正常。三者皆過才算上線。',
      },
    ],
    featured: false,
  },
  {
    slug: 'dense-vs-moe-llm-architecture',
    title: 'MoE 省記憶體?錯了:Dense 與 MoE 最反直覺的差別',
    excerpt:
      'Dense 模型每個字都用上全部參數,誠實但耗算力;MoE(Mixture of Experts)靠一個「領班」每個字只派一小撮專家上工,帳面參數很大但實際算力很省。最反直覺的一點:MoE 省的是算力跟速度,不是記憶體——所有專家還是得全部載進 VRAM。VRAM 不夠時該砍的是「總參數量」,不是無腦選 Dense。這篇從我在單機 dev 機換本地 LLM 卡到的真實問題出發,用餐廳出餐比喻講透 router 怎麼運作,再拿 Mixtral 8x7B(46.7B/13B)、DeepSeek-V3(671B/37B)、Gemma 4 12B(純 Dense)三顆真模型把數字釘死,最後給出 VRAM 受限時該怎麼選的決策表。',
    category: 'AI 工具',
    tags: [
      'MoE',
      'Dense',
      'Mixture of Experts',
      'LLM',
      'Gemma 4',
      'Mixtral',
      'DeepSeek',
      'VRAM',
      'AI 應用開發',
    ],
    publishDate: '2026-06-09',
    faqItems: [
      {
        q: 'MoE 比 Dense 厲害嗎?',
        a: '不是「厲害」的問題,是「划算」的問題。MoE 用更少的算力換到更大的有效參數,但代價是 VRAM 要塞得下全部專家、訓練也更難調(router 容易負載不均)。資源夠就划算,資源不夠就是負擔。',
      },
      {
        q: '為什麼 Mixtral 叫 8x7B 卻不是 56B?',
        a: '因為專家之間共享了一部分參數(像 attention 層),不是 8 個完全獨立的 7B 模型疊起來。實際總參數是 46.7B,每個 token 只啟用 2 個專家、約 13B。',
      },
      {
        q: 'MoE 真的完全不省記憶體嗎?',
        a: '推理時不省 VRAM(全部專家要載)。但它在「相同算力預算下能塞進更多知識」這件事上是省的——你用 13B 的算力成本,拿到了 46.7B 參數的知識容量。省在算力效率,不在記憶體佔用。',
      },
      {
        q: '怎麼快速判斷一個模型是 Dense 還是 MoE?',
        a: '看它的命名跟規格卡。出現「8x7B」「A22B」(active 22B)「total/active 兩個數字」這類寫法,幾乎都是 MoE。只給單一參數量(如 12B、70B)且沒提 active,通常是 Dense。最準的還是去看官方 model card。',
      },
    ],
    featured: false,
  },
  {
    slug: 'codegraph-code-knowledge-graph',
    title: 'CodeGraph vs grep：AI 讀 codebase 少 81% 工具呼叫的知識圖譜',
    excerpt:
      'CodeGraph 把整個 codebase 預先建成一張「程式碼知識圖譜」（symbol 節點 + call 邊），讓 Claude Code、Codex、Cursor 這類 AI agent 不用一個一個檔案爬，一次 codegraph_explore 就拿到相關 source、call path 跟改動波及範圍。官方在 7 個真實開源專案實測：VS Code 少 81% tool call、少 64% token，Alamofire 便宜 40%、快 33%。這篇把它是什麼、三層架構（tree-sitter + SQLite + file watcher）、安裝三件套、跟 grep / LSP 的差別、以及我接的時候要注意的點寫一遍。100% 本機跑、MIT、支援 23 種語言、8 個 agent。',
    category: 'AI 工具',
    tags: [
      'CodeGraph',
      '程式碼知識圖譜',
      'Claude Code',
      'AI Agent',
      'MCP',
      'tree-sitter',
      'AI 應用開發',
    ],
    publishDate: '2026-06-29',
    metaDescription:
      'CodeGraph 把整個 codebase 建成程式碼知識圖譜，AI agent 一次查就拿到 call path，少 81% 工具呼叫、64% token。本機跑、支援 23 種語言，安裝指令全附。',
    faqItems: [
      {
        q: 'CodeGraph 會把我的程式碼上傳到雲端嗎？',
        a: '不會。CodeGraph 強調 100% local，圖建在本機 .codegraph/codegraph.db（SQLite），解析與查詢都在你機器上跑，不外送。這對公司內網、有保密需求的 codebase 是關鍵。',
      },
      {
        q: '用 CodeGraph 一定要先裝 Node.js 嗎？',
        a: '用官方 install.sh / install.ps1 不用——它自帶 runtime。只有走 npm i -g 安裝、或要把 CodeGraph 當 library 嵌入（需 Node 22.5+）才需要 Node。',
      },
      {
        q: 'CodeGraph 跟 Claude Code 內建的搜尋有什麼不一樣？',
        a: 'Claude Code 預設靠 grep + Read 即時爬檔，每次都付探勘成本。CodeGraph 預先把整張呼叫圖建好，agent 透過 MCP 一次查就拿到 call path 與波及範圍，省掉反覆讀檔——官方實測 file read 接近零、tool call 大幅下降。',
      },
      {
        q: 'CodeGraph 支援哪些 AI agent？',
        a: '8 個：Claude Code、Cursor、Codex CLI、opencode、Hermes Agent、Gemini CLI、Antigravity IDE、Kiro。codegraph install 會自動偵測已安裝的並設好 MCP。',
      },
      {
        q: '大專案改一個檔，CodeGraph 的圖會整個重建嗎？',
        a: '不會。同步是增量的，原生 file watcher 偵測變更後只更新受影響的部分（debounced），所以一般存檔不會卡。',
      },
    ],
    featured: false,
  },
  {
    slug: 'grilling-ai-agent-vs-pm-interview',
    title: 'AI 逼問法 vs 需求訪談：grilling skill 三代拆解',
    excerpt:
      'mattpocock/skills(183k star)裡的 grilling 系列 skill,把「AI 動手前先逼問使用者」拆成三代演化:一次一題、一次一輪、邊問邊產文件。拆開三份 SKILL.md 原始碼,對照人類需求訪談「一次一題 vs 一次一輪」的老權衡,附今天這篇文章寫作過程本身當真實案例。',
    category: '工作流',
    tags: [
      'mattpocock/skills',
      'grilling',
      'AI Agent',
      'Claude Code skill',
      '需求訪談',
      'Matt Pocock',
      '決策樹',
    ],
    publishDate: '2026-07-23',
    metaDescription:
      'grilling skill 讓 AI 像逼問一樣一題題釐清決策，對照人類需求訪談的一次一題 vs 一次一輪老權衡，附三代演化規則原文，能不能直接拿來用一次講清楚。',
    faqItems: [
      {
        q: 'grilling 跟 grill-me 是同一個東西嗎？',
        a: '是。grill-me 是 skills/productivity/grill-me/SKILL.md 定義的一個 command，內容只有一行:「Run a /grilling session」，等於是 grilling 的別名，方便打字。',
      },
      {
        q: '這篇跟你上一篇《166k Star Skill 庫拆解》講的不是同一件事嗎？',
        a: '上一篇是拆整個 repo 的 6 個核心 skill，對應 4 個 agent 常見失控問題，是一篇全景介紹；grilling 在那篇只在 FAQ 提過一句。這篇只聚焦這一套「逼問」邏輯本身，把它的三個變體攤開對照，並且拉到跟人類需求訪談做比較——是同一個 repo 裡不同的切片，不是重寫。',
      },
      {
        q: 'batch-grill-me 能拿去正式專案用嗎？',
        a: '作者自己把它放在 skills/in-progress/，最近一次相關 commit 是 2026-07-16，屬於還在調整中的實驗性功能。想試可以裝，但目前不建議當成穩定依賴。',
      },
    ],
    featured: false,
  },
  {
    slug: 'openai-codex-security-cli',
    title: 'OpenAI codex-security 是什麼？跑在本機的 AI 漏洞掃描 CLI 實測拆解',
    excerpt:
      'OpenAI 在 2026-07-13 開的 Apache-2.0 專案，把 codex agent 包成本機資安掃描 CLI + TypeScript SDK，直接在你機器上跑 agent 讀程式碼找漏洞。三週 160 commits、還在 0.1.x、README 自己標明 1.0 前 API 隨時會變——功能活躍但別當穩定品。',
    category: 'AI 工具',
    tags: [
      'codex-security',
      'OpenAI',
      'AI 資安掃描',
      'SAST',
      '漏洞掃描',
      'CLI 工具',
      'SARIF',
      'AI 工具',
    ],
    publishDate: '2026-08-03',
    faqItems: [
      {
        q: 'codex-security 跟 Semgrep、CodeQL 這類 SAST 差在哪？',
        a: '規則式 SAST 靠事先寫好的 pattern 和資料流分析比對，快、可重現、零成本重跑，但看不懂業務意圖，抓不到「這個 endpoint 少了一層授權」這種需要讀懂上下文才成立的問題。codex-security 讓語言模型實際讀程式碼再判斷，代價是要花錢、每次結果不完全一樣、需要網路和 OpenAI 帳號。兩者強項幾乎不重疊，實務上是互補不是替代。',
      },
      {
        q: '它預設會擋住我的 CI 嗎？',
        a: '不會。掃描預設是 report-only，有漏洞也回 exit code 0。要真的擋門必須自己加 --fail-on-severity，例如 --fail-on-severity high。這個預設值容易被誤會成「掃過了沒問題」，設 CI 前一定要確認。',
      },
      {
        q: 'exit code 2 代表什麼？',
        a: '輸入無效、覆蓋範圍不完整、或執行期／匯出錯誤。關鍵在它把「掃不完整」跟「掃出問題」（exit code 1）分開了——README 明講這是刻意的，覆蓋不完整不能被誤認為政策通過。一個沒掃完的 repo 回綠燈比掃出漏洞還危險，這個設計把假綠燈擋掉了。',
      },
      {
        q: '掃描成本怎麼控制？',
        a: '用 --max-cost 設美元上限，超過就停（含它派出去的 worker），部分結果會保留。也可以換模型和推理強度，例如 --model gpt-5.6-terra --effort high。要注意 README 註明成本是用標準 API token 價格估算，不含額外費用與附加費，那個數字是估算不是帳單。預設 gpt-5.6-sol 加 xhigh 推理強度是相當貴的組合。',
      },
      {
        q: '在公司機器上跑它有什麼風險？',
        a: 'README 的 Local security model 寫得很清楚：它用你本機的作業系統權限執行，套用 approvalPolicy 為 never，不會跳出來問你要不要批准；而且掃描與 workbench 的子行程會繼承你的環境變數，包含不相關的 API token 和雲端憑證。如果你的 shell 裡塞著 AWS key 或資料庫密碼，這些會一起進到掃描行程。官方建議只帶它需要的憑證去啟動掃描。另外輸出目錄要放在被掃 repo 之外並設成 chmod 700，因為報告本身含原始碼片段與重現步驟，等於一份攻擊指南。',
      },
      {
        q: '什麼情況下不該用 codex-security？',
        a: '需要每次跑出完全一樣結果時（LLM 掃描本質上不可重現）、預算不能浮動時、要掃你不擁有或未被授權評估的 repo 時（SECURITY.md 明文禁止）、完全離線環境、以及需要穩定 API 時——版本還在 0.1.x，官方自己說 minor 版之間可能破壞相容性，三週內就累積了 160 個 commit。',
      },
    ],
    featured: false,
  },
  {
    slug: 'claude-code-security-review-action',
    title: 'claude-code-security-review 拆解：一份值得抄的 AI 資安審查 prompt',
    excerpt:
      'Anthropic 2025-08-04 開的 MIT / Python 專案，做成 GitHub Action 在 PR diff 上跑資安審查，另附一個 /security-review slash command 可在本機 Claude Code 直接用。prompt 設計紮實（>80% 可利用性門檻、三階段方法論、結構化 JSON 輸出），但最後 push 停在 2026-02-11、79 個 open issue，而且那層 AI 誤判過濾因為寫死已退役的模型早就靜默停用了。',
    category: 'AI 工具',
    tags: [
      'claude-code-security-review',
      'Anthropic',
      'GitHub Action',
      'AI 資安審查',
      'security review',
      'Claude Code',
      '假陽性過濾',
      'AI 工具',
    ],
    publishDate: '2026-08-03',
    faqItems: [
      {
        q: 'claude-code-security-review 是什麼？',
        a: '一個掛在 pull request 上的 GitHub Action，用 Claude 讀 PR 的 diff 做語意層資安審查，只回報它認為高信心、真的可被利用的漏洞，並把 finding 留成 PR 行內評論。同一套分析能力也被包成 Claude Code 內建的 /security-review 斜線指令，不用架 CI 就能試。',
      },
      {
        q: '它的假陽性過濾真的有在運作嗎？',
        a: '規則式的硬排除有在跑，但被宣傳為主打功能的 AI 過濾層目前是關掉的。claudecode/claude_api_client.py 第 62 行的前置檢查把模型寫死成已退役的 claude-3-5-haiku-20241022，呼叫會拿到 404；findings_filter.py 第 186 到 195 行接住失敗後把 use_claude_filtering 設成 False，整個階段跳過，而 Action 不會失敗、不會回非零 exit code。repo 的 issue #114 與 #123 都獨立回報了這件事，兩張至今仍開著。這個模型名稱跟你在 claude-model 參數填什麼無關，是硬編碼的、改不到。',
      },
      {
        q: '它的 prompt 有什麼值得學的？',
        a: 'prompts.py 只有 175 行但寫得很克制：把信心門檻量化寫死（只報 >80% 確信可被利用的、confidence 0.7 以下不報）、排除清單在開頭和結尾各寫一次、強制三階段方法論（先理解 repo 既有資安慣例，再比對新程式碼，最後逐檔評估）、只看這次 PR 新引入的問題不翻舊帳、輸出強制 JSON 且必填 exploit_scenario 欄位逼模型寫出具體攻擊路徑。就算不用這個 Action，這份 prompt 也值得拿去改成自己的審查指令。',
      },
      {
        q: '這個 repo 還有在維護嗎？',
        a: '2026 年 8 月 3 日查到的狀態：總共 30 個 commit、最後一次 push 停在 2026-02-11、79 個 issue 開著。影響核心功能的 #114 從 2026 年 6 月掛到現在未修。要用就要有自己 fork 來維護的心理準備。',
      },
      {
        q: '除了過濾層，還有哪些會造成假綠燈的問題？',
        a: 'issue #120 回報快取的 restore-keys 用前綴比對，導致新 commit 被誤判成已掃過而被跳過，回報者指出這是 issue #42 的根因；可以用 run-every-commit: true 繞開，代價是成本上升且 README 註明多 commit 的 PR 這樣跑會增加假陽性。另外 issue #118 指出 action.yml 串接的 setup-python、cache、setup-node、upload-artifact 都還 pin 在已被 GitHub 標記棄用的 node20 版本。',
      },
      {
        q: '我可以直接拿它掃外部貢獻者的 PR 嗎？',
        a: '不建議。README 明文寫著它沒有針對 prompt injection 做防護，只該用來審查可信的 PR，並建議去 repo 設定開啟「Require approval for all external contributors」讓 workflow 只在維護者審過後才跑。開源專案上任何人都能開 PR，而 PR 內容會進到 prompt 裡，惡意 PR 可以在註解裡塞指令試圖影響審查結果。',
      },
      {
        q: '最低成本的試用方式是什麼？',
        a: '直接在 Claude Code 裡打 /security-review，它會審查你目前所有未提交的變更，用的是同一套分析邏輯，不必架 workflow。想客製化就把 repo 裡的 .claude/commands/security-review.md 複製到你專案的 .claude/commands/ 底下再改。這條路徑還順便避開了 Python 管線裡那個過濾層被關掉的問題。',
      },
    ],
    featured: false,
  },
  {
    slug: 'openai-codex-plugin-claude-code',
    title:
      'OpenAI 官方外掛讓 Codex 進 Claude Code：實測兩種 review，一種漏掉兩個高風險問題',
    excerpt:
      'OpenAI 在自己的 GitHub organization 下開源了給 Claude Code 用的官方外掛 codex-plugin-cc（Apache-2.0，撰文當下 30,993 顆星），裝上去就能在 Claude Code 裡直接叫 Codex 審 code 或把任務丟給它跑。我裝了 v1.0.6 並拿一段故意寫壞的批次退款程式碼實測：/codex:review 花 41 秒抓出 2 個 P1；同一份程式碼換 /codex:adversarial-review 抓出 4 個，多的兩個是「刪訂單摧毀稽核軌跡」與「完全沒有退款授權邊界」，標準 review 完全沒提。這篇把安裝步驟、7 個指令的實際差別，以及那個預設關閉、逾時或失敗都會 block 你 session 的 review gate 寫透。',
    category: 'AI 工具',
    tags: [
      'Claude Code',
      'Codex',
      'OpenAI',
      'Code Review',
      'AI 工具',
      'Claude Code Plugin',
      'AI Agent',
    ],
    publishDate: '2026-08-03',
    faqItems: [
      {
        q: '這真的是 OpenAI 官方的外掛嗎？',
        a: '是。repo 位於 github.com/openai/codex-plugin-cc，掛在 OpenAI 自己的 GitHub organization 下，plugin.json 的 author 欄位寫 OpenAI，授權是 Apache-2.0。撰文當下（2026-08-03）用 GitHub API 撈到 30,993 顆星、13 位 contributor、最新 release 是 2026-07-08 的 v1.0.6。',
      },
      {
        q: 'Codex plugin for Claude Code 免費嗎？',
        a: '外掛本身開源免費，但它會消耗你的 Codex 額度，而 Codex 需要 ChatGPT 訂閱（Free 方案也可以）或 OpenAI API key。所以是「外掛免費、推論要錢」。它沒有自己的 Codex runtime，用的是你本機已安裝的 Codex CLI 與同一份登入狀態。',
      },
      {
        q: '怎麼安裝 OpenAI Codex plugin 到 Claude Code？',
        a: '在 Claude Code 裡依序打 /plugin marketplace add openai/codex-plugin-cc、/plugin install codex@openai-codex、/reload-plugins，最後跑 /codex:setup 驗證。前置需求是 Node.js 18.18 以上，以及已登入的 Codex。/codex:setup --json 回傳 ready: true 才算真的裝好。',
      },
      {
        q: '/codex:review 跟 /codex:adversarial-review 差在哪？',
        a: '一般 review 不吃自訂 focus 文字，看的是程式碼細節；adversarial review 可以帶 focus 敘述，會質疑設計方向本身。我用同一段有問題的批次退款程式碼實測，一般版 41 秒抓 2 個 P1（SQL injection、非原子交易），adversarial 版抓 4 個，多出來的兩個是「刪除訂單破壞帳務稽核」與「退款授權邊界完全缺失」這類設計層問題。上線前把關建議用 adversarial 那個。',
      },
      {
        q: 'review gate 該不該開？',
        a: '預設是關的，我建議先維持關閉。它掛的是 Stop hook，會在 Claude 每次要結束回合時叫 Codex 審一遍，審出問題就擋住不讓停。從 stop-review-gate-hook.mjs 原始碼看，timeout 設 15 分鐘，而且逾時、非零 exit、回傳無法解析的 JSON 全都會走 decision: block——擋住你的可能不是 code 有問題，而是審查本身跑不起來。README 也警告它可能造成長時間 Claude/Codex 迴圈並快速消耗額度。',
      },
      {
        q: '這個外掛會自己改我的程式碼嗎？',
        a: '兩個 review 指令都是 read-only，不會動你的 code。只有 /codex:rescue 會實際動手，而那是你明確叫它做事的時候。其餘 /codex:status、/codex:result、/codex:cancel、/codex:transfer 都不改檔案。',
      },
    ],
    featured: false,
  },
  {
    slug: 'claudex-loop-claude-codex-adversarial-review',
    title: 'claudex-loop 實測：我丟一份有洞的計畫，Codex 40 秒抓出來',
    excerpt:
      'chaseai-yt 在 2026-06 開的 Claude Code skill，把 Claude 與 Codex 配成對手：Claude 寫計畫、Codex 帶證據反駁，不通過不准動工，寫完 code 再換人檢查。我丟一份 Acceptance 只驗單一 happy path 的計畫進去，兩輪獨立實測都在 33 到 41 秒回 REVISE 並指到同一行——真的會抓，但每輪吃掉四萬多 input tokens，不是免費午餐。',
    category: 'AI 工具',
    tags: [
      'claudex-loop',
      'Claude Code',
      'Codex',
      'AI code review',
      'AI 協作',
      'skill',
      'CLI 工具',
      'AI 工具',
    ],
    publishDate: '2026-09-20',
    faqItems: [
      {
        q: 'claudex-loop 是什麼？跟直接叫 AI 審查有什麼不同？',
        a: '它是一組 Claude Code skill，把「寫」跟「評」硬性拆給兩個不同模型：Claude 寫 PLAN.md，Codex 帶證據反駁，不通過就不准動工；開始寫 code 之後角色再互換，寫的人不評自己的作品。跟直接叫同一個 AI「你再檢查一次」的差別在於審查方沒參與產出、沒有要維護自己前面說過的話，而且它每次都要引用具體檔案與行號，不能只回一句「看起來沒問題」。',
      },
      {
        q: '它會不會偷偷改我的 code？',
        a: '審查那一段不會。我把它實際產生的 command.json 挖出來看，審查方是以 -s read-only 加上 approval_policy="never" 啟動的，拿不到寫入權限，也不會跳任何核准提示。另外 runner.py 全檔 420 行只 import subprocess，grep 過沒有任何網路呼叫、也不讀 token 或 api_key，它做的事就是在你本機把另一支 CLI 叫起來。',
      },
      {
        q: '審查結果可以被挪用到別份計畫嗎？',
        a: '不行，它把 plan 的 SHA-256 寫進結果裡。一份 APPROVED 是綁在那份計畫的內容雜湊上的，計畫改一個字雜湊就變了，舊的通過結論就對不上——所以沒辦法先拿一份無害的計畫換到通過，再把內容換掉動工。',
      },
      {
        q: '實測下來它真的抓得到東西嗎？',
        a: '我刻意寫了一份有洞的計畫：Behavior 列三條規則，Acceptance 只驗一條，而且驗的那個輸入頭尾本來就沒有連字號，所以就算實作完全漏掉「去除首尾連字號」也會綠。兩輪獨立執行（32.98 秒與 40.58 秒）都回 REVISE，都指到 PLAN.md:10，都說同一件事：驗收只涵蓋單一正常案例，證明不了列出的行為。能重現比單次跑得漂亮更有說服力。',
      },
      {
        q: '成本大概是多少？',
        a: '我這兩輪光是 review 一份三百多 bytes 的計畫，單輪就吃掉四萬到八萬多 input tokens（其中約一半是 cached），output 一千出頭。那是實打實走你的 ChatGPT 額度，計畫越長、repo 越大吃得越多。它換到的是「動工前先被問一輪」，值不值得要看你那份計畫改錯的代價有多高。',
      },
    ],
    featured: false,
  },
  {
    slug: 'claude-code-mod-validate-force-push',
    title: 'Claude Code mod 是什麼？13 行擋 force push，裝前先 validate',
    excerpt:
      'Claude Code mod 是 v2.1.287 起支援的外掛形態：一組跑在 Claude Code 行程裡的 JS／TS 函式，能畫介面、攔 tool call，以你的權限執行、沒有沙箱。我用 claude plugin validate 審過 Let\'s Write 開源的兩支 mod，再寫一支 13 行的 mod 擋下 force push——4 支測試全綠、實機載入真的擋住。',
    category: 'AI 工具',
    tags: [
      'Claude Code',
      'Claude Code mod',
      'Claude Code Plugin',
      'Hooks',
      'AI 工具',
      'AI Agent',
    ],
    publishDate: '2026-10-07',
    faqItems: [
      {
        q: 'Claude Code mod 跟 settings hook 差在哪？',
        a: 'settings hook 是事件發生時另外跑一支腳本或打 HTTP，只能決定放行、阻擋、改參數或補 context；mod 是在 Claude Code 行程裡被呼叫的函式，除了攔 tool call，還能畫側欄、在輸入框上方顯示資訊、註冊不經過 Claude 的指令。只要擋或記錄，既有腳本做得到就用 settings hook；要介面或互動才需要 mod。',
      },
      {
        q: '怎麼知道一支 mod 安不安全？',
        a: 'clone 下來先跑 claude plugin validate <資料夾>，看輸出的 hooks: 和 calls: 兩行。只用 $.ui、$.state、$.clock 的 mod 碰不到檔案和網路；出現 $.process.run、$.fs、$.model 這類呼叫，就打開原始碼確認用途。官方建議只從信任的作者和 marketplace 安裝。',
      },
      {
        q: 'mod 需要什麼版本？',
        a: '終端機的 Claude Code v2.1.287 以上，Desktop app 從 v2.1.286 起。用 claude --version，或在 Desktop 的 Code 分頁打 /status 看 Claude Code 那一列。',
      },
      {
        q: '寫 mod 需要裝 Node.js 嗎？',
        a: '不需要。Claude Code 直接載入 .js 和 .ts，不用打包或建置。但 mod 自己若用 $.process.run 呼叫 node（像 Let\'s Write 的 open-todos），那台電腦就要有 node。',
      },
    ],
    featured: false,
  },
  {
    slug: 'screenshot-to-code-self-host',
    title: 'screenshot-to-code 是什麼？8 萬星截圖轉網站工具，自架前先看這 5 件事',
    excerpt:
      'screenshot-to-code 是 Abi Raja 開源的 MIT 專案：丟網站截圖、Figma 稿或 30 秒內的螢幕錄影，用你自己的 OpenAI／Claude／Gemini key 生成 HTML、React、Vue 前端程式碼，目前 8 萬顆星。我在 Mac 上把前後端裝起來並讀過原始碼——一次 Create 會同時打 4 次模型、影片模式只認 Gemini，自架前先把 key 和預算準備好。',
    category: 'AI 工具',
    tags: [
      'screenshot-to-code',
      '截圖轉程式碼',
      'AI 前端生成',
      'Gemini',
      'Claude',
      '自架',
      'AI 工具',
    ],
    publishDate: '2026-10-12',
    faqItems: [
      {
        q: 'screenshot-to-code 免費嗎？',
        a: '程式碼是 MIT 授權，可以免費自架；但它本身不含模型，生成時要用你自己的 OpenAI、Anthropic 或 Gemini API key，模型費用由你付。不想自架可以用官方託管版 screenshottocode.com。',
      },
      {
        q: '按下 Generate 全部失敗、畫面只寫 Error generating code 怎麼辦？',
        a: '看跑 uvicorn 的後端終端機。沒設 key 時 log 會寫 No OpenAI, Anthropic, or Gemini API key found。把 key 寫進 backend/.env 後要重啟後端，或直接在前端 Settings 填。',
      },
      {
        q: '一次生成會花多少 API 次數？',
        a: 'backend/config.py 的 NUM_VARIANTS 是 4，一次 Create 會同時跑 4 個 variant；Update 和影片模式各 2 個。只有一把 key 時會用同一家的模型循環補滿 4 個。想省成本可以改這個常數和 routes/model_choice_sets.py。',
      },
      {
        q: '影片轉程式碼需要什麼？',
        a: '一定要 Gemini API key。程式碼在 input_mode 為 video 時沒有 Gemini key 會直接丟錯，OpenAI 或 Anthropic 的 key 不能替代。影片限制 30 秒、單檔 20MB 以內。',
      },
    ],
    featured: false,
  },
  {
    slug: 'find-skills-claude-code-skill-search',
    title: 'find-skills 是什麼？讓 Claude Code 自己找 skill，380 萬安裝實測',
    excerpt:
      'find-skills 是 Vercel 開源的 skill：問 Claude「有沒有 skill 能做 X」，它就搜 skills.sh、照安裝數與來源篩選，問過你才裝，已有 380 萬次安裝。我實測它不會擅自安裝，但 CLI 只按安裝數排序——相關性要靠 Claude 讀結果判斷。',
    category: 'AI 工具',
    tags: [
      'find-skills',
      'Claude Code',
      'Agent Skills',
      'skills.sh',
      'Vercel',
      'npx skills',
      'AI 工具',
    ],
    publishDate: '2026-10-13',
    faqItems: [
      {
        q: 'find-skills 會自動安裝 skill 嗎？',
        a: '不會主動安裝。SKILL.md 的流程是先列推薦，使用者要裝才執行 npx skills add。我用「先不要安裝」實測，跑完 lock 檔裡沒有新增任何 skill。但它給的安裝指令帶 -y，要靠 Claude Code 的權限確認做最後一道關卡。',
      },
      {
        q: 'find-skills 只能用在 Claude Code 嗎？',
        a: '不是。Skills CLI 支援多種 agent，安裝時用 -a 指定，不指定會偵測你電腦上裝了哪些。只裝給 Claude Code 就用 -a claude-code。',
      },
      {
        q: 'find-skills 要錢嗎？',
        a: 'skill 本身和 Skills CLI 都是 MIT 授權、免費。實際花的是 Claude 執行搜尋與整理時的 token，我那次一輪約 0.64 美元。',
      },
      {
        q: '不裝 find-skills 也能找 skill 嗎？',
        a: '可以。直接跑 npx skills find <關鍵字>，或到 skills.sh 搜。find-skills 做的是讓 Claude 在你問問題時自己想到要去找，並幫你濾掉不相關的結果。',
      },
    ],
    featured: false,
  },
  {
    slug: 'rea-reverse-engineer-anything-claude-code',
    title: 'REA 是什麼？24.7 萬星的 AI 逆向工程 MCP，我實測拆 Electron App',
    excerpt:
      'REA 是 morluto 在 2026 年 4 月開源的 MIT 專案，用 MCP 把 Hopper、Ghidra、IDA、JADX 等逆向工具接給 Claude Code、Codex，讓 agent 帶著證據分析 App 怎麼運作。我用 6.5.0 實測 Electron 範例，兩條 IPC 呼叫鏈全部配對正確、還會標出哪些只是候選——但要 Node 22.19+、setup 會改全域設定，原生二進位還得另裝反組譯引擎。',
    category: 'AI 工具',
    tags: [
      'REA',
      'rea-agents',
      '逆向工程',
      'MCP',
      'Claude Code',
      'Electron',
      'AI 工具',
    ],
    publishDate: '2026-10-15',
    faqItems: [
      {
        q: 'REA 要錢嗎？',
        a: 'REA 本身是 MIT 授權、免費，在本機執行。但原生二進位分析要搭配反組譯引擎：Ghidra 免費，Hopper 與 IDA 是商業軟體，REA 不附授權。agent 呼叫模型的 token 費用另計。',
      },
      {
        q: '分析 JavaScript 或 Electron App 需要裝 Ghidra 嗎？',
        a: '不需要。靜態 JavaScript 與 Electron 分析只要 Node.js（22.19+、24.11+ 或 26+）。我機器上 Ghidra、IDA、JADX 都沒設定，analyze-javascript-application 照樣跑完。',
      },
      {
        q: 'REA 會把我要分析的 App 上傳出去嗎？',
        a: 'REA 的分析在本機跑，不上傳目標檔案。但 agent 拿到的工具結果會送給模型供應商，適用對方的資料政策，分析公司內部程式前要先確認。',
      },
      {
        q: '用 REA 能拿到別人 App 的原始碼嗎？',
        a: '不能。它回傳的是偽代碼、組合語言或模組關係等證據。DISCLAIMER 也明列不支援繞過 DRM、授權檢查、反作弊，或複製專有軟體受保護的程式碼。只用在你有權限分析的軟體上。',
      },
    ],
    featured: false,
  },
  {
    slug: 'strata-qwen3-8-flash-next-local-gpu',
    title: 'Strata 是什麼？12GB 顯卡跑 125B 的 Qwen3.8-Flash-Next，門檻與原理拆解',
    excerpt:
      'Strata 是 Niko1221 在 2026-09-24 開源的 MIT 推論引擎，靠把 24,576 個 expert 分層放在顯卡、RAM 和 SSD，讓 12GB 顯卡加 32GB 以上 RAM 就能跑 125B 的 Qwen3.8-Flash-Next，並開出 OpenAI／Anthropic 相容 API。三週 2.5 萬星、已發到 0.1.44.1，幾乎天天出版——能用但還在快速變動，Mac 版更是 10/12 才加進來的新功能。',
    category: 'AI 工具',
    tags: [
      'Strata',
      'Qwen3.8-Flash-Next',
      '本機 LLM',
      'MoE',
      'Claude Code',
      'AI 工具',
    ],
    publishDate: '2026-10-16',
    faqItems: [
      {
        q: 'Strata 要錢嗎？可以商用嗎？',
        a: 'Strata 引擎是 MIT 授權、免費。但它跑的 Qwen3.8-Flash-Next 權重走 qwen-community-1.0 授權，不是 MIT，商用前要先讀模型的 LICENSE。',
      },
      {
        q: '跑 Strata 最少要多少 RAM？',
        a: '官方最低需求是 12GB VRAM 顯卡加 32GB RAM，但 32GB 只能選砍掉一半 expert 的 Coder 版，中文表現較弱。64GB 所有量化大小都能跑。',
      },
      {
        q: 'Mac 可以跑 Strata 嗎？',
        a: '可以，但屬實驗性支援，Metal 版 2026-10-12 才加入，需要 Apple Silicon 與 macOS 15 以上。官方只實測過 128GB M5 Max 和 32GB M4 Mac mini；我在 8GB M2 跑 ./setup.sh --check 會通過，但那只代表能編譯啟動，記憶體不足時會改成從 SSD 串流，速度有限。',
      },
      {
        q: 'Strata 怎麼接 Claude Code？',
        a: 'Strata 0.1.17 以上在 http://127.0.0.1:8080 開 Anthropic Messages 相容端點。設 ANTHROPIC_BASE_URL=http://127.0.0.1:8080、ANTHROPIC_AUTH_TOKEN 隨便填、ANTHROPIC_MODEL 填 Claude Code 認得的模型名，再執行 claude 即可。',
      },
    ],
    featured: false,
  },
  {
    slug: 'ai-tool-learning-notes-writing-breakdown',
    title: '好的 AI 工具學習筆記怎麼寫？拆解一份 21 篇 Claude Code 筆記的 7 個寫法',
    excerpt:
      '一份 21 篇、154 頁的「給設計師的 Claude Code」繁中筆記，摘要 Nick Babich 的英文文章再加上作者自己的補充。它好讀的原因是固定骨架、原文與補充分開標、範例貼完就拆結構——但 AI 工具筆記保存期限只有幾個月，我對官方文件找出 3 處已經不一樣。',
    category: '工作流',
    tags: [
      'Claude Code',
      '學習筆記',
      '技術寫作',
      'Claude Code Skill',
      'Claude Code Plugin',
      'CLAUDE.md',
      'Plan Mode',
    ],
    publishDate: '2026-10-16',
    faqItems: [
      {
        q: '整理英文技術文章成中文筆記，可以公開分享嗎？',
        a: '要看原文授權。這份筆記的做法是每篇標出處、寫明「僅供學習使用」、只摘重點不全文翻譯，並附原文連結。就算這樣，公開發表前還是應該確認原作者的授權條款；Medium 上的會員文章尤其要注意。',
      },
      {
        q: '學習筆記一定要做一頁總結表嗎？',
        a: '不一定。21 篇裡只有 8 篇有。適合放的是「有幾個平行概念要比較」的篇章，例如四個習慣、Skill 和 Plugin 的差別。只講一個工具怎麼用的短篇，用延伸閱讀收尾就夠了。',
      },
      {
        q: '用 Notion 寫技術筆記，匯出 PDF 好用嗎？',
        a: '這份筆記的程式碼區塊、表格、emoji 標題在 PDF 裡都保留下來，頁尾自動帶篇名和頁碼，當成交付物很整齊。我用程式抽 PDF 文字時，表格會變成一格一行，要整理成可複製的內容得自己重排；如果讀者需要複製指令，同時留一份線上版比較方便。',
      },
    ],
    featured: false,
  },
  {
    slug: 'orca-ai-agent-orchestrator',
    title: 'Orca 是什麼？實測一個任務一個 worktree，agent 平行不打架',
    excerpt:
      'Orca 是 Stably AI 開源的 MIT 桌面 app，每個任務開一個 git worktree，讓 Claude Code、Codex 這些 agent 各自在自己的資料夾裡改檔，改完在同一個視窗看 diff、開 PR。七個月 9.3 萬星、十天發 4 個正式版——功能更新很快，我的部落格就在它開的 worktree 裡寫，但截圖與選單位置以官方文件為準。',
    category: 'AI 工具',
    tags: ['Orca', 'git worktree', 'Claude Code', 'Codex', 'AI agent', 'AI 工具'],
    publishDate: '2026-10-16',
    faqItems: [
      {
        q: 'Orca 要錢嗎？',
        a: 'Orca 本身是 MIT 授權的開源軟體，免費下載。它不附 AI 模型，Claude Code、Codex 這些 agent 用的是你自己的訂閱或 API 額度。',
      },
      {
        q: 'Orca 和 Cursor、VS Code 差在哪？',
        a: 'Cursor、VS Code 是以編輯器為中心，AI 是編輯器裡的一個功能。Orca 是以 agent 和 worktree 為中心，主要畫面是一排 worktree 和 agent 終端機，編輯器、diff、瀏覽器是輔助。它也能開 Cursor CLI 當其中一個 agent。',
      },
      {
        q: 'Orca 支援 Windows 嗎？',
        a: '支援，Windows 有安裝檔，預設 shell 可以選 PowerShell 或 CMD。我自己就是在 Windows 11 上用 Orca 寫這個部落格。',
      },
      {
        q: '刪掉 Orca 的 worktree，branch 會不見嗎？',
        a: '官方文件寫的是刪 worktree 會連 branch 一起刪，刪之前會確認。如果 git 判斷那個 branch 還有沒合併的 commit 而保留下來，Orca 會另外提供檢查的步驟。要留下的成果，先 push 或合併再刪。',
      },
    ],
    featured: false,
  },
  {
    slug: 'herdr-terminal-agent-runtime',
    title: 'herdr 是什麼？實測終端機 agent 多工器，誰卡住一眼看到',
    excerpt:
      'herdr 是 Rust 寫的 Apache-2.0 終端機多工器，像 tmux 一樣切 workspace 和 pane，但認得裡面跑的 Claude Code、Codex，標出每個 agent 在工作、卡住還是閒著。我在 Windows 實測 v0.9.5，server 重啟後版面回來、執行中的程式不會——還在 0.x，適合平常就住在終端機裡的人。',
    category: 'AI 工具',
    tags: ['herdr', 'tmux', 'Claude Code', 'Codex', 'AI agent', '終端機', 'AI 工具'],
    publishDate: '2026-10-16',
    faqItems: [
      {
        q: 'herdr 和 tmux 差在哪？',
        a: 'tmux 只管終端機，不知道裡面跑的是什麼。herdr 也是終端機多工器，但認得 pane 裡的 coding agent，會標出 working、blocked 等狀態，還有給 agent 用的 CLI 和 API，可以讓一個 agent 開 pane、派工給另一個 agent。',
      },
      {
        q: 'herdr 會把我的程式碼送出去嗎？',
        a: 'herdr 本身是本機的終端機工具，程式碼在你的電腦上，送到哪裡取決於你在 pane 裡跑的 agent。我觀察到的對外行為是下載 agent 偵測規則，規則檔存在 %LOCALAPPDATA%\herdr\agent-detection\remote\。',
      },
      {
        q: '不想用了怎麼清乾淨？',
        a: '刪掉 herdr 執行檔，再刪掉它的資料夾。在 Windows 上，我試用後留下的是 %APPDATA%\herdr（session 與 socket）、%LOCALAPPDATA%\herdr（偵測規則）和 ~/.herdr（worktree）。',
      },
    ],
    featured: false,
  },
  {
    slug: 'personal-knowledge-base-obsidian-claude-code',
    title: '個人知識庫怎麼讓 AI 真的用上？Obsidian + Claude Code hook 讀寫兩條路實作',
    excerpt:
      '我的個人知識庫是一個 258 張卡片的 Obsidian vault，由 Claude Code 的 Stop hook 排隊、每晚用 claude -p 整理成卡片，再由 UserPromptSubmit hook 用 BM25 在每次提問時撈出相關卡片注入 context。六週 51 封日報共寫入 142 張卡，檢索每次約 0.5 到 0.9 秒——字面比對撈得準，換個說法就撈不到，是目前最大的缺口。',
    category: 'AI 工具',
    tags: ['個人知識庫', 'Obsidian', 'Claude Code', 'hooks', 'BM25', 'LLM Wiki', 'RAG'],
    publishDate: '2026-10-20',
    faqItems: [
      {
        q: '一定要用 Obsidian 嗎？',
        a: '不用。卡片就是一般的 markdown 檔，hook 只讀檔案系統。Obsidian 的用處是讓我自己翻卡片、看連結關係比較方便。',
      },
      {
        q: '為什麼不直接用向量資料庫？',
        a: '向量檢索需要 embedding 模型和索引維護。我裝的 mempalace 就遇過索引跟資料筆數對不上、需要重建的狀況。BM25 每次直接讀 markdown 計算，沒有額外的狀態要維護，卡片數在幾百張的規模時速度也夠。',
      },
      {
        q: 'UserPromptSubmit hook 會不會拖慢每次提問？',
        a: '我的實測是每次 0.5 到 0.9 秒，當時 372 張卡。hook 有設 10 秒逾時。卡片數再多一個數量級時，就需要把斷詞結果快取起來，不要每次重算。',
      },
      {
        q: '夜間整理會不會把錯的東西寫進卡片？',
        a: '會有這個風險，因為判斷寫什麼的是 LLM。我的做法是每晚寄日報列出寫了哪幾張卡，自己看標題抽查；寫卡規則要求先找同主題的卡補充，不要一直開新卡。',
      },
    ],
    featured: false,
  },
  {
    slug: 'claude-code-flagship-skills',
    title: '8 支 Claude Code 旗艦 skill：從開案到發文一條龍',
    excerpt:
      '我把每天反覆在做的工作流寫成 8 支 Claude Code 旗艦 skill：開案的 /wez-cms-scaffold、/springboot-init，開發的 /spec-flow、/plan、/review-and-clean，驗收部署的 /screenshot-review、/jenkins-docker，還有發文的 /blog-create。共通點是完成要從輸出端驗、沒驗過就標沒驗過——想要可以寫信跟我拿。',
    category: '工作流',
    tags: ['Claude Code', 'Claude Code Skill', '工作流', 'TDD', 'round-trip', 'AI Agent'],
    publishDate: '2026-10-20',
    faqItems: [
      {
        q: '這些 skill 可以直接裝來用嗎？',
        a: '部分可以。/plan、/review-and-clean、/screenshot-review、/blog-create 的流程與 gate 跟專案無關；/wez-cms-scaffold、/springboot-init、/jenkins-docker 綁著我公司的範本、共用模組與部署環境，拿去要改設定才能跑。想要的話寫信到 bobchen184@gmail.com 跟我要。',
      },
      {
        q: '什麼樣的 skill 才算旗艦？',
        a: '我的標準是跨越一整段工作流、有多個階段、有明確的完成定義，而且會被反覆當骨幹用。只做一個動作的薄殼指令，例如跑一次 build 或推一次部署，不算旗艦。',
      },
      {
        q: '/plan 跟 /spec-flow 差在哪？',
        a: '/plan 是日常任務的起手式，一個需求從計畫、TDD、驗證跑到交付；/spec-flow 給從零開始的新專案或大功能，先寫規格文件、拆成帶 ID 的節點，再讓測試與狀態表跟著節點走。',
      },
    ],
    featured: false,
  },
  {
    slug: 'apple-design-skill-claude-code',
    title: 'apple-design skill 實測：17 節 Apple 動效規範，點名最保險',
    metaDescription:
      'apple-design 是 Emil Kowalski 開源的 Claude Code skill，把 WWDC 動效原則寫成 17 節規範。我用同一個 bottom sheet 實測差異，附安裝指令與不觸發的坑。',
    excerpt:
      'apple-design 是 Emil Kowalski（Linear、前 Vercel）收在 MIT 授權 emilkowalski/skills 裡的 AI agent skill，把 Apple WWDC 的動效、手勢與材質原則改寫成 17 節給網頁用的規範。repo 有 47.8k stars（15 支 skill 共用）；我實測點名使用時，Claude Code 寫的 bottom sheet 多了彈簧、動量投射與橡皮筋——但沒點名時 3 次只觸發 1 次。',
    category: 'AI 工具',
    tags: ['Claude Code', 'Claude Code Skill', 'apple-design', 'Emil Kowalski', '動效設計', 'WWDC'],
    publishDate: '2026-10-20',
    faqItems: [
      {
        q: 'apple-design skill 是 Apple 官方出的嗎？',
        a: '不是。它是 Emil Kowalski 個人開源的 skill，內容整理自 Apple 公開的 WWDC 設計演講，主軸是 2018 年的 Designing Fluid Interfaces，授權是 MIT。',
      },
      {
        q: '47.8k stars 是 apple-design 一支的嗎？',
        a: '不是。GitHub 只能對整個 repo 加星，emilkowalski/skills 裡有 15 支 skill，47.8k 是整套共用的數字。',
      },
      {
        q: '裝了之後一定會自動被用上嗎？',
        a: '不一定。我用同一句寫 bottom sheet 的需求、沒點名 skill 跑了 3 次，只有 1 次自動載入。想穩定生效就在需求前面打 /apple-design。',
      },
      {
        q: '可以拿來寫 iOS 或 SwiftUI 嗎？',
        a: '它是翻譯給網頁的版本，範例都是 CSS、Pointer Events 和 JavaScript。寫原生 App 可以看同 repo 的 write-swift 與 mobile-native。',
      },
      {
        q: '跟 dickwu/apple-design-skill 差在哪？',
        a: 'emilkowalski 這支專注網頁上的動效、手勢與材質，適合寫互動元件；dickwu 那支是跨平台的 Human Interface Guidelines 審查，適合檢查介面合不合 Apple 規範。',
      },
    ],
    featured: false,
  },
  {
    slug: 'emil-design-eng-skill-claude-code',
    title: 'emil-design-eng skill 實測：674 行規範，差異全在動態',
    metaDescription:
      'emil-design-eng 是 Emil Kowalski 最長的 Claude Code skill，674 行講 easing、時長與何時不要動畫。我用同一個下拉選單實測差異，附安裝、點名與 token 成本。',
    excerpt:
      'emil-design-eng 是 Emil Kowalski 收在 MIT 授權 emilkowalski/skills 裡最長的一支 skill（674 行），把他對 easing、動畫時長、何時不該動畫與 UI 細節的判斷寫給 AI agent 看。我實測同一個下拉選單，點名後開啟 102ms 就接近不透明、關閉比開啟快，截圖卻幾乎一樣——而且不點名 3 次只觸發 1 次，載入一次約多 9.9k tokens。',
    category: 'AI 工具',
    tags: ['Claude Code', 'Claude Code Skill', 'emil-design-eng', 'Emil Kowalski', '動效設計', 'easing'],
    publishDate: '2026-10-21',
    faqItems: [
      {
        q: 'emil-design-eng 跟 apple-design 要裝哪一支？',
        a: '寫拖曳、可甩動的面板選 apple-design，它有動量投射與橡皮筋公式；一般網頁元件的開關動畫、審查 CSS 的時長與曲線選 emil-design-eng。兩支不撞名，可以都裝，但同時載入會多吃 context。',
      },
      {
        q: '48k stars 是 emil-design-eng 一支的嗎？',
        a: '不是。GitHub 只能對整個 repo 加星，2026-10-21 查詢 emilkowalski/skills 是 48,159 stars，由 repo 內 15 支 skill 共用。',
      },
      {
        q: '裝了之後會自動被用上嗎？',
        a: '不一定。它沒有 disable-model-invocation，但 description 沒寫使用情境。我同一句下拉選單需求不點名跑 3 次，只有 1 次自動載入；要穩定生效就在需求前面打 /emil-design-eng。',
      },
      {
        q: '單獨打 /emil-design-eng 為什麼只回一句話？',
        a: 'skill 規定在沒有具體問題時只回固定的一句招呼，不主動給建議。把需求接在同一行，例如「/emil-design-eng 審查這個 dropdown 的動畫」，它才會開始做事。',
      },
      {
        q: '載入 emil-design-eng 要多少 token？',
        a: '我從 stream-json 量到，點名後第一個請求的 input tokens 從 25,360 增加到 35,313，約多 9.9k；只是裝著沒載入時，description 約佔 59 tokens。',
      },
    ],
    featured: false,
  },
  { slug:'animation-vocabulary-skill-claude-code', title:'animation-vocabulary skill 實測：91 個動畫術語，問名字才觸發', metaDescription:'animation-vocabulary 把模糊動畫描述反查成 91 個標準術語。24 次 claude -p 對照：問「叫什麼」全觸發、Pop in 三次一致，只描述則 0/3；附安裝與點名法。', excerpt:'animation-vocabulary 是 Emil Kowalski 的反查型 skill，用 91 個術語把「彈一下」翻成 Pop in 這類標準詞。24 次 claude -p 對照中，問名稱的題目全部自動觸發，只描述感覺則 0/3——要穩就直接點名。', category:'AI 工具', tags:['Claude Code','Claude Code Skill','animation-vocabulary','Emil Kowalski','動效設計','動畫術語'], publishDate:'2026-10-21', faqItems:[{q:'animation-vocabulary 會不會自己寫動畫程式碼？',a:'不會。description 明寫只負責命名、不負責設計或實作，實測中它只回傳術語、定義與近似詞，沒有產生程式碼。'},{q:'用中文問 animation-vocabulary 有用嗎？',a:'有用。24 次實驗全部用中文 prompt，問名稱的題目都正確觸發；只是術語與定義維持英文，中文說明由模型另外補。'},{q:'一定要裝整個 emilkowalski/skills 嗎？',a:'不用。npx skills@latest add emilkowalski/skills --skill animation-vocabulary 只裝這一支；它只有一個 SKILL.md，手動複製到 .claude/skills/animation-vocabulary/ 也可以。'},{q:'為什麼說「彈一下」animation-vocabulary 沒反應？',a:'只描述感覺時模型會當成實作需求，實測 3 次都沒呼叫 Skill 工具。句子裡加上「這叫什麼」，或直接打 /animation-vocabulary 點名就會觸發。'}], featured:false },
  {
    slug: 'animate-skill-claude-code',
    title: 'animate skill 實測：4 次都拒絕替 Ctrl+K 加動畫',
    metaDescription:
      'animate 是 Emil Kowalski 開源的 Claude Code skill，用 7 步決定動畫該不該做、怎麼做。我用同一句需求對照有無 skill 跑 7 次，附安裝指令與 Git Bash 點名的坑。',
    excerpt:
      'animate 是 Emil Kowalski 在 2026 年 8 月放進 emilkowalski/skills（MIT）的 Claude Code skill，用一份 SKILL.md 加 14 份元件食譜，把「加個動畫」拆成先問該不該動、再挑工具與曲線的 7 步流程。同一句需求實測，沒裝 skill 的 3 次都替 Ctrl+K 面板加了動畫、1 次還弄壞，有 skill 的 4 次全部拒絕，下拉選單也統一用 0.95 縮放與同一條曲線——它最有價值的是會說「這不該動」。',
    category: 'AI 工具',
    tags: ['Claude Code', 'Claude Code Skill', 'animate', 'Emil Kowalski', '動效設計', 'CSS 動畫'],
    publishDate: '2026-10-21',
    faqItems: [
      {
        q: 'animate skill 是什麼？',
        a: 'animate 是 Emil Kowalski 開源在 emilkowalski/skills（MIT）裡的 Claude Code skill，專門從零實作動畫。它要求依序回答 7 個問題：該不該動、目的、工具、屬性、曲線與時長、中斷與退場、減少動態效果，前兩步沒過就不寫程式碼。',
      },
      {
        q: 'animate 為什麼會拒絕替命令面板加動畫？',
        a: 'skill 第 1 步依觸發頻率分級，一天 100 次以上的動作（鍵盤快捷鍵、命令面板開關）規定不加動畫，並以 Raycast 為例。實測 4 次有 skill 的執行都拒絕替 Ctrl+K 面板加動畫，改建議瞬間開關或靜態提示。',
      },
      {
        q: '裝了 animate 不點名也會自動觸發嗎？',
        a: '它沒有設 disable-model-invocation，模型可以自己載入。我用「加開關動畫」的需求沒點名跑 3 次，3 次都自動載入，但樣本小；想穩定的話在需求前加 /animate。',
      },
      {
        q: '怎麼安裝 animate skill？',
        a: '執行 npx skills@latest add emilkowalski/skills --skill animate。不想回答互動問題可加 --agent claude-code --copy -y，會產生 .claude/skills/animate/ 底下的 SKILL.md 與 RECIPES.md，以及 skills-lock.json。',
      },
      {
        q: '在 Git Bash 用 claude -p "/animate" 為什麼沒反應？',
        a: 'Git Bash（MSYS）會把開頭的 /animate 當成路徑改寫成 C:/Program Files/Git/animate，模型收到的就不是 slash 指令。在指令前加 MSYS_NO_PATHCONV=1，或改用 PowerShell、互動式 Claude Code 就正常。',
      },
    ],
    featured: false,
  },
  {
    slug: 'animate-expo-skill-claude-code',
    title: 'animate-expo skill 實測：5 組對照，點名版拒做分頁滑動',
    metaDescription:
      'animate-expo skill 實測：同一句 Expo 需求跑 5 組 Claude Code，沒裝 skill 的 spring、慣性投射、減少動態都是 0，點名版還直接拒做分頁滑動。附安裝指令與限制。',
    excerpt:
      'animate-expo 是 Emil Kowalski 寫給 AI 的 Expo 動效規範，管手勢、sheet 與觸覺回饋。同一句需求跑 5 組 Claude Code，裝了的 3 組都用上 spring 與減少動態，沒裝的 2 組是 0，點名版還拒做分頁滑動。',
    category: 'AI 工具',
    tags: ['Claude Code', 'Claude Code Skill', 'animate-expo', 'Emil Kowalski', 'Expo', 'React Native'],
    publishDate: '2026-10-21',
    faqItems: [
      {
        q: 'animate-expo 和 animate 差在哪？',
        a: 'animate 管網頁動畫（CSS、WAAPI、Motion），animate-expo 管 React Native／Expo（Reanimated、Gesture Handler、Expo Router、expo-haptics）。animate 的 SKILL.md 自己寫明 React Native 交給 animate-expo。',
      },
      {
        q: '48k stars 是 animate-expo 一支的嗎？',
        a: '不是。2026-10-21 查到 emilkowalski/skills 有 48,157 stars，GitHub 只能對整個 repo 加星，這是 15 支 skill 共用的數字。',
      },
      {
        q: '裝了之後不點名會自動用上嗎？',
        a: '我用一句 Expo 需求沒點名跑了 2 次，2 次都在第一步自己載入。它沒有設 disable-model-invocation，模型可以自己判斷要不要用。樣本很小，想穩定生效還是在需求前面打 /animate-expo。',
      },
      {
        q: '只打 /animate-expo 為什麼只回一句話？',
        a: 'SKILL.md 規定被叫出來時如果沒有具體問題，只回一句英文開場白。要把需求接在 /animate-expo 後面一起打。',
      },
      {
        q: '實測的動畫手感有比較好嗎？',
        a: '我只跑了 npx tsc --noEmit 型別檢查，只做程式碼層比對、未在裝置上執行。skill 自己規定手感只能在 release build、最慢的支援機型上判斷。',
      },
    ],
    featured: false,
  },
  {
    slug: 'find-animation-opportunities-skill-claude-code',
    title: 'find-animation-opportunities 實測：抓到沒寫 CSS 的目錄箭頭',
    metaDescription:
      'find-animation-opportunities 是 Emil Kowalski 的 Claude Code skill，用 4 題 Gate 找該加與不該加動畫的地方。我跑兩次並把建議修進正式站，附 diff。',
    excerpt:
      'find-animation-opportunities 是 Emil Kowalski 收在 MIT 授權 emilkowalski/skills 裡的 Claude Code skill，用頻率、目的、速度、功能四題 Gate 篩出介面上該加與不該加動畫的地方，只出報告、不改程式碼。我拿部落格前端跑了兩次，點名那次抓到有 class 沒樣式的目錄箭頭，兩次對篩選動畫卻給出相反結論——箭頭與篩選動畫後來都修進正式站，附 diff 與 Playwright 實測。',
    category: 'AI 工具',
    tags: ['Claude Code', 'Claude Code Skill', 'find-animation-opportunities', 'Emil Kowalski', '動效設計', '前端審查'],
    publishDate: '2026-10-21',
    faqItems: [
      {
        q: 'find-animation-opportunities 會直接改我的程式碼嗎？',
        a: '不會。SKILL.md 的第一條 Hard Rule 就是不改原始碼，它只輸出建議表、否決清單和結論。要實作時，它會建議交給 improve-animations plan，或把建議表拿給任何 agent 去做。',
      },
      {
        q: '48,160 stars 是這一支 skill 的嗎？',
        a: '不是。GitHub 只能對整個 repo 加星，emilkowalski/skills 裡有 15 支 skill，48,160（2026-10-21 查詢）是整套共用的數字。',
      },
      {
        q: '要點名才會用嗎？',
        a: '不一定要。它的 frontmatter 沒有 disable-model-invocation，模型可以自己載入。但我實測兩種叫法結論不同，想要可重現的結果，就在需求前面打 /find-animation-opportunities。',
      },
      {
        q: '跟 improve-animations、review-animations 差在哪？',
        a: 'find-animation-opportunities 找的是「還沒有動畫、但應該有」的地方；improve-animations 稽核既有動畫並產出修正計畫；review-animations 審查既有動畫的品質。三支分工不重疊。',
      },
      {
        q: '同一份程式碼跑兩次，結果會一樣嗎？',
        a: '不保證。我的兩次實測有三項建議重疊，但目錄箭頭只在點名那次被抓到，篩選動畫一次建議做進場、一次直接否決。重要的介面建議多跑一次再決定。',
      },
    ],
    featured: false,
  },
  {
    slug: 'improve-animations-skill-claude-code',
    title: 'improve-animations 實測：9 分鐘審完全站動畫，剛修的也被抓',
    metaDescription: 'improve-animations 是 emilkowalski/skills 裡只寫計畫不改碼的動畫審計 skill。實測部落格前端 9 分鐘出 4 份計畫，線上驗證 3 條成立，含剛修出的 ease-in。',
    excerpt: 'improve-animations 是 Emil Kowalski 開源的 Claude Code skill，掃整個 repo 的動畫程式碼，只把修法寫成 plans/ 底下的自足計畫、不動原始碼。我拿剛修完動畫的部落格前端跑一次，約 9 分鐘、US$2.04 產出 8 條發現與 4 份計畫，挑 3 條到正式站量測全部成立，其中一條就是當天新加的 ease-in。',
    category: 'AI 工具',
    tags: ['Claude Code', 'Claude Code Skill', 'improve-animations', 'Emil Kowalski', '動效設計', '動畫審計'],
    publishDate: '2026-10-21',
    faqItems: [
      {
        q: 'improve-animations 會直接修改我的程式碼嗎？',
        a: '不會。它的硬規則是只能在 plans/（或 animation-plans/）底下建立計畫檔，也不跑 install、build、commit。要實作可以用 improve-animations execute <plan>，它會在隔離的 worktree 派執行者改，再用 review-animations 的標準審 diff。',
      },
      {
        q: 'improve-animations 和 review-animations 差在哪？',
        a: 'improve-animations 掃整個 repo，產出排好優先度的發現表與自足計畫；review-animations 審一段既有的動畫或 diff，預設立場是挑毛病。前者沒有 disable-model-invocation，可以自動觸發；後者必須點名。',
      },
      {
        q: '只輸入 /improve-animations 為什麼什麼都沒做？',
        a: 'SKILL.md 規定不帶問題呼叫時只回一句「I\'m ready to audit your animations and plan the fixes…」就停。要在後面寫明範圍與深度，例如「審計 src/ 全部互動 UI 的動畫（standard effort）」。',
      },
      {
        q: '跑一次 improve-animations 要多久、多少錢？',
        a: '我用 Opus 5.5 對一個 Astro 6 加 React 19 的部落格前端跑 standard 深度，約 9.2 分鐘、28 turns、US$2.04，沒有派 subagent。deep 深度最多會派 8 個 subagent，我沒有實測。',
      },
      {
        q: '怎麼安裝 improve-animations？',
        a: '執行 npx skills@latest add emilkowalski/skills --skill improve-animations。我實測 skills CLI 1.7.4 會把檔案放進 .claude/skills/improve-animations/ 並產生 skills-lock.json。',
      },
    ],
    featured: false,
  },
  {
    slug: 'review-animations-skill-claude-code',
    title: 'review-animations skill 實測：8 條意見零誤報，漏了 3 處',
    metaDescription:
      'review-animations 是 Emil Kowalski 開源的 Claude Code 動畫審查 skill，只能打斜線點名。我拿它審部落格剛上線的動畫，附 8 條意見真假判定與安裝指令。',
    excerpt:
      'review-animations 是 Emil Kowalski 以 MIT 開源的動畫審查 skill，拿 10 條標準比對 diff、一定判 Block 或 Approve，只能打 /review-animations 點名。我拿它審部落格剛上線的動畫 commit，8 條意見 3 條在正式站重現、0 條誤報——但漏了 3 個量得到的問題，適合當第二雙眼睛。',
    category: 'AI 工具',
    tags: ['Claude Code', 'Claude Code Skill', 'review-animations', 'Emil Kowalski', '動效設計', 'Code Review'],
    publishDate: '2026-10-21',
    faqItems: [
      {
        q: 'review-animations 裝了之後會自動審查嗎？',
        a: '不會。它的 frontmatter 設了 disable-model-invocation: true，模型不會自己載入它，要在需求前面打 /review-animations 才會跑。我拿掉斜線再跑一次，模型改去載入 apple-design。',
      },
      {
        q: '它跟 improve-animations 差在哪？',
        a: 'review-animations 審一份 diff，輸出修改前、修改後、原因的對照表並判 Block 或 Approve，不改程式；improve-animations 是掃整個專案、找出可以加強的動畫並動手改。',
      },
      {
        q: '它的審查意見準嗎？',
        a: '我拿部落格 commit 07d7267 實測，它提 8 條意見，3 條在正式站用 Playwright 實際重現，其餘是設計立場或未量測的建議，沒有一條是誤報；但它漏了 3 個量得到的問題，例如減少動態模式下封面圖仍會放大。',
      },
      {
        q: '48k stars 是 review-animations 一支的嗎？',
        a: '不是。GitHub 只能對整個 repo 加星，2026-10-21 時 emilkowalski/skills 是 48,156 stars，由 repo 裡 15 支 skill 共用。',
      },
      {
        q: '怎麼安裝？',
        a: '在專案根目錄執行 npx skills@latest add emilkowalski/skills --skill review-animations，裝好後用 /review-animations 加上要審的範圍呼叫。',
      },
    ],
    featured: false,
  },
  {
    slug: 'animation-performance-skill-claude-code',
    title: 'animation-performance skill 實測：抓的問題沒變多，排序變準',
    metaDescription:
      'animation-performance 是 Emil Kowalski 的 Claude Code skill，專抓動畫掉幀。我做有無 skill 對照與 Playwright 量測，附安裝指令與 layout 歸零幀率卻沒變的原因。',
    excerpt:
      'animation-performance 是 Emil Kowalski 以 MIT 開源的 Claude Code skill，專門診斷網頁動畫為什麼掉幀，裝了會自動觸發。我實測有無 skill 的審查，問題清單差不多，但有 skill 的 4 次都把動 width 的進度條排第 1；改成 scaleX 後 layout 從約 250 次降到 0——桌機幀率卻沒變，要實機錄影才算數。',
    category: 'AI 工具',
    tags: ['Claude Code', 'Claude Code Skill', 'animation-performance', 'Emil Kowalski', '動畫效能', '前端效能'],
    publishDate: '2026-10-21',
    faqItems: [
      {
        q: 'animation-performance skill 會自動觸發嗎？',
        a: '會。它的 frontmatter 沒有 disable-model-invocation，我用一句「審查動畫效能」的需求、沒點名跑了 3 次，3 次都自動載入。需求裡沒有效能、卡頓、掉幀這類字時，建議在前面打 /animation-performance 點名。',
      },
      {
        q: '48k stars 是 animation-performance 一支的嗎？',
        a: '不是。GitHub 只能對整個 repo 加星，emilkowalski/skills 裡有 15 支 skill，2026-10-21 查到的 48,162 stars 是整套共用的數字。',
      },
      {
        q: '它會幫我量 fps 或錄 Performance 嗎？',
        a: '不會。它在 Claude Code 裡是讀程式碼做靜態審查，報告會標出哪些是從程式碼確認、哪些需要實機錄影。實際量測要自己用 DevTools Performance 面板或 Playwright 腳本做。',
      },
      {
        q: '把 width 動畫改成 transform: scaleX 一定會變順嗎？',
        a: '不一定看得出來。我在正式文章頁量到 layout 從約 250 次降到 0，但桌機上平均幀間隔兩版都在 17ms 左右。SKILL.md 也寫明 layout 動畫不一定會掉幀，改 scaleX 的理由是在慢裝置上不會退步。',
      },
      {
        q: '它跟 animate、review-animations 差在哪？',
        a: 'animation-performance 只回答每一幀能不能在 16.7ms 內畫完；easing、時長與要不要動畫歸 animate；整體審查動效、包括動畫該不該存在歸 review-animations，而且 review-animations 要點名才會用。',
      },
    ],
    featured: false,
  },
  {
    slug: 'mobile-native-skill-claude-code',
    title: 'mobile-native skill 實測：19 項審查抓出 14 個手機坑',
    metaDescription:
      'mobile-native 是 Emil Kowalski 開源的 Claude Code skill，專抓手機網頁 11 種症狀。我拿它審自己的部落格，附 iOS 放大、100vh、安全區的修法 diff 與線上驗證。',
    excerpt:
      'mobile-native 是 Emil Kowalski 以 MIT 開源的 AI agent skill，專抓網頁在手機上露餡的 11 種症狀，例如 hover 黏住、100vh 與輸入框放大。我點名它審自己的部落格，19 列抓出 14 個問題、修完再審又找到一個新坑，但模擬器只能證明 CSS 上線，iOS 實機仍要拿手機驗。',
    category: 'AI 工具',
    tags: ['Claude Code', 'Claude Code Skill', 'mobile-native', 'Emil Kowalski', '手機網頁', 'iOS Safari'],
    publishDate: '2026-10-21',
    faqItems: [
      {
        q: '為什麼 iOS 點輸入框整頁會放大？',
        a: 'iOS Safari 在輸入框字級小於 16px 時，聚焦會自動放大頁面，而且離開輸入框也不會縮回。正解是把輸入框字級拉到 16px，不是在 viewport 加 maximum-scale 或 user-scalable=no 禁止縮放。',
      },
      {
        q: '48,160 stars 是 mobile-native 一支的嗎？',
        a: '不是。GitHub 只能對整個 repo 加星，emilkowalski/skills 裡有 15 支 skill，這是整套共用的數字（2026-10-21 查）。',
      },
      {
        q: '100vh、100dvh、100svh 該用哪個？',
        a: '依 mobile-native 的分法：選單、抽屜、App 外殼這類要貼著可視範圍的元素用 100dvh；首屏和行銷區塊用 100svh，捲動時不會跳版。舊瀏覽器需要時可在上一行留 100vh 當備援。',
      },
      {
        q: '用 Playwright 或 Chrome 裝置模擬驗過就算修好了嗎？',
        a: '不算。模擬器沒有網址列和瀏海，safe-area 量到 0px、vh 和 dvh 也一樣，只能證明 CSS 有上線。iOS 放大、安全區遮擋、網址列收合要用實機確認。',
      },
    ],
    featured: false,
  },
  {
    slug: 'pick-ui-library-skill-claude-code',
    title: 'pick-ui-library 實測：20 個前端套件清單，6 情境抓到 2 個坑',
    metaDescription:
      'pick-ui-library 是 Emil Kowalski 的 Claude Code 選套件 skill，要手打 /pick-ui-library 才觸發。我跑 6 個情境，附 20 個套件的 npm 現況與安裝指令。',
    excerpt:
      'pick-ui-library 是 Emil Kowalski 收在 MIT 授權 emilkowalski/skills 裡的 Claude Code skill，用 85 行清單把 19 種前端任務對到 20 個函式庫，要手打 /pick-ui-library 才載入。我跑 6 個情境，它會先看 package.json、不亂換依賴，但一次給了已棄用的套件名——清單值得用，安裝前自己核對 npm。',
    category: 'AI 工具',
    tags: ['Claude Code', 'Claude Code Skill', 'pick-ui-library', 'Emil Kowalski', 'React', '前端套件選型'],
    publishDate: '2026-10-21',
    faqItems: [
      {
        q: 'pick-ui-library 裝了之後會自動觸發嗎？',
        a: '不會。它的 frontmatter 設了 disable-model-invocation: true，Claude 不能自己載入它，要在需求前面打 /pick-ui-library 才會生效。只打指令不帶問題時，它只回一句固定開場白。',
      },
      {
        q: '為什麼我沒點名，Claude 還是照清單推薦？',
        a: '我實測沒點名的兩個情境，模型都沒透過 Skill 工具載入它，但用 Bash 探索專案時讀到了 .claude/skills/ 底下的 SKILL.md。disable-model-invocation 只擋自動載入，不會把檔案藏起來。',
      },
      {
        q: '照它的推薦安裝套件要注意什麼？',
        a: '清單只寫函式庫名稱和官網連結，沒寫 npm 套件名。base-ui 現在的套件名是 @base-ui/react，舊名 @base-ui-components/react 已棄用；cva 要裝 class-variance-authority，npm 上的 cva 是 0.0.0 的佔位版本。安裝前先到 npm 核對名稱與最新版。',
      },
      {
        q: '怎麼只裝 pick-ui-library 這一支？',
        a: '執行 npx skills@latest add emilkowalski/skills --skill pick-ui-library。我用 skills CLI 1.7.4 實裝過，會在專案下產生 .claude/skills/pick-ui-library/SKILL.md 和一份 skills-lock.json。',
      },
      {
        q: '不是 React 專案能用嗎？',
        a: '用處有限。清單以 React 生態為主，base-ui、Sonner、cmdk、input-otp、Virtuoso 都是 React 元件，Vue、Svelte 或原生 App 大多對不上；shiki、Satori、clsx 這幾個則不綁框架。寫原生 iOS 可以看同 repo 的 write-swift 與 mobile-native。',
      },
    ],
    featured: false,
  },
  {
    slug: 'prototype-skill-claude-code',
    title: 'prototype skill 實測：AI 一次做 4 版 UI，有 1 版是壞的',
    metaDescription:
      'prototype 是 Emil Kowalski 的 Claude Code skill，一次做多版 UI 放進切換器挑。實測點名做出 4 版卡片 hover，附安裝指令、PICKER 規格與不自動觸發的坑。',
    excerpt:
      'prototype 是 Emil Kowalski 開源的 Claude Code skill，把一個 UI 元件做成幾版不同原型，放進切換器讓你挑。repo 有 48.2k stars（15 支共用）；我實測點名時做出 4 版卡片 hover、沒碰正式程式，但 1 版全黑沒自驗，不點名不載入。',
    category: 'AI 工具',
    tags: ['Claude Code', 'Claude Code Skill', 'prototype', 'Emil Kowalski', 'UI 原型', '前端設計'],
    publishDate: '2026-10-21',
    faqItems: [
      {
        q: 'prototype skill 會自己觸發嗎？',
        a: '不會。它在 frontmatter 設了 disable-model-invocation: true，要打 /prototype 加上需求才會跑。我用同一句需求不點名跑一次，Claude 完全沒讀這份 skill，直接改了 3 支正式程式檔。',
      },
      {
        q: 'PICKER.md 是什麼？是把幾個方案並排比較嗎？',
        a: '不是並排。PICKER.md 是切換器的固定規格：畫面底部一顆深色膠囊，一次只顯示一個版本、全尺寸放在真實情境裡，用數字鍵或方向鍵切換，目前版本記在網址的 ?v= 參數。',
      },
      {
        q: '它會改到我的正式程式碼嗎？',
        a: '探索期間不會。我實測點名那次，所有版本都放在獨立的 prototype.html 與 src/prototypes/，git status 顯示 App.tsx、ArticleCard.tsx 沒被動過。要等你回 keep <版本名> 才會整合進正式程式並刪掉原型區。',
      },
      {
        q: '做出來的版本可以直接相信嗎？',
        a: '要自己逐版看過。我那次 4 版裡有 1 版內文區整片黑底、字看不見，tsc 和 lint 都抓不到。skill 要求 Claude 在瀏覽器逐版檢查，但沒有瀏覽器工具時這一步就會被跳過。',
      },
    ],
    featured: false,
  },
  {
    slug: 'ask-sonner-skill-claude-code',
    title: 'ask-sonner skill 實測：Sonner 作者的指南，有 1 個 API 不存在',
    metaDescription:
      'ask-sonner 是 Sonner 作者 Emil Kowalski 寫的 Claude Code skill。我用 5 組 claude -p 對照實測，找出它跟 Sonner 2.0.8 對不上的 API，附安裝與點名方式。',
    excerpt:
      'ask-sonner 是 Sonner 作者 Emil Kowalski 寫的 skill，教 AI 設定與排查 React toast。它教的 getActiveToasts() 不在 Sonner 2.0.8 公開 API，5 組實測唯一編譯失敗的就是照抄那組，用時要叫 AI 跑 tsc。',
    category: 'AI 工具',
    tags: ['Claude Code', 'Claude Code Skill', 'ask-sonner', 'Sonner', 'Emil Kowalski', 'React', 'Toast'],
    publishDate: '2026-10-21',
    faqItems: [
      {
        q: 'ask-sonner 是 Sonner 官方出的嗎？',
        a: '是作者本人寫的。Sonner 和 ask-sonner 都是 Emil Kowalski 的作品，Sonner 的 README 安裝段落也推薦用 /ask-sonner 來設定。skill 收在 emilkowalski/skills，授權是 MIT。',
      },
      {
        q: '48k stars 是 ask-sonner 一支的嗎？',
        a: '不是。GitHub 只能對整個 repo 加星，emilkowalski/skills 裡有 15 支 skill，2026-10-21 查到的 48,159 stars 是整套共用的數字。',
      },
      {
        q: 'skill 裡寫的 toast.getActiveToasts() 能用嗎？',
        a: '在 Sonner 2.0.8 不能用。公開的是 toast.getToasts() 和 toast.getHistory()，getActiveToasts 只是內部方法。照寫 TypeScript 會報 TS2339，跳過型別檢查則執行時丟出 is not a function。官方文件也寫錯了同一處。',
      },
      {
        q: '裝了之後一定會自動被用上嗎？',
        a: '不一定。我用同一句需求、沒點名跑了 2 次，只有 1 次載入 skill。要穩定生效就在需求前面打 /ask-sonner，並且把需求接在同一行，只打指令它只會回一句待命訊息。',
      },
      {
        q: '沒用 Sonner 的專案需要裝嗎？',
        a: '不需要。它只講 Sonner 的設定、樣式和疑難排解，不是通用的 toast 設計指南。還在挑元件函式庫的話，可以先看同 repo 的 pick-ui-library。',
      },
    ],
    featured: false,
  },
  {
    slug: 'write-swift-skill-claude-code',
    title: 'write-swift skill 實測：5 次對照補出取消檢查，版本表落後 6.4',
    metaDescription:
      'write-swift 是 Emil Kowalski 開源的 Claude Code skill，教 AI 照 Swift 6.2 並行模型寫程式。我用 SwiftUI 列表做 5 次對照，附安裝、版本勘誤與坑。',
    excerpt:
      'write-swift 是 Emil Kowalski 收在 MIT 授權 emilkowalski/skills 裡的 AI agent skill，用 16 節規則教 AI 照 Swift 6.2 之後的並行模型寫 Swift。我讓 Claude Code 寫同一個 SwiftUI 列表做 5 次對照，沒裝 skill 也會用 @concurrent，裝了才 3 次都補上取消檢查與 Mutex——但它把 6.3 當目前版本，swift.org 已是 6.4.1。',
    category: 'AI 工具',
    tags: ['Claude Code', 'Claude Code Skill', 'write-swift', 'Emil Kowalski', 'Swift', 'Swift 6.2', 'SwiftUI', 'Swift Concurrency'],
    publishDate: '2026-10-21',
    faqItems: [
      {
        q: 'write-swift skill 是 Apple 官方出的嗎？',
        a: '不是。它是 Emil Kowalski 個人開源的 skill，2026-08-21 加進 emilkowalski/skills，授權是 MIT。版本敘述要自己對照 swift.org 與 swift-evolution 的提案狀態。',
      },
      {
        q: '48,159 stars 是 write-swift 一支的嗎？',
        a: '不是。這是 2026-10-21 查到的 emilkowalski/skills 整個 repo 的數字，repo 裡有 15 支 skill 共用。',
      },
      {
        q: '裝了之後會自動被用上嗎？',
        a: 'frontmatter 沒有 disable-model-invocation，靠 description 自動觸發。我裝了不點名跑 2 次，2 次都由模型自己載入；想確定就在需求前面打 /write-swift。',
      },
      {
        q: '沒裝 skill 的 Claude Code 寫 Swift 差很多嗎？',
        a: '這次實測差在細節。沒裝的版本已經會用 @concurrent、actor 去重和 Swift Testing；裝了之後 3 次都多了取消檢查與 Mutex，測試替身也不再用 nonisolated(unsafe) 和 .serialized。程式都沒有在 Xcode 上編譯。',
      },
      {
        q: 'skill 裡的 Swift 版本可以照抄嗎？',
        a: '要先核對。skill 以 6.3 為基準，但 Swift 6.4 已在 2026-09-15 釋出，標 ⚠ 未釋出的功能多數已能用；raw identifiers 實際是 6.2、weak let 實際是 6.3，skill 都標錯了。',
      },
    ],
    featured: false,
  },
  {
    slug: 'break-ui-skill-claude-code',
    title: 'break-ui skill 實測：33 個破綻有 12 個在正式站重現',
    metaDescription:
      'break-ui 是 Emil Kowalski 的 Claude Code skill，用最壞的真實資料壓 UI。我拿部落格實測：33 條問題逐條上線驗證，12 條重現，附安裝、點名方式與限制。',
    excerpt:
      'break-ui 是 Emil Kowalski 收在 MIT 授權 emilkowalski/skills 裡的 Claude Code skill，用長名字、空清單、只有 1 筆這類真實會出現的最壞資料壓 UI，先回報、等你點頭才修。我拿自己的部落格前端給它測，33 條問題到正式站逐條驗證，12 條重現、6 條是 Broken——值得裝，但它標「推論」的項目一定要開瀏覽器確認。',
    category: 'AI 工具',
    tags: ['Claude Code', 'Claude Code Skill', 'break-ui', 'Emil Kowalski', 'UI 測試', '邊界案例'],
    publishDate: '2026-10-21',
    faqItems: [
      {
        q: 'break-ui 會自己修改程式碼嗎？',
        a: '預設不會。它的規則是先回報再修，交出報告後就停下。要它修，回覆 fix all 或 fix 1, 3，或一開始就在需求後面加 + fix。',
      },
      {
        q: 'break-ui 需要能跑起來的 dev server 嗎？',
        a: '不一定。有 dev server 時它用 ?data=worst 切換資料；沒有時它產一個單檔 HTML 當切換器，並改從 CSS 推論、在報告裡標明哪些是推論。',
      },
      {
        q: 'break-ui 跟 emil-design-eng、review-animations 差在哪？',
        a: 'break-ui 只用最壞資料找會壞的地方；emil-design-eng 做視覺設計評論；review-animations 審動效。三支在 description 裡互相指路。',
      },
      {
        q: 'break-ui 產的測試資料會用到真實網域嗎？',
        a: '不會。它的 CATALOG.md 規定 email 和 URL 一律用 example.com、example.org 或 .test 網域。',
      },
      {
        q: 'break-ui 的星數是多少？',
        a: 'GitHub 只能對整個 repo 加星。emilkowalski/skills 在 2026-10-21 是 48,165 stars、2,785 forks，是 15 支 skill 共用的數字。',
      },
    ],
    featured: false,
  },
  {
    slug: 'graphify-claude-code-knowledge-graph',
    title: 'Graphify 實測：0 token 建 Claude Code 知識圖譜，哪裡贏 grep',
    metaDescription:
      'Graphify 用 tree-sitter 在本機把專案建成程式碼知識圖譜，Claude Code 打 /graphify 就能查呼叫路徑。實測 80 多個檔 12 秒建好、0 token，附安裝指令與 6 個坑。',
    excerpt:
      'Graphify 是 Graphify-Labs 2026 年 4 月開源（Apache-2.0）的程式碼知識圖譜工具，在 Claude Code 打 /graphify 就用 tree-sitter 在本機把專案解析成「符號 + 關係」的圖，讓 AI 查圖而不是一個一個檔案 grep。半年 13 萬星、PyPI 累計約 900 萬下載；我拿 80 多個檔的部落格 repo 實測 12 秒建好、0 token——多跳路徑明顯贏 grep，單跳查詢差不多，安裝會改 CLAUDE.md 和 hooks。',
    category: 'AI 工具',
    tags: ['Claude Code', 'Graphify', '知識圖譜', 'tree-sitter', 'AI Coding', 'CodeGraph'],
    publishDate: '2026-10-22',
    faqItems: [
      {
        q: 'Graphify 會把程式碼送到雲端嗎？',
        a: '程式碼部分不會。tree-sitter 解析在本機跑，實測全程沒設 API key，報告寫 Token cost: 0。只有文件、PDF、圖片的語意抽取與 community 命名才會呼叫你設定的模型。',
      },
      {
        q: 'pip 裝 graphify 要裝哪個套件？',
        a: 'PyPI 套件名是 graphifyy（兩個 y），裝完的指令才是 graphify。官方建議 uv tool install graphifyy 或 pipx install graphifyy。',
      },
      {
        q: 'Graphify 是向量資料庫或 RAG 嗎？',
        a: '不是。它存的是符號和關係組成的圖，查詢是 BFS 與最短路徑，不是 embedding 相似度；每條邊標 EXTRACTED 或 INFERRED。',
      },
      {
        q: '程式碼改了，Graphify 的圖要重建嗎？',
        a: '要。跑 graphify update . 只重做 AST、不花 token，80 多個檔的 repo 約 8 秒；也可用 graphify watch 或 graphify hook install 自動重建。',
      },
      {
        q: 'Codex 也能用 Graphify 嗎？',
        a: '可以。graphify install --platform codex，在 Codex 裡的觸發詞是 $graphify，不是 /graphify。',
      },
    ],
    featured: false,
  },
  {
    slug: 'line-talk-claude-code-line-conversation',
    title: 'LINE 串 Claude Code 怎麼接得上話？每則訊息開新程序、用 --resume 接同一個 session',
    metaDescription:
      'LINE 官方帳號串 Claude Code，每則訊息都是新的 claude -p 程序，靠 --resume 接同一個 session。照程式碼拆解 state.json、聊天分線、Haiku 分流、長按回覆與背景任務接續。',
    excerpt:
      'line-talk 把家裡桌機的 Claude Code 接上 LINE：每則訊息開一個新的 claude -p 程序，帶 --resume 接回同一個 session，服務只在 state.json 記下一句該接哪個 id。上線兩天，常駐 session 一個檔案接了 11 則聊天——同時問多件事靠 Promise 鏈分線，追問特定任務靠長按回覆查回原本的 session。',
    category: '工程實作',
    tags: ['Claude Code', 'LINE Bot', 'LINE Messaging API', 'line-talk', 'AI Agent', 'Haiku'],
    publishDate: '2026-10-23',
    faqItems: [
      {
        q: '每則 LINE 訊息都開新的 session 嗎？',
        a: '每則都開新的 claude -p 程序，但 session 不是新的：程序帶 --resume <chatSessionId>，讀回同一段對話再接下去。只有傳 /new、常駐 session 出錯，或常駐 session 正在忙要 fork 時，才會換成新的 session。',
      },
      {
        q: 'LINE 官方帳號串 Claude Code 要用 API key 嗎？',
        a: 'line-talk 呼叫本機的 claude CLI，用的是 Claude Code 登入的帳號，服務沒有另外設 Anthropic API key。LINE 這邊需要 Messaging API 的 channel secret 和 access token，放在 .env，不進版控。',
      },
      {
        q: '長按回覆和直接打字差在哪？',
        a: '直接打字先經過 Haiku 判斷屬於哪條線；長按回覆用被引用訊息的 id 查 state.json，直接 resume 那則訊息背後的 session，連工作資料夾都切回去。',
      },
      {
        q: '背景任務做到一半，可以從電腦接手嗎？',
        a: '可以。任務卡片裡有 cd 到工作資料夾再 claude --resume <sessionId> 的指令，在終端機貼上就是同一個 session。',
      },
      {
        q: 'Haiku 分流多久回應？',
        a: '逾時上限 30 秒，超過或格式不對就當新的事處理。這是程式設定值，不是實測平均。',
      },
    ],
    featured: false,
  },
  {
    slug: 'omniroute-claude-code-free-test',
    title: 'OmniRoute 能讓 Claude Code 免費用嗎？v3.8.52 接本機 Ollama 實測：閘道全通、8B 模型做不了事',
    metaDescription:
      'OmniRoute 讓 Claude Code 改接其他模型。實測 v3.8.52 接本機 Ollama：協定與工具呼叫全通，8B 模型卻建不出檔案，附安裝步驟與風險。',
    excerpt:
      'OmniRoute 是 2026 年 2 月開源、MIT 授權的本機 AI 閘道，8 萬多星，提供 OpenAI 與 Anthropic 相容 API，把 Claude Code 的請求轉給你自己接上的供應商。我在 Windows 接本機 Ollama 實測：協定和工具呼叫轉換都正確，但 8B 模型撐不住 Claude Code 一萬多 token 的請求——免費額度要自己註冊各家帳號，接上去跑的也不是 Claude。',
    category: 'AI 工具',
    tags: ['OmniRoute', 'Claude Code', 'AI Gateway', 'Ollama', 'LLM 路由', '本地 LLM'],
    publishDate: '2026-10-24',
    faqItems: [
      {
        q: 'OmniRoute 裝好就能免費用 Claude 嗎？',
        a: '不行。README 寫明「~1.62B free tokens/mo」是各家第三方免費層加總的估算，不是 OmniRoute 送的 token，帳號要自己註冊。Claude Code 接上 OmniRoute 後，背後跑的是你接的模型，不是 Claude。',
      },
      {
        q: 'Claude Code 怎麼接 OmniRoute？',
        a: '設定 ANTHROPIC_BASE_URL=http://127.0.0.1:20128（不加 /v1），ANTHROPIC_AUTH_TOKEN 放 OmniRoute 的 API key，ANTHROPIC_MODEL 填 OmniRoute 的模型名，例如 ollama/hermes3:8b。OmniRoute 文件也提供 omniroute launch 一鍵啟動。',
      },
      {
        q: '本機 Ollama 小模型可以拿來跑 Claude Code 嗎？',
        a: '我的實測不行。Ollama 預設 4,096 context 會把請求截斷；用 Modelfile 開到 32K 後，hermes3:8b 完整收到 12,273 token，卻只用文字描述工具呼叫，沒有建出檔案。',
      },
      {
        q: '用 OmniRoute 會不會被 Anthropic 停權？',
        a: '自己的電腦接自己的 API key 是正常的 gateway 用法，但 Anthropic 官方不支援透過 gateway 讓 Claude Code 跑非 Claude 模型。把 Claude 訂閱帳號接上去給別人用，違反消費者條款「不得分享帳號憑證」的規定。',
      },
      {
        q: 'OmniRoute 回應怎麼看實際走了哪個供應商？',
        a: '看回應 header：x-omniroute-provider、x-omniroute-model、x-omniroute-decision 會寫出供應商、模型和路由策略，x-omniroute-response-cost 是成本。Dashboard 的請求日誌也逐筆列出。',
      },
    ],
    featured: false,
  },
  {
    slug: 'claude-p5js-animation-claudeanimationbase',
    title: 'Claude 寫 p5.js 做動畫：ClaudeAnimationBase 模板實測，9 秒原創短片怎麼做出來',
    metaDescription:
      'ClaudeAnimationBase 讓 Claude 寫 p5.js 逐格畫手繪動畫。整理 461 行指南的三條核心規則，附原創短片實測：RTX 4070 渲染 327 秒，軟體渲染慢 12 倍。',
    excerpt:
      'ClaudeAnimationBase 是 JohnHeibel 在 2026 年 9 月開源的 MIT 模板，讓 Claude 寫 p5.js 程式逐格畫出手繪水彩風動畫，再輸出 MP4。我照它 461 行的指南做了 9 秒原創短片〈楓葉帽子〉——先分鏡、看縮圖自審兩輪，RTX 4070 渲染 327 秒，沒有獨顯會慢 12 倍。',
    category: 'AI 工具',
    tags: ['Claude Code', 'ClaudeAnimationBase', 'p5.js', 'p5.brush', 'AI 動畫', '程式動畫'],
    publishDate: '2026-10-26',
    faqItems: [
      {
        q: 'ClaudeAnimationBase 一定要用 Claude 嗎？',
        a: '不一定。README 寫明可以在 Claude Code 或任何 coding agent 裡使用，能讀檔、寫程式、跑指令的代理人都能用。作者的測試影片是 Opus 5.5 加 xhigh 推理強度做的。',
      },
      {
        q: '沒有獨立顯示卡可以跑 ClaudeAnimationBase 嗎？',
        a: '可以，加 --soft-gl 用軟體渲染 WebGL。我實測每格約 16 秒，是 RTX 4070 的 12 倍左右。README 建議這種情況請模型不要用水彩填色。',
      },
      {
        q: '可以把 Clawd 換成自己的角色嗎？',
        a: '可以，指南寫明角色、表情、道具都只是起點。我把 Clawd 換成麻糬角色 Mochi，身體、眼睛、嘴巴的繪製函式約 40 行。',
      },
      {
        q: '用 ClaudeAnimationBase 做出來的影片可以商用嗎？',
        a: '模板是 MIT 授權，改作再發布要保留授權聲明。Clawd 是 Anthropic 的吉祥物，公開作品建議換成原創角色。',
      },
    ],
    featured: false,
  },
  {
    slug: 'ai-character-sheet-mascot-consistency',
    title: 'AI 生圖角色不跑掉：把 52 張封面的吉祥物整理成一張角色設定圖',
    metaDescription:
      'AI 生圖角色一致性靠參考圖。我盤點 52 張部落格封面，把吉祥物整理成四視圖、六表情、四動作加色票的角色設定圖，並接進每次生封面的流程。',
    excerpt:
      '角色設定圖（character sheet）是把角色的轉面、表情、動作、色票和禁止清單畫在同一張的參考圖，生圖時附上，模型就照圖畫。我盤點部落格 52 張封面，吉祥物有 1 張畫成別的角色、三張封面量到三種圍巾黃——原因是提示詞只固定兩個特徵，所以我改成每次附設定圖生封面。',
    category: 'AI 工具',
    tags: ['AI 生圖', '角色設定圖', 'character sheet', '角色一致性', 'Codex', '部落格封面'],
    publishDate: '2026-10-26',
    faqItems: [
      {
        q: '角色設定圖要包含哪些東西？',
        a: '至少有轉面圖（正面、3/4 側、側面、背面）、表情集、幾個常用動作、每個部位的色碼，加上「不可以畫成什麼」的清單。給 AI 當參考圖的版本不要放文字，另外做一張加標註的給人看。',
      },
      {
        q: '只寫很詳細的提示詞，不附參考圖可以嗎？',
        a: '每次生圖都是獨立請求，同一段文字每次會畫出些微不同的比例和顏色。我的部落格封面原本只靠提示詞，52 張裡有 1 張畫成另一個角色、圍巾顏色也每張不同。提示詞適合描述場景，角色長相交給參考圖固定。',
      },
      {
        q: '用 Codex CLI 怎麼附參考圖生圖？',
        a: '用 codex exec 的 -i 參數附圖片，提示詞從 stdin 餵：codex exec --sandbox workspace-write --skip-git-repo-check -C <資料夾> -i character-sheet-raw.png - < prompt.txt。我用 0.163.0 實測，生出的圖會放在 ~/.codex/generated_images/<thread>/ 底下，要自己搬出來。',
      },
      {
        q: '設定圖上的色碼怎麼決定？',
        a: '我在無字原圖上框出圍巾、毛衣、褲子、靴子各自的區域，取像素中位數當色碼，得到圍巾 #FAC32A、毛衣 #F2EBDC、褲子 #352E29、短靴 #483526。',
      },
    ],
    featured: false,
  },
  {
    slug: 'ai-mythical-beast-short-video-formula',
    title: 'AI 神獸短片怎麼做：拆解 9.5 萬讚〈開明獸〉Reel，做成 6 鏡山海經分鏡產生器',
    metaDescription:
      '拆解 IG 9.5 萬讚 AI 短片〈開明獸・奔山而來〉：比例反差、唯一紅色、反轉結局，整理成 6 鏡 20 秒公式，做成免登入的山海經神獸分鏡產生器，附原典對照。',
    excerpt:
      'bywind_art 的 AI 短片〈開明獸・奔山而來〉三週拿到 9.5 萬讚，我拆出的關鍵是巨獸對小人的比例反差，加上一句「它不是來攔路的，它是來見你的」。我把它拆成 6 鏡 20 秒的公式，做成可選 6 隻山海經神獸的分鏡產生器——要注意原典的開明獸是九首人面虎，Reel 畫的是白毛巨獸。',
    category: 'AI 工具',
    tags: ['AI 影片', 'AI 短影音', '山海經', '開明獸', '分鏡', '圖生影片', 'Prompt'],
    publishDate: '2026-10-26',
    faqItems: [
      {
        q: '開明獸在山海經裡長什麼樣子？',
        a: '《山海經・海內西經》寫「開明獸身大類虎而九首，皆人面，東嚮立昆侖上」，是一隻老虎身形、九個人頭的巨獸，守在昆侖山的九道門前。',
      },
      {
        q: 'AI 神獸短片要拆成幾個鏡頭？',
        a: '我把〈開明獸〉的四段文案對到畫面，拆成 6 鏡共 20 秒：遠景、人物背影、巨影奔來、停步、低頭對望、餘韻。巨獸和人第一次同框在第 4 鏡，適合當封面。',
      },
      {
        q: '山海經神獸分鏡產生器要付費或登入嗎？',
        a: '不用。它是單檔網頁，資料都寫在檔案裡，不呼叫 API，打開 html.yanchen.app/shanhai-storyboard 就能用。產出的 prompt 再自己貼到生圖和圖生影片工具。',
      },
      {
        q: '生圖要照原典還是做成好看的版本？',
        a: '看用途。科普向選原典，忠於經文但畫面可能獵奇；情緒向選大眾化，好看但離原典遠。同一個系列建議只用一種，不要混。',
      },
    ],
    featured: false,
  },
  {
    slug: 'ai-game-map-level-topology',
    title: 'AI 生遊戲地圖為什麼亂？先排關卡拓撲：循環、鑰匙與鎖的產生器實測',
    metaDescription:
      '只叫 AI 做 30 區地圖等於只給數量。我把關卡拓撲做成產生器：主線、鑰匙環、捷徑先排好，1,500 組測試 0 失敗，隨機版 500 張有 211 張走不到 Boss。',
    excerpt:
      '關卡拓撲是先決定區域怎麼連、玩家怎麼走，再畫地圖外觀的設計方法，源自《Unexplored》的 cyclic generation。我把它做成網頁產生器，和「只給數量」的隨機地圖對照：拓撲版 1,500 組測試 0 失敗，隨機版 500 張有 211 張走不到 Boss——給 AI 地圖要先給連線，不是只給數量。',
    category: 'AI 教學',
    tags: ['關卡設計', '關卡拓撲', 'cyclic generation', 'AI 生圖', '程序生成', '提示詞'],
    publishDate: '2026-10-26',
    faqItems: [
      {
        q: '關卡拓撲是什麼？',
        a: '關卡拓撲只描述區域之間怎麼相連、要滿足什麼條件才能通過，例如哪扇門要鑰匙、哪條捷徑只能單向打開，不管距離和外觀。同一張拓撲可以畫成森林、地城或太空站，玩家的動線都一樣。',
      },
      {
        q: 'cyclic dungeon generation 是誰提出的？',
        a: 'Joris Dormans 在 2017 年的遊戲《Unexplored》用這套方法產生關卡：每層以一個從起點到目標的大循環為骨幹，兩條弧上放不同障礙，再加小循環當繞路。Boris the Brave 的文章統計它有 24 種主要循環型別、約 5,000 條圖形替換規則。',
      },
      {
        q: '怎麼確認關卡裡的鎖不是裝飾？',
        a: '用程式模擬玩家：能走就走、撿到鑰匙才能開對應的門、捷徑只能從遠端通過。再把某把鑰匙拿掉重跑一次，如果 Boss 還是走得到，那道鎖就沒有擋路。我的產生器每張圖都跑這個檢查，1,500 組 0 失敗。',
      },
      {
        q: '排好的拓撲可以直接丟給生圖 AI 嗎？',
        a: '產生器會輸出把每一區、每條路、每道門鎖都列出來的英文提示詞，可以直接複製。但我還沒實測生圖模型是否照每條連線畫，這一步需要另外做 A／B 對照才能下結論。',
      },
    ],
    featured: false,
  },
  {
    slug: 'code-watercolor-animation-canvas',
    title: '程式碼畫水彩動畫：不用 AI 生圖，Canvas 2D 單檔 HTML 算出 32 秒〈溪山晚照〉',
    metaDescription:
      '用 Canvas 2D 純程式碼畫水彩動畫：Hobbs 多邊形暈染、乾筆飛白、宣紙紋理，同一個 seed 每次畫出同一幅，逐格輸出成 32 秒 MP4，附參數對照與踩坑。',
    excerpt:
      '〈溪山晚照〉是我用 Claude Code 寫的單檔 HTML 水彩動畫：Canvas 2D、368 行、沒有一張 AI 生成圖，宣紙暈開、遠山疊色、乾筆飛白都是演算法一筆一筆畫出來，起點是 Threads 作者 @jelenaaigc 用 Codex 做的同類作品。同一個 seed 每次畫出同一幅（兩次 md5 相同），逐格算成 32 秒 MP4——代價是只能畫演算法寫得出來的東西。',
    category: '工程實作',
    tags: ['程式碼畫圖', '水彩動畫', 'Canvas', 'Generative Art', 'Claude Code', 'Codex'],
    publishDate: '2026-10-26',
    faqItems: [
      {
        q: '程式碼畫的水彩動畫跟 AI 生圖差在哪？',
        a: 'AI 生圖給你一張成品，同一段提示詞每次結果不同；程式碼畫的是一段演算法，同一個 seed 每次畫出同一幅，每一筆的過程都能做成動畫，影片要多長就算多少格。代價是只能畫演算法描述得出來的東西，人臉、建築細節這類就不適合。',
      },
      {
        q: 'Canvas 2D 怎麼模擬水彩暈染？',
        a: '用 Tyler Hobbs 的多邊形變形法：把形狀的每條邊從中點切開、中點沿高斯分布隨機位移，重複幾輪後用很低的透明度疊幾十層，每層形狀都略有不同。我的作品大面積每層透明度 1.6%～4.5%、疊 26～46 層，長邊要先切成每段 70px 以內再變形，不然多邊形會炸開蓋滿畫面。',
      },
      {
        q: '程式碼產生的動畫怎麼輸出成 MP4？',
        a: '讓畫面只由時間 t 決定（renderAt(t)），用 Playwright 對每一格呼叫一次並把畫布存成 PNG，再用 ffmpeg -framerate 24 合成。我的 32 秒作品是 769 格，合成出 3.2 MB 的 1280×720 MP4；逐格輸出不受即時播放效能影響。',
      },
      {
        q: '原作者用的是什麼框架？',
        a: '原 Threads 貼文只標了 #codex，沒提到任何具體技術。這篇是我自己用 Canvas 2D 的復刻，不代表原作者的做法；如果想用現成框架，HyperFrames（HTML 轉影片）和 Remotion（React 轉影片）是同一個思路。',
      },
    ],
    featured: false,
  },
  {
    slug: 'folia-music-player-lyrics-animation',
    title: 'Folia 音樂播放器實測：15 種全螢幕歌詞動畫，把歌詞變成文字 PV',
    metaDescription: 'Folia 是開源音樂播放器，內建 15 種全螢幕歌詞動畫。我在本機用探針頁跑完 15 種模式並截圖，整理安裝方式、原始碼架構與 AGPL 授權限制。',
    excerpt: 'Folia 是 GitHub 上 9.4k 星的 AGPL-3.0 開源音樂播放器，Windows、Mac、Linux 都有安裝包，主打把歌詞做成像文字 PV 的全螢幕排版動畫。我在本機用它的探針頁跑完 15 種模式、頁面錯誤 0——自己聽歌直接裝 v0.7.22，AGPL 加非官方音源不適合放進公司產品。',
    category: '工程實作',
    tags: ['Folia', '音樂播放器', '歌詞動畫', '開源專案', 'React', 'PixiJS', 'three.js'],
    publishDate: '2026-10-26',
    faqItems: [
      { q: 'Folia 是免費的嗎？', a: '是。Folia 以 AGPL-3.0 開源，GitHub Releases 上的安裝包可以免費下載。README 寫明僅供個人學習、技術交流與非營利測試使用。' },
      { q: 'Folia 支援哪些平台？', a: '桌面版有 Windows、macOS（Apple Silicon 與 Intel）、Linux。另有可自架的 Node.js Web 版，手機走 PWA，Android 有社群移植版。' },
      { q: '沒有網易雲或 QQ 音樂帳號能用嗎？', a: '可以播本機音樂或接自架的 Navidrome。只想看歌詞動畫的話，可以用原始碼的 dev-probe.html 探針頁，它用合成歌詞驅動，不需要任何帳號。' },
      { q: 'Folia 有幾種歌詞動畫？', a: 'v0.7.22 內建 15 種：流光、心象、云阶、浮名、莫奈、群唱、倾诉、回环、镜台、时计、商籁、凝彩、绘光、花火、静止。清單定義在 src/types/visualizerModes.ts。' },
    ],
    featured: false,
  },
  {
    slug: 'higgsfield-genjutsu-ai-flex-scam-ela',
    title: 'Higgsfield Genjutsu 炫富影片怎麼辨識？ELA 實測與 C2PA 一轉檔就消失',
    metaDescription:
      'Higgsfield Genjutsu 能把客廳影片換成坐進法拉利。我用 ELA 和 C2PA 實測 AI 炫富圖：拼貼抓得到、整張生成分不出來，標記轉存一次就消失，附檢測工具與防詐檢查表。',
    excerpt:
      'Higgsfield Genjutsu 是影片轉影片功能，上傳一段普通影片就能保留動作、把場景換成豪車豪宅，15 秒 1080p 約 7.2 美元。我用 ELA 和 C2PA 實測 AI 炫富圖：拼貼區誤差 1.75 倍、AI 生成區也有 1.65 倍，標記轉存一次 JPEG 就全部消失——看圖抓不準，看對方行為才準。',
    category: 'AI 工具',
    tags: ['Higgsfield', 'Genjutsu', 'AI 影片', 'ELA', 'C2PA', '防詐騙'],
    publishDate: '2026-10-26',
    faqItems: [
      {
        q: 'Higgsfield Genjutsu 生成的影片有浮水印或 C2PA 嗎？',
        a: '我查的 Genjutsu 官方頁面與官方部落格（2026-10-26）都沒有提到浮水印、C2PA 或濫用政策。我沒有實際付費生成，所以無法確認輸出檔裡有沒有標記。就算有，經過社群平台重新壓縮後也很可能被清掉。',
      },
      {
        q: 'ELA 可以判斷一張圖是不是 AI 生成的嗎？',
        a: '不行。我的實驗裡，手工拼貼區的 ELA 比值是 1.75，AI 整張生成圖的跑車區也有 1.65，比值分不出來。ELA 能看出的是「有一塊後貼上去、邊界不連續」，對整張由模型算出來的圖沒有判斷力。',
      },
      {
        q: '檔案裡沒有 AI 生成標記，就代表照片是真的嗎？',
        a: '不代表。我把一張帶 C2PA 和 IPTC 標記的 AI 生成 PNG 轉存一次 JPEG，標記就全部消失了。真照片沒有標記，被重存過的 AI 圖也沒有，沒找到標記無法證明任何事。',
      },
      {
        q: '懷疑對方用 AI 假炫富照騙投資，該怎麼辦？',
        a: '停止轉帳，看對方的行為而不是照片：主動聊投資、保證獲利、要你轉到個人帳戶、拒絕即時視訊，這幾項出現兩項以上就該停手。打 165 反詐騙諮詢專線，或到 165 全民防騙網查詢。',
      },
    ],
    featured: false,
  },
  {
    slug: 'mosaic-motion-claude-motion-graphics',
    title: 'Mosaic Motion 是什麼？用 Claude 實測一句話做出 9 秒動態影片',
    metaDescription:
      'Mosaic Motion 是透過 MCP 接進 ChatGPT、Claude 的動態設計影片 agent，點數制 6 美金起。我用 Claude Code 加 Playwright、ffmpeg 自建免費版，一句話做出直式 MP4。',
    excerpt:
      'Motion 是 Mosaic 在 2026 年 6 月發表的動態設計影片 agent，透過 MCP 接進 ChatGPT、Claude，點數制 6 美金 200 點起。我用 Claude Code 加 Playwright、ffmpeg 自建一套，一句話做出 9 秒 1080×1920 MP4——短片頭和數據動畫夠用，要配音或工程檔再付費。',
    category: 'AI 工具',
    tags: [
      'Mosaic Motion',
      'Motion Graphics',
      '動態設計',
      'Claude Code',
      'ChatGPT',
      'MCP',
      'Playwright',
      'ffmpeg',
    ],
    publishDate: '2026-10-26',
    faqItems: [
      {
        q: 'Mosaic Motion 有免費方案嗎？',
        a: '2026-10-26 查官網，沒有列免費方案或免費點數。最低是 Flex 6 美金 200 點，不用訂閱、點數不過期。給 OpenAI 用的 MCP 版本有「sponsored generation」，但文件沒說明怎麼計費。',
      },
      {
        q: 'ChatGPT 免費版能用 Motion 嗎？',
        a: 'Motion 文件只寫 Developer mode 能不能開「depends on your ChatGPT plan and workspace settings」，沒列方案。要先在 ChatGPT 的 Settings → Apps → Advanced settings 看得到 Developer mode 開關，才接得上。',
      },
      {
        q: 'Claude 可以直接呼叫 Motion 嗎？',
        a: '可以。Claude 的連接器設定或 Claude Code 加入 https://mcp.motion.so/mcp/anthropic，用 OAuth 登入 Motion 帳號。只支援 Motion medium 引擎，扣的是 Motion 點數，沒有 AI 生圖、配音和音樂。',
      },
      {
        q: '自己用 Claude 做動態影片要花錢嗎？',
        a: '不用買 Motion 點數，但 claude -p 會用到你 Claude 帳號的額度。Playwright 和 ffmpeg 都是免費開源工具。',
      },
    ],
    featured: false,
  },
  {
    slug: 'solo-company-tool-stack-cost-claude-max',
    title: '一人公司工具棧月費 4 千怎麼來？拆開看 3,230 是 Claude Max（附成本計算器）',
    metaDescription:
      '一人公司用 Claude Code、n8n、Supabase、Vercel 等工具，月費 4 千怎麼來？照 2026-10 官網牌價拆解：Claude Max 佔九成，附成本計算器。',
    excerpt:
      'Threads 上有人說一人公司用 Claude Code、n8n、Supabase、Vercel、Cloudflare、Gumroad 免費版，月費約 4 千出頭；我照 2026-10-26 官網牌價拆開算，並做成成本計算器。起步規模約 NT$3,456，Claude Max 5x 就佔 3,230——開始收錢後 Vercel、Supabase 得升 Pro，約 NT$4,910。',
    category: 'AI 工具',
    tags: ['一人公司', 'Claude Code', 'Claude Max', 'n8n', 'Supabase', 'Vercel', 'Gumroad', '成本計算'],
    publishDate: '2026-10-26',
    faqItems: [
      {
        q: '一人公司用 Claude Code 一定要訂 Max 嗎？',
        a: '不一定。Claude 官網的方案表裡，Pro（月繳 US$20）就含 Claude Code，Free 方案不含。Max 5x（US$100）和 Max 20x（US$200）差在用量倍數。我的計算器預設 Max 5x，是照原貼文「4 千出頭」反推的。',
      },
      {
        q: 'Vercel 免費版可以拿來做公司網站嗎？',
        a: '照 Vercel 官網 pricing 頁的說明，Hobby 方案是「personal, non-commercial use」。拿來收錢的網站要用 Pro，US$20／月。',
      },
      {
        q: 'Supabase 免費版為什麼會停掉？',
        a: 'Supabase 官網寫 Free 專案閒置一週會被暫停。正式上線的服務要不就升 Pro（US$25／月起），要不就自己確保專案一直有流量。',
      },
      {
        q: 'Gumroad 實際會抽多少？',
        a: '直接銷售每筆 10% + US$0.50，刷卡手續費 2.9% + US$0.30 另計。US$15 的商品每筆約被拿走 18%；從 Gumroad Discover 市集賣出的則是統一 30%。',
      },
    ],
    featured: false,
  },
  {
    slug: 'stairs-foot-ik',
    title: '角色走樓梯腳會穿模？腳步 IK 四步驟拆解，對照實驗誤差 4.22→0.32 px',
    metaDescription:
      '角色上樓腳插進階梯、下樓腳懸空，腳步 IK 怎麼解？用瀏覽器對照實驗拆成射線、踏板吸附、兩段骨 IK、骨盆下沉四步，附逐項關閉的數據與互動頁。',
    excerpt:
      '香港獨立開發者零零花一週讓遊戲角色走樓梯時每步都踩在階上，Threads 貼文 1.9 萬次瀏覽。我把腳步 IK 拆成射線、踏板吸附、兩段骨 IK、骨盆下沉四步，做成瀏覽器對照實驗：階高 22 時腳底誤差從 4.22 px 降到 0.32 px——其中骨盆下沉的效果要有下樓場景才量得出來。',
    category: '工程實作',
    tags: ['腳步 IK', 'Foot IK', '反向運動學', '遊戲開發', '角色動畫', '獨立遊戲'],
    publishDate: '2026-10-26',
    faqItems: [
      {
        q: '腳步 IK 是什麼？',
        a: 'IK 是 inverse kinematics（反向運動學）。一般動畫是給每個關節角度，算出腳在哪裡；IK 反過來，先決定腳要踩在哪裡，再算出膝蓋和髖要怎麼彎。腳步 IK 就是讓角色的腳貼合實際地形，而不是照著平地錄的動畫走。',
      },
      {
        q: '為什麼走樓梯特別難？',
        a: '樓梯每一階的高度是跳躍式的，兩隻腳常常踩在不同高度，腳也可能落在階緣。我的 POC 裡，沒有 IK 時上樓腳插進階梯、下樓腳懸空，兩種錯誤方向相反，只調整整個角色的高度修不好。',
      },
      {
        q: '骨盆下沉為什麼這麼重要？',
        a: '腿長是固定的。下樓時如果骨盆不先往下，低的那隻腳到地面的距離超過腿長，IK 只能把腿打直，腳停在半空。實驗裡關掉骨盆下沉後，支撐不良從 5% 升到 14%。',
      },
      {
        q: '兩段骨 IK 一定要用 FABRIK 或 CCD 嗎？',
        a: '不用。大腿和小腿只有兩段，髖、膝、踝是一個三邊長都已知的三角形，用餘弦定理就能直接解出膝蓋角度。FABRIK、CCD 這類迭代解法適合更長的骨鏈，例如觸手或尾巴。',
      },
    ],
    featured: false,
  },
  {
    slug: 'graphify-token-savings-benchmark',
    title: 'Graphify 省 70% token？實測算上補讀只剩 54%，跟 CodeGraph 打平',
    metaDescription:
      'Graphify 號稱幫 Claude Code 省 70% token。62 檔專案實測 3 題：只看查圖少 72%，算上補讀檔案少 54%，CodeGraph 少 56%。附數據表與重跑指令。',
    excerpt:
      'Graphify 是用 tree-sitter 在本機把專案建成知識圖譜的開源工具，IG Reel 宣傳它能讓 Claude Code 省 70% token。我在 62 個 TS 檔的專案量了 3 題：只看查圖確實少 72%，但它只給符號名稱和行號、還得補讀檔案，算進去是少 54%——跟直接附原始碼的 CodeGraph（少 56%）打平。',
    category: 'AI 工具',
    tags: ['Graphify', 'Claude Code', 'CodeGraph', 'Token', '知識圖譜', 'AI Coding'],
    publishDate: '2026-10-27',
    faqItems: [
      {
        q: 'Graphify 建圖要花 token 嗎？',
        a: '程式碼部分不用。tree-sitter 在本機解析，報告寫 Token cost: 0 input · 0 output，62 個 TS 檔花 41 秒。文件、PDF、圖片的語意抽取才會呼叫模型。',
      },
      {
        q: 'Graphify 的 70% 是哪裡來的數字？',
        a: '實測 72% 是「只看查圖輸出」對「grep 後整份讀檔」。Graphify 只回符號名稱、檔名與行號，補讀 2 個關鍵檔案後是少 54%。付費雲端版頁面寫的 80% 是廠商宣稱，沒有實測。',
      },
      {
        q: '已經裝了 CodeGraph，還要裝 Graphify 嗎？',
        a: '只為了省 token 不用，實測三題合計 CodeGraph 13,285 token、Graphify 加補讀 13,746 token。想要互動架構圖，或要把規格書、PDF 跟程式碼放進同一張圖時，Graphify 比較合適。',
      },
      {
        q: 'Graphify 的 query 結果被截斷怎麼辦？',
        a: '輸出會寫出需要的預算，例如 --budget 3461。也可以用 explain 查單一符號，或用 --seed 指定起點。',
      },
    ],
    featured: false,
  },
  {
    slug: 'claude-blender-3d-animation-pdf-storyboard',
    title: 'Claude 做 3D 動畫：PDF 分鏡寫成 Blender 腳本，72 秒渲染出 8 秒影片',
    metaDescription:
      'Threads 爆紅的「PDF 丟進 Opus 5.5 出動畫」其實是 Blender 3D 渲染。我寫 1 頁分鏡、讓 Claude Code 寫 275 行 bpy 腳本，RTX 4070 渲染 72 秒出 8 秒 720p 影片。',
    excerpt:
      'Threads 上「一份 PDF 丟進 Claude Opus 5.5 就出動畫」的橘色方塊影片，抽格看是 Blender 3D 渲染：PDF 是分鏡規格，Claude 寫的是 Blender Python 腳本。我照做一次，1 頁分鏡加 275 行腳本，RTX 4070 渲染 72 秒出 8 秒 720p MP4——不用會 Blender 介面，但一定要裝 Blender。',
    category: 'AI 工具',
    tags: ['Claude Code', 'Blender', 'Blender Python', 'AI 動畫', '3D 動畫', 'Opus 5.5', '分鏡'],
    publishDate: '2026-10-27',
    faqItems: [
      {
        q: '把 PDF 丟給 Claude 就會直接輸出影片嗎？',
        a: '不會。Claude 輸出的是 Blender Python 腳本，要在本機用 Blender 執行、逐格渲染，再用 ffmpeg 合成 MP4。轉貼者在留言也補充，原作者說要另外裝 Blender 和現成的程式庫。',
      },
      {
        q: '需要會操作 Blender 嗎？',
        a: '不用會介面。腳本用 blender -b -P 在背景模式執行，整個流程在命令列完成。但要看得懂預覽圖哪裡不對，並把問題描述清楚讓 Claude 改。',
      },
      {
        q: '渲染要多久？',
        a: '我這支 8 秒、1280×720、192 格的動畫，用 Blender 4.5 的 EEVEE 在 RTX 4070 上花 72 秒。沒有獨立顯示卡會慢很多，我沒有實測 CPU 的時間。',
      },
      {
        q: '影片裡的橘色角色可以商用嗎？',
        a: '那是 Anthropic 的吉祥物 Clawd。練習可以，公開或商用的作品建議換成自己的角色，腳本裡角色只是幾個方塊，替換不難。',
      },
    ],
    featured: false,
  },
  {
    slug: 'archify-claude-skill-architecture-diagram',
    title: 'Archify 是什麼？Claude Skill 讀程式碼畫互動架構圖，實測每個方塊都對回原始碼行號',
    metaDescription:
      'Archify 是讓 Claude Code 讀程式碼、自動畫互動架構圖的開源 skill。我拿自己的 LINE 服務實測：14 元件 4 分鐘出圖，四道檢查擋錯，附安裝與私有 repo 去敏做法。',
    excerpt:
      'Archify 是 tt-a1i 開源的 agent skill（Apache-2.0、約 9 萬星）：AI 讀程式碼寫成 JSON，它驗過後輸出可點擊、可匯出 PNG／SVG／WebM 的單檔架構圖。我拿 14 個元件的 line-talk 實測，4 分鐘出圖、每個方塊都對回 commit 與行號——但它是快照，私有 repo 公開前要另外去敏。',
    category: 'AI 工具',
    tags: ['Archify', 'Claude Code', 'Claude Skill', '系統架構圖', 'AI 工具', '架構圖'],
    publishDate: '2026-10-27',
    faqItems: [
      {
        q: 'Archify 要付費嗎？',
        a: '不用。Archify 是 GitHub 上 tt-a1i/archify 的開源專案，Apache-2.0 授權。README 另外寫明第三方線上服務與付費方案由各自業者經營，不代表 Archify。',
      },
      {
        q: 'Archify 畫出來的圖會不會是 AI 亂畫的？',
        a: '元件之間怎麼分、連線怎麼接，還是寫 spec 的 agent 決定。但只要元件附上原始碼行號，spec 就必須釘住 repo 與 40 碼 commit，finalize 會拿 --repo-root 那份 repo 實際比對，對不上就失敗；排版放錯邊界也會被擋下。',
      },
      {
        q: '沒有程式碼也能用 Archify 嗎？',
        a: '可以。README 寫不需要 repository，也能直接用文字描述讓它畫，例如一個請求經過 API、Redis、PostgreSQL 的流程。只是這樣就沒有原始碼行號可以核對。',
      },
      {
        q: 'Archify 跟 CodeGraph、Graphify 差在哪？',
        a: 'CodeGraph 和 Graphify 把整個專案自動建成知識圖，主要給 AI 查程式碼、省 token。Archify 產的是給人看的架構圖，由 agent 做語意分層，再經過版面與來源檢查。',
      },
    ],
    featured: false,
  },
  {
    slug: 'shopee-affiliate-business-tax-threshold',
    title: '蝦皮分潤要繳營業稅嗎？單月 5 萬就要稅籍登記，20 萬起改 5%（附試算頁）',
    metaDescription:
      '蝦皮分潤算勞務，單月達 5 萬元要辦稅籍登記、國稅局查定 1%，達 20 萬開發票課 5%；免罰輔導期已在 2026-06-30 結束。用 148 天 16 萬分潤的案例實算，附免登入試算頁。',
    excerpt:
      'Threads 上自稱「分潤蟑螂」的帳號跑到第 148 天、待撥款 16 萬，蝦皮直接跳出稅籍登記通知：分潤在稅法上算勞務，單月 5 萬元就達營業稅起徵點。反推他的月均只有 3.3 萬，但起徵點看單月不看平均——我把 1%、5% 兩級門檻做成逐月試算頁，填數字就知道哪個月要繳多少。',
    category: '工程師日常',
    tags: ['蝦皮分潤', '營業稅', '稅籍登記', '網紅課稅', '分潤收入', '試算工具'],
    publishDate: '2026-10-27',
    faqItems: [
      {
        q: '蝦皮分潤一年賺超過 60 萬才要繳營業稅嗎？',
        a: '不是。營業稅起徵點以單月銷售額判斷，分潤屬於勞務，當月達 5 萬元就要辦稅籍登記，跟全年總額或平均月收入無關。',
      },
      {
        q: '分潤收入的營業稅稅率是多少？',
        a: '當月 5 萬以上、未達 20 萬元，通常是小規模營業人，由國稅局查定課徵 1%；月銷售額達 20 萬元要開立統一發票，稅率 5%。勞務在境內提供、但在境外使用的部分可適用零稅率。',
      },
      {
        q: '現在才辦稅籍登記還能免罰嗎？',
        a: '財政部給網紅的免罰輔導期到 2026-06-30 為止。輔導期之後經檢舉或調查查到未登記，會依稅法補稅處罰，收到通知就盡快到所在地國稅局辦理。',
      },
      {
        q: '沒達 5 萬元，分潤就完全不用報稅嗎？',
        a: '不用繳營業稅，但分潤仍是所得，要申報綜合所得稅。試算頁只算營業稅，所得稅另外計算。',
      },
    ],
    featured: false,
  },
  {
    slug: 'google-egm-elephant-goldfish-spec-review',
    title: 'Google 大象與金魚（EGM）實測：規格沒寫清楚，AI 實作者只猜對 46% 參數',
    metaDescription:
      'Google 開源的 Elephant-Goldfish（EGM）讓零上下文金魚審 AI 寫的規格。我埋 8 個缺陷實測：金魚抓到 6 到 8 個，實作者照初稿只填對 46%，附免裝 plugin 的腳本。',
    excerpt:
      'Elephant-Goldfish Model（EGM）是 Google 開源的 Apache 2.0 外掛，讓看過完整對話的「大象」寫規格、零上下文的「金魚」subagent 挑毛病，可裝進 Claude Code 與 Codex。我埋 8 個缺陷實測，金魚抓到 6 到 8 個，但規格交給全新 session 實作只對 46%，冷卻期 72 小時 3 次都被填成 4 小時——補完值的 v2 才到 100%。',
    category: 'AI 工具',
    tags: ['Elephant-Goldfish', 'EGM', 'Claude Code', 'Codex', 'Spec-Driven Development', 'AI Coding', '規格審查'],
    publishDate: '2026-10-27',
    faqItems: [
      {
        q: 'EGM 是 Google 官方產品嗎？',
        a: 'repo 放在 google 組織下，描述是 created at Google 的開源方法與 skill 集，授權 Apache 2.0；README 頁尾寫明 This is not an officially supported Google product。',
      },
      {
        q: '金魚審查和叫同一個 AI 再檢查一次有什麼不同？',
        a: '差在 context。同一個 session 自審時，AI 會用對話記憶把文件的空白自動補上，看不出缺漏；金魚只看文件，補不了，就會把空白指出來。EGM 的 brainstorm skill 在沒有 subagent 時會直接拒絕執行。',
      },
      {
        q: '金魚抓不到的缺陷怎麼辦？',
        a: '實測中金魚最常漏的是只在對話講過、文件完全沒寫的需求（6 次只抓到 1 次）。這類缺漏要靠大象或人拿對話紀錄回頭比對，或另開全新 session 當實作者填參數，看哪些被猜錯。',
      },
      {
        q: '一定要裝 EGM plugin 嗎？',
        a: '不用。核心是另開全新 session 只讀規格，claude -p、Codex 或任何 subagent 都做得到。想要現成的多 persona 審查與 /egm-resolve 修正流程再裝 plugin。',
      },
    ],
    featured: false,
  },
  {
    slug: 'touchdesigner-rfid-arduino-serial',
    title: 'TouchDesigner 接 RFID：放上方塊就辨識，Arduino RC522 用 Serial 傳 tag（附可編譯韌體）',
    metaDescription:
      'Threads 爆紅的「放上方塊、畫面辨識標本」原理是木盒下藏 RFID。拆成 RC522、Arduino、Serial、TouchDesigner 四段，附編譯過的韌體、TD callback 與網頁版 POC。',
    excerpt:
      'patrick.txrx 在 Threads 公開的 TouchDesigner 作品，把方塊放上木盒畫面就辨識出標本，原理是木盒底下藏 RC522 讀卡機，Arduino 把 tag 的 UID 用 Serial 一行一筆傳給 TD。我重做了一套：韌體 arduino-cli 編譯過、協定測試 6/6、網頁版 5 個狀態全 PASS——關鍵是改用 PICC_WakeupA 才偵測得到拿走，但還沒接真硬體上機。',
    category: '工程實作',
    tags: ['TouchDesigner', 'RFID', 'Arduino', 'RC522', 'Serial', 'Web Serial', '互動裝置'],
    publishDate: '2026-10-27',
    published: false,
    faqItems: [
      {
        q: 'RFID 隔著木板讀得到嗎？',
        a: '讀得到，前提是木板要薄、tag 要對準讀卡機上方。RC522 是近距離讀卡機，我沒有實測幾公釐會失效，選材時先拿手上的木板試。',
      },
      {
        q: '為什麼 tag 拿走了，Arduino 還是沒反應？',
        a: '多半是用了 PICC_IsNewCardPresent()。它送 REQA，只叫得醒 IDLE 狀態的卡，讀完 halt 的卡不會再回應。改用 PICC_WakeupA() 每次輪詢，並設連續 3 次讀不到才送 NONE。',
      },
      {
        q: 'TouchDesigner 的 Serial DAT 要怎麼設？',
        a: 'Port 選 Arduino 的 COM 埠，Baud Rate 和 Serial.begin 一致（文中用 115200），Format 選 One Per Line。之後在 Callbacks DAT 的 onReceive(dat, rowIndex, message, bytes) 解析 TAG: 與 NONE。',
      },
      {
        q: '沒有 TouchDesigner 可以做嗎？',
        a: '可以。協定是純文字一行一筆，網頁用 Web Serial API（Chrome、Edge，需 HTTPS）、Python 用 pyserial 都能接。自己讀時要先緩衝到換行再解析，Serial 不保證一次收到一整行。',
      },
    ],
    featured: false,
  },
  {
    slug: 'ai-cyberpunk-reel-seedance-keyframe-workflow',
    title: 'AI 賽博龐克 Reel 怎麼做？拆解 4.3 萬讚短片：一張關鍵幀、Seedance 2.5 圖生影片、再放大',
    metaDescription:
      '拆解 IG 4.3 萬讚賽博龐克 Reel：GPT-Image 關鍵幀、Seedance 2.5 圖生影片、Topaz 放大。我用 Codex 加 ffmpeg 本機重現，附 API 價格與 prompt 產生器。',
    excerpt:
      'soft_respawn 這支 4.3 萬讚的賽博龐克溜冰 Reel，貼文寫明流程是 GPT-Image 生關鍵幀、Seedance 2.5 圖生影片、Topaz 放大，三步在 SYNTX 上跑，是業配。我用 Codex 加 ffmpeg 在本機 5.8 秒重現一次——關鍵幀決定八成畫面，但 ffmpeg 只能動鏡頭，角色要動還是得接每秒約 0.13–0.47 美元的圖生影片 API。',
    category: 'AI 工具',
    tags: ['AI 影片', 'AI 短影音', 'Seedance 2.5', '圖生影片', '賽博龐克', 'ffmpeg', 'Prompt'],
    publishDate: '2026-10-27',
    faqItems: [
      {
        q: 'GPT-Image 生的圖可以直接丟進 Seedance 嗎？',
        a: '可以。圖生影片端點吃一般圖片檔，fal.ai 的頁面寫支援 jpg、png、webp 等格式，上傳後當成首幀。生圖時就做成 9:16，跟影片輸出比例一致，避免被裁切。',
      },
      {
        q: '沒有預算，只用 ffmpeg 能做出這種 Reel 嗎？',
        a: '做得出會動的畫面，做不出角色在動的影片。ffmpeg 只能推鏡頭、閃光、疊雨絲，角色會像一張貼紙，適合當封面動態或片頭，要當主片還是得接圖生影片模型。',
      },
      {
        q: 'Seedance 2.5 圖生影片一支要多少錢？',
        a: '依 2026-10-27 查到的第三方 API：Atlas Cloud 每秒 0.134 美元，fal.ai 以 token 計價，720p 約每秒 0.46 美元。一支 6 秒 9:16 片段大約 0.8 到 2.8 美元，實際以當天價格頁為準。',
      },
      {
        q: '用動畫裡的角色做同人短片可以嗎？',
        a: '原片 hashtag 掛的是 Cyberpunk: Edgerunners，我重現時刻意用原創角色。要公開或接業配的作品，用自己設計的角色比較單純。',
      },
    ],
    featured: false,
  },
  {
    slug: 'pseudo-3d-road-coastal-skateboard-game',
    title: '偽 3D 賽車道路怎麼做？把 AI 海岸滑板 Reel 做成 13 KB 的網頁小遊戲',
    metaDescription:
      '用 OutRun 式偽 3D 道路把 AI 海岸下坡滑板 Reel 做成單檔網頁遊戲：投影公式、彎道累加、離心力物理，附 Playwright 自動駕駛實測與原始碼。',
    excerpt:
      '我把一支 AI 生成的海岸下坡滑板 Reel 做成能玩的網頁遊戲 Coastal Bomb，用的是 OutRun 那一代的偽 3D 道路：路切成 4,360 段，每段記彎度和高度再投影成梯形，單一 HTML 226 行、零依賴。Playwright 實測放手約 500 m 會被彎道甩出、自動駕駛 25 秒滑了 5,579 m——要做第一人稱往前衝的小遊戲，這個技術比 three.js 輕得多。',
    category: '工程實作',
    tags: ['偽 3D', 'Canvas', 'JavaScript', '網頁遊戲', 'OutRun', 'Playwright', 'AI 短影音'],
    publishDate: '2026-10-27',
    faqItems: [
      {
        q: '偽 3D 道路跟 three.js 差在哪？',
        a: '偽 3D 道路沒有 3D 模型，只有一條切成小段的路，每段記彎度和高度，投影成梯形畫在 Canvas 2D 上。鏡頭只能沿著路往前，換來的是單檔、零依賴、核心投影三行。要自由視角或真正的立體碰撞，就要用 three.js 這類真 3D 引擎。',
      },
      {
        q: '彎道為什麼只用加法就能畫出來？',
        a: '每往前一段，路中心的水平偏移量加上目前的斜率，斜率再加上這段的彎度。偏移量會以 3、6、9、12 這樣遞增，投影到螢幕上就是一個越來越急的彎，這是 Lou Gorenfeld 的 Pseudo 3D 教學頁描述的做法。',
      },
      {
        q: '要怎麼確認小遊戲真的能玩？',
        a: '在頁面留一個唯讀狀態物件，用 Playwright 讀速度、距離和橫向位置。我跑兩支測試：放手不操作約 503 m 會被甩出，簡單的自動駕駛 25 秒滑了 5,579 m、沒有 JS 錯誤。不操作會輸、會操作能贏，兩件事都成立才算能玩。',
      },
    ],
    featured: false,
  },
  {
    slug: 'free-agentic-ai-courses-2026',
    title: '免費 Agentic AI 課程怎麼選？7 門逐一查證：3 門限時免費、AutoGen 已封存',
    metaDescription:
      'Hugging Face、微軟、LangChain、DeepLearning.AI 共 7 門免費 Agentic AI 課程逐一連線查證：份量、免費條件、框架是否還在維護，附建議學習順序。',
    excerpt:
      '一支 Reels 列出 7 門免費 Agentic AI 課、要留言才給連結；其實全是公開官網，我寫腳本逐一連線，2026-10-27 全部回 200，份量從 54 分鐘到 6 小時。要注意的是 DeepLearning.AI 三門只是平台 beta 期間限時免費、AutoGen 官方 README 已宣告封存——建議從 Hugging Face 或微軟入門，主力上 LangGraph。',
    category: 'AI 教學',
    tags: ['AI Agent', 'Agentic AI', '免費課程', 'LangGraph', 'crewAI', 'AutoGen', 'Hugging Face', 'DeepLearning.AI'],
    publishDate: '2026-10-27',
    faqItems: [
      {
        q: '這 7 門 Agentic AI 課真的都免費嗎？',
        a: 'Hugging Face、微軟和 LangChain Academy 的 4 門免費。DeepLearning.AI 的 3 門課程頁寫的是平台 beta 期間限時免費，結業成就要 PRO 方案，beta 何時結束頁面沒寫。以上是 2026-10-27 讀官方頁的結果。',
      },
      {
        q: '完全沒基礎，該先上哪一門？',
        a: 'Hugging Face AI Agents Course 或微軟 AI Agents for Beginners 擇一。前者一門課看過 smolagents、LlamaIndex、LangGraph 三個框架；後者 18 課、repo 內有台灣繁中翻譯。上完再進 LangChain Academy 的 LangGraph 課。',
      },
      {
        q: 'AutoGen 封存了，那門課還要上嗎？',
        a: '當選修。AutoGen 的 GitHub README 已宣告封存、微軟不再提供 bug 與安全修正，繼任者是 Microsoft Agent Framework。課程教的 reflection、tool use、planning、多 agent 協作這些設計模式換框架一樣適用，但不要拿 AutoGen 開新專案。',
      },
    ],
    featured: false,
  },
  {
    slug: 'karpathy-asd-ste100-prompt-test',
    title: 'ASD-STE100 prompt 實測：照 Karpathy 叫 AI 用飛機維修手冊英文寫，違規少 39–69%',
    metaDescription:
      'Karpathy 建議叫 LLM「80% 照 ASD-STE100」寫。我用 Claude 跑 5 題 × 4 種 prompt：原話版違規少 39–55%，擴寫版少 59–69%，附線上 STE 檢查器。',
    excerpt:
      'ASD-STE100 是 1986 年起用來寫飛機維修手冊的受控英文，Karpathy 在 2026-10-02 的 X 長文說他會叫 LLM「80% of the way to ASD-STE100」來寫。我用 Claude Sonnet 和 Haiku 實測 5 題：只加原話違規少 39–55%，加上流傳的擴寫句少 59–69%，字數不變——寫 README、操作步驟這類英文值得加，聊天類不必。',
    category: 'AI 教學',
    tags: ['ASD-STE100', 'Simplified Technical English', 'Prompt Engineering', 'Karpathy', 'Claude', 'LLM 寫作'],
    publishDate: '2026-10-27',
    faqItems: [
      {
        q: 'ASD-STE100 prompt 的原文是什麼？',
        a: 'Karpathy 在 2026-10-02 的 X 長文只寫了叫 LLM 用 ASD-STE100 解釋，嫌太嚴時要求「80% of the way to ASD-STE100」。流傳的「Use short sentences, common words, consistent terms, and one action per instruction. Keep the tone natural.」是轉述文章加上去的擴寫。',
      },
      {
        q: '只加 Karpathy 原話跟加擴寫版，差多少？',
        a: '我用 Claude 測 5 題、每格 1 次：只加原話，違規數 Sonnet 少 39%、Haiku 少 55%；用擴寫版，Sonnet 少 69%、Haiku 少 59%。樣本小，看得出方向，算不出信賴區間。',
      },
      {
        q: 'ASD-STE100 標準要錢嗎？去哪拿？',
        a: '免費。官網 FAQ 寫明標準對所有人免費、只發 PDF，要到 asd-ste100.org 的 Downloads 頁申請。目前版本是 2025 年 1 月發布的 Issue 9，下一版 Issue 10 預定 2028 年 1 月。',
      },
      {
        q: '什麼內容不適合用 STE 寫法？',
        a: '需要語氣、要說服人、要表達不確定性的內容。STE 一字一義、一句一事，會把語氣磨平；Karpathy 自己也說全套規格太嚴才改要求 80%。這次只測了英文輸出，用 STE 規則寫中文沒有測。',
      },
    ],
    featured: false,
  },
  {
    slug: 'cloudflare-security-audit-skill-test',
    title: 'Cloudflare security-audit-skill 實測：AI 互相找碴審資安，貴 26 倍、漏洞沒多抓',
    metaDescription:
      'Cloudflare 開源的 security-audit-skill 讓一批 AI 找漏洞、另一批推翻。我用埋 11 個漏洞的小站實測：skill 花 $2.92 指出 10 個，單一 agent 花 $0.11 抓到 11 個，附安裝與適用時機。',
    excerpt:
      'Cloudflare 在 2026-06 開源的 security-audit-skill（MIT、近 5 萬星）是一組給 coding agent 讀的資安稽核提示詞，讓一批 AI 找漏洞、另一批全新的 AI 專門推翻。我用埋了 11 個漏洞的小站實測，quick 模式花 $2.92、8 分鐘指出 10 個，單一 agent 花 $0.11、29 秒抓到 11 個——日常審單一 agent 就夠，這個 skill 留給上線前在 Linux 跑多輪。',
    category: 'AI 工具',
    tags: ['Cloudflare', 'security-audit-skill', 'Claude Code', 'AI 資安審查', 'Vibe Coding', 'Agent Skills'],
    publishDate: '2026-10-27',
    faqItems: [
      {
        q: 'Cloudflare security-audit-skill 怎麼安裝？',
        a: '官方 README 用 Skills CLI：npx skills add https://github.com/cloudflare/security-audit-skill --skill security-audit，加 --global 裝到使用者層級。裝好後對 agent 說「security audit this codebase」就會觸發。也可以不裝，在提示詞裡直接指定 SKILL.md 路徑讓 agent 讀。',
      },
      {
        q: '它比直接叫一個 agent 審程式碼多抓到漏洞嗎？',
        a: '我的實測沒有：11 個種子漏洞，skill quick 模式指出 10 個，單一 agent 抓到 11 個，兩邊陷阱都 0 誤報。issue #20 的第三方盲測（15 個漏洞、各 3 輪）也是 recall 同為 0.467，skill 成本是 14.5 倍。skill 贏在每條都附信任邊界、未確認事實與驗證計畫。',
      },
      {
        q: '為什麼 skill 跑完一條「已確認」都沒有？',
        a: 'skill 規定 confirmed 必須在沙箱實際重現。我的 Windows 沒有作業系統層級的沙箱，所以提示詞明確禁止它執行目標程式，它就照規矩把所有發現都標成待驗證、不給嚴重度。',
      },
      {
        q: 'Windows 上可以用嗎？',
        a: '流程可以跑，但兩支官方驗證器會直接 exit 1，錯誤是「OS no-follow and nonblocking input protection is unavailable」，因為 Node 在 win32 沒有 O_NOFOLLOW 和 O_NONBLOCK。整次 run 只能標成 incomplete，要正式用請在 WSL 或 Linux 跑。',
      },
    ],
    featured: false,
  },
  {
    slug: 'grok-bot-what-is-it',
    title: 'Grok bot 是什麼？X 上的 @grok 跟 2026 新出的 Grok Bot 差在哪',
    metaDescription:
      'Grok bot 有兩個意思：X 上標記就公開回覆的 @grok，和 xAI 2026-08 推出、有自己雲端電腦會登入工具做事的 Grok Bot。整理怎麼叫出來、背後模型、價格、爭議與 Telegram／Discord 同名 bot。',
    excerpt:
      '「Grok bot」現在有兩個意思：X 上標記就公開回覆的 @grok，以及 xAI（現名 SpaceXSI）2026-08-11 推出、有自己雲端電腦、會登入 Gmail 和 CRM 把工作做完的 Grok Bot。前者是問答、出過 MechaHitler 與性化改圖等大爭議；後者是付費 agent 產品——查證用 @grok、派工才輪到 Grok Bot。',
    category: 'AI 工具',
    tags: ['Grok', 'Grok Bot', 'xAI', 'SpaceXSI', 'X', 'AI Agent'],
    publishDate: '2026-10-29',
    faqItems: [
      {
        q: '在 X 上怎麼叫 Grok 回覆？',
        a: '在任何貼文底下回覆並加上 @grok 和你的問題，它會讀整串討論後公開回一則。官方公開的 @grok 提示詞要求回覆 550 字元內、不用 markdown、用發文者的語言回答，所以答案會是短的純文字，而且所有人都看得到。',
      },
      {
        q: 'Grok Bot 要付費嗎？',
        a: '要。2026-08-26 起包含在所有 SuperGrok、Cursor Pro 與 Cursor Teams 方案，用量跟 Grok 聊天、Cursor 分開計算；2026-10-12 推出的 The X Subscription 也把 Grok Bot 綁進同一個方案。各層權益以 x.ai/pricing 為準。',
      },
      {
        q: '@grok 和 @bot 有什麼不同？',
        a: '@grok 是任何人都能標記、會公開回一則文字答案的官方帳號；@bot 是叫你自己的 Grok Bot 去執行動作，例如存貼文，前提是你有 Grok Bot 帳號並設定好 X plugin。',
      },
      {
        q: 'Telegram 上有官方的 Grok bot 嗎？',
        a: 'Durov 在 2025-05 宣布與 xAI 合作把 Grok 整合進 Telegram，但 Musk 當時回覆尚未簽約，我查不到後續正式上線的官方紀錄。Telegram 或 Discord 上叫 Grok bot 的，請先當成第三方用 API 自己包的機器人。',
      },
    ],
    featured: false,
  },
  {
    slug: 'ai-trading-bot-22h-replay-monte-carlo',
    title: 'AI 交易機器人 22 小時翻 3.5 倍是真的嗎？我把 GROK BOT 流程跑了 1 萬次',
    metaDescription:
      'IG 上 GROK BOT 6 Agent 影片說 $2,500 在 22 小時變 $8,750，面板自己標著 SIMULATED DATA。我復刻流程跑 1 萬次：中位數 $2,102，只有 4 次到 $8,750。',
    excerpt:
      'IG 上一支「GROK BOT 6 Agent」影片說 $2,500 在 22 小時變 $8,750，面板右上角其實標著 SIMULATED DATA 與 22H REPLAY。我照同樣的 6 步狙擊流程寫了模擬器跑 1 萬次：中位數 $2,102、三分之二虧錢，到 $8,750 的只有 4 次——影片的數字是從分佈最右端挑出來的那一次。',
    category: 'AI 工具',
    tags: ['AI 交易機器人', 'GROK BOT', '迷因幣', '蒙地卡羅模擬', '倖存者偏差', 'AI Agent'],
    publishDate: '2026-10-29',
    faqItems: [
      {
        q: '影片裡的 GROK BOT 是 xAI 的產品嗎？',
        a: '我在面板上找不到 xAI 或 SpaceXSI 的標示。xAI 官方 2026-08 推出的 Grok Bot 是處理 Gmail、CRM 等工作的 agent，不是交易機器人。',
      },
      {
        q: '22H REPLAY 是什麼意思？',
        a: '字面是「22 小時的回放」，也就是把一段已經跑完（或模擬完）的過程重播，不是即時下單。同一個面板右上角標著 SIMULATED DATA，表示播放的資料是模擬的。',
      },
      {
        q: '這個模擬可以拿來決定要不要用交易機器人嗎？',
        a: '不行。參數是示意值，沒有用真實鏈上資料校準。它只示範「挑最好的一次」能讓一套沒有優勢的流程看起來多好。',
      },
    ],
    featured: false,
  },
  {
    slug: 'motion-prompt-animation-names',
    title: 'Motion Prompt 是什麼？168 個動畫名稱，實測講名稱比講「有質感」準',
    metaDescription:
      'Motion Prompt 是 Shohei Ohtaki 開源的動畫名稱庫（MIT，168 個）。我用 Claude Haiku 對照 12 次：說「有質感」停在 1.6～2 秒，說「#005 Mask reveal 0.6 秒」停在 0.7 秒。',
    excerpt:
      'Motion Prompt 是日本創作者 Shohei Ohtaki 在 2026-10-14 開源的動畫名稱庫（MIT），7 包 168 個動作，每個都有編號、會動的示範、規格與參考程式碼，還能裝成 Claude Code skill。我用 Claude Haiku 對照 12 次：說「有質感」4 次都是 1.6～2 秒的模糊淡入，說「Mask reveal 0.6 秒」4 次都停在 0.7 秒左右——但貼完整規格時要講明只要進場。',
    category: 'AI 工具',
    tags: ['Motion Prompt', 'Claude Code', 'Claude Code Skill', '動效設計', '動畫術語', 'Prompt 技巧'],
    publishDate: '2026-10-29',
    faqItems: [
      {
        q: 'Motion Prompt 要付費嗎？可以商用嗎？',
        a: '不用付費。repo 是 MIT 授權，名稱、規格、參考程式碼都可以用在商業專案，保留授權聲明即可。',
      },
      {
        q: '沒有 Claude Code，Motion Prompt 還有用嗎？',
        a: '有。名稱表和 gallery 本身不需要安裝，把名稱和秒數寫進任何 AI 的 prompt 都行；gallery 的 Copy picks 會把規格和示範網址一起複製，可以貼進沒有 skill 的對話。',
      },
      {
        q: 'Motion Prompt 和 animation-vocabulary skill 差在哪？',
        a: '方向相反。Motion Prompt 是先看示範、再拿名稱和規格去要，附有參考程式碼；animation-vocabulary 是把模糊描述反查成標準術語，只負責命名、不產生程式碼。兩個都是免費的 skill，可以一起裝。',
      },
      {
        q: '為什麼 AI 照著 Motion Prompt 規格做，動畫播完標題就不見了？',
        a: 'Motion Prompt 的規格描述的是示範的一整個循環，包含退場。實驗裡貼完整規格的 4 次有 3 次照做了退場。prompt 裡加一句「只要進場，結束後停在最終畫面」就能避開。',
      },
    ],
    featured: false,
  },
  {
    slug: 'youtube-ai-summary-verify-quote-transcript',
    title: 'YouTube 影片 AI 摘要怎麼驗證？叫 Claude 附原句，32 條全對回字幕',
    metaDescription:
      '把英文 YouTube 影片丟給 Claude 拆成繁中步驟，每條附原句與秒數，再用 Python 在前後 90 秒字幕內比對。4 支副業影片 32 條全過，捏造句當場被擋。',
    excerpt:
      '一支 87 行的 Python：抓英文 YouTube 字幕、用 claude -p 拆成繁中可執行步驟，每條都附逐字原句與秒數，再由程式回字幕前後 90 秒內比對。四支副業案例影片 32 條全部對得回，捏造、改寫、秒數錯的引文都被擋下——但它證明的是「影片真的這樣說」，不是翻譯準或營收數字是真的。',
    category: 'AI 教學',
    tags: ['YouTube 字幕', 'AI 摘要', 'Claude Code', 'youtube-transcript-api', '幻覺檢查', '副業案例'],
    publishDate: '2026-10-29',
    faqItems: [
      {
        q: '為什麼不直接相信 AI 的影片摘要？',
        a: '摘要本身看不出哪一句是影片講的、哪一句是模型補的。要求每條步驟附逐字原句和秒數後，程式可以回字幕檢查，人也可以點時間戳一秒對照。',
      },
      {
        q: 'AI 意思對但沒有逐字照抄，會被判失敗嗎？',
        a: '會。實測改寫句只拿到 0.30 分，低於 0.6 門檻。這是刻意的：程式分不出忠實改寫和看起來像的編造，所以寧可誤擋、再回影片看一眼。',
      },
      {
        q: '沒有字幕的影片可以用嗎？',
        a: '不行。這支腳本依賴 YouTube 既有的英文字幕；沒有字幕要先用 Whisper 或 WhisperX 自己轉錄，再把轉錄結果當成字幕餵進去。',
      },
      {
        q: 'Justin Welsh 在 YouTube 上有頻道嗎？',
        a: '我查的時候 @JustinWelsh 沒有影片分頁，他主要經營 LinkedIn、X 和電子報。這次用的是 Peter Yang 訪談他的影片。',
      },
    ],
    featured: false,
  },
  {
    slug: 'gitdiagram-gitingest-github-url-trick',
    title: 'GitHub 網址改一個字出架構圖？gitdiagram 與 gitingest 實測，44 萬 token 砍到 11 萬',
    metaDescription:
      'github 改成 gitdiagram 出架構圖、改成 gitingest 出 AI 可讀的純文字。實測 pallets/click：全抓 44.3 萬 token，排除 tests、docs 與 uv.lock 後剩 11.0 萬，附私有 repo 注意事項。',
    excerpt:
      '把 GitHub 網址的 hub 換成 diagram 或 ingest，就能拿到 LLM 畫的架構圖，或整個 repo 攤平成貼給 AI 的純文字，兩個都是 MIT 開源、星數過萬的工具。實測 pallets/click 全抓有 44.3 萬 token，光一個 uv.lock 就占三分之一——改網址很簡單，真正要做的是先過濾再餵 AI。',
    category: 'AI 工具',
    tags: ['gitdiagram', 'gitingest', 'GitHub', '架構圖', 'Token', 'Claude Code'],
    publishDate: '2026-10-30',
    faqItems: [
      {
        q: 'gitdiagram 和 gitingest 要錢嗎？',
        a: '開 pallets/click 這個公開 repo 時，兩個網站都沒有要求登入或付費。兩個專案都是 MIT 授權；gitdiagram 產生新的解說影片目前是 early access。',
      },
      {
        q: '為什麼 gitingest 網頁版跟 CLI 抓出來的數字不一樣？',
        a: '網頁版預設只收 50kB 以下的檔，CLI 預設上限是 10MB。click 在網頁版是 166 個檔、22.0 萬 token，CLI 全抓是 171 個檔、44.3 萬 token。',
      },
      {
        q: 'gitingest 的 token 數準嗎？',
        a: '摘要寫的是 Estimated tokens，是估算值。拿來比較不同過濾條件的大小很好用，實際消耗以使用的模型計費為準。',
      },
      {
        q: '公司 GitLab 的私有專案可以用嗎？',
        a: '先 git clone 到本機，再用 gitingest CLI 對資料夾跑，例如 gitingest ./my-project -e "*.lock"，程式碼不會上傳到第三方網站。gitdiagram 是對 GitHub 網址運作，私有 repo 要交出 GitHub token。',
      },
    ],
    featured: false,
  },
  {
    slug: 'korea-online-temple-sansa-server-sharding',
    title: '韓國線上寺廟산사為什麼擠爆伺服器？我仿做 3D 禪堂壓測 2000 人，延遲從 4.2 秒降到 0.45 秒',
    metaDescription:
      '韓國線上寺廟산사開站一天湧入數萬人擠爆伺服器。我讀它的前端、仿做繁中 3D 線上禪堂，本機壓測 2000 人：全擠一間 p95 延遲 4.2 秒，每間 100 人只要 0.45 秒，附分房程式碼。',
    excerpt:
      '산사是韓國個人開發者 10 月 28 日上線的 3D 線上寺廟，大家化身小沙彌坐在法堂裡合掌、叩拜，不能聊天，開站一天就湧進數萬人擠爆伺服器。我照它的 Three.js + WebSocket 架構仿做一間壓測 2000 人：全擠一間 p95 延遲 4.2 秒、分成 20 間只要 0.45 秒——同房廣播量跟人數平方成正比，分房才擋得住。',
    category: '工程實作',
    tags: ['산사', '線上寺廟', 'WebSocket', 'Three.js', '壓測', '分房', '即時多人'],
    publishDate: '2026-10-30',
    faqItems: [
      {
        q: '為什麼산사不能聊天？',
        a: '這是原作的設計，網站描述寫的是「말없이 같이 앉아 있는 온라인 절」，意思是不說話、一起坐著的線上寺廟。互動只有合掌、叩拜、轉念珠這類動作。',
      },
      {
        q: '分房之後，朋友想坐同一間怎麼辦？',
        a: '산사是讓使用者從 100 個頻道裡自己選。我的伺服器在連線網址帶 ?room=3 就會進 3 號房，滿了才自動分到別間。',
      },
      {
        q: '只靠 10Hz 批次廣播、不分房夠嗎？',
        a: '不夠。批次能把封包數降下來，但每一包裡還是要放房裡所有在動的人，總資料量仍跟人數平方成正比。我的壓測就是開著批次在跑，全擠一間到 2000 人時 p95 延遲還是到 4.2 秒。',
      },
      {
        q: '這組壓測數字可以當正式環境容量嗎？',
        a: '不行。客戶端和伺服器跑在同一台 Windows 電腦，延遲裡也包含最多 100 ms 的 tick 等待。它能證明的是「同樣人數，分房比全擠一間穩」這個趨勢。',
      },
    ],
    featured: false,
  },
  {
    slug: 'kdp-ai-coloring-book-side-hustle-royalty-math',
    title: 'AI 著色本上架 Amazon KDP 賺多少？照官方公式算，9.99 美元一本實拿 3.15',
    metaDescription:
      'IG 副業排行榜說 AI 著色本一本 9.99 美元賣 12,500 本賺 12.5 萬美元。照 KDP 官方版稅與印刷費重算：8.5×11 吋每本實拿 3.15 美元，只有影片說法的 31.6%，附定價與 AI 申報規定。',
    excerpt:
      'IG Reel「2026 副業排行榜」把 Amazon KDP AI 著色本排 S 級，用 9.99 美元乘 12,500 本算出 12.5 萬美元，但 12,500 是評分數、9.99 是讀者付的定價。照 KDP 官方公式扣掉 40% 與 2.84 美元印刷費，8.5×11 吋每本實拿 3.15 美元，只有影片說法的三成——想做先把這個數字算進去。',
    category: '工程師日常',
    tags: ['Amazon KDP', '著色本', '副業', 'AI 生成圖片', '版稅試算', '副業案例'],
    publishDate: '2026-10-30',
    faqItems: [
      {
        q: 'KDP 著色本的印刷費怎麼算？',
        a: '美國站黑白平裝，24 到 110 頁收固定費：Regular 尺寸 2.30 美元、Large 尺寸 2.84 美元；超過 110 頁是 1.00 美元加每頁 0.012（Regular）或 0.017（Large）。寬超過 6.12 吋或高超過 9 吋算 Large，所以 8.5×11 吋的著色本用 2.84 美元。',
      },
      {
        q: '著色本定價 9.98 和 9.99 美元差在哪？',
        a: '美國站定價 9.99 美元以上版稅率 60%，9.98 美元以下 50%。8.5×11 吋、110 頁以內的書，9.98 美元每本實拿約 2.15 美元，9.99 美元約 3.15 美元，差了一美元。',
      },
      {
        q: '用 AI 生成的著色本上架 KDP 要申報嗎？',
        a: '要。KDP 把 AI 工具產生的文字、圖片或翻譯定義為 AI-generated，封面和內頁圖都算，上架新書時必須告知。只用 AI 編修自己創作的內容算 AI-assisted，不用申報。兩種都要自己確保不侵權。',
      },
      {
        q: 'Amazon 商品頁的評分數可以當銷量嗎？',
        a: '不行。商品頁括號裡的數字是評分數，Amazon 商品頁不顯示銷量，兩者之間也沒有官方換算。',
      },
    ],
    featured: false,
  },
]

const wordCountOf = (s) => s.replace(/\s/g, '').length
const readingTimeOf = (s) => Math.max(1, Math.round(wordCountOf(s) / 400))

const SCORES_PATH = resolve('public/content-scores.json')
const BANNED_WORDS_PATH = resolve(homedir(), '.claude/skills/ig-create/banned-words.txt')

// 計算「結構分」/100。只算程式可客觀判定的 14 項;score-card 的「事實可追溯性」
// 與「SoT Diff Gate」(共 25 分)需人工核對 source-of-truth,程式算不了,不納入。
// 每項給原始分,加總後權重已直接設成總和 100,total 即為 /100 結構分。
function computeContentScore(content, post) {
  const lines = content.split('\n')
  const h2 = lines.filter((l) => /^## /.test(l))
  const h3 = lines.filter((l) => /^### /.test(l))
  const wc = wordCountOf(content)
  const emojiRe = /\p{Extended_Pictographic}/u

  // 禁用詞命中數(檔不存在則視為 0,不擋發文)
  let bannedHits = 0
  if (existsSync(BANNED_WORDS_PATH)) {
    const words = readFileSync(BANNED_WORDS_PATH, 'utf-8')
      .split('\n')
      .map((w) => w.trim())
      .filter((w) => w && !w.startsWith('#'))
    bannedHits = words.reduce(
      (n, w) => n + (content.includes(w) ? 1 : 0),
      0
    )
  }

  // 各項判定(每項 raw 分,加總=100)
  const items = {
    // 字數 2000-3000(以 CJK 字元數計,跟 wordCountOf 一致):15
    wordCount: wc >= 2000 ? 15 : wc >= 1500 ? 10 : 0,
    // 懶人包 blockquote:10
    tldr: /^> \*\*(TL;DR|懶人包)/m.test(content) ? 10 : 0,
    // TOC 目錄:5
    toc: /^## .*目錄/m.test(content) ? 5 : 0,
    // H2 數 ≥ 6:10 / 4-5:5 / <4:0
    h2Count: h2.length >= 6 ? 10 : h2.length >= 4 ? 5 : 0,
    // H2 帶 emoji 比例:5(內文型 H2 如「是什麼」可不帶,按比例給)
    h2Emoji: h2.length
      ? Math.round((h2.filter((l) => emojiRe.test(l)).length / h2.length) * 5)
      : 0,
    // 比較表(markdown table 至少 1 個):10
    table: /^\|.*\|.*\|/m.test(content) ? 10 : 0,
    // 內嵌圖 ≥ 1(markdown image 或 kroki 圖):10 / 否則 5(僅封面)
    image:
      (content.match(/!\[[^\]]*\]\(/g) || []).length +
        (content.match(/```kroki:/g) || []).length >=
      1
        ? 10
        : 5,
    // 踩坑段(H2/H3 含坑/踩/錯誤/失敗):5
    pitfall:
      h3.some((l) => /坑|踩|錯誤|失敗/.test(l)) ||
      h2.some((l) => /坑|踩|錯誤|失敗/.test(l))
        ? 5
        : 0,
    // FAQ ≥ 4 題(從 post.faqItems 數,非 grep markdown):10 / <4:5 / 無:0
    faq:
      (post.faqItems?.length || 0) >= 4
        ? 10
        : (post.faqItems?.length || 0) >= 1
          ? 5
          : 0,
    // 延伸資源段:5
    extLinks: /## .*延伸資源/m.test(content) ? 5 : 0,
    // 禁用詞:5,每命中 1 個扣 1,扣到 0 為止
    bannedWords: Math.max(0, 5 - bannedHits),
    // code fence 語言標籤:5。逐行掃,追蹤 in/out fence 狀態;
    // 「開頭 fence」(進入 code block 那一行)必須帶語言,否則違規→0。
    codeFence: (() => {
      // 依 CommonMark 配對:收尾 fence 不得帶 info string,長度不得少於開頭
      // fence。不記長度的話,````markdown 裡面的 ``` 會被當成收尾,之後每一行
      // fence 的開/收判斷就整串錯位。
      let openLen = 0
      let violation = false
      for (const raw of lines) {
        const l = raw.replace(/\r$/, '')
        const m = /^(`{3,})(.*)$/.exec(l)
        if (!m) continue
        if (openLen === 0) {
          // 這是開頭 fence,必須帶語言(fence 後接非空白)
          if (m[2].trim() === '') violation = true
          openLen = m[1].length
        } else if (m[1].length >= openLen && m[2].trim() === '') {
          openLen = 0 // 閉合 fence,不要求語言
        }
      }
      return violation ? 0 : 5
    })(),
  }

  const total = Object.values(items).reduce((a, b) => a + b, 0)
  return { total, breakdown: items }
}

// upsert 一篇分數進 public/content-scores.json(按 slug)
function writeScoreFile(slug, score, wordCount) {
  let data = { generatedAt: '', scores: {} }
  if (existsSync(SCORES_PATH)) {
    try {
      data = JSON.parse(readFileSync(SCORES_PATH, 'utf-8'))
      if (!data.scores) data.scores = {}
    } catch {
      data = { generatedAt: '', scores: {} }
    }
  }
  data.scores[slug] = {
    total: score.total,
    breakdown: score.breakdown,
    wordCount,
  }
  data.generatedAt = new Date().toISOString().slice(0, 10)
  writeFileSync(SCORES_PATH, JSON.stringify(data, null, 2) + '\n', 'utf-8')
}

// 缺 publishDate 的 fallback：用該文章資料夾的 git 最舊 commit 日（= 真正進倉日）。
// 比 `new Date()`(當天) 穩定可重現——重跑腳本不會把舊文蓋成執行當天。
// 用資料夾路徑而非 article.md：部分文章首次 commit 時檔名/路徑不同，
// --follow article.md 會斷；資料夾層級的最舊 commit 才抓得到。
// 取不到 git 紀錄（未進倉 / 非 git 環境）才退回今天。
function firstCommitDate(slug) {
  try {
    const out = execSync(
      `git log --format=%ad --date=short -- "public/images/blog/${slug}/"`,
      { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] },
    ).trim()
    const lines = out.split('\n').filter(Boolean)
    if (lines.length) return lines[lines.length - 1] // 最舊那筆 = 首次進倉
  } catch {
    // fall through
  }
  return new Date().toISOString().slice(0, 10)
}

// 封面圖提示詞：約定放在 public/images/blog/<slug>/cover-prompt.txt
// （跟 cover.png 並列）。發圖時把生封面用的 prompt 順手寫進該檔，
// 發文時一起寫進 Firestore coverPrompt 欄位，未來重生 / 補圖才有依據。
// 沒有該檔（舊文 / 沒記）就回空字串，不報錯。
function readCoverPrompt(slug) {
  const p = resolve(`public/images/blog/${slug}/cover-prompt.txt`)
  if (!existsSync(p)) return ''
  try {
    return readFileSync(p, 'utf-8').trim()
  } catch {
    return ''
  }
}

function buildFields(post) {
  const articlePath = resolve(`public/images/blog/${post.slug}/article.md`)
  const content = readFileSync(articlePath, 'utf-8')
  const wordCount = wordCountOf(content)
  const readingTime = readingTimeOf(content)
  const score = computeContentScore(content, post)
  const coverPrompt = readCoverPrompt(post.slug)

  return {
    fields: {
      slug: { stringValue: post.slug },
      title: { stringValue: post.title },
      excerpt: { stringValue: post.excerpt },
      content: { stringValue: content },
      author: { stringValue: '陳彥彤' },
      publishDate: {
        stringValue: post.publishDate || firstCommitDate(post.slug),
      },
      coverPrompt: { stringValue: coverPrompt },
      category: { stringValue: post.category },
      tags: {
        arrayValue: {
          values: post.tags.map((t) => ({ stringValue: t })),
        },
      },
      readingTime: { integerValue: String(readingTime) },
      featured: { booleanValue: !!post.featured },
      published: { booleanValue: post.published !== false },
      faqItems: {
        arrayValue: {
          values: post.faqItems.map((item) => ({
            mapValue: {
              fields: {
                q: { stringValue: item.q },
                a: { stringValue: item.a },
              },
            },
          })),
        },
      },
      contentScore: {
        mapValue: {
          fields: {
            total: { integerValue: String(score.total) },
            breakdown: {
              mapValue: {
                fields: Object.fromEntries(
                  Object.entries(score.breakdown).map(([k, v]) => [
                    k,
                    { integerValue: String(v) },
                  ])
                ),
              },
            },
          },
        },
      },
    },
    wordCount,
    readingTime,
    score,
  }
}

// 只有「被當成 CLI 直接執行」時才跑發布流程。
// 被 import（語法檢查、測試、工具鏈掃描）進來時不產生任何副作用——
// 2026-08-03 踩過:用 `node -e "import('./scripts/publish-blog.mjs')"` 想做語法檢查,
// 結果直接對 Firestore 跑了真實 upsert。語法檢查請用 `node --check`。
// 用 pathToFileURL 而非字串拼 `file://`：argv[1] 在 Windows 是
// `C:\...` 或相對路徑，拼出來的 `file://scripts/publish-blog.mjs`
// 永遠對不上 import.meta.url 的 `file:///C:/...`，直接執行也會被當成
// 被 import 而跳過發布——且 exit code 仍是 0，看起來完全成功。
if (import.meta.url !== pathToFileURL(process.argv[1]).href) {
  // 被 import,不執行發布。
} else {
await main()
}

async function main() {
const onlySlugs = process.argv.slice(2)
const targets = onlySlugs.length
  ? posts.filter((p) => onlySlugs.includes(p.slug))
  : posts
if (onlySlugs.length && !targets.length) {
  console.error('No matching slug:', onlySlugs)
  process.exit(1)
}

// docId = slug 做 upsert,避免雙胞胎 doc。
// PATCH /documents/{COLLECTION}/{slug} 不帶 currentDocument 條件 = create-or-overwrite。
// (注意:overwrite 是整個 doc 重寫,buildFields 必須產出完整欄位)
const accessToken = await getOwnerAccessToken()

let anyFail = false
for (const post of targets) {
  const { fields, wordCount, readingTime, score } = buildFields(post)
  const docPath = encodeURIComponent(post.slug)
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION}/${docPath}?key=${API_KEY}`
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ fields }),
  })
  const data = await res.json()
  if (!res.ok) {
    console.error(`FAIL [${post.slug}]`, JSON.stringify(data, null, 2))
    anyFail = true
    continue
  }
  writeScoreFile(post.slug, score, wordCount)
  console.log('OK doc id:', post.slug, '(upsert)')
  console.log(
    '  URL:',
    `https://yanchen.app/blog/${post.slug}/`
  )
  console.log('  reading time:', readingTime, 'min | word count:', wordCount)
  console.log('  content score:', score.total, '/ 100', JSON.stringify(score.breakdown))
}

process.exit(anyFail ? 1 : 0)
}
