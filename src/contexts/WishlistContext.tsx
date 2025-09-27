'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

interface WishlistItem {
  _id: string;
  name: string;
  price: number;
  image: string;
  images: string[];
  slug: string;
}

interface WishlistContextValue {
  wishlistItems: WishlistItem[];
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (id: string) => void;
  isInWishlist: (id: string) => boolean;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const { user } = useAuth();

  // Fetch wishlist from backend on mount or when user changes
  useEffect(() => {
    const fetchWishlist = async () => {
      if (!user?.id) return;
      try {
        const res = await fetch(`/api/wishlist?userId=${user.id}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setWishlistItems(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch wishlist:', err);
      }
    };
    fetchWishlist();
  }, [user]);

  const addToWishlist = async (item: WishlistItem) => {
    if (!user?.id) return;
    if (user?.isAdmin || user?.role === 'admin') return;
    
    // Optimistic update - add immediately
    setWishlistItems((prev) => [...prev, item]);
    
    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, productId: item._id })
      });
      const data = await res.json();
      if (!data.success) {
        // Revert optimistic update on failure
        setWishlistItems((prev) => prev.filter((i) => i._id !== item._id));
        console.error('Failed to add to wishlist:', data.error);
      }
    } catch (err) {
      // Revert optimistic update on error
      setWishlistItems((prev) => prev.filter((i) => i._id !== item._id));
      console.error('Failed to add to wishlist:', err);
    }
  };

  const removeFromWishlist = async (id: string) => {
    if (!user?.id) return;
    
    // Store the item for potential rollback
    const itemToRemove = wishlistItems.find((i) => i._id === id);
    
    // Optimistic update - remove immediately
    setWishlistItems((prev) => prev.filter((i) => i._id !== id));
    
    try {
      const res = await fetch(`/api/wishlist?userId=${user.id}&productId=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!data.success) {
        // Revert optimistic update on failure
        if (itemToRemove) {
          setWishlistItems((prev) => [...prev, itemToRemove]);
        }
        console.error('Failed to remove from wishlist:', data.error);
      }
    } catch (err) {
      // Revert optimistic update on error
      if (itemToRemove) {
        setWishlistItems((prev) => [...prev, itemToRemove]);
      }
      console.error('Failed to remove from wishlist:', err);
    }
  };

  const isInWishlist = (id: string) => wishlistItems.some((i) => i._id === id);

  return (
    <WishlistContext.Provider
      value={{ wishlistItems, addToWishlist, removeFromWishlist, isInWishlist }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export default function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within a WishlistProvider');
  return ctx;
}
