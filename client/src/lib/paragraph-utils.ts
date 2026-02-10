import { ReactNode, isValidElement } from 'react';

/**
 * Generate a deterministic paragraph ID from content + index.
 * Uses djb2 hash so IDs survive page reloads (unlike Math.random).
 */
export function stableParagraphId(textContent: string, index: number): string {
  const source = `${index}:${textContent.trim().substring(0, 100)}`;
  let hash = 5381;
  for (let i = 0; i < source.length; i++) {
    hash = ((hash << 5) + hash) + source.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `p-${Math.abs(hash).toString(36)}`;
}

/**
 * Recursively extract plain text from React children.
 * Handles strings, numbers, arrays, and nested elements.
 */
export function extractTextFromChildren(children: ReactNode): string {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (children == null || typeof children === 'boolean') return '';
  if (Array.isArray(children)) return children.map(extractTextFromChildren).join('');
  if (isValidElement(children) && children.props?.children) {
    return extractTextFromChildren(children.props.children);
  }
  return '';
}
