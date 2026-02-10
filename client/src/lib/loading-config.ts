/**
 * Loading System Configuration
 * Nature-Tech Hybrid Loading System
 * 
 * Configuration for adaptive loading animations that blend
 * nature-inspired aesthetics with modern tech UI patterns.
 */

// ============================================================================
// TIMING CONSTANTS
// ============================================================================

export const LOADING_TIMING = {
  // Animation cycle durations (in milliseconds)
  FAST_CYCLE: 1500,      // Base cycle for simple animations
  MEDIUM_CYCLE: 1800,    // Moderate complexity animations
  SLOW_CYCLE: 2000,      // Elaborate animations
  
  // Adaptive timing thresholds
  SIMPLE_THRESHOLD: 1000,    // 0-1s: Show simple seed growth
  MODERATE_THRESHOLD: 3000,  // 1-3s: Show leaf fractal
  ELABORATE_THRESHOLD: 5000, // 3-5s: Show growth network
  COMPLEX_THRESHOLD: 5000,   // 5s+: Show data soil particles
  
  // Transition timing
  TRANSITION_DURATION: 300,  // Fade between loading states
  STAGGER_DELAY: 150,        // Delay between multiple elements
} as const;

// ============================================================================
// EASING FUNCTIONS
// ============================================================================

export const EASING = {
  // Organic, nature-inspired easing
  ORGANIC: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  
  // Smooth ease in/out
  SMOOTH: 'cubic-bezier(0.45, 0.05, 0.55, 0.95)',
  
  // Gentle spring-like motion
  SPRING: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  
  // Quick start, slow end (growth-like)
  GROWTH: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  
  // For reduced motion preference
  LINEAR: 'linear',
} as const;

// ============================================================================
// COLOR PALETTE
// ============================================================================

export const LOADING_COLORS = {
  // Primary brand colors
  PRIMARY: '#2D5016',           // forest-green
  PRIMARY_LIGHT: '#3D6B1F',     // Lighter forest green
  PRIMARY_DARK: '#1D3B0B',      // Darker forest green
  
  // Accent colors
  ACCENT: '#7CB342',            // fresh-lime
  ACCENT_LIGHT: '#9CCC65',      // Lighter lime
  
  // Neutral backgrounds
  BACKGROUND_BASE: 'rgba(45, 80, 22, 0.05)',     // 5% forest green
  BACKGROUND_SHIMMER: 'rgba(45, 80, 22, 0.08)',  // 8% forest green
  BACKGROUND_SUBTLE: 'rgba(45, 80, 22, 0.03)',   // 3% forest green
  
  // Gradient stops
  GRADIENT_START: 'rgba(45, 80, 22, 0.03)',
  GRADIENT_END: 'rgba(124, 179, 66, 0.02)',
} as const;

// ============================================================================
// SIZE CONSTANTS
// ============================================================================

export const LOADING_SIZES = {
  // Spinner/loader sizes
  xs: { width: 16, height: 16 },
  sm: { width: 24, height: 24 },
  md: { width: 40, height: 40 },
  lg: { width: 56, height: 56 },
  xl: { width: 72, height: 72 },
  
  // Inline button spinner sizes
  inline: {
    xs: { width: 12, height: 12 },
    sm: { width: 16, height: 16 },
    md: { width: 20, height: 20 },
  },
  
  // Skeleton dimensions
  skeleton: {
    avatar: 48,
    lineHeight: 16,
    imagePlaceholder: 200,
  },
} as const;

// ============================================================================
// ANIMATION CONFIGURATIONS
// ============================================================================

export const ANIMATION_CONFIG = {
  // Seed Growth Animation
  seedGrowth: {
    duration: LOADING_TIMING.FAST_CYCLE,
    easing: EASING.GROWTH,
    rotationDegrees: 360,
    scaleFactor: 1.1,
  },
  
  // Leaf Fractal Animation
  leafFractal: {
    duration: LOADING_TIMING.MEDIUM_CYCLE,
    easing: EASING.ORGANIC,
    branchCount: 6,
    branchDelay: 200,
  },
  
  // Growth Network Animation
  growthNetwork: {
    duration: LOADING_TIMING.SLOW_CYCLE,
    easing: EASING.SMOOTH,
    nodeCount: 8,
    connectionDelay: 150,
  },
  
  // Data Soil Particles Animation
  dataSoil: {
    duration: LOADING_TIMING.SLOW_CYCLE,
    easing: EASING.ORGANIC,
    particleCount: 12,
    riseDistance: 40,
  },
  
  // Skeleton breathing effect
  skeleton: {
    duration: 2000,
    easing: EASING.SMOOTH,
    opacityMin: 0.4,
    opacityMax: 0.7,
  },
} as const;

// ============================================================================
// ACCESSIBILITY SETTINGS
// ============================================================================

export const A11Y_CONFIG = {
  // ARIA attributes
  role: 'status' as const,
  ariaLive: 'polite' as const,
  
  // Labels
  defaultLabel: 'Loading content',
  
  // Reduced motion fallback
  reducedMotionDuration: 1000,
  reducedMotionOpacity: 0.6,
} as const;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type LoadingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type LoadingStage = 'simple' | 'moderate' | 'elaborate' | 'complex';
export type EasingType = keyof typeof EASING;

export interface LoadingConfig {
  size: LoadingSize;
  color?: string;
  duration?: number;
  easing?: EasingType;
  reducedMotion?: boolean;
}

export interface AdaptiveLoadingState {
  stage: LoadingStage;
  elapsedTime: number;
  message?: string;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Determine loading stage based on elapsed time
 */
export function getLoadingStage(elapsedTime: number): LoadingStage {
  if (elapsedTime < LOADING_TIMING.SIMPLE_THRESHOLD) {
    return 'simple';
  } else if (elapsedTime < LOADING_TIMING.MODERATE_THRESHOLD) {
    return 'moderate';
  } else if (elapsedTime < LOADING_TIMING.ELABORATE_THRESHOLD) {
    return 'elaborate';
  }
  return 'complex';
}

/**
 * Get message based on loading duration
 */
export function getLoadingMessage(elapsedTime: number): string {
  if (elapsedTime < 2000) {
    return 'Loading...';
  } else if (elapsedTime < 5000) {
    return 'Still loading...';
  } else if (elapsedTime < 10000) {
    return 'This is taking longer than usual...';
  }
  return 'Almost there...';
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get stagger delay for multiple elements
 */
export function getStaggerDelay(index: number, baseDelay = LOADING_TIMING.STAGGER_DELAY): number {
  return index * baseDelay;
}

/**
 * Get size dimensions for a given size key
 */
export function getSizeDimensions(size: LoadingSize) {
  return LOADING_SIZES[size];
}
