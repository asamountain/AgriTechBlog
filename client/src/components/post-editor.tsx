import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, X, Wand2, Save } from "lucide-react";
import type { BlogPostWithDetails } from "@shared/schema";
import { ensureMarkdown, containsHtml } from "@/lib/html-to-markdown";
import { InlineSpinner } from "@/components/loading-animations";

interface PostEditorProps {
  post: BlogPostWithDetails;
  onClose: () => void;
}

export default function PostEditor({ post, onClose }: PostEditorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(() => ensureMarkdown(post.content));
  const [excerpt, setExcerpt] = useState(post.excerpt);
  const [featuredImage, setFeaturedImage] = useState(post.featuredImage || '');
  const [tags, setTags] = useState<string[]>(post.tags || []);
  const [newTag, setNewTag] = useState("");
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [isGeneratingExcerpt, setIsGeneratingExcerpt] = useState(false);
  const [htmlConverted, setHtmlConverted] = useState(containsHtml(post.content));

  // Update post mutation
  const updatePostMutation = useMutation({
    mutationFn: async (updateData: any) => {
      // Use admin endpoint with ID as path parameter for consistency
      const response = await fetch(`/api/admin/blog-posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      if (!response.ok) throw new Error('Failed to update post');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Post updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/blog-posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/blog-posts'] });
    },
  });

  // AI tagging mutation - simplified single function
  const generateTagsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/ai-tagging/analyze/${post.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to generate tags');
      return response.json();
    },
    onSuccess: (data: any) => {
      if (data.suggestedTags) {
        setTags(data.suggestedTags);
      }

      toast({
        title: "AI Analysis Complete",
        description: `Generated ${data.suggestedTags?.length || 0} tags with ${Math.round((data.confidence || 0) * 100)}% confidence`,
      });
    },
    onError: () => {
      toast({
        title: "AI Analysis Failed",
        description: "Could not generate tags and category suggestions",
        variant: "destructive",
      });
    },
  });

  // AI excerpt generation mutation
  const generateExcerptMutation = useMutation({
    mutationFn: async () => {
      if (post.id) {
        // Use existing post endpoint for saved posts
        const response = await fetch(`/api/ai-tagging/generate-excerpt/${post.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to generate excerpt');
        return response.json();
      } else {
        // Use content-based endpoint as fallback
        if (!title.trim() || !content.trim()) {
          throw new Error('Please add a title and content before generating an excerpt');
        }
        const response = await fetch('/api/ai-tagging/generate-excerpt-from-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content })
        });
        if (!response.ok) throw new Error('Failed to generate excerpt');
        return response.json();
      }
    },
    onSuccess: (data: any) => {
      if (data.excerpt) {
        setExcerpt(data.excerpt);
      }

      toast({
        title: "AI Excerpt Generated",
        description: "Created an engaging excerpt for your post",
      });
    },
    onError: (error: any) => {
      toast({
        title: "AI Excerpt Failed",
        description: error.message || "Could not generate excerpt. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerateTags = async () => {
    setIsGeneratingTags(true);
    await generateTagsMutation.mutateAsync();
    setIsGeneratingTags(false);
  };

  const handleGenerateExcerpt = async () => {
    setIsGeneratingExcerpt(true);
    await generateExcerptMutation.mutateAsync();
    setIsGeneratingExcerpt(false);
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSave = () => {
    updatePostMutation.mutate({
      title,
      content,
      excerpt,
      featuredImage,
      tags,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Edit Post</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-golden-lg space-y-golden-lg">
          {/* Title */}
          <div className="space-y-golden-xs">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-golden-sm"
            />
            {htmlConverted && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-2 text-xs text-blue-800">
                📝 HTML content was automatically converted to markdown format
              </div>
            )}
          </div>

          {/* Tags Section */}
          <div className="space-y-golden-sm">
            <div className="flex items-center justify-between">
              <Label>Tags</Label>
              <Button
                onClick={handleGenerateTags}
                disabled={isGeneratingTags}
                size="sm"
                className="bg-forest-green text-white hover:opacity-80"
              >
                {isGeneratingTags ? (
                  <InlineSpinner size="sm" className="mr-2" />
                ) : (
                  <Wand2 className="h-4 w-4 mr-2" />
                )}
                AI Generate
              </Button>
            </div>
            
            {/* Current Tags */}
            <div className="flex flex-wrap gap-golden-xs">
              {tags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="border-forest-green text-forest-green hover:bg-forest-green hover:text-white cursor-pointer p-golden-xs rounded-golden-sm"
                >
                  {tag}
                  <Button
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
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
                className="flex-1 rounded-golden-sm"
              />
              <Button onClick={addTag} size="sm" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Excerpt */}
          <div className="space-y-golden-xs">
            <div className="flex items-center justify-between">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Button
                onClick={handleGenerateExcerpt}
                disabled={isGeneratingExcerpt}
                size="sm"
                className="bg-forest-green text-white hover:opacity-80"
              >
                {isGeneratingExcerpt ? (
                  <InlineSpinner size="sm" className="mr-2" />
                ) : (
                  <Wand2 className="h-4 w-4 mr-2" />
                )}
                AI Generate
              </Button>
            </div>
            <Textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              className="rounded-golden-sm"
              placeholder="Write an engaging summary that captures readers' attention..."
            />
            <p className="text-xs text-gray-500">
              Create an attractive excerpt that hooks readers and encourages them to read the full post. Use AI Generate for compelling suggestions.
            </p>
          </div>

          {/* Featured Image / Thumbnail */}
          <div className="space-y-golden-xs">
            <Label htmlFor="featuredImage">Featured Image (Thumbnail)</Label>
            <Input
              id="featuredImage"
              type="url"
              placeholder="https://example.com/image.jpg"
              value={featuredImage}
              onChange={(e) => setFeaturedImage(e.target.value)}
              className="rounded-golden-sm"
            />
            {featuredImage && (
              <div className="mt-2">
                <img
                  src={featuredImage}
                  alt="Featured image preview"
                  className="w-full h-32 object-cover rounded-md border"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400';
                  }}
                />
                <p className="text-xs text-gray-600 mt-1">
                  Preview of how the thumbnail will appear on the blog
                </p>
              </div>
            )}
            <p className="text-xs text-gray-500">
              Enter a URL for the post thumbnail. This image will be displayed in blog listings, social shares, and as the featured image.
            </p>
          </div>

          {/* Content */}
          <div className="space-y-golden-xs">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              className="rounded-golden-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-golden-sm pt-golden-sm border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={updatePostMutation.isPending}
              className="bg-forest-green text-white hover:opacity-80"
            >
              {updatePostMutation.isPending ? (
                <InlineSpinner size="sm" className="mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}