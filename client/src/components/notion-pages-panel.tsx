/**
 * Notion Pages Panel - Display and process Notion pages from admin dashboard
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, ExternalLink, Sparkles, RefreshCw, Eye, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { markdownToHtml } from '@/lib/html-to-markdown';

interface NotionPage {
  id: string;
  title: string;
  status: string;
  lastEdited: string;
  created: string;
  tags?: string[];
  url: string;
  hasImages: boolean;
}

interface PagePreview {
  title: string;
  markdown: string;
  images: Array<{ url: string; alt: string }>;
  videos: Array<{ url: string }>;
}

const PAGES_PER_PAGE = 20;

export function NotionPagesPanel() {
  const queryClient = useQueryClient();
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewPageId, setPreviewPageId] = useState<string | null>(null);

  // Fetch Notion pages
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['notion-pages'],
    queryFn: async () => {
      const response = await fetch('/api/notion-sync/list-pages');
      if (!response.ok) throw new Error('Failed to fetch Notion pages');
      return response.json();
    },
    refetchInterval: 60000, // Refresh every 60 seconds (changed from 30)
  });

  // Fetch page preview
  const { data: previewData, isLoading: isLoadingPreview } = useQuery({
    queryKey: ['notion-preview', previewPageId],
    queryFn: async () => {
      if (!previewPageId) return null;
      const response = await fetch(`/api/notion-sync/preview/${previewPageId}`);
      if (!response.ok) throw new Error('Failed to fetch preview');
      const data = await response.json();
      return data.preview as PagePreview;
    },
    enabled: !!previewPageId,
  });

  // Process page mutation
  const processPageMutation = useMutation({
    mutationFn: async (pageId: string) => {
      const response = await apiRequest('POST', '/api/notion-sync/process-page', { pageId });
      return response;
    },
    onSuccess: (data, pageId) => {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(pageId);
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      refetch();
    },
    onError: (error, pageId) => {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(pageId);
        return next;
      });
      console.error('Processing failed:', error);
    },
  });

  const handleProcess = (pageId: string) => {
    setProcessingIds((prev) => new Set(prev).add(pageId));
    processPageMutation.mutate(pageId);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="ml-2">Loading Notion pages...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-red-600">
            <p className="font-semibold">Failed to load Notion pages</p>
            <p className="text-sm mt-2">{error instanceof Error ? error.message : 'Unknown error'}</p>
            <Button onClick={() => refetch()} className="mt-4" variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const allPages: NotionPage[] = data?.pages || [];

  // Filter pages by search query
  const filteredPages = searchQuery
    ? allPages.filter((p) =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : allPages;

  // Pagination
  const totalPages = Math.ceil(filteredPages.length / PAGES_PER_PAGE);
  const startIndex = (currentPage - 1) * PAGES_PER_PAGE;
  const endIndex = startIndex + PAGES_PER_PAGE;
  const currentPages = filteredPages.slice(startIndex, endIndex);

  const readyPages = currentPages.filter((p) => p.status === 'Ready to Publish');
  const otherPages = currentPages.filter((p) => p.status !== 'Ready to Publish');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Notion Pages ({allPages.length})
              </CardTitle>
              <CardDescription>
                Process pages from your Notion database into blog posts
              </CardDescription>
            </div>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search pages by title or tags..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1); // Reset to first page on search
                }}
                className="pl-9"
              />
            </div>
            {searchQuery && (
              <p className="text-sm text-muted-foreground mt-2">
                Found {filteredPages.length} page{filteredPages.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {filteredPages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {allPages.length === 0 ? (
                <>
                  <p>No pages found in your Notion database</p>
                  <p className="text-sm mt-2">Make sure your Notion integration has access to your database</p>
                </>
              ) : (
                <>
                  <p>No pages match your search</p>
                  <Button onClick={() => setSearchQuery('')} variant="link" className="mt-2">
                    Clear search
                  </Button>
                </>
              )}
            </div>
          ) : (
            <>
              {/* Ready to publish pages */}
              {readyPages.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-3 text-green-600">
                    Ready to Publish ({readyPages.length})
                  </h3>
                  <div className="space-y-3">
                    {readyPages.map((page) => (
                      <PageCard
                        key={page.id}
                        page={page}
                        onProcess={handleProcess}
                        onPreview={setPreviewPageId}
                        isProcessing={processingIds.has(page.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Other pages */}
              {otherPages.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
                    Other Pages ({otherPages.length})
                  </h3>
                  <div className="space-y-3">
                    {otherPages.map((page) => (
                      <PageCard
                        key={page.id}
                        page={page}
                        onProcess={handleProcess}
                        onPreview={setPreviewPageId}
                        isProcessing={processingIds.has(page.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {startIndex + 1}-{Math.min(endIndex, filteredPages.length)} of {filteredPages.length}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <div className="flex items-center gap-1">
                      <span className="text-sm">
                        Page {currentPage} of {totalPages}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!previewPageId} onOpenChange={() => setPreviewPageId(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewData?.title || 'Preview'}</DialogTitle>
            <DialogDescription>
              Markdown preview from Notion
            </DialogDescription>
          </DialogHeader>
          {isLoadingPreview ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : previewData ? (
            <div className="prose prose-sm max-w-none">
              <div dangerouslySetInnerHTML={{ __html: markdownToHtml(previewData.markdown) }} />
              {previewData.images.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold mb-2">Images ({previewData.images.length})</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {previewData.images.map((img, i) => (
                      <img
                        key={i}
                        src={img.url}
                        alt={img.alt}
                        className="rounded border"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">Failed to load preview</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PageCard({
  page,
  onProcess,
  onPreview,
  isProcessing,
}: {
  page: NotionPage;
  onProcess: (id: string) => void;
  onPreview?: (id: string) => void;
  isProcessing: boolean;
}) {
  const isReady = page.status === 'Ready to Publish';
  const lastEdited = new Date(page.lastEdited).toLocaleDateString();

  return (
    <div className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium truncate">{page.title}</h4>
            <Badge variant={isReady ? 'default' : 'secondary'} className="text-xs">
              {page.status}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground">
            Last edited: {lastEdited}
          </p>

          {page.tags && page.tags.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {page.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => window.open(page.url, '_blank')}
            title="Open in Notion"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>

          <Button
            size="sm"
            onClick={() => onProcess(page.id)}
            disabled={isProcessing || !isReady}
            title={!isReady ? 'Set status to "Ready to Publish" in Notion first' : undefined}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Post
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
