import { useState } from "react";
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
  MessageCircle
} from "lucide-react";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { useAuth } from "@/hooks/useAuth";
import { trackEvent } from "@/lib/analytics";
import AdminLogin from "@/components/admin-login";
import MigrationPanel from "@/components/migration-panel";
import CommentManagement from "@/components/comment-management";
import { AITaggingPanel } from "@/components/ai-tagging-panel";

interface BlogPost {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  featuredImage: string;
  createdAt: string;
  updatedAt: string;
  isFeatured: boolean;
  isPublished: boolean;
  readTime: number;
  author: {
    id: number;
    name: string;
    email: string;
  };
  category: {
    id: number;
    name: string;
    slug: string;
  };
}

interface PostFormData {
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  featuredImage: string;
  isFeatured: boolean;
  isPublished: boolean;
}

function PostEditor({ post, onClose }: { post?: BlogPost; onClose: () => void }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<PostFormData>({
    title: post?.title || "",
    content: post?.content || "",
    excerpt: post?.excerpt || "",
    slug: post?.slug || "",
    featuredImage: post?.featuredImage || "",
    isFeatured: post?.isFeatured || false,
    isPublished: post?.isPublished || false,
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: PostFormData) => {
      return apiRequest("POST", "/api/blog-posts", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Blog post created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/blog-posts"] });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create blog post",
        variant: "destructive",
      });
    },
  });

  const updatePostMutation = useMutation({
    mutationFn: async (data: PostFormData) => {
      return apiRequest("PUT", `/api/blog-posts/${post?.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Blog post updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/blog-posts"] });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update blog post",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (post) {
      updatePostMutation.mutate(formData);
    } else {
      createPostMutation.mutate(formData);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            value={formData.slug}
            onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="excerpt">Excerpt</Label>
        <Textarea
          id="excerpt"
          value={formData.excerpt}
          onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
          rows={12}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="featuredImage">Featured Image URL</Label>
        <Input
          id="featuredImage"
          value={formData.featuredImage}
          onChange={(e) => setFormData(prev => ({ ...prev, featuredImage: e.target.value }))}
          placeholder="https://example.com/image.jpg"
        />
      </div>

      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <Switch
            id="featured"
            checked={formData.isFeatured}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isFeatured: checked }))}
          />
          <Label htmlFor="featured">Featured Post</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="published"
            checked={formData.isPublished}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublished: checked }))}
          />
          <Label htmlFor="published">Published</Label>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button type="submit" disabled={createPostMutation.isPending || updatePostMutation.isPending}>
          <Save className="w-4 h-4 mr-2" />
          {post ? "Update" : "Create"} Post
        </Button>
      </DialogFooter>
    </form>
  );
}

function PostsManagement() {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const { toast } = useToast();

  const { data: posts = [], isLoading } = useQuery<BlogPost[]>({
    queryKey: ["/api/admin/blog-posts"],
  });

  const deletePostMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/blog-posts/${id}`);
    },
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

  const handleEdit = (post: BlogPost) => {
    setSelectedPost(post);
    setShowEditor(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this post?")) {
      deletePostMutation.mutate(id);
    }
  };

  const closeEditor = () => {
    setShowEditor(false);
    setSelectedPost(null);
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading posts...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Manage Posts</h2>
        <Dialog open={showEditor} onOpenChange={setShowEditor}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedPost(null)}>
              <Plus className="w-4 h-4 mr-2" />
              New Post
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedPost ? "Edit Post" : "Create New Post"}
              </DialogTitle>
              <DialogDescription>
                {selectedPost ? "Update the blog post details below." : "Fill in the details for your new blog post."}
              </DialogDescription>
            </DialogHeader>
            <PostEditor post={selectedPost || undefined} onClose={closeEditor} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {posts.map((post: BlogPost) => (
          <Card key={post.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{post.title}</CardTitle>
                  <CardDescription>
                    {post.excerpt}
                  </CardDescription>
                </div>
                <div className="flex space-x-1">
                  {post.isFeatured && (
                    <Badge variant="secondary">Featured</Badge>
                  )}
                  <Badge variant={post.isPublished ? "default" : "outline"}>
                    {post.isPublished ? "Published" : "Draft"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-500 space-y-1">
                <p>Created: {formatDate(post.createdAt)}</p>
                <p>Updated: {formatDate(post.updatedAt)}</p>
                <p>Author: {post.author.name}</p>
                <p>Read time: {post.readTime} min</p>
              </div>
            </CardContent>
            <CardFooter>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleEdit(post)}>
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
        ))}
      </div>
    </div>
  );
}

interface AdminStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  featuredPosts: number;
}

function Analytics() {
  const { data: stats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Analytics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPosts || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.publishedPosts || 0} published
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft Posts</CardTitle>
            <Edit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.draftPosts || 0}</div>
            <p className="text-xs text-muted-foreground">
              Unpublished content
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Featured Posts</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.featuredPosts || 0}</div>
            <p className="text-xs text-muted-foreground">
              Highlighted content
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, isLoading, isAuthenticated } = useAuth();

  const handleLogout = () => {
    trackEvent('admin_logout', 'authentication', 'logout_button');
    fetch('/api/auth/logout', { method: 'POST' })
      .then(() => {
        window.location.href = '/admin';
      })
      .catch(() => {
        window.location.href = '/admin';
      });
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest-green mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-2">Welcome back, {user?.name}</p>
            </div>
            <Button onClick={handleLogout} variant="outline">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>

          <Tabs defaultValue="posts" className="space-y-6">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="migration">
                <Sparkles className="w-4 h-4 mr-2" />
                Migration
              </TabsTrigger>
              <TabsTrigger value="posts">
                <FileText className="w-4 h-4 mr-2" />
                Posts
              </TabsTrigger>
              <TabsTrigger value="comments">
                <MessageCircle className="w-4 h-4 mr-2" />
                Comments
              </TabsTrigger>
              <TabsTrigger value="ai-tagging">
                <Sparkles className="w-4 h-4 mr-2" />
                AI Tagging
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="users">
                <Users className="w-4 h-4 mr-2" />
                Users
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="migration">
              <MigrationPanel />
            </TabsContent>

            <TabsContent value="posts">
              <PostsManagement />
            </TabsContent>

            <TabsContent value="comments">
              <CommentManagement />
            </TabsContent>

            <TabsContent value="ai-tagging">
              <AITaggingPanel />
            </TabsContent>

            <TabsContent value="analytics">
              <Analytics />
            </TabsContent>

            <TabsContent value="users">
              <div className="text-center p-8">
                <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">User Management</h3>
                <p className="text-gray-600">User management features coming soon.</p>
              </div>
            </TabsContent>

            <TabsContent value="settings">
              <div className="text-center p-8">
                <Settings className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Settings</h3>
                <p className="text-gray-600">Site settings and configuration options coming soon.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Footer />
    </div>
  );
}