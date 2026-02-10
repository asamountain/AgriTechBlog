/**
 * Nature-Tech Hybrid Loading Components
 * Advanced loading animations blending natural aesthetics with modern tech UI
 */

import React from 'react';
import { HexagonSeed, LeafFractal, GrowthNetworkFull, DataParticle } from './svg-icons';
import { 
  LOADING_COLORS, 
  LOADING_TIMING, 
  ANIMATION_CONFIG,
  getSizeDimensions,
  prefersReducedMotion,
  type LoadingSize 
} from '@/lib/loading-config';

// ============================================================================
// SEED GROWTH LOADER (Simple, <1s loads)
// ============================================================================

interface SeedGrowthLoaderProps {
  size?: LoadingSize;
  className?: string;
}

export const SeedGrowthLoader: React.FC<SeedGrowthLoaderProps> = ({ 
  size = 'md',
  className = '' 
}) => {
  const dimensions = getSizeDimensions(size);
  const reducedMotion = prefersReducedMotion();

  return (
    <div 
      className={`flex items-center justify-center ${className}`}
      role="status"
      aria-label="Loading"
    >
      <style>{`
        @keyframes seed-rotate {
          0% {
            transform: rotate(0deg) scale(1);
          }
          50% {
            transform: rotate(180deg) scale(1.1);
          }
          100% {
            transform: rotate(360deg) scale(1);
          }
        }

        @keyframes roots-grow {
          0%, 20% {
            opacity: 0;
            transform: translateY(-5px) scaleY(0);
          }
          60% {
            opacity: 0.5;
            transform: translateY(0) scaleY(1.1);
          }
          100% {
            opacity: 0.5;
            transform: translateY(0) scaleY(1);
          }
        }

        .seed-growth-container {
          animation: seed-rotate ${reducedMotion ? '1s' : ANIMATION_CONFIG.seedGrowth.duration + 'ms'} 
                     ${reducedMotion ? 'linear' : ANIMATION_CONFIG.seedGrowth.easing} infinite;
          will-change: transform;
        }

        .seed-growth-container .growth-roots {
          animation: roots-grow ${reducedMotion ? '1s' : ANIMATION_CONFIG.seedGrowth.duration + 'ms'} 
                     ${reducedMotion ? 'linear' : ANIMATION_CONFIG.seedGrowth.easing} infinite;
          transform-origin: center top;
        }

        @media (prefers-reduced-motion: reduce) {
          .seed-growth-container {
            animation-duration: 1s;
            animation-timing-function: linear;
          }
        }
      `}</style>
      
      <div className="seed-growth-container">
        <HexagonSeed 
          size={dimensions.width} 
          color={LOADING_COLORS.PRIMARY}
        />
      </div>
    </div>
  );
};

// ============================================================================
// LEAF FRACTAL LOADER (Moderate, 1-3s loads)
// ============================================================================

interface LeafFractalLoaderProps {
  size?: LoadingSize;
  className?: string;
}

