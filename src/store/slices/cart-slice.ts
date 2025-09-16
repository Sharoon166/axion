import { StateCreator } from 'zustand';

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
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
      const existingIndex = state.items.findIndex((i) => i.productId === item.productId);
      let updatedItems;

      if (existingIndex >= 0) {
        updatedItems = [...state.items];
        updatedItems[existingIndex].quantity += item.quantity;
      } else {
        updatedItems = [...state.items, item];
      }

      const totalPrice = updatedItems.reduce((acc, item) => acc + item.price, 0);

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
