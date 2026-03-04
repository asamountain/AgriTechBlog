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
      // Load config from environment or config file
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
        console.log('');
        console.log('📍 Get your token: https://www.figma.com/developers/api#access-tokens');
        console.log('📍 Get file key from your Figma URL: figma.com/file/{FILE_KEY}/...');
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
      
      const file = await this.api.getFile(this.config.fileKey);
      const styles = await this.api.getFileStyles(this.config.fileKey);

      // Extract design tokens that match your golden ratio system
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
          // Add as secondary colors, not overriding primary system
          colors[`figma-${style.name.toLowerCase().replace(/\s+/g, '-')}`] = 
            this.parseColorFromStyle(style);
        }
      });
    }

    return colors;
  }

  generateGoldenRatioSpacing() {
    // Maintain your existing golden ratio spacing system
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
    // Maintain your existing golden ratio border radius system
    const base = 6;
    const ratio = 1.618;
    
    return {
      'sm': `${base}px`,
      'md': `${Math.round(base * ratio)}px`,
      'lg': `${Math.round(base * ratio * ratio)}px`,
    };
  }

  extractTypography(file, styles) {
    // Maintain your golden ratio typography while adding Figma fonts
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

  async startWatchMode() {
    console.log('👀 Starting Figma watch mode...');
    console.log('🔄 Checking for updates every 30 seconds...');
    
    setInterval(async () => {
      await this.extractDesignTokens();
      console.log('🔄 Synced at', new Date().toLocaleTimeString());
    }, 30000);
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
    case 'watch':
      await figma.startWatchMode();
      break;
    case 'init':
      console.log('✅ Figma integration initialized!');
      break;
    default:
      console.log('Figma Integration Commands:');
      console.log('  bun run figma:sync   - Extract design tokens once');
      console.log('  bun run figma:watch  - Watch for changes');
      console.log('  bun run figma:init   - Initialize configuration');
  }
}

main().catch(console.error); 