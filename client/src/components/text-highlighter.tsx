import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, Lock, Unlock, Edit, Trash2, Reply } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/use-websocket";
import { apiRequest } from "@/lib/queryClient";
import type { HighlightWithDetails, HighlightCommentWithDetails, User } from "@shared/schema";

interface TextHighlighterProps {
  postId: number;
  postSlug: string;
  user?: User;
  isOwner: boolean;
  children: React.ReactNode;
}

interface HighlightData {
  text: string;
  startOffset: number;
  endOffset: number;
  elementPath: string;
}

interface CommentBubbleProps {
  highlight: HighlightWithDetails;
  user?: User;
  isOwner: boolean;
  onAddComment: (highlightId: number, content: string, isPrivate: boolean, parentId?: number) => void;
  onEditComment: (commentId: number, content: string) => void;
  onDeleteComment: (commentId: number) => void;
}

function CommentBubble({ highlight, user, isOwner, onAddComment, onEditComment, onDeleteComment }: CommentBubbleProps) {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    onAddComment(highlight.id, newComment, isPrivate, replyingTo || undefined);
    setNewComment("");
    setIsPrivate(false);
    setReplyingTo(null);
  };

  const handleEdit = (comment: HighlightCommentWithDetails) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const handleSaveEdit = (commentId: number) => {
    onEditComment(commentId, editContent);
    setEditingId(null);
    setEditContent("");
  };

  const renderComment = (comment: HighlightCommentWithDetails, isReply = false) => {
    const canEdit = user && (user.id === comment.userId || isOwner);
    const canView = !comment.isPrivate || user && (user.id === comment.userId || isOwner);

    if (!canView) return null;

    return (
      <div key={comment.id} className={`${isReply ? 'ml-6 border-l-2 border-gray-200 pl-3' : ''} mb-3`}>
        <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
          <img
            src={comment.user.avatar || '/api/placeholder/32/32'}
            alt={comment.user.name}
            className="w-6 h-6 rounded-full"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">{comment.user.name}</span>
              {comment.isPrivate && (
                <Badge variant="secondary" className="text-xs">
                  <Lock className="h-3 w-3 mr-1" />
                  Private
                </Badge>
              )}
              <span className="text-xs text-gray-500">
                {new Date(comment.createdAt).toLocaleDateString()}
              </span>
            </div>
            
            {editingId === comment.id ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleSaveEdit(comment.id)}>
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-700">{comment.content}</p>
            )}
            
            {!isReply && (
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setReplyingTo(comment.id)}
                  className="text-xs h-6"
                >
                  <Reply className="h-3 w-3 mr-1" />
                  Reply
                </Button>
                {canEdit && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(comment)}
                      className="text-xs h-6"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDeleteComment(comment.id)}
                      className="text-xs h-6 text-red-600"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Replies */}
        {comment.replies?.map(reply => renderComment(reply, true))}
      </div>
    );
  };

  return (
    <div className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-80 max-w-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-forest-green" />
          <span className="font-medium text-sm">Comments</span>
          <Badge variant="outline" className="text-xs">
            {highlight.comments.length}
          </Badge>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowComments(!showComments)}
          className="h-6 w-6 p-0"
        >
          {showComments ? '−' : '+'}
        </Button>
      </div>

      <div className="text-xs text-gray-600 mb-3 p-2 bg-gray-50 rounded border-l-4 border-forest-green">
        "{highlight.text}"
      </div>

      {showComments && (
        <div className="space-y-3">
          {/* Existing Comments */}
          {highlight.comments.map(comment => renderComment(comment))}

          {/* Add New Comment */}
          {user && (
            <div className="space-y-2 border-t pt-3">
              {replyingTo && (
                <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
                  Replying to comment
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setReplyingTo(null)}
                    className="ml-2 h-4 w-4 p-0"
                  >
                    ×
                  </Button>
                </div>
              )}
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="text-sm"
                rows={3}
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsPrivate(!isPrivate)}
                    className="text-xs h-6"
                  >
                    {isPrivate ? (
                      <>
                        <Lock className="h-3 w-3 mr-1" />
                        Private
                      </>
                    ) : (
                      <>
                        <Unlock className="h-3 w-3 mr-1" />
                        Public
                      </>
                    )}
                  </Button>
                </div>
                <Button size="sm" onClick={handleAddComment} disabled={!newComment.trim()}>
                  Comment
                </Button>
              </div>
            </div>
          )}

          {!user && (
            <div className="text-center py-4 text-sm text-gray-600">
              <a href="/auth/google" className="text-forest-green hover:underline">
                Sign in
              </a>
              {' '}to comment
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TextHighlighter({ postId, postSlug, user, isOwner, children }: TextHighlighterProps) {
  const [highlights, setHighlights] = useState<HighlightWithDetails[]>([]);
  const [activeHighlight, setActiveHighlight] = useState<HighlightWithDetails | null>(null);
  const [bubblePosition, setBubblePosition] = useState({ x: 0, y: 0 });
  const contentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // WebSocket for real-time updates
  const { isConnected } = useWebSocket(postId);

  // Fetch highlights for this post
  const { data: highlightsData } = useQuery<HighlightWithDetails[]>({
    queryKey: ["/api/highlights", postId],
  });

  useEffect(() => {
    if (highlightsData) {
      setHighlights(highlightsData);
    }
  }, [highlightsData]);

  // Create highlight mutation
  const createHighlightMutation = useMutation({
    mutationFn: async (highlightData: HighlightData) => {
      return apiRequest(`/api/highlights`, "POST", {
        blogPostId: postId,
        userId: user?.id,
        ...highlightData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/highlights", postId] });
      toast({ title: "Highlight created" });
    },
    onError: () => {
      toast({ title: "Failed to create highlight", variant: "destructive" });
    },
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async ({ highlightId, content, isPrivate, parentId }: {
      highlightId: number;
      content: string;
      isPrivate: boolean;
      parentId?: number;
    }) => {
      return apiRequest(`/api/highlights/${highlightId}/comments`, "POST", { content, isPrivate, parentId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/highlights", postId] });
      toast({ title: "Comment added" });
    },
    onError: () => {
      toast({ title: "Failed to add comment", variant: "destructive" });
    },
  });

  // Edit comment mutation
  const editCommentMutation = useMutation({
    mutationFn: async ({ commentId, content }: { commentId: number; content: string }) => {
      return apiRequest(`/api/highlight-comments/${commentId}`, "PATCH", { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/highlights", postId] });
      toast({ title: "Comment updated" });
    },
    onError: () => {
      toast({ title: "Failed to update comment", variant: "destructive" });
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      return apiRequest(`/api/highlight-comments/${commentId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/highlights", postId] });
      toast({ title: "Comment deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete comment", variant: "destructive" });
    },
  });

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedText = selection.toString().trim();
    
    if (selectedText.length < 10) return; // Minimum selection length

    // Get element path for accurate positioning
    const startContainer = range.startContainer;
    const elementPath = getElementPath(startContainer.nodeType === Node.TEXT_NODE 
      ? startContainer.parentElement 
      : startContainer as Element);

    const highlightData: HighlightData = {
      text: selectedText,
      startOffset: range.startOffset,
      endOffset: range.endOffset,
      elementPath,
    };

    // Create highlight
    createHighlightMutation.mutate(highlightData);

    // Clear selection
    selection.removeAllRanges();
  }, [createHighlightMutation, postId, user]);

  const getElementPath = (element: Element | null): string => {
    if (!element) return '';
    
    const path: string[] = [];
    let current = element;
    
    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      
      if (current.id) {
        selector += `#${current.id}`;
      } else if (current.className) {
        const classes = current.className.split(' ').filter(c => c.trim());
        if (classes.length > 0) {
          selector += `.${classes.join('.')}`;
        }
      }
      
      path.unshift(selector);
      current = current.parentElement;
    }
    
    return path.join(' > ');
  };

  const handleHighlightClick = (highlight: HighlightWithDetails, event: React.MouseEvent) => {
    event.stopPropagation();
    setActiveHighlight(highlight);
    setBubblePosition({ x: event.pageX, y: event.pageY });
  };

  const handleAddComment = (highlightId: number, content: string, isPrivate: boolean, parentId?: number) => {
    addCommentMutation.mutate({ highlightId, content, isPrivate, parentId });
  };

  const handleEditComment = (commentId: number, content: string) => {
    editCommentMutation.mutate({ commentId, content });
  };

  const handleDeleteComment = (commentId: number) => {
    deleteCommentMutation.mutate(commentId);
  };

  useEffect(() => {
    const handleClickOutside = () => {
      setActiveHighlight(null);
    };

    if (activeHighlight) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activeHighlight]);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    content.addEventListener('mouseup', handleTextSelection);
    return () => content.removeEventListener('mouseup', handleTextSelection);
  }, [handleTextSelection]);

  return (
    <div ref={contentRef} className="relative">
      {children}
      
      {/* Render existing highlights */}
      {highlights.map((highlight) => (
        <span
          key={highlight.id}
          className="bg-yellow-200 border-b-2 border-yellow-400 cursor-pointer hover:bg-yellow-300 transition-colors relative"
          onClick={(e) => handleHighlightClick(highlight, e)}
          title={`${highlight.comments.length} comment(s)`}
        >
          {highlight.text}
          {highlight.comments.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-forest-green text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {highlight.comments.length}
            </span>
          )}
        </span>
      ))}

      {/* Comment bubble */}
      {activeHighlight && (
        <div
          style={{
            position: 'absolute',
            left: bubblePosition.x,
            top: bubblePosition.y + 20,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <CommentBubble
            highlight={activeHighlight}
            user={user}
            isOwner={isOwner}
            onAddComment={handleAddComment}
            onEditComment={handleEditComment}
            onDeleteComment={handleDeleteComment}
          />
        </div>
      )}
    </div>
  );
}