/**
 * Nature-Inspired Skeleton Screens
 * Organic loading placeholders with subtle nature aesthetics
 */

import React from 'react';
import { LeafVeinPattern } from './svg-icons';
import { LOADING_COLORS, ANIMATION_CONFIG, prefersReducedMotion } from '@/lib/loading-config';

const NatureSkeletonStyles: React.FC = () => {
  const reducedMotion = prefersReducedMotion();

  return (
    <style>{`
      @keyframes nature-breathe {
        0%, 100% {
          opacity: ${ANIMATION_CONFIG.skeleton.opacityMin};
          transform: scaleX(1);
        }
        50% {
          opacity: ${ANIMATION_CONFIG.skeleton.opacityMax};
          transform: scaleX(1.01);
        }
      }

      @keyframes shimmer-flow {
        0% {
          background-position: -200% 0;
        }
        100% {
          background-position: 200% 0;
        }
      }

      .nature-skeleton-line {
        animation: nature-breathe ${reducedMotion ? '1s' : ANIMATION_CONFIG.skeleton.duration + 'ms'} 
                   ${reducedMotion ? 'linear' : ANIMATION_CONFIG.skeleton.easing} infinite;
        transform-origin: left center;
      }

      .nature-skeleton-shimmer {
        background: linear-gradient(
          90deg,
          ${LOADING_COLORS.BACKGROUND_BASE} 0%,
          ${LOADING_COLORS.BACKGROUND_SHIMMER} 20%,
          ${LOADING_COLORS.BACKGROUND_BASE} 40%,
          ${LOADING_COLORS.BACKGROUND_BASE} 100%
        );
        background-size: 200% 100%;
        animation: shimmer-flow ${reducedMotion ? '1.5s' : '3s'} linear infinite;
      }

      .nature-skeleton-textured {
        background-image: url('data:image/svg+xml;utf8,<svg width="40" height="40" xmlns="http://www.w3.org/2000/svg"><path d="M0 20 Q10 15, 20 20 T40 20" stroke="rgba(45,80,22,0.03)" stroke-width="0.5" fill="none"/></svg>');
        background-repeat: repeat;
      }

      @media (prefers-reduced-motion: reduce) {
        .nature-skeleton-line,
        .nature-skeleton-shimmer {
          animation-duration: 1s;
          animation-timing-function: linear;
        }
      }
    `}</style>
  );
};

// ============================================================================
// NATURE CONTENT SKELETON - Main content placeholder
// ============================================================================

interface NatureContentSkeletonProps {
  className?: string;
  showImage?: boolean;
}

