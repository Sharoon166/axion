'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { SelectedVariant, SelectedAddon } from '@/lib/productVariants';

export type EnhancedVariant = SelectedVariant;

export interface CartItem {
  _id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  color: string;
  size: string;
  slug: string;
  variants?: EnhancedVariant[];
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

  const addToCart = async (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    try {
      const userData = JSON.parse(localStorage.getItem('userData') || 'null');
      if (userData?.isAdmin || userData?.role === 'admin') {
        return; // block admins from adding to cart
      }
    } catch {}

    const quantity = item.quantity || 1;

    try {
      // Fetch the current product stock
      const response = await fetch(`/api/products/${item.slug}`);
      if (!response.ok) {
        throw new Error('Failed to fetch product details');
      }
      const productData = await response.json();
      const product = productData.data;

      if (!product) {
        toast.error('Product not found');
        return;
      }

      // Helper function to compare variants including sub-variants and sub-sub-variants
      const compareVariants = (v1?: EnhancedVariant[], v2?: EnhancedVariant[]) => {
        if (!v1 && !v2) return true;
        if (!v1 || !v2 || v1.length !== v2.length) return false;
        return v1.every((variant) => {
          const matchingVariant = v2.find(
            (v) => v.variantName === variant.variantName && v.optionValue === variant.optionValue,
          );
          if (!matchingVariant) return false;

          // Compare sub-variants
          const sv1 = variant.subVariants || [];
          const sv2 = matchingVariant.subVariants || [];
          if (sv1.length !== sv2.length) return false;

          return sv1.every((subVariant) => {
            const matchingSubVariant = sv2.find(
              (sv) =>
                sv.subVariantName === subVariant.subVariantName &&
                sv.optionValue === subVariant.optionValue,
            );
            if (!matchingSubVariant) return false;

            // Compare sub-sub-variants
            const ssv1 = subVariant.subSubVariants || [];
            const ssv2 = matchingSubVariant.subSubVariants || [];
            if (ssv1.length !== ssv2.length) return false;

            return ssv1.every((subSubVariant) =>
              ssv2.some(
                (ssv) =>
                  ssv.subSubVariantName === subSubVariant.subSubVariantName &&
                  ssv.optionValue === subSubVariant.optionValue,
              ),
            );
          });
        });
      };

      const compareAddons = (a1?: SelectedAddon[], a2?: SelectedAddon[]) => {
        if (!a1 && !a2) return true;
        if (!a1 || !a2 || a1.length !== a2.length) return false;
        return a1.every((addon) =>
          a2.some(
            (a) =>
              a.addonName === addon.addonName &&
              a.optionLabel === addon.optionLabel &&
              a.quantity === addon.quantity,
          ),
        );
      };

      // Calculate total quantity in cart for this specific variant combination (including this addition)
      const existingItemQuantity = cartItems
        .filter((cartItem) => 
          cartItem._id === item._id &&
          cartItem.color === item.color &&
          cartItem.size === item.size &&
          compareVariants(cartItem.variants, item.variants) &&
          compareAddons(cartItem.addons, item.addons)
        )
        .reduce((total, cartItem) => total + cartItem.quantity, 0);

      const newTotalQuantity = existingItemQuantity + quantity;

      // Calculate available stock based on selected variants (only check leaf nodes)
      let availableStock = 0;
      if (item.variants && item.variants.length > 0 && product.variants) {
        let minStock = Infinity;

        for (const selectedVariant of item.variants) {
          const productVariant = product.variants.find(
            (v: { name: string }) => v.name === selectedVariant.variantName,
          );
          if (!productVariant) continue;

          const option = productVariant.options.find(
            (o: { value: string; label: string }) =>
              o.value === selectedVariant.optionValue || o.label === selectedVariant.optionValue,
          );
          if (!option) continue;

          // Check sub-variants if they exist
          if (selectedVariant.subVariants && selectedVariant.subVariants.length > 0) {
            for (const subVariant of selectedVariant.subVariants) {
              const productSubVariant = option.subVariants?.find(
                (sv: { name: string }) => sv.name === subVariant.subVariantName,
              );
              if (!productSubVariant) continue;

              const subOption = productSubVariant.options.find(
                (so: { value: string; label: string }) =>
                  so.value === subVariant.optionValue || so.label === subVariant.optionValue,
              );
              if (!subOption) continue;

              // Check sub-sub-variants if they exist
              if (subVariant.subSubVariants && subVariant.subSubVariants.length > 0) {
                for (const subSubVariant of subVariant.subSubVariants) {
                  const productSubSubVariant = subOption.subSubVariants?.find(
                    (ssv: { name: string }) => ssv.name === subSubVariant.subSubVariantName,
                  );
                  if (!productSubSubVariant) continue;

                  const subSubOption = productSubSubVariant.options.find(
                    (sso: { value: string; label: string }) =>
                      sso.value === subSubVariant.optionValue ||
                      sso.label === subSubVariant.optionValue,
                  );
                  if (subSubOption) {
                    // This is a leaf node (sub-sub-option), use its stock
                    minStock = Math.min(minStock, subSubOption.stock || 0);
                  }
                }
              } else {
                // This is a leaf node (sub-option with no sub-sub-variants), use its stock
                minStock = Math.min(minStock, subOption.stock || 0);
              }
            }
          } else {
            // This is a leaf node (option with no sub-variants), use its stock
            minStock = Math.min(minStock, option.stock || 0);
          }
        }

        availableStock = minStock === Infinity ? 0 : minStock;
        console.log('CartContext stock calculation:', {
          minStock,
          availableStock,
          selectedVariants: item.variants,
        });
      } else {
        // Fallback: if no variants selected, product is out of stock
        availableStock = 0;
      }

      // Check if requested quantity exceeds available stock
      if (newTotalQuantity > availableStock) {
        console.log('Stock validation failed:', {
          availableStock,
          newTotalQuantity,
          variants: item.variants,
          productVariants: product.variants,
        });
        toast.error(`Only ${availableStock} items available in stock for selected variant`);
        return;
      }

      const existingItemIndex = cartItems.findIndex(
        (cartItem) =>
          cartItem._id === item._id &&
          cartItem.color === item.color &&
          cartItem.size === item.size &&
          compareVariants(cartItem.variants, item.variants) &&
          compareAddons(cartItem.addons, item.addons),
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
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart. Please try again.');
    }
  };

  const removeFromCart = (id: string) => {
    setCartItems(cartItems.filter((item) => item._id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }

    setCartItems(cartItems.map((item) => (item._id === id ? { ...item, quantity } : item)));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
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
