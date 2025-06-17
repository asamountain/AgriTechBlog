import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

interface TextHighlighterProps {
  postId: number;
  postSlug: string;
  user?: User;
  isOwner: boolean;
  children: React.ReactNode;
}

interface HighlightMenuProps {
  position: { x: number; y: number };
  selectedText: string;
  onHighlight: () => void;
  onShare: () => void;
  onClose: () => void;
}

function HighlightMenu({ position, selectedText, onHighlight, onShare, onClose }: HighlightMenuProps) {
  console.log('Rendering HighlightMenu at position:', position);
  return (
    <div 
      className="fixed z-[9999] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-3 flex gap-2 min-w-[200px]"
      style={{ 
        left: `${position.x - 100}px`, 
        top: `${position.y}px`,
        transform: 'translateX(-50%)'
      }}
    >
      <Button size="sm" onClick={onHighlight} className="bg-[#2D5016] hover:bg-[#2D5016]/90 text-white flex-1">
        Highlight
      </Button>
      <Button size="sm" variant="outline" onClick={onShare} className="flex-1">
        Share
      </Button>
      <Button size="sm" variant="ghost" onClick={onClose} className="px-2 ml-1">
        ×
      </Button>
    </div>
  );
}

export default function SimpleTextHighlighter({ postId, postSlug, user, isOwner, children }: TextHighlighterProps) {
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedRange, setSelectedRange] = useState<Range | null>(null);
  
  const contentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Handle text selection for highlighting menu
  const handleMouseUp = useCallback(() => {
    // Small delay to ensure selection is complete
    setTimeout(() => {
      try {
        const selection = window.getSelection();
        console.log('Selection:', selection);
        if (!selection || selection.isCollapsed) {
          console.log('No selection or collapsed');
          setShowHighlightMenu(false);
          return;
        }

        const selectedText = selection.toString().trim();
        console.log('Selected text:', selectedText);
        if (selectedText.length === 0) {
          setShowHighlightMenu(false);
          return;
        }

        // Get selection position for menu
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        console.log('Selection rect:', rect);
        
        setSelectedText(selectedText);
        setSelectedRange(range.cloneRange());
        setMenuPosition({ 
          x: Math.max(10, rect.left + rect.width / 2), 
          y: rect.bottom + window.scrollY + 10 
        });
        console.log('Showing highlight menu');
        setShowHighlightMenu(true);
      } catch (error) {
        console.error('Error in handleMouseUp:', error);
      }
    }, 100);
  }, []);

  const handleHighlightAction = useCallback(() => {
    if (!user) {
      // Redirect to login
      toast({
        title: "Sign in required",
        description: "Please sign in to highlight text and add comments.",
        variant: "default",
      });
      window.location.href = "/auth/google";
      return;
    }

    // For now, just show a toast
    toast({
      title: "Highlight feature",
      description: `Selected: "${selectedText.substring(0, 50)}${selectedText.length > 50 ? '...' : ''}"`,
      variant: "default",
    });
    
    setShowHighlightMenu(false);
  }, [user, selectedText, toast]);

  const handleShareAction = useCallback(() => {
    // Copy selected text to clipboard
    if (selectedText) {
      navigator.clipboard.writeText(`"${selectedText}" - from ${window.location.href}`);
      toast({
        title: "Text copied",
        description: "Selected text copied to clipboard with link.",
        variant: "default",
      });
    }
    setShowHighlightMenu(false);
  }, [selectedText, toast]);

  const handleCloseMenu = useCallback(() => {
    setShowHighlightMenu(false);
    // Clear selection
    window.getSelection()?.removeAllRanges();
  }, []);

  // Add event listener for text selection
  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    console.log('Adding mouseup event listener');
    content.addEventListener('mouseup', handleMouseUp);
    
    // Also listen for clicks outside to close menu
    const handleClickOutside = (event: MouseEvent) => {
      if (showHighlightMenu && content && !content.contains(event.target as Node)) {
        setShowHighlightMenu(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      content.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [handleMouseUp, showHighlightMenu]);

  return (
    <div ref={contentRef} className="relative">
      {children}
      
      {/* Highlight menu for text selection */}
      {showHighlightMenu && (
        <HighlightMenu
          position={menuPosition}
          selectedText={selectedText}
          onHighlight={handleHighlightAction}
          onShare={handleShareAction}
          onClose={handleCloseMenu}
        />
      )}
    </div>
  );
}