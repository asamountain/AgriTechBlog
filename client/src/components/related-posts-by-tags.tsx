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
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Related Articles
          </h2>
          <div className="w-16 h-1 bg-forest-green"></div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="space-y-1">
            {relatedPosts.map((post, index) => (
              <Link key={post.id} href={`/blog/${post.slug}`}>
                <article className={`group cursor-pointer flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 px-4 hover:bg-gray-50 transition-all duration-200 ${
                  index !== relatedPosts.length - 1 ? 'border-b border-gray-100' : ''
                }`}>
                  <h3 className="text-lg text-gray-900 group-hover:text-forest-green group-hover:translate-x-1 transition-all duration-200 flex-1">
                    {post.title}
                  </h3>
                  <span className="text-sm text-gray-500 mt-1 sm:mt-0 sm:ml-4 whitespace-nowrap">
                    {formatDate(post.createdAt)}
                  </span>
                </article>
              </Link>
            ))}
          </div>
        </div>

        <div className="text-center mt-8">
          <Link href="/">
            <button className="inline-flex items-center gap-2 text-forest-green hover:text-forest-green/80 font-medium transition-colors">
              <span>Explore All Articles</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}