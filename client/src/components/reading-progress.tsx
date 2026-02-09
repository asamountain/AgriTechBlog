import { useState, useEffect } from "react";

export default function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      // Get the blog content container for more accurate progress tracking
      const contentContainer = document.querySelector('.blog-content');
      if (!contentContainer) {
        // Fallback to document-based calculation
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        setProgress(Math.min(100, Math.max(0, scrollPercent)));
        return;
      }

      const containerTop = contentContainer.getBoundingClientRect().top + window.scrollY;
      const containerHeight = contentContainer.scrollHeight;
      const viewportHeight = window.innerHeight;
      const scrollTop = window.scrollY;

      // Calculate progress based on blog content area
      const contentStart = containerTop;
      const contentEnd = containerTop + containerHeight;
      const viewportBottom = scrollTop + viewportHeight;

      let scrollPercent = 0;
      if (scrollTop >= contentStart) {
        const readableContent = contentEnd - contentStart;
        const progressInContent = Math.min(viewportBottom - contentStart, readableContent);
        scrollPercent = (progressInContent / readableContent) * 100;
      }
      
      setProgress(Math.min(100, Math.max(0, scrollPercent)));
    };

    // Initial calculation
    updateProgress();

    // Update on scroll
    window.addEventListener('scroll', updateProgress, { passive: true });
    
    // Update on resize (content height might change)
    window.addEventListener('resize', updateProgress, { passive: true });

    return () => {
      window.removeEventListener('scroll', updateProgress);
      window.removeEventListener('resize', updateProgress);
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-200">
      <div 
        className="h-full bg-forest-green transition-all duration-200 ease-out shadow-sm"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}