/**
 * CharacterCompanion — 角色 + idle 對話泡泡版。
 *
 * 行為:
 *   - 預設 9 格 gaze 跟著鼠標走;clip 一律播完才換(hard cut)
 *   - 點角色 → hero_wave + 蹦出招呼泡泡
 *   - Idle:每 ~7 秒蹦一句碎念,泡泡停留 ~5 秒後關閉(typewriter 逐字)
 *   - Scroll 到不同 section → 切到「導覽句池」,搭配對應 reaction clip
 *     (about_nod / skills_think / production_point / latest_reading / findme_invite)
 *   - 跟使用者互動時(鼠標移動 / 點擊)會延後 idle 觸發,不會打斷使用者
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const BASE = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
const v = (file: string) => `${BASE}/character/${file}`;

type GazeKey = 'TL' | 'TC' | 'TR' | 'ML' | 'MC' | 'MR' | 'BL' | 'BC' | 'BR';
const GAZE: Record<GazeKey, { src: string; label: string }> = {
  TL: { src: v('gaze/TL.mp4'), label: '↖' },
  TC: { src: v('gaze/TC.mp4'), label: '↑' },
  TR: { src: v('gaze/TR.mp4'), label: '↗' },
  ML: { src: v('gaze/ML.mp4'), label: '←' },
  MC: { src: v('gaze/MC.mp4'), label: '·' },
  MR: { src: v('gaze/MR.mp4'), label: '→' },
  BL: { src: v('gaze/BL.mp4'), label: '↙' },
  BC: { src: v('gaze/BC.mp4'), label: '↓' },
  BR: { src: v('gaze/BR.mp4'), label: '↘' },
};

const REACTION = { src: v('hero_wave.mp4'), label: 'YO!' };

// scroll-triggered reaction clips
const SECTION_CLIPS: Record<string, { src: string; label: string }> = {
  about: { src: v('about_nod.mp4'), label: 'ABOUT' },
  skills: { src: v('skills_think.mp4'), label: 'STACK' },
  production: { src: v('production_point.mp4'), label: 'PROD' },
  portfolio: { src: v('production_point.mp4'), label: 'WORK' },
  latest: { src: v('latest_reading.mp4'), label: 'READ' },
  courses: { src: v('skills_think.mp4'), label: 'COURSE' },
  faq: { src: v('faq_explain.mp4'), label: 'FAQ' },
  contact: { src: v('findme_invite.mp4'), label: 'PING' },
};

// 對話池 — 工程師碎念 + 課程導覽混搭
type Quip = { text: string; weight?: number };
const IDLE_QUIPS: Quip[] = [
  { text: '這支 video 是真的 mp4,不是 CSS 硬幹的。' },
  { text: '我每天用 Claude Code 對線 production bug。' },
  { text: '按 ⌘K 比滑滾輪快,試試看。' },
  { text: '工程師教工程師,不是「AI 包裝師」教你。' },
  { text: '往下滑,看我做過什麼。' },
  { text: '醫療 AI、K8s、Spring Boot — 都不是 demo,是上線過的。' },
  { text: '會 prompt 不等於會寫系統。差很多。' },
  { text: '碎念中... 你可以滑鼠移過來戳我。' },
];

const SECTION_QUIPS: Record<string, Quip[]> = {
  hero: [
    { text: '往下滑,我帶你看。' },
    { text: '左邊那些數字是真的,不是 marketing。' },
  ],
  band: [
    { text: '內訓現場的 code = production 同一段。沒有 demo 用程式碼。' },
  ],
  production: [
    { text: '這裡每一個都是真的在跑的系統。' },
    { text: 'GitHub 連結點下去就看得到。' },
  ],
  portfolio: [
    { text: '醫療 AI 是 6 個 repo 拼起來的,不是單一專案。' },
    { text: 'K8s 教材中文圈最完整的之一,我自己寫的。' },
  ],
  about: [
    { text: '8 年電商 + AI 雙棧,不是換跑道,是疊上去。' },
    { text: '我寫 Java 也寫 Python,前端 TS 也碰。' },
  ],
  skills: [
    { text: 'Java / Spring Boot 是主力,AI agent 是現在每天在做的。' },
    { text: '不會的就學,沒有「我只會 X」。' },
  ],
  courses: [
    { text: '企業內訓為主,公開班偶爾開。' },
    { text: '想包班直接 ping 我。' },
  ],
  faq: [
    { text: '常見問題在這。沒寫到的直接問。' },
  ],
  latest: [
    { text: '部落格寫的都是踩坑後整理的,不是教科書翻譯。' },
    { text: 'Claude Code memory 治理那篇,內訓現場最多人問。' },
  ],
  contact: [
    { text: '想合作?直接寫信。我不演經紀人。' },
    { text: 'bobchen184@gmail.com — 真的會回。' },
  ],
};

function mouseToGaze(x: number, y: number): GazeKey {
  const col = x < window.innerWidth / 3 ? 'L' : x < window.innerWidth * 2 / 3 ? 'C' : 'R';
  const row = y < window.innerHeight / 3 ? 'T' : y < window.innerHeight * 2 / 3 ? 'M' : 'B';
  return (row + col) as GazeKey;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

interface CharacterCompanionProps {
  embedded?: boolean;
}

export default function CharacterCompanion({ embedded = false }: CharacterCompanionProps) {
  const [gazeKey, setGazeKey] = useState<GazeKey>('MC');
  const [isReacting, setIsReacting] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const [sectionClip, setSectionClip] = useState<{ src: string; label: string } | null>(null);
  const [currentSection, setCurrentSection] = useState<string>('hero');

  // 對話泡泡
  const [bubbleText, setBubbleText] = useState<string>('');
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [typedChars, setTypedChars] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const desired = useMemo(() => {
    if (isReacting) return REACTION;
    if (sectionClip) return sectionClip;
    return GAZE[gazeKey];
  }, [isReacting, sectionClip, gazeKey]);
  const [playing, setPlaying] = useState(GAZE.MC);

  const desiredRef = useRef(desired);
  useEffect(() => {
    desiredRef.current = desired;
  }, [desired]);

  const isReactingRef = useRef(isReacting);
  useEffect(() => {
    isReactingRef.current = isReacting;
  }, [isReacting]);

  const lastMouseRef = useRef({ x: 0, y: 0 });
  const lastInteractionRef = useRef(Date.now());

  // 影片播完才換 clip
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onEnded = () => {
      if (isReactingRef.current && playing.src === REACTION.src) {
        setIsReacting(false);
        const next = sectionClip ?? GAZE[mouseToGaze(lastMouseRef.current.x, lastMouseRef.current.y)];
        setPlaying(next);
        return;
      }
      // section clip 也是 one-shot,播完回 gaze
      if (sectionClip && playing.src === sectionClip.src) {
        setSectionClip(null);
        const next = GAZE[mouseToGaze(lastMouseRef.current.x, lastMouseRef.current.y)];
        setPlaying(next);
        return;
      }
      const next = desiredRef.current;
      if (next.src !== playing.src) {
        setPlaying(next);
      } else {
        video.currentTime = 0;
        video.play().catch(() => { /* autoplay blocked */ });
      }
    };

    video.addEventListener('ended', onEnded);
    return () => video.removeEventListener('ended', onEnded);
  }, [playing.src, sectionClip]);

  // 鼠標 → gaze
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onMove = (e: MouseEvent) => {
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
      lastInteractionRef.current = Date.now();
      const key = mouseToGaze(e.clientX, e.clientY);
      setGazeKey((prev) => (prev === key ? prev : key));
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  // scroll → 偵測當前 section
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>('[data-companion-section]')
    );
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // 取「最靠近視窗中央且可見比例最高」的 section
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length === 0) return;
        const name = visible[0].target.getAttribute('data-companion-section');
        if (!name) return;
        setCurrentSection((prev) => {
          if (prev === name) return prev;
          // 切到新 section → 觸發對應 clip + 從該 section 池抽一句
          const clip = SECTION_CLIPS[name];
          if (clip) setSectionClip(clip);
          const pool = SECTION_QUIPS[name];
          if (pool && pool.length > 0) {
            showBubble(pickRandom(pool).text);
          }
          return name;
        });
      },
      { threshold: [0.25, 0.5, 0.75] }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 切 video src 時強制 load + play
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.load();
    video.play().catch(() => { /* blocked */ });
  }, [playing.src]);

  // 對話泡泡:typewriter 逐字 + 自動關閉
  const bubbleTimerRef = useRef<number | null>(null);
  const typeTimerRef = useRef<number | null>(null);

  const showBubble = useCallback((text: string) => {
    // 清掉前一個泡泡的計時器
    if (bubbleTimerRef.current) {
      window.clearTimeout(bubbleTimerRef.current);
      bubbleTimerRef.current = null;
    }
    if (typeTimerRef.current) {
      window.clearInterval(typeTimerRef.current);
      typeTimerRef.current = null;
    }
    setBubbleText(text);
    setTypedChars(0);
    setBubbleVisible(true);

    // typewriter
    let i = 0;
    typeTimerRef.current = window.setInterval(() => {
      i += 1;
      setTypedChars(i);
      if (i >= text.length) {
        if (typeTimerRef.current) {
          window.clearInterval(typeTimerRef.current);
          typeTimerRef.current = null;
        }
      }
    }, 55);

    // 顯示 5 秒後關
    const totalShowMs = Math.max(3500, text.length * 55 + 3500);
    bubbleTimerRef.current = window.setTimeout(() => {
      setBubbleVisible(false);
    }, totalShowMs);
  }, []);

  // Idle 自動碎念
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const tick = window.setInterval(() => {
      const idleMs = Date.now() - lastInteractionRef.current;
      // 互動後 4 秒內不打擾;泡泡開著也不疊新的
      if (idleMs < 4000) return;
      if (bubbleVisible) return;
      // 70% 從當前 section 池抽,30% 從通用碎念抽
      const useSection = Math.random() < 0.7;
      const pool = useSection ? SECTION_QUIPS[currentSection] : null;
      const quip =
        pool && pool.length > 0 ? pickRandom(pool) : pickRandom(IDLE_QUIPS);
      showBubble(quip.text);
    }, 7000);
    return () => window.clearInterval(tick);
  }, [bubbleVisible, currentSection, showBubble]);

  // 清理計時器
  useEffect(() => {
    return () => {
      if (bubbleTimerRef.current) window.clearTimeout(bubbleTimerRef.current);
      if (typeTimerRef.current) window.clearInterval(typeTimerRef.current);
    };
  }, []);

  const triggerReaction = useCallback(() => {
    lastInteractionRef.current = Date.now();
    if (!isReacting) setIsReacting(true);
    showBubble('YO!點到我了。');
  }, [isReacting, showBubble]);

  // 顯示用的部分字串
  const displayedText = bubbleText.slice(0, typedChars);
  const isTyping = typedChars < bubbleText.length;

  if (collapsed && !embedded) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="hidden md:grid fixed bottom-4 right-4 z-50 w-12 h-12 rounded-full bg-[var(--color-neub-yellow)] border-2 border-black place-items-center font-black hover:scale-110 transition-transform"
        style={{ boxShadow: '3px 3px 0 #0a0a0a' }}
        aria-label="show character"
      >
        ?
      </button>
    );
  }

  // 共用泡泡 markup
  const bubble = bubbleVisible && bubbleText ? (
    <div
      className="absolute z-20 pointer-events-none"
      style={{
        left: '-12px',
        top: '-8px',
        transform: 'translateY(-100%)',
        maxWidth: 'min(280px, calc(100% + 24px))',
        minWidth: '180px',
      }}
    >
      <div
        className="relative bg-white border-2 border-black px-3 py-2 text-[12px] md:text-[13px] leading-snug font-mono"
        style={{ boxShadow: '4px 4px 0 var(--color-neub-yellow, #ffd60a)' }}
      >
        <span className="font-medium text-black">{displayedText}</span>
        {isTyping && <span className="inline-block w-[6px] h-[12px] bg-black ml-[2px] align-middle animate-pulse" />}
        {/* 尾巴:斜線從泡泡左下指向角色頭部 */}
        <svg
          className="absolute"
          style={{ left: '20px', bottom: '-14px' }}
          width="22"
          height="16"
          viewBox="0 0 22 16"
          aria-hidden="true"
        >
          <path d="M2 0 L20 0 L4 14 Z" fill="white" stroke="black" strokeWidth="2" strokeLinejoin="miter" />
        </svg>
      </div>
    </div>
  ) : null;

  if (embedded) {
    return (
      <div className="relative w-full h-full select-none">
        <div
          className="relative bg-white border-2 border-black overflow-hidden cursor-pointer w-full h-full"
          style={{ boxShadow: '6px 6px 0 #0a0a0a' }}
          onClick={triggerReaction}
          title="點我打招呼"
        >
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            src={playing.src}
            className="absolute inset-0 block w-full h-full object-cover"
            aria-label="陳彥彤 YC 動態形象"
          />
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-[var(--color-neub-yellow)] text-[10px] uppercase tracking-widest font-mono font-black border border-black pointer-events-none">
            {playing.label}
          </div>
          <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black text-white text-[10px] uppercase tracking-widest font-mono pointer-events-none">
            click me
          </div>
        </div>
        {bubble}
      </div>
    );
  }

  // 浮動模式
  return (
    <div
      className="hidden md:block fixed bottom-4 right-4 z-50 select-none"
      style={{ width: 'clamp(140px, 18vw, 220px)' }}
    >
      <div
        className="relative bg-white border-2 border-black overflow-hidden cursor-pointer"
        style={{ boxShadow: '4px 4px 0 #0a0a0a', aspectRatio: '480 / 832' }}
        onClick={triggerReaction}
        title="點我"
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          src={playing.src}
          className="absolute inset-0 block w-full h-full object-cover"
        />
        <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-[var(--color-neub-yellow)] text-[10px] uppercase tracking-widest font-mono font-black border border-black pointer-events-none">
          {playing.label}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setCollapsed(true);
          }}
          className="absolute top-1 right-1 w-6 h-6 grid place-items-center bg-white border border-black text-xs font-black hover:bg-[var(--color-neub-yellow)] z-10"
          aria-label="hide character"
        >
          ×
        </button>
      </div>
      {bubble}
    </div>
  );
}
