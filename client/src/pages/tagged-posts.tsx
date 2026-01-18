import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import { Badge } from "@/components/ui/badge";
import { Hash, Clock, Calendar } from "lucide-react";
import { Link } from "wouter";

import { ContentSkeleton } from "@/components/loading-animations";
import { markdownToText } from "@/lib/html-to-markdown";

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

  // Fetch updated profile data for author information
  const { data: profile } = useQuery({
    queryKey: ["/api/profile"],
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="pt-24 pb-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <ContentSkeleton />
            <div className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <ContentSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <main className="pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12 text-center">
            <div className="flex items-center justify-center mb-4">
              <Hash className="h-8 w-8 text-forest-green mr-3" />
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
                {decodedTag}
              </h1>
            </div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Explore all posts tagged with "{decodedTag}" - personalized based on your interests
            </p>
            <div className="mt-6">
              <Badge 
                variant="outline"
                className="border-forest-green text-forest-green p-golden-xs rounded-golden-sm text-lg"
              >
                {sortedPosts.length} {sortedPosts.length === 1 ? 'post' : 'posts'} found
              </Badge>
            </div>
          </div>

          {/* Posts List */}
          {sortedPosts.length > 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden max-w-4xl mx-auto">
              <div className="space-y-1">
                {sortedPosts.map((post, index) => (
                  <Link 
                    key={post.id} 
                    href={`/blog/${post.slug}`}
                    onClick={() => handlePostClick(post.id.toString())}
                  >
                    <article className={`group cursor-pointer flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 px-4 hover:bg-gray-50 transition-all duration-200 ${
                      index !== sortedPosts.length - 1 ? 'border-b border-gray-100' : ''
                    }`}>
                      <div className="flex items-center flex-1">
                        <h3 className="text-lg text-gray-900 group-hover:text-forest-green group-hover:translate-x-1 transition-all duration-200">
                          {post.title}
                        </h3>
                        {post.isFeatured && (
                          <Badge className="bg-forest-green text-white ml-3 text-xs">
                            Featured
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-gray-500 mt-1 sm:mt-0 sm:ml-4 whitespace-nowrap">
                        {formatDate(post.createdAt)}
                      </span>
                    </article>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <Hash className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                No posts found for "{decodedTag}"
              </h2>
              <p className="text-gray-600 mb-8">
                There are currently no published posts with this tag.
              </p>
              <Link href="/">
                <Badge className="bg-forest-green text-white hover:opacity-80 cursor-pointer p-golden-sm text-base">
                  Explore All Posts
                </Badge>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}