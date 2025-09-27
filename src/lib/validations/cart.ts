import { z } from 'zod';

export const cartItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Product name is required'),
  price: z.number().positive('Price must be positive'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  image: z.string().url('Invalid image URL'),
  variants: z.array(z.object({
    variantName: z.string(),
    optionValue: z.string(),
    optionLabel: z.string().optional(),
    subVariants: z.array(z.object({
      subVariantName: z.string(),
      optionValue: z.string(),
      optionLabel: z.string().optional(),
    })).optional(),
  })).optional(),
});

export const addToCartSchema = cartItemSchema.omit({ id: true });

export type CartItem = z.infer<typeof cartItemSchema>;
export type AddToCart = z.infer<typeof addToCartSchema>;
