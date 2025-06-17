import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import SocialShare from "@/components/social-share";
import SEOHead from "@/components/seo-head";
import TableOfContents from "@/components/table-of-contents";
import ReadingProgress from "@/components/reading-progress";
import ScrollToTop from "@/components/scroll-to-top";
import RelatedPostsByTags from "@/components/related-posts-by-tags";
import SimpleTextHighlighter from "@/components/simple-text-highlighter";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { Clock, Calendar, User, ArrowLeft, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import type { BlogPostWithDetails, Author } from "@shared/schema";
import { trackEvent } from "@/lib/analytics";
import { useEffect } from "react";
import CommentSection from "@/components/comment-section";
import TagDisplay from "@/components/tag-display";
import { AgriculturalSkeleton } from "@/components/loading-animations";

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const { user, isAuthenticated } = useAuth();

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
            <AgriculturalSkeleton />
            <div className="mt-8">
              <AgriculturalSkeleton />
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
    "agricultural technology",
    "precision agriculture",
    "IoT farming",
    "smart agriculture",
    "crop monitoring",
    "sustainable farming",
    "AgriTech innovation",
    post.category.name.toLowerCase(),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <ReadingProgress />
      <SEOHead
        title={`${post.title} | San's Agricultural Technology Blog`}
        description={post.excerpt}
        keywords={keywords}
        image={
          post.featuredImage ||
          `/api/og-image?title=${encodeURIComponent(post.title)}&category=${encodeURIComponent(post.category.name)}`
        }
        url={currentUrl}
        type="article"
        author={authorName}
        publishedTime={new Date(post.createdAt).toISOString()}
        modifiedTime={new Date(post.updatedAt).toISOString()}
        tags={post.tags || []}
        category={post.category.name}
      />
      <Navigation />

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Link href="/">
            <Button
              variant="ghost"
              className="mb-8 text-gray-600 hover:text-forest-green"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
            </Button>
          </Link>

          {/* Category Badge */}
          <div className="mb-6">
            <span
              className="inline-block px-4 py-2 text-sm font-medium text-white uppercase tracking-wide"
              style={{ backgroundColor: post.category.color }}
            >
              {post.category.name}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-8 leading-tight">
            {post.title}
          </h1>

          {/* Meta Info */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <Avatar className="w-8 h-8">
                  {(profile as any)?.avatar ? (
                    <img
                      src={(profile as any).avatar}
                      alt={
                        (profile as any)?.name &&
                        (profile as any).name.trim() !== ""
                          ? (profile as any).name
                          : post.author.name
                      }
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <AvatarFallback className="bg-forest-green text-white text-xs">
                      {((profile as any)?.name &&
                      (profile as any).name.trim() !== ""
                        ? (profile as any).name
                        : post.author.name
                      )
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")}
                    </AvatarFallback>
                  )}
                </Avatar>
                <span className="font-medium">
                  {(profile as any)?.name && (profile as any).name.trim() !== ""
                    ? (profile as any).name
                    : post.author.name}
                </span>
              </div>
              <span>{formatDate(post.createdAt)}</span>
              <span>{post.readTime} min read</span>
            </div>
            <SocialShare
              title={post.title}
              url={`${window.location.origin}/blog/${post.slug}`}
              excerpt={post.excerpt}
            />
          </div>
        </div>
      </section>

      {/* Featured Image Section */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto">
          <img
            src={post.featuredImage}
            alt={post.title}
            className="w-full h-96 md:h-[500px] object-cover"
          />
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Table of Contents - Desktop */}
            <div className="hidden lg:block lg:col-span-1">
              <TableOfContents content={post.content} />
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Excerpt */}
              <div className="mb-12">
                <div className="w-1 h-16 bg-forest-green mr-6 float-left"></div>
                <p className="text-xl text-gray-700 leading-relaxed font-light italic">
                  {post.excerpt}
                </p>
              </div>

              {/* Table of Contents - Mobile */}
              <div className="lg:hidden mb-8">
                <TableOfContents content={post.content} />
              </div>

              {/* Authentication Banner for Highlighting */}
              {!isAuthenticated && (
                <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <LogIn className="h-5 w-5 text-blue-600" />
                      <span className="text-blue-800">
                        Sign in to highlight text and add comments
                      </span>
                    </div>
                    <div className="flex space-x-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.location.href = '/auth/google'}
                        className="border-blue-300 text-blue-700 hover:bg-blue-100"
                      >
                        Sign in with Google
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.location.href = '/auth/github'}
                        className="border-blue-300 text-blue-700 hover:bg-blue-100"
                      >
                        Sign in with GitHub
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Article Content with Highlighting */}
              <div className="prose prose-lg max-w-none">
                <TextHighlighter
                  postId={post.id}
                  postSlug={post.slug}
                  user={user || undefined}
                  isOwner={user?.id === post.userId}
                >
                  <div
                    className="text-gray-700 leading-relaxed blog-content"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                  />
                </TextHighlighter>
              </div>
            </div>
          </div>

          {/* Tags and Categories */}
          {(post.tags?.length || post.category) && (
            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Topics & Tags
                </h3>
                <TagDisplay
                  tags={post.tags || []}
                  category={post.category}
                  size="md"
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Related Posts Section */}
      <RelatedPostsByTags 
        currentPostId={post.id} 
        currentPostTags={post.tags || []} 
      />

      {/* Comments Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <CommentSection postId={post.id} postTitle={post.title} />
        </div>
      </section>

      <Footer />
      <ScrollToTop />
    </div>
  );
}
