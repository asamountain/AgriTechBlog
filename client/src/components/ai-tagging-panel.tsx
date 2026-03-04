import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Sparkles, Brain, Target, CheckCircle, AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { markdownToText } from "@/lib/html-to-markdown";
import { AdaptiveLoader, InlineNatureSpinner } from "@/components/loading";

interface TaggingResult {
  suggestedTags: string[];
  suggestedCategory: string;
  confidence: number;
  reasoning: string;
}

interface AnalysisResult {
  postId: number;
  title: string;
  analysis?: TaggingResult;
  error?: string;
}

export function AITaggingPanel() {
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ['/api/admin/blog-posts'],
    queryFn: async () => {
      const response = await fetch('/api/admin/blog-posts', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch posts');
      return response.json();
    }
  });

  // Tag analysis mutation - Disabled due to Vercel function limit
  const analyzePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      // API temporarily disabled to stay under Vercel function limit
      throw new Error('AI tagging feature is temporarily disabled');
    },
    onSuccess: (data: any) => {
      toast({
        title: "Analysis Complete",
        description: `Generated ${data.suggestedTags?.length || 0} tags`,
      });
    },
    onError: (error) => {
      toast({
        title: "AI Tagging Disabled",
        description: "AI tagging is temporarily disabled to stay under Vercel function limit.",
        variant: "destructive",
      });
    }
  });

  // Bulk analysis mutation - Disabled due to Vercel function limit
  const bulkAnalyzeMutation = useMutation({
    mutationFn: async () => {
      // API temporarily disabled to stay under Vercel function limit
      throw new Error('Bulk AI tagging feature is temporarily disabled');
    },
    onSuccess: (data: any) => {
      toast({
        title: "Bulk Analysis Complete",
        description: `Analyzed ${data.results?.length || 0} posts`,
      });
    },
    onError: (error) => {
      toast({
        title: "AI Tagging Disabled",
        description: "AI tagging is temporarily disabled to stay under Vercel function limit.",
        variant: "destructive",
      });
    }
  });

  const selectedPost = posts.find((post: any) => post.id === selectedPostId);
  const analysisData = analyzePostMutation.data as any;
  const bulkResults = (bulkAnalyzeMutation.data as any)?.results || [];

  if (postsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <AdaptiveLoader size="md" text="Loading posts..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">AI Tagging Panel</h2>
        <p className="text-gray-600">Use AI to generate tags for your blog posts</p>
      </div>

      {/* Bulk Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk Operations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={() => bulkAnalyzeMutation.mutate()}
            disabled={bulkAnalyzeMutation.isPending}
            className="w-full"
          >
            {bulkAnalyzeMutation.isPending ? (
              <>
                <InlineNatureSpinner size="sm" className="mr-2" />
                Analyzing All Posts...
              </>
            ) : (
              'Analyze All Posts'
            )}
          </Button>
          
          {bulkResults.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <h4 className="font-semibold">Bulk Analysis Results:</h4>
              {bulkResults.map((result: any, index: number) => (
                <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                  <strong>{result.title}</strong>
                  {result.error ? (
                    <p className="text-red-600">Error: {result.error}</p>
                  ) : (
                    <p>Analyzed successfully</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Individual Post Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Individual Post Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="post-select">Select Post:</Label>
            <select
              id="post-select"
              value={selectedPostId || ''}
              onChange={(e) => setSelectedPostId(Number(e.target.value) || null)}
              className="w-full mt-1 p-2 border rounded-md"
            >
              <option value="">Choose a post...</option>
              {posts.map((post: any) => (
                <option key={post.id} value={post.id}>
                  {post.title}
                </option>
              ))}
            </select>
          </div>

          {selectedPost && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold">{selectedPost.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{markdownToText(selectedPost.excerpt)}</p>
                {selectedPost.tags && selectedPost.tags.length > 0 && (
                  <div className="mt-2">
                    <span className="text-sm font-medium">Current tags: </span>
                    {selectedPost.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="outline" className="mr-1">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <Button 
                onClick={() => analyzePostMutation.mutate(selectedPost.id)}
                disabled={analyzePostMutation.isPending}
                className="w-full"
              >
                {analyzePostMutation.isPending ? (
                  <>
                    <InlineNatureSpinner size="sm" className="mr-2" />
                    Analyzing...
                  </>
                ) : (
                  'Analyze This Post'
                )}
              </Button>

              {analysisData && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Analysis Results:</h4>
                  {analysisData.suggestedTags && (
                    <div>
                      <span className="text-sm font-medium">Suggested Tags: </span>
                      {analysisData.suggestedTags.map((tag: string, index: number) => (
                        <Badge key={index} variant="secondary" className="mr-1">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}