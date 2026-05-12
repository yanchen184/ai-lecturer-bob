/**
 * CharacterCompanion — ohwx_character video companion
 * Fixed bottom-right floating widget. Switches video based on scroll position.
 * Section-aware via IntersectionObserver on data-companion-section anchors.
 */
import { useEffect, useRef, useState } from 'react';

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

// Astro deploys with base path /ai-lecturer-bob. import.meta.env.BASE_URL gives '/ai-lecturer-bob/' in dev/build.
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

export default function CharacterCompanion() {
  const [section, setSection] = useState<SectionKey>(DEFAULT_SECTION);
  const [collapsed, setCollapsed] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Watch every [data-companion-section] anchor in the page
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
        // Pick the most-visible section
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
          if (key && SECTION_VIDEOS[key]) setSection(key);
        }
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    anchors.forEach((a) => observer.observe(a));
    return () => observer.disconnect();
  }, []);

  // Smooth video src swap (avoid flash)
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const target = SECTION_VIDEOS[section]?.src;
    if (!target) return;
    if (v.src.endsWith(target)) return;
    v.src = target;
    v.load();
    v.play().catch(() => {/* autoplay-blocked, ignore */});
  }, [section]);

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

  const current = SECTION_VIDEOS[section];

  return (
    <div
      className="fixed bottom-4 right-4 z-50 select-none"
      style={{ width: 'clamp(140px, 18vw, 220px)' }}
    >
      <div
        className="relative bg-white border-2 border-black overflow-hidden"
        style={{ boxShadow: '4px 4px 0 #0a0a0a' }}
      >
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          className="block w-full h-auto"
          src={current.src}
        />
        <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-[var(--color-neub-yellow)] text-[10px] uppercase tracking-widest font-mono font-black border border-black">
          {current.label}
        </div>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          className="absolute top-1 right-1 w-6 h-6 grid place-items-center bg-white border border-black text-xs font-black hover:bg-[var(--color-neub-yellow)]"
          aria-label="hide character"
        >
          ×
        </button>
      </div>
    </div>
  );
}
