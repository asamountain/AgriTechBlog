import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import TagDisplay from "@/components/tag-display";
import { Link } from "wouter";
import { Folder, ArrowRight, TrendingUp, Search, X } from "lucide-react";

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  postCount?: number;
}

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  category: Category;
  tags: string[];
}

export default function CategoriesPage() {
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/categories'],
  });

  // Fetch all blog posts to get tag statistics
  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['/api/blog-posts'],
  });

  // Calculate category post counts and popular tags
  const categoriesWithCounts = (categories as Category[]).map((category: Category) => ({
    ...category,
    postCount: (posts as BlogPost[]).filter((post: BlogPost) => post.category.id === category.id).length
  }));

  // Extract all unique tags and their frequency
  const tagFrequency = (posts as BlogPost[]).reduce((acc: { [key: string]: number }, post: BlogPost) => {
    if (post.tags && Array.isArray(post.tags)) {
      post.tags.forEach((tag: string) => {
        acc[tag] = (acc[tag] || 0) + 1;
      });
    }
    return acc;
  }, {});

  const popularTags = Object.entries(tagFrequency)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 20)
    .map(([tag, count]) => ({ tag, count: count as number }));

  // Filter posts based on selected tag and search term
  const filteredPosts = (posts as BlogPost[]).filter((post: BlogPost) => {
    const matchesTag = !selectedTag || (post.tags && post.tags.includes(selectedTag));
    const matchesSearch = !searchTerm || 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (post.tags && post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
    return matchesTag && matchesSearch;
  });

  // Update category counts based on filtered posts
  const filteredCategoriesWithCounts = categoriesWithCounts.map(category => ({
    ...category,
    postCount: filteredPosts.filter(post => post.category.id === category.id).length
  }));

  const handleTagClick = (tag: string) => {
    setSelectedTag(selectedTag === tag ? "" : tag);
  };

  const clearFilters = () => {
    setSelectedTag("");
    setSearchTerm("");
  };

  if (categoriesLoading || postsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-64 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-96 mx-auto"></div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Content Categories
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Discover our comprehensive collection of agricultural technology topics. 
            From precision farming to sustainable agriculture, explore expert insights organized by category.
          </p>
        </div>

        {/* Search and Filter Controls */}
        <div className="mb-golden-lg">
          <div className="max-w-4xl mx-auto">
            <div className="relative mb-golden-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search categories, posts, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-golden-sm"
              />
              {(selectedTag || searchTerm) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            {/* Popular Tags */}
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-golden-sm text-gray-900 dark:text-white">
                Popular Tags {selectedTag && `(filtered by: ${selectedTag})`}
              </h3>
              <TagDisplay
                tags={popularTags.map(t => t.tag)}
                onTagClick={handleTagClick}
                selectedTag={selectedTag}
              />
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="mb-16">
          <div className="flex items-center gap-2 mb-8">
            <Folder className="h-6 w-6 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Categories</h2>
            <Badge variant="secondary">{filteredCategoriesWithCounts.filter(c => c.postCount > 0).length} active topics</Badge>
          </div>
          
          {categoriesWithCounts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoriesWithCounts.map((category: any) => (
                <Card key={category.id} className="hover:shadow-lg transition-shadow duration-200">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">{category.name}</CardTitle>
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                    </div>
                    <CardDescription className="line-clamp-2">
                      {category.description || `Explore ${category.name.toLowerCase()} topics and insights`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">
                        {category.postCount} {category.postCount === 1 ? 'post' : 'posts'}
                      </Badge>
                      <Link href={`/category/${category.slug}`}>
                        <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700">
                          View Posts
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <Folder className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No Categories Available
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Categories will appear here once content is organized.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Popular Tags */}
        {popularTags.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-8">
              <TrendingUp className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Popular Tags</h2>
              <Badge variant="secondary">{popularTags.length} tags</Badge>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Trending Topics</CardTitle>
                <CardDescription>
                  Most popular tags across all agricultural technology content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {popularTags.map(({ tag, count }) => (
                    <Link key={tag} href={`/search?q=${encodeURIComponent(tag)}`}>
                      <Badge 
                        variant="outline" 
                        className="hover:bg-green-50 hover:border-green-300 cursor-pointer transition-colors"
                      >
                        {tag}
                        <span className="ml-1 text-xs text-gray-500">({count})</span>
                      </Badge>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}