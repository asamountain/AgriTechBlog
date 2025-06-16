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
import AdminLogin from "@/components/admin-login";
import MigrationPanel from "@/components/migration-panel";
import CommentManagement from "@/components/comment-management";
import { AITaggingPanel } from "@/components/ai-tagging-panel";
import { AgriculturePageLoader, AgricultureLoader, AgriculturalSkeleton } from "@/components/loading-animations";


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
  tags: string[];
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
  categoryId?: number;
  tags?: string[];
}

function PostEditorForm({ post, onClose }: { post?: BlogPost; onClose: () => void }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<PostFormData>({
    title: post?.title || "",
    content: post?.content || "",
    excerpt: post?.excerpt || "",
    slug: post?.slug || "",
    featuredImage: post?.featuredImage || "",
    isFeatured: post?.isFeatured || false,
    isPublished: post?.isPublished || false,
    categoryId: post?.category?.id || undefined,
    tags: post?.tags || [],
  });
  const [newTag, setNewTag] = useState("");

  // Fetch categories for the dropdown
  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ['/api/categories'],
  });

  const updatePostMutation = useMutation({
    mutationFn: async (data: PostFormData) => {
      const response = await fetch(`/api/blog-posts/${post?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update post');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Post updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog-posts"] });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update post",
        variant: "destructive",
      });
    },
  });

  const generateTagsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/ai-tagging/analyze/${post?.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to generate tags');
      return response.json();
    },
    onSuccess: (data: any) => {
      if (data.suggestedTags) {
        setFormData(prev => ({ ...prev, tags: data.suggestedTags }));
      }
      if (data.suggestedCategory) {
        const matchingCategory = (categories as any[]).find((cat: any) => 
          cat.name.toLowerCase() === data.suggestedCategory.toLowerCase()
        );
        if (matchingCategory) {
          setFormData(prev => ({ ...prev, categoryId: matchingCategory.id }));
        }
      }
      toast({
        title: "AI Analysis Complete",
        description: `Generated ${data.suggestedTags?.length || 0} tags`,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (post) {
      updatePostMutation.mutate(formData);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-golden-md p-golden-lg">
      {/* Title */}
      <div className="space-y-golden-xs">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          className="rounded-golden-sm"
          required
        />
      </div>



      {/* Tags */}
      <div className="space-y-golden-sm">
        <div className="flex items-center justify-between">
          <Label>Tags</Label>
          <Button
            type="button"
            onClick={() => generateTagsMutation.mutate()}
            disabled={generateTagsMutation.isPending}
            size="sm"
            className="bg-forest-green text-white hover:opacity-80"
          >
            {generateTagsMutation.isPending ? "Generating..." : "AI Generate"}
          </Button>
        </div>
        
        {/* Current Tags */}
        <div className="flex flex-wrap gap-golden-xs">
          {formData.tags?.map((tag, index) => (
            <Badge
              key={index}
              variant="outline"
              className="border-forest-green text-forest-green p-golden-xs rounded-golden-sm"
            >
              {tag}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1 hover:bg-transparent"
                onClick={() => removeTag(tag)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>

        {/* Add New Tag */}
        <div className="flex gap-golden-xs">
          <Input
            placeholder="Add new tag"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            className="flex-1 rounded-golden-sm"
          />
          <Button type="button" onClick={addTag} size="sm" variant="outline">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Excerpt */}
      <div className="space-y-golden-xs">
        <Label htmlFor="excerpt">Excerpt</Label>
        <Textarea
          id="excerpt"
          value={formData.excerpt}
          onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
          rows={3}
          className="rounded-golden-sm"
        />
      </div>

      {/* Content */}
      <div className="space-y-golden-xs">
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
          rows={12}
          className="rounded-golden-sm"
          required
        />
      </div>

      {/* Featured Image */}
      <div className="space-y-golden-xs">
        <Label htmlFor="featuredImage">Featured Image URL</Label>
        <Input
          id="featuredImage"
          value={formData.featuredImage}
          onChange={(e) => setFormData(prev => ({ ...prev, featuredImage: e.target.value }))}
          placeholder="https://example.com/image.jpg"
          className="rounded-golden-sm"
        />
      </div>

      {/* Switches */}
      <div className="flex items-center space-x-golden-lg">
        <div className="flex items-center space-x-golden-xs">
          <Switch
            id="featured"
            checked={formData.isFeatured}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isFeatured: checked }))}
          />
          <Label htmlFor="featured">Featured Post</Label>
        </div>

        <div className="flex items-center space-x-golden-xs">
          <Switch
            id="published"
            checked={formData.isPublished}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublished: checked }))}
          />
          <Label htmlFor="published">Published</Label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-golden-sm pt-golden-sm border-t">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={updatePostMutation.isPending}
          className="bg-forest-green text-white hover:opacity-80"
        >
          {updatePostMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}



function PostsManagement() {
  const [selectedPost, setSelectedPost] = useState<BlogPost | undefined>(undefined);
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
    setSelectedPost(undefined);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <AgricultureLoader theme="harvest" size="lg" text="Harvesting your posts..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Manage Posts</h2>
        <Dialog open={showEditor} onOpenChange={setShowEditor}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedPost(undefined)}>
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
            <PostEditorForm post={selectedPost || undefined} onClose={closeEditor} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {posts.map((post: BlogPost, index: number) => (
          <Card key={`${post.id}-${index}`}>
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

interface ProfileData {
  name: string;
  email: string;
  bio: string;
  avatar: string;
  linkedinUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  portfolioUrl?: string;
  githubUrl?: string;
}

function ProfileManagement() {
  const { toast } = useToast();
  const [profileData, setProfileData] = useState<ProfileData>({
    name: "",
    email: "",
    bio: "",
    avatar: "",
    linkedinUrl: "",
    instagramUrl: "",
    youtubeUrl: "",
    portfolioUrl: "",
    githubUrl: ""
  });

  // Fetch existing profile data
  const { data: existingProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["/api/admin/profile"],
  });

  // Update profile data when existing profile loads
  React.useEffect(() => {
    if (existingProfile && (existingProfile as any).name) {
      const profile = existingProfile as any;
      setProfileData({
        name: profile.name || "",
        email: profile.email || "",
        bio: profile.bio || "",
        avatar: profile.avatar || "",
        linkedinUrl: profile.linkedinUrl || "",
        instagramUrl: profile.instagramUrl || "",
        youtubeUrl: profile.youtubeUrl || "",
        portfolioUrl: profile.portfolioUrl || "",
        githubUrl: profile.githubUrl || ""
      });
    }
  }, [existingProfile]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileData) => {
      const response = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update profile');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      // Invalidate and refetch profile data to show changes everywhere
      queryClient.invalidateQueries({ queryKey: ["/api/admin/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileData);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Image size must be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please select a valid image file",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        // Compress the image by resizing it
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Set max dimensions
          const maxWidth = 400;
          const maxHeight = 400;
          let { width, height } = img;
          
          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw and compress
          ctx?.drawImage(img, 0, 0, width, height);
          const compressedData = canvas.toDataURL('image/jpeg', 0.8);
          
          setProfileData(prev => ({
            ...prev,
            avatar: compressedData
          }));
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="flex justify-center p-8">
        <AgricultureLoader theme="harvest" size="lg" text="Loading your profile..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Profile Management</h2>
        <Button
          onClick={handleSubmit}
          disabled={updateProfileMutation.isPending}
          className="bg-forest-green text-white hover:opacity-80"
        >
          <Save className="w-4 h-4 mr-2" />
          {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Author Information</CardTitle>
          <CardDescription>
            This information will appear on all blog posts and throughout the site
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Photo */}
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-forest-green flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                {profileData.avatar ? (
                  <img 
                    src={profileData.avatar} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  profileData.name.charAt(0)
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow-lg cursor-pointer hover:bg-gray-50">
                <Camera className="w-4 h-4 text-gray-600" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
            <div>
              <h3 className="font-medium">Profile Photo</h3>
              <p className="text-sm text-gray-500">
                Upload a professional photo that will appear next to your posts
              </p>
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input
                id="name"
                value={profileData.name}
                onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                className="rounded-golden-sm"
                placeholder="Your display name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                className="rounded-golden-sm"
                placeholder="your@email.com"
              />
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={profileData.bio}
              onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
              className="rounded-golden-sm"
              rows={3}
              placeholder="Tell readers about yourself..."
            />
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Social Media Links</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input
                  id="linkedin"
                  value={profileData.linkedinUrl || ""}
                  onChange={(e) => setProfileData(prev => ({
                    ...prev,
                    linkedinUrl: e.target.value
                  }))}
                  className="rounded-golden-sm"
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  value={profileData.instagramUrl || ""}
                  onChange={(e) => setProfileData(prev => ({
                    ...prev,
                    instagramUrl: e.target.value
                  }))}
                  className="rounded-golden-sm"
                  placeholder="https://instagram.com/username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="youtube">YouTube</Label>
                <Input
                  id="youtube"
                  value={profileData.youtubeUrl || ""}
                  onChange={(e) => setProfileData(prev => ({
                    ...prev,
                    youtubeUrl: e.target.value
                  }))}
                  className="rounded-golden-sm"
                  placeholder="https://youtube.com/channel/..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="github">GitHub</Label>
                <Input
                  id="github"
                  value={profileData.githubUrl || ""}
                  onChange={(e) => setProfileData(prev => ({
                    ...prev,
                    githubUrl: e.target.value
                  }))}
                  className="rounded-golden-sm"
                  placeholder="https://github.com/username"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="portfolio">Photo Portfolio</Label>
                <Input
                  id="portfolio"
                  value={profileData.portfolioUrl || ""}
                  onChange={(e) => setProfileData(prev => ({
                    ...prev,
                    portfolioUrl: e.target.value
                  }))}
                  className="rounded-golden-sm"
                  placeholder="https://yourportfolio.com"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
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
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Analytics</h2>
        <div className="flex justify-center p-8">
          <AgricultureLoader theme="sunshine" size="lg" text="Analyzing your farm's growth..." />
        </div>
      </div>
    );
  }

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
  const { 
    user: persistentUser, 
    isAuthenticated: isPersistentAuth, 
    isLoading: isPersistentLoading,
    logout: persistentLogout,
    isAdminUser
  } = usePersistentAuth();

  // Use persistent auth as primary, fallback to regular auth
  const finalUser = persistentUser || user;
  const finalIsAuthenticated = isPersistentAuth || isAuthenticated;
  const finalIsLoading = isPersistentLoading || isLoading;

  const handleLogout = () => {
    trackEvent('admin_logout', 'authentication', 'logout_button');
    
    // Use persistent logout if available
    if (persistentLogout) {
      persistentLogout();
    } else {
      fetch('/api/auth/logout', { method: 'POST' })
        .then(() => {
          window.location.href = '/admin';
        })
        .catch(() => {
          window.location.href = '/admin';
        });
    }
  };

  // Show loading state
  if (finalIsLoading) {
    return <AgriculturePageLoader message="Preparing your farm dashboard..." />;
  }

  // Show login if not authenticated
  if (!finalIsAuthenticated) {
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
              <p className="text-gray-600 mt-2">Welcome back, {finalUser?.name}</p>
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
              <TabsTrigger value="profile">
                <User className="w-4 h-4 mr-2" />
                Profile
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

            <TabsContent value="profile">
              <ProfileManagement />
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