export const LeafFractalLoader: React.FC<LeafFractalLoaderProps> = ({ 
  size = 'md',
  className = '' 
}) => {
  const dimensions = getSizeDimensions(size);
  const reducedMotion = prefersReducedMotion();
  const branchCount = ANIMATION_CONFIG.leafFractal.branchCount;

  return (
    <div 
      className={`flex items-center justify-center ${className}`}
      role="status"
      aria-label="Loading"
    >
      <style>{`
        @keyframes leaf-pulse {
          0%, 100% {
            opacity: 0.4;
            transform: scale(0.95);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
        }

        ${Array.from({ length: branchCount }, (_, i) => `
          @keyframes branch-grow-${i} {
            0% {
              opacity: 0;
              transform: scale(0) translateX(0) translateY(0);
            }
            ${(i / branchCount) * 100}% {
              opacity: 0;
              transform: scale(0) translateX(0) translateY(0);
            }
            ${((i + 1) / branchCount) * 100}% {
              opacity: 0.6;
              transform: scale(1) translateX(0) translateY(0);
            }
            100% {
              opacity: 0.6;
              transform: scale(1) translateX(0) translateY(0);
            }
          }

          .leaf-fractal-container .branch-${i} {
            animation: branch-grow-${i} ${reducedMotion ? '1s' : ANIMATION_CONFIG.leafFractal.duration + 'ms'} 
                       ${reducedMotion ? 'linear' : ANIMATION_CONFIG.leafFractal.easing} infinite;
          }
        `).join('\n')}

        .leaf-fractal-container {
          animation: leaf-pulse ${reducedMotion ? '1.5s' : ANIMATION_CONFIG.leafFractal.duration + 'ms'} 
                     ${reducedMotion ? 'linear' : ANIMATION_CONFIG.leafFractal.easing} infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .leaf-fractal-container,
          .leaf-fractal-container [class^="branch-"] {
            animation-duration: 1s;
            animation-timing-function: linear;
          }
        }
      `}</style>
      
      <div className="leaf-fractal-container">
        <LeafFractal 
          size={dimensions.width} 
          color={LOADING_COLORS.PRIMARY}
        />
      </div>
    </div>
  );
};

// ============================================================================
// GROWTH NETWORK LOADER (Elaborate, 3-5s loads)
// ============================================================================

interface GrowthNetworkLoaderProps {
  size?: LoadingSize;
  className?: string;
}

export const GrowthNetworkLoader: React.FC<GrowthNetworkLoaderProps> = ({ 
  size = 'lg',
  className = '' 
}) => {
  const dimensions = getSizeDimensions(size);
  const reducedMotion = prefersReducedMotion();
  const nodeCount = ANIMATION_CONFIG.growthNetwork.nodeCount;

  return (
    <div 
      className={`flex items-center justify-center ${className}`}
      role="status"
      aria-label="Loading"
    >
      <style>{`
        @keyframes network-rotate {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        ${Array.from({ length: nodeCount }, (_, i) => `
          @keyframes node-pulse-${i} {
            0%, 100% {
              opacity: 0.3;
              transform: scale(1);
            }
            ${((i / nodeCount) * 100)}% {
              opacity: 0.8;
              transform: scale(1.3);
            }
          }

          .growth-network-container .node-${i} {
            animation: node-pulse-${i} ${reducedMotion ? '1.5s' : ANIMATION_CONFIG.growthNetwork.duration + 'ms'} 
                       ${reducedMotion ? 'linear' : ANIMATION_CONFIG.growthNetwork.easing} infinite;
          }

          @keyframes connection-flow-${i} {
            0%, 100% {
              opacity: 0.1;
              stroke-dashoffset: 0;
            }
            ${((i / nodeCount) * 100)}% {
              opacity: 0.4;
              stroke-dashoffset: -20;
            }
          }

          .growth-network-container .connection-${i},
          .growth-network-container .center-connection-${i} {
            stroke-dasharray: 4 4;
            animation: connection-flow-${i} ${reducedMotion ? '1.5s' : ANIMATION_CONFIG.growthNetwork.duration + 'ms'} 
                       ${reducedMotion ? 'linear' : ANIMATION_CONFIG.growthNetwork.easing} infinite;
          }
        `).join('\n')}

        .growth-network-container {
          animation: network-rotate ${reducedMotion ? '3s' : (ANIMATION_CONFIG.growthNetwork.duration * 3) + 'ms'} 
                     linear infinite;
          will-change: transform;
        }

        @media (prefers-reduced-motion: reduce) {
          .growth-network-container {
            animation: none;
          }
          .growth-network-container [class^="node-"],
          .growth-network-container [class^="connection-"] {
            animation-duration: 1s;
            animation-timing-function: linear;
          }
        }
      `}</style>
      
      <div className="growth-network-container">
        <GrowthNetworkFull 
          size={dimensions.width} 
          color={LOADING_COLORS.PRIMARY}
        />
      </div>
    </div>
  );
};

