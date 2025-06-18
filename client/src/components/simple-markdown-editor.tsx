import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Bold, Italic, Heading1, Heading2, Heading3,
  List, Quote, Image as ImageIcon, Eye, EyeOff, 
  Save, Clock, CheckCircle, AlertCircle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface SimpleMarkdownEditorProps {
  initialContent?: string;
  initialTitle?: string;
  initialTags?: string[];
  initialExcerpt?: string;
  onSave?: (data: {
    title: string;
    content: string;
    excerpt: string;
    tags: string[];
    isPublished: boolean;
  }) => Promise<void>;
  onAutoSave?: (data: {
    title: string;
    content: string;
    excerpt: string;
    tags: string[];
    isPublished: boolean;
  }) => Promise<void>;
}

export default function SimpleMarkdownEditor({
  initialContent = '',
  initialTitle = '',
  initialTags = [],
  initialExcerpt = '',
  onSave,
  onAutoSave
}: SimpleMarkdownEditorProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [excerpt, setExcerpt] = useState(initialExcerpt);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [newTag, setNewTag] = useState('');
  const [published, setPublished] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Auto-save functionality
  const getCurrentData = useCallback(() => ({
    title,
    content,
    excerpt,
    tags,
    isPublished: published,
  }), [title, content, excerpt, tags, published]);

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
      
      // Show success toast
      toast({
        title: "Draft saved",
        description: "Your changes have been automatically saved.",
        duration: 2000,
      });
      
      // Reset status after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Auto-save failed:', error);
      setSaveStatus('error');
      
      // Show error toast
      toast({
        title: "Auto-save failed",
        description: "Your changes could not be saved automatically. Please save manually.",
        variant: "destructive",
        duration: 4000,
      });
      
      setTimeout(() => setSaveStatus('idle'), 4000);
    }
  }, [onAutoSave, getCurrentData, saveStatus]);

  // Auto-save every 10 seconds when content changes
  useEffect(() => {
    const interval = setInterval(autoSave, 10000);
    return () => clearInterval(interval);
  }, [autoSave]);

  // Auto-save on content change (debounced)
  useEffect(() => {
    // Only auto-save if there's actual content
    if (title.trim() || content.trim()) {
      const timer = setTimeout(autoSave, 3000); // Increased to 3 seconds for better UX
      return () => clearTimeout(timer);
    }
  }, [title, content, excerpt, tags, autoSave]);

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('blog-draft');
    if (savedDraft && !initialTitle && !initialContent) {
      try {
        const draft = JSON.parse(savedDraft);
        setTitle(draft.title || '');
        setContent(draft.content || '');
        setExcerpt(draft.excerpt || '');
        setTags(draft.tags || []);
        setPublished(draft.isPublished || false);
      } catch (error) {
        console.error('Failed to load draft:', error);
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

  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = document.getElementById('content-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText = content.substring(0, start) + before + selectedText + after + content.substring(end);
    
    setContent(newText);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  };

  const getSaveStatusIcon = () => {
    switch (saveStatus) {
      case 'saving':
        return <Clock className="w-4 h-4 animate-spin text-blue-600" />;
      case 'saved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Save className="w-4 h-4 text-gray-400" />;
    }
  };

  const getSaveStatusText = () => {
    switch (saveStatus) {
      case 'saving':
        return 'Auto-saving...';
      case 'saved':
        return lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : 'Auto-saved';
      case 'error':
        return 'Save failed';
      default:
        return 'Waiting for changes';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header with save status */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-forest-green">Create New Post</h1>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-all duration-300 ${
            saveStatus === 'saving' ? 'bg-blue-50 border-blue-200' :
            saveStatus === 'saved' ? 'bg-green-50 border-green-200' :
            saveStatus === 'error' ? 'bg-red-50 border-red-200' :
            'bg-gray-50 border-gray-200'
          }`}>
            {getSaveStatusIcon()}
            <span className="text-sm font-medium">
              {getSaveStatusText()}
            </span>
          </div>
          <Button
            onClick={() => setShowPreview(!showPreview)}
            variant="outline"
            className="flex items-center gap-2"
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPreview ? 'Edit' : 'Preview'}
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
                
                {/* Markdown Toolbar */}
                <div className="flex flex-wrap gap-2 border-b pb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => insertMarkdown('# ', '')}
                    title="Heading 1"
                  >
                    <Heading1 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => insertMarkdown('## ', '')}
                    title="Heading 2"
                  >
                    <Heading2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => insertMarkdown('### ', '')}
                    title="Heading 3"
                  >
                    <Heading3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => insertMarkdown('**', '**')}
                    title="Bold"
                  >
                    <Bold className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => insertMarkdown('*', '*')}
                    title="Italic"
                  >
                    <Italic className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => insertMarkdown('- ', '')}
                    title="List"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => insertMarkdown('> ', '')}
                    title="Quote"
                  >
                    <Quote className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => insertMarkdown('![alt text](', ')')}
                    title="Image"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {showPreview ? (
                <div className="prose prose-lg max-w-none min-h-[400px] p-4 border rounded-md">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {content || '*No content yet. Start typing in edit mode!*'}
                  </ReactMarkdown>
                </div>
              ) : (
                <textarea
                  id="content-editor"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Start writing your post... Use # for headings, **bold**, *italic*, and more!"
                  className="w-full min-h-[400px] p-4 border rounded-md resize-none focus:ring-2 focus:ring-forest-green focus:border-transparent"
                />
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

          {/* Markdown Help */}
          <Card>
            <CardHeader>
              <CardTitle>Markdown Guide</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div><code># Heading 1</code></div>
              <div><code>## Heading 2</code></div>
              <div><code>**Bold text**</code></div>
              <div><code>*Italic text*</code></div>
              <div><code>- List item</code></div>
              <div><code>&gt; Quote</code></div>
              <div><code>![image](url)</code></div>
              <div><code>[link](url)</code></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}