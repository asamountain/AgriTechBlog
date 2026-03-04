import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Highlighter, StickyNote, Heart } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useAnonymousUser } from '@/hooks/useAnonymousUser';
import { useAuth } from '@/hooks/useAuth';
import { useDeleteAnnotation } from '@/hooks/useDeleteAnnotation';
import { useLikeAnnotation } from '@/hooks/useLikeAnnotation';
import { DeleteAnnotationButton } from '@/components/delete-annotation-button';
import { ResponsePanel } from '@/components/response-panel';
import type { Annotation } from '@shared/schema';

interface InlineCommentSidebarProps {
  postId: string;
  highlightedParagraph: string | null;
  onCommentClick: (paragraphId: string) => void;
  /** Externally opened annotation (e.g. from toolbar Respond action) */
  activeAnnotation?: {
    selectedText: string;
    paragraphId: string;
    startOffset: number;
    endOffset: number;
    parentAnnotationId?: string;
  } | null;
  onCloseActiveAnnotation?: () => void;
}

export function InlineCommentSidebar({
  postId,
  highlightedParagraph,
  onCommentClick,
  activeAnnotation,
  onCloseActiveAnnotation,
}: InlineCommentSidebarProps) {
  const { userId } = useAnonymousUser();
  const { user } = useAuth();
  const isAdminUser = user?.email === 'seungjinyoun@gmail.com' ||
                      user?.email === 'admin@agritech.com';
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent');
  const deleteMutation = useDeleteAnnotation(postId);
  const likeMutation = useLikeAnnotation(postId);

  const { data: annotations = [], isLoading } = useQuery<Annotation[]>({
    queryKey: [`/api/blog-posts/${postId}/inline-comments`, sortBy],
    queryFn: async () => {
      const url = sortBy === 'popular'
        ? `/api/blog-posts/${postId}/inline-comments?userId=${userId}&sortBy=likes`
        : `/api/blog-posts/${postId}/inline-comments?userId=${userId}`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch annotations');
      return res.json();
    },
  });

  // If there's an active annotation from toolbar, show the response panel
  if (activeAnnotation) {
    return (
      <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
        <ResponsePanel
          postId={postId}
          selectedText={activeAnnotation.selectedText}
          paragraphId={activeAnnotation.paragraphId}
          startOffset={activeAnnotation.startOffset}
          endOffset={activeAnnotation.endOffset}
          parentAnnotationId={activeAnnotation.parentAnnotationId}
          onClose={onCloseActiveAnnotation || (() => {})}
        />
      </div>
    );
  }

  // Separate annotations by type
  const highlights = annotations.filter((a) => a.type === 'highlight' || a.type === 'response');
  const notes = annotations.filter((a) => a.type === 'note' && a.anonymousUserId === userId);

  // Group public annotations by paragraph
  const grouped = highlights.reduce(
    (acc, a) => {
      if (!acc[a.paragraphId]) acc[a.paragraphId] = [];
      acc[a.paragraphId].push(a);
      return acc;
    },
    {} as Record<string, Annotation[]>,
  );

  if (isLoading) {
    return (
      <div className="sticky top-24">
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="sticky top-24 space-y-4 max-h-[calc(100vh-8rem)] overflow-y-auto">
      {/* Header with sort toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Highlighter className="h-4 w-4" />
          <span>Annotations ({highlights.length})</span>
        </div>

        {/* Sort toggle */}
        <div className="flex gap-1 bg-gray-100 rounded-md p-1">
          <Button
            variant={sortBy === 'recent' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSortBy('recent')}
            className={`h-7 text-xs px-2 ${sortBy === 'recent' ? 'bg-forest-green hover:bg-forest-green/90 text-white' : ''}`}
          >
            Recent
          </Button>
          <Button
            variant={sortBy === 'popular' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSortBy('popular')}
            className={`h-7 text-xs px-2 ${sortBy === 'popular' ? 'bg-forest-green hover:bg-forest-green/90 text-white' : ''}`}
          >
            Popular
          </Button>
        </div>
      </div>

      {/* Public highlights & responses */}
      {Object.entries(grouped).map(([paragraphId, items]) => (
        <div
          key={paragraphId}
          className={`transition-all ${highlightedParagraph === paragraphId ? 'ring-2 ring-[#2D5016]/40 rounded-lg p-1' : ''}`}
        >
          {items.map((annotation) => (
            <Card
              key={annotation.id}
              className="mb-2 p-3 hover:shadow-md transition cursor-pointer bg-white group relative"
              onClick={() => onCommentClick(paragraphId)}
            >
              {/* Delete button - show for own annotations or admin */}
              {(annotation.anonymousUserId === userId || isAdminUser) && (
                <div
                  className="absolute top-2 right-2 z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DeleteAnnotationButton
                    onDelete={() => deleteMutation.mutate(annotation.id)}
                    isPending={deleteMutation.isPending}
                  />
                </div>
              )}

              {/* Quoted text */}
              <div className="text-xs text-forest-green bg-[rgba(45,80,22,0.06)] p-2 rounded mb-2 border-l-2 border-forest-green italic">
                "{annotation.selectedText.length > 80
                  ? annotation.selectedText.substring(0, 80) + '...'
                  : annotation.selectedText}"
              </div>

              {/* Author + content (for responses) */}
              {annotation.content && (
                <>
                  <div className="flex gap-2 mb-1">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={annotation.authorImage || undefined} />
                      <AvatarFallback className="text-[10px] bg-[rgba(45,80,22,0.10)] text-forest-green">
                        {annotation.authorName?.[0]?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-xs text-gray-900">{annotation.authorName}</div>
                          <div className="text-[10px] text-gray-400">
                            {formatDate(new Date(annotation.createdAt))}
                          </div>
                        </div>

                        {/* Like button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            likeMutation.mutate(annotation.id);
                          }}
                          className={`h-6 px-2 ${
                            annotation.likedByUserIds?.includes(userId)
                              ? 'text-red-500'
                              : 'text-gray-400 hover:text-red-500'
                          }`}
                        >
                          <Heart
                            className="h-3 w-3 mr-1"
                            fill={annotation.likedByUserIds?.includes(userId) ? 'currentColor' : 'none'}
                          />
                          <span className="text-[10px]">{annotation.likes || 0}</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed pl-7">{annotation.content}</p>
                </>
              )}

              {/* Highlight-only (no content) */}
              {!annotation.content && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[10px] text-gray-400">
                    <Highlighter className="h-3 w-3" />
                    <span>Highlighted</span>
                    <span>· {formatDate(new Date(annotation.createdAt))}</span>
                  </div>

                  {/* Like button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      likeMutation.mutate(annotation.id);
                    }}
                    className={`h-6 px-2 ${
                      annotation.likedByUserIds?.includes(userId)
                        ? 'text-red-500'
                        : 'text-gray-400 hover:text-red-500'
                    }`}
                  >
                    <Heart
                      className="h-3 w-3 mr-1"
                      fill={annotation.likedByUserIds?.includes(userId) ? 'currentColor' : 'none'}
                    />
                    <span className="text-[10px]">{annotation.likes || 0}</span>
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      ))}

      {/* Private notes */}
      {notes.length > 0 && (
        <div className="border-t pt-4 mt-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
            <StickyNote className="h-4 w-4" />
            <span>My Notes ({notes.length})</span>
          </div>
          {notes.map((note) => (
            <Card
              key={note.id}
              className="mb-2 p-3 bg-amber-50 border-amber-200 cursor-pointer hover:shadow-md transition group relative"
              onClick={() => onCommentClick(note.paragraphId)}
            >
              {/* Delete button for notes */}
              <div
                className="absolute top-2 right-2 z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <DeleteAnnotationButton
                  onDelete={() => deleteMutation.mutate(note.id)}
                  isPending={deleteMutation.isPending}
                />
              </div>

              <div className="text-xs text-amber-800 bg-amber-100/50 p-2 rounded mb-2 border-l-2 border-amber-400 italic">
                "{note.selectedText.length > 80
                  ? note.selectedText.substring(0, 80) + '...'
                  : note.selectedText}"
              </div>
              {note.content && (
                <p className="text-xs text-gray-700">{note.content}</p>
              )}
              <div className="text-[10px] text-gray-400 mt-1">
                {formatDate(new Date(note.createdAt))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {annotations.length === 0 && (
        <div className="text-center py-8">
          <Highlighter className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No annotations yet.</p>
          <p className="text-xs text-gray-400 mt-1">Select text to highlight or respond!</p>
        </div>
      )}
    </div>
  );
}
