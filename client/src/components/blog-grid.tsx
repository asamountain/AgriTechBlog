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
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Latest Articles
          </h2>
          <div className="w-16 h-1 bg-forest-green"></div>
        </div>
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
              {displayedPosts.map((post, index) => {
                // Alternate between different layouts for visual interest
                const isLarge = index % 6 === 0;
                const isWide = index % 4 === 1;
                
                return (
                  <Link key={`${post.id}-${post.slug}-${index}`} href={`/blog/${post.slug}`}>
                    <article className={`group cursor-pointer ${
                      isLarge ? 'md:col-span-2 lg:col-span-2' : 
                      isWide ? 'md:col-span-2 lg:col-span-1' : ''
                    }`}>
                      <div className="bg-white rounded-none overflow-hidden transition-all duration-300 hover:shadow-lg">
                        <div className="relative">
                          <img
                            src={post.featuredImage}
                            alt={post.title}
                            className={`w-full object-cover ${
                              isLarge ? 'h-80 md:h-96' : 'h-64'
                            }`}
                          />
                          
                          {/* Category Badge */}
                          <div className="absolute top-4 left-4">
                            <span 
                              className="inline-block px-3 py-1 text-xs font-medium text-white uppercase tracking-wide"
                              style={{ backgroundColor: post.category.color }}
                            >
                              {post.category.name}
                            </span>
                          </div>
                        </div>
                        
                        <div className={`p-6 ${isLarge ? 'md:p-8' : ''}`}>
                          {/* Title */}
                          <h3 className={`font-bold text-gray-900 mb-3 leading-tight group-hover:text-forest-green transition-colors ${
                            isLarge ? 'text-2xl md:text-3xl' : 'text-xl'
                          }`}>
                            {post.title}
                          </h3>
                          
                          {/* Excerpt */}
                          <p className={`text-gray-600 mb-4 leading-relaxed ${
                            isLarge ? 'text-lg line-clamp-3' : 'text-base line-clamp-2'
                          }`}>
                            {post.excerpt}
                          </p>
                          
                          {/* Meta Info */}
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <div className="flex items-center space-x-4">
                              <span className="font-medium text-gray-700">{post.author.name}</span>
                              <span>{formatDate(post.createdAt)}</span>
                            </div>
                            <span className="text-xs uppercase tracking-wide">{post.readTime} min read</span>
                          </div>
                        </div>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>

            {hasMore && (
              <div className="text-center mt-16">
                <Button
                  onClick={() => setPage(page + 1)}
                  className="bg-forest-green hover:bg-forest-green text-white font-medium py-3 px-8 uppercase tracking-wide text-sm transition-all duration-300"
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
