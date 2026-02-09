import { useEffect } from 'react';
import { usePersistentAuth } from '@/hooks/usePersistentAuth';
import { LoadingSpinner } from '@/components/loading-animations';

export default function AuthCallback() {
  const { saveAuthState } = usePersistentAuth();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check if user is authenticated after OAuth redirect
        const response = await fetch('/api/admin/verify-session', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.authenticated && data.user) {
            // Save the authenticated user to localStorage
            saveAuthState(data.user, Date.now().toString());
            
            // Redirect to admin dashboard
            window.location.href = '/admin';
          } else {
            // Authentication failed
            window.location.href = '/admin';
          }
        } else {
          // Authentication failed
          window.location.href = '/admin';
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        window.location.href = '/admin';
      }
    };

    handleAuthCallback();
  }, [saveAuthState]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-forest-green/10 flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" text="Completing authentication..." />
        <p className="text-gray-600 mt-4">Please wait...</p>
      </div>
    </div>
  );
}