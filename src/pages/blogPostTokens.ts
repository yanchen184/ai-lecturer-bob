import type { CSSProperties } from 'react';
import type { BlogStyle } from '../contexts/BlogStyleContext';

/**
 * Visual tokens that diverge between the Neub and Anti blog post views.
 * Logic (TOC, share, IntersectionObserver) stays shared in BlogPost.tsx;
 * this file only supplies *how it looks*.
 */

export interface BlogPostTokens {
  /** Root wrapper — fonts + base color. */
  rootClassName: string;
  rootStyle: CSSProperties;

  /** Progress bar fill color. */
  progressColor: string;

  /** Breadcrumb hover highlight. */
  breadcrumbHover: string;

  /** Header block (inside article). */
  headerDividerStyle: CSSProperties;
  titleClassName: string;
  titleStyle?: CSSProperties;
  excerptClassName: string;
  excerptStyle?: CSSProperties;
  metaClassName: string;
  metaStyle?: CSSProperties;

  /** Share buttons (inline and CTA block). */
  shareChipBase: string;
  shareChipStyle: CSSProperties;
  shareLabelStyle?: CSSProperties;

  /** Card surfaces (Author card, Donate card, bottom share CTA). */
  cardClassName: string;
  cardStyle: CSSProperties;
  cardTitleClassName: string;

  /** TOC. */
  tocBoxClassName: string;
  tocBoxStyle: CSSProperties;
  tocLabelStyle?: CSSProperties;
  tocItemIdle: CSSProperties;
  tocItemActive: CSSProperties;
  tocDividerStyle: CSSProperties;

  /** Tag pill. */
  tagPillClassName: string;
  tagPillStyle: CSSProperties;

  /** Related posts grid. */
  relatedHeadingClassName: string;
  relatedHeadingStyle?: CSSProperties;
  relatedGridBorder: string;
  relatedCardClassName: string;
  relatedCardBorder: string;

  /** Back-to-blog chip. */
  backChipClassName: string;
  backChipStyle: CSSProperties;

  /** Body prose wrapper — sets font/line-height/max-width for article HTML. */
  proseClassName: string;
  proseStyle: CSSProperties;

  /** Whether to render the wrapper around parseContent with the theme class. */
  proseThemeWrapperClass: 'blog-prose-neub' | 'blog-prose-anti';
}

const neub: BlogPostTokens = {
  rootClassName: 'font-mono',
  rootStyle: { color: '#0a0a0a' },
  progressColor: '#0a0a0a',
  breadcrumbHover: '#ffff00',

  headerDividerStyle: { borderBottom: '2px solid #000' },
  titleClassName: 'text-4xl md:text-5xl lg:text-6xl font-black leading-[1.05] mb-6 tracking-tight',
  excerptClassName: 'text-base md:text-lg leading-relaxed opacity-80',
  metaClassName: 'text-xs uppercase tracking-widest mb-4 opacity-70 flex flex-wrap items-center gap-2',

  shareChipBase: 'px-3 py-1 text-xs uppercase tracking-widest transition-colors',
  shareChipStyle: { border: '2px solid #000', background: '#fff', color: '#000' },
  shareLabelStyle: { color: '#0a0a0a', opacity: 0.6 },

  cardClassName: 'p-6 bg-white',
  cardStyle: { border: '2px solid #000', boxShadow: '6px 6px 0 #0a0a0a' },
  cardTitleClassName: 'text-lg md:text-xl font-black',

  tocBoxClassName: 'p-4',
  tocBoxStyle: { border: '2px solid #000', background: '#fff' },
  tocLabelStyle: { fontWeight: 900, borderBottom: '2px solid #000', paddingBottom: '8px', marginBottom: '12px' },
  tocItemIdle: {},
  tocItemActive: { background: '#000', color: '#fff', fontWeight: 900 },
  tocDividerStyle: { borderTop: '2px solid #000' },

  tagPillClassName: 'px-2 py-0.5 text-xs transition-colors',
  tagPillStyle: { border: '1px solid #000', background: '#fff', color: '#000' },

  relatedHeadingClassName: 'text-2xl font-black uppercase tracking-tight mb-6',
  relatedGridBorder: '2px solid #000',
  relatedCardClassName: 'p-5 transition-colors',
  relatedCardBorder: '2px solid #000',

  backChipClassName: 'inline-block px-4 py-2 text-xs uppercase tracking-widest transition-colors',
  backChipStyle: { border: '2px solid #000', background: '#fff', color: '#000' },

  proseClassName: 'max-w-none text-base leading-loose',
  proseStyle: {},
  proseThemeWrapperClass: 'blog-prose-neub',
};

