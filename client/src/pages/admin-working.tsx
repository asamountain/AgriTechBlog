import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDate } from "@/lib/utils";
import { markdownToText } from "@/lib/html-to-markdown";
import {
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  FileText, 
  BarChart3, 
  Users, 
  Settings,
  Save,
  X,
  LogOut,
  Sparkles,
  TrendingUp,
  MessageCircle,
  User,
  Upload,
  Camera,
  CheckSquare,
  Square,
  Globe,
  FileX,
  Star,
  StarOff,
  ArrowUpDown
} from "lucide-react";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { useAuth } from "@/hooks/useAuth";
import { usePersistentAuth } from "@/hooks/usePersistentAuth";

import AdminLoginSimple from "@/components/admin-login-simple";
import MigrationPanel from "@/components/migration-panel";
import { NotionPagesPanel } from "@/components/notion-pages-panel";
import CommentManagement from "@/components/comment-management";
import { AITaggingPanel } from "@/components/ai-tagging-panel";
import { AdaptiveLoader, ContentSkeleton } from "@/components/loading";

interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  tags: string[];
  readTime: number;
  isFeatured: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminDashboard() {
  const { user, isAuthenticated } = usePersistentAuth();
  const { logout } = usePersistentAuth();

  if (!isAuthenticated || !user) {
    return <AdminLoginSimple />;
  }

  const handleLogout = () => {
    logout();
    // trackEvent('admin_logout', user.id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 to-fresh-lime-50">
      <Navigation />
      
      <main className="container mx-auto px-6 py-24">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-forest-green mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user.name}!</p>
          </div>
          
          <div className="flex gap-4">
            <Button 
              onClick={() => window.location.href = '/create-post'}
              className="bg-forest-green hover:bg-forest-green/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Post (Advanced Editor)
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <Tabs defaultValue="posts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="notion" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Notion
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="comments" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Comments
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="migration" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Migration
            </TabsTrigger>
            <TabsTrigger value="ai-tagging" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              AI Tagging
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts">
            <PostManagement />
          </TabsContent>

          <TabsContent value="notion">
            <NotionPagesPanel />
          </TabsContent>

          <TabsContent value="analytics">
            <div className="text-center py-8">
              <p className="text-gray-600">Analytics dashboard coming soon...</p>
            </div>
          </TabsContent>

          <TabsContent value="comments">
            <CommentManagement />
          </TabsContent>

          <TabsContent value="profile">
            <div className="text-center py-8">
              <p className="text-gray-600">Profile management coming soon...</p>
            </div>
          </TabsContent>

          <TabsContent value="migration">
            <MigrationPanel />
          </TabsContent>

          <TabsContent value="ai-tagging">
            <AITaggingPanel />
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}

