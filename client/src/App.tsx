import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/auth/auth-provider";
import { useEffect, lazy, Suspense } from "react";
// import { initGA } from "./lib/analytics"; // DISABLED
// import { useAnalytics } from "./hooks/use-analytics"; // DISABLED
import { debugTracker } from "./lib/debug-tracker";
import "./lib/crash-detector"; // Initialize crash detector
import { SimplePageLoader } from "@/components/loading-animations";

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
const UserProfile = lazy(() => import("@/pages/user-profile"));
const NotFound = lazy(() => import("@/pages/not-found"));
const DebugFlowVisualizer = lazy(() => import("@/components/debug-flow-visualizer"));

function Router() {
  // Analytics DISABLED to fix sitemap XML interference
  // useAnalytics(); // DISABLED
  
  return (
    <Suspense fallback={<SimplePageLoader />}>
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
        <Route path="/user/:username" component={UserProfile} />
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
      console.log('🔍 Debug Tracker available - Press Ctrl+Shift+D to toggle debug panel');
      
      // Add keyboard shortcut for debug panel (Ctrl+Shift+D) - only on admin pages
      const handleKeyPress = (event: KeyboardEvent) => {
        if (event.ctrlKey && event.shiftKey && event.key === 'D' && 
            (location.startsWith('/admin') || location.startsWith('/create-post') || location.startsWith('/edit-post'))) {
          // Toggle debug panel visibility
          const currentState = localStorage.getItem('debug-visualizer-visible') === 'true';
          localStorage.setItem('debug-visualizer-visible', String(!currentState));
          // Trigger storage event to update component
          window.dispatchEvent(new Event('storage'));
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
      <AuthProvider>
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
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
