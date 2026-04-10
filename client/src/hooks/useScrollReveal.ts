import { useState, useEffect } from "react";

/**
 * A hook for revealing elements when they scroll into view.
 * Improved with an initial viewport check, callback ref, AND a polling fallback
 * to ensure dynamic content always reveals correctly.
 */
export function useScrollReveal() {
  const [element, setElement] = useState<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // If we've already revealed the element, or it's not mounted, do nothing.
    if (!element || isVisible) return;

    // 1. Setup the Observer
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting || entry.intersectionRatio > 0) {
          setIsVisible(true);
        }
      },
      { threshold: 0, rootMargin: "0px 0px 100px 0px" }
    );

    observer.observe(element);

    // 2. Manual Visibility Check (Fallback)
    const checkVisibility = () => {
      if (!element || isVisible) return;
      const rect = element.getBoundingClientRect();
      const inView = rect.top < (window.innerHeight || document.documentElement.clientHeight) && rect.bottom > 0;
      if (inView) {
        setIsVisible(true);
      }
    };

    // Check immediately and after layout settlement
    checkVisibility();
    const timers = [
      setTimeout(checkVisibility, 50),
      setTimeout(checkVisibility, 250),
      setTimeout(checkVisibility, 1000), // Long fallback for slow-loading content
    ];

    // 3. Scroll Listener (Final Fallback)
    // If all else fails, reveal when the user moves the page.
    window.addEventListener('scroll', checkVisibility, { passive: true });

    return () => {
      observer.disconnect();
      timers.forEach(clearTimeout);
      window.removeEventListener('scroll', checkVisibility);
    };
  }, [element, isVisible]);

  return { ref: setElement, isVisible };
}
