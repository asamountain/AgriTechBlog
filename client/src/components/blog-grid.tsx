import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { Link } from "wouter";
import { useState } from "react";
import type { BlogPostWithDetails } from "@shared/schema";

interface BlogGridProps {
  selectedCategory: string | null;
}

export default function BlogGrid({ selectedCategory }: BlogGridProps) {
  const [page, setPage] = useState(0);
  const limit = 6;

  const { data: blogPosts, isLoading } = useQuery<BlogPostWithDetails[]>({
    queryKey: ["/api/blog-posts", { category: selectedCategory, limit: (page + 1) * limit, offset: 0 }],
  });

  const displayedPosts = blogPosts?.slice(0, (page + 1) * limit) || [];
  const hasMore = blogPosts && blogPosts.length > displayedPosts.length;

  if (isLoading) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-gray-200 rounded-xl h-80 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {displayedPosts.length === 0 ? (
          <div className="text-center py-16">
            <h3 className="text-2xl font-playfair font-bold text-gray-900 mb-4">
              No posts found
            </h3>
            <p className="text-gray-600">
              Try selecting a different category or check back later for new content.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayedPosts.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`}>
                  <div className="group relative cursor-pointer transform transition-all duration-500 hover:scale-105">
                    {/* Background Image */}
                    <div 
                      className="relative h-96 bg-cover bg-center rounded-3xl overflow-hidden"
                      style={{ backgroundImage: `url('${post.featuredImage}')` }}
                    >
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
                      
                      {/* Glassmorphism Card */}
                      <div className="absolute bottom-6 left-6 right-6">
                        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-2xl">
                          {/* Category Badge */}
                          <div className="mb-4">
                            <span 
                              className="inline-block px-3 py-1 rounded-full text-xs font-medium text-white"
                              style={{ backgroundColor: post.category.color }}
                            >
                              {post.category.name}
                            </span>
                          </div>
                          
                          {/* Title */}
                          <h3 className="text-white font-bold text-xl mb-3 leading-tight group-hover:text-fresh-lime transition-colors line-clamp-2">
                            {post.title}
                          </h3>
                          
                          {/* Divider */}
                          <div className="w-full h-px bg-white/30 mb-4" />
                          
                          {/* Author Info */}
                          <div className="text-white/90 text-sm font-light">
                            <span className="italic">By </span>
                            <span className="font-medium">{post.author.name}</span>
                          </div>
                          
                          {/* Excerpt */}
                          <p className="text-white/80 text-sm mt-3 line-clamp-2 leading-relaxed font-light">
                            {post.excerpt}
                          </p>
                          
                          {/* Bottom Divider */}
                          <div className="w-full h-px bg-white/30 mt-4 mb-3" />
                          
                          {/* Meta Info */}
                          <div className="flex justify-between items-center text-white/70 text-xs">
                            <span className="font-light">{formatDate(post.createdAt)}</span>
                            <span className="italic font-light">{post.readTime} min read</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {hasMore && (
              <div className="text-center mt-12">
                <Button
                  onClick={() => setPage(page + 1)}
                  className="bg-sage-green hover:bg-forest-green text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105"
                >
                  Load More Articles
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
