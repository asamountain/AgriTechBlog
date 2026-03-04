#!/usr/bin/env tsx
/**
 * Find unused exports in the codebase
 *
 * This script scans all TypeScript files for exported functions/components
 * and checks if they're imported anywhere else in the codebase.
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative, dirname } from 'path';
import { fileURLToPath } from 'url';

interface ExportInfo {
  file: string;
  name: string;
  type: 'function' | 'const' | 'class' | 'interface' | 'type';
  line: number;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');
const IGNORE_DIRS = ['node_modules', 'dist', '.git', 'coverage'];
const IGNORE_FILES = ['vite-env.d.ts', '.d.ts'];

/**
 * Recursively get all TypeScript files
 */
function getAllTsFiles(dir: string): string[] {
  const files: string[] = [];

  try {
    const items = readdirSync(dir);

    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        if (!IGNORE_DIRS.includes(item)) {
          files.push(...getAllTsFiles(fullPath));
        }
      } else if (item.match(/\.(ts|tsx)$/) && !IGNORE_FILES.some(ignore => item.includes(ignore))) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
  }

  return files;
}

/**
 * Extract exported names from a file
 */
function extractExports(filePath: string): ExportInfo[] {
  const content = readFileSync(filePath, 'utf-8');
  const exports: ExportInfo[] = [];
  const lines = content.split('\n');

  // Patterns to match various export syntaxes
  const patterns = [
    /export\s+(?:async\s+)?function\s+(\w+)/g,  // export function foo()
    /export\s+const\s+(\w+)/g,                  // export const foo
    /export\s+class\s+(\w+)/g,                  // export class Foo
    /export\s+interface\s+(\w+)/g,              // export interface Foo
    /export\s+type\s+(\w+)/g,                   // export type Foo
    /export\s+{\s*([^}]+)\s*}/g,                // export { foo, bar }
  ];

  lines.forEach((line, index) => {
    // Skip default exports as they're always used
    if (line.includes('export default')) {
      return;
    }

    for (const pattern of patterns) {
      const matches = [...line.matchAll(pattern)];
      for (const match of matches) {
        let names = [match[1]];

        // Handle export { foo, bar } syntax
        if (match[0].includes('{')) {
          names = match[1].split(',').map(n => n.trim().split(/\s+as\s+/)[0]);
        }

        for (const name of names) {
          if (name && !name.includes('*')) {
            const type = line.includes('function') ? 'function' :
                        line.includes('class') ? 'class' :
                        line.includes('interface') ? 'interface' :
                        line.includes('type') ? 'type' : 'const';

            exports.push({
              file: relative(ROOT_DIR, filePath),
              name,
              type,
              line: index + 1
            });
          }
        }
      }
    }
  });

  return exports;
}

/**
 * Check if an export is used in any other file
 */
function isExportUsed(exportName: string, exportFile: string, allFiles: string[]): boolean {
  for (const file of allFiles) {
    // Skip the file where it's exported
    if (file === exportFile) continue;

    try {
      const content = readFileSync(file, 'utf-8');

      // Check for imports
      const importPatterns = [
        new RegExp(`import\\s+{[^}]*\\b${exportName}\\b[^}]*}\\s+from`, 'g'),  // Named import
        new RegExp(`import\\s+${exportName}\\s+from`, 'g'),                     // Default import (unlikely but check)
        new RegExp(`\\bimport\\([^)]*\\).*\\b${exportName}\\b`, 'g'),          // Dynamic import
      ];

      // Check for usage (as a component, function call, etc.)
      const usagePatterns = [
        new RegExp(`<${exportName}[\\s/>]`, 'g'),                              // React component usage
        new RegExp(`\\b${exportName}\\(`, 'g'),                                // Function call
        new RegExp(`\\b${exportName}\\b(?!:)`, 'g'),                           // General usage (not in object literal)
      ];

      const hasImport = importPatterns.some(pattern => pattern.test(content));
      const hasUsage = usagePatterns.some(pattern => pattern.test(content));

      if (hasImport || hasUsage) {
        return true;
      }
    } catch (error) {
      // Skip files that can't be read
    }
  }

  return false;
}

/**
 * Main function
 */
async function main() {
  console.log('🔍 Scanning for unused exports...\n');

  // Get all TypeScript files
  const clientFiles = getAllTsFiles(join(ROOT_DIR, 'client', 'src'));
  const serverFiles = getAllTsFiles(join(ROOT_DIR, 'server'));
  const apiFiles = getAllTsFiles(join(ROOT_DIR, 'api'));
  const allFiles = [...clientFiles, ...serverFiles, ...apiFiles];

  console.log(`📁 Found ${allFiles.length} TypeScript files\n`);

  // Extract all exports
  const allExports: ExportInfo[] = [];
  for (const file of allFiles) {
    const exports = extractExports(file);
    allExports.push(...exports);
  }

  console.log(`📦 Found ${allExports.length} total exports\n`);

  // Check which exports are unused
  const unusedExports: ExportInfo[] = [];
  let checkedCount = 0;

  for (const exp of allExports) {
    checkedCount++;
    if (checkedCount % 50 === 0) {
      console.log(`⏳ Checked ${checkedCount}/${allExports.length} exports...`);
    }

    const fullPath = join(ROOT_DIR, exp.file);
    const isUsed = isExportUsed(exp.name, fullPath, allFiles);

    if (!isUsed) {
      unusedExports.push(exp);
    }
  }

  console.log('\n' + '='.repeat(80) + '\n');

  if (unusedExports.length === 0) {
    console.log('✅ No unused exports found! Your codebase is clean.\n');
    return;
  }

  console.log(`⚠️  Found ${unusedExports.length} potentially unused exports:\n`);

  // Group by file
  const byFile = new Map<string, ExportInfo[]>();
  for (const exp of unusedExports) {
    if (!byFile.has(exp.file)) {
      byFile.set(exp.file, []);
    }
    byFile.get(exp.file)!.push(exp);
  }

  // Print results grouped by file
  for (const [file, exports] of byFile) {
    console.log(`\n📄 ${file}`);
    for (const exp of exports) {
      console.log(`   • ${exp.type} ${exp.name} (line ${exp.line})`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n⚠️  IMPORTANT: Please manually verify these results!');
  console.log('   - Some exports may be used in ways this script cannot detect');
  console.log('   - Check if exports are used in HTML templates, tests, or config files');
  console.log('   - External packages or dynamic imports may not be detected\n');
}

main().catch(console.error);
