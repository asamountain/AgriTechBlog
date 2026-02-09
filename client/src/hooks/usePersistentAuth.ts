import { useEffect, useState } from 'react';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  provider: 'google' | 'github';
  avatar?: string;
  isAdmin?: boolean;
}

const AUTH_STORAGE_KEY = 'agrotech_admin_auth';
const SESSION_STORAGE_KEY = 'agrotech_session_id';

export function usePersistentAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Restore auth state from localStorage on app start
  useEffect(() => {
    const restoreAuthState = async () => {
      try {
        // Check for demo auth first (for development)
        const demoAuth = localStorage.getItem('auth-user');
        const demoSession = localStorage.getItem('is-authenticated');
        
        if (demoAuth && demoSession === 'true') {
          const userData = JSON.parse(demoAuth);
          setUser(userData);
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }

        // Check localStorage for stored auth
        const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
        const storedSession = localStorage.getItem(SESSION_STORAGE_KEY);
        
        if (storedAuth && storedSession) {
          const userData = JSON.parse(storedAuth);
          
          // Verify session is still valid
          const response = await fetch('/api/auth/user', {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
            setIsAuthenticated(true);
          } else {
            // Session expired, clear storage
            localStorage.removeItem(AUTH_STORAGE_KEY);
            localStorage.removeItem(SESSION_STORAGE_KEY);
          }
        }
      } catch (error) {
        console.error('Failed to restore auth state:', error);
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem(SESSION_STORAGE_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    restoreAuthState();
  }, []);

  // Save auth state to localStorage
  const saveAuthState = (userData: AuthUser, sessionId?: string) => {
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
      if (sessionId) {
        localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
      }
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Failed to save auth state:', error);
    }
  };

  // Clear auth state
  const clearAuthState = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setUser(null);
    setIsAuthenticated(false);
  };

  // Login function
  const login = async (provider: 'google' | 'github') => {
    try {
      // Store login attempt for restoration after redirect
      localStorage.setItem('auth_login_attempt', provider);
      window.location.href = `/auth/${provider}`;
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Clear demo auth
      localStorage.removeItem('auth-user');
      localStorage.removeItem('is-authenticated');
      
      // Clear regular auth
      await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuthState();
    }
  };

  // Check if user has admin privileges
  const isAdminUser = (userEmail?: string) => {
    const adminEmails = [
              'admin@agritech.com',
      'seungjinyoun@gmail.com',
      // Add more admin emails as needed
    ];
    return userEmail ? adminEmails.includes(userEmail.toLowerCase()) : false;
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    saveAuthState,
    clearAuthState,
    isAdminUser: isAdminUser(user?.email),
  };
}