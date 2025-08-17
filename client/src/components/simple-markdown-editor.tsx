import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { 
  Bold, Italic, Heading1, Heading2, Heading3,
  List, Quote, Image as ImageIcon, Eye, EyeOff, 
  Save, Clock, CheckCircle, AlertCircle, Wand2, Loader2,
  Tag, FileText, Image, Settings
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import { ensureMarkdown, containsHtml } from '@/lib/html-to-markdown';

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

  // Optimized auto-save function with change detection
  const autoSave = useCallback(async (force = false) => {
    if (!onAutoSave || saveStatus === 'saving') return;
    
    // Only save if content has changed or forced
    if (!force && !hasContentChanged()) return;

    try {
      setSaveStatus('saving');
      const data = getCurrentData();
      
      await onAutoSave(data);
      
      // Update last saved content to prevent unnecessary saves
      lastSavedContent.current = data.content;
      lastSavedTitle.current = data.title;
      
      setSaveStatus('saved');
      setLastSaved(new Date());
      
      // Show success toast only for forced saves or significant changes
      if (force) {
        toast({
          title: "Draft saved",
          description: "Your changes have been automatically saved.",
          duration: 2000,
        });
      }
      
      // Reset status after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Auto-save failed:', error);
      setSaveStatus('error');
      
      // Show error toast only for forced saves
      if (force) {
        toast({
          title: "Auto-save failed",
          description: "Your changes could not be saved automatically. Please save manually.",
          variant: "destructive",
          duration: 4000,
        });
      }
      
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
  }, [title, content, excerpt, featuredImage, tags, autoSave]);

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
  }, [autoSave, hasContentChanged]);

  // Initialize content tracking after component mounts
  useEffect(() => {
    if (!isInitialized.current) {
      lastSavedContent.current = content;
      lastSavedTitle.current = title;
      isInitialized.current = true;
    }
  }, [content, title]);

  // Convert HTML content when initialContent changes
  useEffect(() => {
    if (initialContent && containsHtml(initialContent)) {
      const convertedContent = ensureMarkdown(initialContent);
      setContent(convertedContent);
      setHtmlDetected(true);
    }
  }, [initialContent]);

  // Update state when initial values change (for editing existing posts)
  useEffect(() => {
    if (initialTitle && initialTitle !== title) {
      setTitle(initialTitle);
    }
    if (initialContent && initialContent !== content) {
      setContent(initialContent);
    }
    if (initialExcerpt && initialExcerpt !== excerpt) {
      setExcerpt(initialExcerpt);
    }
    if (initialFeaturedImage && initialFeaturedImage !== featuredImage) {
      setFeaturedImage(initialFeaturedImage);
    }
    if (initialTags && initialTags.length > 0 && JSON.stringify(initialTags) !== JSON.stringify(tags)) {
      setTags(initialTags);
    }
  }, [initialTitle, initialContent, initialExcerpt, initialFeaturedImage, initialTags]);

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
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
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
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
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
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter your post title..."
                    className="text-lg font-semibold"
                    onKeyDown={handleKeyDown}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Current length: {title.length} characters
                  </p>
                </div>

                {/* Content Editor */}
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Content *
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your post content in Markdown..."
                    className="w-full h-96 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-forest-green focus:border-transparent"
                    onKeyDown={handleKeyDown}
                  />
                  {htmlDetected && (
                    <p className="text-sm text-blue-600 mt-2">
                      HTML content detected and converted to Markdown
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
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
                    onChange={(e) => setExcerpt(e.target.value)}
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
                    Featured Image URL (Thumbnail)
                  </label>
                  <Input
                    value={featuredImage}
                    onChange={(e) => setFeaturedImage(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                  {featuredImage && (
                    <div className="mt-3">
                      <img
                        src={featuredImage}
                        alt="Featured image preview"
                        className="w-32 h-20 object-cover rounded-lg border shadow-sm"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Preview of your thumbnail (1200x630px recommended)
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    This image will appear in blog listings and social media shares
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