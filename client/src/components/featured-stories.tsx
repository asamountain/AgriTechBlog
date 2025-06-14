import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import { Link } from "wouter";
import type { BlogPostWithDetails } from "@shared/schema";

export default function FeaturedStories() {
  const { data: featuredPosts, isLoading } = useQuery<BlogPostWithDetails[]>({
    queryKey: ["/api/blog-posts/featured"],
  });

  if (isLoading) {
    return (
      <section id="featured-stories" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="h-10 bg-gray-200 rounded w-64 mx-auto mb-4 animate-pulse" />
            <div className="h-6 bg-gray-200 rounded w-96 mx-auto animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-200 rounded-2xl h-96 animate-pulse" />
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
          {featuredPosts?.map((story) => (
            <Link key={story.id} href={`/blog/${story.slug}`}>
              <div className="group relative cursor-pointer transform transition-all duration-500 hover:scale-105">
                {/* Background Image */}
                <div 
                  className="relative h-[28rem] bg-cover bg-center rounded-3xl overflow-hidden"
                  style={{ backgroundImage: `url('${story.featuredImage}')` }}
                >
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/70" />
                  
                  {/* Glassmorphism Card */}
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-2xl">
                      {/* Category Badge */}
                      <div className="mb-4">
                        <span 
                          className="inline-block px-3 py-1 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: story.category.color }}
                        >
                          {story.category.name}
                        </span>
                      </div>
                      
                      {/* Title */}
                      <h3 className="text-white font-bold text-2xl mb-4 leading-tight group-hover:text-fresh-lime transition-colors line-clamp-2">
                        {story.title}
                      </h3>
                      
                      {/* Divider */}
                      <div className="w-full h-px bg-white/30 mb-4" />
                      
                      {/* Author Info */}
                      <div className="text-white/90 text-sm font-light mb-3">
                        <span className="italic">By </span>
                        <span className="font-medium">{story.author.name}</span>
                      </div>
                      
                      {/* Excerpt */}
                      <p className="text-white/80 text-sm leading-relaxed font-light line-clamp-3 mb-4">
                        {story.excerpt}
                      </p>
                      
                      {/* Bottom Divider */}
                      <div className="w-full h-px bg-white/30 mb-3" />
                      
                      {/* Meta Info */}
                      <div className="flex justify-between items-center text-white/70 text-xs">
                        <span className="font-light">{formatDate(story.createdAt)}</span>
                        <span className="italic font-light">{story.readTime} min read</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
