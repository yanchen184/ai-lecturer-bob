"""Local ComfyUI pipeline: shot list -> Wan 5B keyframes -> Wan 14B image-to-video.

Usage:
  python pipeline.py keyframes
  python pipeline.py video <shot1_seed> <shot2_seed> <shot3_seed> <shot4_seed>
"""
import json
import shutil
import sys
import time
import urllib.parse
import urllib.request
import uuid
from pathlib import Path

API = "http://127.0.0.1:8000"
COMFY = Path("C:/Users/user/Documents/ComfyUI")
OUT = Path(__file__).resolve().parent.parent / "out"
PREFIX = "lab181511"
KF_SEEDS = (101, 202)
POLL_SECONDS = 5
JOB_TIMEOUT_SECONDS = 1500

NEGATIVE = (
    "色调艳丽，过曝，静态，细节模糊不清，字幕，文字，水印，最差质量，低质量，JPEG压缩残留，丑陋的，残缺的，"
    "多余的手指，畸形的，毁容的，形态畸形的肢体，手指融合，静止不动的画面，杂乱的背景，三条腿，多个角色，倒着走"
)
STYLE = (
    "Preschool 3D cartoon animation still, soft rounded shapes, bright cheerful pastel colors, "
    "soft studio lighting, vertical composition."
)
CHARACTER = (
    "Main character: Tumi, a small round baby hedgehog with soft lilac spines, a cream face, "
    "big shiny black eyes, and bright yellow rain boots."
)
SHOTS = [
    {
        "still": "Tumi stands in an open round blue doorway of a tiny cottage, looking out at gentle rain "
                 "falling on a green garden, full body, centered.",
        "motion": "The little hedgehog peeks outside, tilts its head and smiles as gentle rain falls. "
                  "Slow push in.",
        "lyric": "Drip, drop, rain says hi!",
    },
    {
        "still": "Tumi jumps above a big round puddle on a garden path, water droplets in the air, "
                 "both yellow boots visible, full body, centered.",
        "motion": "The little hedgehog hops up and down in the puddle, water splashes around its yellow boots.",
        "lyric": "Splash, splash, boots jump high!",
    },
    {
        "still": "Tumi stands in a garden after rain, holding one big green leaf over its head like an umbrella, "
                 "the last raindrops sliding off the leaf, full body, centered.",
        "motion": "The little hedgehog sways side to side holding the leaf, raindrops slide off and the sky brightens.",
        "lyric": "Leaf umbrella, sway, sway, sway!",
    },
    {
        "still": "Tumi stands on a small green hill, one short arm pointing up at a soft pastel rainbow "
                 "in a clear blue sky, full body, centered.",
        "motion": "The little hedgehog waves happily at the rainbow while clouds drift slowly. Gentle camera rise.",
        "lyric": "Rainbow comes to play!",
    },
]


def post_json(path, body):
    req = urllib.request.Request(
        API + path, json.dumps(body).encode(), {"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.load(resp)


def get_json(path):
    with urllib.request.urlopen(API + path, timeout=30) as resp:
        return json.load(resp)


def run_job(workflow):
    prompt_id = post_json("/prompt", {"prompt": workflow, "client_id": uuid.uuid4().hex})["prompt_id"]
    deadline = time.time() + JOB_TIMEOUT_SECONDS
    while time.time() < deadline:
        entry = get_json(f"/history/{urllib.parse.quote(prompt_id)}").get(prompt_id)
        if entry and entry["status"].get("completed"):
            return entry
        if entry and entry["status"].get("status_str") == "error":
            raise RuntimeError(json.dumps(entry["status"], ensure_ascii=False)[:2000])
        time.sleep(POLL_SECONDS)
    raise TimeoutError(f"job {prompt_id} exceeded {JOB_TIMEOUT_SECONDS}s")


def output_file(entry):
    for node in entry["outputs"].values():
        for files in node.values():
            if isinstance(files, list):
                for f in files:
                    if isinstance(f, dict) and "filename" in f:
                        return COMFY / "output" / f.get("subfolder", "") / f["filename"]
    raise RuntimeError("job finished without an output file")


def keyframe_workflow(shot, seed, name):
    text = f"{STYLE} {CHARACTER} {shot['still']}"
    return {
        "1": {"class_type": "UNETLoader", "inputs": {"unet_name": "wan2.2_ti2v_5B_fp16.safetensors", "weight_dtype": "default"}},
        "2": {"class_type": "CLIPLoader", "inputs": {"clip_name": "umt5_xxl_fp8_e4m3fn_scaled.safetensors", "type": "wan", "device": "default"}},
        "3": {"class_type": "VAELoader", "inputs": {"vae_name": "wan2.2_vae.safetensors"}},
        "4": {"class_type": "ModelSamplingSD3", "inputs": {"model": ["1", 0], "shift": 8.0}},
        "5": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["2", 0], "text": text}},
        "6": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["2", 0], "text": NEGATIVE}},
        "7": {"class_type": "Wan22ImageToVideoLatent", "inputs": {"vae": ["3", 0], "width": 704, "height": 1280, "length": 1, "batch_size": 1}},
        "8": {"class_type": "KSampler", "inputs": {
            "model": ["4", 0], "positive": ["5", 0], "negative": ["6", 0], "latent_image": ["7", 0],
            "seed": seed, "steps": 30, "cfg": 5.0, "sampler_name": "uni_pc", "scheduler": "simple", "denoise": 1.0}},
        "9": {"class_type": "VAEDecode", "inputs": {"samples": ["8", 0], "vae": ["3", 0]}},
        "10": {"class_type": "SaveImage", "inputs": {"images": ["9", 0], "filename_prefix": f"{PREFIX}/{name}"}},
    }


