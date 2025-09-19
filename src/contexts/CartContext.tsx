'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { SelectedVariant, SelectedAddon } from '@/lib/productVariants';

export interface CartItem {
  _id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  color: string;
  size: string;
  slug: string;
  variants?: SelectedVariant[];
  addons?: SelectedAddon[];
  // Optional sale metadata for display in order flows
  saleName?: string;
  salePercent?: number;
  
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    try {
      const userData = JSON.parse(localStorage.getItem('userData') || 'null');
      if (userData?.isAdmin || userData?.role === 'admin') {
        return; // block admins from adding to cart
      }
    } catch {}
    const quantity = item.quantity || 1;
    
    // Helper function to compare variants and addons
    const compareVariants = (v1?: SelectedVariant[], v2?: SelectedVariant[]) => {
      if (!v1 && !v2) return true;
      if (!v1 || !v2 || v1.length !== v2.length) return false;
      return v1.every(variant => 
        v2.some(v => v.variantName === variant.variantName && v.optionValue === variant.optionValue)
      );
    };
    
    const compareAddons = (a1?: SelectedAddon[], a2?: SelectedAddon[]) => {
      if (!a1 && !a2) return true;
      if (!a1 || !a2 || a1.length !== a2.length) return false;
      return a1.every(addon => 
        a2.some(a => a.addonName === addon.addonName && a.optionLabel === addon.optionLabel && a.quantity === addon.quantity)
      );
    };
    
    const existingItemIndex = cartItems.findIndex(
      (cartItem) => 
        cartItem._id === item._id && 
        cartItem.color === item.color && 
        cartItem.size === item.size &&
        compareVariants(cartItem.variants, item.variants) &&
        compareAddons(cartItem.addons, item.addons)
    );

    if (existingItemIndex > -1) {
      // Update existing item quantity
      const updatedItems = [...cartItems];
      updatedItems[existingItemIndex].quantity += quantity;
      setCartItems(updatedItems);
    } else {
      // Add new item
      setCartItems([...cartItems, { ...item, quantity }]);
    }
  };

  const removeFromCart = (id: string) => {
    setCartItems(cartItems.filter(item => item._id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    
    setCartItems(cartItems.map(item => 
      item._id === id ? { ...item, quantity } : item
    ));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalPrice,
        getTotalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
