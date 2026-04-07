import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Calendar, Clock, User, X } from "lucide-react";
import { useState, useMemo, useRef, useEffect, type ReactNode } from "react";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import SEOHead from "@/components/seo-head";
import { markdownToText } from "@/lib/html-to-markdown";
import { AdaptiveLoader } from "@/components/loading";
import { stripMarkdown } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { useScrollReveal } from "@/hooks/useScrollReveal";

function RevealSection({ children, className = "" }: { children: ReactNode; className?: string }) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <div ref={ref} className={`transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"} ${className}`}>
      {children}
    </div>
  );
}

export default function PostsPage() {
  const { lang } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const [heroVisible, setHeroVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setHeroVisible(true), 100); return () => clearTimeout(t); }, []);
  const filtersReveal = useScrollReveal();

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

  const allTags = useMemo(() => Array.from(tagCounts.keys()).sort(), [tagCounts]);

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

    const grouped = filteredPosts.reduce((acc: any, post: any) => {
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

    return grouped;
  }, [filteredPosts, selectedTag, searchTerm]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedTag(null);
  };

  const hasActiveFilters = searchTerm !== "" || selectedTag !== null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sage-50 to-fresh-lime-50 flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AdaptiveLoader size="lg" text="Loading posts..." color="text-forest-green" />
          </div>
        </div>
      </div>
    );
  }

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

      <div className="min-h-screen bg-faint-lime/30">
        <Navigation />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12">
          {/* Header */}
          <div ref={heroRef} className="mb-20">
            <span className={`text-xs font-bold tracking-[0.4em] text-gray-400 uppercase mb-4 block transition-all duration-700 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              {lang === "ko" ? "지식 저장소" : "Knowledge Base"}
            </span>
            <h1 className={`text-5xl sm:text-6xl font-playfair font-bold text-gray-900 mb-8 leading-tight transition-all duration-700 delay-150 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
              {lang === "ko" ? (<>모든 블로그 <span className="italic">글</span></>) : (<>All Blog <span className="italic">Posts</span></>)}
            </h1>
            <p className={`text-xl text-gray-600 leading-relaxed max-w-3xl transition-all duration-700 delay-300 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              {lang === "ko"
                ? "농업 기술, 지속 가능한 농업, 그리고 솔루션에 대한 인사이트를 탐색하세요."
                : "Discover insights on agricultural technology, sustainable farming practices, and solutions."}
            </p>
          </div>

          {/* Search and Filters */}
          <div
            ref={filtersReveal.ref}
            className={`mb-8 space-y-4 transition-all duration-700 ${filtersReveal.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          >
            {/* Search */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder={lang === "ko" ? "글 검색..." : "Search posts..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-sage-300 focus:border-forest-green focus:ring-forest-green"
              />
            </div>

            {/* Tag Tree Cloud */}
            {allTags.length > 0 && (() => {
              const maxCount = Math.max(...tagCounts.values());
              const minCount = Math.min(...tagCounts.values());
              const range = maxCount - minCount || 1;

              // Sort tags by count descending for tree layout
              const sorted = [...allTags].sort((a, b) => (tagCounts.get(b) || 0) - (tagCounts.get(a) || 0));

              // Build tree rows: 1, 2, 3, 5, 7, 9... items per row (widening like a tree canopy)
              const rows: string[][] = [];
              let idx = 0;
              const rowSizes = [1, 2, 3, 5, 7, 9, 11, 13, 15];
              for (const size of rowSizes) {
                if (idx >= sorted.length) break;
                rows.push(sorted.slice(idx, idx + size));
                idx += size;
              }
              // Remaining tags go into the last row
              if (idx < sorted.length) {
                rows.push(sorted.slice(idx));
              }

              return (
                <div className="flex flex-col items-center gap-1 py-6">
                  <span className="text-xs font-bold tracking-[0.3em] text-gray-400 uppercase mb-3">
                    {lang === "ko" ? "태그 탐색" : "Explore Tags"}
                  </span>

                  {/* Tree canopy */}
                  {rows.map((row, ri) => (
                    <div key={ri} className="flex flex-wrap justify-center gap-x-3 gap-y-1.5" style={{ maxWidth: `${Math.min(100, 20 + ri * 12)}%` }}>
                      {row.map(tag => {
                        const count = tagCounts.get(tag) || 1;
                        const t = (count - minCount) / range; // 0..1
                        const fontSize = 11 + t * 18; // 11px to 29px
                        const opacity = 0.45 + t * 0.55; // 0.45 to 1
                        const isSelected = selectedTag === tag;
                        return (
                          <button
                            key={tag}
                            onClick={() => setSelectedTag(isSelected ? null : tag)}
                            className="transition-all duration-200 hover:scale-110 cursor-pointer rounded-sm px-1"
                            style={{
                              fontSize,
                              lineHeight: 1.6,
                              fontWeight: t > 0.5 ? 700 : t > 0.2 ? 500 : 400,
                              color: isSelected ? "#fff" : `rgba(45,80,22,${opacity})`,
                              background: isSelected ? "var(--forest-green, #2D5016)" : "transparent",
                            }}
                            title={`${tag} (${count})`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  ))}

                  {/* Tree trunk */}
                  <div className="flex flex-col items-center mt-1">
                    <div className="w-3 h-6 rounded-sm bg-forest-green/30" />
                    <div className="w-8 h-1.5 rounded-full bg-forest-green/15 mt-0.5" />
                  </div>
                </div>
              );
            })()}

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="text-center">
                <Button onClick={clearFilters} variant="ghost" size="sm">
                  <X className="h-4 w-4 mr-2" />
                  {lang === "ko" ? "필터 초기화" : "Clear filters"}
                </Button>
              </div>
            )}
          </div>

          {/* Posts List */}
          {Object.entries(groupedPosts).map(([period, posts]) => (
            <RevealSection key={period} className="mb-12">
              {period !== (lang === "ko" ? "전체 글" : "All Posts") && (
                <h2 className="text-2xl font-bold text-forest-green mb-6 font-playfair">
                  {period}
                </h2>
              )}
              
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="space-y-1">
                  {(posts as any[]).map((post, index) => (
                    <Link key={post.id} href={`/blog/${post.slug}`}>
                      <article className={`group cursor-pointer flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 px-4 hover:bg-gray-50 transition-all duration-200 ${
                        index !== (posts as any[]).length - 1 ? 'border-b border-gray-100' : ''
                      }`}>
                        <h3 className="text-lg text-gray-900 group-hover:text-forest-green group-hover:translate-x-1 transition-all duration-200 flex-1">
                          {stripMarkdown(post.title)}
                        </h3>
                        <span className="text-sm text-gray-500 mt-1 sm:mt-0 sm:ml-4 whitespace-nowrap">
                          {new Date(post.createdAt).toLocaleDateString(lang === "ko" ? "ko-KR" : "en-US", {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </article>
                    </Link>
                  ))}
                </div>
              </div>
            </RevealSection>
          ))}

          {/* No Results */}
          {filteredPosts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg mb-4">
                {lang === "ko" ? "조건에 맞는 글이 없습니다." : "No posts found matching your criteria."}
              </p>
              <Button onClick={clearFilters} variant="outline">
                {lang === "ko" ? "필터를 초기화하여 모든 글 보기" : "Clear filters to see all posts"}
              </Button>
            </div>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
}
