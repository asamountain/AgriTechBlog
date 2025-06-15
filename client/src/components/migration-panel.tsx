import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function MigrationPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check unassigned posts count
  const { data: unassignedData, isLoading: isCheckingCount } = useQuery({
    queryKey: ["/api/admin/unassigned-posts"],
    retry: false
  });

  // Migration mutation
  const migrationMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/migrate-posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        throw new Error("Migration failed");
      }
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Migration Completed",
        description: `Successfully migrated ${data.migratedCount} posts to your account.`
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/unassigned-posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: (error) => {
      toast({
        title: "Migration Failed",
        description: error.message || "Failed to migrate posts",
        variant: "destructive"
      });
    }
  });

  const unassignedCount = unassignedData?.unassignedCount || 0;

  if (isCheckingCount) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Content Migration</CardTitle>
          <CardDescription>Checking for unassigned posts...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (unassignedCount === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Content Migration</CardTitle>
          <CardDescription>All posts are properly assigned to user accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              No migration needed. All your blog posts are already associated with your account.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Content Migration</CardTitle>
        <CardDescription>
          Assign existing blog posts to your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            Found {unassignedCount} blog posts that are not assigned to any user account. 
            Click the button below to assign them to your current account.
          </AlertDescription>
        </Alert>
        
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            This will make all unassigned posts visible in your admin dashboard and associate them with your login account.
          </p>
          
          <Button 
            onClick={() => migrationMutation.mutate()}
            disabled={migrationMutation.isPending}
            className="w-full"
          >
            {migrationMutation.isPending ? "Migrating Posts..." : `Migrate ${unassignedCount} Posts to My Account`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}