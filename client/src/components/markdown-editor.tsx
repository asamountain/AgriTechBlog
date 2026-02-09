import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { createLowlight } from 'lowlight';
import javascript from 'highlight.js/lib/languages/javascript';
import python from 'highlight.js/lib/languages/python';
import css from 'highlight.js/lib/languages/css';

const lowlight = createLowlight();
lowlight.register({ javascript, python, css });
import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Bold, Italic, Strikethrough, Code, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Image as ImageIcon, Link as LinkIcon,
  Eye, EyeOff, Save, CheckCircle, AlertCircle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import 'highlight.js/styles/github-dark.css';
import { InlineSpinner } from '@/components/loading-animations';

interface MarkdownEditorProps {
  initialContent?: string;
  initialTitle?: string;
  initialTags?: string[];
  initialExcerpt?: string;
  initialFeaturedImage?: string;
  isPublished?: boolean;
  isFeatured?: boolean;
  onSave?: (data: {
    title: string;
    content: string;
    excerpt: string;
    tags: string[];
    featuredImage: string;
    isPublished: boolean;
    isFeatured: boolean;
  }) => Promise<void>;
  onAutoSave?: (data: {
    title: string;
    content: string;
    excerpt: string;
    tags: string[];
    featuredImage: string;
    isPublished: boolean;
    isFeatured: boolean;
  }) => Promise<void>;
}

export default function MarkdownEditor({
  initialContent = '',
  initialTitle = '',
  initialTags = [],
  initialExcerpt = '',
  initialFeaturedImage = '',
  isPublished = false,
  isFeatured = false,
  onSave,
  onAutoSave
}: MarkdownEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [excerpt, setExcerpt] = useState(initialExcerpt);
  const [featuredImage, setFeaturedImage] = useState(initialFeaturedImage);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [newTag, setNewTag] = useState('');
  const [published, setPublished] = useState(isPublished);
  const [featured, setFeatured] = useState(isFeatured);
  const [showPreview, setShowPreview] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg shadow-md',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:text-blue-800 underline',
        },
      }),
      Placeholder.configure({
        placeholder: 'Start writing your post... Use # for headings, **bold**, *italic*, and more!',
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto',
        },
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[400px] p-4',
      },
    },
  });

  // Auto-save functionality
  const getCurrentData = useCallback(() => ({
    title,
    content: editor?.getHTML() || '',
    excerpt,
    tags,
    featuredImage,
    isPublished: published,
    isFeatured: featured,
  }), [title, editor, excerpt, tags, featuredImage, published, featured]);

  const autoSave = useCallback(async () => {
    if (!onAutoSave || saveStatus === 'saving') return;

    try {
      setSaveStatus('saving');
      const data = getCurrentData();
      
      // Save to localStorage as backup
      localStorage.setItem('blog-draft', JSON.stringify({
        ...data,
        timestamp: new Date().toISOString(),
      }));

      await onAutoSave(data);
      setSaveStatus('saved');
      setLastSaved(new Date());
      
      // Reset status after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Auto-save failed:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, [onAutoSave, getCurrentData, saveStatus]);

  // Auto-save every 10 seconds when content changes
  useEffect(() => {
    const interval = setInterval(autoSave, 10000);
    return () => clearInterval(interval);
  }, [autoSave]);

  // Auto-save on content change (debounced)
  useEffect(() => {
    const timer = setTimeout(autoSave, 2000);
    return () => clearTimeout(timer);
  }, [title, excerpt, tags, featuredImage, autoSave]);

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('blog-draft');
    if (savedDraft && !initialTitle && !initialContent) {
      try {
        const draft = JSON.parse(savedDraft);
        setTitle(draft.title || '');
        setExcerpt(draft.excerpt || '');
        setFeaturedImage(draft.featuredImage || '');
        setTags(draft.tags || []);
        setPublished(draft.isPublished || false);
        setFeatured(draft.isFeatured || false);
        if (editor && draft.content) {
          editor.commands.setContent(draft.content);
        }
      } catch (error) {
        console.error('Failed to load draft:', error);
      }
    }
  }, [editor, initialTitle, initialContent]);

  const handleSave = async () => {
    if (!onSave) return;

    try {
      setSaveStatus('saving');
      const data = getCurrentData();
      await onSave(data);
      setSaveStatus('saved');
      setLastSaved(new Date());
      
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

  const addImage = () => {
    const url = window.prompt('Enter image URL:');
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const getSaveStatusIcon = () => {
    switch (saveStatus) {
      case 'saving':
        return <InlineSpinner size="sm" />;
      case 'saved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getSaveStatusText = () => {
    switch (saveStatus) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return lastSaved ? `Saved at ${lastSaved.toLocaleTimeString()}` : 'Saved';
      case 'error':
        return 'Save failed';
      default:
        return '';
    }
  };

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header with save status */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-forest-green">Create New Post</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {getSaveStatusIcon()}
            {getSaveStatusText()}
          </div>
          <Button
            onClick={() => setShowPreview(!showPreview)}
            variant="outline"
            className="flex items-center gap-2"
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className="flex items-center gap-2 bg-forest-green hover:bg-forest-green/90"
          >
            <Save className="w-4 h-4" />
            {published ? 'Publish' : 'Save Draft'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editor */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-4">
              <div className="space-y-4">
                <Input
                  placeholder="Post title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-2xl font-bold border-none p-0 focus:ring-0 placeholder:text-gray-400"
                />
                
                {/* Toolbar */}
                <div className="flex flex-wrap gap-2 border-b pb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''}
                  >
                    <Heading1 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}
                  >
                    <Heading2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    className={editor.isActive('heading', { level: 3 }) ? 'bg-gray-200' : ''}
                  >
                    <Heading3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={editor.isActive('bold') ? 'bg-gray-200' : ''}
                  >
                    <Bold className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={editor.isActive('italic') ? 'bg-gray-200' : ''}
                  >
                    <Italic className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    className={editor.isActive('strike') ? 'bg-gray-200' : ''}
                  >
                    <Strikethrough className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    className={editor.isActive('code') ? 'bg-gray-200' : ''}
                  >
                    <Code className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={editor.isActive('bulletList') ? 'bg-gray-200' : ''}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={editor.isActive('orderedList') ? 'bg-gray-200' : ''}
                  >
                    <ListOrdered className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    className={editor.isActive('blockquote') ? 'bg-gray-200' : ''}
                  >
                    <Quote className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={addImage}
                  >
                    <ImageIcon className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={addLink}
                  >
                    <LinkIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {showPreview ? (
                <div className="prose prose-lg max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeSlug, rehypeHighlight]}
                  >
                    {editor.getText()}
                  </ReactMarkdown>
                </div>
              ) : (
                <EditorContent editor={editor} />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Post Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Post Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="published"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="published" className="text-sm font-medium">
                  Published
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="featured" className="text-sm font-medium">
                  Featured Post
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Excerpt */}
          <Card>
            <CardHeader>
              <CardTitle>Excerpt</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                placeholder="Brief description of your post..."
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                className="w-full p-3 border rounded-md resize-none h-24"
              />
            </CardContent>
          </Card>

          {/* Featured Image */}
          <Card>
            <CardHeader>
              <CardTitle>Featured Image</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Image URL..."
                value={featuredImage}
                onChange={(e) => setFeaturedImage(e.target.value)}
              />
              {featuredImage && (
                <img
                  src={featuredImage}
                  alt="Featured"
                  className="mt-2 w-full h-32 object-cover rounded-md"
                />
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Add tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  className="flex-1"
                />
                <Button onClick={addTag} size="sm">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => removeTag(tag)}
                  >
                    {tag} ×
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}