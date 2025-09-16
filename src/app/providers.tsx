'use client';

import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { WishlistProvider } from '@/contexts/WishlistContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider 
      refetchInterval={0} 
      refetchOnWindowFocus={false}
    >
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            {children}
            <Toaster position="top-center" richColors closeButton />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </SessionProvider>
  );
}
