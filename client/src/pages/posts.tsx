import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Calendar, Clock, Tag, Search, Filter } from "lucide-react";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import SEOHead from "@/components/seo-head";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import type { BlogPostWithDetails } from "@shared/schema";

export default function Posts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: posts, isLoading } = useQuery<BlogPostWithDetails[]>({
    queryKey: ["/api/blog-posts"],
  });

  // Extract all unique tags and categories
  const { allTags, allCategories } = useMemo(() => {
    if (!posts) return { allTags: [], allCategories: [] };

    const tagsSet = new Set<string>();
    const categoriesSet = new Set<string>();

    posts.forEach(post => {
      if (post.tags) {
        post.tags.forEach(tag => tagsSet.add(tag));
      }
      categoriesSet.add(post.category.name);
    });

    return {
      allTags: Array.from(tagsSet).sort(),
      allCategories: Array.from(categoriesSet).sort()
    };
  }, [posts]);

  // Filter posts based on search term, selected tag, and category
  const filteredPosts = useMemo(() => {
    if (!posts) return [];

    return posts.filter(post => {
      const matchesSearch = searchTerm === "" || 
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTag = selectedTag === null || 
        (post.tags && post.tags.includes(selectedTag));

      const matchesCategory = selectedCategory === null || 
        post.category.name === selectedCategory;

      return matchesSearch && matchesTag && matchesCategory;
    });
  }, [posts, searchTerm, selectedTag, selectedCategory]);

  // Group posts by tags for display
  const postsByTag = useMemo(() => {
    if (!filteredPosts.length || selectedTag || selectedCategory || searchTerm) {
      return { "All Posts": filteredPosts };
    }

    const grouped: Record<string, BlogPostWithDetails[]> = {};
    
    filteredPosts.forEach(post => {
      if (post.tags && post.tags.length > 0) {
        post.tags.forEach(tag => {
          if (!grouped[tag]) {
            grouped[tag] = [];
          }
          grouped[tag].push(post);
        });
      } else {
        if (!grouped["Uncategorized"]) {
          grouped["Uncategorized"] = [];
        }
        grouped["Uncategorized"].push(post);
      }
    });

    return grouped;
  }, [filteredPosts, selectedTag, selectedCategory, searchTerm]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedTag(null);
    setSelectedCategory(null);
  };

  const hasActiveFilters = searchTerm !== "" || selectedTag !== null || selectedCategory !== null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="pt-24 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title="All Posts - San's Agricultural Technology Blog"
        description="Browse all articles on agricultural technology, IoT solutions, and sustainable farming practices. Organized by topics for easy discovery."
        keywords={["agricultural technology", "blog posts", "farming innovation", "IoT agriculture", ...allTags]}
        image="/api/og-image?title=All Posts&category=Blog Archive"
        url={`${window.location.origin}/posts`}
        type="website"
      />
      <Navigation />

      {/* Header Section */}
      <section className="pt-24 pb-12 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-playfair font-bold text-gray-900 mb-4">
              All Posts
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Explore insights on agricultural technology, sustainable farming, and innovation.
              {posts && ` ${posts.length} articles available.`}
            </p>
          </div>

          {/* Search and Filter Controls */}
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search posts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-forest-green focus:ring-forest-green"
                />
              </div>
              <Button
                onClick={clearFilters}
                variant="outline"
                className={`${hasActiveFilters ? 'border-forest-green text-forest-green' : ''}`}
                disabled={!hasActiveFilters}
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>

            {/* Filter Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-sm font-medium text-gray-700 mr-2">Filter by tag:</span>
              {allTags.map(tag => (
                <Button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  variant={selectedTag === tag ? "default" : "outline"}
                  size="sm"
                  className={selectedTag === tag ? "bg-forest-green hover:bg-forest-green/90" : "border-gray-300 hover:border-forest-green"}
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </Button>
              ))}
            </div>

            {/* Filter Categories */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-700 mr-2">Filter by category:</span>
              {allCategories.map(category => (
                <Button
                  key={category}
                  onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  className={selectedCategory === category ? "bg-forest-green hover:bg-forest-green/90" : "border-gray-300 hover:border-forest-green"}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Posts Content */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-gray-600 mb-4">
                No posts found matching your criteria.
              </p>
              <Button onClick={clearFilters} className="bg-forest-green hover:bg-forest-green/90">
                Clear Filters
              </Button>
            </div>
          ) : (
            Object.entries(postsByTag).map(([tagName, tagPosts]) => (
              <div key={tagName} className="mb-12">
                {!hasActiveFilters && (
                  <div className="flex items-center gap-3 mb-6">
                    <h2 className="text-2xl font-semibold text-gray-900">{tagName}</h2>
                    <Badge variant="outline" className="border-forest-green/30 text-forest-green">
                      {tagPosts.length} {tagPosts.length === 1 ? 'post' : 'posts'}
                    </Badge>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tagPosts.map(post => (
                    <Card key={post.id} className="group hover:shadow-lg transition-all duration-300 border-gray-200 hover:border-forest-green/20">
                      <Link href={`/blog/${post.slug}`}>
                        <div className="cursor-pointer">
                          {post.featuredImage && (
                            <div className="aspect-video overflow-hidden rounded-t-lg">
                              <img
                                src={post.featuredImage}
                                alt={post.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          )}
                          
                          <CardContent className="p-6">
                            <div className="mb-3">
                              <Badge 
                                className="text-xs font-medium text-white"
                                style={{ backgroundColor: post.category.color }}
                              >
                                {post.category.name}
                              </Badge>
                            </div>

                            <h3 className="font-semibold text-lg text-gray-900 mb-3 group-hover:text-forest-green transition-colors line-clamp-2">
                              {post.title}
                            </h3>

                            <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                              {post.excerpt}
                            </p>

                            {/* Tags */}
                            {post.tags && post.tags.length > 0 && (
                              <div className="mb-4">
                                <div className="flex flex-wrap gap-2">
                                  {post.tags.slice(0, 3).map((tag) => (
                                    <Badge 
                                      key={tag} 
                                      variant="outline" 
                                      className="text-xs border-forest-green/30 text-forest-green"
                                    >
                                      {tag}
                                    </Badge>
                                  ))}
                                  {post.tags.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{post.tags.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{formatDate(post.createdAt)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{post.readTime} min read</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </div>
                      </Link>
                    </Card>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}