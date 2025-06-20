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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDate } from "@/lib/utils";
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
  Camera
} from "lucide-react";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { useAuth } from "@/hooks/useAuth";
import { usePersistentAuth } from "@/hooks/usePersistentAuth";
import { trackEvent } from "@/lib/analytics";
import AdminLoginSimple from "@/components/admin-login-simple";
import MigrationPanel from "@/components/migration-panel";
import CommentManagement from "@/components/comment-management";
import { AITaggingPanel } from "@/components/ai-tagging-panel";
import { PageLoader, LoadingSpinner, ContentSkeleton } from "@/components/loading-animations";

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
    trackEvent('admin_logout', user.id);
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
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Posts
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

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["/api/admin/blog-posts"],
  });

  const deletePostMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/admin/blog-posts/${id}`, "DELETE"),
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

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this post?")) {
      deletePostMutation.mutate(id);
    }
  };

  const handleTogglePublish = (post: Post) => {
    const newStatus = !post.isPublished;
    const action = newStatus ? "publish" : "unpublish";
    if (confirm(`Are you sure you want to ${action} "${post.title}"?`)) {
      togglePublishMutation.mutate({ id: post.id, isPublished: newStatus });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <LoadingSpinner size="lg" text="Loading posts..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Manage Posts</h2>
        <Button 
          onClick={() => window.location.href = '/create-post'}
          className="bg-forest-green hover:bg-forest-green/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Post
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.isArray(posts) && posts.length > 0 ? (
          posts.map((post: Post) => (
            <Card key={post.id} className="h-fit">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg line-clamp-2">{post.title}</CardTitle>
                  <div className="flex gap-1">
                    {post.isFeatured && (
                      <Badge variant="secondary" className="text-xs">
                        Featured
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTogglePublish(post)}
                      disabled={togglePublishMutation.isPending}
                      className={`text-xs h-6 px-2 border ${
                        post.isPublished 
                          ? "text-green-700 border-green-200 bg-green-50 hover:bg-green-100" 
                          : "text-orange-700 border-orange-200 bg-orange-50 hover:bg-orange-100"
                      }`}
                    >
                      {post.isPublished ? "✓ Published" : "📝 Draft"}
                    </Button>
                  </div>
                </div>
                <CardDescription className="line-clamp-3">
                  {post.excerpt}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>Created: {formatDate(post.createdAt)}</p>
                  <p>Read time: {post.readTime} min</p>
                  {post.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {post.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
              
              <CardFooter>
                <div className="flex w-full gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => window.location.href = `/edit-post/${post.id}`}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDelete(post.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-600">No posts found. Create your first post!</p>
          </div>
        )}
      </div>
    </div>
  );
}