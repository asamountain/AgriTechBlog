import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageCircle, 
  Check, 
  X, 
  Clock, 
  User, 
  Mail,
  Calendar,
  ExternalLink
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { usePersistentAuth } from "@/hooks/usePersistentAuth";
import { AdaptiveLoader, ContentSkeleton } from "@/components/loading";
import { Link } from "wouter";

interface CommentWithPost {
  id: number;
  content: string;
  createdAt: string;
  blogPostId: number;
  parentId: number | null;
  authorName: string;
  authorEmail: string;
  isApproved: boolean;
  postTitle: string;
  postSlug: string;
}

export default function CommentManagement() {
  const [activeTab, setActiveTab] = useState("pending");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated } = usePersistentAuth();

  const { data: comments = [], isLoading } = useQuery<CommentWithPost[]>({
    queryKey: ["/api/admin/comments"],
    enabled: isAuthenticated,
  });

  const approveComment = useMutation({
    mutationFn: async (commentId: number) => {
      return await apiRequest(`/api/comments/${commentId}/approve`, "PUT");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/comments"] });
      toast({
        title: "Comment approved",
        description: "The comment has been approved and is now visible.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve comment.",
        variant: "destructive",
      });
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: number) => {
      return await apiRequest(`/api/comments/${commentId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/comments"] });
      toast({
        title: "Comment deleted",
        description: "The comment has been permanently removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete comment.",
        variant: "destructive",
      });
    },
  });

  const pendingComments = comments.filter(comment => !comment.isApproved);
  const approvedComments = comments.filter(comment => comment.isApproved);

  const CommentCard = ({ comment }: { comment: CommentWithPost }) => (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">{comment.authorName}</span>
                <Badge variant={comment.isApproved ? "default" : "secondary"}>
                  {comment.isApproved ? "Approved" : "Pending"}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                <div className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {comment.authorEmail}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(comment.createdAt)}
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {!comment.isApproved && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => approveComment.mutate(comment.id)}
                disabled={approveComment.isPending}
                className="text-green-600 border-green-600 hover:bg-green-50"
              >
                <Check className="h-4 w-4 mr-1" />
                Approve
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => deleteComment.mutate(comment.id)}
              disabled={deleteComment.isPending}
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              <X className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <p className="text-gray-800 leading-relaxed">{comment.content}</p>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Comment on: <span className="font-medium">{comment.postTitle}</span>
          </div>
          <Link href={`/blog/${comment.postSlug}`}>
            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800">
              <ExternalLink className="h-4 w-4 mr-1" />
              View Post
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <MessageCircle className="h-6 w-6 text-forest-green" />
          <h2 className="text-2xl font-bold text-gray-900">Comment Management</h2>
        </div>
        <div className="flex justify-center mb-8">
          <AdaptiveLoader size="lg" text="Loading comments..." />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <ContentSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle className="h-6 w-6 text-forest-green" />
        <h2 className="text-2xl font-bold text-gray-900">Comment Management</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending ({pendingComments.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            Approved ({approvedComments.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            All ({comments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingComments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No pending comments</h3>
                <p className="text-gray-600">All comments have been reviewed.</p>
              </CardContent>
            </Card>
          ) : (
            pendingComments.map((comment) => (
              <CommentCard key={comment.id} comment={comment} />
            ))
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approvedComments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Check className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No approved comments</h3>
                <p className="text-gray-600">No comments have been approved yet.</p>
              </CardContent>
            </Card>
          ) : (
            approvedComments.map((comment) => (
              <CommentCard key={comment.id} comment={comment} />
            ))
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {comments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No comments yet</h3>
                <p className="text-gray-600">Comments will appear here when readers engage with your posts.</p>
              </CardContent>
            </Card>
          ) : (
            comments.map((comment) => (
              <CommentCard key={comment.id} comment={comment} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}