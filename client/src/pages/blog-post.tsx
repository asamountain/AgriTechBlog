import { useParams } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import JejuShell from "@/components/jeju-shell";
import SocialShare from "@/components/social-share";
import SEOHead from "@/components/seo-head";
import { formatDate, stripMarkdown } from "@/lib/utils";
import { Link } from "wouter";
import type { BlogPostWithDetails } from "@shared/schema";

import { useEffect, useMemo, useRef, useState } from "react";
import JejuPageSkeleton from "@/components/jeju-loading";
import ReactMarkdown from 'react-markdown';
import { stableParagraphId, extractTextFromChildren } from '@/lib/paragraph-utils';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import 'highlight.js/styles/github-dark.css';
import { ensureMarkdown } from '@/lib/html-to-markdown';
import CommentSection from "@/components/comments/comment-section";
import { useAnonymousUser } from "@/hooks/useAnonymousUser";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/language-context";
import { useTranslation, useTranslateText } from "@/hooks/useTranslation";

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const contentRef = useRef<HTMLDivElement>(null);

  const { userId } = useAnonymousUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { lang } = useLanguage();

  const {
    data: post,
    isLoading,
    error,
  } = useQuery<BlogPostWithDetails>({
    queryKey: [`/api/blog-post`, { slug, includeDrafts: true }],
    enabled: !!slug,
  });

  // Track blog post view when post loads
  useEffect(() => {
    if (post) {
      // trackEvent("page_view", "blog_post", post.title, post.readTime);
    }
  }, [post]);

  const { data: relatedPosts } = useQuery<BlogPostWithDetails[]>({
    queryKey: [`/api/blog-posts/${post?.id}/related`],
    enabled: !!post?.id,
  });

  const { data: allPosts } = useQuery<BlogPostWithDetails[]>({
    queryKey: ["/api/blog-posts"],
  });

  // Memoize plugin arrays to prevent ReactMarkdown re-renders
  const remarkPluginsMemo = useMemo(() => [remarkGfm], []);
  const rehypePluginsMemo = useMemo(() => [rehypeSlug, rehypeHighlight], []);

  // Stable paragraph ID components for ReactMarkdown
  const markdownComponents = useMemo(() => {
    let paragraphIndex = 0;
    return {
      p: ({ children, node, ...props }: any) => {
        const textContent = extractTextFromChildren(children);
        const pid = stableParagraphId(textContent, paragraphIndex++);
        return (
          <p {...props} data-paragraph-id={pid}>
            {children}
          </p>
        );
      },
      li: ({ children, node, ...props }: any) => {
        const textContent = extractTextFromChildren(children);
        const pid = stableParagraphId(textContent, paragraphIndex++);
        return (
          <li {...props} data-paragraph-id={pid}>
            {children}
          </li>
        );
      },
    };
  }, [post?.content]);

  // Auto-translate content and title when language is Korean (readers can switch back to the original)
  const [showOriginal, setShowOriginal] = useState(false);
  const { content: machineContent, isTranslating } = useTranslation(post?.content, slug, lang);
  const machineTitle = useTranslateText(post?.title, lang);
  const translatedContent = showOriginal ? post?.content : machineContent;
  const translatedTitle = showOriginal ? post?.title : machineTitle;
  const machineExcerpt = useTranslateText(post?.excerpt, lang);
  const translatedExcerpt = showOriginal ? post?.excerpt : machineExcerpt;
  const isMachineTranslated = lang === "ko" && !!machineContent && machineContent !== post?.content;

  // Memoize the entire ReactMarkdown output
  const renderedContent = useMemo(() => (
    <ReactMarkdown
      remarkPlugins={remarkPluginsMemo}
      rehypePlugins={rehypePluginsMemo}
      components={markdownComponents}
    >
      {ensureMarkdown(translatedContent || '')}
    </ReactMarkdown>
  ), [remarkPluginsMemo, rehypePluginsMemo, markdownComponents, translatedContent]);

  const [tocItems, setTocItems] = useState<{ id: string; text: string; level: number }[]>([]);

  useEffect(() => {
    const root = contentRef.current;
    if (!root) {
      setTocItems([]);
      return;
    }
    const items = Array.from(root.querySelectorAll<HTMLElement>("h2[id], h3[id]")).map((el) => ({
      id: el.id,
      text: el.textContent || "",
      level: el.tagName === "H3" ? 3 : 2,
    }));
    setTocItems(items);
  }, [renderedContent, post?.id]);

  const scrollToId = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (isLoading) {
    return <JejuPageSkeleton variant="post" />;
  }

  if (error || !post) {
    return (
      <JejuShell headerLeft={["[SYSTEM] ANNOUNCE.V1", "[FOCUS] ECOLOGICAL AGRICULTURE"]} headerRight={["POST NO. --", "NOT FOUND"]}>
        <div className="jg-body">
          <main className="jg-main">
            <div className="jg-post">
              <p className="jg-meta">[ERROR] 404</p>
              <h1 className="jg-post-title jg-post-title--md">{lang === "ko" ? "글을 찾을 수 없습니다." : "Article not found."}</h1>
              <p className="jg-post-lede">
                {lang === "ko"
                  ? "찾으시는 글이 없거나 다른 곳으로 옮겨졌습니다."
                  : "The article you're looking for doesn't exist or has been moved."}
              </p>
              <div className="jg-actions">
                <Link href="/" className="jg-btn jg-btn--solid">
                  {lang === "ko" ? "홈으로" : "Back home"}
                </Link>
                <Link href="/posts" className="jg-btn">
                  {lang === "ko" ? "모든 글" : "All entries"}
                </Link>
              </div>
            </div>
          </main>
        </div>
      </JejuShell>
    );
  }

  // Generate SEO data for maximum AI chatbot and search engine visibility
  const currentUrl = `${window.location.origin}/blog/${post.slug}`;
  const keywords = [
    ...(post.tags || []),
    post.title.toLowerCase(),
    'agricultural technology',
    'precision farming',
    'smart agriculture'
  ];

  // Generate enhanced OG image URL with post-specific data
  const ogImageUrl = post ? 
    `${window.location.origin}/api/og-image?title=${encodeURIComponent(post.title)}&category=${encodeURIComponent(post.tags?.[0] || 'Technology')}&author=San&excerpt=${encodeURIComponent(stripMarkdown(post.excerpt).substring(0, 100))}` :
    `${window.location.origin}/api/og-image?title=Blog Post`;

  // Use featured image if available, otherwise use generated OG image
  const socialImage = post?.featuredImage && post.featuredImage.trim() !== '' 
    ? post.featuredImage 
    : ogImageUrl;

  const displayTitle = stripMarkdown(translatedTitle || post.title);
  const titleSize = displayTitle.length > 70 ? " jg-post-title--sm" : displayTitle.length > 36 ? " jg-post-title--md" : "";
  const created = new Date(post.createdAt);
  const validDate = !isNaN(created.getTime());
  const pad = (n: number) => String(n).padStart(2, "0");
  const dateDots = validDate ? `${created.getFullYear()}.${pad(created.getMonth() + 1)}.${pad(created.getDate())}` : "--";
  const postNo = `${validDate ? String(created.getFullYear()).slice(2) : "--"}-${String(post.id).slice(-3)}`;
  const primaryTag = post.tags?.[0] || "Field Note";
  const excerptText = stripMarkdown(translatedExcerpt || post.excerpt || "");
  const postTags = post.tags || [];
  const tagRelated = (allPosts || [])
    .filter((p) => p.id !== post.id && p.tags?.some((tag) => postTags.includes(tag)))
    .map((p) => ({ post: p, score: p.tags?.filter((tag) => postTags.includes(tag)).length || 0 }))
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.post);
  const related = (tagRelated.length > 0 ? tagRelated : relatedPosts || []).filter((p) => p.id !== post.id).slice(0, 5);

  return (
    <>
      <SEOHead
        title={`${post.title} - San's Agricultural Technology Blog`}
        description={stripMarkdown(post.excerpt)}
        keywords={keywords}
        image={socialImage}
        url={currentUrl}
        type="article"
        tags={post?.tags || []}
        category={post?.tags?.[0] || 'Agricultural Technology'}
        readingTime={post.readTime}
        wordCount={post.content.split(/\s+/).length}
        publishedTime={post.createdAt instanceof Date ? post.createdAt.toISOString() : post.createdAt}
        modifiedTime={post.updatedAt instanceof Date ? post.updatedAt.toISOString() : post.updatedAt}
      />

      <JejuShell
        headerLeft={["[SYSTEM] ANNOUNCE.V1", "[FOCUS] ECOLOGICAL AGRICULTURE"]}
        headerRight={[`POST NO. ${postNo}`, dateDots]}
      >
        <div className="jg-body">
          <main className="jg-main">
            <article className="jg-post">
              <Link href="/posts" className="jg-back">
                {lang === "ko" ? "← 모든 글" : "← All entries"}
              </Link>

              {post.featuredImage && (
                <figure className="jg-hero" style={{ margin: "0 0 32px" }}>
                  <img src={post.featuredImage} alt={post.title} />
                  <figcaption className="jg-hero-tag">{`FIG.01 — ${primaryTag} // AS-44`}</figcaption>
                </figure>
              )}

              <p className="jg-meta">{`${lang === "ko" ? "[분류]" : "[CATEGORY]"} ${primaryTag}`}</p>
              <h1 className={`jg-post-title${titleSize}`}>{displayTitle}</h1>
              {excerptText && <p className="jg-post-lede">{excerptText}</p>}

              <div className="jg-actions">
                <a
                  href="#comments"
                  className="jg-btn jg-btn--solid"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToId("comments");
                  }}
                >
                  {lang === "ko" ? "댓글 보기" : "Read comments"}
                </a>
                <span className="jg-btn">{lang === "ko" ? `${post.readTime}분 읽기` : `${post.readTime} min read`}</span>
              </div>

              <section className="jg-box" aria-label="Table of details">
                <div className="jg-box-head">
                  <span className="jg-box-dot" aria-hidden="true" />
                  {lang === "ko" ? "[T.O.D.] 상세 정보" : "[T.O.D.] Table of Details"}
                </div>
                <div className="jg-box-grid">
                  <div className="jg-box-cell">
                    <span className="jg-box-label">{lang === "ko" ? "게시일" : "Published"}</span>
                    <time
                      className="jg-box-value"
                      dateTime={post.createdAt instanceof Date ? post.createdAt.toISOString() : post.createdAt}
                    >
                      {dateDots}
                    </time>
                  </div>
                  <div className="jg-box-cell">
                    <span className="jg-box-label">{lang === "ko" ? "읽는 시간" : "Read time"}</span>
                    <span className="jg-box-value">{`${post.readTime} MIN`}</span>
                  </div>
                  <div className="jg-box-cell">
                    <span className="jg-box-label">{lang === "ko" ? "태그" : "Tags"}</span>
                    <span className="jg-box-value">
                      {post.tags && post.tags.length > 0 ? post.tags.slice(0, 3).join(" / ").toUpperCase() : "—"}
                    </span>
                  </div>
                  <div className="jg-box-cell">
                    <span className="jg-box-label">{lang === "ko" ? "글쓴이" : "Author"}</span>
                    <span className="jg-box-value">SAN // AS-44</span>
                  </div>
                </div>
              </section>

              {post.summary && (
                <section className="jg-box" aria-label="Summary">
                  <div className="jg-box-head">
                    <span className="jg-box-dot" aria-hidden="true" />
                    {lang === "ko" ? "[SUMMARY] 요약" : "[SUMMARY] Article Summary"}
                  </div>
                  <p className="jg-summary">{post.summary}</p>
                </section>
              )}

              {tocItems.length > 1 && (
                <details className="jg-box jg-toc" aria-label="Table of contents">
                  <summary className="jg-box-head">
                    <span className="jg-box-dot" aria-hidden="true" />
                    {`${lang === "ko" ? "[T.O.C.] 목차" : "[T.O.C.] Table of Contents"} (${tocItems.length})`}
                  </summary>
                  <ul className="jg-box-list">
                    {tocItems.map((item, i) => (
                      <li key={item.id}>
                        <a
                          href={`#${item.id}`}
                          className={item.level === 3 ? "jg-toc-sub" : undefined}
                          onClick={(e) => {
                            e.preventDefault();
                            scrollToId(item.id);
                          }}
                        >
                          <span className="jg-toc-num">{pad(i + 1)}</span>
                          <span>{item.text}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </details>
              )}

              {isTranslating && <div className="jg-notice">{lang === "ko" ? "번역 중..." : "Translating..."}</div>}
              {(isMachineTranslated || showOriginal) && lang === "ko" && (
                <div className="jg-translate-note">
                  <span>{showOriginal ? "[ORIGINAL] 원문(영어)을 보고 있어요" : "[AUTO-TRANSLATED] 자동 번역된 글이에요"}</span>
                  <button type="button" onClick={() => setShowOriginal((v) => !v)}>
                    {showOriginal ? "번역 보기" : "원문 보기"}
                  </button>
                </div>
              )}

              <div ref={contentRef} className="jg-prose">
                {renderedContent}
              </div>

              {post.tags && post.tags.length > 0 && (
                <nav className="jg-pills" aria-label="Tags" style={{ paddingBottom: 0 }}>
                  {post.tags.map((tag) => (
                    <Link key={tag} href={`/tags/${encodeURIComponent(tag)}`} className="jg-pill">
                      {tag}
                    </Link>
                  ))}
                </nav>
              )}

              <section id="comments" className="jg-section">
                <p className="jg-label">{lang === "ko" ? "[COMMENTS] 댓글" : "[COMMENTS]"}</p>
                <CommentSection postId={post.id.toString()} postTitle={post.title} />
              </section>

              <section className="jg-section">
                <p className="jg-label">{lang === "ko" ? "[SHARE] 공유" : "[SHARE]"}</p>
                <SocialShare
                  url={`/blog/${post.slug}`}
                  title={post.title}
                  excerpt={stripMarkdown(post.excerpt)}
                />
              </section>

              {related.length > 0 && (
                <section className="jg-section">
                  <h2 className="jg-section-title">{lang === "ko" ? "관련 글" : "Related entries"}</h2>
                  <div className="jg-index-head">
                    <span>{lang === "ko" ? "코드" : "Code"}</span>
                    <span>{lang === "ko" ? "글 제목" : "Article Title"}</span>
                    <span>{lang === "ko" ? "상태" : "Status"}</span>
                  </div>
                  {related.map((item, index) => {
                    const d = new Date(item.createdAt);
                    const year = isNaN(d.getTime()) ? "----" : d.getFullYear();
                    return (
                      <Link key={item.id} href={`/blog/${item.slug}`} className="jg-row">
                        <span className="jg-row-code">{`AT-${year}-${String(index + 1).padStart(3, "0")}`}</span>
                        <span className="jg-row-title">{item.title}</span>
                        <span className="jg-row-status">
                          <span className="jg-status">{lang === "ko" ? "읽기" : "Read"}</span>
                        </span>
                      </Link>
                    );
                  })}
                </section>
              )}
            </article>
          </main>
        </div>
      </JejuShell>
    </>
  );
}
