import TurndownService from 'turndown';

// Lazy-loaded turndown service
let _turndownService: TurndownService | null = null;
let _isInitialized = false;

function getTurndownService(): TurndownService {
  // Only initialize if not already done and if we're in a browser environment
  if (!_turndownService && typeof window !== 'undefined' && !_isInitialized) {
    _isInitialized = true;
    
    try {
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

      // Disable escaping to prevent "##" from becoming "\#\#"
      // This is crucial when the source HTML contains already-formatted Markdown
      _turndownService.escape = (text: string) => text;

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
    } catch (error) {
      console.warn('TurndownService initialization failed:', error);
      // Return a minimal fallback service
      _turndownService = {
        turndown: (html: string) => {
          // Simple HTML tag removal as fallback
          return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        }
      } as TurndownService;
    }
  }
  
  // Return a safe fallback if still not available
  if (!_turndownService) {
    return {
      turndown: (html: string) => {
        return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      }
    } as TurndownService;
  }
  
  return _turndownService;
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
 * Clean up markdown syntax to ensure block-level elements (headers, rules)
 * are correctly separated from surrounding text, preventing them from "trapping" 
 * the entire content.
 * 
 * @param markdown - The raw markdown string to clean
 * @returns Cleaned markdown string
 */
export function cleanMarkdownSyntax(markdown: string): string {
  if (!markdown || typeof markdown !== 'string') return '';
  
  return markdown
    .replace(/([^\n])\s*(#{1,6}\s+)/g, '$1\n\n$2') // Ensure newlines before headers
    .replace(/([^\n])\s*(\* \* \*|\*\*\*|---)\s*/g, '$1\n\n$2\n\n') // Ensure newlines around rules
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
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
    
    // Use the enhanced cleaning logic
    return cleanMarkdownSyntax(markdown);
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
 * Simple markdown to HTML conversion for preview purposes
 * @param markdownContent - The markdown content to convert
 * @returns HTML string
 */
export function markdownToHtml(markdownContent: string): string {
  if (!markdownContent || typeof markdownContent !== 'string') {
    return '';
  }

  let html = markdownContent;

  // Code blocks (fenced) - must be before inline code
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>');

  // Headers
  html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
  html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
  html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Strikethrough
  html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>');

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Blockquotes
  html = html.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>');

  // Unordered lists
  html = html.replace(/^[-*+]\s+(.+)$/gm, '<li>$1</li>');

  // Ordered lists
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');

  // Horizontal rules
  html = html.replace(/^[-*_]{3,}\s*$/gm, '<hr />');

  // Paragraphs - wrap remaining loose lines
  html = html.replace(/^(?!<[a-z])((?!^\s*$).+)$/gm, '<p>$1</p>');

  // Clean up extra newlines
  html = html.replace(/\n{2,}/g, '\n');

  return html.trim();
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