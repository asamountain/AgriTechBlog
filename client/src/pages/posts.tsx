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

export default function PostsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const { data: posts, isLoading } = useQuery({
    queryKey: ["/api/blog-posts"],
    queryFn: async () => {
      const response = await fetch("/api/blog-posts?limit=50");
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
      <div className="min-h-screen bg-gradient-to-br from-sage-50 to-fresh-lime-50">
        <Navigation />
        <div className="container mx-auto px-6 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest-green mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading posts...</p>
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
        keywords={["agricultural technology", "precision farming", "sustainable agriculture", "blog posts", "farming innovation"]}
        image="/api/og-image?title=All Posts"
      />

      <div className="min-h-screen bg-gradient-to-br from-sage-50 to-fresh-lime-50">
        <Navigation />
        
        <main className="container mx-auto px-6 py-12">
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

          {/* Posts Grid */}
          {Object.entries(groupedPosts).map(([period, posts]) => (
            <div key={period} className="mb-12">
              <h2 className="text-2xl font-bold text-forest-green mb-6 font-playfair">
                {period}
              </h2>
              
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {(posts as any[]).map((post) => (
                  <Card key={post.id} className="group hover:shadow-lg transition-shadow bg-white border-sage-200">
                    <div className="aspect-video overflow-hidden rounded-t-lg">
                      <img
                        src={post.featuredImage}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        {/* Tags */}
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {post.tags.slice(0, 2).map((tag: string, index: number) => (
                              <Badge 
                                key={index} 
                                variant="outline" 
                                className="text-xs border-forest-green text-forest-green"
                              >
                                {tag}
                              </Badge>
                            ))}
                            {post.tags.length > 2 && (
                              <Badge variant="outline" className="text-xs text-gray-500">
                                +{post.tags.length - 2} more
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Title and Excerpt */}
                        <div>
                          <h3 className="text-xl font-bold text-forest-green group-hover:text-sage-600 transition-colors mb-2 font-playfair">
                            <Link href={`/blog/${post.slug}`}>
                              {post.title}
                            </Link>
                          </h3>
                          <p className="text-gray-600 text-sm line-clamp-3">
                            {post.excerpt}
                          </p>
                        </div>

                        {/* Meta */}
                        <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>{post.author.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{post.readTime} min</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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