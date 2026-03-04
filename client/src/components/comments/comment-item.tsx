import React, { useState } from 'react';
import type { Comment, CommentFormData } from '@/types/comments';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Heart, Reply, User, Calendar, Send, MessageCircle, ExternalLink, Trash2 } from 'lucide-react';

interface CommentItemProps {
  comment: Comment;
  onReply: (commentId: string) => void;
  onLike: (commentId: string) => void;
  onDelete: (commentId: string) => void;
  replyingTo: string | null;
  replyData: CommentFormData;
  setReplyData: (data: CommentFormData) => void;
  onSubmitReply: (e: React.FormEvent) => void;
  onCancelReply: () => void;
  formatDate: (date: Date) => string;
  isAuthenticated: boolean;
  currentUserId?: string;
}

export default function CommentItem({ 
  comment, 
  onReply, 
  onLike, 
  onDelete,
  replyingTo, 
  replyData, 
  setReplyData, 
  onSubmitReply, 
  onCancelReply, 
  formatDate,
  isAuthenticated,
  currentUserId
}: CommentItemProps) {
  const [showReplies, setShowReplies] = useState(true);

  const isReplying = replyingTo === comment.id;
  const canDelete = isAuthenticated && currentUserId === comment.authorId;

  const handleUserProfileClick = () => {
    // Navigate to user profile page
    window.open(`/user/${comment.authorId}`, '_blank');
  };

  const handleDelete = (commentId: string) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      onDelete(commentId);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      {/* Comment Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          {comment.authorAvatar ? (
            <img 
              src={comment.authorAvatar} 
              alt={comment.authorName}
              className="w-10 h-10 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleUserProfileClick}
            />
          ) : (
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-gray-600" />
            </div>
          )}
          
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleUserProfileClick}
                className="font-semibold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer"
              >
                {comment.authorName}
              </button>
              <ExternalLink className="h-3 w-3 text-gray-400" />
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(comment.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Comment Actions */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onLike(comment.id)}
            className="text-gray-500 hover:text-red-500"
          >
            <Heart className="h-4 w-4 mr-1" />
            {comment.likes}
          </Button>
          
          {isAuthenticated && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReply(comment.id)}
              className="text-gray-500 hover:text-forest-green transition-colors"
            >
              <Reply className="h-4 w-4 mr-1" />
              Reply
            </Button>
          )}

          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(comment.id)}
              className="text-gray-500 hover:text-red-600 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Comment Content */}
      <div className="text-gray-800 mb-4">
        {comment.content}
      </div>

      {/* Reply Form */}
      {isReplying && (
        <form onSubmit={onSubmitReply} className="ml-12 mb-4">
          <Textarea
            placeholder="Write your reply..."
            value={replyData.content}
            onChange={(e) => setReplyData({ content: e.target.value })}
            className="mb-3"
            required
          />
          <div className="flex space-x-2">
            <Button 
              type="submit" 
              size="sm"
              className="bg-forest-green hover:bg-forest-green/90 text-white"
            >
              <Send className="h-3 w-3 mr-1" />
              Post Reply
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={onCancelReply}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-12">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowReplies(!showReplies)}
            className="text-gray-500 hover:text-forest-green mb-3"
          >
            <MessageCircle className="h-4 w-4 mr-1" />
            {showReplies ? 'Hide' : 'Show'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
          </Button>

          {showReplies && (
            <div className="space-y-3">
              {comment.replies.map((reply) => (
                <div key={reply.id} className="border-l-2 border-gray-200 pl-4 py-2">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {reply.authorAvatar ? (
                        <img 
                          src={reply.authorAvatar} 
                          alt={reply.authorName}
                          className="w-6 h-6 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => window.open(`/user/${reply.authorId}`, '_blank')}
                        />
                      ) : (
                        <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                          <User className="h-3 w-3 text-gray-600" />
                        </div>
                      )}
                      
                      <button
                        onClick={() => window.open(`/user/${reply.authorId}`, '_blank')}
                        className="font-medium text-gray-900 hover:text-blue-600 transition-colors cursor-pointer text-sm"
                      >
                        {reply.authorName}
                      </button>
                      <span className="text-xs text-gray-500">
                        {formatDate(reply.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onLike(reply.id)}
                        className="text-gray-500 hover:text-red-500 h-6 px-2"
                      >
                        <Heart className="h-3 w-3 mr-1" />
                        {reply.likes}
                      </Button>

                      {isAuthenticated && currentUserId === reply.authorId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(reply.id)}
                          className="text-gray-500 hover:text-red-600 h-6 px-2"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-gray-700 text-sm">
                    {reply.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