function PostManagement() {
  const { toast } = useToast();
  const [showEditor, setShowEditor] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | undefined>();
  const [selectedPosts, setSelectedPosts] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'drafts'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title' | 'readTime'>('newest');

  const { data: posts = [], isLoading, error, isError } = useQuery<Post[]>({
    queryKey: ["/api/admin/blog-posts"],
    retry: 1,
    staleTime: 0, // Force fresh data
    refetchOnMount: true,
  });

  // Debug logging
  React.useEffect(() => {
    console.log('🔍 Admin Posts Debug:', {
      isLoading,
      isError,
      error,
      postsCount: posts?.length || 0,
      posts: posts?.slice(0, 2) // First 2 posts for debugging
    });
  }, [isLoading, isError, error, posts]);

  // Manual refresh function for testing
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/blog-posts"] });
    queryClient.refetchQueries({ queryKey: ["/api/admin/blog-posts"] });
  };

  // Bulk operations mutations
  const bulkPublishMutation = useMutation({
    mutationFn: async ({ postIds, isPublished }: { postIds: number[]; isPublished: boolean }) => {
      const promises = postIds.map(id => 
        fetch(`/api/admin/blog-posts/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isPublished }),
        })
      );
      const results = await Promise.all(promises);
      const failedResults = results.filter(r => !r.ok);
      if (failedResults.length > 0) {
        throw new Error(`Failed to update ${failedResults.length} posts`);
      }
      return results;
    },
    onSuccess: (_, { isPublished, postIds }) => {
      toast({
        title: "Success",
        description: `${postIds.length} posts ${isPublished ? 'published' : 'moved to drafts'} successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/blog-posts"] });
      setSelectedPosts(new Set());
      setSelectAll(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update posts",
        variant: "destructive",
      });
    },
  });

  const bulkFeatureMutation = useMutation({
    mutationFn: async ({ postIds, isFeatured }: { postIds: number[]; isFeatured: boolean }) => {
      const promises = postIds.map(id => 
        fetch(`/api/admin/blog-posts/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isFeatured }),
        })
      );
      const results = await Promise.all(promises);
      const failedResults = results.filter(r => !r.ok);
      if (failedResults.length > 0) {
        throw new Error(`Failed to update ${failedResults.length} posts`);
      }
      return results;
    },
    onSuccess: (_, { isFeatured, postIds }) => {
      toast({
        title: "Success",
        description: `${postIds.length} posts ${isFeatured ? 'marked as featured' : 'removed from featured'} successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog-posts"] });
      setSelectedPosts(new Set());
      setSelectAll(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update posts",
        variant: "destructive",
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (postIds: number[]) => {
      const promises = postIds.map(id => apiRequest("DELETE", `/api/admin/blog-posts/${id}`));
      return Promise.all(promises);
    },
    onSuccess: (_, postIds) => {
      toast({
        title: "Success",
        description: `${postIds.length} posts deleted successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog-posts"] });
      setSelectedPosts(new Set());
      setSelectAll(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete posts",
        variant: "destructive",
      });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/blog-posts/${id}`),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Blog post deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog-posts"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete blog post",
        variant: "destructive",
      });
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, isPublished }: { id: number; isPublished: boolean }) => {
      const response = await fetch(`/api/admin/blog-posts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished }),
      });
      if (!response.ok) throw new Error("Failed to update post");
      return response.json();
    },
    onSuccess: (_, { isPublished }) => {
      toast({
        title: "Success",
        description: isPublished ? "Post published successfully" : "Post moved to drafts",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/blog-posts"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update post status",
        variant: "destructive",
      });
    },
  });

  const toggleFeatureMutation = useMutation({
    mutationFn: async ({ id, isFeatured }: { id: number; isFeatured: boolean }) => {
      const response = await fetch(`/api/admin/blog-posts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured }),
      });
      if (!response.ok) throw new Error("Failed to update post");
      return response.json();
    },
    onSuccess: (_, { isFeatured }) => {
      toast({
        title: "Success",
        description: isFeatured ? "Post marked as featured" : "Post removed from featured",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog-posts"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update featured status",
        variant: "destructive",
      });
    },
  });

  // Selection handlers
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedPosts(new Set());
      setSelectAll(false);
    } else {
      const allPostIds = new Set((posts as Post[]).map((post: Post) => post.id));
      setSelectedPosts(allPostIds);
      setSelectAll(true);
    }
  };

  const handleSelectPost = (postId: number) => {
    const newSelected = new Set(selectedPosts);
    if (newSelected.has(postId)) {
      newSelected.delete(postId);
    } else {
      newSelected.add(postId);
    }
    setSelectedPosts(newSelected);
    setSelectAll(newSelected.size === (posts as Post[]).length);
  };

  // Action handlers
  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this post?")) {
      deletePostMutation.mutate(id);
    }
  };

  const handleBulkDelete = () => {
    const selectedArray = Array.from(selectedPosts);
    if (selectedArray.length === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedArray.length} selected posts?`)) {
      bulkDeleteMutation.mutate(selectedArray);
    }
  };

  const handleBulkPublish = () => {
    const selectedArray = Array.from(selectedPosts);
    if (selectedArray.length === 0) return;
    
    bulkPublishMutation.mutate({ postIds: selectedArray, isPublished: true });
  };

  const handleBulkUnpublish = () => {
    const selectedArray = Array.from(selectedPosts);
    if (selectedArray.length === 0) return;
    
    bulkPublishMutation.mutate({ postIds: selectedArray, isPublished: false });
  };

  const handleBulkFeature = () => {
    const selectedArray = Array.from(selectedPosts);
    if (selectedArray.length === 0) return;
    
    bulkFeatureMutation.mutate({ postIds: selectedArray, isFeatured: true });
  };

  const handleBulkUnfeature = () => {
    const selectedArray = Array.from(selectedPosts);
    if (selectedArray.length === 0) return;
    
    bulkFeatureMutation.mutate({ postIds: selectedArray, isFeatured: false });
  };

  const handleTogglePublish = (post: Post) => {
    const newStatus = !post.isPublished;
    togglePublishMutation.mutate({ id: post.id, isPublished: newStatus });
  };

  const handleToggleFeature = (post: Post) => {
    const newStatus = !post.isFeatured;
    toggleFeatureMutation.mutate({ id: post.id, isFeatured: newStatus });
  };

  // Filter and sort posts
  const filteredPosts = React.useMemo(() => {
    if (!Array.isArray(posts)) return [];
    
    // Filter by status
    let filtered: Post[];
    switch (statusFilter) {
      case 'published':
        filtered = posts.filter(post => post.isPublished);
        break;
      case 'drafts':
        filtered = posts.filter(post => !post.isPublished);
        break;
      default:
        filtered = posts;
    }

    // Sort
    const sorted = [...filtered];
    switch (sortBy) {
      case 'newest':
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'title':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'readTime':
        sorted.sort((a, b) => b.readTime - a.readTime);
        break;
    }

    return sorted;
  }, [posts, statusFilter, sortBy]);

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <AdaptiveLoader size="lg" text="Loading posts..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Manage Posts</h2>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline" size="sm">
            🔄 Refresh Posts
          </Button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <Card className="p-1">
        <div className="flex gap-1">
          <button
            onClick={() => setStatusFilter('all')}
            className={`flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
              statusFilter === 'all'
                ? 'bg-forest-green text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <FileText className="w-4 h-4" />
              <span>All Posts</span>
              <Badge variant="secondary" className="ml-1 bg-white/20 text-white">
                {posts?.length || 0}
              </Badge>
            </div>
          </button>
          <button
            onClick={() => setStatusFilter('published')}
            className={`flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
              statusFilter === 'published'
                ? 'bg-green-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Globe className="w-4 h-4" />
              <span>Published</span>
              <Badge variant="secondary" className="ml-1 bg-white/20 text-white">
                {posts?.filter(p => p.isPublished).length || 0}
              </Badge>
            </div>
          </button>
          <button
            onClick={() => setStatusFilter('drafts')}
            className={`flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
              statusFilter === 'drafts'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <FileX className="w-4 h-4" />
              <span>Drafts</span>
              <Badge variant="secondary" className="ml-1 bg-white/20 text-white">
                {posts?.filter(p => !p.isPublished).length || 0}
              </Badge>
            </div>
          </button>
        </div>
      </Card>

      {/* Sorting Controls */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Sort by:</label>
          <div className="flex gap-2">
            <Button 
              variant={sortBy === 'newest' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('newest')}
              className="text-xs"
            >
              <ArrowUpDown className="w-3 h-3 mr-1" />
              Newest First
            </Button>
            <Button 
              variant={sortBy === 'oldest' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('oldest')}
              className="text-xs"
            >
              <ArrowUpDown className="w-3 h-3 mr-1" />
              Oldest First
            </Button>
            <Button 
              variant={sortBy === 'title' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('title')}
              className="text-xs"
            >
              <ArrowUpDown className="w-3 h-3 mr-1" />
              Title A-Z
            </Button>
            <Button 
              variant={sortBy === 'readTime' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('readTime')}
              className="text-xs"
            >
              <ArrowUpDown className="w-3 h-3 mr-1" />
              Read Time
            </Button>
          </div>
        </div>
      </Card>

      {/* Debug Information */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <h3 className="font-medium text-blue-800 mb-2">🔍 Debug Information:</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <p><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
          <p><strong>Error:</strong> {isError ? error?.message || 'Unknown error' : 'None'}</p>
          <p><strong>Posts Found:</strong> {posts?.length || 0}</p>
          <p><strong>API Endpoint:</strong> /api/admin/blog-posts</p>
          {posts?.length > 0 && (
            <p><strong>Sample Title:</strong> {posts[0]?.title}</p>
          )}
        </div>
      </Card>

      {/* Bulk Actions Bar */}
      {selectedPosts.size > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">
                {selectedPosts.size} post{selectedPosts.size !== 1 ? 's' : ''} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedPosts(new Set());
                  setSelectAll(false);
                }}
              >
                Clear Selection
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkPublish}
                disabled={bulkPublishMutation.isPending}
                className="text-green-600 hover:text-green-700"
              >
                <Globe className="w-4 h-4 mr-1" />
                Publish
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkUnpublish}
                disabled={bulkPublishMutation.isPending}
                className="text-orange-600 hover:text-orange-700"
              >
                <FileX className="w-4 h-4 mr-1" />
                Unpublish
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkFeature}
                disabled={bulkFeatureMutation.isPending}
                className="text-yellow-600 hover:text-yellow-700"
              >
                <Star className="w-4 h-4 mr-1" />
                Feature
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkUnfeature}
                disabled={bulkFeatureMutation.isPending}
                className="text-gray-600 hover:text-gray-700"
              >
                <StarOff className="w-4 h-4 mr-1" />
                Unfeature
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDelete}
                disabled={bulkDeleteMutation.isPending}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        </Card>
      )}

             {/* Control Legend & Select All */}
       {(posts as Post[]).length > 0 && (
         <div className="space-y-3">
           <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
             <div className="flex items-center gap-4">
               <div className="flex items-center gap-2">
                 <Checkbox 
                   checked={true} 
                   className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500 pointer-events-none" 
                 />
                 <span className="text-xs text-gray-600">= Published</span>
               </div>
               <div className="flex items-center gap-2">
                 <Checkbox 
                   checked={true} 
                   className="h-3 w-3 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 pointer-events-none" 
                 />
                 <span className="text-xs text-gray-600">= Select for bulk</span>
               </div>
             </div>
             <div className="flex items-center gap-2">
               <Checkbox
                 checked={selectAll}
                 onCheckedChange={handleSelectAll}
                 className="h-3 w-3 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
               />
               <label className="text-sm font-medium cursor-pointer" onClick={handleSelectAll}>
                 Select all posts ({(posts as Post[]).length})
               </label>
             </div>
           </div>
         </div>
       )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post: Post) => (
            <Card 
              key={post.id} 
              className={`relative border-2 transition-all hover:shadow-lg ${
                selectedPosts.has(post.id) 
                  ? 'border-blue-500 bg-blue-50/50 shadow-md' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Top Row: Status Badge (Left) + Selection Checkbox (Right) */}
              <div className="flex items-start justify-between p-4 pb-2">
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={post.isPublished ? "default" : "outline"}
                    className={`text-xs font-medium ${
                      post.isPublished 
                        ? "bg-green-600 text-white hover:bg-green-700" 
                        : "bg-orange-100 text-orange-700 border-orange-300"
                    }`}
                  >
                    {post.isPublished ? "✓ Published" : "📝 Draft"}
                  </Badge>
                  {post.isFeatured && (
                    <Badge className="text-xs bg-yellow-500 text-white">
                      ⭐ Featured
                    </Badge>
                  )}
                </div>
                
                {/* Selection Checkbox - Top Right */}
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectPost(post.id);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md cursor-pointer transition-all ${
                    selectedPosts.has(post.id)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title="Select for bulk operations"
                >
                  {selectedPosts.has(post.id) ? (
                    <CheckSquare className="w-3.5 h-3.5" />
                  ) : (
                    <Square className="w-3.5 h-3.5" />
                  )}
                  <span className="text-xs font-medium">
                    {selectedPosts.has(post.id) ? 'Selected' : 'Select'}
                  </span>
                </div>
              </div>

              {/* Middle: Title + Excerpt */}
              <div className="px-4 pb-3 space-y-2">
                <h3 className="text-lg font-bold text-gray-900 line-clamp-2 leading-tight">
                  {post.title}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                  {markdownToText(post.excerpt)}
                </p>
              </div>

              {/* Tags Section */}
              {post.tags?.length > 0 && (
                <div className="px-4 pb-3">
                  <div className="flex flex-wrap gap-1">
                    {post.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs bg-gray-50">
                        {tag}
                      </Badge>
                    ))}
                    {post.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs bg-gray-50">
                        +{post.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Bottom: Metadata + Actions */}
              <div className="border-t border-gray-200 bg-gray-50/50 px-4 py-3">
                {/* Metadata Row */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <span className="flex items-center gap-1">
                    📅 {formatDate(post.createdAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    ⏱️ {post.readTime} min read
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-4 gap-1.5">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                    className="text-xs h-8 px-2"
                    title="View post"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => window.location.href = `/edit-post/${post.id}`}
                    className="text-xs h-8 px-2"
                    title="Edit post"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleTogglePublish(post)}
                    disabled={togglePublishMutation.isPending}
                    className={`text-xs h-8 px-2 ${
                      post.isPublished 
                        ? 'text-orange-600 hover:text-orange-700' 
                        : 'text-green-600 hover:text-green-700'
                    }`}
                    title={post.isPublished ? "Unpublish" : "Publish"}
                  >
                    {post.isPublished ? <FileX className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDelete(post.id)}
                    className="text-xs h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    title="Delete post"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {/* Feature Toggle - Discrete Bottom Row */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                  <span className="text-xs text-gray-600 font-medium">Featured Post</span>
                  <Switch
                    checked={post.isFeatured}
                    onCheckedChange={() => handleToggleFeature(post)}
                    className="data-[state=checked]:bg-yellow-500"
                    disabled={toggleFeatureMutation.isPending}
                  />
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">
              {statusFilter === 'published' && 'No published posts found'}
              {statusFilter === 'drafts' && 'No draft posts found'}
              {statusFilter === 'all' && 'No posts found. Create your first post!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}