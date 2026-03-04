/**
 * Nature-Tech Loading System
 * Centralized exports for all loading components
 */

// Core loaders
export {
  SeedGrowthLoader,
  LeafFractalLoader,
  GrowthNetworkLoader,
  DataSoilLoader,
  InlineNatureSpinner,
} from './nature-tech-loaders';

// Adaptive loaders
export {
  AdaptiveLoader,
  NaturePageLoader,
  SimpleNatureLoader,
  LoadingSpinner,
  LoadingOverlay,
  SmartLoader,
} from './adaptive-loaders';

// Skeleton screens
export {
  NatureContentSkeleton,
  CompactNatureSkeleton,
  CardNatureSkeleton,
  GridNatureSkeleton,
  FeaturedStorySkeleton,
  ProjectCardSkeleton,
  BlogPostSkeleton,
  BlogListItemSkeleton,
  GlobalPageSkeleton,
  TextNatureSkeleton,
  CommentNatureSkeleton,
  ContentSkeleton, // Backwards compatibility alias
} from './nature-skeletons';

// SVG Icons (for advanced usage)
export {
  HexagonSeed,
  LeafFractal,
  GrowthNode,
  DataParticle,
  LeafVeinPattern,
  GrowthNetworkFull,
} from './svg-icons';

// Configuration and utilities
export {
  LOADING_TIMING,
  LOADING_COLORS,
  LOADING_SIZES,
  EASING,
  ANIMATION_CONFIG,
  A11Y_CONFIG,
  getLoadingStage,
  getLoadingMessage,
  prefersReducedMotion,
  getStaggerDelay,
  getSizeDimensions,
  type LoadingSize,
  type LoadingStage,
  type LoadingConfig,
  type AdaptiveLoadingState,
} from '@/lib/loading-config';
