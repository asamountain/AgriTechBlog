import { useEffect, useState } from "react";
import { ChevronRight, List } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

export default function TableOfContents({ content }: TableOfContentsProps) {
  const [tocItems, setTocItems] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    // Parse HTML content to extract headings
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    const items: TOCItem[] = [];
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1));
      const text = heading.textContent || '';
      let id = heading.id;
      
      // Generate ID if not present
      if (!id) {
        id = text.toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();
        
        // Ensure uniqueness
        if (items.some(item => item.id === id)) {
          id = `${id}-${index}`;
        }
        heading.id = id;
      }
      
      items.push({ id, text, level });
    });
    
    setTocItems(items);
  }, [content]);

  useEffect(() => {
    // Intersection Observer for active section tracking
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-100px 0px -80% 0px',
        threshold: 0.1
      }
    );

    tocItems.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
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

  if (tocItems.length === 0) {
    return null;
  }

  return (
    <Card className="sticky top-24 bg-white/80 backdrop-blur-sm border border-sage-200 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-forest-green flex items-center gap-2">
            <List className="w-5 h-5" />
            Table of Contents
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 h-auto"
          >
            <ChevronRight 
              className={`w-4 h-4 transition-transform ${isCollapsed ? '' : 'rotate-90'}`} 
            />
          </Button>
        </div>
      </CardHeader>
      
      {!isCollapsed && (
        <CardContent className="pt-0">
          <nav className="space-y-1">
            {tocItems.map(({ id, text, level }) => (
              <button
                key={id}
                onClick={() => scrollToHeading(id)}
                className={`
                  block w-full text-left px-2 py-2 rounded-md text-sm transition-all duration-200
                  hover:bg-sage-100 hover:text-forest-green
                  ${activeId === id 
                    ? 'bg-sage-100 text-forest-green font-medium border-l-2 border-forest-green' 
                    : 'text-gray-600 hover:text-forest-green'
                  }
                `}
                style={{ 
                  paddingLeft: `${(level - 1) * 12 + 8}px`,
                  fontSize: level === 1 ? '14px' : level === 2 ? '13px' : '12px'
                }}
              >
                {text}
              </button>
            ))}
          </nav>
        </CardContent>
      )}
    </Card>
  );
}