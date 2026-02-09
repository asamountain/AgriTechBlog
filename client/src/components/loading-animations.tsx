import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  color?: string;
}

interface InlineSpinnerProps {
  size?: 'xs' | 'sm' | 'md';
  color?: string;
  className?: string;
}

export function ShadowLoader({ size = 'md', text, color = 'text-gray-600' }: LoadingSpinnerProps) {
  const [shadowIntensity, setShadowIntensity] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setShadowIntensity(prev => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const shadowOpacity = Math.sin(shadowIntensity * 0.1) * 0.3 + 0.5;

  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      <div className="relative">
        <div 
          className="absolute inset-0 bg-gray-300 rounded-full blur-sm"
          style={{ 
            opacity: shadowOpacity,
            transform: `scale(${1 + shadowOpacity * 0.2})`
          }}
        />
        <Loader2 className={`${sizeClasses[size]} ${color} animate-spin relative z-10`} />
      </div>
      {text && (
        <p className="text-sm text-gray-600">{text}</p>
      )}
    </div>
  );
}

// Main loading component with shadowing effect
export function LoadingSpinner({ size = 'md', text, color }: LoadingSpinnerProps) {
  return <ShadowLoader size={size} text={text} color={color} />;
}

// Inline spinner for buttons and small loading states
export function InlineSpinner({ size = 'sm', color, className = '' }: InlineSpinnerProps) {
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5'
  };

  // Default colors based on context
  const colorClass = color || 'text-gray-600';

  return (
    <Loader2 className={`${sizeClasses[size]} ${colorClass} animate-spin ${className}`} />
  );
}

// Simple page loader without full-screen background (for Suspense fallbacks)
export function SimplePageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest-green"></div>
    </div>
  );
}

// Page-level loading screen with consistent shadowing
export function PageLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="text-center space-y-6">
        <ShadowLoader size="lg" />
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">{message}</h2>
          <p className="text-gray-600">Please wait...</p>
        </div>
        <div className="flex space-x-2 justify-center">
          {[1, 2, 3].map((index) => (
            <div 
              key={index}
              className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"
              style={{ animationDelay: `${index * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Skeleton loader with consistent gray shadowing
export function ContentSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gray-300 rounded-full shadow-sm"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-300 rounded w-3/4 shadow-sm"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 shadow-sm"></div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-300 rounded shadow-sm"></div>
        <div className="h-4 bg-gray-300 rounded w-5/6 shadow-sm"></div>
        <div className="h-4 bg-gray-300 rounded w-4/6 shadow-sm"></div>
      </div>
      <div className="h-32 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg shadow-md"></div>
    </div>
  );
}

// Legacy exports removed - use LoadingSpinner, PageLoader, and ContentSkeleton directly