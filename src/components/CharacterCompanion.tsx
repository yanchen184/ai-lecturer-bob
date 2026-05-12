/**
 * CharacterCompanion — ohwx_character video companion (state-machine version)
 *
 * Features:
 *   1. Scroll-aware: IntersectionObserver on [data-companion-section] → auto switch
 *   2. Hover-aware: hover any [data-companion-section] → preview that section's video
 *      (returns to scroll-driven state on mouseleave)
 *   3. Click reaction: clicking the character widget plays a one-shot reaction video,
 *      then returns to the previous state when it ends.
 *   4. Crossfade transitions between videos (no black flash).
 *   5. Collapse/expand: × hides into a small chip, ? expands back.
 *
 * Animations driven by two stacked <video> elements; we swap which one is "front"
 * on every state change and let CSS opacity transition do the crossfade.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type SectionKey =
  | 'hero'
  | 'band'
  | 'production'
  | 'portfolio'
  | 'about'
  | 'skills'
  | 'courses'
  | 'faq'
  | 'contact'
  | 'latest';

const BASE = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
const v = (file: string) => `${BASE}/character/${file}`;

const SECTION_VIDEOS: Record<SectionKey, { src: string; label: string }> = {
  hero:       { src: v('hero_wave.mp4'),        label: '揮手' },
  band:       { src: v('skills_think.mp4'),     label: '思考' },
  production: { src: v('production_point.mp4'), label: '介紹' },
  portfolio:  { src: v('latest_reading.mp4'),   label: '翻書' },
  about:      { src: v('about_nod.mp4'),        label: '點頭' },
  skills:     { src: v('skills_think.mp4'),     label: '思考' },
  courses:    { src: v('faq_explain.mp4'),      label: '介紹' },
  faq:        { src: v('faq_explain.mp4'),      label: '解釋' },
  contact:    { src: v('findme_invite.mp4'),    label: '招手' },
  latest:     { src: v('latest_reading.mp4'),   label: '翻書' },
};

const DEFAULT_SECTION: SectionKey = 'hero';

// Reaction = play hero_wave (the most energetic clip) one-shot when user clicks
// the character. After it ends, return to scroll-driven section.
const REACTION = { src: v('hero_wave.mp4'), label: 'YO!' };

export default function CharacterCompanion() {
  // The section currently driven by scroll (IntersectionObserver result)
  const [scrollSection, setScrollSection] = useState<SectionKey>(DEFAULT_SECTION);

  // The section currently being hovered (overrides scroll while non-null)
  const [hoverSection, setHoverSection] = useState<SectionKey | null>(null);

  // Click-triggered one-shot reaction (overrides everything while true)
  const [isReacting, setIsReacting] = useState(false);

  const [collapsed, setCollapsed] = useState(false);

  // Two stacked video refs for crossfade
  const videoARef = useRef<HTMLVideoElement | null>(null);
  const videoBRef = useRef<HTMLVideoElement | null>(null);
  const [frontIsA, setFrontIsA] = useState(true);
  const [aSrc, setASrc] = useState(SECTION_VIDEOS[DEFAULT_SECTION].src);
  const [bSrc, setBSrc] = useState<string>('');

  // Compute the effective video that should be playing
  const effective = useMemo(() => {
    if (isReacting) return REACTION;
    const key = hoverSection ?? scrollSection;
    return SECTION_VIDEOS[key];
  }, [isReacting, hoverSection, scrollSection]);

  // Scroll observer
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const anchors = document.querySelectorAll<HTMLElement>('[data-companion-section]');
    if (anchors.length === 0) return;

    const visible = new Map<HTMLElement, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            visible.set(e.target as HTMLElement, e.intersectionRatio);
          } else {
            visible.delete(e.target as HTMLElement);
          }
        }
        let best: HTMLElement | null = null;
        let bestRatio = 0;
        visible.forEach((ratio, el) => {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            best = el;
          }
        });
        if (best) {
          const key = (best as HTMLElement).dataset.companionSection as SectionKey | undefined;
          if (key && SECTION_VIDEOS[key]) setScrollSection(key);
        }
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    anchors.forEach((a) => observer.observe(a));
    return () => observer.disconnect();
  }, []);

  // Hover listeners (attached once, delegated)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const anchors = document.querySelectorAll<HTMLElement>('[data-companion-section]');

    const onEnter = (e: Event) => {
      const el = e.currentTarget as HTMLElement;
      const key = el.dataset.companionSection as SectionKey | undefined;
      if (key && SECTION_VIDEOS[key]) setHoverSection(key);
    };
    const onLeave = () => setHoverSection(null);

    anchors.forEach((a) => {
      a.addEventListener('mouseenter', onEnter);
      a.addEventListener('mouseleave', onLeave);
    });
    return () => {
      anchors.forEach((a) => {
        a.removeEventListener('mouseenter', onEnter);
        a.removeEventListener('mouseleave', onLeave);
      });
    };
  }, []);

  // Crossfade: when effective.src changes, load it into the back video and swap front
  useEffect(() => {
    const targetSrc = effective.src;
    const front = frontIsA ? videoARef.current : videoBRef.current;
    if (front && front.src.endsWith(targetSrc)) return; // already showing

    // Push the new src to the back video element, then flip front/back
    if (frontIsA) {
      setBSrc(targetSrc);
    } else {
      setASrc(targetSrc);
    }
  }, [effective.src, frontIsA]);

  // When the "back" video gets a new src, wait for it to be ready, then flip
  useEffect(() => {
    const back = frontIsA ? videoBRef.current : videoARef.current;
    if (!back) return;
    const targetSrc = effective.src;
    if (!back.src.endsWith(targetSrc)) return;

    const onCanPlay = () => {
      back.play().catch(() => {/* autoplay blocked */});
      setFrontIsA((prev) => !prev);
    };
    back.addEventListener('canplay', onCanPlay, { once: true });
    back.load();
    return () => back.removeEventListener('canplay', onCanPlay);
  }, [aSrc, bSrc, effective.src, frontIsA]);

  // When reaction video ends, return to scroll/hover state
  const onReactionEnded = useCallback(() => {
    setIsReacting(false);
  }, []);

  useEffect(() => {
    const front = frontIsA ? videoARef.current : videoBRef.current;
    if (!front) return;
    front.removeEventListener('ended', onReactionEnded);
    if (isReacting && front.src.endsWith(REACTION.src)) {
      // Reaction plays once (no loop), listen for ended
      front.loop = false;
      front.addEventListener('ended', onReactionEnded);
    } else {
      // Normal mode: loop
      front.loop = true;
    }
    return () => front.removeEventListener('ended', onReactionEnded);
  }, [frontIsA, isReacting, onReactionEnded]);

  // Click on character widget → trigger reaction
  const triggerReaction = useCallback(() => {
    if (isReacting) return;
    setIsReacting(true);
  }, [isReacting]);

  if (collapsed) {
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
        {/* Two stacked video elements for crossfade */}
        <video
          ref={videoARef}
          autoPlay
          loop
          muted
          playsInline
          src={aSrc}
          className="absolute inset-0 block w-full h-full object-cover transition-opacity duration-500"
          style={{ opacity: frontIsA ? 1 : 0 }}
        />
        {bSrc && (
          <video
            ref={videoBRef}
            autoPlay
            loop
            muted
            playsInline
            src={bSrc}
            className="absolute inset-0 block w-full h-full object-cover transition-opacity duration-500"
            style={{ opacity: frontIsA ? 0 : 1 }}
          />
        )}

        {/* Label chip */}
        <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-[var(--color-neub-yellow)] text-[10px] uppercase tracking-widest font-mono font-black border border-black pointer-events-none">
          {effective.label}
        </div>

        {/* Close button */}
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

        {/* Subtle click hint when not reacting */}
        {!isReacting && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-white/80 backdrop-blur-sm text-[9px] uppercase tracking-widest font-mono font-black border border-black pointer-events-none opacity-60">
            click me
          </div>
        )}
      </div>
    </div>
  );
}
