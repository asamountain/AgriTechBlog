import { useEffect, useRef } from 'react';
import { usePersistentAuth } from '@/hooks/usePersistentAuth';
import { AdaptiveLoader } from '@/components/loading';

export default function AuthCallback() {
  const { saveAuthState } = usePersistentAuth();
  const hasRun = useRef(false);

  useEffect(() => {
    // Prevent double-execution (e.g. from React StrictMode or dependency changes)
    if (hasRun.current) return;
    hasRun.current = true;

    const handleAuthCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);

        // Case 1: Transfer token from cross-origin redirect (preview deployment)
        const transferToken = params.get('transferToken');
        if (transferToken) {
          const response = await fetch('/api/auth/user', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transferToken }),
          });

          if (response.ok) {
            const userData = await response.json();
            if (userData && userData.id) {
              saveAuthState(userData, Date.now().toString());
              window.location.href = '/admin';
              return;
            }
          }
          console.error('Transfer token exchange failed');
          window.location.href = '/admin';
          return;
        }

        // Case 2: Normal OAuth callback with code
        const code = params.get('code');
        const stateParam = params.get('state') || '';

        // Parse state: "provider" or "provider|returnOrigin"
        const pipeIdx = stateParam.indexOf('|');
        const provider = pipeIdx >= 0 ? stateParam.substring(0, pipeIdx) : stateParam;
        const returnOrigin = pipeIdx >= 0 ? stateParam.substring(pipeIdx + 1) : null;

        if (!code || !provider) {
          console.error('Missing code or provider in callback');
          window.location.href = '/admin';
          return;
        }

        // Exchange the code for user data via our API
        const response = await fetch('/api/auth/user', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            provider,
            redirectUri: `${window.location.origin}/auth/callback`,
          }),
        });

        if (response.ok) {
          const userData = await response.json();
          if (userData && userData.id) {
            // If the login originated from a different origin (preview), redirect back with transfer token
            if (returnOrigin && returnOrigin !== window.location.origin) {
              window.location.href = `${returnOrigin}/auth/callback?transferToken=${encodeURIComponent(userData.transferToken)}`;
              return;
            }

            // Same origin: save auth and go to admin
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
          const err = await response.text();
          console.error('Auth exchange failed:', err);
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
