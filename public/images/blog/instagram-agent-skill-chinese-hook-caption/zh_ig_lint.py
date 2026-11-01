#!/usr/bin/env python3
"""zh_ig_lint.py - 繁中版 IG hook / caption / 去 AI 味檢查（只用標準函式庫，不連網）。

原版 Jakeschincariol/instagram-agent-skill 的規則以英文單字為單位，中文輸入會被誤判。
本檔把同樣的三個檢查改成以中文字元計算。

用法
  python -X utf8 zh_ig_lint.py hook    hooks.txt         # 一行一個 hook，排名
  python -X utf8 zh_ig_lint.py caption caption.txt [--keywords 重構,Claude]
  python -X utf8 zh_ig_lint.py human   draft.txt [--write cleaned.txt]
"""

import argparse
import re
import sys
import unicodedata

CHARS_PER_SEC = 4.5          # 中文口播語速（字/秒）的假設值，可用 --cps 覆寫
FEED_WINDOW = 125            # 沿用原版的 125 字元摺疊假設
HASHTAG_CAP = 5              # 沿用原版：2025-12-18 起每篇 5 個

CJK = r"\u3400-\u9fff\uf900-\ufaff"
HAN_RE = re.compile(f"[{CJK}]")
LATIN_WORD_RE = re.compile(r"[A-Za-z0-9][A-Za-z0-9$%.,'-]*")
NUM_RE = re.compile(r"\d[\d,]*(?:\.\d+)?|[一二兩三四五六七八九十百千萬億]+(?:個|次|年|天|分鐘|小時|行|萬|倍|%|元|塊)")
PROPER_RE = re.compile(r"\b[A-Z][A-Za-z]+\b")
HASHTAG_RE = re.compile(r"#[^\s#]+")
EMOJI_RE = re.compile(r"[\U0001F300-\U0001FAFF☀-➿]")
INVISIBLE_RE = re.compile(r"[​-‏⁠-⁤﻿­᠎\U000E0000-\U000E007F]")

GREETINGS = ["哈囉", "嗨大家", "大家好", "各位好", "hello", "hi 大家"]
PREAMBLES = ["今天想跟", "今天要跟", "今天來", "在今天的影片", "這支影片", "這集我們", "本集"]
ATTENTION_BEGS = ["停止滑動", "先別滑", "不要滑走", "等等先別走"]
STAKES_WORDS = ["虧", "損失", "賠", "刪掉", "省下", "多賺", "失敗", "錯誤", "後悔", "被開除",
                "沒人告訴", "沒有人告訴", "千萬別", "不要再", "其實", "真相", "秘密", "一行都沒",
                "白花", "浪費", "危險", "最可怕"]
ADDRESS_WORDS = ["你", "妳", "你們"]
CTA_PATTERNS = [r"留言", r"私訊", r"點.*連結", r"收藏", r"分享給", r"追蹤", r"按讚"]

# 中文 AI 味詞庫：(詞, 替換)；替換為空字串 = 直接刪
SLOP = [
    ("停止滑動！", ""), ("停止滑動", ""), ("在今天的影片中，", ""), ("在今天的影片中", ""),
    ("讓我們深入探討", "來看"), ("深入探討", "看"), ("改變遊戲規則的", "很大的"),
    ("改變遊戲規則", "大改變"), ("全面賦能", "幫"), ("賦能", "幫"), ("解鎖", "打開"),
    ("無縫接軌", "順"), ("尖端", "新"), ("顛覆性", "很大"), ("一站式", ""),
    ("提升你的", "改善"), ("在這個快節奏的時代", ""), ("值得一提的是，", ""),
    ("總而言之，", ""), ("追蹤我看更多", ""), ("標記一個需要的朋友", ""),
    ("錯過就可惜了", ""), ("乾貨滿滿", ""), ("建議收藏", ""),
]
STRUCTURAL = [
    (re.compile(r"不僅僅?是.{1,20}?[，,]\s*更是"), "「不只是 X，更是 Y」：直接講你真正要講的那一個"),
    (re.compile(r"[✅✔️👉🔥]\s*\S+\s*[✅✔️👉🔥]"), "emoji 條列：改成換行或「-」"),
    (re.compile(r"[🚀🔥💡✨🎯]"), "火箭/火/燈泡/閃亮/飛鏢 emoji：最多一個"),
    (re.compile(r"(\S{1,4})、(\S{1,4})、(\S{1,4})"), "三連排比：留一個最具體的"),
]
TYPO = [("——", "，"), ("—", "，"), ("–", "-"), ("…", "..."), ("“", "「"), ("”", "」")]


