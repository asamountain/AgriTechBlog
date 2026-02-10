import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle, Send, User } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
// import { trackEvent } from "@/lib/analytics"; // DISABLED
import { useToast } from "@/hooks/use-toast";
import type { Comment } from "@shared/schema";

interface CommentSectionProps {
  postId: number;
  postTitle: string;
}

export default function CommentSection({ postId, postTitle }: CommentSectionProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery<Comment[]>({
    queryKey: [`/api/blog-posts/${postId}/comments`],
    enabled: !!postId,
  });

  const submitComment = useMutation({
    mutationFn: async (commentData: {
      authorName: string;
      authorEmail: string;
      content: string;
    }) => {
      return await apiRequest("POST", `/api/blog-posts/${postId}/comments`, commentData);
    },
    onSuccess: () => {
      // Track comment submission
      // trackEvent('comment_submit', 'engagement', postTitle); // DISABLED
      
      toast({
        title: "Comment submitted!",
        description: "Your comment has been submitted and is awaiting approval.",
      });

      // Clear form
      setName("");
      setEmail("");
      setContent("");
      
      // Refresh comments
      queryClient.invalidateQueries({ queryKey: [`/api/blog-posts/${postId}/comments`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit comment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !email.trim() || !content.trim()) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields to submit your comment.",
        variant: "destructive",
      });
      return;
    }

    if (!email.includes("@")) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await submitComment.mutateAsync({
        authorName: name.trim(),
        authorEmail: email.trim(),
        content: content.trim(),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-12 space-y-8">
      <div className="flex items-center gap-2 text-xl font-semibold">
        <MessageCircle className="h-5 w-5" />
        Comments ({comments.length})
      </div>

      {/* Comment Form */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-medium">Leave a Comment</h3>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Input
                  type="email"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <Textarea
              placeholder="Write your comment here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              required
            />
            
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={isSubmitting || submitComment.isPending}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                {isSubmitting ? "Submitting..." : "Post Comment"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Comments List */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading comments...
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No comments yet. Be the first to share your thoughts!
          </div>
        ) : (
          comments.map((comment) => (
            <Card key={comment.id} className="border-l-4 border-l-green-500">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{comment.authorName}</span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                      {comment.content}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}