import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Clock, Calendar, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { markdownToText } from "@/lib/html-to-markdown";
import type { BlogPostWithDetails } from "@shared/schema";

interface RelatedPostsByTagsProps {
  currentPostId: number | string;
  currentPostTags: string[];
}

export default function RelatedPostsByTags({ currentPostId, currentPostTags }: RelatedPostsByTagsProps) {
  const { data: posts, isLoading } = useQuery<BlogPostWithDetails[]>({
    queryKey: ["/api/blog-posts"],
  });

  if (isLoading || !posts || !currentPostTags || currentPostTags.length === 0) {
    return null;
  }

  // Find posts that share tags with current post, excluding current post
  const relatedPosts = posts
    .filter(post => 
      post.id !== currentPostId && 
      post.tags && 
      post.tags.some(tag => currentPostTags.includes(tag))
    )
    .map(post => ({
      ...post,
      matchingTags: post.tags?.filter(tag => currentPostTags.includes(tag)) || [],
      tagScore: post.tags?.filter(tag => currentPostTags.includes(tag)).length || 0
    }))
    .sort((a, b) => b.tagScore - a.tagScore) // Sort by number of matching tags
    .slice(0, 3); // Show top 3 related posts

  if (relatedPosts.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-white border-t border-gray-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-playfair font-bold text-gray-900 mb-4">
            Continue Your Reading Journey
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover more insights on related topics that might interest you
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {relatedPosts.map((post) => (
            <Card key={post.id} className="group hover:shadow-lg transition-all duration-300 border-gray-200 hover:border-forest-green/20">
              <Link href={`/blog/${post.slug}`}>
                <div className="cursor-pointer">
                  {post.featuredImage && (
                    <div className="aspect-video overflow-hidden rounded-t-lg">
                      <img
                        src={post.featuredImage}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  
                  <CardContent className="p-6">
                    {/* Show first tag if available */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="mb-3">
                        <Badge 
                          className="text-xs font-medium bg-forest-green text-white"
                        >
                          {post.tags[0]}
                        </Badge>
                      </div>
                    )}

                    <h3 className="font-semibold text-lg text-gray-900 mb-3 group-hover:text-forest-green transition-colors line-clamp-2">
                      {post.title}
                    </h3>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {markdownToText(post.excerpt)}
                    </p>

                    {/* Matching Tags */}
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {post.matchingTags.slice(0, 3).map((tag) => (
                          <Badge 
                            key={tag} 
                            variant="outline" 
                            className="text-xs border-forest-green/30 text-forest-green"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {post.matchingTags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{post.matchingTags.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(post.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{post.readTime} min read</span>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-forest-green group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </div>
              </Link>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/">
            <button className="inline-flex items-center gap-2 bg-forest-green text-white px-6 py-3 rounded-lg hover:bg-forest-green/90 transition-colors">
              <span>Explore All Articles</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}