import { useEffect, useState } from 'react';
import { signIn as nextAuthSignIn, signOut as nextAuthSignOut } from 'next-auth/react';

export interface UserData {
  id: string;
  name?: string | null;
  email?: string | null;
  role: 'user' | 'admin' | 'order admin' | 'dev admin';
  image?: string | null;
  isAdmin?: boolean;
  isOrderAdmin?: boolean;
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
      // Basic validation
      if (!email || !password) {
        return { success: false, error: 'Please enter both email and password' };
      }

      const result = await nextAuthSignIn('credentials', {
        redirect: false,
        email: email.trim(),
        password: password.trim(),
        callbackUrl: '/',
      });

      if (result?.error) {
        console.error('NextAuth sign in error:', result.error);

        // Map common NextAuth errors to user-friendly messages
        let errorMessage = 'Invalid email or password';

        if (result.error.includes('No account found')) {
          errorMessage = 'No account found with this email';
        } else if (result.error.includes('password')) {
          errorMessage = 'Invalid password';
        } else if (result.error.includes('configuration')) {
          errorMessage = 'Authentication service is not properly configured';
        } else if (result.error.includes('CallbackRouteError')) {
          errorMessage = 'Authentication service error. Please try again later.';
        }

        return { success: false, error: errorMessage };
      }

      // Get the session data
      const response = await fetch('/api/auth/session');

      if (!response.ok) {
        console.error('Failed to fetch session:', response.status, response.statusText);
        return {
          success: false,
          error: 'Authentication service is currently unavailable. Please try again later.',
        };
      }

      let session;
      try {
        session = await response.json();
      } catch (error) {
        console.error('Failed to parse session data:', error);
        return {
          success: false,
          error: 'Invalid response from authentication service. Please try again.',
        };
      }

      if (!session?.user) {
        console.error('No user data in session:', session);
        return {
          success: false,
          error: 'Failed to retrieve user data. Please try again.',
        };
      }

      const userData = {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role || 'user',
        isAdmin: session.user.isAdmin || false,
        image: session.user.image || null,
        address: session.user.address || null,
        phone: session.user.phone || null,
      };

      localStorage.setItem('userData', JSON.stringify(userData));
      setUser(userData);

      return { success: true };
    } catch (error) {
      console.error('Sign in error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign in failed',
      };
    }
  };

  const signOut = async () => {
    await nextAuthSignOut({ redirect: false });
    localStorage.removeItem('userData');
    // Clean up any global localStorage keys that might cause cross-user contamination
    localStorage.removeItem('uploadedAvatarUrl');
    // Clear cart on logout
    localStorage.removeItem('cart');
    // Clear wishlist on logout
    localStorage.removeItem('wishlist');
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
