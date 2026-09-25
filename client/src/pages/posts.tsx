import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useState, useMemo, useCallback } from "react";
import JejuShell from "@/components/jeju-shell";
import JejuPageSkeleton from "@/components/jeju-loading";
import SEOHead from "@/components/seo-head";
import { stripMarkdown } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";

const VISIBLE_TAGS = 14;

export default function PostsPage() {
  const { lang } = useLanguage();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showAllTags, setShowAllTags] = useState(false);

  const prefetchPost = useCallback((slug: string) => {
    queryClient.prefetchQuery({
      queryKey: [`/api/blog-post`, { slug }],
      queryFn: async () => {
        const response = await fetch(`/api/blog-post?slug=${slug}`);
        if (!response.ok) throw new Error("Failed to prefetch post");
        return response.json();
      },
      staleTime: 5 * 60 * 1000,
    });
  }, [queryClient]);

  const { data: posts, isLoading } = useQuery({
    queryKey: ["/api/blog-posts"],
    queryFn: async () => {
      const response = await fetch("/api/blog-posts?limit=200&includeDrafts=false");
      if (!response.ok) throw new Error("Failed to fetch posts");
      return response.json();
    },
  });

  // Extract all unique tags with counts
  const tagCounts = useMemo(() => {
    if (!posts) return new Map<string, number>();
    const counts = new Map<string, number>();
    posts.forEach((post: any) => {
      if (post.tags) {
        post.tags.forEach((tag: string) => counts.set(tag, (counts.get(tag) || 0) + 1));
      }
    });
    return counts;
  }, [posts]);

  const sortedTags = useMemo(
    () => Array.from(tagCounts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([tag]) => tag),
    [tagCounts],
  );

  // Filter posts based on search term and selected tag
  const filteredPosts = useMemo(() => {
    if (!posts) return [];

    return posts.filter((post: any) => {
      const matchesSearch = searchTerm === "" ||
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (post.tags && post.tags.some((tag: string) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        ));

      const matchesTag = selectedTag === null ||
        (post.tags && post.tags.includes(selectedTag));

      return matchesSearch && matchesTag;
    });
  }, [posts, searchTerm, selectedTag]);

  // Group posts by month for better organization
  const groupedPosts = useMemo(() => {
    const allLabel = lang === "ko" ? "전체 글" : "All Posts";
    if (!filteredPosts.length || selectedTag || searchTerm) {
      return { [allLabel]: filteredPosts };
    }

    return filteredPosts.reduce((acc: any, post: any) => {
      const month = new Date(post.createdAt).toLocaleDateString(lang === "ko" ? "ko-KR" : "en-US", {
        year: 'numeric',
        month: 'long'
      });

      if (!acc[month]) {
        acc[month] = [];
      }
      acc[month].push(post);
      return acc;
    }, {});
  }, [filteredPosts, selectedTag, searchTerm, lang]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedTag(null);
  };

  const hasActiveFilters = searchTerm !== "" || selectedTag !== null;

  if (isLoading) {
    return <JejuPageSkeleton variant="list" />;
  }

  const total = posts?.length ?? 0;
  const visibleTags = showAllTags ? sortedTags : sortedTags.slice(0, VISIBLE_TAGS);
  const hiddenCount = sortedTags.length - VISIBLE_TAGS;
  const pad = (n: number) => String(n).padStart(2, "0");
  let running = 0;

  return (
    <>
      <SEOHead
        title="All Posts | Agricultural Technology Blog"
        description="Explore our comprehensive collection of articles on agricultural technology, precision farming, and sustainable agriculture practices."
        keywords={["agricultural technology", "precision farming", "sustainable agriculture", "blog posts", "farming innovation", "AgriTech", "smart farming", "crop technology"]}
        image="/api/og-image?title=All Blog Posts&category=Agricultural Technology&author=San&excerpt=Comprehensive collection of agricultural technology articles"
        url={`${typeof window !== 'undefined' ? window.location.origin : ''}/posts`}
        type="website"
        author="San"
      />

      <JejuShell
        headerLeft={["[SYSTEM] ARCHIVE.V1", "[FOCUS] ECOLOGICAL AGRICULTURE"]}
        headerRight={["ALL ENTRIES", `${total} ${total === 1 ? "POST" : "POSTS"}`]}
      >
        <div className="jg-body">
          <main className="jg-main">
            <div className="jg-post">
              <p className="jg-meta">{lang === "ko" ? "[KNOWLEDGE BASE] 지식 저장소" : "[KNOWLEDGE BASE]"}</p>
              <h1 className="jg-post-title jg-post-title--md">{lang === "ko" ? "모든 블로그 글." : "All blog posts."}</h1>
              <p className="jg-post-lede">
                {lang === "ko"
                  ? "농업 기술, 지속 가능한 농업, 그리고 솔루션에 대한 인사이트를 탐색하세요."
                  : "Discover insights on agricultural technology, sustainable farming practices, and solutions."}
              </p>

              <div className="jg-search-wrap">
                <label className="jg-label" htmlFor="post-search">
                  {lang === "ko" ? "[SEARCH] 검색" : "[SEARCH]"}
                </label>
                <input
                  id="post-search"
                  type="search"
                  className="jg-search"
                  placeholder={lang === "ko" ? "글 검색..." : "Search posts..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {sortedTags.length > 0 && (
                <div className="jg-tagfilter">
                  <p className="jg-label">{lang === "ko" ? "[TAGS] 태그 탐색" : "[TAGS] EXPLORE"}</p>
                  <div className="jg-pills" style={{ paddingBottom: 0 }}>
                    {visibleTags.map((tag) => {
                      const active = selectedTag === tag;
                      return (
                        <button
                          key={tag}
                          type="button"
                          className={`jg-pill${active ? " is-active" : ""}`}
                          aria-pressed={active}
                          onClick={() => setSelectedTag(active ? null : tag)}
                        >
                          {`${tag} ${tagCounts.get(tag)}`}
                        </button>
                      );
                    })}
                    {hiddenCount > 0 && (
                      <button type="button" className="jg-pill jg-pill--ghost" onClick={() => setShowAllTags((v) => !v)}>
                        {showAllTags
                          ? lang === "ko" ? "접기 −" : "SHOW LESS −"
                          : lang === "ko" ? `+${hiddenCount}개 더 보기` : `+${hiddenCount} MORE`}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {hasActiveFilters && (
                <div className="jg-actions">
                  <button type="button" className="jg-btn" onClick={clearFilters}>
                    {lang === "ko" ? "필터 초기화 ×" : "Clear filters ×"}
                  </button>
                </div>
              )}

              {Object.entries(groupedPosts).map(([period, group]) => (
                <section className="jg-section" key={period}>
                  <p className="jg-label">{`[${period.toUpperCase()}] ${(group as any[]).length}`}</p>
                  <div className="jg-index">
                    <div className="jg-index-head">
                      <span>{lang === "ko" ? "코드" : "Code"}</span>
                      <span>{lang === "ko" ? "글 제목" : "Article Title"}</span>
                      <span>{lang === "ko" ? "날짜" : "Date"}</span>
                    </div>
                    {(group as any[]).map((post) => {
                      running += 1;
                      const d = new Date(post.createdAt);
                      const valid = !isNaN(d.getTime());
                      return (
                        <Link
                          key={post.id}
                          href={`/blog/${post.slug}`}
                          className="jg-row"
                          onMouseEnter={() => prefetchPost(post.slug)}
                        >
                          <span className="jg-row-code">{`AT-${valid ? d.getFullYear() : "----"}-${String(running).padStart(3, "0")}`}</span>
                          <span className="jg-row-title">{stripMarkdown(post.title)}</span>
                          <span className="jg-row-status">
                            <span className="jg-status">
                              {valid ? `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}` : "--"}
                            </span>
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              ))}

              {filteredPosts.length === 0 && (
                <div className="jg-index">
                  <div className="jg-row-empty">
                    {lang === "ko" ? "조건에 맞는 글이 없습니다." : "NO POSTS FOUND MATCHING YOUR CRITERIA."}
                  </div>
                  <div className="jg-actions">
                    <button type="button" className="jg-btn jg-btn--solid" onClick={clearFilters}>
                      {lang === "ko" ? "필터를 초기화하여 모든 글 보기" : "Clear filters to see all posts"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </JejuShell>
    </>
  );
}
