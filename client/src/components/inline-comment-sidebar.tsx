import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface InlineComment {
  id: string;
  paragraphId: string;
  selectedText: string;
  content: string;
  authorName: string;
  createdAt: Date;
  startOffset: number;
  endOffset: number;
}

interface InlineCommentSidebarProps {
  postId: string;
  highlightedParagraph: string | null;
  onCommentClick: (paragraphId: string) => void;
}

export function InlineCommentSidebar({ postId, highlightedParagraph, onCommentClick }: InlineCommentSidebarProps) {
  const { data: comments = [], isLoading } = useQuery<InlineComment[]>({
    queryKey: [`/api/blog-posts/${postId}/inline-comments`],
  });

  const groupedComments = comments.reduce((acc, comment) => {
    if (!acc[comment.paragraphId]) acc[comment.paragraphId] = [];
    acc[comment.paragraphId].push(comment);
    return acc;
  }, {} as Record<string, InlineComment[]>);

  if (isLoading) {
    return (
      <div className="sticky top-24">
        <div className="text-sm text-gray-500">Loading comments...</div>
      </div>
    );
  }

  return (
    <div className="sticky top-24 space-y-4 max-h-[calc(100vh-8rem)] overflow-y-auto">
      <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-gray-700">
        <MessageCircle className="h-4 w-4" />
        <span>Inline Comments ({comments.length})</span>
      </div>

      {Object.entries(groupedComments).map(([paragraphId, paraComments]) => (
        <div 
          key={paragraphId}
          className={`transition-all ${highlightedParagraph === paragraphId ? 'ring-2 ring-sage-400 rounded-lg p-1' : ''}`}
        >
          {paraComments.map((comment) => (
            <Card 
              key={comment.id} 
              className="mb-2 p-3 hover:shadow-md transition cursor-pointer bg-white"
              onClick={() => onCommentClick(paragraphId)}
            >
              <div className="text-xs text-sage-700 bg-sage-50 p-2 rounded mb-2 border-l-2 border-sage-400 italic">
                "{comment.selectedText.length > 80 ? comment.selectedText.substring(0, 80) + '...' : comment.selectedText}"
              </div>
              <div className="flex gap-2 mb-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs bg-sage-100 text-sage-700">
                    {comment.authorName[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-semibold text-sm text-gray-900">{comment.authorName}</div>
                  <div className="text-xs text-gray-500">{formatDate(new Date(comment.createdAt))}</div>
                </div>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{comment.content}</p>
            </Card>
          ))}
        </div>
      ))}

      {comments.length === 0 && (
        <div className="text-center py-8">
          <MessageCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No inline comments yet.</p>
          <p className="text-xs text-gray-400 mt-1">Select text to add one!</p>
        </div>
      )}
    </div>
  );
}
