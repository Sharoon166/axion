import { useEffect, useState } from 'react';
import { signIn as nextAuthSignIn, signOut as nextAuthSignOut } from 'next-auth/react';

export interface UserData {
  id: string;
  name?: string | null;
  email?: string | null;
  role: 'user' | 'admin';
  image?: string | null;
  isAdmin?: boolean;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
}

export const useLocalAuth = () => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const userData = localStorage.getItem('userData');

    if (userData) {
      try {
        const parsedUserData = JSON.parse(userData);
        // Only check for user-specific uploaded avatar URL
        const uploadedAvatarUrl = localStorage.getItem(`uploadedAvatarUrl_${parsedUserData.id}`);
        if (uploadedAvatarUrl) {
          parsedUserData.image = uploadedAvatarUrl;
        }
        setUser(parsedUserData);
      } catch (error) {
        console.error('Failed to parse user data', error);
        localStorage.removeItem('userData');
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const result = await nextAuthSignIn('credentials', {
        redirect: false,
        email: email.trim(),
        password: password.trim(),
      });

      if (result?.error) {
        console.error('NextAuth sign in error:', result.error);
        // Map common NextAuth errors to user-friendly messages
        let errorMessage = 'Invalid email or password';
        
        // Add more specific error messages based on the error type
        if (result.error.includes('No account found')) {
          errorMessage = 'No account found with this email';
        } else if (result.error.includes('password')) {
          errorMessage = 'Invalid password';
        } else if (result.error.includes('configuration')) {
          errorMessage = 'Authentication service is not properly configured';
        }
        
        return { success: false, error: errorMessage };
      }

      // Get the session data
      const response = await fetch('/api/auth/session');
      const session = await response.json();

      if (session?.user) {

        const userData = {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          role: session.user.role || 'user',
          isAdmin: session.user.isAdmin || false,
          image: session.user.image || null, // Use user-specific uploaded avatar or backend avatar
          address: session.user.address || null,
          phone: session.user.phone || null,
        };

        localStorage.setItem('userData', JSON.stringify(userData));
        setUser(userData);
      }

      return { success: true };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Sign in failed' };
    }
  };

  const signOut = async () => {
    await nextAuthSignOut({ redirect: false });
    localStorage.removeItem('userData');
    // Clean up any global localStorage keys that might cause cross-user contamination
    localStorage.removeItem('uploadedAvatarUrl');
    setUser(null);
  };

  return {
    user,
    loading,
    signIn,
    signOut,
    isAuthenticated: !!user,
  };
};

export default useLocalAuth;
