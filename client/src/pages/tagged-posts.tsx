import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import JejuShell from "@/components/jeju-shell";
import JejuPageSkeleton from "@/components/jeju-loading";

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
    return <JejuPageSkeleton variant="list" label="Fetching tag index" />;
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
      headerRight={[`TAG // ${tagLabel}`, `${count} ${count === 1 ? "ENTRY" : "ENTRIES"}`]}
    >
      <div className="jg-body">
        <main className="jg-main">
          <div className="jg-post">
            <Link href="/posts" className="jg-back">
              ← All entries
            </Link>

            <p className="jg-meta">[TAG] INDEX</p>
            <h1 className={`jg-post-title${tagLabel.length > 18 ? " jg-post-title--md" : ""}`}>{`#${tagLabel}`}</h1>
            <p className="jg-post-lede">
              {`Explore all posts tagged with "${decodedTag}" — personalized based on your interests.`}
            </p>

            <div className="jg-actions">
              <span className="jg-btn jg-btn--solid">{`${count} ${count === 1 ? "post" : "posts"} found`}</span>
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
                  <span>Code</span>
                  <span>Article Title</span>
                  <span>Status</span>
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
                          {post.isFeatured ? "Featured" : "Read"}
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="jg-index">
                <div className="jg-row-empty">{`NO ENTRIES FOUND FOR "${tagLabel}"`}</div>
                <div className="jg-actions">
                  <Link href="/" className="jg-btn jg-btn--solid">
                    Explore all posts
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
