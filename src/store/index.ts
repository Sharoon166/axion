import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { createCartSlice, CartSlice } from './slices/cart-slice';

type StoreState = CartSlice; // if you only have cart now
// Later you can do: type StoreState = CartSlice & UserSlice & OtherSlice

export const useStore = create<StoreState>()(
  devtools((...a) => ({
    ...createCartSlice(...a),
  })),
);
