import { useProgressBar } from '@/hooks/useProgressBar';

export function TopProgressBar() {
  const { progress, isActive } = useProgressBar();

  if (!isActive && progress === 0) return null;

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Page loading"
      className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none"
      style={{ height: '3px' }}
    >
      <div
        className="h-full transition-all duration-200 ease-out"
        style={{
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #2D5016, #7CB342)',
          boxShadow: '0 0 8px rgba(45, 80, 22, 0.4)',
          opacity: progress >= 100 ? 0 : 1,
          transition: progress >= 100
            ? 'width 200ms ease-out, opacity 300ms ease-out 100ms'
            : 'width 200ms ease-out',
        }}
      />
    </div>
  );
}
