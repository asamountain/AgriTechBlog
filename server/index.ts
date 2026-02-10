// Load environment configuration
import { loadEnvironment, displayEnvironmentStatus } from "./local-env-loader";

// Auto-sync environment variables from Vercel on startup
async function autoSyncEnvironment() {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  if (isDevelopment) {
    console.log('🔄 Auto-syncing environment variables from Vercel...');
    
    try {
      const { execSync } = await import('child_process');
      const { existsSync } = await import('fs');
      
      // Check if vercel CLI is available
      try {
        execSync('vercel --version', { stdio: 'ignore' });
        
        // Try to pull environment variables
        execSync('vercel env pull .env.local --yes 2>/dev/null', {
          stdio: 'ignore',
          timeout: 5000 
        });
        
        console.log('✅ Environment variables synced from Vercel');
      } catch {
        // Silently continue if vercel not available or not logged in
        console.log('ℹ️  Vercel sync skipped (CLI not available or not logged in)');
      }
    } catch (error) {
      // Continue even if sync fails
      console.log('ℹ️  Environment sync skipped');
    }
  }
}

// Run auto-sync before loading environment
if (process.env.NODE_ENV !== 'production') {
  await autoSyncEnvironment();
}

// Load environment variables
loadEnvironment();
displayEnvironmentStatus();

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupSession, setupAuth } from "./auth";

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Setup authentication
setupSession(app);
setupAuth(app);

// Google Search Console verification - must come before other routes
app.get("/googlec3cfbe8ec5429358.html", (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send('google-site-verification: googlec3cfbe8ec5429358.html');
});

app.get("/robots.txt", (req, res) => {
  const host = req.get('host');
  const baseUrl = host?.includes('localhost') 
    ? `http://${host}` 
    : `https://${host}`;
  
  const robots = `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml`;

  res.setHeader('Content-Type', 'text/plain');
  res.send(robots);
});

// Initialize routes
let serverReady = false;
let routesPromise: Promise<any> | null = null;

async function initializeServer() {
  if (!serverReady && !routesPromise) {
    routesPromise = registerRoutes(app).then(() => {
      serverReady = true;
      return app;
    });
  }
  return routesPromise;
}

// For Vercel serverless function
export default async function handler(req: Request, res: Response) {
  try {
    await initializeServer();
    // Use Express app as middleware
    return new Promise((resolve, reject) => {
      app(req, res, (err: any) => {
        if (err) {
          console.error('Express error:', err);
          reject(err);
        } else {
          resolve(undefined);
        }
      });
    });
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Dynamic port finder function
async function findAvailablePort(startPort: number = 5000): Promise<number> {
  const { createServer } = await import("http");
  
  return new Promise((resolve, reject) => {
    const testServer = createServer();
    let currentPort = startPort;
    
    const tryPort = () => {
      testServer.listen(currentPort, "127.0.0.1", () => {
        testServer.close(() => {
          resolve(currentPort);
        });
      });
      
      testServer.on("error", (err: any) => {
        if (err.code === "EADDRINUSE") {
          currentPort++;
          if (currentPort > startPort + 10) {
            reject(new Error(`No available port found between ${startPort} and ${currentPort - 1}`));
            return;
          }
          // Remove the error listener to avoid memory leaks
          testServer.removeAllListeners("error");
          setTimeout(tryPort, 100);
        } else {
          reject(err);
        }
      });
    };
    
    tryPort();
  });
}

// For local development
if (process.env.NODE_ENV === "development" || !process.env.VERCEL) {
  (async () => {
    const { setupVite, log } = await import("./vite");
    const { createServer } = await import("http");
    
    const server = createServer(app);
    await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      throw err;
    });

    if (app.get("env") === "development") {
      await setupVite(app, server);
    }

    try {
      // Use port 5000 for backend (frontend proxy expects this)
      const port = 5000;
      console.log(`🔍 Starting backend on port: ${port}`);
      
      server.listen(port, "127.0.0.1", () => {
        log(`🚀 Server serving on port ${port}`);
        console.log(`📱 Local development URL: http://localhost:${port}`);
        console.log(`🌐 Network URL: http://127.0.0.1:${port}`);
      });
      
    } catch (error) {
      console.error("❌ Failed to start server:", error);
      console.error("💡 Tip: Run 'npm run predev' to kill processes on ports 3000, 5000, 5173");
      process.exit(1);
    }
  })();
}
