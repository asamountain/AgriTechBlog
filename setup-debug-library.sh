#!/bin/bash

# Setup Debug Library as Independent Repository
# This script extracts the debug library and sets it up as a git submodule

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[SETUP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
DEBUG_LIB_NAME="agritech-debug-tracker"
DEBUG_LIB_DIR="../${DEBUG_LIB_NAME}"
GITHUB_USERNAME="your-username"  # Change this to your GitHub username

print_status "Setting up independent debug library repository..."

# Step 1: Create the independent debug library directory
if [ -d "$DEBUG_LIB_DIR" ]; then
    print_warning "Debug library directory already exists. Removing..."
    rm -rf "$DEBUG_LIB_DIR"
fi

mkdir -p "$DEBUG_LIB_DIR"
cd "$DEBUG_LIB_DIR"

print_status "Creating debug library structure..."

# Step 2: Initialize git repository
git init
git branch -M main

# Step 3: Create package.json for the debug library
cat > package.json << 'EOF'
{
  "name": "@agritech/debug-tracker",
  "version": "1.0.0",
  "description": "Advanced debug tracking library for React applications",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "module": "dist/index.esm.js",
  "files": [
    "dist",
    "src"
  ],
  "scripts": {
    "build": "rollup -c",
    "dev": "rollup -c -w",
    "test": "jest",
    "lint": "eslint src --ext .ts,.tsx",
    "typecheck": "tsc --noEmit",
    "prepublishOnly": "npm run build"
  },
  "keywords": [
    "debug",
    "tracking",
    "react",
    "development",
    "analytics"
  ],
  "author": "AgriTech Team",
  "license": "MIT",
  "devDependencies": {
    "@rollup/plugin-commonjs": "^25.0.7",
    "@rollup/plugin-node-resolve": "^15.2.3",
    "@rollup/plugin-typescript": "^11.1.5",
    "@types/jest": "^29.5.8",
    "@typescript-eslint/eslint-plugin": "^6.12.0",
    "@typescript-eslint/parser": "^6.12.0",
    "eslint": "^8.54.0",
    "jest": "^29.7.0",
    "rollup": "^4.6.1",
    "rollup-plugin-dts": "^6.1.0",
    "typescript": "^5.2.2"
  },
  "peerDependencies": {
    "react": ">=16.8.0"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/${GITHUB_USERNAME}/${DEBUG_LIB_NAME}.git"
  },
  "bugs": {
    "url": "https://github.com/${GITHUB_USERNAME}/${DEBUG_LIB_NAME}/issues"
  },
  "homepage": "https://github.com/${GITHUB_USERNAME}/${DEBUG_LIB_NAME}#readme"
}
EOF

# Step 4: Create TypeScript config
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2018",
    "lib": ["DOM", "DOM.Iterable", "ES6"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": false,
    "jsx": "react-jsx",
    "declaration": true,
    "declarationMap": true,
    "outDir": "dist",
    "module": "ESNext"
  },
  "include": [
    "src"
  ],
  "exclude": [
    "node_modules",
    "dist"
  ]
}
EOF

# Step 5: Create Rollup config
cat > rollup.config.js << 'EOF'
import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import dts from 'rollup-plugin-dts';

const external = ['react', 'react-dom'];

export default [
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.js',
        format: 'cjs',
        sourcemap: true,
      },
      {
        file: 'dist/index.esm.js',
        format: 'esm',
        sourcemap: true,
      },
    ],
    external,
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
      }),
    ],
  },
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'es',
    },
    external,
    plugins: [dts()],
  },
];
EOF

# Step 6: Create src directory and copy debug files
mkdir -p src

print_status "Copying debug tracker files..."

# Go back to original project to copy files
cd - > /dev/null

# Copy the debug tracker
cp client/src/lib/debug-tracker.ts "$DEBUG_LIB_DIR/src/debug-tracker.ts"
cp client/src/lib/crash-detector.ts "$DEBUG_LIB_DIR/src/crash-detector.ts"
cp client/src/lib/flow-diagram.ts "$DEBUG_LIB_DIR/src/flow-diagram.ts"

# Copy the debug visualizer component
cp client/src/components/debug-flow-visualizer.tsx "$DEBUG_LIB_DIR/src/debug-flow-visualizer.tsx"

cd "$DEBUG_LIB_DIR"

# Step 7: Create main index file
cat > src/index.ts << 'EOF'
// Main exports for the debug library
export { default as DebugTracker } from './debug-tracker';
export { default as CrashDetector } from './crash-detector';
export { default as FlowDiagram } from './flow-diagram';
export { default as DebugFlowVisualizer } from './debug-flow-visualizer';

// Export types
export type {
  DebugEvent,
} from './debug-tracker';

// Export utility functions
export {
  initializeDebugSystem,
  getGlobalDebugTracker,
} from './utils';
EOF

# Step 8: Create utilities file
cat > src/utils.ts << 'EOF'
import DebugTracker from './debug-tracker';

