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
    // Parse markdown content to extract headings
    const lines = content.split('\n');
    const headingRegex = /^(#{1,6})\s+(.+)$/;
    const headings: { level: number; text: string; line: number }[] = [];
    
    lines.forEach((line, index) => {
      const match = line.match(headingRegex);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim();
        headings.push({ level, text, line: index });
      }
    });
    
    const items: TOCItem[] = [];
    const usedIds = new Set<string>();
    
    headings.forEach((heading, index) => {
      const level = heading.level;
      const text = heading.text;
      let id = '';
      
      // Generate ID from heading text
      id = text.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '')
        .trim();
      
      // Ensure uniqueness
      let uniqueId = id;
      let counter = 1;
      while (usedIds.has(uniqueId)) {
        uniqueId = `${id}-${counter}`;
        counter++;
      }
      id = uniqueId;
      
      usedIds.add(id);
      items.push({ id, text, level });
    });
    
    setTocItems(items);
    
    // Apply IDs to actual DOM elements after a brief delay to ensure content is rendered
    setTimeout(() => {
      // Only select headings within the blog content area
      const blogContent = document.querySelector('.blog-content');
      if (blogContent) {
        const actualHeadings = blogContent.querySelectorAll('h1, h2, h3, h4, h5, h6');
        
        // Debug logging
        console.log('TOC Debug - Parsed items:', items.length);
        console.log('TOC Debug - Actual headings found:', actualHeadings.length);
        
        actualHeadings.forEach((heading, index) => {
          if (items[index]) {
            const expectedId = items[index].id;
            const currentId = heading.id;
            
            if (!currentId) {
              heading.id = expectedId;
              console.log(`TOC Debug - Assigned ID "${expectedId}" to heading "${items[index].text}"`);
            } else if (currentId !== expectedId) {
              console.log(`TOC Debug - Heading already has different ID: "${currentId}" vs expected "${expectedId}"`);
            }
          }
        });
      }
    }, 100);
  }, [content]);

  useEffect(() => {
    // Intersection Observer for active section tracking
    const observer = new IntersectionObserver(
      (entries) => {
        // Find the entry that's most visible
        const visibleEntries = entries.filter(entry => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          // Sort by intersection ratio and position to get the most prominent heading
          const mostVisible = visibleEntries.reduce((prev, current) => {
            return current.intersectionRatio > prev.intersectionRatio ? current : prev;
          });
          setActiveId(mostVisible.target.id);
        }
      },
      {
        rootMargin: '-20% 0px -60% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1]
      }
    );

    // Add a small delay to ensure DOM elements are ready
    const timeoutId = setTimeout(() => {
      // Only observe headings within the blog content area
      const blogContent = document.querySelector('.blog-content');
      if (blogContent) {
        tocItems.forEach(({ id }) => {
          const element = blogContent.querySelector(`#${CSS.escape(id)}`);
          if (element) {
            observer.observe(element);
          }
        });
      }
    }, 200);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [tocItems]);

  const scrollToHeading = (id: string) => {
    // First try to find the element within the blog content area
    const blogContent = document.querySelector('.blog-content');
    let element = null;
    
    if (blogContent) {
      element = blogContent.querySelector(`#${CSS.escape(id)}`);
    }
    
    // Fallback to document-wide search if not found
    if (!element) {
      element = document.getElementById(id);
    }
    
    if (element) {
      console.log(`TOC Debug - Scrolling to heading: "${id}"`);
      // Use scrollIntoView with block: 'start' and behavior: 'smooth'
      // This relies on the CSS scroll-margin-top to handle the offset automatically
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    } else {
      console.error(`TOC Debug - Element with id "${id}" not found`);
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