import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import SocialShare from "@/components/social-share";
import SEOHead from "@/components/seo-head";
import TableOfContents from "@/components/table-of-contents";
import ReadingProgress from "@/components/reading-progress";
import ScrollToTopButton from "@/components/scroll-to-top-button";
import RelatedPostsByTags from "@/components/related-posts-by-tags";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { Clock, Calendar, User, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import type { BlogPostWithDetails } from "@shared/schema";

import { useEffect, useRef, useState } from "react";
import TagDisplay from "@/components/tag-display";
import { ContentSkeleton } from "@/components/loading-animations";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import 'highlight.js/styles/github-dark.css';
import { ensureMarkdown } from '@/lib/html-to-markdown';
import { markdownToText } from "@/lib/html-to-markdown";
import CommentSection from "@/components/comments/comment-section";
import { InlineCommentPopup } from "@/components/inline-comment-popup";
import { InlineCommentSidebar } from "@/components/inline-comment-sidebar";
import { useTextSelection } from "@/hooks/useTextSelection";

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const contentRef = useRef<HTMLDivElement>(null);
  const { selection, clearSelection } = useTextSelection(contentRef);
  const [highlightedParagraph, setHighlightedParagraph] = useState<string | null>(null);

  const {
    data: post,
    isLoading,
    error,
  } = useQuery<BlogPostWithDetails>({
    queryKey: [`/api/blog-post?slug=${slug}`],
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="pt-24 pb-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <ContentSkeleton />
            <div className="mt-8">
              <ContentSkeleton />
            </div>
          </div>
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
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeSlug, rehypeHighlight]}
                components={{
                  p: ({ children, ...props }) => {
                    const paragraphId = `para-${Math.random().toString(36).substr(2, 9)}`;
                    return (
                      <p 
                        {...props} 
                        data-paragraph-id={paragraphId}
                        className={highlightedParagraph === paragraphId ? 'bg-yellow-50 transition-colors' : ''}
                      >
                        {children}
                      </p>
                    );
                  }
                }}
              >
                {ensureMarkdown(post.content)}
              </ReactMarkdown>
            </div>

            {/* Inline Comment Popup */}
            {selection && post && (
              <InlineCommentPopup
                selection={selection}
                postId={post.id.toString()}
                onClose={clearSelection}
                onSuccess={clearSelection}
              />
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
                    onCommentClick={(paragraphId) => {
                      setHighlightedParagraph(paragraphId);
                      const element = document.querySelector(`[data-paragraph-id="${paragraphId}"]`);
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
