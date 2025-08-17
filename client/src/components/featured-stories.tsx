import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import { markdownToText } from "@/lib/html-to-markdown";
import { Link } from "wouter";
import type { BlogPostWithDetails } from "@shared/schema";
import { ContentSkeleton, LoadingSpinner } from "@/components/loading-animations";

export default function FeaturedStories() {
  const { data: featuredPosts, isLoading } = useQuery<BlogPostWithDetails[]>({
    queryKey: ["/api/blog-posts/featured"],
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
              <LoadingSpinner size="lg" text="Loading featured content..." />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <ContentSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="featured-stories" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-playfair font-bold text-forest-green mb-4">
            Featured Stories
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Discover the latest breakthroughs in agricultural technology and sustainable farming practices
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredPosts?.map((story, index) => {
            const isHero = index === 0;
            
            return (
              <Link key={story.id} href={`/blog/${story.slug}`}>
                <article className={`group cursor-pointer ${isHero ? 'md:col-span-2 lg:col-span-2' : ''}`}>
                  <div className="bg-white rounded-none overflow-hidden transition-all duration-300 hover:shadow-xl border border-gray-100">
                    <div className="relative">
                      <img
                        src={story.featuredImage}
                        alt={story.title}
                        className={`w-full object-cover ${isHero ? 'h-80 md:h-96' : 'h-72'}`}
                      />
                      
                      {/* Featured Badge */}
                      <div className="absolute top-4 left-4">
                        <span className="inline-block px-3 py-1 bg-forest-green text-white text-xs font-medium uppercase tracking-wide">
                          Featured
                        </span>
                      </div>
                    </div>
                    
                    <div className={`p-6 ${isHero ? 'md:p-8' : ''}`}>
                      {/* Date */}
                      <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">
                        {formatDate(story.createdAt)}
                      </div>
                      
                      {/* Title */}
                      <h3 className={`font-bold text-gray-900 mb-4 leading-tight group-hover:text-forest-green transition-colors ${
                        isHero ? 'text-3xl md:text-4xl' : 'text-2xl'
                      }`}>
                        {story.title}
                      </h3>
                      
                      {/* Excerpt */}
                      <p className={`text-gray-600 mb-6 leading-relaxed ${
                        isHero ? 'text-lg line-clamp-4' : 'text-base line-clamp-3'
                      }`}>
                        {markdownToText(story.excerpt)}
                      </p>
                      
                      {/* Read Time Only */}
                      <div className="flex items-center justify-end">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">{story.readTime} min read</span>
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
