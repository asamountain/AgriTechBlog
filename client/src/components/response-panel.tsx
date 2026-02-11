import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, Send, Lock } from 'lucide-react';
import { FaGoogle, FaGithub } from 'react-icons/fa';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAnonymousUser } from '@/hooks/useAnonymousUser';
import { useDeleteAnnotation } from '@/hooks/useDeleteAnnotation';
import { DeleteAnnotationButton } from '@/components/delete-annotation-button';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/lib/utils';
import type { Annotation } from '@shared/schema';

interface ResponsePanelProps {
  postId: string;
  selectedText: string;
  paragraphId: string;
  startOffset: number;
  endOffset: number;
  /** If responding to an existing annotation, its ID */
  parentAnnotationId?: string;
  onClose: () => void;
}

export function ResponsePanel({
  postId,
  selectedText,
  paragraphId,
  startOffset,
  endOffset,
  parentAnnotationId,
  onClose,
}: ResponsePanelProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [content, setContent] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userId } = useAnonymousUser();
  const { isAuthenticated, user, signInWithGoogle, signInWithGithub, loading: authLoading } = useAuth();
  const isAdminUser = user?.email === 'seungjinyoun@gmail.com' ||
                      user?.email === 'admin@agritech.com';
  const deleteMutation = useDeleteAnnotation(postId);

  useEffect(() => {
    if (isAuthenticated && user) {
      setName(user.displayName || user.email?.split('@')[0] || 'Member');
      setEmail(user.email || '');
    } else {
      const savedName = localStorage.getItem('commenter_name');
      const savedEmail = localStorage.getItem('commenter_email');
      if (savedName) setName(savedName);
      if (savedEmail) setEmail(savedEmail);
    }
  }, [isAuthenticated, user]);

  // Fetch existing responses for this annotation
  const queryKey = parentAnnotationId
    ? `/api/blog-posts/${postId}/inline-comments?parentId=${parentAnnotationId}&userId=${userId}`
    : null;

  const { data: responses = [] } = useQuery<Annotation[]>({
    queryKey: queryKey ? [queryKey] : ['noop'],
    enabled: !!parentAnnotationId,
  });

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', `/api/blog-posts/${postId}/inline-comments`, data);
    },
    onSuccess: () => {
      if (!isAuthenticated) {
        localStorage.setItem('commenter_name', name);
        localStorage.setItem('commenter_email', email);
      }
      toast({ title: 'Response posted!' });
      queryClient.invalidateQueries({ queryKey: [`/api/blog-posts/${postId}/inline-comments`] });
      if (queryKey) {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      }
      setContent('');
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to submit response.', variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast({ 
        title: 'Authentication Required', 
        description: 'Please sign in to post a response.', 
        variant: 'destructive' 
      });
      return;
    }

    if (!name.trim() || !content.trim()) {
      toast({ title: 'Missing fields', description: 'Name and response are required.', variant: 'destructive' });
      return;
    }

    submitMutation.mutate({
      type: 'response',
      selectedText,
      paragraphId,
      startOffset,
      endOffset,
      authorName: name.trim(),
      authorEmail: email.trim(),
      anonymousUserId: userId,
      firebaseUserId: user?.uid,
      authorImage: user?.photoURL,
      content: content.trim(),
      parentAnnotationId,
    });
  };

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-2">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
        <p className="text-xs text-gray-500">Verifying session...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-gray-800 flex items-center gap-2">
          Respond
          {!isAuthenticated && <Lock className="h-3 w-3 text-gray-400" />}
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Quoted text */}
      <div className="p-3 bg-green-50 border-l-3 border-green-400 rounded-r text-sm text-gray-700 italic max-h-24 overflow-y-auto">
        "{selectedText.length > 150 ? selectedText.substring(0, 150) + '...' : selectedText}"
      </div>

      {/* Auth Gate or Response Form */}
      {!isAuthenticated ? (
        <div className="bg-white border rounded-lg p-4 text-center space-y-4 shadow-sm border-gray-100">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-900">Sign in to respond</p>
            <p className="text-xs text-gray-500">Join the community and verify your identity to share your thoughts.</p>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <Button 
              onClick={() => signInWithGoogle()} 
              variant="outline" 
              className="flex items-center justify-center gap-2 border-gray-200 hover:bg-gray-50 h-9"
            >
              <FaGoogle className="text-red-500 text-sm" />
              <span className="text-xs font-medium text-gray-700">Continue with Google</span>
            </Button>
            <Button 
              onClick={() => signInWithGithub()} 
              variant="outline" 
              className="flex items-center justify-center gap-2 border-gray-200 hover:bg-gray-50 h-9"
            >
              <FaGithub className="text-gray-900 text-sm" />
              <span className="text-xs font-medium text-gray-700">Continue with GitHub</span>
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-md border border-gray-100">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.photoURL || undefined} />
              <AvatarFallback className="text-xs bg-green-100 text-green-700">
                {user?.displayName?.[0]?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-gray-900 truncate">{user?.displayName}</div>
              <div className="text-[10px] text-gray-500 truncate">{user?.email}</div>
            </div>
          </div>
          
          <Textarea
            placeholder="What are your thoughts?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="text-sm resize-none focus-visible:ring-green-500 min-h-[100px]"
            autoFocus
          />
          <Button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white text-sm h-9 font-medium"
            disabled={submitMutation.isPending || !content.trim()}
          >
            <Send className="h-3.5 w-3.5 mr-2" />
            {submitMutation.isPending ? 'Posting...' : 'Post Response'}
          </Button>
        </form>
      )}

      {/* Existing responses thread */}
      {responses.length > 0 && (
        <div className="space-y-3 border-t pt-3 mt-4">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center justify-between">
            <span>Community Responses ({responses.length})</span>
          </div>
          <div className="space-y-4 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
            {responses.map((r) => (
              <div key={r.id} className="space-y-1 group relative">
                {/* Delete button for own responses */}
                {(r.anonymousUserId === userId || isAdminUser) && (
                  <div className="absolute top-0 right-0 z-10">
                    <DeleteAnnotationButton
                      onDelete={() => deleteMutation.mutate(r.id)}
                      isPending={deleteMutation.isPending}
                    />
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6 border border-gray-100">
                    <AvatarImage src={r.authorImage || undefined} />
                    <AvatarFallback className="text-[10px] bg-green-100 text-green-700 font-bold">
                      {r.authorName?.[0]?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-gray-900">{r.authorName}</span>
                    <span className="text-[9px] text-gray-400">{formatDate(new Date(r.createdAt))}</span>
                  </div>
                </div>
                <div className="bg-gray-50/50 rounded-lg p-2 ml-8 border border-transparent group-hover:border-gray-100 transition-colors">
                  <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{r.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
