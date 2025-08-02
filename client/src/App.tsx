import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, lazy, Suspense } from "react";
import { initGA } from "./lib/analytics";
import { useAnalytics } from "./hooks/use-analytics";
import { debugTracker } from "./lib/debug-tracker";
import "./lib/crash-detector"; // Initialize crash detector

// Lazy load pages for better code splitting
const Home = lazy(() => import("@/pages/home"));
const Posts = lazy(() => import("@/pages/posts"));
const BlogPost = lazy(() => import("@/pages/blog-post"));
const AdminDashboard = lazy(() => import("@/pages/admin-working"));
const AdminSEODashboard = lazy(() => import("@/pages/admin-seo-dashboard"));
const CreatePost = lazy(() => import("@/pages/create-post"));
const OpenGraphTester = lazy(() => import("@/pages/og-tester"));
const TaggedPosts = lazy(() => import("@/pages/tagged-posts"));
const AuthCallback = lazy(() => import("@/pages/auth-callback"));
const NotFound = lazy(() => import("@/pages/not-found"));
const DebugFlowVisualizer = lazy(() => import("@/components/debug-flow-visualizer"));

// Loading component for lazy-loaded pages
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

function Router() {
  // Analytics DISABLED to fix sitemap XML interference
  // useAnalytics(); // DISABLED
  
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/posts" component={Posts} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/seo" component={AdminSEODashboard} />
        <Route path="/create-post" component={CreatePost} />
        <Route path="/edit-post/:id" component={CreatePost} />
        <Route path="/og-test" component={OpenGraphTester} />
        <Route path="/auth/callback" component={AuthCallback} />
        <Route path="/tags/:tag" component={TaggedPosts} />
        <Route path="/blog/:slug" component={BlogPost} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  const [location] = useLocation();
  
  // Google Analytics DISABLED to fix sitemap XML interference
  useEffect(() => {
    // Verify required environment variable is present
    if (!import.meta.env.VITE_GA_MEASUREMENT_ID) {
      console.warn('Missing required Google Analytics key: VITE_GA_MEASUREMENT_ID');
    } else {
      // initGA(); // DISABLED - was causing data-google-analytics-opt-out attribute
      console.log('Google Analytics disabled to fix sitemap XML parsing');
    }

    // Initialize debug tracker (development only)
    if (import.meta.env.DEV) {
      console.log('🔍 Debug Tracker available - Use debugTracker.showDebugOverlay() in console');
      
      // Add keyboard shortcut for debug overlay (Ctrl+Shift+D) - only on admin pages
      const handleKeyPress = (event: KeyboardEvent) => {
        if (event.ctrlKey && event.shiftKey && event.key === 'D' && location.startsWith('/admin')) {
          debugTracker.instance.showDebugOverlay();
        }
      };
      
      document.addEventListener('keydown', handleKeyPress);
      return () => document.removeEventListener('keydown', handleKeyPress);
    }
  }, [location]);

  // Check if current page is an admin page
  const isAdminPage = location.startsWith('/admin') || location.startsWith('/create-post') || location.startsWith('/edit-post');

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
        {import.meta.env.DEV && isAdminPage && (
          <Suspense fallback={<div className="fixed bottom-0 left-0 right-0 z-50 h-8 bg-blue-500 text-white text-center">Loading Debug...</div>}>
            <div className="fixed bottom-0 left-0 right-0 z-50 max-h-96 overflow-y-auto bg-white shadow-2xl border-t-4 border-blue-500">
              <DebugFlowVisualizer />
            </div>
          </Suspense>
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
