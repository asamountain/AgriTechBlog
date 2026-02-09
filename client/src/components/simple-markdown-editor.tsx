import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import NotionEditor from '@/components/notion-editor';
import ImageUpload from '@/components/image-upload';
import { 
  Bold, Italic, Heading1, Heading2, Heading3,
  List, Quote, Image as ImageIcon, Eye, EyeOff, 
  Save, Clock, CheckCircle, AlertCircle, Wand2,
  Tag, FileText, Image, Settings
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import { ensureMarkdown, containsHtml } from '@/lib/html-to-markdown';
import { InlineSpinner } from '@/components/loading-animations';

interface SimpleMarkdownEditorProps {
  initialContent?: string;
  initialTitle?: string;
  initialTags?: string[];
  initialExcerpt?: string;
  initialFeaturedImage?: string;
  postId?: string | number; // Add post ID for AI features
  onSave?: (data: {
    title: string;
    content: string;
    excerpt: string;
    tags: string[];
    featuredImage: string;
    isPublished: boolean;
  }) => Promise<void>;
  onAutoSave?: (data: {
    title: string;
    content: string;
    excerpt: string;
    tags: string[];
    featuredImage: string;
    isPublished: boolean;
  }) => Promise<void>;
}

export default function SimpleMarkdownEditor({
  initialContent = '',
  initialTitle = '',
  initialTags = [],
  initialExcerpt = '',
  initialFeaturedImage = '',
  postId,
  onSave,
  onAutoSave
}: SimpleMarkdownEditorProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [excerpt, setExcerpt] = useState(initialExcerpt);
  const [featuredImage, setFeaturedImage] = useState(initialFeaturedImage);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [newTag, setNewTag] = useState('');
  const [published, setPublished] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [htmlDetected, setHtmlDetected] = useState(false);

  // Debug logging for field values
  useEffect(() => {
    console.log('SimpleMarkdownEditor - Field Values:', {
      title,
      content: content.substring(0, 100) + '...',
      excerpt,
      featuredImage,
      tags,
      published,
      postId
    });
  }, [title, content, excerpt, featuredImage, tags, published, postId]);

  // Refs to prevent unnecessary re-renders and track changes
  const lastSavedContent = useRef<string>('');
  const lastSavedTitle = useRef<string>('');
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const autoSaveIntervalRef = useRef<NodeJS.Timeout>();
  const isInitialized = useRef(false);
  const isDirty = useRef(false); // Track if user has unsaved changes

  // Memoized data getter to prevent unnecessary object creation
  const getCurrentData = useCallback(() => ({
    title,
    content,
    excerpt,
    featuredImage,
    tags,
    isPublished: published,
  }), [title, content, excerpt, featuredImage, tags, published]);

  // Check if content has actually changed
  const hasContentChanged = useCallback(() => {
    const currentData = getCurrentData();
    return (
      currentData.title !== lastSavedTitle.current ||
      currentData.content !== lastSavedContent.current
    );
  }, [getCurrentData]);

  // Auto-save function with proper memoization
  const autoSave = useCallback(async (force = false) => {
    if (!onAutoSave || saveStatus === 'saving') return;
    
    // Check if content has actually changed (unless forced)
    if (!force && !hasContentChanged()) return;
    
    try {
      setSaveStatus('saving');
      const currentData = getCurrentData();
      
      await onAutoSave(currentData);
      
      // Update last saved content to prevent unnecessary saves
      lastSavedContent.current = currentData.content;
      lastSavedTitle.current = currentData.title;
      isDirty.current = false; // Reset dirty flag after successful save
      
      setSaveStatus('saved');
      setLastSaved(new Date());
      
      toast({
        title: 'Auto-saved',
        description: 'Your changes have been automatically saved.',
      });
      
      // Reset status after a delay
      setTimeout(() => setSaveStatus('idle'), 4000);
    } catch (error) {
      console.error('Auto-save failed:', error);
      setSaveStatus('error');
      
      toast({
        title: 'Auto-save failed',
        description: 'Failed to auto-save your changes.',
        variant: 'destructive',
      });
      
      setTimeout(() => setSaveStatus('idle'), 4000);
    }
  }, [onAutoSave, getCurrentData, saveStatus, hasContentChanged, toast]);

  // Debounced auto-save on content change
  useEffect(() => {
    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Only auto-save if there's actual content and it's not the initial load
    if (isInitialized.current && (title.trim() || content.trim())) {
      autoSaveTimeoutRef.current = setTimeout(() => {
        autoSave();
      }, 3000); // 3 second debounce
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [title, content, excerpt, featuredImage, tags]); // Removed autoSave dependency

  // Periodic auto-save (every 30 seconds) - only when content exists
  useEffect(() => {
    if (isInitialized.current && (title.trim() || content.trim())) {
      autoSaveIntervalRef.current = setInterval(() => {
        if (hasContentChanged()) {
          autoSave();
        }
      }, 30000); // 30 seconds
    }

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [hasContentChanged, autoSave, title, content]); // Include function dependencies

  // Initialize content tracking after component mounts
  useEffect(() => {
    if (!isInitialized.current) {
      lastSavedContent.current = content;
      lastSavedTitle.current = title;
      isInitialized.current = true;
    }
  }, []); // Empty dependency array - only run once on mount

  // Convert HTML content when initialContent changes
  useEffect(() => {
    if (initialContent && containsHtml(initialContent)) {
      const convertedContent = ensureMarkdown(initialContent);
      setContent(convertedContent);
      setHtmlDetected(true);
    }
  }, [initialContent]);

  // Update state when initial values change (for editing existing posts)
  // BUT only if user hasn't made unsaved changes
  useEffect(() => {
    // Skip updates if user is actively editing (dirty flag is set)
    if (isDirty.current) return;
    
    // Only update if these are genuinely new initial values (e.g., switching posts)
    // Check if postId changed to avoid re-renders during typing
    setTitle(initialTitle);
    setContent(initialContent);
    setExcerpt(initialExcerpt);
    setFeaturedImage(initialFeaturedImage);
    setTags(initialTags);
  }, [postId]); // Only depend on postId to avoid cursor jumps

  // Load draft from localStorage on mount (only for new posts)
  useEffect(() => {
    if (!initialTitle && !initialContent) {
      const savedDraft = localStorage.getItem('blog-draft');
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          setTitle(draft.title || '');
          const draftContent = draft.content || '';
          setContent(containsHtml(draftContent) ? ensureMarkdown(draftContent) : draftContent);
          setExcerpt(draft.excerpt || '');
          setFeaturedImage(draft.featuredImage || '');
          setTags(draft.tags || []);
          setPublished(draft.isPublished || false);
        } catch (error) {
          console.error('Failed to load draft:', error);
        }
      }
    }
  }, [initialTitle, initialContent]);

  const handleSave = async () => {
    if (!onSave) return;

    try {
      setSaveStatus('saving');
      const data = getCurrentData();
      await onSave(data);
      isDirty.current = false; // Reset dirty flag after successful manual save
      setSaveStatus('saved');
      setLastSaved(new Date());
      
      // Update last saved content after manual save
      lastSavedContent.current = data.content;
      lastSavedTitle.current = data.title;
      
      // Clear localStorage draft after successful save
      localStorage.removeItem('blog-draft');
      
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Save failed:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
      isDirty.current = true;
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
    isDirty.current = true;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) {
      e.preventDefault();
      handleSave();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 to-fresh-lime-50">
      <div className="container mx-auto px-6 py-8">
        <Card className="shadow-xl">
          <CardHeader className="border-b bg-white/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold text-forest-green flex items-center gap-2">
                {postId ? (
                  <>
                    <Settings className="h-6 w-6" />
                    Edit Post #{postId}
                  </>
                ) : (
                  <>
                    <FileText className="h-6 w-6" />
                    Create New Post
                  </>
                )}
              </CardTitle>
              <div className="flex items-center gap-4">
                {/* Save Status Indicator */}
                <div className="flex items-center gap-2 text-sm">
                  {saveStatus === 'saving' && (
                    <>
                      <InlineSpinner size="sm" color="text-blue-600" />
                      <span className="text-blue-600">Saving...</span>
                    </>
                  )}
                  {saveStatus === 'saved' && (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-green-600">Saved</span>
                    </>
                  )}
                  {saveStatus === 'error' && (
                    <>
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span className="text-red-600">Save failed</span>
                    </>
                  )}
                  {saveStatus === 'idle' && lastSaved && (
                    <>
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-500">
                        Last saved: {lastSaved.toLocaleTimeString()}
                      </span>
                    </>
                  )}
                </div>
                
                <Button
                  onClick={() => setShowPreview(!showPreview)}
                  variant="outline"
                  size="sm"
                >
                  {showPreview ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                  {showPreview ? 'Hide Preview' : 'Show Preview'}
                </Button>
                
                <Button onClick={handleSave} className="bg-forest-green hover:bg-forest-green/90">
                  <Save className="h-4 w-4 mr-2" />
                  {published ? 'Publish' : 'Save Draft'}
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {!showPreview ? (
              <div className="space-y-6">
                {/* Debug Header for Development */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <h4 className="text-sm font-medium text-yellow-800 mb-2">🔍 Development Debug Info:</h4>
                    <div className="text-xs text-yellow-700 space-y-1">
                      <div>Post ID: {postId || 'New Post'}</div>
                      <div>Initial Title: {initialTitle ? `"${initialTitle}"` : 'Not set'}</div>
                      <div>Initial Content: {initialContent ? `${initialContent.length} chars` : 'Not set'}</div>
                      <div>Initial Excerpt: {initialExcerpt ? `"${initialExcerpt}"` : 'Not set'}</div>
                      <div>Initial Tags: {initialTags?.length ? initialTags.join(', ') : 'Not set'}</div>
                      <div>Initial Featured Image: {initialFeaturedImage ? 'Set' : 'Not set'}</div>
                    </div>
                  </div>
                )}

                {/* Title Input */}
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Heading1 className="h-4 w-4" />
                    Title *
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      isDirty.current = true;
                    }}
                    placeholder="Enter your post title..."
                    className="text-lg font-semibold"
                    onKeyDown={handleKeyDown}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Current length: {title.length} characters
                  </p>
                </div>

                {/* Content Editor - Notion-like WYSIWYG */}
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Content * (Type "/" for formatting options)
                  </label>
                  <div className="mb-2 flex gap-2 text-xs text-gray-600">
                    <span>• Type <code className="px-1 bg-gray-100 rounded">#</code> for heading</span>
                    <span>• Type <code className="px-1 bg-gray-100 rounded">**</code> for bold</span>
                    <span>• Type <code className="px-1 bg-gray-100 rounded">*</code> for italic</span>
                    <span>• Type <code className="px-1 bg-gray-100 rounded">-</code> for list</span>
                  </div>
                  <NotionEditor
                    content={content}
                    onChange={(val) => {
                      setContent(val);
                      isDirty.current = true;
                    }}
                    placeholder="Start typing your content... Use # for headings, **bold**, *italic*, - for lists..."
                  />
                  {htmlDetected && (
                    <p className="text-sm text-blue-600 mt-2">
                      HTML content detected and converted to Markdown
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Current length: {content.length} characters
                  </p>
                </div>

                {/* Excerpt Input */}
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Excerpt
                  </label>
                  <textarea
                    value={excerpt}
                    onChange={(e) => {
                      setExcerpt(e.target.value);
                      isDirty.current = true;
                    }}
                    placeholder="Brief description of your post..."
                    className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-forest-green focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This will appear in blog previews and social media shares. Current length: {excerpt.length} characters
                  </p>
                </div>

                {/* Featured Image */}
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    Featured Image (Thumbnail)
                  </label>
                  <ImageUpload
                    value={featuredImage}
                    onChange={(url) => {
                      setFeaturedImage(url);
                      isDirty.current = true;
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This image will appear in blog listings and social media shares (1200×630px recommended)
                  </p>
                </div>

                {/* Tags */}
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Tags
                  </label>
                  <div className="flex gap-2 mb-2 flex-wrap">
                    {tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-forest-green/10 text-forest-green border-forest-green/20"
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-2 text-forest-green/60 hover:text-forest-green"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add a tag..."
                      onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    />
                    <Button onClick={addTag} variant="outline" size="sm">
                      Add Tag
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Tags help readers find your content and improve SEO. Current tags: {tags.length}
                  </p>
                </div>

                {/* Publish Toggle */}
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="published"
                      checked={published}
                      onChange={(e) => setPublished(e.target.checked)}
                      className="rounded border-gray-300 text-forest-green focus:ring-forest-green"
                    />
                    <label htmlFor="published" className="text-sm font-medium text-gray-700">
                      Publish immediately (uncheck to save as draft)
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Current status: {published ? 'Will be published' : 'Will be saved as draft'}
                  </p>
                </div>

                {/* Debug Info (Development Only) */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">🔧 Current State Debug Info:</h4>
                    <div className="text-xs text-blue-700 space-y-1">
                      <div>Post ID: {postId || 'New Post'}</div>
                      <div>Title Length: {title.length}</div>
                      <div>Content Length: {content.length}</div>
                      <div>Excerpt Length: {excerpt.length}</div>
                      <div>Tags Count: {tags.length}</div>
                      <div>Featured Image: {featuredImage ? 'Set' : 'Not set'}</div>
                      <div>Published: {published ? 'Yes' : 'No'}</div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="prose prose-lg max-w-none">
                <h1>{title || 'Untitled Post'}</h1>
                {excerpt && <p className="text-gray-600 italic">{excerpt}</p>}
                {featuredImage && (
                  <div className="my-4">
                    <img
                      src={featuredImage}
                      alt="Featured image"
                      className="w-full max-w-2xl h-auto rounded-lg shadow-md"
                    />
                  </div>
                )}
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeSlug]}
                  className="prose-headings:text-forest-green prose-a:text-blue-600 prose-strong:text-forest-green"
                >
                  {content || 'No content yet...'}
                </ReactMarkdown>
                {tags.length > 0 && (
                  <div className="flex gap-2 mt-6">
                    {tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}