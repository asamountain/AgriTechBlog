import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUp, List } from 'lucide-react';

export default function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollState, setScrollState] = useState<'hidden' | 'to-toc' | 'to-top'>('hidden');

  useEffect(() => {
    const toggleVisibility = () => {
      const scrollY = window.scrollY;
      const tocElement = document.querySelector('aside'); // TOC sidebar
      const tocPosition = tocElement?.offsetTop || 200;
      
      if (scrollY > 300) {
        setIsVisible(true);
        // If we're past the TOC, show "to-toc", otherwise show "to-top"
        if (scrollY > tocPosition + 200) {
          setScrollState('to-toc');
        } else {
          setScrollState('to-top');
        }
      } else {
        setIsVisible(false);
        setScrollState('hidden');
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const handleClick = () => {
    if (scrollState === 'to-toc') {
      // First click: scroll to TOC
      const tocElement = document.querySelector('aside');
      if (tocElement) {
        window.scrollTo({
          top: tocElement.offsetTop - 120,
          behavior: 'smooth'
        });
      }
      setScrollState('to-top');
    } else {
      // Second click or direct to top: scroll to very top
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      setScrollState('to-toc');
    }
  };

  if (!isVisible) return null;

  return (
    <Button
      onClick={handleClick}
      className={`
        fixed bottom-8 right-8 z-50 w-12 h-12 rounded-full 
        bg-forest-green hover:bg-forest-green/90 
        text-white shadow-lg hover:shadow-xl
        transition-all duration-300 ease-in-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
      aria-label={scrollState === 'to-toc' ? 'Scroll to Table of Contents' : 'Scroll to top'}
    >
      {scrollState === 'to-toc' ? (
        <List className="w-5 h-5" />
      ) : (
        <ArrowUp className="w-5 h-5" />
      )}
    </Button>
  );
}