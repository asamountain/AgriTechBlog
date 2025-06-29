import TurndownService from 'turndown';

// Configure turndown for optimal markdown conversion
const turndownService = new TurndownService({
  headingStyle: 'atx', // Use # for headings
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  fence: '```',
  emDelimiter: '*',
  strongDelimiter: '**',
  linkStyle: 'inlined',
  linkReferenceStyle: 'full'
});

// Add custom rules for better conversion
turndownService.addRule('lineBreaks', {
  filter: 'br',
  replacement: function () {
    return '\n\n';
  }
});

turndownService.addRule('paragraphs', {
  filter: 'p',
  replacement: function (content: string) {
    return '\n\n' + content + '\n\n';
  }
});

turndownService.addRule('preserveTargetBlank', {
  filter: function (node: any) {
    return (
      node.nodeName === 'A' &&
      node.getAttribute('target') === '_blank'
    );
  },
  replacement: function (content: string, node: any) {
    const href = node.getAttribute('href');
    const rel = node.getAttribute('rel');
    if (rel && rel.includes('noopener') && rel.includes('noreferrer')) {
      return `[${content}](${href})`;
    }
    return `[${content}](${href})`;
  }
});

/**
 * Convert HTML content to markdown format
 * @param htmlContent - The HTML content to convert
 * @returns Cleaned markdown content
 */
export function htmlToMarkdown(htmlContent: string): string {
  if (!htmlContent || typeof htmlContent !== 'string') {
    return '';
  }

  // If content doesn't contain HTML tags, return as is
  if (!htmlContent.includes('<') || !htmlContent.includes('>')) {
    return htmlContent;
  }

  try {
    // Convert HTML to markdown
    let markdown = turndownService.turndown(htmlContent);
    
    // Clean up common issues
    markdown = markdown
      // Remove excessive line breaks (more than 2)
      .replace(/\n{3,}/g, '\n\n')
      // Fix heading spacing
      .replace(/^(#{1,6})\s*/gm, '$1 ')
      // Clean up list formatting
      .replace(/^\s*[-*+]\s+/gm, '- ')
      // Remove trailing whitespace
      .replace(/[ \t]+$/gm, '')
      // Ensure proper spacing around headings
      .replace(/\n(#{1,6}\s)/g, '\n\n$1')
      .replace(/(#{1,6}\s.*)\n/g, '$1\n\n')
      // Clean up blockquotes
      .replace(/^\s*>\s*/gm, '> ')
      // Fix code block formatting
      .replace(/```(\w+)?\n\n/g, '```$1\n')
      .replace(/\n\n```/g, '\n```')
      // Remove any remaining HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    // Trim and ensure content ends with single newline
    markdown = markdown.trim();
    
    return markdown;
  } catch (error) {
    console.error('Error converting HTML to markdown:', error);
    // Fallback: strip HTML tags manually
    return htmlContent.replace(/<[^>]*>/g, '').trim();
  }
}

/**
 * Check if content contains HTML tags
 * @param content - Content to check
 * @returns True if content contains HTML tags
 */
export function containsHtml(content: string): boolean {
  if (!content || typeof content !== 'string') {
    return false;
  }
  
  // Check for common HTML patterns
  const htmlPattern = /<\/?[a-z][\s\S]*>/i;
  return htmlPattern.test(content);
}

/**
 * Convert content to markdown if it contains HTML, otherwise return as is
 * @param content - Content to process
 * @returns Processed content
 */
export function ensureMarkdown(content: string): string {
  if (containsHtml(content)) {
    return htmlToMarkdown(content);
  }
  return content;
} 