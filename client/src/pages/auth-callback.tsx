import { useEffect } from 'react';
import { usePersistentAuth } from '@/hooks/usePersistentAuth';
import { AdaptiveLoader } from '@/components/loading';

export default function AuthCallback() {
  const { saveAuthState } = usePersistentAuth();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const response = await fetch('/api/auth/user', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const userData = await response.json();
          if (userData && userData.id) {
            saveAuthState(userData, Date.now().toString());

            // Migrate unassigned posts to this user
            try {
              await fetch('/api/admin/migrate-posts', {
                method: 'POST',
                credentials: 'include',
              });
            } catch {
              // Migration is best-effort, don't block login
            }

            window.location.href = '/admin';
          } else {
            window.location.href = '/admin';
          }
        } else {
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
        <AdaptiveLoader size="lg" text="Completing authentication..." />
        <p className="text-gray-600 mt-4">Please wait...</p>
      </div>
    </div>
  );
}