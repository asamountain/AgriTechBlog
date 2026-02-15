import { useQuery } from "@tanstack/react-query";
import { formatDate, stripMarkdown } from "@/lib/utils";
import { Link } from "wouter";
import type { BlogPostWithDetails } from "@shared/schema";
import { AdaptiveLoader } from "@/components/loading";

function formatDateEnglish(date: string | Date): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "Invalid Date";
  
  const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
  
  const day = d.getDate();
  const monthName = months[d.getMonth()];
  const year = d.getFullYear();
  
  return `${monthName} ${day}, ${year}`;
}

function StoryCard({ story }: { story: BlogPostWithDetails }) {
  const excerptText = stripMarkdown(story.excerpt || "");
  const tagText = story.tags?.[0] || 'TECH';
  const secondTagText = story.tags?.[1] ? `, ${story.tags[1].toUpperCase()}` : '';

  return (
    <div className="flex flex-col group h-full">
      {/* Image Container with Offset Content Box */}
      <div className="relative mb-8">
        <Link href={`/blog/${story.slug}`}>
          <div className="aspect-[4/3] overflow-hidden cursor-pointer">
            <img 
              src={story.featuredImage || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80'} 
              className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700 hover:scale-105"
              alt={story.title}
            />
          </div>
        </Link>
        
        {/* The "Notch" or offset box effect - matching the image */}
        <div className="absolute -bottom-1 left-0 w-24 h-1 bg-white z-10 hidden sm:block"></div>
      </div>

      {/* Content Area */}
      <div className="flex flex-col flex-1 px-1">
        <Link href={`/blog/${story.slug}`}>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 hover:text-forest-green cursor-pointer transition-colors leading-[1.2]">
            {story.title}
          </h2>
        </Link>
        
        {/* Metadata */}
        <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-gray-400 mb-6 uppercase">
          <span>{formatDateEnglish(story.createdAt)}</span>
          <span className="text-gray-300">•</span>
          <span className="text-gray-500">{tagText.toUpperCase()}{secondTagText}</span>
        </div>

        {/* Excerpt */}
        <p className="text-sm text-gray-600 leading-relaxed mb-6 line-clamp-3">
          {excerptText}
        </p>
        
        {/* Read More */}
        <div className="mt-auto">
          <Link href={`/blog/${story.slug}`}>
            <span className="inline-flex items-center text-[10px] font-bold tracking-widest text-forest-green hover:opacity-70 transition-opacity cursor-pointer uppercase group">
              READ MORE 
              <span className="ml-2 transform group-hover:translate-x-1 transition-transform">→</span>
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function FeaturedStories() {
  const { data: featuredPosts, isLoading } = useQuery<BlogPostWithDetails[]>({
    queryKey: ["/api/blog-posts/featured", { includeDrafts: false, postType: 'blog' }],
  });

  if (isLoading) {
    return (
      <section id="featured-stories" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <AdaptiveLoader size="lg" text="Loading featured content..." />
        </div>
      </section>
    );
  }

  if (!featuredPosts || featuredPosts.length === 0) {
    return null;
  }

  // Take only top 3 as per the requested design
  const displayPosts = featuredPosts.slice(0, 3);

  return (
    <section id="featured-stories" className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header - Subtle and Professional */}
        <div className="mb-16 border-b border-gray-100 pb-8">
          <h2 className="text-3xl font-playfair font-bold text-gray-900 italic">
            Featured Stories
          </h2>
        </div>
        
        {/* Grid Layout - 3 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
          {displayPosts.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      </div>
    </section>
  );
}