def say_seconds(text, cps):
    han = len(HAN_RE.findall(text))
    latin = len(LATIN_WORD_RE.findall(text))
    return (han + latin * 1.5) / cps     # 一個英文字/數字約等於 1.5 個中文字的口播時間


def score_hook(hook, cps):
    secs = say_seconds(hook, cps)
    length = 100 if secs <= 3 else max(0, 100 - (secs - 3) * 40)
    concrete = len(NUM_RE.findall(hook)) + len(PROPER_RE.findall(hook))
    specificity = min(100, 25 + concrete * 35)
    stakes = min(100, 30 + 35 * sum(w in hook for w in STAKES_WORDS))
    head = hook[:8]
    frontload = 100 if (NUM_RE.search(head) or any(w in head for w in STAKES_WORDS + ["我"])) else 50
    address = 100 if any(w in hook for w in ADDRESS_WORDS) else 70
    parts = {"長度": length, "具體": specificity, "利害": stakes, "前置": frontload, "對象": address}
    score = sum(parts.values()) / len(parts)
    deal = []
    low = hook.lower()
    if any(low.startswith(g) or g in hook[:6] for g in GREETINGS):
        deal.append("開場打招呼：沒人是來被打招呼的")
    if any(p in hook for p in PREAMBLES):
        deal.append("前言句（今天想跟大家…）：直接講重點")
    if any(a in hook for a in ATTENTION_BEGS):
        deal.append("要求注意力（停止滑動）：要求本身就證明你還沒贏得注意")
    if EMOJI_RE.search(hook):
        deal.append("hook 裡有 emoji：上字幕時位置該留給字")
    score = score * (0.5 ** len(deal))
    return {"hook": hook, "score": round(score, 1), "secs": round(secs, 1), "parts": parts, "deal": deal}


def cmd_hook(text, args):
    rows = [score_hook(h.strip(), args.cps) for h in text.splitlines() if h.strip()]
    rows.sort(key=lambda r: -r["score"])
    print("HOOK 排名（繁中）\n" + "=" * 60)
    for i, r in enumerate(rows):
        verdict = "強" if r["score"] >= 70 else "可" if r["score"] >= 50 else "弱"
        weakest = min(r["parts"], key=r["parts"].get)
        print(f"{'->' if i == 0 else '  '} {r['score']:5.1f} {verdict}  {r['hook']}")
        print(f"       約 {r['secs']}s 說完 · 最弱：{weakest}({r['parts'][weakest]:.0f})")
        for d in r["deal"]:
            print(f"       ✗ {d}")
    return 0 if rows and rows[0]["score"] >= 50 else 1


