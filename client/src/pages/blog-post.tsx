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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { Clock, Calendar, User, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import type { BlogPostWithDetails, Author } from "@shared/schema";
import { trackEvent } from "@/lib/analytics";
import { useEffect } from "react";
import CommentSection from "@/components/comment-section";
import TagDisplay from "@/components/tag-display";
import { ContentSkeleton } from "@/components/loading-animations";

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();

  const {
    data: post,
    isLoading,
    error,
  } = useQuery<BlogPostWithDetails>({
    queryKey: [`/api/blog-posts/${slug}`],
    enabled: !!slug,
  });

  // Fetch profile data for author information
  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
  } = useQuery({
    queryKey: ["/api/profile"],
    retry: false,
    staleTime: 0, // Always refetch to get latest profile data
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes (gcTime instead of cacheTime in v5)
  });

  // Debug profile data
  useEffect(() => {
    console.log("Profile data:", profile);
    console.log("Profile loading:", profileLoading);
    console.log("Profile error:", profileError);
  }, [profile, profileLoading, profileError]);

  // Track blog post view when post loads
  useEffect(() => {
    if (post) {
      trackEvent("page_view", "blog_post", post.title, post.readTime);
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
  const authorName =
    (profile as any)?.name && (profile as any).name.trim() !== ""
      ? (profile as any).name
      : post.author.name;
  const currentUrl = `${window.location.origin}/blog/${post.slug}`;
  const keywords = [
    ...(post.tags || []),
    post.title.toLowerCase(),
  ];

  // Generate OG image URL
  const ogImageUrl = post ? 
    `/api/og-image?title=${encodeURIComponent(post.title)}` :
    '/api/og-image?title=Blog Post';

  return (
    <>
      <SEOHead
        title={post?.title || "Blog Post"}
        description={post?.excerpt || "Read this blog post"}
        keywords={[
          ...(post?.tags || []),
          post.title.toLowerCase(),
        ]}
        author={post?.author?.name || "Author"}
        publishedTime={post?.createdAt instanceof Date ? post.createdAt.toISOString() : post?.createdAt}
        image={ogImageUrl}
      />

      <div className="min-h-screen bg-gradient-to-br from-sage-50 to-fresh-lime-50">
        <Navigation />
        
        <main className="container mx-auto px-6 pt-24">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Table of Contents Sidebar - Left */}
              <aside className="lg:col-span-1">
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
                    {/* Author */}
                    {post.author && (
                      <div className="flex items-center gap-2">
                        {post.author.avatar && (
                          <img 
                            src={post.author.avatar} 
                            alt={post.author.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        )}
                        <span className="font-medium">{post.author.name}</span>
                      </div>
                    )}

                    {/* Date */}
                    <span>•</span>
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

                  {/* Excerpt */}
                  <p className="text-xl text-gray-700 leading-relaxed mb-8">
                    {post.excerpt}
                  </p>
                </header>

                {/* Featured Image */}
                {post.featuredImage && (
                  <div className="mb-8">
                    <img 
                      src={post.featuredImage} 
                      alt={post.title}
                      className="w-full h-96 object-cover rounded-xl shadow-lg"
                    />
                  </div>
                )}

            {/* Article Content */}
            <div 
              className="blog-content prose prose-lg max-w-none mb-8
                prose-headings:text-forest-green prose-headings:font-playfair
                prose-p:text-gray-700 prose-p:leading-relaxed
                prose-a:text-sage-600 hover:prose-a:text-sage-700
                prose-strong:text-forest-green
                prose-blockquote:border-l-sage-500 prose-blockquote:text-gray-600
                prose-code:bg-sage-100 prose-code:text-sage-800 prose-code:px-1 prose-code:rounded
              "
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="border-t border-gray-200 pt-6 mb-8">
                <TagDisplay
                  tags={post.tags}
                />
              </div>
            )}

            {/* Author Bio */}
            {post.author && (
              <div className="bg-sage-50 rounded-xl p-6 mb-8">
                <div className="flex items-start gap-4">
                  {post.author.avatar && (
                    <img 
                      src={post.author.avatar} 
                      alt={post.author.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-forest-green mb-2">
                      About {post.author.name}
                    </h3>
                    {post.author.bio && (
                      <p className="text-gray-700 mb-3">{post.author.bio}</p>
                    )}
                    <SocialShare 
                      url={`${window.location.origin}/blog/${post.slug}`}
                      title={post.title}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Related Posts */}
            <RelatedPostsByTags 
              currentPostId={post.id} 
              currentPostTags={post.tags || []}
            />

                {/* Comments Section */}
                <CommentSection postId={post.id} postTitle={post.title} />
              </article>
            </div>
          </div>
        </main>

        <Footer />
        <ScrollToTopButton />
      </div>
    </>
  );
}
