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
                  <Card className="group bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
                    <div 
                      className="relative h-48 bg-cover bg-center"
                      style={{ backgroundImage: `url('${post.featuredImage}')` }}
                    >
                      <div className="absolute top-3 left-3">
                        <Badge 
                          className="text-white font-medium text-xs"
                          style={{ backgroundColor: post.category.color }}
                        >
                          {post.category.name}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-sage-green transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          <span>{post.author.name}</span>
                          <span>•</span>
                          <span>{post.readTime} min read</span>
                        </div>
                        <span>{formatDate(post.createdAt)}</span>
                      </div>
                    </CardContent>
                  </Card>
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
