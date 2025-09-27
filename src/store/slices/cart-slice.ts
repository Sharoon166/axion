import { StateCreator } from 'zustand';

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  variants?: Array<{
    variantName: string;
    optionValue: string;
    optionLabel?: string;
    subVariants?: Array<{
      subVariantName: string;
      optionValue: string;
      optionLabel?: string;
    }>;
  }>;
  image?: string;
};

export type CartSlice = {
  items: CartItem[];
  totalPrice: number;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
};

export const createCartSlice: StateCreator<CartSlice> = (set) => ({
  items: [],
  totalPrice: 0,

  addItem: (item: CartItem) => {
    set((state) => {
      // Create a unique key for the item based on product ID and variants
      const createItemKey = (cartItem: CartItem) => {
        const variantKey = cartItem.variants
          ? cartItem.variants
              .map(v => `${v.variantName}:${v.optionValue}${
                v.subVariants 
                  ? `[${v.subVariants.map(sv => `${sv.subVariantName}:${sv.optionValue}`).join(',')}]`
                  : ''
              }`)
              .join('|')
          : '';
        return `${cartItem.productId}${variantKey ? `_${variantKey}` : ''}`;
      };

      const newItemKey = createItemKey(item);
      const existingIndex = state.items.findIndex((i) => createItemKey(i) === newItemKey);
      let updatedItems;

      if (existingIndex >= 0) {
        updatedItems = [...state.items];
        updatedItems[existingIndex].quantity += item.quantity;
      } else {
        updatedItems = [...state.items, item];
      }

      const totalPrice = updatedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

      return { items: updatedItems, totalPrice };
    });
  },
  removeItem: (productId) => {
    set((state) => {
      const updatedItems = state.items.filter((i) => i.productId !== productId);
      const totalPrice = updatedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
      return { items: updatedItems, totalPrice };
    });
  },

  clearCart: () => set({ items: [], totalPrice: 0 }),
});
