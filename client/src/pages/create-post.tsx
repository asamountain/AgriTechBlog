import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import SimpleMarkdownEditor from '@/components/simple-markdown-editor';
import Navigation from '@/components/navigation';
import { toast } from '@/hooks/use-toast';
import type { BlogPostWithDetails } from '@shared/schema';
import { LoadingSpinner } from '@/components/loading-animations';

export default function CreatePost() {
  const { id } = useParams<{ id?: string }>();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);

  // Fetch existing post if editing
  const { data: post, isLoading, error } = useQuery({
    queryKey: ['/api/admin/blog-posts', id],
    queryFn: async () => {
      if (!id) throw new Error('No post ID provided');
      // Use path parameter format to match server route
      const response = await fetch(`/api/admin/blog-posts/${id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch post: ${response.status}`);
      }
      return response.json();
    },
    enabled: isEditing && !!id,
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

      // Use path parameter format for updates, regular endpoint for new posts
      const url = isEditing ? `/api/admin/blog-posts/${id}` : '/api/admin/blog-posts';
      const method = isEditing ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Expected JSON response, got: ${text.substring(0, 100)}`);
      }
      
      return response.json();
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
        if (!response.ok) {
          throw new Error(`Failed to update post: ${response.status}`);
        }
        return response.json();
      } else {
        const response = await fetch('/api/admin/blog-posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          throw new Error(`Failed to create post: ${response.status}`);
        }
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

  // Debug logging for post data
  useEffect(() => {
    if (isEditing && post) {
      console.log('CreatePost - Editing existing post:', {
        id: post.id,
        title: post.title,
        content: post.content?.substring(0, 100) + '...',
        excerpt: post.excerpt,
        featuredImage: post.featuredImage,
        tags: post.tags,
        isPublished: post.isPublished,
        isFeatured: post.isFeatured
      });
    }
  }, [isEditing, post]);

  // Extract post data with proper fallbacks
  const postData = post as BlogPostWithDetails | undefined;
  const initialValues = {
    content: postData?.content || '',
    title: postData?.title || '',
    tags: postData?.tags || [],
    excerpt: postData?.excerpt || '',
    featuredImage: postData?.featuredImage || '',
    isPublished: postData?.isPublished || false,
    isFeatured: postData?.isFeatured || false
  };

  // Debug logging for initial values
  useEffect(() => {
    console.log('CreatePost - Initial values being passed to editor:', initialValues);
  }, [initialValues]);

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

  // Render loading state
  if (isEditing && isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sage-50 to-fresh-lime-50">
        <Navigation />
        <div className="container mx-auto px-6 py-24">
          <div className="flex items-center justify-center">
            <LoadingSpinner size="md" text="Loading post..." color="text-forest-green" />
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (isEditing && error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sage-50 to-fresh-lime-50">
        <Navigation />
        <div className="container mx-auto px-6 py-24">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Post</h1>
            <p className="text-gray-600 mb-6">
              {error instanceof Error ? error.message : 'Failed to load the post you want to edit.'}
            </p>
            <button
              onClick={() => setLocation('/admin')}
              className="bg-forest-green text-white px-6 py-2 rounded-lg hover:bg-forest-green/90"
            >
              Back to Admin Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render main editor
  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 to-fresh-lime-50">
      <Navigation />
      <div className="pt-20">
        <SimpleMarkdownEditor
          initialContent={initialValues.content}
          initialTitle={initialValues.title}
          initialTags={initialValues.tags}
          initialExcerpt={initialValues.excerpt}
          initialFeaturedImage={initialValues.featuredImage}
          postId={id}
          onAutoSave={(data) => handleAutoSave({ ...data, isFeatured: initialValues.isFeatured })}
          onSave={(data) => handleSave({ ...data, isFeatured: initialValues.isFeatured })}
        />
      </div>
    </div>
  );
}