/**
 * Adaptive Loading System
 * Progressively enhances loading animations based on wait time
 */

import React, { useState, useEffect } from 'react';
import {
  SeedGrowthLoader,
  LeafFractalLoader,
  GrowthNetworkLoader,
  DataSoilLoader,
} from './nature-tech-loaders';
import {
  getLoadingStage,
  getLoadingMessage,
  type LoadingSize,
  type LoadingStage,
} from '@/lib/loading-config';

// ============================================================================
// ADAPTIVE LOADER - Main Component
// ============================================================================

interface AdaptiveLoaderProps {
  size?: LoadingSize;
  text?: string;
  showMessage?: boolean;
  className?: string;
  color?: string;
}

export const AdaptiveLoader: React.FC<AdaptiveLoaderProps> = ({
  size = 'md',
  text,
  showMessage = true,
  className = '',
  color = 'text-forest-green',
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [stage, setStage] = useState<LoadingStage>('simple');
  const [message, setMessage] = useState(text || 'Loading...');
  const [fadeKey, setFadeKey] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setElapsedTime(elapsed);
      
      const newStage = getLoadingStage(elapsed);
      if (newStage !== stage) {
        setStage(newStage);
        setFadeKey(prev => prev + 1); // Trigger fade transition
      }
      
      // Update message if not custom
      if (!text) {
        setMessage(getLoadingMessage(elapsed));
      }
    }, 100);

    return () => clearInterval(interval);
  }, [stage, text]);

  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      {/* Animated loader */}
      <div 
        key={fadeKey}
        className="adaptive-loader-container"
        style={{ 
          animation: 'fadeIn 300ms ease-in-out',
        }}
      >
        {stage === 'simple' && <SeedGrowthLoader size={size} />}
        {stage === 'moderate' && <LeafFractalLoader size={size} />}
        {stage === 'elaborate' && <GrowthNetworkLoader size={size} />}
        {stage === 'complex' && <DataSoilLoader size={size} />}
      </div>

      {/* Loading message */}
      {showMessage && (
        <p className={`text-sm ${color} animate-pulse`}>
          {message}
        </p>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

// ============================================================================
// NATURE PAGE LOADER - Full Page Loading Screen
// ============================================================================

interface NaturePageLoaderProps {
  message?: string;
  showProgress?: boolean;
}

export const NaturePageLoader: React.FC<NaturePageLoaderProps> = ({
  message = 'Loading...',
  showProgress = false,
}) => {
  const [dots, setDots] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);

    const timeInterval = setInterval(() => {
      setElapsedTime(prev => prev + 100);
    }, 100);

    return () => {
      clearInterval(dotsInterval);
      clearInterval(timeInterval);
    };
  }, []);

  const progress = showProgress && elapsedTime > 1000 
    ? Math.min(90, (elapsedTime / 100) * 2) 
    : 0;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: 'linear-gradient(to bottom, rgba(45, 80, 22, 0.03), rgba(124, 179, 66, 0.02))',
        backdropFilter: 'blur(8px)',
      }}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="flex flex-col items-center gap-6 px-6 py-8">
        {/* Adaptive loader */}
        <AdaptiveLoader size="xl" text={message} showMessage={false} />

        {/* Message with animated dots */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-lg font-medium text-forest-green">
            {message}{dots}
          </p>
          
          {/* Progress indicator for long loads */}
          {showProgress && progress > 0 && (
            <div className="w-48 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-forest-green transition-all duration-300 ease-out rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>

        {/* Subtle decorative element */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <svg width="120" height="2" viewBox="0 0 120 2" fill="none">
            <line 
              x1="0" 
              y1="1" 
              x2="120" 
              y2="1" 
              stroke="#2D5016" 
              strokeWidth="1" 
              strokeOpacity="0.2"
              strokeDasharray="4 4"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// SIMPLE NATURE LOADER - Minimal version for suspense fallbacks
// ============================================================================

interface SimpleNatureLoaderProps {
  size?: LoadingSize;
  className?: string;
}

export const SimpleNatureLoader: React.FC<SimpleNatureLoaderProps> = ({
  size = 'md',
  className = '',
}) => {
  return (
    <div 
      className={`flex items-center justify-center ${className}`}
      role="status"
      aria-label="Loading"
    >
      <SeedGrowthLoader size={size} />
    </div>
  );
};

// ============================================================================
// LOADING SPINNER - Backwards compatible with custom text
// ============================================================================

interface LoadingSpinnerProps {
  size?: LoadingSize;
  text?: string;
  color?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text,
  color = 'text-forest-green',
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <SeedGrowthLoader size={size} />
      {text && (
        <p className={`text-sm ${color}`}>
          {text}
        </p>
      )}
    </div>
  );
};

// ============================================================================
// LOADING OVERLAY - For content that's loading in place
// ============================================================================

interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  size?: LoadingSize;
  message?: string;
  blur?: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  children,
  size = 'lg',
  message = 'Loading...',
  blur = true,
}) => {
  if (!isLoading) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Content with optional blur */}
      <div className={blur ? 'filter blur-sm opacity-50 pointer-events-none' : ''}>
        {children}
      </div>

      {/* Overlay loader */}
      <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm">
        <AdaptiveLoader size={size} text={message} />
      </div>
    </div>
  );
};

// ============================================================================
// SMART LOADER - Auto-detects loading duration and adapts
// ============================================================================

interface SmartLoaderProps {
  isLoading: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  minDisplayTime?: number; // Minimum time to show loader (prevents flashing)
  size?: LoadingSize;
  message?: string;
}

export const SmartLoader: React.FC<SmartLoaderProps> = ({
  isLoading,
  children,
  fallback,
  minDisplayTime = 300,
  size = 'md',
  message,
}) => {
  const [showLoader, setShowLoader] = useState(isLoading);
  const [loaderStartTime, setLoaderStartTime] = useState<number | null>(null);

  useEffect(() => {
    if (isLoading) {
      setShowLoader(true);
      setLoaderStartTime(Date.now());
    } else if (loaderStartTime) {
      const elapsed = Date.now() - loaderStartTime;
      const remaining = Math.max(0, minDisplayTime - elapsed);

      if (remaining > 0) {
        const timeout = setTimeout(() => {
          setShowLoader(false);
          setLoaderStartTime(null);
        }, remaining);

        return () => clearTimeout(timeout);
      } else {
        setShowLoader(false);
        setLoaderStartTime(null);
      }
    }
  }, [isLoading, loaderStartTime, minDisplayTime]);

  if (showLoader) {
    return (
      <>
        {fallback || <AdaptiveLoader size={size} text={message} />}
      </>
    );
  }

  return <>{children}</>;
};
