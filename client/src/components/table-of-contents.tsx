import { useState, useEffect } from "react";
import { BookOpen, ChevronRight } from "lucide-react";

interface TocItem {
  id: string;
  text: string;
  level: number;
  element: HTMLElement;
}

interface TableOfContentsProps {
  content: string;
}

export default function TableOfContents({ content }: TableOfContentsProps) {
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    // Parse headings from content after it's rendered
    const timer = setTimeout(() => {
      // Only select headings within the blog-content area to exclude navigation, logo, etc.
      const contentContainer = document.querySelector('.blog-content');
      if (!contentContainer) return;
      
      const headings = contentContainer.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const items: TocItem[] = [];

      headings.forEach((heading, index) => {
        const element = heading as HTMLElement;
        const level = parseInt(element.tagName.charAt(1));
        const text = element.textContent || '';
        
        // Skip empty headings
        if (!text.trim()) return;
        
        // Create unique ID if it doesn't exist
        let id = element.id;
        if (!id) {
          id = `content-heading-${index}-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
          element.id = id;
        }

        items.push({
          id,
          text,
          level,
          element
        });
      });

      setTocItems(items);
    }, 100);

    return () => clearTimeout(timer);
  }, [content]);

  useEffect(() => {
    // Set up intersection observer for active heading detection
    if (tocItems.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-100px 0px -66%',
        threshold: 0
      }
    );

    tocItems.forEach((item) => {
      observer.observe(item.element);
    });

    return () => {
      tocItems.forEach((item) => {
        observer.unobserve(item.element);
      });
    };
  }, [tocItems]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100; // Account for fixed header
      const elementPosition = element.offsetTop - offset;
      
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
  };

  const getIndentClass = (level: number) => {
    switch (level) {
      case 1: return 'pl-0';
      case 2: return 'pl-4';
      case 3: return 'pl-8';
      case 4: return 'pl-12';
      case 5: return 'pl-16';
      case 6: return 'pl-20';
      default: return 'pl-0';
    }
  };

  const getFontSizeClass = (level: number) => {
    switch (level) {
      case 1: return 'text-base font-semibold';
      case 2: return 'text-sm font-medium';
      case 3: return 'text-sm';
      case 4: return 'text-xs';
      case 5: return 'text-xs';
      case 6: return 'text-xs';
      default: return 'text-sm';
    }
  };

  if (tocItems.length === 0) return null;

  return (
    <div className="sticky top-24 bg-white border border-gray-200 rounded-lg shadow-sm p-4 max-h-[calc(100vh-120px)] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-forest-green" />
          <h3 className="font-semibold text-gray-900">Table of Contents</h3>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <ChevronRight className={`h-4 w-4 text-gray-500 transition-transform ${isCollapsed ? '' : 'rotate-90'}`} />
        </button>
      </div>

      {!isCollapsed && (
        <nav className="space-y-1">
          {tocItems.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToHeading(item.id)}
              className={`
                w-full text-left py-2 px-2 rounded transition-colors
                ${getIndentClass(item.level)}
                ${getFontSizeClass(item.level)}
                ${activeId === item.id 
                  ? 'bg-forest-green/10 text-forest-green border-l-2 border-forest-green' 
                  : 'text-gray-700 hover:bg-gray-50 hover:text-forest-green'
                }
              `}
            >
              <span className="block truncate">
                {item.text}
              </span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}