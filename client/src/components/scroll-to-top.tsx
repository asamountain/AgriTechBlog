import { useState, useEffect } from "react";
import { ArrowUp, List } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const [hasScrolledPastTOC, setHasScrolledPastTOC] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      const scrollY = window.scrollY;
      
      // Show button when user has scrolled down 300px
      if (scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }

      // Check if user has scrolled past the TOC area
      const tocElement = document.querySelector('.blog-content');
      if (tocElement) {
        const tocTop = tocElement.getBoundingClientRect().top + window.scrollY;
        setHasScrolledPastTOC(scrollY > tocTop + 200);
      }
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  const handleScroll = () => {
    if (!hasScrolledPastTOC) {
      // First click: scroll to top of page
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else {
      // User is deep in content: scroll to TOC area
      const tocElement = document.querySelector('.blog-content');
      if (tocElement) {
        const tocTop = tocElement.getBoundingClientRect().top + window.scrollY - 120;
        window.scrollTo({
          top: tocTop,
          behavior: 'smooth'
        });
      } else {
        // Fallback to top
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    }
  };

  if (!isVisible) return null;

  return (
    <Button
      onClick={handleScroll}
      className="fixed bottom-8 right-8 z-40 bg-forest-green hover:bg-forest-green/90 text-white shadow-lg rounded-full p-3 h-12 w-12"
      aria-label={hasScrolledPastTOC ? "Scroll to table of contents" : "Scroll to top"}
    >
      {hasScrolledPastTOC ? <List className="h-5 w-5" /> : <ArrowUp className="h-5 w-5" />}
    </Button>
  );
}