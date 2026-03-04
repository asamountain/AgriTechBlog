import { useState, useEffect, useCallback } from 'react';

interface SelectionData {
  text: string;
  paragraphId: string;
  startOffset: number;
  endOffset: number;
  position: { top: number; left: number };
}

export function useTextSelection(containerRef: React.RefObject<HTMLElement>) {
  const [selection, setSelection] = useState<SelectionData | null>(null);

  const handleSelection = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !containerRef.current) {
      setSelection(null);
      return;
    }

    const text = sel.toString().trim();
    
    // Minimum selection length
    if (text.length < 5) {
      setSelection(null);
      return;
    }

    // Maximum selection length to prevent abuse
    if (text.length > 500) {
      setSelection(null);
      return;
    }

    // Find paragraph containing selection
    let node: Node | null = sel.anchorNode;
    while (node && node !== containerRef.current) {
      if ((node as HTMLElement).dataset?.paragraphId) {
        const paragraphId = (node as HTMLElement).dataset.paragraphId!;
        const paragraphElement = node as HTMLElement;
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        // Calculate offsets relative to paragraph's textContent (ignore mark boundaries)
        const paragraphText = paragraphElement.textContent || '';
        const startOffset = paragraphText.indexOf(text);
        const endOffset = startOffset + text.length;

        // Toolbar dimensions (estimate)
        const toolbarWidth = 320;
        const toolbarHeight = 40;

        // Calculate ideal position (centered above selection)
        let top = rect.top - toolbarHeight - 8;
        let left = rect.left + (rect.width / 2) - (toolbarWidth / 2);

        // Viewport boundary detection
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Keep within left/right bounds
        if (left < 10) left = 10;
        if (left + toolbarWidth > viewportWidth - 10) {
          left = viewportWidth - toolbarWidth - 10;
        }

        // Keep within top/bottom bounds (flip to below if needed)
        if (top < 10) {
          top = rect.bottom + 8;
        }
        if (top + toolbarHeight > viewportHeight - 10) {
          top = viewportHeight - toolbarHeight - 10;
        }

        setSelection({
          text,
          paragraphId,
          startOffset,
          endOffset,
          position: { top, left },
        });
        return;
      }
      node = node.parentNode;
    }

    // If no paragraph found, clear selection
    setSelection(null);
  }, [containerRef]);

  useEffect(() => {
    const handleMouseUp = () => {
      // Small delay to ensure selection is complete
      setTimeout(handleSelection, 50);
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchend', handleMouseUp);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, [handleSelection]);

  const clearSelection = useCallback(() => {
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  }, []);

  return { selection, clearSelection };
}
