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
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        // Calculate position for popup
        const scrollY = window.scrollY || window.pageYOffset;
        const scrollX = window.scrollX || window.pageXOffset;

        setSelection({
          text,
          paragraphId,
          startOffset: range.startOffset,
          endOffset: range.endOffset,
          position: {
            top: rect.bottom + scrollY + 10,
            left: Math.min(rect.left + scrollX, window.innerWidth - 350),
          },
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
