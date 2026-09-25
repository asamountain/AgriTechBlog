import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import JejuShell from "@/components/jeju-shell";
import JejuPageSkeleton from "@/components/jeju-loading";
import { useLanguage } from "@/contexts/language-context";

interface BlogPostWithDetails {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  categoryId: number;
  authorId: number;
  userId: string;
  readTime: number;
  isFeatured: boolean;
  isPublished: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  author: {
    id: number;
    name: string;
    email: string;
    bio?: string;
    avatar?: string;
  };
  category: {
    id: number;
    name: string;
    slug: string;
    description?: string;
  };
}

// Cookie utilities for visitor tracking
const VISITOR_INTERACTIONS_KEY = 'visitor_tag_interactions';
const VISITOR_VIEWS_KEY = 'visitor_post_views';

interface VisitorInteractions {
  tagClicks: { [tag: string]: number };
  postViews: { [postId: string]: number };
  lastInteraction: number;
}

function getVisitorInteractions(): VisitorInteractions {
  try {
    const stored = localStorage.getItem(VISITOR_INTERACTIONS_KEY);
    return stored ? JSON.parse(stored) : {
      tagClicks: {},
      postViews: {},
      lastInteraction: Date.now()
    };
  } catch {
    return {
      tagClicks: {},
      postViews: {},
      lastInteraction: Date.now()
    };
  }
}

