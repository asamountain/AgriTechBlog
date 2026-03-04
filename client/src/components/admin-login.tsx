import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn, Github } from "lucide-react";
import { FaGoogle } from "react-icons/fa";
// import { trackEvent } from "@/lib/analytics"; // DISABLED
import { usePersistentAuth } from "@/hooks/usePersistentAuth";

export default function AdminLogin() {
  const { login } = usePersistentAuth();

  const handleGoogleLogin = () => {
    // trackEvent('admin_login_attempt', 'authentication', 'google'); // DISABLED
    login('google');
  };

  const handleGithubLogin = () => {
    // trackEvent('admin_login_attempt', 'authentication', 'github'); // DISABLED
    login('github');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-forest-green/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 bg-forest-green rounded-full flex items-center justify-center">
            <LogIn className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Admin Access</CardTitle>
          <CardDescription>
            Sign in with your account to access the admin dashboard
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Button 
            onClick={handleGoogleLogin}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
            size="lg"
          >
            <FaGoogle className="h-5 w-5 mr-3" />
            Continue with Google
          </Button>
          
          <Button 
            onClick={handleGithubLogin}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white"
            size="lg"
          >
            <Github className="h-5 w-5 mr-3" />
            Continue with GitHub
          </Button>
          
          <div className="text-center text-sm text-gray-600 mt-6">
            <p>Only authorized users can access the admin panel</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}