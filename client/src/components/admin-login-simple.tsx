import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Github, Mail } from 'lucide-react';

export default function AdminLoginSimple() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = () => {
    setIsLoading(true);
    window.location.href = '/auth/google';
  };

  const handleGitHubLogin = () => {
    setIsLoading(true);
    window.location.href = '/auth/github';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 to-fresh-lime-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-forest-green">Admin Login</CardTitle>
          <CardDescription>
            Sign in to access the admin dashboard
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* OAuth Login Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <Mail className="w-4 h-4 mr-2" />
              Continue with Google
            </Button>

            <Button
              onClick={handleGitHubLogin}
              disabled={isLoading}
              className="w-full bg-gray-900 text-white hover:bg-gray-800"
            >
              <Github className="w-4 h-4 mr-2" />
              Continue with GitHub
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}