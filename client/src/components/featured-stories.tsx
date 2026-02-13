import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import { markdownToText } from "@/lib/html-to-markdown";
import { Link } from "wouter";
import type { BlogPostWithDetails } from "@shared/schema";
import { AdaptiveLoader, NatureContentSkeleton } from "@/components/loading";

export default function FeaturedStories() {
  const { data: featuredPosts, isLoading } = useQuery<BlogPostWithDetails[]>({
    queryKey: ["/api/blog-posts/featured", { includeDrafts: false }],
  });

  // Fetch updated profile data for author information
  const { data: profile } = useQuery({
    queryKey: ["/api/profile"],
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <section id="featured-stories" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-playfair font-bold text-forest-green mb-4">
              Featured Stories
            </h2>
            <div className="flex justify-center mb-8">
              <AdaptiveLoader size="lg" text="Loading featured content..." />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <NatureContentSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="featured-stories" className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Featured Stories
          </h2>
          <div className="w-16 h-1 bg-forest-green"></div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="space-y-1">
            {featuredPosts?.map((story, index) => (
              <Link key={story.id} href={`/blog/${story.slug}`}>
                <article className={`group cursor-pointer flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 px-4 hover:bg-gray-50 transition-all duration-200 ${
                  index !== featuredPosts.length - 1 ? 'border-b border-gray-100' : ''
                }`}>
                  <div className="flex items-center flex-1">
                    <h3 className="text-lg text-gray-900 group-hover:text-forest-green group-hover:translate-x-1 transition-all duration-200">
                      {story.title}
                    </h3>
                    <Badge className="bg-forest-green text-white ml-3 text-xs">
                      Featured
                    </Badge>
                  </div>
                  <span className="text-sm text-gray-500 mt-1 sm:mt-0 sm:ml-4 whitespace-nowrap">
                    {formatDate(story.createdAt)}
                  </span>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