def cmd_caption(text, args):
    body = text.strip()
    tags = HASHTAG_RE.findall(body)
    visible = body[:FEED_WINDOW]
    first_line = body.splitlines()[0] if body else ""
    ctas = [p for p in CTA_PATTERNS if re.search(p, body)]
    if "留言" in ctas and "私訊" in ctas:     # 「留言關鍵字 → 私訊給你」是同一個 ask
        ctas = [p for p in ctas if p != "私訊"]
    checks = []
    checks.append(("PASS" if len(body) <= 2200 else "FAIL", "長度", f"{len(body)} / 2200 字元"))
    checks.append(("PASS" if len(first_line) <= FEED_WINDOW else "WARN", "首行",
                   f"{len(first_line)} 字元" + ("" if len(first_line) <= FEED_WINDOW else f"，會在第 {FEED_WINDOW} 字被切")))
    concrete = len(NUM_RE.findall(visible)) + len(PROPER_RE.findall(visible))
    checks.append(("PASS" if concrete else "WARN", "可見區具體度", f"{concrete} 個數字或專有名詞"))
    checks.append(("PASS" if len(tags) <= HASHTAG_CAP else "FAIL", "Hashtag", f"{len(tags)} 個：{' '.join(tags)}"))
    tag_in_view = any(t in visible for t in tags) and len(body) > FEED_WINDOW
    checks.append(("WARN" if tag_in_view else "PASS", "Hashtag 位置", "在摺疊前" if tag_in_view else "在摺疊後或全文可見"))
    checks.append(("PASS" if len(ctas) == 1 else "WARN", "行動呼籲", f"{len(ctas)} 種：{ctas}" if ctas else "沒有，這篇要觀眾做什麼？"))
    if args.keywords:
        kws = [k.strip() for k in args.keywords.split(",") if k.strip()]
        miss = [k for k in kws if k not in body]
        checks.append(("PASS" if not miss else "WARN", "搜尋關鍵字", f"{len(kws) - len(miss)}/{len(kws)}" + (f"，缺：{','.join(miss)}" if miss else "")))
    print("CAPTION 檢查（繁中）\n" + "=" * 60)
    print("  動態牆可見區（前 %d 字元）：" % FEED_WINDOW)
    for line in visible.splitlines():
        print("  │ " + line)
    print("  └─ " + ("... 更多" if len(body) > FEED_WINDOW else "（全文可見）"))
    for status, name, msg in checks:
        print(f"  {status:<4}  {name:<8}  {msg}")
    bad = [c for c in checks if c[0] != "PASS"]
    print("-" * 60 + f"\n  結論：{'OK' if not bad else 'REVIEW'}")
    return 0 if not bad else 1


def cmd_human(text, args):
    changes = []
    inv = INVISIBLE_RE.findall(text)
    out = INVISIBLE_RE.sub("", text)
    for c in sorted(set(inv)):
        changes.append(f"不可見字元 U+{ord(c):04X} {unicodedata.name(c, '?')} ×{inv.count(c)} → 刪除")
    for a, b in TYPO:
        n = out.count(a)
        if n:
            out = out.replace(a, b)
            changes.append(f"標點 {a} ×{n} → {b}")
    for a, b in SLOP:
        n = out.count(a)
        if n:
            out = out.replace(a, b)
            changes.append(f"AI 味詞「{a}」×{n} → {('「' + b + '」') if b else '刪除'}")
    out = re.sub(r"^[，、。！\s]+", "", out, flags=re.M)        # 刪詞後留在行首的殘標點
    out = re.sub(r"[ \t]{2,}", " ", out)
    flags = [msg for rx, msg in STRUCTURAL if rx.search(out)]
    tags = HASHTAG_RE.findall(out)
    if len(tags) > HASHTAG_CAP:
        flags.append(f"hashtag {len(tags)} 個，超過 {HASHTAG_CAP}")
    han = max(1, len(HAN_RE.findall(text)))
    slop_hits = sum(1 for c in changes if c.startswith("AI 味詞"))
    density = slop_hits / han * 100
    score = max(0, 100 - density * 15 - len(inv) * 10 - len(flags) * 8)
    print("去 AI 味報告（繁中）\n" + "=" * 60)
    print(f"  自動修正 {len(changes)} 項，需手改 {len(flags)} 項 · AI 味詞密度 {density:.1f}/100 字")
    for c in changes:
        print("  ✓ " + c)
    for f in flags:
        print("  ! " + f)
    after_score = max(0, 100 - len(flags) * 8)
    print(f"  人味分數：修前 {score:.0f} → 修後 {after_score:.0f}（剩下的要自己改寫）")
    print("-" * 60 + "\n" + out)
    if args.write:
        with open(args.write, "w", encoding="utf-8") as fh:
            fh.write(out)
    return 0 if after_score >= 70 else 1


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("mode", choices=["hook", "caption", "human"])
    ap.add_argument("file")
    ap.add_argument("--keywords")
    ap.add_argument("--write")
    ap.add_argument("--cps", type=float, default=CHARS_PER_SEC)
    args = ap.parse_args()
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    with open(args.file, encoding="utf-8") as fh:
        text = fh.read()
    sys.exit({"hook": cmd_hook, "caption": cmd_caption, "human": cmd_human}[args.mode](text, args))


if __name__ == "__main__":
    main()
