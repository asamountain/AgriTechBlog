import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { Clock, Calendar, User, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import type { BlogPostWithDetails } from "@shared/schema";

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  
  const { data: post, isLoading, error } = useQuery<BlogPostWithDetails>({
    queryKey: [`/api/blog-posts/${slug}`],
    enabled: !!slug,
  });

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
    <div className="min-h-screen relative">
      {/* Background Image */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('${post.featuredImage}')` }}
      />
      
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/30" />
      
      {/* Back Button - Fixed Position */}
      <Link href="/">
        <Button 
          variant="ghost" 
          className="fixed top-6 left-6 z-50 bg-black/20 backdrop-blur-md border border-white/20 text-white hover:bg-black/30 hover:text-white rounded-full p-3"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </Link>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          {/* Glassmorphism Card */}
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
            {/* Category Badge */}
            <div className="mb-6">
              <span 
                className="inline-block px-4 py-2 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: post.category.color }}
              >
                {post.category.name}
              </span>
            </div>
            
            {/* Title */}
            <h1 className="text-white font-bold text-3xl md:text-4xl mb-6 leading-tight font-serif">
              {post.title}
            </h1>
            
            {/* Divider */}
            <div className="w-full h-px bg-white/30 mb-6" />
            
            {/* Author Info */}
            <div className="text-white/90 text-sm font-light mb-6">
              <span className="italic">By </span>
              <span className="font-medium">{post.author.name}</span>
              <span className="italic"> | {formatDate(post.createdAt)}</span>
            </div>
            
            {/* Excerpt */}
            <p className="text-white/90 text-lg leading-relaxed font-light mb-8">
              {post.excerpt}
            </p>
            
            {/* Main Content */}
            <div className="text-white/80 text-base leading-relaxed font-light space-y-4">
              {post.content.split('\n').slice(0, 3).map((paragraph, index) => (
                <p key={index}>
                  {paragraph}
                </p>
              ))}
            </div>
            
            {/* Bottom Divider */}
            <div className="w-full h-px bg-white/30 mt-8 mb-6" />
            
            {/* Meta Info */}
            <div className="flex justify-between items-center text-white/70 text-sm">
              <span className="font-light">{post.readTime} min read</span>
              <span className="italic font-light">AgroTech Insights</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
