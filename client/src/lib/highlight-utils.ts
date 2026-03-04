import type { Annotation } from '@shared/schema';

/**
 * Clear all inline highlights from a container element.
 * Unwraps <mark> elements back to plain text nodes.
 */
export function clearHighlights(container: HTMLElement): void {
  const marks = container.querySelectorAll('mark.inline-highlight');
  marks.forEach((mark) => {
    const parent = mark.parentNode;
    if (parent) {
      const text = document.createTextNode(mark.textContent || '');
      parent.replaceChild(text, mark);
      parent.normalize();
    }
  });
}

/**
 * Highlight a specific text string within a DOM element.
 * Uses TreeWalker to find text nodes and wraps matching ranges in <mark>.
 */
function highlightTextInElement(
  element: Element,
  searchText: string,
  annotationId: string,
  onClick: (annotationId: string) => void,
): void {
  const treeWalker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let accumulated = '';
  const textNodes: { node: Text; start: number; end: number }[] = [];

  while (treeWalker.nextNode()) {
    const node = treeWalker.currentNode as Text;
    const start = accumulated.length;
    accumulated += node.textContent || '';
    textNodes.push({ node, start, end: accumulated.length });
  }

  const matchIndex = accumulated.indexOf(searchText);
  if (matchIndex === -1) return;

  const matchEnd = matchIndex + searchText.length;

  // Process nodes in reverse order to avoid DOM mutation issues
  const affectedNodes = textNodes.filter(
    ({ start, end }) => end > matchIndex && start < matchEnd,
  );

  for (let i = affectedNodes.length - 1; i >= 0; i--) {
    const { node, start } = affectedNodes[i];
    const nodeText = node.textContent || '';

    const highlightStart = Math.max(0, matchIndex - start);
    const highlightEnd = Math.min(nodeText.length, matchEnd - start);

    // Skip if already inside a <mark>
    if (node.parentElement?.classList.contains('inline-highlight')) continue;

    const range = document.createRange();
    range.setStart(node, highlightStart);
    range.setEnd(node, highlightEnd);

    const mark = document.createElement('mark');
    mark.className = 'inline-highlight';
    mark.dataset.annotationId = annotationId;
    mark.addEventListener('click', () => onClick(annotationId));

    try {
      range.surroundContents(mark);
    } catch {
      // surroundContents fails if range crosses element boundaries — skip
    }
  }
}

/**
 * Apply highlight marks to all annotations in a container.
 * Call this in a useEffect after markdown renders.
 */
export function applyHighlights(
  container: HTMLElement,
  annotations: Annotation[],
  onAnnotationClick: (annotationId: string) => void,
): void {
  clearHighlights(container);

  const highlightable = annotations.filter(
    (a) => a.type === 'highlight' || a.type === 'response',
  );

  for (const annotation of highlightable) {
    const paragraph = container.querySelector(
      `[data-paragraph-id="${annotation.paragraphId}"]`,
    );
    if (!paragraph) continue;

    highlightTextInElement(
      paragraph,
      annotation.selectedText,
      annotation.id,
      onAnnotationClick,
    );
  }
}
