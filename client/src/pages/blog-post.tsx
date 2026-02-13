import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import SocialShare from "@/components/social-share";
import SEOHead from "@/components/seo-head";
import TableOfContents from "@/components/table-of-contents";
import ReadingProgress from "@/components/reading-progress";
import ScrollToTopButton from "@/components/scroll-to-top-button";
import RelatedPostsByTags from "@/components/related-posts-by-tags";
import { formatDate } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import type { BlogPostWithDetails, Annotation } from "@shared/schema";

import { useEffect, useMemo, useRef, useState } from "react";
import TagDisplay from "@/components/tag-display";
import { ContentSkeleton, AdaptiveLoader } from "@/components/loading";
import ReactMarkdown from 'react-markdown';
import { stableParagraphId, extractTextFromChildren } from '@/lib/paragraph-utils';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import 'highlight.js/styles/github-dark.css';
import { ensureMarkdown } from '@/lib/html-to-markdown';
import CommentSection from "@/components/comments/comment-section";
import { SelectionToolbar, type AnnotationAction } from "@/components/selection-toolbar";
import { InlineCommentSidebar } from "@/components/inline-comment-sidebar";
import { useTextSelection } from "@/hooks/useTextSelection";
import { useAnonymousUser } from "@/hooks/useAnonymousUser";
import { applyHighlights } from "@/lib/highlight-utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const contentRef = useRef<HTMLDivElement>(null);
  const { selection, clearSelection } = useTextSelection(contentRef);
  const [highlightedParagraph, setHighlightedParagraph] = useState<string | null>(null);
  const [activeAnnotation, setActiveAnnotation] = useState<{
    selectedText: string;
    paragraphId: string;
    startOffset: number;
    endOffset: number;
    parentAnnotationId?: string;
  } | null>(null);
  const [noteInput, setNoteInput] = useState<{ show: boolean; text: string; paragraphId: string; startOffset: number; endOffset: number } | null>(null);

  const { userId } = useAnonymousUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: post,
    isLoading,
    error,
  } = useQuery<BlogPostWithDetails>({
    queryKey: [`/api/blog-post`, { slug, includeDrafts: true }],
    enabled: !!slug,
  });

  // Track blog post view when post loads
  useEffect(() => {
    if (post) {
      // trackEvent("page_view", "blog_post", post.title, post.readTime);
    }
  }, [post]);

  const { data: relatedPosts } = useQuery<BlogPostWithDetails[]>({
    queryKey: [`/api/blog-posts/${post?.id}/related`],
    enabled: !!post?.id,
  });

  // Fetch annotations for this post
  // Query key matches invalidation key (without userId) so cache refreshes properly after mutations
  const { data: annotations = [] } = useQuery<Annotation[]>({
    queryKey: [`/api/blog-posts/${post?.id}/inline-comments`],
    queryFn: async () => {
      const res = await fetch(`/api/blog-posts/${post?.id}/inline-comments?userId=${userId}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch annotations');
      return res.json();
    },
    enabled: !!post?.id,
  });

  // Mutation for creating annotations (highlights, notes)
  const createAnnotation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', `/api/blog-posts/${post?.id}/inline-comments`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/blog-posts/${post?.id}/inline-comments`] });
    },
  });

  // Apply text highlights after render
  useEffect(() => {
    if (!contentRef.current || !annotations.length) return;
    const timer = requestAnimationFrame(() => {
      if (contentRef.current) {
        applyHighlights(contentRef.current, annotations, (annotationId) => {
          const annotation = annotations.find((a) => a.id === annotationId);
          if (annotation) {
            setActiveAnnotation({
              selectedText: annotation.selectedText,
              paragraphId: annotation.paragraphId,
              startOffset: annotation.startOffset,
              endOffset: annotation.endOffset,
              parentAnnotationId: annotation.id,
            });
          }
        });
      }
    });
    return () => cancelAnimationFrame(timer);
  }, [annotations, post?.content]);

  // Handle toolbar actions
  const handleToolbarAction = (action: AnnotationAction) => {
    if (!selection || !post) return;

    if (action === 'highlight') {
      createAnnotation.mutate({
        type: 'highlight',
        selectedText: selection.text,
        paragraphId: selection.paragraphId,
        startOffset: selection.startOffset,
        endOffset: selection.endOffset,
        anonymousUserId: userId,
      });
      toast({ title: 'Text highlighted!' });
      clearSelection();
    }

    if (action === 'respond') {
      setActiveAnnotation({
        selectedText: selection.text,
        paragraphId: selection.paragraphId,
        startOffset: selection.startOffset,
        endOffset: selection.endOffset,
      });
      clearSelection();
    }

    if (action === 'share') {
      const shareUrl = `${window.location.origin}/blog/${post.slug}#:~:text=${encodeURIComponent(selection.text.substring(0, 200))}`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        toast({ title: 'Link copied!', description: 'Share this highlighted text with others.' });
      });
      clearSelection();
    }

    if (action === 'note') {
      setNoteInput({
        show: true,
        text: selection.text,
        paragraphId: selection.paragraphId,
        startOffset: selection.startOffset,
        endOffset: selection.endOffset,
      });
      clearSelection();
    }
  };

  // Submit private note
  const submitNote = (noteContent: string) => {
    if (!noteInput || !post) return;
    createAnnotation.mutate({
      type: 'note',
      selectedText: noteInput.text,
      paragraphId: noteInput.paragraphId,
      startOffset: noteInput.startOffset,
      endOffset: noteInput.endOffset,
      anonymousUserId: userId,
      content: noteContent,
    });
    toast({ title: 'Note saved!' });
    setNoteInput(null);
  };

  // Memoize plugin arrays to prevent ReactMarkdown re-renders that destroy <mark> elements
  const remarkPluginsMemo = useMemo(() => [remarkGfm], []);
  const rehypePluginsMemo = useMemo(() => [rehypeSlug, rehypeHighlight], []);

  // Stable paragraph ID components for ReactMarkdown
  // IMPORTANT: Only depend on post?.content to prevent DOM destruction that wipes <mark> highlights
  const markdownComponents = useMemo(() => {
    let paragraphIndex = 0;
    return {
      p: ({ children, ...props }: any) => {
        const textContent = extractTextFromChildren(children);
        const pid = stableParagraphId(textContent, paragraphIndex++);
        return (
          <p {...props} data-paragraph-id={pid}>
            {children}
          </p>
        );
      },
      li: ({ children, ...props }: any) => {
        const textContent = extractTextFromChildren(children);
        const pid = stableParagraphId(textContent, paragraphIndex++);
        return (
          <li {...props} data-paragraph-id={pid}>
            {children}
          </li>
        );
      },
    };
  }, [post?.content]);

  // Memoize the entire ReactMarkdown output so unrelated re-renders don't destroy <mark> highlights
  const renderedContent = useMemo(() => (
    <ReactMarkdown
      remarkPlugins={remarkPluginsMemo}
      rehypePlugins={rehypePluginsMemo}
      components={markdownComponents}
    >
      {ensureMarkdown(post?.content || '')}
    </ReactMarkdown>
  ), [remarkPluginsMemo, rehypePluginsMemo, markdownComponents, post?.content]);

  // Apply yellow flash highlight on sidebar click via DOM manipulation
  // (separate from useMemo to avoid destroying <mark> elements)
  useEffect(() => {
    if (!contentRef.current) return;
    contentRef.current.querySelectorAll('[data-paragraph-id].bg-yellow-50').forEach((el) => {
      el.classList.remove('bg-yellow-50', 'transition-colors');
    });
    if (highlightedParagraph) {
      const el = contentRef.current.querySelector(`[data-paragraph-id="${highlightedParagraph}"]`);
      if (el) {
        el.classList.add('bg-yellow-50', 'transition-colors');
      }
    }
  }, [highlightedParagraph]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <AdaptiveLoader size="lg" text="Loading article..." color="text-forest-green" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="pt-24 pb-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl font-playfair font-bold text-gray-900 mb-4">
              Article Not Found
            </h1>
            <p className="text-gray-600 mb-8">
              The article you're looking for doesn't exist or has been moved.
            </p>
            <Link href="/">
              <Button className="bg-forest-green hover:bg-forest-green text-white">
                <ArrowLeft className="h-4 w-4 mr-2" />
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Generate SEO data for maximum AI chatbot and search engine visibility
  const currentUrl = `${window.location.origin}/blog/${post.slug}`;
  const keywords = [
    ...(post.tags || []),
    post.title.toLowerCase(),
    'agricultural technology',
    'precision farming',
    'smart agriculture'
  ];

  // Generate enhanced OG image URL with post-specific data
  const ogImageUrl = post ? 
    `${window.location.origin}/api/og-image?title=${encodeURIComponent(post.title)}&category=${encodeURIComponent(post.tags?.[0] || 'Technology')}&author=San&excerpt=${encodeURIComponent(post.excerpt.substring(0, 100))}` :
    `${window.location.origin}/api/og-image?title=Blog Post`;

  // Use featured image if available, otherwise use generated OG image
  const socialImage = post?.featuredImage && post.featuredImage.trim() !== '' 
    ? post.featuredImage 
    : ogImageUrl;

  return (
    <>
      <SEOHead
        title={`${post.title} - San's Agricultural Technology Blog`}
        description={post.excerpt}
        keywords={keywords}
        image={socialImage}
        url={currentUrl}
        type="article"
        tags={post?.tags || []}
        category={post?.tags?.[0] || 'Agricultural Technology'}
        readingTime={post.readTime}
        wordCount={post.content.split(/\s+/).length}
        publishedTime={post.createdAt instanceof Date ? post.createdAt.toISOString() : post.createdAt}
        modifiedTime={post.updatedAt instanceof Date ? post.updatedAt.toISOString() : post.updatedAt}
      />

      <div className="min-h-screen bg-gradient-to-br from-sage-50 to-fresh-lime-50">
        <Navigation />
        
        <main className="container mx-auto px-6 pt-24">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Table of Contents Sidebar - Left */}
              <aside className="lg:col-span-1 hidden lg:block">
                <div className="sticky top-24">
                  <TableOfContents content={post.content} />
                </div>
              </aside>

              {/* Main Content */}
              <article className="lg:col-span-3">
                <header className="mb-8">
                  <div className="mb-4">
                    <h1 className="text-4xl md:text-5xl font-bold text-forest-green font-playfair leading-tight">
                      {post.title}
                    </h1>
                  </div>

                  {/* Post Meta */}
                  <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-6">

                    {/* Date */}
                    <time dateTime={post.createdAt instanceof Date ? post.createdAt.toISOString() : post.createdAt}>
                      {new Date(post.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </time>

                    {/* Read Time */}
                    <span>•</span>
                    <span>{post.readTime} min read</span>
                  </div>


                  {/* Article Summary Box */}
                  {post.summary && (
                    <div className="bg-gradient-to-r from-sage-50 to-fresh-lime-50 border-l-4 border-forest-green rounded-lg p-6 mb-8">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-forest-green rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-forest-green mb-2">
                            Article Summary
                          </h3>
                          <p className="text-gray-700 leading-relaxed">
                            {post.summary}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </header>

                {/* Featured Image */}
                {post.featuredImage && (
                  <img 
                    src={post.featuredImage} 
                    alt={post.title}
                    className="w-full h-auto max-h-[32rem] md:max-h-[40rem] lg:max-h-[48rem] object-cover object-center featured-image-no-margin mb-8"
                    style={{
                      aspectRatio: 'auto',
                      maxWidth: '100%',
                      height: 'auto',
                      margin: '0 0 2rem 0', // Only bottom margin for spacing from content
                      display: 'block' // Ensure no inline spacing
                    }}
                    onLoad={(e) => {
                      const img = e.target as HTMLImageElement;
                      const aspectRatio = img.naturalWidth / img.naturalHeight;
                      
                      // If image is portrait (height > width)
                      if (aspectRatio < 1) {
                        img.style.objectFit = 'contain';
                        img.style.maxHeight = '48rem';
                      } else {
                        // Landscape images
                        img.style.objectFit = 'cover';
                      }
                    }}
                  />
                )}

            {/* Article Content */}
            <div 
              ref={contentRef}
              className="blog-content prose prose-lg max-w-none mb-8
                prose-headings:text-forest-green prose-headings:font-playfair
                prose-p:text-gray-700 prose-p:leading-relaxed
                prose-a:text-sage-600 hover:prose-a:text-sage-700
                prose-strong:text-forest-green
                prose-blockquote:border-l-sage-500 prose-blockquote:text-gray-600
                prose-code:bg-sage-100 prose-code:text-sage-800 prose-code:px-1 prose-code:rounded
              "
            >
              {renderedContent}
            </div>

            {/* Selection Toolbar */}
            {selection && post && (
              <SelectionToolbar
                position={selection.position}
                onAction={handleToolbarAction}
              />
            )}

            {/* Private Note Input */}
            {noteInput?.show && (
              <div className="fixed z-50 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 p-4 animate-in fade-in"
                style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
              >
                <div className="text-xs text-amber-800 bg-amber-50 p-2 rounded mb-3 border-l-2 border-amber-400 italic max-h-20 overflow-y-auto">
                  "{noteInput.text.length > 100 ? noteInput.text.substring(0, 100) + '...' : noteInput.text}"
                </div>
                <textarea
                  autoFocus
                  placeholder="Write a private note..."
                  className="w-full text-sm border rounded p-2 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
                  rows={3}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      const value = (e.target as HTMLTextAreaElement).value.trim();
                      if (value) submitNote(value);
                    }
                    if (e.key === 'Escape') setNoteInput(null);
                  }}
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button onClick={() => setNoteInput(null)} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                  <button
                    onClick={(e) => {
                      const textarea = (e.currentTarget.parentElement?.previousElementSibling as HTMLTextAreaElement);
                      const value = textarea?.value?.trim();
                      if (value) submitNote(value);
                    }}
                    className="text-xs bg-amber-500 text-white px-3 py-1 rounded hover:bg-amber-600"
                  >Save Note</button>
                </div>
              </div>
            )}

            {/* Comment Section - Moved here to be right after article content */}
            <CommentSection postId={post.id.toString()} postTitle={post.title} />

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="border-t border-gray-200 pt-6 mb-8">
                <TagDisplay
                  tags={post.tags}
                />
              </div>
            )}

            {/* Social Share */}
            <div className="border-t border-gray-200 pt-6 mb-8">
              <SocialShare 
                  url={`/blog/${post.slug}`}
                  title={post.title}
                  excerpt={post.excerpt}
               />
            </div>
            {/* Related Posts */}
            <RelatedPostsByTags 
              currentPostId={post.id} 
              currentPostTags={post.tags || []}
            />

              </article>

              {/* Inline Comment Sidebar - Right */}
              <aside className="lg:col-span-1 hidden lg:block">
                {post && (
                  <InlineCommentSidebar
                    postId={post.id.toString()}
                    highlightedParagraph={highlightedParagraph}
                    activeAnnotation={activeAnnotation}
                    onCloseActiveAnnotation={() => setActiveAnnotation(null)}
                    onCommentClick={(paragraphId) => {
                      setHighlightedParagraph(paragraphId);
                      const element = document.querySelector(`[data-paragraph-id="${paragraphId}"]`);
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        // Blink the green highlights within this paragraph
                        const marks = element.querySelectorAll('mark.inline-highlight');
                        marks.forEach((mark) => {
                          mark.classList.add('highlight-blink');
                          setTimeout(() => mark.classList.remove('highlight-blink'), 2000);
                        });
                      }
                      setTimeout(() => setHighlightedParagraph(null), 2000);
                    }}
                  />
                )}
              </aside>
            </div>
          </div>
        </main>

        <Footer />
        <ScrollToTopButton />
      </div>
    </>
  );
}
