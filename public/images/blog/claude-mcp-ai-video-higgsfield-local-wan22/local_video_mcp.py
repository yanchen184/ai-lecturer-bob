"""Local video MCP server: exposes ComfyUI (Wan2.2 TI2V 5B) as MCP tools over stdio.

Same shape as Higgsfield MCP (submit async job -> poll status -> get file),
but runs on the local GPU and costs no credits.
"""
import copy
import json
import os
import time
import urllib.error
import urllib.request
import uuid

from mcp.server.fastmcp import FastMCP

COMFY_URL = os.environ.get("COMFY_URL", "http://127.0.0.1:8000")
COMFY_OUTPUT = os.environ.get("COMFY_OUTPUT", "C:/Users/user/Documents/ComfyUI/output")
FPS = 24
MAX_SECONDS = 5
NEGATIVE_DEFAULT = (
    "blurry, low quality, distorted, deformed, watermark, text, subtitles, "
    "static frame, jpeg artifacts, extra limbs"
)

WORKFLOW = {
    "1": {"class_type": "UNETLoader", "inputs": {"unet_name": "wan2.2_ti2v_5B_fp16.safetensors", "weight_dtype": "default"}},
    "2": {"class_type": "CLIPLoader", "inputs": {"clip_name": "umt5_xxl_fp8_e4m3fn_scaled.safetensors", "type": "wan"}},
    "3": {"class_type": "VAELoader", "inputs": {"vae_name": "wan2.2_vae.safetensors"}},
    "4": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["2", 0], "text": ""}},
    "5": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["2", 0], "text": ""}},
    "6": {"class_type": "Wan22ImageToVideoLatent", "inputs": {"vae": ["3", 0], "width": 704, "height": 384, "length": 49, "batch_size": 1}},
    "7": {"class_type": "ModelSamplingSD3", "inputs": {"model": ["1", 0], "shift": 8.0}},
    "8": {"class_type": "KSampler", "inputs": {"model": ["7", 0], "positive": ["4", 0], "negative": ["5", 0], "latent_image": ["6", 0],
                                                "seed": 1, "steps": 20, "cfg": 5.0, "sampler_name": "uni_pc", "scheduler": "simple", "denoise": 1.0}},
    "9": {"class_type": "VAEDecode", "inputs": {"samples": ["8", 0], "vae": ["3", 0]}},
    "10": {"class_type": "CreateVideo", "inputs": {"images": ["9", 0], "fps": float(FPS)}},
    "11": {"class_type": "SaveVideo", "inputs": {"video": ["10", 0], "filename_prefix": "video/mcp", "format": "auto", "codec": "auto"}},
}

ASPECTS = {"16:9": (704, 384), "9:16": (384, 704), "1:1": (512, 512)}

mcp = FastMCP("local-video")


def _http(path: str, payload: dict | None = None) -> dict:
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(f"{COMFY_URL}{path}", data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read())


def _build_workflow(prompt: str, negative: str, aspect: str, seconds: float, seed: int, steps: int) -> dict:
    width, height = ASPECTS[aspect]
    # Wan latent length must be 4n+1 frames.
    frames = int(seconds * FPS) // 4 * 4 + 1
    wf = copy.deepcopy(WORKFLOW)
    wf["4"]["inputs"]["text"] = prompt
    wf["5"]["inputs"]["text"] = negative
    wf["6"]["inputs"].update(width=width, height=height, length=frames)
    wf["8"]["inputs"].update(seed=seed, steps=steps)
    wf["11"]["inputs"]["filename_prefix"] = f"video/mcp_{uuid.uuid4().hex[:8]}"
    return wf


@mcp.tool()
def check_backend() -> dict:
    """Check that the local ComfyUI video backend is reachable and report GPU/VRAM and queue length."""
    try:
        stats = _http("/system_stats")
        queue = _http("/queue")
    except (urllib.error.URLError, TimeoutError) as exc:
        return {"ok": False, "error": f"ComfyUI not reachable at {COMFY_URL}: {exc}"}
    dev = stats["devices"][0]
    return {
        "ok": True,
        "comfyui_version": stats["system"]["comfyui_version"],
        "gpu": dev["name"],
        "vram_free_gb": round(dev["vram_free"] / 1e9, 2),
        "queue_running": len(queue["queue_running"]),
        "queue_pending": len(queue["queue_pending"]),
        "model": "Wan2.2 TI2V 5B (text-to-video)",
        "cost": "0 credits (local GPU)",
    }


