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
import { Loader2, Plus, X, Wand2, Save } from "lucide-react";
import type { BlogPostWithDetails, Category } from "@shared/schema";

interface PostEditorProps {
  post: BlogPostWithDetails;
  onClose: () => void;
}

export default function PostEditor({ post, onClose }: PostEditorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [excerpt, setExcerpt] = useState(post.excerpt);
  const [categoryId, setCategoryId] = useState(post.categoryId.toString());
  const [tags, setTags] = useState<string[]>(post.tags || []);
  const [newTag, setNewTag] = useState("");
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  // Update post mutation
  const updatePostMutation = useMutation({
    mutationFn: async (updateData: any) => {
      const response = await fetch(`/api/blog-posts/${post.id}`, {
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
      if (data.suggestedCategory) {
        const matchingCategory = categories.find(cat => 
          cat.name.toLowerCase() === data.suggestedCategory.toLowerCase()
        );
        if (matchingCategory) {
          setCategoryId(matchingCategory.id.toString());
        }
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

  const handleGenerateTags = async () => {
    setIsGeneratingTags(true);
    await generateTagsMutation.mutateAsync();
    setIsGeneratingTags(false);
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
      categoryId: parseInt(categoryId),
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
          </div>

          {/* Category */}
          <div className="space-y-golden-xs">
            <Label htmlFor="category">Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="rounded-golden-sm">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
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
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              className="rounded-golden-sm"
            />
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
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
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