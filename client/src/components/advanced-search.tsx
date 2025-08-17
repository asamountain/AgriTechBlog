import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Calendar, User, Tag, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { formatDate } from "@/lib/utils";
import { markdownToText } from "@/lib/html-to-markdown";
import { AgriculturalSkeleton, AgricultureLoader } from "@/components/loading-animations";
import type { BlogPostWithDetails } from "@shared/schema";

export default function AdvancedSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("newest");

  const { data: searchResults = [], isLoading } = useQuery<BlogPostWithDetails[]>({
    queryKey: ["/api/blog-posts/search", { q: searchQuery }],
    enabled: searchQuery.length > 2,
  });

  const { data: allPosts = [] } = useQuery<BlogPostWithDetails[]>({
    queryKey: ["/api/blog-posts", { limit: 100 }],
    enabled: searchQuery.length <= 2,
  });

  // Get all unique tags for filtering
  const allTags = Array.from(
    new Set(
      (searchQuery.length > 2 ? searchResults : allPosts)
        .flatMap(post => post.tags || [])
        .filter(Boolean)
    )
  ).sort();

  // Filter and sort results
  const filteredPosts = (searchQuery.length > 2 ? searchResults : allPosts)
    .filter(post => selectedTag ? post.tags?.includes(selectedTag) : true)
    .sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "popular":
          return b.readTime - a.readTime; // Using readTime as popularity proxy
        case "title":
          return a.title.localeCompare(b.title);
        default: // newest
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-playfair font-bold text-gray-900 mb-4">
            Search Articles
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover insights across agricultural technology, sustainable farming practices, and industry innovations
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-forest-green" />
              Advanced Search
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search articles, topics, technologies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-4 text-lg"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Filter by Tag
                </label>
                <Select value={selectedTag || ""} onValueChange={(value) => setSelectedTag(value || null)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All tags" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All tags</SelectItem>
                    {allTags.map((tag) => (
                      <SelectItem key={tag} value={tag}>
                        {tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Sort by
                </label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest first</SelectItem>
                    <SelectItem value="oldest">Oldest first</SelectItem>
                    <SelectItem value="popular">Most popular</SelectItem>
                    <SelectItem value="title">Alphabetical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedTag(null);
                    setSortBy("newest");
                  }}
                  className="w-full"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-gray-600">
            {isLoading ? (
              "Searching..."
            ) : (
              `Found ${filteredPosts.length} article${filteredPosts.length !== 1 ? 's' : ''}`
            )}
          </div>
          <div className="flex items-center gap-2">
            {searchQuery && (
              <Badge variant="secondary" className="bg-forest-green/10 text-forest-green">
                Search: "{searchQuery}"
              </Badge>
            )}
            {selectedTag && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Tag: {selectedTag}
              </Badge>
            )}
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="space-y-6">
            <div className="flex justify-center">
              <AgricultureLoader size="lg" text="Searching the fields..." />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <AgriculturalSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchQuery ? "No articles found" : "Start searching"}
              </h3>
              <p className="text-gray-600">
                {searchQuery 
                  ? "Try adjusting your search terms or filters"
                  : "Enter a search term to discover relevant articles"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                  <div className="relative overflow-hidden">
                    <img
                      src={post.featuredImage}
                      alt={post.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 left-4">
                      {post.tags && post.tags.length > 0 && (
                        <Badge 
                          className="bg-white/90 text-gray-800 hover:bg-white"
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {post.tags[0]}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-forest-green transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {markdownToText(post.excerpt)}
                    </p>

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {post.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {post.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{post.tags.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(post.createdAt)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {post.readTime} min read
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}