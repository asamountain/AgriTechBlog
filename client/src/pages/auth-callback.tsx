import { useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Check if authentication was successful by trying to fetch user data
    fetch('/api/auth/user')
      .then(response => {
        if (response.ok) {
          // Authentication successful, redirect to previous page or home
          const returnTo = new URLSearchParams(window.location.search).get('returnTo') || '/';
          setLocation(returnTo);
        } else {
          // Authentication failed, redirect to home
          setLocation('/');
        }
      })
      .catch(() => {
        // Error occurred, redirect to home
        setLocation('/');
      });
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-forest-green" />
        <p className="text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
}