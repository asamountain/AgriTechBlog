import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import SimpleMarkdownEditor from '@/components/simple-markdown-editor';
import Navigation from '@/components/navigation';
import { toast } from '@/hooks/use-toast';
import type { BlogPostWithDetails } from '@shared/schema';

export default function CreatePost() {
  const { id } = useParams<{ id?: string }>();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);

  // Fetch existing post if editing
  const { data: post, isLoading } = useQuery({
    queryKey: ['/api/admin/blog-posts', id],
    enabled: isEditing,
  });

  // Auto-save mutation for drafts
  const autoSaveMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      content: string;
      excerpt: string;
      tags: string[];
      featuredImage: string;
      isPublished: boolean;
      isFeatured: boolean;
    }) => {
      const payload = {
        ...data,
        slug: data.title.toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim(),
        isPublished: isEditing ? data.isPublished : false, // Always save as draft for auto-save on new posts
      };

      if (isEditing) {
        const response = await fetch(`/api/admin/blog-posts/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        return response.json();
      } else {
        const response = await fetch('/api/admin/blog-posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        return response.json();
      }
    },
    onSuccess: (savedPost) => {
      // If this was a new post, redirect to edit mode
      if (!isEditing && savedPost?.id) {
        setLocation(`/edit-post/${savedPost.id}`);
      }
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/admin/blog-posts'] });
    },
    onError: (error) => {
      console.error('Auto-save failed:', error);
    },
  });

  // Manual save mutation for publishing
  const saveMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      content: string;
      excerpt: string;
      tags: string[];
      featuredImage: string;
      isPublished: boolean;
      isFeatured: boolean;
    }) => {
      const payload = {
        ...data,
        slug: data.title.toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim(),
      };

      if (isEditing) {
        const response = await fetch(`/api/admin/blog-posts/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        return response.json();
      } else {
        const response = await fetch('/api/admin/blog-posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        return response.json();
      }
    },
    onSuccess: (savedPost: any) => {
      toast({
        title: 'Success',
        description: `Post ${savedPost.isPublished ? 'published' : 'saved as draft'} successfully!`,
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/admin/blog-posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/blog-posts'] });

      // Redirect to admin dashboard
      setLocation('/admin');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save post',
        variant: 'destructive',
      });
    },
  });

  const handleAutoSave = async (data: {
    title: string;
    content: string;
    excerpt: string;
    tags: string[];
    featuredImage: string;
    isPublished: boolean;
    isFeatured: boolean;
  }) => {
    // Only auto-save if there's content to save
    if (data.title.trim() || data.content.trim()) {
      await autoSaveMutation.mutateAsync(data);
    }
  };

  const handleSave = async (data: {
    title: string;
    content: string;
    excerpt: string;
    tags: string[];
    featuredImage: string;
    isPublished: boolean;
    isFeatured: boolean;
  }) => {
    await saveMutation.mutateAsync(data);
  };

  if (isEditing && isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sage-50 to-fresh-lime-50">
        <Navigation />
        <div className="container mx-auto px-6 py-24">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest-green"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 to-fresh-lime-50">
      <Navigation />
      <div className="pt-20">
        <SimpleMarkdownEditor
          initialContent={(post as any)?.content || ''}
          initialTitle={(post as any)?.title || ''}
          initialTags={(post as any)?.tags || []}
          initialExcerpt={(post as any)?.excerpt || ''}
          onAutoSave={handleAutoSave}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}