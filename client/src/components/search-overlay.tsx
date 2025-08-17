import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { formatDate } from "@/lib/utils";
import { markdownToText } from "@/lib/html-to-markdown";
import type { BlogPostWithDetails } from "@shared/schema";

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: searchResults, isLoading } = useQuery<BlogPostWithDetails[]>({
    queryKey: ["/api/blog-posts/search", { q: searchQuery }],
    enabled: searchQuery.length > 2,
  });

  const handleClose = () => {
    setSearchQuery("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl font-playfair font-bold text-forest-green">
            Search Articles
          </DialogTitle>
        </DialogHeader>
        
        <div className="px-6 pb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search for articles, topics, or authors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-4 text-lg border-gray-300 focus:ring-2 focus:ring-forest-green focus:border-transparent"
              autoFocus
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {searchQuery.length <= 2 ? (
            <div className="text-gray-500 text-center py-8">
              <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Start typing to search for articles...</p>
            </div>
          ) : isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex space-x-4">
                  <div className="w-20 h-16 bg-gray-200 rounded animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                    <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : searchResults && searchResults.length > 0 ? (
            <div className="space-y-4">
              {searchResults.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`}>
                  <div 
                    className="flex space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
                    onClick={handleClose}
                  >
                    <div 
                      className="w-20 h-16 bg-cover bg-center rounded"
                      style={{ backgroundImage: `url('${post.featuredImage}')` }}
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-forest-green transition-colors line-clamp-1">
                        {post.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {markdownToText(post.excerpt)}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {post.tags && post.tags.length > 0 && (
                          <Badge 
                            variant="secondary"
                            className="text-xs bg-forest-green text-white"
                          >
                            {post.tags[0]}
                          </Badge>
                        )}
                        <span className="text-xs text-gray-500">
                          {formatDate(post.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-center py-8">
              <p>No articles found matching "{searchQuery}"</p>
              <p className="text-sm mt-2">Try different keywords or browse our categories.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
