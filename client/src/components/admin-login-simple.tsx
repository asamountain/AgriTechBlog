import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Github, Mail, AlertCircle } from 'lucide-react';

export default function AdminLoginSimple() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGoogleLogin = () => {
    setIsLoading(true);
    window.location.href = '/auth/google';
  };

  const handleGitHubLogin = () => {
    setIsLoading(true);
    window.location.href = '/auth/github';
  };

  const handleDemoLogin = () => {
    // For development purposes - simulate successful login
    const demoUser = {
      id: 'demo-user-123',
      name: 'Demo Admin',
      email: 'admin@demo.com',
      provider: 'demo'
    };
    
    // Save to localStorage for demo purposes
    localStorage.setItem('auth-user', JSON.stringify(demoUser));
    localStorage.setItem('is-authenticated', 'true');
    
    toast({
      title: "Demo Login Successful",
      description: "You're now logged in with demo credentials",
    });
    
    // Reload the page to trigger auth state update
    window.location.reload();
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

          {/* Development Demo Login */}
          <div className="border-t pt-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
              <div className="flex items-center">
                <AlertCircle className="w-4 h-4 text-yellow-600 mr-2" />
                <span className="text-sm text-yellow-800">
                  Development Mode
                </span>
              </div>
            </div>
            
            <Button
              onClick={handleDemoLogin}
              variant="outline"
              className="w-full"
            >
              Demo Login (Development Only)
            </Button>
          </div>

          {/* OAuth Setup Instructions */}
          <div className="text-xs text-gray-600 mt-4 p-3 bg-blue-50 rounded">
            <p className="font-medium mb-1">OAuth Setup Required:</p>
            <p>If Google login fails, add this redirect URI to your Google OAuth app:</p>
            <code className="text-xs bg-white p-1 rounded mt-1 block break-all">
              https://54037cb7-11dd-4327-b4c8-0182009521c3-00-2xwgdjgm9t82u.janeway.replit.dev/auth/google/callback
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}