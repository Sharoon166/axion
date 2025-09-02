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
        setUser(JSON.parse(userData));
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
        email,
        password,
      });

      if (result?.error) {
        throw new Error(result.error);
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
          image: session.user.image,
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
