import { useEffect } from 'react';
import { usePersistentAuth } from '@/hooks/usePersistentAuth';

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest-green mx-auto mb-4"></div>
        <p className="text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
}