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
              <Card className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 cursor-pointer">
                <div 
                  className="relative h-64 bg-cover bg-center"
                  style={{ backgroundImage: `url('${story.featuredImage}')` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-4 left-4">
                    <Badge 
                      className="text-white font-medium"
                      style={{ backgroundColor: story.category.color }}
                    >
                      {story.category.name}
                    </Badge>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h3 className="text-xl font-semibold mb-2 group-hover:text-fresh-lime transition-colors line-clamp-2">
                      {story.title}
                    </h3>
                    <p className="text-sm text-gray-200">
                      {story.readTime} min read
                    </p>
                  </div>
                </div>
                <CardContent className="p-6">
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {story.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-sage-green text-white text-xs">
                          {story.author.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-gray-500">
                        {story.author.name}
                      </span>
                    </div>
                    <span className="text-sm text-gray-400">
                      {formatDate(story.createdAt)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
