/**
 * CharacterCompanion — minimal video-only version.
 *
 * Rules:
 *   - Single <video>, hard cut between clips (no crossfade, no tilt, no flash).
 *   - Clip plays through to `ended`, THEN we evaluate state and switch.
 *   - Default: gaze grid (9 clips) based on mouse 3x3 position.
 *   - Click on the character: play a one-shot reaction (hero_wave), then back to gaze.
 *   - That's it. No QWER, no hover, no scroll, no tilt, no flash.
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

function mouseToGaze(x: number, y: number): GazeKey {
  const col = x < window.innerWidth / 3 ? 'L' : x < window.innerWidth * 2 / 3 ? 'C' : 'R';
  const row = y < window.innerHeight / 3 ? 'T' : y < window.innerHeight * 2 / 3 ? 'M' : 'B';
  return (row + col) as GazeKey;
}

interface CharacterCompanionProps {
  /** true = 鑲嵌進版型(用 relative + 撐滿父容器);false / 預設 = 浮動右下角 */
  embedded?: boolean;
}

export default function CharacterCompanion({ embedded = false }: CharacterCompanionProps) {
  const [gazeKey, setGazeKey] = useState<GazeKey>('MC');
  const [isReacting, setIsReacting] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Hard rule: whatever is on screen plays through to `ended` — nothing interrupts.
  // Inputs (mouse position, click) only update `desired`. On `ended` we commit
  // desired → playing.
  const desired = useMemo(
    () => (isReacting ? REACTION : GAZE[gazeKey]),
    [isReacting, gazeKey]
  );
  const [playing, setPlaying] = useState(GAZE.MC);

  // Latest desired for the ended handler (avoid re-binding on every change)
  const desiredRef = useRef(desired);
  useEffect(() => {
    desiredRef.current = desired;
  }, [desired]);

  // Was the just-finished clip a one-shot reaction? Clear the flag so the next
  // tick picks gaze, not REACTION again. Use a ref so the handler reads fresh.
  const isReactingRef = useRef(isReacting);
  useEffect(() => {
    isReactingRef.current = isReacting;
  }, [isReacting]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onEnded = () => {
      // If the clip that just ended was the reaction, retire the flag first.
      if (isReactingRef.current && playing.src === REACTION.src) {
        setIsReacting(false);
        // Pick gaze (or pending reaction queue if user clicked again)
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
  }, [playing.src]);

  // Mouse → gaze key (and keep raw coords in a ref so ended-handler can read latest)
  const lastMouseRef = useRef({ x: 0, y: 0 });
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onMove = (e: MouseEvent) => {
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
      const key = mouseToGaze(e.clientX, e.clientY);
      setGazeKey((prev) => (prev === key ? prev : key));
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  const triggerReaction = useCallback(() => {
    if (!isReacting) setIsReacting(true);
  }, [isReacting]);

  // When `playing.src` changes, force reload + play (React doesn't auto-reload on src change)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.load();
    video.play().catch(() => { /* autoplay blocked, user will click */ });
  }, [playing.src]);

  // 浮動模式才有「縮起來」按鈕;鑲嵌模式一直顯示
  if (collapsed && !embedded) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="fixed bottom-4 right-4 z-50 w-12 h-12 rounded-full bg-[var(--color-neub-yellow)] border-2 border-black grid place-items-center font-black hover:scale-110 transition-transform"
        style={{ boxShadow: '3px 3px 0 #0a0a0a' }}
        aria-label="show character"
      >
        ?
      </button>
    );
  }

  // 鑲嵌模式:撐滿父容器,沒有 z-index、沒有 fixed
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
      </div>
    );
  }

  // 浮動模式(舊行為,目前不用,留著備用)
  return (
    <div
      className="fixed bottom-4 right-4 z-50 select-none"
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
    </div>
  );
}