export const NatureContentSkeleton: React.FC<NatureContentSkeletonProps> = ({
  className = '',
  showImage = true,
}) => {
  return (
    <>
      <LeafVeinPattern />
      <NatureSkeletonStyles />

      <div className={`space-y-4 ${className}`}>
        {/* Header skeleton */}
        <div className="flex items-center space-x-4">
          {/* Avatar with hexagon hint */}
          <div 
            className="nature-skeleton-line nature-skeleton-shimmer relative"
            style={{
              width: '48px',
              height: '48px',
              background: LOADING_COLORS.BACKGROUND_BASE,
              clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
            }}
          />

          {/* Text lines */}
          <div className="flex-1 space-y-2">
            <div 
              className="nature-skeleton-line nature-skeleton-shimmer nature-skeleton-textured rounded-md"
              style={{
                height: '16px',
                width: '60%',
                background: LOADING_COLORS.BACKGROUND_BASE,
              }}
            />
            <div 
              className="nature-skeleton-line nature-skeleton-shimmer nature-skeleton-textured rounded-md"
              style={{
                height: '14px',
                width: '40%',
                background: LOADING_COLORS.BACKGROUND_BASE,
                animationDelay: '150ms',
              }}
            />
          </div>
        </div>

        {/* Content lines */}
        <div className="space-y-2.5">
          {[100, 95, 88, 92, 78].map((width, i) => (
            <div
              key={i}
              className="nature-skeleton-line nature-skeleton-shimmer nature-skeleton-textured rounded-md"
              style={{
                height: '12px',
                width: `${width}%`,
                background: LOADING_COLORS.BACKGROUND_BASE,
                animationDelay: `${i * 100}ms`,
              }}
            />
          ))}
        </div>

        {/* Image placeholder with gradient */}
        {showImage && (
          <div
            className="nature-skeleton-shimmer rounded-lg overflow-hidden relative"
            style={{
              height: '200px',
              width: '100%',
              background: `linear-gradient(135deg, ${LOADING_COLORS.GRADIENT_START} 0%, ${LOADING_COLORS.GRADIENT_END} 100%)`,
            }}
          >
            {/* Decorative leaf pattern overlay */}
            <div className="absolute inset-0 opacity-10">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <pattern id="leaf-dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                  <circle cx="20" cy="20" r="1.5" fill={LOADING_COLORS.PRIMARY} opacity="0.3" />
                  <circle cx="10" cy="30" r="1" fill={LOADING_COLORS.PRIMARY} opacity="0.2" />
                  <circle cx="30" cy="10" r="1" fill={LOADING_COLORS.PRIMARY} opacity="0.2" />
                </pattern>
                <rect width="100%" height="100%" fill="url(#leaf-dots)" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

// ============================================================================
// COMPACT SKELETON - Simplified version for lists
// ============================================================================

interface CompactNatureSkeletonProps {
  className?: string;
  lines?: number;
}

export const CompactNatureSkeleton: React.FC<CompactNatureSkeletonProps> = ({
  className = '',
  lines = 3,
}) => {
  return (
    <>
      <NatureSkeletonStyles />

      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="nature-skeleton-line nature-skeleton-shimmer rounded-md"
            style={{
              height: '12px',
              width: `${100 - (i * 8)}%`,
              background: LOADING_COLORS.BACKGROUND_BASE,
              animationDelay: `${i * 150}ms`,
            }}
          />
        ))}
      </div>
    </>
  );
};

// ============================================================================
// CARD SKELETON - For blog post cards
// ============================================================================

interface CardNatureSkeletonProps {
  className?: string;
}

export const CardNatureSkeleton: React.FC<CardNatureSkeletonProps> = ({
  className = '',
}) => {
  return (
    <>
      <NatureSkeletonStyles />
      <div className={`border border-gray-200 rounded-lg overflow-hidden ${className}`}>
        {/* Image placeholder */}
        <div
          className="nature-skeleton-shimmer"
          style={{
            height: '180px',
            width: '100%',
            background: `linear-gradient(135deg, ${LOADING_COLORS.GRADIENT_START} 0%, ${LOADING_COLORS.GRADIENT_END} 100%)`,
          }}
        />

        {/* Content area */}
        <div className="p-4 space-y-3">
          {/* Title */}
          <div
            className="nature-skeleton-shimmer rounded-md"
            style={{
              height: '20px',
              width: '85%',
              background: LOADING_COLORS.BACKGROUND_BASE,
            }}
          />

          {/* Description lines */}
          <div className="space-y-2">
            <div
              className="nature-skeleton-shimmer rounded-md"
              style={{
                height: '14px',
                width: '100%',
                background: LOADING_COLORS.BACKGROUND_BASE,
                animationDelay: '100ms',
              }}
            />
            <div
              className="nature-skeleton-shimmer rounded-md"
              style={{
                height: '14px',
                width: '75%',
                background: LOADING_COLORS.BACKGROUND_BASE,
                animationDelay: '200ms',
              }}
            />
          </div>

          {/* Meta info */}
          <div className="flex items-center gap-4 pt-2">
            <div
              className="nature-skeleton-shimmer rounded-md"
              style={{
                height: '12px',
                width: '60px',
                background: LOADING_COLORS.BACKGROUND_BASE,
                animationDelay: '300ms',
              }}
            />
            <div
              className="nature-skeleton-shimmer rounded-md"
              style={{
                height: '12px',
                width: '80px',
                background: LOADING_COLORS.BACKGROUND_BASE,
                animationDelay: '350ms',
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
};

// ============================================================================
// GRID SKELETON - Multiple cards in grid layout
// ============================================================================

interface GridNatureSkeletonProps {
  count?: number;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export const GridNatureSkeleton: React.FC<GridNatureSkeletonProps> = ({
  count = 6,
  columns = 3,
  className = '',
}) => {
  const gridClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }[columns];

  return (
    <div className={`grid ${gridClass} gap-6 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <CardNatureSkeleton key={i} />
      ))}
    </div>
  );
};

// ============================================================================
// TEXT SKELETON - Just lines of text
// ============================================================================

interface TextNatureSkeletonProps {
  lines?: number;
  className?: string;
}

export const TextNatureSkeleton: React.FC<TextNatureSkeletonProps> = ({
  lines = 5,
  className = '',
}) => {
  const widths = [100, 95, 88, 92, 78];

  return (
    <>
      <NatureSkeletonStyles />
      <div className={`space-y-2.5 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="nature-skeleton-shimmer rounded-md"
            style={{
              height: '14px',
              width: `${widths[i % widths.length]}%`,
              background: LOADING_COLORS.BACKGROUND_BASE,
              animationDelay: `${i * 80}ms`,
            }}
          />
        ))}
      </div>
    </>
  );
};

// ============================================================================
// COMMENT SKELETON - For comment sections
// ============================================================================

interface CommentNatureSkeletonProps {
  className?: string;
}

export const CommentNatureSkeleton: React.FC<CommentNatureSkeletonProps> = ({
  className = '',
}) => {
  return (
    <>
      <NatureSkeletonStyles />
      <div className={`flex gap-3 ${className}`}>
        {/* Avatar */}
        <div
          className="nature-skeleton-shimmer flex-shrink-0"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: LOADING_COLORS.BACKGROUND_BASE,
          }}
        />

        {/* Comment content */}
        <div className="flex-1 space-y-2">
          <div
            className="nature-skeleton-shimmer rounded-md"
            style={{
              height: '12px',
              width: '120px',
              background: LOADING_COLORS.BACKGROUND_BASE,
            }}
          />
          <div
            className="nature-skeleton-shimmer rounded-md"
            style={{
              height: '14px',
              width: '100%',
              background: LOADING_COLORS.BACKGROUND_BASE,
              animationDelay: '100ms',
            }}
          />
          <div
            className="nature-skeleton-shimmer rounded-md"
            style={{
              height: '14px',
              width: '85%',
              background: LOADING_COLORS.BACKGROUND_BASE,
              animationDelay: '150ms',
            }}
          />
        </div>
      </div>
    </>
  );
};

