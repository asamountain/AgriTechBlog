import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commentService } from '@/lib/comment-service';
import { isFirebaseConfigured } from '@/lib/firebase';
import { useAuthContext } from '@/components/auth/auth-provider';
import { LoginModal } from '@/components/auth/login-modal';
import type { Comment, CommentFormData } from '@/types/comments';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Heart, Reply, User, Calendar, Send, LogIn } from 'lucide-react';
import CommentItem from './comment-item';
import { AdaptiveLoader, InlineNatureSpinner } from '@/components/loading';

interface CommentSectionProps {
  postId: string;
  postTitle: string;
}

export default function CommentSection({ postId, postTitle }: CommentSectionProps) {
  const { isAuthenticated, profile, logout } = useAuthContext();
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [commentData, setCommentData] = useState<CommentFormData>({
    content: ''
  });
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyData, setReplyData] = useState<CommentFormData>({
    content: ''
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch comments
  const { data: comments, isLoading, error } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => commentService.getComments(postId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!postId && isFirebaseConfigured,
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: (data: CommentFormData) => commentService.addComment(postId, data, profile!.uid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      setCommentData({ content: '' });
      setShowCommentForm(false);
      toast({
        title: "Comment added!",
        description: "Your comment has been posted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to post comment. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Add reply mutation
  const addReplyMutation = useMutation({
    mutationFn: (data: CommentFormData) => 
      commentService.addReply(postId, replyingTo!, data, profile!.uid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      setReplyData({ content: '' });
      setReplyingTo(null);
      toast({
        title: "Reply added!",
        description: "Your reply has been posted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to post reply. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Like comment mutation
  const likeCommentMutation = useMutation({
    mutationFn: (commentId: string) => commentService.likeComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => commentService.deleteComment(commentId, profile!.uid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      toast({
        title: "Comment deleted",
        description: "Your comment has been removed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete comment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentData.content.trim()) {
      toast({
        title: "Missing comment",
        description: "Please write your comment before posting.",
        variant: "destructive",
      });
      return;
    }
    addCommentMutation.mutate(commentData);
  };

  const handleSubmitReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyData.content.trim()) {
      toast({
        title: "Missing reply",
        description: "Please write your reply before posting.",
        variant: "destructive",
      });
      return;
    }
    addReplyMutation.mutate(replyData);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (!isFirebaseConfigured) {
    return (
      <div className="mt-16 border-t border-gray-200 pt-8">
        <div className="text-center py-8">
          <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Comments</h3>
          <p className="text-gray-600">Comments are not available at this time.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mt-16 border-t border-gray-200 pt-8">
        <div className="flex items-center justify-center py-8">
          <AdaptiveLoader size="md" text="Loading comments..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-16 border-t border-gray-200 pt-8">
        <div className="text-center py-8">
          <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load comments</h3>
          <p className="text-gray-600 mb-4">There was an error loading the comments.</p>
          <Button onClick={() => window.location.reload()}>Try again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-16 border-t border-gray-200 pt-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-2">
          <MessageCircle className="h-6 w-6 text-gray-600" />
          <h2 className="text-2xl font-bold text-gray-900">
            Comments ({comments?.length || 0})
          </h2>
        </div>
        
        {isAuthenticated ? (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {profile?.photoURL && (
                <img 
                  src={profile.photoURL} 
                  alt={profile.displayName}
                  className="w-8 h-8 rounded-full"
                />
              )}
              <span className="text-sm text-gray-600">
                Signed in as {profile?.displayName}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={logout} className="border-forest-green text-forest-green hover:bg-forest-green hover:text-white">
              Sign out
            </Button>
          </div>
        ) : (
          <Button 
            onClick={() => setShowLoginModal(true)}
            className="bg-forest-green hover:bg-forest-green/90 text-white"
          >
            <LogIn className="mr-2 h-4 w-4" />
            Sign in to comment
          </Button>
        )}
      </div>

      {/* Comment Form - Only show if authenticated */}
      {isAuthenticated && (
        <div className="mb-8">
          {!showCommentForm ? (
            <Button 
              onClick={() => setShowCommentForm(true)}
              className="w-full justify-center py-3 bg-forest-green hover:bg-forest-green/90 text-white"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Write a comment...
            </Button>
          ) : (
            <form onSubmit={handleSubmitComment} className="space-y-4">
              <Textarea
                placeholder="Share your thoughts on this post..."
                value={commentData.content}
                onChange={(e) => setCommentData({ content: e.target.value })}
                className="min-h-[100px] resize-none"
                required
              />
              <div className="flex justify-end space-x-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCommentForm(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={addCommentMutation.isPending}
                  className="bg-forest-green hover:bg-forest-green/90 text-white"
                >
                  {addCommentMutation.isPending ? (
                    <InlineNatureSpinner size="sm" className="mr-2" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Post Comment
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Comments List */}
      {comments && comments.length > 0 ? (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={setReplyingTo}
              onLike={likeCommentMutation.mutate}
              onDelete={deleteCommentMutation.mutate}
              replyingTo={replyingTo}
              replyData={replyData}
              setReplyData={setReplyData}
              onSubmitReply={handleSubmitReply}
              onCancelReply={() => setReplyingTo(null)}
              formatDate={formatDate}
              isAuthenticated={isAuthenticated}
              currentUserId={profile?.uid}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No comments yet</h3>
          <p className="text-gray-600 mb-4">
            {isAuthenticated 
              ? "Be the first to share your thoughts on this post!"
              : "Sign in to be the first to comment on this post!"
            }
          </p>
          {!isAuthenticated && (
            <Button 
              onClick={() => setShowLoginModal(true)}
              className="bg-forest-green hover:bg-forest-green/90 text-white"
            >
              <LogIn className="mr-2 h-4 w-4" />
              Sign in to comment
            </Button>
          )}
        </div>
      )}

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => {
          setShowCommentForm(true);
        }}
      />
    </div>
  );
}