function updateVisitorInteractions(update: Partial<VisitorInteractions>) {
  try {
    const current = getVisitorInteractions();
    const updated = {
      ...current,
      ...update,
      lastInteraction: Date.now()
    };
    localStorage.setItem(VISITOR_INTERACTIONS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.warn('Failed to update visitor interactions:', error);
  }
}

function trackTagClick(tag: string) {
  const interactions = getVisitorInteractions();
  const tagClicks = { ...interactions.tagClicks };
  tagClicks[tag] = (tagClicks[tag] || 0) + 1;
  
  updateVisitorInteractions({ tagClicks });
  // trackEvent('tag_click', 'navigation', tag);
}

function trackPostView(postId: string) {
  const interactions = getVisitorInteractions();
  const postViews = { ...interactions.postViews };
  postViews[postId] = (postViews[postId] || 0) + 1;
  
  updateVisitorInteractions({ postViews });
}

// Personalized sorting based on visitor interactions
function sortPostsByPersonalization(posts: BlogPostWithDetails[], tag: string): BlogPostWithDetails[] {
  const interactions = getVisitorInteractions();
  
  return [...posts].sort((a, b) => {
    // 1. Posts the user has viewed get higher priority
    const aViews = interactions.postViews[a.id.toString()] || 0;
    const bViews = interactions.postViews[b.id.toString()] || 0;
    
    // 2. Posts with tags the user has clicked on more get priority
    const aTagScore = a.tags.reduce((score, postTag) => 
      score + (interactions.tagClicks[postTag] || 0), 0);
    const bTagScore = b.tags.reduce((score, postTag) => 
      score + (interactions.tagClicks[postTag] || 0), 0);
    
    // 3. Featured posts get slight boost
    const aFeaturedScore = a.isFeatured ? 5 : 0;
    const bFeaturedScore = b.isFeatured ? 5 : 0;
    
    // 4. Recency factor (newer posts get slight boost)
    const aRecency = new Date(a.createdAt).getTime();
    const bRecency = new Date(b.createdAt).getTime();
    const recencyWeight = 0.0001; // Small weight for recency
    
    const aScore = aViews * 10 + aTagScore * 3 + aFeaturedScore + (aRecency * recencyWeight);
    const bScore = bViews * 10 + bTagScore * 3 + bFeaturedScore + (bRecency * recencyWeight);
    
    return bScore - aScore; // Higher score first
  });
}

export default function TaggedPosts() {
  const { lang } = useLanguage();
  const ko = lang === "ko";
  const { tag } = useParams<{ tag: string }>();
  const decodedTag = decodeURIComponent(tag || '');
  
  const { data: allPosts, isLoading } = useQuery<BlogPostWithDetails[]>({
    queryKey: ['/api/blog-posts'],
  });

  const [sortedPosts, setSortedPosts] = useState<BlogPostWithDetails[]>([]);

  // Filter and sort posts when data loads
  useEffect(() => {
    if (allPosts && decodedTag) {
      const filteredPosts = allPosts.filter(post => 
        post.tags?.some(postTag => 
          postTag.toLowerCase() === decodedTag.toLowerCase()
        )
      );
      
      const personalizedPosts = sortPostsByPersonalization(filteredPosts, decodedTag);
      setSortedPosts(personalizedPosts);
      
      // Track tag click
      trackTagClick(decodedTag);
    }
  }, [allPosts, decodedTag]);

  const handlePostClick = (postId: string) => {
    trackPostView(postId);
  };

  const pad = (n: number) => String(n).padStart(2, "0");
  const formatDots = (dateString: string) => {
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? "--" : `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
  };

  if (isLoading) {
    return <JejuPageSkeleton variant="list" />;
  }

  const count = sortedPosts.length;
  const tagLabel = decodedTag.toUpperCase();
  const otherTags = Array.from(
    new Set(
      sortedPosts
        .flatMap((post) => post.tags || [])
        .filter((t) => t.toLowerCase() !== decodedTag.toLowerCase()),
    ),
  ).slice(0, 8);

  return (
    <JejuShell
      headerLeft={["[SYSTEM] TAG.INDEX.V1", "[FOCUS] ECOLOGICAL AGRICULTURE"]}
      headerRight={[`TAG // ${tagLabel}`, ko ? `${count}개의 글` : `${count} ${count === 1 ? "ENTRY" : "ENTRIES"}`]}
    >
      <div className="jg-body">
        <main className="jg-main">
          <div className="jg-post">
            <Link href="/posts" className="jg-back">
              {ko ? "← 모든 글" : "← All entries"}
            </Link>

            <p className="jg-meta">{ko ? "[TAG] 태그 모아보기" : "[TAG] INDEX"}</p>
            <h1 className={`jg-post-title${tagLabel.length > 18 ? " jg-post-title--md" : ""}`}>{`#${tagLabel}`}</h1>
            <p className="jg-post-lede">
              {ko
                ? `"${decodedTag}" 태그가 붙은 모든 글 — 관심사에 맞춰 정렬했어요.`
                : `Explore all posts tagged with "${decodedTag}" — personalized based on your interests.`}
            </p>

            <div className="jg-actions">
              <span className="jg-btn jg-btn--solid">{ko ? `${count}개의 글` : `${count} ${count === 1 ? "post" : "posts"} found`}</span>
            </div>

            {otherTags.length > 0 && (
              <nav className="jg-pills" aria-label="Related tags">
                {otherTags.map((t) => (
                  <Link key={t} href={`/tags/${encodeURIComponent(t)}`} className="jg-pill">
                    {t}
                  </Link>
                ))}
              </nav>
            )}

            {count > 0 ? (
              <div className="jg-index">
                <div className="jg-index-head">
                  <span>{ko ? "코드" : "Code"}</span>
                  <span>{ko ? "글 제목" : "Article Title"}</span>
                  <span>{ko ? "상태" : "Status"}</span>
                </div>
                {sortedPosts.map((post, index) => {
                  const d = new Date(post.createdAt);
                  const year = isNaN(d.getTime()) ? "----" : d.getFullYear();
                  return (
                    <Link
                      key={post.id}
                      href={`/blog/${post.slug}`}
                      className="jg-row"
                      onClick={() => handlePostClick(post.id.toString())}
                    >
                      <span className="jg-row-code">{`AT-${year}-${String(index + 1).padStart(3, "0")}`}</span>
                      <span className="jg-row-title">
                        {post.title}
                        <span className="jg-row-sub">{formatDots(post.createdAt)}</span>
                      </span>
                      <span className="jg-row-status">
                        <span className={`jg-status${post.isFeatured ? " jg-status--new" : ""}`}>
                          {post.isFeatured ? (ko ? "추천" : "Featured") : ko ? "읽기" : "Read"}
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="jg-index">
                <div className="jg-row-empty">{ko ? `"${decodedTag}" 태그가 붙은 글이 없습니다` : `NO ENTRIES FOUND FOR "${tagLabel}"`}</div>
                <div className="jg-actions">
                  <Link href="/" className="jg-btn jg-btn--solid">
                    {ko ? "모든 글 보기" : "Explore all posts"}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </JejuShell>
  );
}