def video_workflow(shot, image_name, seed, name):
    def stage(unet, lora):
        return (
            {"class_type": "UNETLoader", "inputs": {"unet_name": unet, "weight_dtype": "default"}},
            lora,
        )

    high, high_lora = stage("wan2.2_i2v_high_noise_14B_fp8_scaled.safetensors", "wan2.2_i2v_lightx2v_4steps_lora_v1_high_noise.safetensors")
    low, low_lora = stage("wan2.2_i2v_low_noise_14B_fp8_scaled.safetensors", "wan2.2_i2v_lightx2v_4steps_lora_v1_low_noise.safetensors")
    sampler = {"steps": 4, "cfg": 1.0, "sampler_name": "euler", "scheduler": "simple",
               "positive": ["7", 0], "negative": ["7", 1], "noise_seed": seed}
    return {
        "1": high,
        "1l": {"class_type": "LoraLoaderModelOnly", "inputs": {"model": ["1", 0], "lora_name": high_lora, "strength_model": 1.0}},
        "1s": {"class_type": "ModelSamplingSD3", "inputs": {"model": ["1l", 0], "shift": 5.0}},
        "2": low,
        "2l": {"class_type": "LoraLoaderModelOnly", "inputs": {"model": ["2", 0], "lora_name": low_lora, "strength_model": 1.0}},
        "2s": {"class_type": "ModelSamplingSD3", "inputs": {"model": ["2l", 0], "shift": 5.0}},
        "3": {"class_type": "CLIPLoader", "inputs": {"clip_name": "umt5_xxl_fp8_e4m3fn_scaled.safetensors", "type": "wan", "device": "default"}},
        "4": {"class_type": "VAELoader", "inputs": {"vae_name": "wan_2.1_vae.safetensors"}},
        "5": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["3", 0], "text": shot["motion"]}},
        "6": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["3", 0], "text": NEGATIVE}},
        "12": {"class_type": "LoadImage", "inputs": {"image": image_name}},
        "7": {"class_type": "WanImageToVideo", "inputs": {
            "positive": ["5", 0], "negative": ["6", 0], "vae": ["4", 0],
            "width": 480, "height": 832, "length": 81, "batch_size": 1, "start_image": ["12", 0]}},
        "8": {"class_type": "KSamplerAdvanced", "inputs": {
            **sampler, "model": ["1s", 0], "add_noise": "enable", "latent_image": ["7", 2],
            "start_at_step": 0, "end_at_step": 2, "return_with_leftover_noise": "enable"}},
        "8b": {"class_type": "KSamplerAdvanced", "inputs": {
            **sampler, "model": ["2s", 0], "add_noise": "disable", "latent_image": ["8", 0],
            "start_at_step": 2, "end_at_step": 4, "return_with_leftover_noise": "disable"}},
        "9": {"class_type": "VAEDecode", "inputs": {"samples": ["8b", 0], "vae": ["4", 0]}},
        "10": {"class_type": "CreateVideo", "inputs": {"images": ["9", 0], "fps": 16.0}},
        "11": {"class_type": "SaveVideo", "inputs": {"video": ["10", 0], "filename_prefix": f"video/{PREFIX}_{name}", "format": "mp4", "codec": "h264"}},
    }


def timed_job(workflow, destination):
    started = time.time()
    source = output_file(run_job(workflow))
    shutil.copy2(source, destination)
    print(f"{destination.name}\t{time.time() - started:.0f}s\t{source}", flush=True)


def make_keyframes():
    OUT.mkdir(exist_ok=True)
    for index, shot in enumerate(SHOTS, 1):
        for seed in KF_SEEDS:
            name = f"s{index}_seed{seed}"
            timed_job(keyframe_workflow(shot, seed, name), OUT / f"{name}.png")


def make_videos(seeds):
    if len(seeds) != len(SHOTS):
        raise SystemExit(f"expected {len(SHOTS)} seeds, got {len(seeds)}")
    for index, (shot, seed) in enumerate(zip(SHOTS, seeds), 1):
        image_name = f"{PREFIX}_s{index}.png"
        shutil.copy2(OUT / f"s{index}_seed{seed}.png", COMFY / "input" / image_name)
        timed_job(video_workflow(shot, image_name, 42 + index, f"s{index}"), OUT / f"clip{index}.mp4")


if __name__ == "__main__":
    if len(sys.argv) >= 2 and sys.argv[1] == "keyframes":
        make_keyframes()
    elif len(sys.argv) >= 2 and sys.argv[1] == "video":
        make_videos([int(s) for s in sys.argv[2:]])
    else:
        raise SystemExit(__doc__)
