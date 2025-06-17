import { Switch, Route } from "wouter";
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
import { useEffect } from "react";
import { initGA } from "./lib/analytics";
import { useAnalytics } from "./hooks/use-analytics";

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
  // Initialize Google Analytics when app loads
  useEffect(() => {
    // Verify required environment variable is present
    if (!import.meta.env.VITE_GA_MEASUREMENT_ID) {
      console.warn('Missing required Google Analytics key: VITE_GA_MEASUREMENT_ID');
    } else {
      initGA();
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
