import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Calendar, Clock, User, X } from "lucide-react";
import { useState, useMemo } from "react";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import SEOHead from "@/components/seo-head";
import { markdownToText } from "@/lib/html-to-markdown";
import { AdaptiveLoader } from "@/components/loading";

export default function PostsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const { data: posts, isLoading } = useQuery({
    queryKey: ["/api/blog-posts"],
    queryFn: async () => {
      const response = await fetch("/api/blog-posts?limit=200&includeDrafts=false");
      if (!response.ok) throw new Error("Failed to fetch posts");
      return response.json();
    },
  });

  // Extract all unique tags
  const allTags = useMemo(() => {
    if (!posts) return [];
    const tagsSet = new Set<string>();
    
    posts.forEach((post: any) => {
      if (post.tags) {
        post.tags.forEach((tag: string) => tagsSet.add(tag));
      }
    });
    
    return Array.from(tagsSet).sort();
  }, [posts]);

  // Filter posts based on search term and selected tag
  const filteredPosts = useMemo(() => {
    if (!posts) return [];
    
    return posts.filter((post: any) => {
      const matchesSearch = searchTerm === "" ||
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (post.tags && post.tags.some((tag: string) => 
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        ));

      const matchesTag = selectedTag === null ||
        (post.tags && post.tags.includes(selectedTag));

      return matchesSearch && matchesTag;
    });
  }, [posts, searchTerm, selectedTag]);

  // Group posts by month for better organization
  const groupedPosts = useMemo(() => {
    if (!filteredPosts.length || selectedTag || searchTerm) {
      return { "All Posts": filteredPosts };
    }

    const grouped = filteredPosts.reduce((acc: any, post: any) => {
      const month = new Date(post.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
      });
      
      if (!acc[month]) {
        acc[month] = [];
      }
      acc[month].push(post);
      return acc;
    }, {});

    return grouped;
  }, [filteredPosts, selectedTag, searchTerm]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedTag(null);
  };

  const hasActiveFilters = searchTerm !== "" || selectedTag !== null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sage-50 to-fresh-lime-50 flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AdaptiveLoader size="lg" text="Loading posts..." color="text-forest-green" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title="All Posts | Agricultural Technology Blog"
        description="Explore our comprehensive collection of articles on agricultural technology, precision farming, and sustainable agriculture practices."
        keywords={["agricultural technology", "precision farming", "sustainable agriculture", "blog posts", "farming innovation", "AgriTech", "smart farming", "crop technology"]}
        image="/api/og-image?title=All Blog Posts&category=Agricultural Technology&author=San&excerpt=Comprehensive collection of agricultural technology articles"
        url={`${typeof window !== 'undefined' ? window.location.origin : ''}/posts`}
        type="website"
        author="San"
      />

      <div className="min-h-screen bg-gradient-to-br from-sage-50 to-fresh-lime-50">
        <Navigation />
        
        <main className="container mx-auto px-6 pt-24 pb-12">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-forest-green font-playfair mb-4">
              All Blog Posts
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover insights on agricultural technology, sustainable farming practices, and innovative solutions for modern agriculture.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="mb-8 space-y-4">
            {/* Search */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-sage-300 focus:border-forest-green focus:ring-forest-green"
              />
            </div>

            {/* Filter Tags */}
            <div className="flex flex-wrap justify-center gap-2">
              <span className="text-sm font-medium text-gray-700 mr-2">Filter by tag:</span>
              {allTags.map(tag => (
                <Button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  variant={selectedTag === tag ? "default" : "outline"}
                  size="sm"
                  className={selectedTag === tag ? "bg-forest-green hover:bg-forest-green/90" : "border-gray-300 hover:border-forest-green"}
                >
                  {tag}
                </Button>
              ))}
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="text-center">
                <Button onClick={clearFilters} variant="ghost" size="sm">
                  <X className="h-4 w-4 mr-2" />
                  Clear filters
                </Button>
              </div>
            )}
          </div>

          {/* Posts List */}
          {Object.entries(groupedPosts).map(([period, posts]) => (
            <div key={period} className="mb-12">
              {period !== "All Posts" && (
                <h2 className="text-2xl font-bold text-forest-green mb-6 font-playfair">
                  {period}
                </h2>
              )}
              
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="space-y-1">
                  {(posts as any[]).map((post, index) => (
                    <Link key={post.id} href={`/blog/${post.slug}`}>
                      <article className={`group cursor-pointer flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 px-4 hover:bg-gray-50 transition-all duration-200 ${
                        index !== (posts as any[]).length - 1 ? 'border-b border-gray-100' : ''
                      }`}>
                        <h3 className="text-lg text-gray-900 group-hover:text-forest-green group-hover:translate-x-1 transition-all duration-200 flex-1">
                          {post.title}
                        </h3>
                        <span className="text-sm text-gray-500 mt-1 sm:mt-0 sm:ml-4 whitespace-nowrap">
                          {new Date(post.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </article>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* No Results */}
          {filteredPosts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg mb-4">No posts found matching your criteria.</p>
              <Button onClick={clearFilters} variant="outline">
                Clear filters to see all posts
              </Button>
            </div>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
}