let globalDebugTracker: DebugTracker | null = null;

export function initializeDebugSystem(): DebugTracker {
  if (!globalDebugTracker) {
    globalDebugTracker = new DebugTracker();
    globalDebugTracker.start();
  }
  return globalDebugTracker;
}

export function getGlobalDebugTracker(): DebugTracker | null {
  return globalDebugTracker;
}
EOF

# Step 9: Create README
cat > README.md << 'EOF'
# AgriTech Debug Tracker

Advanced debug tracking library for React applications with comprehensive event monitoring, performance analysis, and visual debugging tools.

## Features

- 🔍 **Event Tracking**: Capture clicks, API calls, navigation, form submissions, and more
- 📊 **Performance Monitoring**: Track API response times, page load metrics, and rendering performance
- 🐛 **Error Detection**: Automatic error tracking with stack traces and context
- 📱 **Console Interception**: Capture all console logs, warnings, and errors
- 🎯 **API Route Analysis**: Detect and diagnose API endpoint mismatches
- 📈 **Visual Debugging**: Real-time debug flow visualizer for development
- 💾 **Session Management**: Persistent debug sessions with export capabilities

## Installation

```bash
npm install @agritech/debug-tracker
```

## Quick Start

```typescript
import { initializeDebugSystem, DebugFlowVisualizer } from '@agritech/debug-tracker';

// Initialize the debug system
const debugTracker = initializeDebugSystem();

// In your React app (for development only)
function App() {
  const isAdminPage = location.pathname.includes('/admin');
  
  return (
    <div>
      {/* Your app content */}
      
      {/* Debug visualizer (admin pages only) */}
      {process.env.NODE_ENV === 'development' && isAdminPage && (
        <DebugFlowVisualizer />
      )}
    </div>
  );
}
```

## API Reference

### DebugTracker

```typescript
// Track custom events
debugTracker.trackEvent('custom_action', { data: 'value' });

// Get recent events
const events = debugTracker.getRecentEvents(50);

// Export session data
const sessionData = debugTracker.exportSession();

// Get performance metrics
const metrics = debugTracker.getPerformanceMetrics();
```

### Components

- `DebugFlowVisualizer`: Visual debugging interface
- `CrashDetector`: Automatic crash detection and reporting
- `FlowDiagram`: Visual flow diagram generator

## Development

```bash
# Install dependencies
npm install

# Start development build
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## License

MIT
EOF

# Step 10: Create .gitignore
cat > .gitignore << 'EOF'
node_modules/
dist/
*.log
.DS_Store
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
coverage/
*.tsbuildinfo
EOF

# Step 11: Create initial commit
git add .
git commit -m "feat: initialize agritech debug tracker library

- Add comprehensive debug tracking system
- Include event monitoring and performance analysis
- Add visual debugging components
- Set up TypeScript build configuration
- Add NPM package configuration"

print_success "Debug library repository created successfully!"

# Step 12: Go back to main project and set up submodule
cd - > /dev/null

print_status "Setting up git submodule in main project..."

# Create submodules directory in the main project
mkdir -p lib

# Remove existing debug files from main project (we'll reference them via submodule)
print_warning "Moving existing debug files to backup..."
mkdir -p .backup/debug-files
cp client/src/lib/debug-tracker.ts .backup/debug-files/
cp client/src/lib/crash-detector.ts .backup/debug-files/
cp client/src/lib/flow-diagram.ts .backup/debug-files/
cp client/src/components/debug-flow-visualizer.tsx .backup/debug-files/

# Add the debug library as a submodule
git submodule add "$DEBUG_LIB_DIR" lib/debug-tracker

print_success "Git submodule added successfully!"

# Step 13: Update main project to use the debug library
print_status "Updating main project to use debug library submodule..."

# Update package.json to include the debug library as a local dependency
npm install ./lib/debug-tracker

print_success "🎉 Debug library setup completed!"

print_status "Next steps:"
echo "  1. Push the debug library to GitHub:"
echo "     cd $DEBUG_LIB_DIR"
echo "     # Create repository on GitHub: $DEBUG_LIB_NAME"
echo "     git remote add origin https://github.com/${GITHUB_USERNAME}/${DEBUG_LIB_NAME}.git"
echo "     git push -u origin main"
echo ""
echo "  2. Update the submodule remote URL:"
echo "     git submodule set-url lib/debug-tracker https://github.com/${GITHUB_USERNAME}/${DEBUG_LIB_NAME}.git"
echo ""
echo "  3. Update imports in your main project to use:"
echo "     import { DebugTracker, DebugFlowVisualizer } from '@agritech/debug-tracker';"
echo ""
echo "  4. To update the debug library:"
echo "     cd lib/debug-tracker"
echo "     git pull origin main"
echo "     cd ../.."
echo "     git add lib/debug-tracker"
echo "     git commit -m 'chore: update debug library'"

print_warning "Remember to update your GitHub username in the setup!"
print_status "Current username set to: $GITHUB_USERNAME" 