// ============================================================================
// FEATURED STORY SKELETON - Matches StoryCard in featured-stories.tsx
// ============================================================================

interface FeaturedStorySkeletonProps {
  className?: string;
}

export const FeaturedStorySkeleton: React.FC<FeaturedStorySkeletonProps> = ({
  className = '',
}) => {
  return (
    <div className={`flex flex-col h-full ${className}`}>
      <NatureSkeletonStyles />
      
      {/* Image aspect ratio 4:3 */}
      <div 
        className="nature-skeleton-shimmer mb-8"
        style={{
          aspectRatio: '4/3',
          width: '100%',
          background: `linear-gradient(135deg, ${LOADING_COLORS.GRADIENT_START} 0%, ${LOADING_COLORS.GRADIENT_END} 100%)`,
        }}
      />
      
      {/* Content Area */}
      <div className="flex flex-col flex-1 px-1 space-y-4">
        {/* Title */}
        <div 
          className="nature-skeleton-shimmer rounded-sm"
          style={{
            height: '28px',
            width: '90%',
            background: LOADING_COLORS.BACKGROUND_BASE,
          }}
        />
        
        {/* Metadata */}
        <div 
          className="nature-skeleton-shimmer rounded-sm"
          style={{
            height: '12px',
            width: '40%',
            background: LOADING_COLORS.BACKGROUND_BASE,
            animationDelay: '100ms',
          }}
        />
        
        {/* Excerpt */}
        <div className="space-y-2">
          <div 
            className="nature-skeleton-shimmer rounded-sm"
            style={{
              height: '14px',
              width: '100%',
              background: LOADING_COLORS.BACKGROUND_BASE,
              animationDelay: '200ms',
            }}
          />
          <div 
            className="nature-skeleton-shimmer rounded-sm"
            style={{
              height: '14px',
              width: '100%',
              background: LOADING_COLORS.BACKGROUND_BASE,
              animationDelay: '250ms',
            }}
          />
          <div 
            className="nature-skeleton-shimmer rounded-sm"
            style={{
              height: '14px',
              width: '60%',
              background: LOADING_COLORS.BACKGROUND_BASE,
              animationDelay: '300ms',
            }}
          />
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// GLOBAL PAGE SKELETON - For Suspense fallbacks during route changes
// ============================================================================

export const GlobalPageSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <NatureSkeletonStyles />
      {/* Navbar Placeholder */}
      <div className="h-16 border-b border-gray-100 px-8 flex items-center justify-between">
        <div className="h-6 w-16 bg-gray-50 rounded animate-pulse" />
        <div className="flex gap-8">
          <div className="h-4 w-12 bg-gray-50 rounded animate-pulse" />
          <div className="h-4 w-12 bg-gray-50 rounded animate-pulse" />
          <div className="h-8 w-8 bg-gray-50 rounded animate-pulse" />
        </div>
      </div>
      
      {/* Content Placeholder */}
      <div className="container mx-auto px-6 pt-24 space-y-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="h-12 w-3/4 bg-gray-50 rounded animate-pulse" />
          <div className="h-6 w-1/2 bg-gray-50 rounded animate-pulse" />
          <div className="pt-8 space-y-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-4 w-full bg-gray-50 rounded animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// BLOG POST SKELETON - Matches blog-post.tsx
// ============================================================================

interface BlogPostSkeletonProps {
  className?: string;
}

export const BlogPostSkeleton: React.FC<BlogPostSkeletonProps> = ({
  className = '',
}) => {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-sage-50 to-fresh-lime-50 ${className}`}>
      <NatureSkeletonStyles />
      <div className="container mx-auto px-6 pt-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Sidebar Left */}
            <aside className="lg:col-span-1 hidden lg:block space-y-4">
              <div 
                className="nature-skeleton-shimmer rounded-md"
                style={{ height: '30px', width: '80%', background: LOADING_COLORS.BACKGROUND_BASE }}
              />
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="nature-skeleton-shimmer rounded-md" style={{ height: '14px', width: '60%', background: LOADING_COLORS.BACKGROUND_BASE, animationDelay: `${i * 100}ms` }} />
              ))}
            </aside>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Header */}
              <div className="space-y-6 mb-8">
                <div 
                  className="nature-skeleton-shimmer rounded-md"
                  style={{ height: '48px', width: '90%', background: LOADING_COLORS.BACKGROUND_BASE }}
                />
                <div 
                  className="nature-skeleton-shimmer rounded-md"
                  style={{ height: '16px', width: '40%', background: LOADING_COLORS.BACKGROUND_BASE, animationDelay: '100ms' }}
                />
              </div>

              {/* Summary Box */}
              <div className="bg-white/50 border-l-4 border-forest-green/20 rounded-lg p-6 mb-8 space-y-3">
                <div className="nature-skeleton-shimmer rounded-md" style={{ height: '20px', width: '30%', background: LOADING_COLORS.BACKGROUND_BASE }} />
                <div className="nature-skeleton-shimmer rounded-md" style={{ height: '14px', width: '100%', background: LOADING_COLORS.BACKGROUND_BASE }} />
                <div className="nature-skeleton-shimmer rounded-md" style={{ height: '14px', width: '80%', background: LOADING_COLORS.BACKGROUND_BASE }} />
              </div>

              {/* Featured Image placeholder */}
              <div 
                className="nature-skeleton-shimmer mb-8"
                style={{
                  height: '400px',
                  width: '100%',
                  background: `linear-gradient(135deg, ${LOADING_COLORS.GRADIENT_START} 0%, ${LOADING_COLORS.GRADIENT_END} 100%)`,
                }}
              />

              {/* Text lines */}
              <div className="space-y-4">
                {[100, 95, 88, 92, 78, 95, 90, 85].map((width, i) => (
                  <div
                    key={i}
                    className="nature-skeleton-shimmer rounded-md"
                    style={{
                      height: '16px',
                      width: `${width}%`,
                      background: LOADING_COLORS.BACKGROUND_BASE,
                      animationDelay: `${i * 100}ms`,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Sidebar Right */}
            <aside className="lg:col-span-1 hidden lg:block">
              <div 
                className="nature-skeleton-shimmer rounded-md"
                style={{ height: '200px', width: '100%', background: LOADING_COLORS.BACKGROUND_BASE }}
              />
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// PROJECT CARD SKELETON - Matches ProjectCard in portfolio.tsx
// ============================================================================

interface ProjectCardSkeletonProps {
  className?: string;
}

export const ProjectCardSkeleton: React.FC<ProjectCardSkeletonProps> = ({
  className = '',
}) => {
  return (
    <div className={`flex flex-col h-full bg-white border border-gray-100 shadow-sm ${className}`}>
      <NatureSkeletonStyles />
      
      {/* Image aspect ratio 16/10 */}
      <div 
        className="nature-skeleton-shimmer"
        style={{
          aspectRatio: '16/10',
          width: '100%',
          background: `linear-gradient(135deg, ${LOADING_COLORS.GRADIENT_START} 0%, ${LOADING_COLORS.GRADIENT_END} 100%)`,
        }}
      />
      
      <div className="p-8 flex flex-col flex-1 space-y-4">
        {/* Category tag */}
        <div 
          className="nature-skeleton-shimmer rounded-sm"
          style={{
            height: '10px',
            width: '60px',
            background: LOADING_COLORS.BACKGROUND_BASE,
          }}
        />
        
        {/* Title */}
        <div 
          className="nature-skeleton-shimmer rounded-sm"
          style={{
            height: '32px',
            width: '90%',
            background: LOADING_COLORS.BACKGROUND_BASE,
            animationDelay: '100ms',
          }}
        />
        
        {/* Excerpt */}
        <div className="space-y-2">
          <div 
            className="nature-skeleton-shimmer rounded-sm"
            style={{
              height: '14px',
              width: '100%',
              background: LOADING_COLORS.BACKGROUND_BASE,
              animationDelay: '200ms',
            }}
          />
          <div 
            className="nature-skeleton-shimmer rounded-sm"
            style={{
              height: '14px',
              width: '100%',
              background: LOADING_COLORS.BACKGROUND_BASE,
              animationDelay: '250ms',
            }}
          />
        </div>

        {/* Tags row */}
        <div className="flex gap-2 py-4">
          {[1, 2, 3].map((i) => (
            <div 
              key={i}
              className="nature-skeleton-shimmer rounded-sm"
              style={{
                height: '20px',
                width: '50px',
                background: LOADING_COLORS.BACKGROUND_BASE,
                animationDelay: `${300 + (i * 50)}ms`,
              }}
            />
          ))}
        </div>
        
        {/* Footer link */}
        <div className="mt-auto pt-6 border-t border-gray-50">
          <div 
            className="nature-skeleton-shimmer rounded-sm"
            style={{
              height: '10px',
              width: '100px',
              background: LOADING_COLORS.BACKGROUND_BASE,
              animationDelay: '500ms',
            }}
          />
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// BLOG LIST ITEM SKELETON - For list view of posts
// ============================================================================

interface BlogListItemSkeletonProps {
  className?: string;
}

export const BlogListItemSkeleton: React.FC<BlogListItemSkeletonProps> = ({
  className = '',
}) => {
  return (
    <>
      <NatureSkeletonStyles />
      <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 px-4 ${className}`}>
        {/* Title skeleton */}
        <div 
          className="nature-skeleton-shimmer rounded-md"
          style={{
            height: '20px',
            width: '70%',
            maxWidth: '400px',
            background: LOADING_COLORS.BACKGROUND_BASE,
          }}
        />
        
        {/* Date skeleton */}
        <div 
          className="nature-skeleton-shimmer rounded-md mt-2 sm:mt-0"
          style={{
            height: '14px',
            width: '80px',
            background: LOADING_COLORS.BACKGROUND_BASE,
            animationDelay: '100ms',
          }}
        />
      </div>
    </>
  );
};

// Export all skeleton components
export {
  NatureContentSkeleton as ContentSkeleton, // Alias for backwards compatibility
};
