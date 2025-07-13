import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import Posts from "@/pages/posts";
import BlogPost from "@/pages/blog-post";
import AdminDashboard from "@/pages/admin-working";
import AdminSEODashboard from "@/pages/admin-seo-dashboard";
import CreatePost from "@/pages/create-post";
import OpenGraphTester from "@/pages/og-tester";
import TaggedPosts from "@/pages/tagged-posts";
import AuthCallback from "@/pages/auth-callback";
import NotFound from "@/pages/not-found";
import DebugFlowVisualizer from "@/components/debug-flow-visualizer";
import { useEffect } from "react";
import { initGA } from "./lib/analytics";
import { useAnalytics } from "./hooks/use-analytics";
import { debugTracker } from "./lib/debug-tracker";
import "./lib/crash-detector"; // Initialize crash detector

function Router() {
  // Track page views when routes change
  useAnalytics();
  
  return (
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
  );
}

function App() {
  const [location] = useLocation();
  
  // Initialize Google Analytics and Debug Tracker when app loads
  useEffect(() => {
    // Verify required environment variable is present
    if (!import.meta.env.VITE_GA_MEASUREMENT_ID) {
      console.warn('Missing required Google Analytics key: VITE_GA_MEASUREMENT_ID');
    } else {
      initGA();
    }

    // Initialize debug tracker (development only)
    if (import.meta.env.DEV) {
      console.log('🔍 Debug Tracker available - Use debugTracker.showDebugOverlay() in console');
      
      // Add keyboard shortcut for debug overlay (Ctrl+Shift+D) - only on admin pages
      const handleKeyPress = (event: KeyboardEvent) => {
        if (event.ctrlKey && event.shiftKey && event.key === 'D' && location.startsWith('/admin')) {
          debugTracker.showDebugOverlay();
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
          <div className="fixed bottom-0 left-0 right-0 z-50 max-h-96 overflow-y-auto bg-white shadow-2xl border-t-4 border-blue-500">
            <DebugFlowVisualizer />
          </div>
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
