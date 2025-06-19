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
  const baseUrl = req.get('host')?.includes('localhost') 
    ? 'http://localhost:5000' 
    : `https://${req.get('host')}`;
  
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
  await initializeServer();
  return app(req, res);
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

    const port = 5000;
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`serving on port ${port}`);
    });
  })();
}
