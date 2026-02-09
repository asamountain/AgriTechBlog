import React, { useState } from 'react';
import { useAuthContext } from './auth-provider';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog';
import { Chrome } from 'lucide-react';
import { InlineSpinner } from '@/components/loading-animations';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const { signInWithGoogle } = useAuthContext();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      
      const result = await signInWithGoogle();
      
      if (result?.user) {
        onSuccess?.();
        onClose();
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      // You could show a toast error here
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            Sign in to Comment
          </DialogTitle>
          <DialogDescription className="text-center">
            Sign in with your Google account to start commenting
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Google Sign In */}
          <Button
            variant="outline"
            className="w-full h-12 text-base border-forest-green text-forest-green hover:bg-forest-green hover:text-white transition-colors"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            {loading ? (
              <InlineSpinner size="md" color="text-forest-green" className="mr-2" />
            ) : (
              <Chrome className="mr-2 h-5 w-5" />
            )}
            Continue with Google
          </Button>
        </div>

        <div className="text-center text-sm text-gray-500">
          By signing in, you agree to our terms of service and privacy policy
        </div>
      </DialogContent>
    </Dialog>
  );
}