@mcp.tool()
def generate_video(prompt: str, aspect: str = "16:9", seconds: float = 2.0, seed: int = 42,
                   steps: int = 20, negative_prompt: str = "") -> dict:
    """Submit a text-to-video job to the local Wan2.2 model. Returns a job_id immediately;
    then call wait_for_job(job_id). A 2-second 16:9 clip takes about 2 minutes on an RTX 4070.

    prompt: English scene description (subject, action, camera movement, lighting, style).
    aspect: one of '16:9', '9:16', '1:1'.
    seconds: clip length, 1-5.
    """
    if not prompt.strip():
        return {"ok": False, "error": "prompt is empty"}
    if aspect not in ASPECTS:
        return {"ok": False, "error": f"aspect must be one of {list(ASPECTS)}"}
    if not 1 <= seconds <= MAX_SECONDS:
        return {"ok": False, "error": f"seconds must be between 1 and {MAX_SECONDS}"}
    if not 4 <= steps <= 40:
        return {"ok": False, "error": "steps must be between 4 and 40"}
    wf = _build_workflow(prompt, negative_prompt or NEGATIVE_DEFAULT, aspect, seconds, seed, steps)
    try:
        resp = _http("/prompt", {"prompt": wf, "client_id": "local-video-mcp"})
    except urllib.error.HTTPError as exc:
        return {"ok": False, "error": f"ComfyUI rejected workflow: {exc.read().decode()[:500]}"}
    except (urllib.error.URLError, TimeoutError) as exc:
        return {"ok": False, "error": f"ComfyUI not reachable: {exc}"}
    return {"ok": True, "job_id": resp["prompt_id"], "queue_position": resp.get("number"),
            "frames": wf["6"]["inputs"]["length"], "resolution": ASPECTS[aspect]}


@mcp.tool()
def get_job(job_id: str) -> dict:
    """Get the status of a video job. status is one of: queued, running, done, failed.
    When done, 'file' is the absolute path of the generated mp4."""
    try:
        hist = _http(f"/history/{job_id}")
        queue = _http("/queue")
    except (urllib.error.URLError, TimeoutError) as exc:
        return {"ok": False, "error": f"ComfyUI not reachable: {exc}"}
    if job_id in hist:
        entry = hist[job_id]
        if entry["status"].get("status_str") != "success":
            msgs = [m for m in entry["status"].get("messages", []) if m[0] == "execution_error"]
            return {"ok": True, "status": "failed", "detail": msgs[-1][1].get("exception_message") if msgs else "unknown"}
        for out in entry["outputs"].values():
            for item in out.get("images", []):
                path = os.path.join(COMFY_OUTPUT, item["subfolder"], item["filename"]).replace("\\", "/")
                return {"ok": True, "status": "done", "file": path}
        return {"ok": True, "status": "failed", "detail": "job finished without a video output"}
    if any(item[1] == job_id for item in queue["queue_running"]):
        return {"ok": True, "status": "running"}
    pending = [item[1] for item in queue["queue_pending"]]
    if job_id in pending:
        return {"ok": True, "status": "queued", "ahead": pending.index(job_id)}
    return {"ok": False, "error": "unknown job_id"}


@mcp.tool()
def wait_for_job(job_id: str, timeout_seconds: int = 300) -> dict:
    """Block until the job is done or failed, or timeout_seconds (max 540) passes.
    Use this instead of sleeping between get_job calls."""
    deadline = time.monotonic() + min(max(timeout_seconds, 1), 540)
    while True:
        result = get_job(job_id)
        if not result.get("ok") or result["status"] in ("done", "failed"):
            return result
        if time.monotonic() >= deadline:
            return {**result, "timed_out": True}
        time.sleep(5)


if __name__ == "__main__":
    mcp.run()
