import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import SocialShare from "@/components/social-share";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { Clock, Calendar, User, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import type { BlogPostWithDetails } from "@shared/schema";
import { trackEvent } from "@/lib/analytics";
import { useEffect } from "react";
import CommentSection from "@/components/comment-section";

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  
  const { data: post, isLoading, error } = useQuery<BlogPostWithDetails>({
    queryKey: [`/api/blog-posts/${slug}`],
    enabled: !!slug,
  });

  // Track blog post view when post loads
  useEffect(() => {
    if (post) {
      trackEvent('page_view', 'blog_post', post.title, post.readTime);
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
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4" />
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-8" />
              <div className="h-96 bg-gray-200 rounded mb-8" />
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded" />
                ))}
              </div>
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
              <Button className="bg-sage-green hover:bg-forest-green text-white">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Link href="/">
            <Button variant="ghost" className="mb-8 text-gray-600 hover:text-sage-green">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Articles
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
                  <AvatarFallback className="bg-sage-green text-white text-xs">
                    {post.author.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{post.author.name}</span>
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
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Excerpt */}
          <div className="mb-12">
            <div className="w-1 h-16 bg-sage-green mr-6 float-left"></div>
            <p className="text-xl text-gray-700 leading-relaxed font-light italic">
              {post.excerpt}
            </p>
          </div>

          {/* Main Content */}
          <div className="prose prose-lg max-w-none">
            <div 
              className="text-gray-700 leading-relaxed blog-content"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>
        </div>
      </section>

      {/* Comments Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <CommentSection postId={post.id} postTitle={post.title} />
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 bg-sage-green">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Stay Updated with AgroTech Insights
          </h2>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Get the latest insights on agricultural innovation and sustainable farming practices delivered to your inbox.
          </p>
          <Link href="/">
            <Button className="bg-white text-sage-green hover:bg-gray-100 font-medium py-3 px-8 text-lg">
              Explore More Articles
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
