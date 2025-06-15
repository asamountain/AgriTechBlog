import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Sparkles, Brain, Target, Loader2, CheckCircle, AlertCircle } from "lucide-react";

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
  const queryClient = useQueryClient();

  // Fetch user's blog posts
  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['/api/blog-posts'],
    select: (data: any) => data?.filter((post: any) => post.userId) || []
  });

  // Single post analysis mutation
  const analyzePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      const response = await fetch(`/api/ai-tagging/analyze/${postId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to analyze post');
      return response.json();
    },
    onSuccess: (data, postId) => {
      toast({
        title: "Analysis Complete",
        description: `AI analysis completed for post with ${data.confidence * 100}% confidence`,
      });
      setSelectedPostId(postId);
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze post content. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Bulk analysis mutation
  const bulkAnalyzeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/ai-tagging/bulk-analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to perform bulk analysis');
      return response.json();
    },
    onSuccess: (data) => {
      const successCount = data.results.filter((r: AnalysisResult) => !r.error).length;
      const totalCount = data.results.length;
      
      toast({
        title: "Bulk Analysis Complete",
        description: `Successfully analyzed ${successCount} of ${totalCount} posts`,
      });
    },
    onError: (error) => {
      toast({
        title: "Bulk Analysis Failed",
        description: "Failed to perform bulk analysis. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Tag generation mutation
  const generateTagsMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch('/api/ai-tagging/generate-tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ content })
      });
      if (!response.ok) throw new Error('Failed to generate tags');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Tags Generated",
        description: `Generated ${data.tags.length} relevant tags`,
      });
    },
    onError: (error) => {
      toast({
        title: "Tag Generation Failed",
        description: "Failed to generate tags. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Category suggestion mutation
  const suggestCategoryMutation = useMutation({
    mutationFn: async ({ title, content }: { title: string; content: string }) => {
      const response = await fetch('/api/ai-tagging/suggest-category', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ title, content })
      });
      if (!response.ok) throw new Error('Failed to suggest category');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Category Suggested",
        description: `Suggested category: ${data.category}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Category Suggestion Failed",
        description: "Failed to suggest category. Please try again.",
        variant: "destructive",
      });
    }
  });

  const selectedPost = posts.find((post: any) => post.id === selectedPostId);
  const analysisData = analyzePostMutation.data;
  const bulkResults = bulkAnalyzeMutation.data?.results || [];

  if (postsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading posts...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Brain className="h-6 w-6 text-blue-500" />
        <h2 className="text-2xl font-bold">AI Content Analysis</h2>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Post Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Select Post to Analyze
            </CardTitle>
            <CardDescription>
              Choose a blog post to get AI-powered tagging and categorization suggestions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button
                  onClick={() => bulkAnalyzeMutation.mutate()}
                  disabled={bulkAnalyzeMutation.isPending || posts.length === 0}
                  className="flex-1"
                >
                  {bulkAnalyzeMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Bulk Analyze All Posts
                </Button>
              </div>
              
              <Separator />
              
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {posts.map((post: any) => (
                    <div
                      key={post.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedPostId === post.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                          : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                      }`}
                      onClick={() => setSelectedPostId(post.id)}
                    >
                      <h4 className="font-medium text-sm truncate">{post.title}</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Category: {post.category.name}
                      </p>
                      <div className="flex justify-between items-center mt-2">
                        <Badge variant="outline" className="text-xs">
                          {post.readTime} min read
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            analyzePostMutation.mutate(post.id);
                          }}
                          disabled={analyzePostMutation.isPending}
                        >
                          {analyzePostMutation.isPending && analyzePostMutation.variables === post.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Brain className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>

        {/* Analysis Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI Analysis Results
            </CardTitle>
            <CardDescription>
              View AI-generated tags and category suggestions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedPost && analysisData ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Selected Post:</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {selectedPost.title}
                  </p>
                </div>

                <Separator />

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium">Suggested Category:</h4>
                    <Badge variant="secondary">{analysisData.suggestedCategory}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>Confidence:</span>
                    <div className="flex items-center gap-1">
                      <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 transition-all"
                          style={{ width: `${analysisData.confidence * 100}%` }}
                        />
                      </div>
                      <span>{Math.round(analysisData.confidence * 100)}%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Suggested Tags:</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysisData.suggestedTags.map((tag: string, index: number) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">AI Reasoning:</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {analysisData.reasoning}
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => generateTagsMutation.mutate(selectedPost.content)}
                    disabled={generateTagsMutation.isPending}
                  >
                    {generateTagsMutation.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <Sparkles className="h-3 w-3 mr-1" />
                    )}
                    Generate More Tags
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => suggestCategoryMutation.mutate({
                      title: selectedPost.title,
                      content: selectedPost.content
                    })}
                    disabled={suggestCategoryMutation.isPending}
                  >
                    {suggestCategoryMutation.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <Target className="h-3 w-3 mr-1" />
                    )}
                    Suggest Category
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a post and run analysis to see AI suggestions</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bulk Analysis Results */}
      {bulkResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Bulk Analysis Results
            </CardTitle>
            <CardDescription>
              Results from bulk content analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {bulkResults.map((result: AnalysisResult, index: number) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{result.title}</h4>
                        {result.error ? (
                          <div className="flex items-center gap-1 mt-1">
                            <AlertCircle className="h-3 w-3 text-red-500" />
                            <span className="text-xs text-red-600 dark:text-red-400">
                              {result.error}
                            </span>
                          </div>
                        ) : result.analysis ? (
                          <div className="mt-2 space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {result.analysis.suggestedCategory}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {Math.round(result.analysis.confidence * 100)}% confidence
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {result.analysis.suggestedTags.slice(0, 3).map((tag: string, tagIndex: number) => (
                                <Badge key={tagIndex} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {result.analysis.suggestedTags.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{result.analysis.suggestedTags.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        ) : null}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedPostId(result.postId)}
                        className="ml-2"
                      >
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}