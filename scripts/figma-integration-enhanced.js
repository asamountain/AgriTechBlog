#!/usr/bin/env node

import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class EnhancedFigmaIntegration {
  constructor() {
    this.config = null;
  }

  async init() {
    try {
      this.config = {
        accessToken: process.env.FIGMA_ACCESS_TOKEN,
        fileKey: process.env.FIGMA_FILE_KEY,
        outputDir: path.join(__dirname, '../client/src/styles'),
      };

      if (!this.config.accessToken || !this.config.fileKey) {
        console.log('🔧 Setting up Figma integration...');
        console.log('📝 Create a .env file with:');
        console.log('   FIGMA_ACCESS_TOKEN=your_token_here');
        console.log('   FIGMA_FILE_KEY=your_file_key_here');
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Figma API:', error.message);
      return false;
    }
  }

  async makeFigmaRequest(endpoint) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.figma.com',
        path: endpoint,
        method: 'GET',
        headers: {
          'X-Figma-Token': this.config.accessToken,
          'Accept': 'application/json'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              resolve(data);
            }
          } else {
            reject(new Error(`Request failed with status code ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.end();
    });
  }

  // Load existing CSS styles from index.css
  async loadExistingStyles() {
    try {
      const indexPath = path.join(__dirname, '../client/src/index.css');
      const cssContent = await fs.readFile(indexPath, 'utf-8');
      
      // Extract CSS custom properties from :root
      const rootMatch = cssContent.match(/:root\s*{([^}]+)}/);
      if (!rootMatch) return {};
      
      const rootContent = rootMatch[1];
      const properties = {};
      
      // Parse CSS custom properties
      const propRegex = /--([^:]+):\s*([^;]+);/g;
      let match;
      while ((match = propRegex.exec(rootContent)) !== null) {
        properties[match[1].trim()] = match[2].trim();
      }
      
      return properties;
    } catch (error) {
      console.log('⚠️  Could not load existing styles:', error.message);
      return {};
    }
  }

  async extractDesignTokens() {
    if (!this.config) {
      console.error('❌ Figma API not initialized');
      return;
    }

    try {
      console.log('🎨 Extracting design tokens from Figma...');
      
      // Load existing styles first
      console.log('📁 Loading existing CSS styles...');
      const existingStyles = await this.loadExistingStyles();
      console.log('✅ Loaded existing styles');
      
      // Test file access
      console.log('📁 Testing file access...');
      const file = await this.makeFigmaRequest(`/v1/files/${this.config.fileKey}`);
      console.log('✅ File access successful:', file.name);
      
      // Try to get styles, but don't fail if it doesn't work
      let styles = null;
      try {
        console.log('🎨 Fetching styles...');
        styles = await this.makeFigmaRequest(`/v1/files/${this.config.fileKey}/styles`);
        console.log('✅ Styles fetched successfully');
      } catch (stylesError) {
        console.log('⚠️  Styles not available:', stylesError.message);
        console.log('📝 Continuing with existing design system...');
      }

      // Extract design tokens
      const tokens = {
        colors: this.extractColors(file, styles, existingStyles),
        spacing: this.mergeSpacing(existingStyles),
        typography: this.mergeTypography(existingStyles),
        borderRadius: this.mergeBorderRadius(existingStyles),
        existing: existingStyles
      };

      await this.generateEnhancedCSSTokens(tokens);
      console.log('✅ Enhanced design tokens extracted successfully!');
      
    } catch (error) {
      console.error('❌ Failed to extract design tokens:', error.message);
    }
  }

  extractColors(file, styles, existingStyles) {
    // Start with existing colors
    const colors = {
      // Preserve existing forest green system
      'forest-green': existingStyles['forest-green'] || '#2D5016',
      'forest-green-hsl': existingStyles['forest-green-hsl'] || 'hsl(86, 69%, 20%)',
      
      // Preserve existing color system
      'background': existingStyles['background'] || 'hsl(0, 0%, 100%)',
      'foreground': existingStyles['foreground'] || 'hsl(143, 64%, 24%)',
      'muted': existingStyles['muted'] || 'hsl(120, 7%, 96%)',
      'muted-foreground': existingStyles['muted-foreground'] || 'hsl(143, 8%, 45%)',
      'popover': existingStyles['popover'] || 'hsl(0, 0%, 100%)',
      'popover-foreground': existingStyles['popover-foreground'] || 'hsl(143, 64%, 24%)',
      'card': existingStyles['card'] || 'hsl(0, 0%, 100%)',
      'card-foreground': existingStyles['card-foreground'] || 'hsl(143, 64%, 24%)',
      'border': existingStyles['border'] || 'hsl(120, 13%, 85%)',
      'input': existingStyles['input'] || 'hsl(120, 13%, 85%)',
      'primary': existingStyles['primary'] || 'hsl(158, 64%, 52%)',
      'primary-foreground': existingStyles['primary-foreground'] || 'hsl(0, 0%, 100%)',
      'secondary': existingStyles['secondary'] || 'hsl(120, 7%, 96%)',
      'secondary-foreground': existingStyles['secondary-foreground'] || 'hsl(143, 64%, 24%)',
      'accent': existingStyles['accent'] || 'hsl(120, 7%, 96%)',
      'accent-foreground': existingStyles['accent-foreground'] || 'hsl(143, 64%, 24%)',
      'destructive': existingStyles['destructive'] || 'hsl(0, 84%, 60%)',
      'destructive-foreground': existingStyles['destructive-foreground'] || 'hsl(0, 0%, 98%)',
      'ring': existingStyles['ring'] || 'hsl(143, 64%, 24%)',
    };

    // Extract additional colors from Figma while preserving existing system
    if (styles && styles.meta && styles.meta.styles) {
      Object.values(styles.meta.styles).forEach(style => {
        if (style.styleType === 'FILL') {
          colors[`figma-${style.name.toLowerCase().replace(/\s+/g, '-')}`] = 
            this.parseColorFromStyle(style);
        }
      });
    }

    // Also extract colors from the file document if styles aren't available
    if (file && file.document) {
      this.extractColorsFromDocument(file.document, colors);
    }

    return colors;
  }

  extractColorsFromDocument(document, colors) {
    // Recursively search for color fills in the document
    const searchForColors = (node) => {
      if (node.fills && Array.isArray(node.fills)) {
        node.fills.forEach(fill => {
          if (fill.type === 'SOLID' && fill.color) {
            const colorName = `figma-${node.name?.toLowerCase().replace(/\s+/g, '-') || 'color'}`;
            colors[colorName] = this.rgbToHex(fill.color.r, fill.color.g, fill.color.b);
          }
        });
      }
      
      if (node.children) {
        node.children.forEach(searchForColors);
      }
    };

    searchForColors(document);
  }

  mergeSpacing(existingStyles) {
    // Use existing spacing if available, otherwise generate golden ratio
    const base = 6;
    const ratio = 1.618;
    
    return {
      'xs': existingStyles['space-xs'] || `${base}px`,
      'sm': existingStyles['space-sm'] || `${Math.round(base * ratio)}px`,
      'md': existingStyles['space-md'] || `${Math.round(base * ratio * ratio)}px`,
      'lg': existingStyles['space-lg'] || `${Math.round(base * ratio * ratio * ratio)}px`,
      'xl': existingStyles['space-xl'] || `${Math.round(base * ratio * ratio * ratio * ratio)}px`,
      '2xl': existingStyles['space-2xl'] || `${Math.round(base * ratio * ratio * ratio * ratio * ratio)}px`,
    };
  }

  mergeTypography(existingStyles) {
    // Use existing typography if available, otherwise generate golden ratio
    const base = 16;
    const ratio = 1.618;
    
    return {
      'xs': existingStyles['text-xs'] || `${Math.round(base / ratio)}px`,
      'sm': existingStyles['text-sm'] || `${base}px`,
      'md': existingStyles['text-md'] || `${Math.round(base * ratio)}px`,
      'lg': existingStyles['text-lg'] || `${Math.round(base * ratio * ratio)}px`,
      'xl': existingStyles['text-xl'] || `${Math.round(base * ratio * ratio * ratio)}px`,
    };
  }

  mergeBorderRadius(existingStyles) {
    // Use existing border radius if available, otherwise generate golden ratio
    const base = 6;
    const ratio = 1.618;
    
    return {
      'sm': existingStyles['radius-sm'] || `${base}px`,
      'md': existingStyles['radius-md'] || `${Math.round(base * ratio)}px`,
      'lg': existingStyles['radius-lg'] || `${Math.round(base * ratio * ratio)}px`,
    };
  }

  rgbToHex(r, g, b) {
    const toHex = (c) => {
      const hex = Math.round(c * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  parseColorFromStyle(style) {
    // Basic color parsing - would need more sophisticated parsing in real implementation
    return '#000000'; // Placeholder
  }

  async generateEnhancedCSSTokens(tokens) {
    const cssContent = `/* Enhanced Figma Tokens - Merged with existing styles */
/* Generated: ${new Date().toISOString()} */
/* This file combines your existing CSS styles with Figma design tokens */

:root {
  /* ===== EXISTING COLOR SYSTEM (Preserved) ===== */
  --background: ${tokens.colors.background};
  --foreground: ${tokens.colors.foreground};
  --muted: ${tokens.colors.muted};
  --muted-foreground: ${tokens.colors['muted-foreground']};
  --popover: ${tokens.colors.popover};
  --popover-foreground: ${tokens.colors['popover-foreground']};
  --card: ${tokens.colors.card};
  --card-foreground: ${tokens.colors['card-foreground']};
  --border: ${tokens.colors.border};
  --input: ${tokens.colors.input};
  --primary: ${tokens.colors.primary};
  --primary-foreground: ${tokens.colors['primary-foreground']};
  --secondary: ${tokens.colors.secondary};
  --secondary-foreground: ${tokens.colors['secondary-foreground']};
  --accent: ${tokens.colors.accent};
  --accent-foreground: ${tokens.colors['accent-foreground']};
  --destructive: ${tokens.colors.destructive};
  --destructive-foreground: ${tokens.colors['destructive-foreground']};
  --ring: ${tokens.colors.ring};
  --radius: ${tokens.borderRadius.md};
  
  /* ===== FOREST GREEN SYSTEM (Preserved) ===== */
  --forest-green: ${tokens.colors['forest-green']};
  --forest-green-hsl: ${tokens.colors['forest-green-hsl']};
  
  /* ===== GOLDEN RATIO SPACING (Merged) ===== */
  --space-xs: ${tokens.spacing.xs};
  --space-sm: ${tokens.spacing.sm};
  --space-md: ${tokens.spacing.md};
  --space-lg: ${tokens.spacing.lg};
  --space-xl: ${tokens.spacing.xl};
  --space-2xl: ${tokens.spacing['2xl']};

  /* ===== GOLDEN RATIO TYPOGRAPHY (Merged) ===== */
  --text-xs: ${tokens.typography.xs};
  --text-sm: ${tokens.typography.sm};
  --text-md: ${tokens.typography.md};
  --text-lg: ${tokens.typography.lg};
  --text-xl: ${tokens.typography.xl};

  /* ===== GOLDEN RATIO BORDER RADIUS (Merged) ===== */
  --radius-sm: ${tokens.borderRadius.sm};
  --radius-md: ${tokens.borderRadius.md};
  --radius-lg: ${tokens.borderRadius.lg};

  /* ===== FIGMA COLORS (Additional) ===== */
${Object.entries(tokens.colors)
  .filter(([key]) => key.startsWith('figma-'))
  .map(([key, value]) => `  --color-${key}: ${value};`).join('\n')}
}

/* ===== DARK MODE (Preserved from existing styles) ===== */
.dark {
  --background: hsl(143, 32%, 8%);
  --foreground: hsl(0, 0%, 98%);
  --muted: hsl(143, 16%, 15%);
  --muted-foreground: hsl(143, 8%, 65%);
  --popover: hsl(143, 32%, 8%);
  --popover-foreground: hsl(0, 0%, 98%);
  --card: hsl(143, 32%, 8%);
  --card-foreground: hsl(0, 0%, 98%);
  --border: hsl(143, 16%, 15%);
  --input: hsl(143, 16%, 15%);
  --primary: hsl(158, 64%, 52%);
  --primary-foreground: hsl(143, 64%, 24%);
  --secondary: hsl(143, 16%, 15%);
  --secondary-foreground: hsl(0, 0%, 98%);
  --accent: hsl(143, 16%, 15%);
  --accent-foreground: hsl(0, 0%, 98%);
  --destructive: hsl(0, 63%, 31%);
  --destructive-foreground: hsl(0, 0%, 98%);
  --ring: hsl(158, 64%, 52%);
}

/* ===== UTILITY CLASSES (Preserved from existing styles) ===== */
@layer utilities {
  /* Forest Green Color Utilities */
  .text-forest-green { color: var(--forest-green); }
  .bg-forest-green { background-color: var(--forest-green); }
  .border-forest-green { border-color: var(--forest-green); }
  .hover\\:bg-forest-green:hover { background-color: var(--forest-green); }
  .hover\\:text-forest-green:hover { color: var(--forest-green); }
  
  /* Golden Ratio Spacing Utilities */
  .p-golden-xs { padding: var(--space-xs); }
  .p-golden-sm { padding: var(--space-sm); }
  .p-golden-md { padding: var(--space-md); }
  .p-golden-lg { padding: var(--space-lg); }
  .p-golden-xl { padding: var(--space-xl); }
  
  .m-golden-xs { margin: var(--space-xs); }
  .m-golden-sm { margin: var(--space-sm); }
  .m-golden-md { margin: var(--space-md); }
  .m-golden-lg { margin: var(--space-lg); }
  .m-golden-xl { margin: var(--space-xl); }
  
  .gap-golden-xs { gap: var(--space-xs); }
  .gap-golden-sm { gap: var(--space-sm); }
  .gap-golden-md { gap: var(--space-md); }
  .gap-golden-lg { gap: var(--space-lg); }
  
  /* Golden Ratio Border Radius */
  .rounded-golden-sm { border-radius: var(--radius-sm); }
  .rounded-golden-md { border-radius: var(--radius-md); }
  .rounded-golden-lg { border-radius: var(--radius-lg); }
}

/* ===== BLOG CONTENT STYLING (Preserved) ===== */
.blog-content h1,
.blog-content h2,
.blog-content h3,
.blog-content h4,
.blog-content h5,
.blog-content h6 {
  scroll-margin-top: 140px;
  color: var(--forest-green);
  font-weight: 600;
  margin-top: 2rem;
  margin-bottom: 1rem;
  line-height: 1.3;
}

.blog-content h1 {
  font-size: 2.25rem;
  margin-top: 3rem;
  margin-bottom: 1.5rem;
}

.blog-content h2 {
  font-size: 1.875rem;
  margin-top: 2.5rem;
  margin-bottom: 1.25rem;
}

.blog-content h3 {
  font-size: 1.5rem;
  margin-top: 2rem;
  margin-bottom: 1rem;
}

.blog-content h4 {
  font-size: 1.25rem;
  margin-top: 1.75rem;
  margin-bottom: 0.875rem;
}

.blog-content h5 {
  font-size: 1.125rem;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
}

.blog-content h6 {
  font-size: 1rem;
  margin-top: 1.25rem;
  margin-bottom: 0.625rem;
}

.blog-content p {
  margin-bottom: 1.5rem;
  line-height: 1.7;
}

.blog-content ul,
.blog-content ol {
  margin-bottom: 1.5rem;
  padding-left: 2rem;
}

.blog-content li {
  margin-bottom: 0.5rem;
}

.blog-content blockquote {
  border-left: 4px solid var(--forest-green);
  padding-left: 1.5rem;
  margin: 2rem 0;
  font-style: italic;
  color: #6b7280;
}

.blog-content code {
  background-color: #f3f4f6;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
  color: var(--forest-green);
}

.blog-content pre {
  background-color: #f9fafb;
  padding: 1.5rem;
  border-radius: 8px;
  overflow-x: auto;
  margin: 2rem 0;
  border: 1px solid #e5e7eb;
}

.blog-content img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 2rem 0;
}

/* ===== ANIMATIONS (Preserved) ===== */
@keyframes bounce {
  0%, 20%, 53%, 80%, 100% {
    transform: translate3d(0,0,0);
  }
  40%, 43% {
    transform: translate3d(0,-30px,0);
  }
  70% {
    transform: translate3d(0,-15px,0);
  }
  90% {
    transform: translate3d(0,-4px,0);
  }
}

.animate-bounce {
  animation: bounce 2s infinite;
}

.font-playfair {
  font-family: 'Playfair Display', serif;
}

/* ===== SMOOTH TRANSITIONS ===== */
* {
  transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}
`;

    await fs.mkdir(this.config.outputDir, { recursive: true });
    await fs.writeFile(
      path.join(this.config.outputDir, 'figma-tokens-enhanced.css'),
      cssContent
    );
  }

  async generateComponentSpecs() {
    console.log('📋 Generating component specifications...');
    
    const componentSpecs = {
      button: {
        figmaLink: `https://www.figma.com/file/${this.config.fileKey}`,
        cssProperties: [
          'background-color: var(--forest-green)',
          'color: white',
          'padding: var(--space-sm) var(--space-md)',
          'border-radius: var(--radius-md)',
          'font-size: var(--text-sm)'
        ],
        states: ['default', 'hover', 'active', 'disabled']
      },
      card: {
        figmaLink: `https://www.figma.com/file/${this.config.fileKey}`,
        cssProperties: [
          'background: var(--card)',
          'border: 1px solid var(--border)',
          'border-radius: var(--radius-lg)',
          'padding: var(--space-lg)',
          'box-shadow: 0 2px 4px rgba(0,0,0,0.1)'
        ]
      }
    };

    await fs.writeFile(
      path.join(this.config.outputDir, 'component-specs-enhanced.json'),
      JSON.stringify(componentSpecs, null, 2)
    );

    console.log('✅ Enhanced component specifications generated!');
  }
}

// CLI interface
const command = process.argv[2];
const figma = new EnhancedFigmaIntegration();

async function main() {
  const initialized = await figma.init();
  
  if (!initialized) {
    process.exit(1);
  }

  switch (command) {
    case 'sync':
      await figma.extractDesignTokens();
      await figma.generateComponentSpecs();
      break;
    case 'init':
      console.log('✅ Enhanced Figma integration initialized!');
      break;
    default:
      console.log('Enhanced Figma Integration Commands:');
      console.log('  node scripts/figma-integration-enhanced.js sync   - Extract and merge design tokens');
      console.log('  node scripts/figma-integration-enhanced.js init   - Initialize configuration');
  }
}

main().catch(console.error); 