// ============================================================================
// DATA SOIL LOADER (Complex, 5s+ loads)
// ============================================================================

interface DataSoilLoaderProps {
  size?: LoadingSize;
  className?: string;
}

export const DataSoilLoader: React.FC<DataSoilLoaderProps> = ({ 
  size = 'lg',
  className = '' 
}) => {
  const reducedMotion = prefersReducedMotion();
  const particleCount = ANIMATION_CONFIG.dataSoil.particleCount;
  
  // Generate random positions for particles
  const particles = React.useMemo(() => 
    Array.from({ length: particleCount }, (_, i) => ({
      left: Math.random() * 80 + 10, // 10-90%
      delay: i * 150,
      duration: 1500 + Math.random() * 500,
    })),
    [particleCount]
  );

  return (
    <div 
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: '120px', height: '80px' }}
      role="status"
      aria-label="Loading"
    >
      <style>{`
        @keyframes particle-rise {
          0% {
            opacity: 0;
            transform: translateY(40px) scale(0.5);
          }
          20% {
            opacity: 0.8;
          }
          80% {
            opacity: 0.8;
          }
          100% {
            opacity: 0;
            transform: translateY(-40px) scale(1.2);
          }
        }

        .data-soil-particle {
          position: absolute;
          bottom: 0;
          animation: particle-rise ${reducedMotion ? '1.5s' : ANIMATION_CONFIG.dataSoil.duration + 'ms'} 
                     ${reducedMotion ? 'linear' : ANIMATION_CONFIG.dataSoil.easing} infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .data-soil-particle {
            animation-duration: 1.5s;
            animation-timing-function: linear;
          }
        }
      `}</style>
      
      {/* Ground line */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
        style={{ background: LOADING_COLORS.PRIMARY_LIGHT, opacity: 0.3 }}
      />
      
      {/* Rising particles */}
      {particles.map((particle, i) => (
        <div
          key={i}
          className="data-soil-particle"
          style={{
            left: `${particle.left}%`,
            animationDelay: `${particle.delay}ms`,
            animationDuration: `${particle.duration}ms`,
          }}
        >
          <DataParticle 
            size={8}
            color={LOADING_COLORS.PRIMARY}
            accentColor={LOADING_COLORS.ACCENT}
          />
        </div>
      ))}
      
      {/* Center hexagon seed */}
      <div className="relative z-10">
        <HexagonSeed 
          size={32} 
          color={LOADING_COLORS.PRIMARY}
        />
      </div>
    </div>
  );
};

// ============================================================================
// INLINE NATURE SPINNER (for buttons and inline use)
// ============================================================================

interface InlineNatureSpinnerProps {
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export const InlineNatureSpinner: React.FC<InlineNatureSpinnerProps> = ({ 
  size = 'sm',
  className = '' 
}) => {
  const sizeMap = {
    xs: 12,
    sm: 16,
    md: 20,
  };
  
  const pixelSize = sizeMap[size];
  const reducedMotion = prefersReducedMotion();

  return (
    <span className={`inline-flex items-center justify-center ${className}`}>
      <style>{`
        @keyframes inline-seed-spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .inline-nature-spinner {
          animation: inline-seed-spin ${reducedMotion ? '1s' : '1.5s'} 
                     ${reducedMotion ? 'linear' : 'cubic-bezier(0.4, 0.0, 0.2, 1)'} infinite;
          will-change: transform;
        }

        @media (prefers-reduced-motion: reduce) {
          .inline-nature-spinner {
            animation-duration: 1s;
            animation-timing-function: linear;
          }
        }
      `}</style>
      
      <div className="inline-nature-spinner">
        <HexagonSeed 
          size={pixelSize} 
          color={LOADING_COLORS.PRIMARY}
        />
      </div>
    </span>
  );
};
