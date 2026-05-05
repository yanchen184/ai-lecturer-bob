> **TL;DR**
> - 本文解決：手上只有 RTX 4070 12GB，到底能不能在家跑 Wan 2.2 14B I2V 影片、還做出無縫 loop？
> - 推薦給：被 LoRA 訓練搞到崩潰、想直接用社群現成 4-step 蒸餾 LoRA 出片的人
> - 讀完你會知道：12GB 跑 14B 的關鍵設定、`WanFirstLastFrameToVideo` 怎麼接、用 SSIM 量化 loop 接合度、五個 Windows 踩坑實錄。

<img src="/ai-lecturer-bob/images/blog/rtx-4070-wan22-i2v-loop/cover.png" alt="Wan 2.2 I2V loop 首末幀對照 — 翻書動作 SSIM 0.89 接合度高" style="border-radius: 8px; margin: 1rem 0; width: 100%;" />

## 📌 目錄

1. [背景：為什麼放棄訓練自己的 LoRA](#背景為什麼放棄訓練自己的-lora)
2. [硬體與軟體配置](#硬體與軟體配置)
3. [Workflow 拆解：lightx2v 4-step 為什麼快](#workflow-拆解lightx2v-4-step-為什麼快)
4. [兩支基本影片：5 分鐘出片](#兩支基本影片5-分鐘出片)
5. [做成 Loop：WanFirstLastFrameToVideo 節點](#做成-loopwanfirstlastframetovideo-節點)
6. [用 SSIM 量化 loop 接合度](#用-ssim-量化-loop-接合度)
7. [五個踩坑實錄](#五個踩坑實錄)
8. [完整 runner script](#完整-runner-script)
9. [延伸資源](#延伸資源)

## 🤔 背景：為什麼放棄訓練自己的 LoRA

一開始我想走「訓練自己的角色 LoRA」這條路。準備了 40 張 `ohwx_character` 圖、用 [musubi-tuner](https://github.com/kohya-ss/musubi-tuner) 跑 Wan 2.2 14B I2V LoRA。結果在 12GB VRAM 上連續撞牆三天：

| 問題 | 現象 | 對應 |
|---|---|---|
| `bitsandbytes 0.49.0` segfault | Windows + torch 2.7 一 import 就掛 | 改 `--optimizer_type adamw`（非 8bit） |
| `regex` 套件壞掉 | `dict_itemiterator object is not callable` | `pip install --upgrade --force-reinstall regex` |
| Windows dataloader deadlock | 訓練 ~120 step 卡死、VRAM 滿、process 還活著 | `--max_data_loader_n_workers 0` |
| VRAM 12GB 上限 | `--blocks_to_swap 30` 接近極限（11.9GB） | 改 35 比較穩 |

撞了快一天之後我認清現實：**12GB VRAM + Windows 跑 Wan2.2 14B LoRA 訓練本來就是極限作業**，與其自己訓練，不如直接用社群已經調好的 4-step lightx2v LoRA + I2V workflow，把生成模型當服務用。

最後成品兩支：

<img src="/ai-lecturer-bob/images/blog/rtx-4070-wan22-i2v-loop/walking-loop.gif" alt="走路 loop 動畫預覽 — 8 秒 129 幀，但首末對位較差 SSIM 0.61" style="border-radius: 8px; margin: 1rem 0; width: 60%;" />

<img src="/ai-lecturer-bob/images/blog/rtx-4070-wan22-i2v-loop/reading-loop.gif" alt="翻書 loop 動畫預覽 — 8 秒 129 幀，首末對位漂亮 SSIM 0.89" style="border-radius: 8px; margin: 1rem 0; width: 60%;" />

## 💻 硬體與軟體配置

```text
GPU       : NVIDIA GeForce RTX 4070 (12 GB)
RAM       : 64 GB
OS        : Windows 11
Driver    : 591.86
Python    : 3.11.9
PyTorch   : 2.7.0+cu128
ComfyUI   : 0.3.71（--lowvram --use-pytorch-cross-attention）
```

ComfyUI 啟動參數很關鍵，`--lowvram` 會把 unet 切片載入，是 12GB 跑得動 14B 的前提。

## ⚡ Workflow 拆解：lightx2v 4-step 為什麼快

Wan 2.2 I2V 原本要跑 50+ 個 sampler steps 才有好結果，**lightx2v 4-step LoRA** 把模型蒸餾到只要 4 步：

- **Stage 1（high noise）**：steps 0–2，model = `wan2.2_i2v_high_noise_14B_fp8_scaled.safetensors` + lightx2v high LoRA strength 1.0
- **Stage 2（low noise）**：steps 2–4，model = `wan2.2_i2v_low_noise_14B_fp8_scaled.safetensors` + lightx2v low LoRA strength 1.0
- 兩個 KSamplerAdvanced 串接，`cfg=1.0`、`sampler=euler`、`scheduler=simple`

整個流程 4 步 + ModelSamplingSD3 shift=5.0，搭配 fp8_e4m3fn_scaled 量化，剛好把 14B 模型塞進 12GB。

實際模型檔案（給要對照路徑的人）：

```text
D:/ComfyUI/models/diffusion_models/
  wan2.2_i2v_high_noise_14B_fp8_scaled.safetensors  (14.3 GB, fp8 scaled)
  wan2.2_i2v_low_noise_14B_fp8_scaled.safetensors   (14.3 GB, fp8 scaled)

D:/ComfyUI/models/loras/
  wan2.2_i2v_lightx2v_4steps_lora_v1_high_noise.safetensors  (1.2 GB)
  wan2.2_i2v_lightx2v_4steps_lora_v1_low_noise.safetensors   (1.2 GB)

D:/ComfyUI/models/text_encoders/
  umt5_xxl_fp8_e4m3fn_scaled.safetensors

D:/ComfyUI/models/vae/
  wan_2.1_vae.safetensors
```

## 🎬 兩支基本影片：5 分鐘出片

我直接拿了 [spec-kit](https://github.com/Bob-Chen-fans/spec-kit) 專案的 `wan2.2-i2v-api.json` 當 workflow 模板，用 Python 改了三個欄位：

```python
wf["1"]["inputs"]["image"]   = image_name        # LoadImage
wf["10"]["inputs"]["text"]   = prompt            # CLIPTextEncode（正面）
wf["12"]["inputs"]["length"] = 129               # 129 frames @ 16 fps = ~8 秒
wf["13"]["inputs"]["noise_seed"] = seed
```

提交給 ComfyUI 的 `/prompt` API、輪詢 `/history/{prompt_id}` 直到 `status_str == "success"`：

| 影片 | 起始幀 | seed | 渲染時間 | 檔案大小 |
|---|---|---|---|---|
| 走路 | `ohwx_walking_start.png` | 42 | ~5.5 分鐘 | 977 KB |
| 翻書 | `ohwx_reading_start.png` | 123 | ~4.7 分鐘 | 966 KB |

## 🔁 做成 Loop：WanFirstLastFrameToVideo 節點

普通的 I2V 只接 `start_image`，影片從那張圖開始長出來；要做 loop，把節點換成 **`WanFirstLastFrameToVideo`**，多一個 `end_image` 引腳：

```python
wf["12"] = {
    "class_type": "WanFirstLastFrameToVideo",
    "inputs": {
        "positive": ["10", 0],
        "negative": ["11", 0],
        "vae": ["3", 0],
        "start_image": ["1", 0],   # 同一張 LoadImage
        "end_image":   ["1", 0],   # ← 也接同一張，逼模型繞回原點
        "width": 480,
        "height": 848,
        "length": 129,
        "batch_size": 1,
    },
}
```

prompt 也要配合：把「walking forward」改成「walking in a smooth circular motion and returning to the starting pose」，給模型「該繞回去」的暗示。

兩個版本（基本 + loop）的渲染時間幾乎一樣（loop 還快了 1 分鐘），代表多一個 `end_image` 條件對 4-step 推論不是瓶頸。

## 📐 用 SSIM 量化 loop 接合度

Loop 看起來順不順，量化指標就是「最後一幀 vs 第一幀」的相似度。我用 ffmpeg 取出兩張幀做 SSIM：

```bash
ffmpeg -i "loop.mp4" -vf "select=eq(n\,0)" -frames:v 1 first.png
ffmpeg -sseof -0.5 -i "loop.mp4" -update 1 -frames:v 1 last.png
ffmpeg -i first.png -i last.png -lavfi ssim -f null -
```

結果：

| 影片 | SSIM (RGB All) | 主觀感受 |
|---|---|---|
| 翻書 loop | **0.886** | 接合度好，幾乎看不到跳動 |
| 走路 loop | **0.612** | 接合度差，腳步沒回到原位、相機角度漂掉 |

首末幀並排對照（左：第一幀，右：最後一幀）：

<img src="/ai-lecturer-bob/images/blog/rtx-4070-wan22-i2v-loop/reading-seam.png" alt="翻書 loop 首末幀對照 — 構圖、姿勢、書頁狀態幾乎一致" style="border-radius: 8px; margin: 1rem 0; width: 100%;" />

<img src="/ai-lecturer-bob/images/blog/rtx-4070-wan22-i2v-loop/walking-seam.png" alt="走路 loop 首末幀對照 — 角色位置和鏡頭視角明顯偏移" style="border-radius: 8px; margin: 1rem 0; width: 100%;" />

走路為什麼接不好？合理推測：走路是線性位移，模型要在 8 秒內「往前走又自然走回」非常違反物理；翻書是局部肢體動作，回到原樣相對容易。

下次走路要做 loop，可以試：

1. 把長度降到 4 秒（讓回擺更急）
2. prompt 改成「原地踏步」或「鏡頭環繞」
3. 用 ffmpeg 把走路 + 反向接起來（`A + reverse(A)`）做反向 loop

## 🪤 五個踩坑實錄

### 1. `bitsandbytes 0.49.0` 在 Windows + torch 2.7 segfault

訓練腳本一 `import` 就掛，Python 直接 dump 出 process。換 `--optimizer_type adamw`（非 8bit）就好，速度只慢一點點，14B LoRA 訓練本來瓶頸也不在 optimizer。

### 2. Python `regex` 套件被別的安裝弄壞

`import transformers` raise `dict_itemiterator object is not callable`。`pip install --upgrade --force-reinstall regex`（裝到 `2026.4.4`）就修好了。

### 3. Windows shell 餵 LINE API 的中文 / emoji 會壞掉

我把生成完成通知 wired 到 LINE Messaging API，但 Windows shell 對 `-d '...'` 內嵌 CJK 編碼不友善，每次都會被吃掉變亂碼。

**解法**：用 Python 寫 JSON 到檔案，再用 `curl --data-binary @file.json` 餵：

```python
# _make_line_msg.py
import json
payload = {"to": USER_ID, "messages": [{"type": "text", "text": "兩支影片完成"}]}
with open("_line_msg.json", "w", encoding="utf-8") as f:
    json.dump(payload, f, ensure_ascii=False)
```

```bash
curl -sS -X POST 'https://api.line.me/v2/bot/message/push' \
  -H 'Content-Type: application/json; charset=utf-8' \
  -H "Authorization: Bearer $TOKEN" \
  --data-binary @_line_msg.json
```

### 4. ComfyUI `/prompt` API 提交 workflow 不是用前端 JSON

注意 `wan2.2-i2v-api.json` 是 **API 格式**（純 node 字典），不是前端拖出來的 graph 格式。前端那個是給 GUI 用的，會被 `/prompt` 拒絕。

### 5. ComfyUI 印出 `prompt_id` 之後不代表開始跑

要 `GET /queue` 看 `queue_running`、`GET /history/{prompt_id}` 看 `status_str`。我寫了 8 秒輪詢一次的 loop，順便顯示「running / pending / finishing」，不然 stdout 會 buffer 一片黑。

## 📝 完整 runner script

```python
# run_two_videos_loop.py
import json, time, urllib.request
from pathlib import Path

API = "http://127.0.0.1:8188"
WORKFLOW_PATH = Path("D:/spec-kit/backend/workflows/wan2.2-i2v-api.json")

JOBS = [
    {"name": "walking_loop", "image": "ohwx_walking_start.png",
     "prompt": "anime style, ..., walking in a smooth circular motion and "
               "returning to the starting pose, ..., seamless loop",
     "seed": 42},
    {"name": "reading_loop", "image": "ohwx_reading_start.png",
     "prompt": "anime style, ..., turning a page and turning it back, "
               "returning hand to original position, ..., seamless loop",
     "seed": 123},
]

def build(image, prompt, seed):
    wf = json.loads(WORKFLOW_PATH.read_text(encoding="utf-8"))
    wf["1"]["inputs"]["image"] = image
    wf["10"]["inputs"]["text"] = prompt
    wf["13"]["inputs"]["noise_seed"] = seed
    wf["12"] = {
        "class_type": "WanFirstLastFrameToVideo",
        "inputs": {
            "positive": ["10", 0], "negative": ["11", 0],
            "vae": ["3", 0],
            "start_image": ["1", 0], "end_image": ["1", 0],
            "width": 480, "height": 848, "length": 129, "batch_size": 1,
        },
    }
    return wf

def submit(job):
    body = json.dumps({
        "prompt": build(job["image"], job["prompt"], job["seed"]),
        "client_id": f"cli-{job['name']}",
    }).encode()
    req = urllib.request.Request(f"{API}/prompt", data=body,
        headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())["prompt_id"]
```

## 📚 延伸資源

- [Wan 2.2 官方 repo](https://github.com/Wan-Video/Wan2.2)
- [lightx2v 4-step LoRA（Hugging Face）](https://huggingface.co/lightx2v) — 把推論步數從 50+ 壓到 4
- [ComfyUI Wan2.2 節點原始碼](https://github.com/comfyanonymous/ComfyUI/blob/master/comfy_extras/nodes_wan.py) — `WanImageToVideo` / `WanFirstLastFrameToVideo` 都在這
- [musubi-tuner](https://github.com/kohya-ss/musubi-tuner) — 如果你還是想自己訓練 LoRA（祝你有 24GB+ VRAM）

---

下次想試「短到 4 秒、原地擺動」的走路 loop，看 SSIM 能不能拉到 0.85 以上。
