import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import type { BlogPost as BlogPostType } from '../data/blogPosts';
import { useBlogPosts } from '../hooks/useBlogPosts';

const SITE_URL = 'https://yanchen184.github.io/ai-lecturer-bob';

interface TocItem {
  id: string;
  text: string;
}

const slugify = (text: string): string => {
  return text
    .trim()
    .toLowerCase()
    .replace(/[\s]+/g, '-')
    .replace(/[^\p{L}\p{N}-]/gu, '');
};

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [readingProgress, setReadingProgress] = useState<number>(0);
  const [activeTocId, setActiveTocId] = useState<string>('');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>(
    'idle'
  );

  const { posts, isLoading } = useBlogPosts();

  const post = useMemo(() => {
    if (!slug) return null;
    return posts.find((p) => p.slug === slug) ?? null;
  }, [slug, posts]);

  // Get related posts — prefer posts sharing the most tags.
  // Fallback to same category when no tag overlap is found.
  const relatedPosts = useMemo(() => {
    if (!post) return [];
    const currentTags = new Set(post.tags);

    const scored = posts
      .filter((p) => p.id !== post.id)
      .map((p) => ({
        post: p,
        tagMatches: p.tags.filter((tag) => currentTags.has(tag)).length,
        sameCategory: p.category === post.category,
      }));

    const tagMatched = scored
      .filter((s) => s.tagMatches > 0)
      .sort((a, b) => {
        if (b.tagMatches !== a.tagMatches) {
          return b.tagMatches - a.tagMatches;
        }
        return (
          new Date(b.post.publishDate).getTime() -
          new Date(a.post.publishDate).getTime()
        );
      })
      .map((s) => s.post);

    if (tagMatched.length >= 2) {
      return tagMatched.slice(0, 3);
    }

    const fillers = scored
      .filter(
        (s) => s.sameCategory && !tagMatched.some((p) => p.id === s.post.id)
      )
      .map((s) => s.post);

    const combined = [...tagMatched, ...fillers];
    if (combined.length >= 3) {
      return combined.slice(0, 3);
    }

    // Final fallback: fill up to 3 with latest posts that aren't already listed.
    const latestFillers = scored
      .filter((s) => !combined.some((p) => p.id === s.post.id))
      .map((s) => s.post)
      .sort(
        (a, b) =>
          new Date(b.publishDate).getTime() -
          new Date(a.publishDate).getTime()
      );

    return [...combined, ...latestFillers].slice(0, 3);
  }, [post, posts]);

  // Parse TOC (## headings only) from raw content
  const tocItems = useMemo<TocItem[]>(() => {
    if (!post) return [];
    const items: TocItem[] = [];
    const used = new Set<string>();
    const regex = /^## (.+)$/gm;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(post.content)) !== null) {
      const text = match[1].trim();
      let id = slugify(text);
      if (!id) {
        id = `heading-${items.length}`;
      }
      let uniqueId = id;
      let suffix = 1;
      while (used.has(uniqueId)) {
        uniqueId = `${id}-${suffix}`;
        suffix += 1;
      }
      used.add(uniqueId);
      items.push({ id: uniqueId, text });
    }
    return items;
  }, [post]);

  useEffect(() => {
    if (!isLoading && !post) {
      navigate('/blog', { replace: true });
    }
  }, [post, isLoading, navigate]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  useEffect(() => {
    const handleScroll = (): void => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setReadingProgress(Math.min(100, Math.max(0, progress)));
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (tocItems.length === 0) return;

    const headings = tocItems
      .map((item) => document.getElementById(item.id))
      .filter((element): element is HTMLElement => element !== null);

    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveTocId(visible[0].target.id);
        }
      },
      {
        rootMargin: '-100px 0px -60% 0px',
        threshold: 0,
      }
    );

    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [tocItems, post]);

  // Event delegation for code-block copy buttons. parseContent outputs buttons
  // with data-copy=<uri-encoded source>, so we don't need React refs per block.
  useEffect(() => {
    if (!post) return;

    const handleClick = (event: MouseEvent): void => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest<HTMLButtonElement>('button[data-copy]');
      if (!button) return;

      const encoded = button.getAttribute('data-copy');
      if (!encoded) return;

      const originalText = button.textContent;
      const source = decodeURIComponent(encoded);
      navigator.clipboard
        .writeText(source)
        .then(() => {
          button.textContent = '[copied!]';
          button.style.background = '#ffff00';
          setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '';
          }, 1500);
        })
        .catch(() => {
          button.textContent = '[failed]';
          setTimeout(() => {
            button.textContent = originalText;
          }, 1500);
        });
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [post]);

  const formatDate = (dateString: string): string => {
    return dateString.replaceAll('-', '/');
  };

  // Parse markdown-like content to HTML with heading ids — raw style
  const parseContent = useCallback((content: string): string => {
    const usedIds = new Set<string>();
    const resolveId = (text: string): string => {
      let baseId = slugify(text);
      if (!baseId) {
        baseId = `heading-${usedIds.size}`;
      }
      let uniqueId = baseId;
      let suffix = 1;
      while (usedIds.has(uniqueId)) {
        uniqueId = `${baseId}-${suffix}`;
        suffix += 1;
      }
      usedIds.add(uniqueId);
      return uniqueId;
    };

    return (
      content
        // Code blocks first — protect their content from further parsing
        .replace(/```(\w*)\n?([\s\S]*?)```/g, (_match, lang: string, code: string) => {
          const trimmed = code.replace(/\n$/, '');
          const escaped = trimmed
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
          const langLabel = (lang || 'code').toLowerCase();
          const encoded = encodeURIComponent(trimmed);
          return `<div class="relative my-6 group" data-code-block><div class="flex items-center justify-between px-3 py-1.5 bg-[#ffff00] border-2 border-black border-b-0 text-[11px] font-black uppercase tracking-widest"><span>${langLabel}</span><button type="button" data-copy="${encoded}" class="px-2 py-0.5 border-2 border-black bg-white hover:bg-black hover:text-white transition-colors text-[10px]" aria-label="複製程式碼">[copy]</button></div><pre class="bg-black text-white p-4 overflow-x-auto text-sm font-mono border-2 border-black" style="box-shadow: 4px 4px 0 #0a0a0a;"><code>${escaped}</code></pre></div>`;
        })
        .replace(/^## (.+)$/gm, (_match, title: string) => {
          const id = resolveId(title.trim());
          return `<h2 id="${id}" class="text-2xl md:text-3xl font-black mt-12 mb-4 scroll-mt-28 border-b-2 border-black pb-2 uppercase tracking-tight">// ${title}</h2>`;
        })
        .replace(
          /^### (.+)$/gm,
          '<h3 class="text-xl font-black mt-8 mb-3">→ $1</h3>'
        )
        // Images: ![alt](url) — must come before links
        .replace(
          /!\[([^\]]*)\]\(([^)]+)\)/g,
          '<img src="$2" alt="$1" class="my-6 border-2 border-black max-w-full h-auto" style="box-shadow: 4px 4px 0 #0a0a0a;" loading="lazy" />'
        )
        // Links: [text](url)
        .replace(
          /\[([^\]]+)\]\(([^)]+)\)/g,
          (_match, text: string, url: string) => {
            const isExternal = /^https?:\/\//.test(url);
            const rel = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
            return `<a href="${url}"${rel} class="underline decoration-2 underline-offset-2 hover:bg-[#ffff00] font-bold">${text}</a>`;
          }
        )
        .replace(/\*\*(.+?)\*\*/g, '<strong class="font-black bg-[#ffff00] px-1">$1</strong>')
        .replace(
          /`([^`]+)`/g,
          '<code class="bg-black text-white px-1.5 py-0.5 text-sm font-mono">$1</code>'
        )
        .replace(
          /^> (.+)$/gm,
          '<blockquote class="border-l-4 border-black pl-4 my-6 italic opacity-80">" $1 "</blockquote>'
        )
        .replace(/^- (.+)$/gm, '<li class="ml-0 mb-2 pl-4 relative before:content-[\'→\'] before:absolute before:left-0">$1</li>')
        .replace(
          /^\d+\. (.+)$/gm,
          '<li class="ml-4 mb-2 list-decimal">$1</li>'
        )
        .replace(/\|(.+)\|/g, (match) => {
          const cells = match.split('|').filter((cell) => cell.trim());
          if (cells.every((cell) => cell.trim().match(/^-+$/))) {
            return '';
          }
          const isHeader = match.includes('---|');
          if (isHeader) return '';
          const cellHtml = cells
            .map(
              (cell) =>
                `<td class="border-2 border-black px-3 py-2">${cell.trim()}</td>`
            )
            .join('');
          return `<tr>${cellHtml}</tr>`;
        })
        .replace(/\n\n/g, '</p><p class="mb-4 leading-loose">')
        .replace(/\n/g, '<br/>')
        .replace(/^(.+)/, '<p class="mb-4 leading-loose">$1')
        .replace(/(.+)$/, '$1</p>')
    );
  }, []);

  const parsedContent = useMemo(() => {
    return post ? parseContent(post.content) : '';
  }, [post, parseContent]);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = post?.title ?? '';

  const twitterShareUrl = useMemo(() => {
    const url = encodeURIComponent(shareUrl);
    const text = encodeURIComponent(shareTitle);
    return `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
  }, [shareUrl, shareTitle]);

  const handleCopyLink = useCallback(async (): Promise<void> => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopyStatus('success');
    } catch {
      setCopyStatus('error');
    }
  }, [shareUrl]);

  useEffect(() => {
    if (copyStatus === 'idle') return;
    const timer = window.setTimeout(() => setCopyStatus('idle'), 2000);
    return () => window.clearTimeout(timer);
  }, [copyStatus]);

  const handleTocClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, id: string): void => {
      event.preventDefault();
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.history.replaceState(null, '', `#${id}`);
      }
    },
    []
  );

  if (isLoading) {
    return (
      <div
        className="font-mono"
        style={{ color: '#0a0a0a' }}
      >
        <div className="max-w-4xl mx-auto px-4 py-16 text-xs opacity-60 tracking-widest">
          loading post...
        </div>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  const postUrl = `${SITE_URL}/#/blog/${post.slug}`;
  const metaTitle = `${post.title} — AI 講師陳彥彤YC`;
  const keywords = post.tags.join(', ');

  return (
    <div
      className="font-mono"
      style={{ color: '#0a0a0a' }}
    >
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={post.excerpt} />
        <meta name="keywords" content={keywords} />
        <meta name="author" content={post.author} />
        <link rel="canonical" href={postUrl} />

        {/* Open Graph */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt} />
        <meta property="og:url" content={postUrl} />
        <meta property="article:published_time" content={post.publishDate} />
        <meta property="article:author" content={post.author} />
        {post.tags.map((tag) => (
          <meta key={tag} property="article:tag" content={tag} />
        ))}

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.excerpt} />

        {/* JSON-LD Article schema for richer Google results */}
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            description: post.excerpt,
            author: {
              '@type': 'Person',
              name: post.author,
            },
            datePublished: post.publishDate,
            dateModified: post.updateDate || post.publishDate,
            keywords,
            url: postUrl,
          })}
        </script>
      </Helmet>

      {/* Reading Progress Bar */}
      <div
        className="fixed top-0 left-0 right-0 z-50 h-1 bg-transparent"
        role="progressbar"
        aria-label="閱讀進度"
        aria-valuenow={Math.round(readingProgress)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full transition-[width] duration-150 ease-out"
          style={{ width: `${readingProgress}%`, background: '#0a0a0a' }}
        />
      </div>

      {/* Breadcrumb */}
      <nav
        className="max-w-5xl mx-auto px-4 py-4 text-xs uppercase tracking-widest opacity-70"
        aria-label="Breadcrumb"
      >
        <ol className="flex items-center flex-wrap gap-x-2">
          <li>
            <Link to="/" className="hover:bg-[#ffff00] transition-colors">
              ~/
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link to="/blog" className="hover:bg-[#ffff00] transition-colors">
              blog
            </Link>
          </li>
          <li>/</li>
          <li className="truncate max-w-[300px] font-black">{post.title}</li>
        </ol>
      </nav>

      {/* Main 2-column layout */}
      <div className="max-w-7xl mx-auto px-4 lg:grid lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-10">
        <div className="min-w-0">
          {/* Article Header */}
          <header className="py-8 border-b-2 border-black mb-8">
            <div className="text-xs uppercase tracking-widest mb-4 opacity-70 flex flex-wrap items-center gap-2">
              <span>[{post.category}]</span>
              <span>·</span>
              <time dateTime={post.publishDate}>
                {formatDate(post.publishDate)}
              </time>
              <span>·</span>
              <span>{post.readingTime}min read</span>
              <span>·</span>
              <span>by {post.author}</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.05] mb-6 tracking-tight">
              {post.title}
            </h1>
            <p className="text-base md:text-lg leading-relaxed opacity-80">
              {post.excerpt}
            </p>

            {/* Share Buttons */}
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="text-xs uppercase tracking-widest opacity-60">
                share:
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-1 text-xs uppercase tracking-widest border-2 border-black bg-white hover:bg-[#ffff00] transition-colors"
                aria-label="複製連結"
              >
                {copyStatus === 'success'
                  ? '[✓ copied]'
                  : copyStatus === 'error'
                  ? '[× failed]'
                  : '[copy link]'}
              </button>
              <a
                href={twitterShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 text-xs uppercase tracking-widest border-2 border-black bg-white hover:bg-[#ffff00] transition-colors"
                aria-label="分享到 X"
              >
                [x / twitter]
              </a>
            </div>
          </header>

          {/* Mobile TOC */}
          {tocItems.length > 0 && (
            <details className="lg:hidden mb-8 border-2 border-black">
              <summary className="cursor-pointer list-none p-4 flex items-center justify-between font-black uppercase tracking-widest text-xs hover:bg-[#ffff00]">
                <span>
                  // toc ({tocItems.length.toString().padStart(2, '0')})
                </span>
                <span>▼</span>
              </summary>
              <nav className="px-4 pb-4 border-t-2 border-black pt-3" aria-label="文章目錄">
                <ul className="space-y-1 text-sm">
                  {tocItems.map((item, index) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        onClick={(event) => handleTocClick(event, item.id)}
                        className="block py-1 hover:bg-[#ffff00] transition-colors"
                      >
                        <span className="opacity-50 mr-2">
                          {(index + 1).toString().padStart(2, '0')}
                        </span>
                        {item.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </details>
          )}

          {/* Article Content */}
          <article className="pb-16 min-h-[60vh]">
            <div
              className="max-w-none text-base leading-loose"
              dangerouslySetInnerHTML={{ __html: parsedContent }}
            />

            {/* Tags */}
            <div className="mt-12 pt-6 border-t-2 border-black">
              <div className="text-xs uppercase tracking-widest mb-3 opacity-60">
                // tags
              </div>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Link
                    key={tag}
                    to={`/blog?tag=${encodeURIComponent(tag)}`}
                    className="px-2 py-0.5 text-xs border border-black hover:bg-[#ffff00] transition-colors"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>
          </article>
        </div>

        {/* Desktop TOC Sidebar */}
        {tocItems.length > 0 && (
          <aside className="hidden lg:block" aria-label="文章目錄">
            <div className="sticky top-28">
              <div className="border-2 border-black p-4">
                <div className="text-xs font-black uppercase tracking-widest mb-3 border-b-2 border-black pb-2">
                  // toc
                </div>
                <nav>
                  <ul className="space-y-0 text-sm">
                    {tocItems.map((item, index) => {
                      const isActive = activeTocId === item.id;
                      return (
                        <li key={item.id}>
                          <a
                            href={`#${item.id}`}
                            onClick={(event) => handleTocClick(event, item.id)}
                            className={`block py-1.5 px-2 transition-colors ${
                              isActive
                                ? 'bg-black text-white font-black'
                                : 'hover:bg-[#ffff00]'
                            }`}
                          >
                            <span className="opacity-60 mr-2 text-xs">
                              {(index + 1).toString().padStart(2, '0')}
                            </span>
                            {item.text}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </nav>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Author Info */}
      <section className="max-w-5xl mx-auto px-4 pb-8">
        <div className="border-2 border-black p-6 bg-white">
          <div className="text-xs uppercase tracking-widest mb-4 opacity-60">
            // author
          </div>
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 border-2 border-black flex items-center justify-center flex-shrink-0"
              style={{ background: '#ffff00' }}
            >
              <span className="font-black text-xl">陳</span>
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-black mb-1">
                陳彥彤 <span className="text-xs opacity-60 font-normal ml-1">// 程式講師</span>
              </h4>
              <p className="text-sm leading-relaxed opacity-80">
                資深後端工程師，5-6 年電商核心系統開發經驗。Spring Boot / React /
                MySQL / Redis。把工作中踩過的坑轉化成教學內容。
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                <Link
                  to="/"
                  className="px-3 py-1 text-xs uppercase tracking-widest border-2 border-black bg-black text-white hover:bg-[#ffff00] hover:text-black transition-colors"
                >
                  [查看課程]
                </Link>
                <a
                  href="https://github.com/yanchen184"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 text-xs uppercase tracking-widest border-2 border-black bg-white hover:bg-[#ffff00] transition-colors"
                >
                  [github]
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Donate */}
      <section className="max-w-5xl mx-auto px-4 pb-12">
        <div
          className="border-2 border-black p-6 bg-white"
          style={{ boxShadow: '6px 6px 0 #0a0a0a' }}
        >
          <div className="text-xs uppercase tracking-widest mb-2 opacity-60">
            // support
          </div>
          <h3 className="text-xl md:text-2xl font-black mb-2">
            覺得有幫助？請我喝杯咖啡 ☕
          </h3>
          <p className="text-sm opacity-80 mb-4">
            如果這篇文章幫你省下時間或解決問題，歡迎小額支持。金額隨意，你的鼓勵是繼續寫的動力。
          </p>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: '☕ 咖啡', amount: 'NT$50' },
              { label: '🍱 便當', amount: 'NT$100' },
              { label: '🎉 大力', amount: 'NT$300' },
            ].map((option) => (
              <div
                key={option.amount}
                className="border-2 border-black p-3 text-center text-xs"
              >
                <div className="mb-1">{option.label}</div>
                <div className="font-black">{option.amount}</div>
              </div>
            ))}
          </div>

          <a
            href="https://ko-fi.com/TODO_填入你的Ko-fi帳號"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-2 text-sm uppercase tracking-widest font-black border-2 border-black bg-black text-white hover:bg-[#ffff00] hover:text-black transition-colors"
          >
            [ ☕ 請我喝咖啡 → ]
          </a>
        </div>
      </section>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pb-16 border-t-2 border-black pt-10">
          <h3 className="text-2xl font-black uppercase tracking-tight mb-6">
            /// RELATED
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-t-2 border-black">
            {relatedPosts.map((relatedPost: BlogPostType, index: number) => (
              <article
                key={relatedPost.id}
                className={`p-5 border-b-2 border-black hover:bg-[#ffff00] transition-colors ${
                  index < relatedPosts.length - 1 ? 'md:border-r-2' : ''
                }`}
              >
                <div className="text-xs uppercase tracking-widest mb-2 opacity-60">
                  [{relatedPost.category}] · {formatDate(relatedPost.publishDate)}
                </div>
                <h4 className="text-base md:text-lg font-black leading-tight mb-2">
                  <Link to={`/blog/${relatedPost.slug}`}>
                    {relatedPost.title}
                  </Link>
                </h4>
                <p className="text-xs opacity-80 line-clamp-2 mb-3">
                  {relatedPost.excerpt}
                </p>
                <Link
                  to={`/blog/${relatedPost.slug}`}
                  className="text-xs uppercase tracking-widest font-black hover:underline"
                >
                  read →
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Back to Blog */}
      <section className="max-w-5xl mx-auto px-4 pb-16 pt-4">
        <Link
          to="/blog"
          className="inline-block px-4 py-2 text-xs uppercase tracking-widest border-2 border-black bg-white hover:bg-[#ffff00] transition-colors"
        >
          [← back to blog]
        </Link>
      </section>
    </div>
  );
};

export default BlogPost;
