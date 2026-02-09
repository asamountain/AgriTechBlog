import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { usePersistentAuth } from "@/hooks/usePersistentAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

function MongoDBConnectionSection() {
  const [uri, setUri] = useState("");
  const [dbName, setDbName] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError("");
    try {
      const res = await fetch("/api/admin/connect-mongodb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uri, dbName }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setError("");
      } else {
        setSuccess(false);
        setError(data.error || "Unknown error");
      }
    } catch (err: any) {
      setSuccess(false);
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Connect to MongoDB</CardTitle>
        <CardDescription>
          Connect to a different MongoDB database to access its posts
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleConnect}>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="mongodb-uri">MongoDB URI</Label>
            <Input
              id="mongodb-uri"
              value={uri}
              onChange={e => setUri(e.target.value)}
              placeholder="mongodb+srv://user:pass@host/db?options"
              required
            />
          </div>
          <div>
            <Label htmlFor="mongodb-db">Database Name</Label>
            <Input
              id="mongodb-db"
              value={dbName}
              onChange={e => setDbName(e.target.value)}
              placeholder="blog"
            />
          </div>
          {loading && <div className="text-blue-600">Connecting...</div>}
          {success && <div className="text-green-600">Connected successfully!</div>}
          {error && <div className="text-red-600">Error: {error}</div>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Connecting..." : "Connect to MongoDB"}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}

export default function MigrationPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated } = usePersistentAuth();

  // Check unassigned posts count
  const { data: unassignedData, isLoading: isCheckingCount } = useQuery({
    queryKey: ["/api/admin/unassigned-posts"],
    enabled: isAuthenticated,
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

  const unassignedCount = (unassignedData as any)?.unassignedCount || 0;

  if (isCheckingCount) {
    return (
      <div className="space-y-6">
        <MongoDBConnectionSection />
        <Card>
          <CardHeader>
            <CardTitle>Content Migration</CardTitle>
            <CardDescription>Checking for unassigned posts...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (unassignedCount === 0) {
    return (
      <div className="space-y-6">
        <MongoDBConnectionSection />
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <MongoDBConnectionSection />
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
    </div>
  );
}