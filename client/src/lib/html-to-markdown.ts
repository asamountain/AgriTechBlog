import TurndownService from 'turndown';

// Lazy-loaded turndown service
let _turndownService: TurndownService | null = null;
let _isInitialized = false;

function getTurndownService(): TurndownService {
  // Only initialize if not already done and if we're in a browser environment
  if (!_turndownService && typeof window !== 'undefined' && !_isInitialized) {
    _isInitialized = true;
    _turndownService = new TurndownService({
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
    _turndownService.addRule('lineBreaks', {
      filter: 'br',
      replacement: function () {
        return '\n\n';
      }
    });

    _turndownService.addRule('paragraphs', {
      filter: 'p',
      replacement: function (content: string) {
        return '\n\n' + content + '\n\n';
      }
    });

    _turndownService.addRule('preserveTargetBlank', {
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
  }
  return _turndownService!;
}

/**
 * Comprehensive HTML tag removal with entity decoding
 * @param content - Content that may contain HTML
 * @returns Plain text content
 */
function stripHtmlTags(content: string): string {
  if (!content || typeof content !== 'string') {
    return '';
  }

  let text = content;
  
  // Remove script and style elements completely
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  
  // Remove all HTML tags but preserve spacing
  text = text.replace(/<[^>]*>/g, ' ');
  
  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&apos;/g, "'");
  
  // Remove other HTML entities
  text = text.replace(/&[#\w]+;/g, '');
  
  return text;
}

/**
 * Convert HTML content to markdown format
 * @param htmlContent - The HTML content to convert
 * @returns Markdown formatted content
 */
export function htmlToMarkdown(htmlContent: string): string {
  if (!htmlContent || typeof htmlContent !== 'string') {
    return '';
  }

  try {
    // Clean up common HTML issues before conversion
    let cleanHtml = htmlContent
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<p[^>]*>/gi, '\n\n')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();

    // Convert to markdown - only instantiate when actually needed
    const turndownService = getTurndownService();
    const markdown = turndownService.turndown(cleanHtml);
    
    // Clean up excessive whitespace
    return markdown
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .trim();
  } catch (error) {
    console.warn('HTML to markdown conversion failed:', error);
    // Fallback to simple HTML tag removal
    return stripHtmlTags(htmlContent);
  }
}

/**
 * Enhanced markdown to text conversion with HTML handling
 * @param markdownContent - The markdown content to convert
 * @returns Plain text content
 */
export function markdownToText(markdownContent: string): string {
  if (!markdownContent || typeof markdownContent !== 'string') {
    return '';
  }

  let text = markdownContent;
  
  // First, strip any HTML tags that might be mixed in
  text = stripHtmlTags(text);
  
  // Remove markdown headers (# ## ### etc.)
  text = text.replace(/^#{1,6}\s+/gm, '');
  
  // Remove bold and italic formatting
  text = text.replace(/\*\*\*([^*]+)\*\*\*/g, '$1'); // bold italic
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1'); // bold
  text = text.replace(/\*([^*]+)\*/g, '$1'); // italic
  text = text.replace(/___([^_]+)___/g, '$1'); // bold italic underscore
  text = text.replace(/__([^_]+)__/g, '$1'); // bold underscore
  text = text.replace(/_([^_]+)_/g, '$1'); // italic underscore
  
  // Remove strikethrough
  text = text.replace(/~~([^~]+)~~/g, '$1');
  
  // Remove links but keep text [text](url) -> text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  
  // Remove inline code
  text = text.replace(/`([^`]+)`/g, '$1');
  
  // Remove code blocks
  text = text.replace(/```[\s\S]*?```/g, '');
  text = text.replace(/~~~[\s\S]*?~~~/g, '');
  
  // Remove blockquotes
  text = text.replace(/^>\s+/gm, '');
  
  // Remove horizontal rules
  text = text.replace(/^[-*_]{3,}\s*$/gm, '');
  
  // Remove list markers
  text = text.replace(/^[-*+]\s+/gm, '');
  text = text.replace(/^\d+\.\s+/gm, '');
  
  // Remove table formatting
  text = text.replace(/\|/g, ' ');
  text = text.replace(/^[-:|\s]+$/gm, '');
  
  // Remove excessive whitespace and normalize line breaks
  text = text.replace(/\n\s*\n/g, '\n\n');
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.replace(/[ \t]+/g, ' ');
  
  // Clean up and trim
  return text.trim();
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

/**
 * Generate a clean plain text excerpt from any content type (HTML, Markdown, or plain text)
 * @param content - The content to extract excerpt from
 * @param maxLength - Maximum length of the excerpt (default: 150)
 * @returns Clean plain text excerpt
 */
export function generateCleanExcerpt(content: string, maxLength: number = 150): string {
  if (!content || typeof content !== 'string') {
    return '';
  }
  
  // Convert to plain text (handles both HTML and markdown)
  let plainText = markdownToText(content);
  
  // Additional cleanup for any remaining artifacts
  plainText = plainText
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s.,!?;:()\-'"]/g, '')
    .trim();
  
  // Truncate to desired length
  if (plainText.length <= maxLength) {
    return plainText;
  }
  
  // Find the last space before the limit to avoid cutting words
  const truncated = plainText.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.8) { // Only use last space if it's not too far back
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
}

/**
 * Sanitize content for safe storage - removes HTML but preserves markdown
 * @param content - Raw content that may contain HTML
 * @returns Sanitized content
 */
export function sanitizeContent(content: string): string {
  if (!content || typeof content !== 'string') {
    return '';
  }
  
  // If it contains HTML, convert to markdown first
  if (containsHtml(content)) {
    return htmlToMarkdown(content);
  }
  
  return content;
} 