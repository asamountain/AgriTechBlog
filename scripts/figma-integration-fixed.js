#!/usr/bin/env node

import 'dotenv/config';
import { Api } from 'figma-api';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class FigmaIntegration {
  constructor() {
    this.api = null;
    this.config = null;
  }

  async init() {
    try {
      this.config = {
        accessToken: process.env.FIGMA_ACCESS_TOKEN,
        fileKey: process.env.FIGMA_FILE_KEY,
        outputDir: path.join(__dirname, '../client/src/styles'),
      };

      if (!this.config.accessToken) {
        console.log('🔧 Setting up Figma integration...');
        console.log('📝 Create a .env file with:');
        console.log('   FIGMA_ACCESS_TOKEN=your_token_here');
        console.log('   FIGMA_FILE_KEY=your_file_key_here');
        return false;
      }

      this.api = new Api({ personalAccessToken: this.config.accessToken });
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Figma API:', error.message);
      return false;
    }
  }

  async extractDesignTokens() {
    if (!this.api || !this.config.fileKey) {
      console.error('❌ Figma API not initialized');
      return;
    }

    try {
      console.log('🎨 Extracting design tokens from Figma...');
      
      // Test file access first
      console.log('📁 Testing file access...');
      const file = await this.api.getFile(this.config.fileKey);
      console.log('✅ File access successful:', file.name);
      
      // Try to get styles, but don't fail if it doesn't work
      let styles = null;
      try {
        console.log('🎨 Fetching styles...');
        styles = await this.api.getFileStyles(this.config.fileKey);
        console.log('✅ Styles fetched successfully');
      } catch (stylesError) {
        console.log('⚠️  Styles not available:', stylesError.message);
        console.log('📝 Continuing with default design system...');
      }

      // Extract design tokens
      const tokens = {
        colors: this.extractColors(file, styles),
        spacing: this.generateGoldenRatioSpacing(),
        typography: this.extractTypography(file, styles),
        borderRadius: this.generateGoldenRatioBorderRadius(),
      };

      await this.generateCSSTokens(tokens);
      console.log('✅ Design tokens extracted successfully!');
      
    } catch (error) {
      console.error('❌ Failed to extract design tokens:', error.message);
      console.error('🔍 Error details:', error);
    }
  }

  extractColors(file, styles) {
    // Preserve your forest green primary color system
    const colors = {
      primary: '#2D5016', // Forest Green (preserved)
      'primary-light': '#3A6B1D',
      'primary-dark': '#1F380F',
    };

    // Extract additional colors from Figma while preserving your system
    if (styles && styles.meta && styles.meta.styles) {
      Object.values(styles.meta.styles).forEach(style => {
        if (style.style_type === 'FILL') {
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

  rgbToHex(r, g, b) {
    const toHex = (c) => {
      const hex = Math.round(c * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  generateGoldenRatioSpacing() {
    const base = 6;
    const ratio = 1.618;
    
    return {
      'xs': `${base}px`,
      'sm': `${Math.round(base * ratio)}px`,
      'md': `${Math.round(base * ratio * ratio)}px`,
      'lg': `${Math.round(base * ratio * ratio * ratio)}px`,
      'xl': `${Math.round(base * ratio * ratio * ratio * ratio)}px`,
      '2xl': `${Math.round(base * ratio * ratio * ratio * ratio * ratio)}px`,
    };
  }

  generateGoldenRatioBorderRadius() {
    const base = 6;
    const ratio = 1.618;
    
    return {
      'sm': `${base}px`,
      'md': `${Math.round(base * ratio)}px`,
      'lg': `${Math.round(base * ratio * ratio)}px`,
    };
  }

  extractTypography(file, styles) {
    const base = 16;
    const ratio = 1.618;
    
    return {
      'xs': `${Math.round(base / ratio)}px`,
      'sm': `${base}px`,
      'md': `${Math.round(base * ratio)}px`,
      'lg': `${Math.round(base * ratio * ratio)}px`,
      'xl': `${Math.round(base * ratio * ratio * ratio)}px`,
    };
  }

  parseColorFromStyle(style) {
    // Basic color parsing - would need more sophisticated parsing in real implementation
    return '#000000'; // Placeholder
  }

  async generateCSSTokens(tokens) {
    const cssContent = `/* Auto-generated from Figma - DO NOT EDIT MANUALLY */
/* Figma Integration: ${new Date().toISOString()} */

:root {
  /* Primary Colors (Forest Green System - Preserved) */
  --color-primary: ${tokens.colors.primary};
  --color-primary-light: ${tokens.colors['primary-light']};
  --color-primary-dark: ${tokens.colors['primary-dark']};
  
  /* Golden Ratio Spacing (Preserved) */
${Object.entries(tokens.spacing).map(([key, value]) => 
  `  --space-${key}: ${value};`).join('\n')}

  /* Golden Ratio Typography (Preserved) */
${Object.entries(tokens.typography).map(([key, value]) => 
  `  --text-${key}: ${value};`).join('\n')}

  /* Golden Ratio Border Radius (Preserved) */
${Object.entries(tokens.borderRadius).map(([key, value]) => 
  `  --radius-${key}: ${value};`).join('\n')}

  /* Additional Figma Colors */
${Object.entries(tokens.colors)
  .filter(([key]) => key.startsWith('figma-'))
  .map(([key, value]) => `  --color-${key}: ${value};`).join('\n')}
}
`;

    await fs.mkdir(this.config.outputDir, { recursive: true });
    await fs.writeFile(
      path.join(this.config.outputDir, 'figma-tokens.css'),
      cssContent
    );
  }

  async generateComponentSpecs() {
    console.log('📋 Generating component specifications...');
    
    const componentSpecs = {
      button: {
        figmaLink: `https://www.figma.com/file/${this.config.fileKey}`,
        cssProperties: [
          'background-color: var(--color-primary)',
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
          'background: white',
          'border: 1px solid var(--color-border)',
          'border-radius: var(--radius-lg)',
          'padding: var(--space-lg)',
          'box-shadow: 0 2px 4px rgba(0,0,0,0.1)'
        ]
      }
    };

    await fs.writeFile(
      path.join(this.config.outputDir, 'component-specs.json'),
      JSON.stringify(componentSpecs, null, 2)
    );

    console.log('✅ Component specifications generated!');
  }
}

// CLI interface
const command = process.argv[2];
const figma = new FigmaIntegration();

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
      console.log('✅ Figma integration initialized!');
      break;
    default:
      console.log('Figma Integration Commands:');
      console.log('  node scripts/figma-integration-fixed.js sync   - Extract design tokens once');
      console.log('  node scripts/figma-integration-fixed.js init   - Initialize configuration');
  }
}

main().catch(console.error); 