import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ChevronDown, FileText, Tag, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSub,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/utils";
import type { BlogPostWithDetails } from "@shared/schema";

export default function PostsMenu() {
  const { data: posts, isLoading } = useQuery<BlogPostWithDetails[]>({
    queryKey: ["/api/blog-posts"],
  });

  if (isLoading || !posts) {
    return (
      <Button variant="ghost" className="text-gray-700 hover:text-forest-green" disabled>
        <FileText className="h-4 w-4 mr-2" />
        Posts
        <ChevronDown className="h-4 w-4 ml-1" />
      </Button>
    );
  }

  // Group posts by tags
  const tagGroups = posts.reduce((acc, post) => {
    if (post.tags && post.tags.length > 0) {
      post.tags.forEach(tag => {
        if (!acc[tag]) {
          acc[tag] = [];
        }
        acc[tag].push(post);
      });
    } else {
      // Posts without tags
      if (!acc['Uncategorized']) {
        acc['Uncategorized'] = [];
      }
      acc['Uncategorized'].push(post);
    }
    return acc;
  }, {} as Record<string, BlogPostWithDetails[]>);

  // Sort tags alphabetically and limit posts per tag
  const sortedTags = Object.keys(tagGroups).sort();
  const recentPosts = posts.slice(0, 5); // Show 5 most recent posts

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="text-gray-700 hover:text-forest-green">
          <FileText className="h-4 w-4 mr-2" />
          Posts
          <ChevronDown className="h-4 w-4 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-80 max-h-96 overflow-y-auto">
        {/* Recent Posts Section */}
        <div className="px-2 py-1">
          <div className="flex items-center gap-2 px-2 py-1 text-sm font-medium text-gray-900">
            <Calendar className="h-4 w-4 text-forest-green" />
            Recent Posts
          </div>
        </div>
        
        {recentPosts.map((post) => (
          <DropdownMenuItem key={`recent-${post.id}`} asChild>
            <Link href={`/blog/${post.slug}`} className="block">
              <div className="flex flex-col gap-1 py-2">
                <div className="font-medium text-sm line-clamp-1">
                  {post.title}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Badge 
                    className="text-xs px-2 py-0 text-white"
                    style={{ backgroundColor: post.category.color }}
                  >
                    {post.category.name}
                  </Badge>
                  <span>{formatDate(post.createdAt)}</span>
                </div>
              </div>
            </Link>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        {/* Posts by Tags Section */}
        <div className="px-2 py-1">
          <div className="flex items-center gap-2 px-2 py-1 text-sm font-medium text-gray-900">
            <Tag className="h-4 w-4 text-forest-green" />
            Browse by Tags
          </div>
        </div>

        {sortedTags.map((tag) => (
          <DropdownMenuSub key={tag}>
            <DropdownMenuSubTrigger className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs border-forest-green/30 text-forest-green">
                  {tag}
                </Badge>
                <span className="text-xs text-gray-500">
                  ({tagGroups[tag].length})
                </span>
              </div>
            </DropdownMenuSubTrigger>
            
            <DropdownMenuSubContent className="w-72 max-h-80 overflow-y-auto">
              {tagGroups[tag].slice(0, 10).map((post) => (
                <DropdownMenuItem key={`${tag}-${post.id}`} asChild>
                  <Link href={`/blog/${post.slug}`} className="block">
                    <div className="flex flex-col gap-1 py-2">
                      <div className="font-medium text-sm line-clamp-2">
                        {post.title}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Badge 
                          className="text-xs px-2 py-0 text-white"
                          style={{ backgroundColor: post.category.color }}
                        >
                          {post.category.name}
                        </Badge>
                        <span>{formatDate(post.createdAt)}</span>
                        <span>•</span>
                        <span>{post.readTime} min read</span>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {post.excerpt}
                      </p>
                    </div>
                  </Link>
                </DropdownMenuItem>
              ))}
              
              {tagGroups[tag].length > 10 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={`/?tag=${encodeURIComponent(tag)}`} className="block">
                      <div className="text-center text-sm text-forest-green font-medium py-1">
                        View all {tagGroups[tag].length} posts with "{tag}"
                      </div>
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        ))}

        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild>
          <Link href="/" className="block">
            <div className="text-center text-sm text-forest-green font-medium py-2">
              View All Posts
            </div>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}