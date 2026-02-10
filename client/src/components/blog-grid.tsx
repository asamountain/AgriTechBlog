import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { Link } from "wouter";
import { useState } from "react";
import type { BlogPostWithDetails } from "@shared/schema";
import { AdaptiveLoader, CompactNatureSkeleton } from "@/components/loading";

interface BlogGridProps {}

export default function BlogGrid({}: BlogGridProps) {
  const [page, setPage] = useState(0);
  const limit = 6;

  const { data: blogPosts, isLoading, error } = useQuery<BlogPostWithDetails[]>({
    queryKey: ["/api/blog-posts", { limit: (page + 1) * limit, offset: 0 }],
    retry: 1,
  });

  // Fetch updated profile data for author information
  const { data: profile } = useQuery({
    queryKey: ["/api/profile"],
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
  });

  const displayedPosts = blogPosts?.slice(0, (page + 1) * limit) || [];
  const hasMore = blogPosts && blogPosts.length > displayedPosts.length;

  if (isLoading) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Latest Articles
            </h2>
            <div className="flex items-center space-x-3">
              <div className="w-16 h-1 bg-forest-green"></div>
              <AdaptiveLoader size="md" text="Loading content..." showMessage={false} />
            </div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <CompactNatureSkeleton key={i} lines={2} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Latest Articles
            </h2>
            <div className="w-16 h-1 bg-forest-green"></div>
          </div>
          <div className="text-center py-16">
            <h3 className="text-2xl font-playfair font-bold text-gray-900 mb-4">
              Unable to load articles
            </h3>
            <p className="text-gray-600">
              We're experiencing technical difficulties. Please try again later.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
            <div className="space-y-1">
              {displayedPosts.map((post, index) => (
                <Link key={`${post.id}-${post.slug}-${index}`} href={`/blog/${post.slug}`}>
                  <article className="group cursor-pointer flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 px-4 rounded hover:bg-gray-50 transition-all duration-200">
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

            {hasMore && (
              <div className="text-center mt-12">
                <Button
                  onClick={() => setPage(page + 1)}
                  className="bg-forest-green hover:bg-forest-green/90 text-white font-medium py-3 px-8 uppercase tracking-wide text-sm transition-all duration-300"
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
