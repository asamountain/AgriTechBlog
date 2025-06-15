import { useState, useEffect } from 'react';
import { Sprout, Wheat, Droplets, Sun, Leaf, TreePine, Flower2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  theme?: 'growth' | 'harvest' | 'water' | 'sunshine' | 'forest';
  text?: string;
}

export function GrowthLoader({ size = 'md', text }: LoadingSpinnerProps) {
  const [stage, setStage] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setStage(prev => (prev + 1) % 4);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const icons = [
    <div className="w-2 h-2 bg-forest-green rounded-full animate-pulse" />,
    <Sprout className={`${sizeClasses[size]} text-forest-green animate-bounce`} />,
    <Leaf className={`${sizeClasses[size]} text-green-600 animate-pulse`} />,
    <TreePine className={`${sizeClasses[size]} text-forest-green animate-pulse`} />
  ];

  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-t from-amber-100 to-transparent rounded-full opacity-30" />
        {icons[stage]}
      </div>
      {text && (
        <p className="text-sm text-gray-600 animate-pulse">{text}</p>
      )}
    </div>
  );
}

export function HarvestLoader({ size = 'md', text }: LoadingSpinnerProps) {
  const [rotation, setRotation] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setRotation(prev => prev + 45);
    }, 300);
    return () => clearInterval(interval);
  }, []);

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      <div className="relative">
        <Wheat 
          className={`${sizeClasses[size]} text-amber-600`}
          style={{ transform: `rotate(${rotation}deg)` }}
        />
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-gradient-to-r from-amber-200 to-amber-400 rounded-full opacity-60" />
      </div>
      {text && (
        <p className="text-sm text-gray-600 animate-pulse">{text}</p>
      )}
    </div>
  );
}

export function WaterDropLoader({ size = 'md', text }: LoadingSpinnerProps) {
  const [drops, setDrops] = useState([0, 1, 2]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDrops(prev => prev.map(drop => (drop + 1) % 3));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      <div className="flex space-x-1">
        {drops.map((drop, index) => (
          <Droplets 
            key={index}
            className={`${sizeClasses[size]} text-blue-500`}
            style={{ 
              opacity: drop === 0 ? 1 : drop === 1 ? 0.6 : 0.3,
              transform: `translateY(${drop * 2}px)`
            }}
          />
        ))}
      </div>
      {text && (
        <p className="text-sm text-gray-600 animate-pulse">{text}</p>
      )}
    </div>
  );
}

export function SunshineLoader({ size = 'md', text }: LoadingSpinnerProps) {
  const [glow, setGlow] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setGlow(prev => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const glowIntensity = Math.sin(glow * 0.1) * 0.5 + 0.5;

  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      <div className="relative">
        <div 
          className="absolute inset-0 bg-yellow-300 rounded-full blur-md"
          style={{ opacity: glowIntensity * 0.4 }}
        />
        <Sun 
          className={`${sizeClasses[size]} text-yellow-500 relative z-10`}
          style={{ 
            filter: `brightness(${1 + glowIntensity * 0.5})`,
            transform: `rotate(${glow * 3.6}deg)`
          }}
        />
      </div>
      {text && (
        <p className="text-sm text-gray-600 animate-pulse">{text}</p>
      )}
    </div>
  );
}

export function FlowerBloomLoader({ size = 'md', text }: LoadingSpinnerProps) {
  const [scale, setScale] = useState(0.5);
  const [growing, setGrowing] = useState(true);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setScale(prev => {
        if (growing) {
          if (prev >= 1.2) {
            setGrowing(false);
            return 1.2;
          }
          return prev + 0.05;
        } else {
          if (prev <= 0.5) {
            setGrowing(true);
            return 0.5;
          }
          return prev - 0.05;
        }
      });
    }, 80);
    return () => clearInterval(interval);
  }, [growing]);

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      <div className="relative">
        <Flower2 
          className={`${sizeClasses[size]} text-pink-500`}
          style={{ 
            transform: `scale(${scale})`,
            transition: 'transform 0.1s ease-in-out'
          }}
        />
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1 h-4 bg-green-500 rounded-full opacity-80" />
      </div>
      {text && (
        <p className="text-sm text-gray-600 animate-pulse">{text}</p>
      )}
    </div>
  );
}

// Comprehensive agricultural loading component
export function AgricultureLoader({ theme = 'growth', size = 'md', text }: LoadingSpinnerProps) {
  const loaders = {
    growth: <GrowthLoader size={size} text={text} />,
    harvest: <HarvestLoader size={size} text={text} />,
    water: <WaterDropLoader size={size} text={text} />,
    sunshine: <SunshineLoader size={size} text={text} />,
    forest: <FlowerBloomLoader size={size} text={text} />
  };

  return (
    <div className="flex items-center justify-center p-4">
      {loaders[theme]}
    </div>
  );
}

// Page-level loading screen with agricultural theme
export function AgriculturePageLoader({ message = "Growing fresh content..." }: { message?: string }) {
  const [currentTheme, setCurrentTheme] = useState<'growth' | 'harvest' | 'water' | 'sunshine' | 'forest'>('growth');
  const themes: ('growth' | 'harvest' | 'water' | 'sunshine' | 'forest')[] = ['growth', 'harvest', 'water', 'sunshine', 'forest'];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTheme(prev => {
        const currentIndex = themes.indexOf(prev);
        return themes[(currentIndex + 1) % themes.length];
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-forest-green/10 flex items-center justify-center">
      <div className="text-center space-y-6">
        <AgricultureLoader theme={currentTheme} size="lg" />
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">{message}</h2>
          <p className="text-gray-600">Nurturing your agricultural insights...</p>
        </div>
        <div className="flex space-x-2 justify-center">
          {themes.map((theme, index) => (
            <div 
              key={theme}
              className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                theme === currentTheme ? 'bg-forest-green' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Skeleton loader with agricultural theme for content loading
export function AgriculturalSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-green-200 rounded-full"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-green-200 rounded w-3/4"></div>
          <div className="h-3 bg-green-100 rounded w-1/2"></div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-green-200 rounded"></div>
        <div className="h-4 bg-green-200 rounded w-5/6"></div>
        <div className="h-4 bg-green-200 rounded w-4/6"></div>
      </div>
      <div className="h-32 bg-gradient-to-r from-green-100 to-green-200 rounded-lg"></div>
    </div>
  );
}