const anti: BlogPostTokens = {
  rootClassName: '',
  rootStyle: {
    color: '#1A1A1A',
    fontFamily: "Georgia, 'Noto Sans TC', 'Times New Roman', serif",
  },
  progressColor: '#C4A77D',
  breadcrumbHover: '#FFE066',

  headerDividerStyle: { borderBottom: '1px dashed #C4A77D' },
  titleClassName: 'mb-6',
  titleStyle: {
    fontFamily: "Georgia, 'Noto Sans TC', serif",
    fontSize: 'clamp(2.25rem, 5vw, 3.5rem)',
    fontWeight: 400,
    lineHeight: 1.15,
    letterSpacing: '-0.02em',
  },
  excerptClassName: '',
  excerptStyle: {
    color: '#4A4A4A',
    fontSize: '1.125rem',
    lineHeight: 1.8,
    fontFamily: 'Georgia, serif',
  },
  metaClassName: 'text-xs tracking-widest mb-4 flex flex-wrap items-center gap-2',
  metaStyle: {
    fontFamily: "'Courier Prime', 'Courier New', monospace",
    color: '#4A4A4A',
  },

  shareChipBase: 'px-3 py-1 text-xs tracking-widest transition-colors',
  shareChipStyle: {
    border: '1px dashed #C4A77D',
    background: 'transparent',
    color: '#1A1A1A',
    fontFamily: "'Courier Prime', monospace",
  },
  shareLabelStyle: {
    fontFamily: "'Courier Prime', monospace",
    color: '#4A4A4A',
  },

  cardClassName: 'p-6',
  cardStyle: {
    border: '1px dashed #C4A77D',
    background: '#FFF8DC',
  },
  cardTitleClassName: 'text-lg md:text-xl',

  tocBoxClassName: 'p-4',
  tocBoxStyle: {
    border: '1px dashed #C4A77D',
    background: '#FFF8DC',
  },
  tocLabelStyle: {
    fontFamily: "'Courier Prime', monospace",
    color: '#4A4A4A',
    borderBottom: '1px dashed #C4A77D',
    paddingBottom: '8px',
    marginBottom: '12px',
  },
  tocItemIdle: { fontFamily: 'Georgia, serif' },
  tocItemActive: {
    background: '#FFE066',
    color: '#1A1A1A',
    fontFamily: 'Georgia, serif',
    fontWeight: 600,
  },
  tocDividerStyle: { borderTop: '1px dashed #C4A77D' },

  tagPillClassName: 'px-2 py-0.5 text-xs transition-colors',
  tagPillStyle: {
    border: '1px dashed #C4A77D',
    background: 'transparent',
    color: '#1A1A1A',
    fontFamily: "'Courier Prime', monospace",
  },

  relatedHeadingClassName: 'mb-6',
  relatedHeadingStyle: {
    fontFamily: 'Georgia, serif',
    fontSize: '1.75rem',
    fontWeight: 400,
  },
  relatedGridBorder: '1px dashed #C4A77D',
  relatedCardClassName: 'p-5 transition-colors',
  relatedCardBorder: '1px dashed #C4A77D',

  backChipClassName: 'inline-block px-4 py-2 text-xs tracking-widest transition-colors',
  backChipStyle: {
    border: '1px dashed #C4A77D',
    background: 'transparent',
    color: '#1A1A1A',
    fontFamily: "'Courier Prime', monospace",
  },

  proseClassName: 'max-w-none',
  proseStyle: {
    fontSize: '1.0625rem',
    lineHeight: 1.85,
    fontFamily: "Georgia, 'Noto Sans TC', serif",
  },
  proseThemeWrapperClass: 'blog-prose-anti',
};

export function getBlogPostTokens(style: BlogStyle): BlogPostTokens {
  return style === 'anti' ? anti : neub;
}
