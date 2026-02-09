import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { MessageCircle, X, Send } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface TextSelection {
  text: string;
  paragraphId: string;
  startOffset: number;
  endOffset: number;
  position: { top: number; left: number };
}

interface InlineCommentPopupProps {
  selection: TextSelection;
  postId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function InlineCommentPopup({ selection, postId, onClose, onSuccess }: InlineCommentPopupProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [content, setContent] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedName = localStorage.getItem('commenter_name');
    const savedEmail = localStorage.getItem('commenter_email');
    if (savedName) setName(savedName);
    if (savedEmail) setEmail(savedEmail);
  }, []);

  const submitMutation = useMutation({
    mutationFn: async (data: {
      authorName: string;
      authorEmail: string;
      content: string;
      selectedText: string;
      paragraphId: string;
      startOffset: number;
      endOffset: number;
    }) => {
      return await apiRequest(`/api/blog-posts/${postId}/inline-comments`, 'POST', data);
    },
    onSuccess: () => {
      localStorage.setItem('commenter_name', name);
      localStorage.setItem('commenter_email', email);

      toast({
        title: 'Comment submitted!',
        description: 'Your inline comment has been added.',
      });

      queryClient.invalidateQueries({ queryKey: [`/api/blog-posts/${postId}/inline-comments`] });
      onSuccess();
      onClose();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to submit comment. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !content.trim()) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all fields.',
        variant: 'destructive',
      });
      return;
    }

    if (!email.includes('@')) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }

    submitMutation.mutate({
      authorName: name.trim(),
      authorEmail: email.trim(),
      content: content.trim(),
      selectedText: selection.text,
      paragraphId: selection.paragraphId,
      startOffset: selection.startOffset,
      endOffset: selection.endOffset,
    });
  };

  return (
    <div
      ref={popupRef}
      className="fixed z-50 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 animate-in fade-in slide-in-from-top-2"
      style={{
        top: `${selection.position.top}px`,
        left: `${selection.position.left}px`,
      }}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-sage-600" />
            <h3 className="font-semibold text-sm">Comment on selection</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mb-3 p-2 bg-sage-50 rounded text-xs text-gray-700 border-l-2 border-sage-400 max-h-20 overflow-y-auto">
          "{selection.text}"
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-sm"
            required
          />
          <Input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="text-sm"
            required
          />
          <Textarea
            placeholder="Write your comment..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="text-sm resize-none"
            required
          />
          <Button
            type="submit"
            className="w-full bg-sage-600 hover:bg-sage-700 text-white text-sm"
            disabled={submitMutation.isPending}
          >
            <Send className="h-3 w-3 mr-2" />
            {submitMutation.isPending ? 'Submitting...' : 'Post Comment'}
          </Button>
        </form>
      </div>
    </div>
  );
}
