import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts a relative or absolute image URL to a full URL
 * @param imageUrl - The image URL (can be relative or absolute)
 * @returns Full URL for the image
 */
export function getImageUrl(imageUrl: string): string {
  if (!imageUrl) return '/prodcut-1.jpg'; // fallback image
  
  // If it's already a full URL, return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // For relative URLs, construct full URL
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const cleanUrl = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  
  return `${baseUrl}${cleanUrl}`;
}

/**
 * Formats a price number to a localized string
 * @param price - The price number
 * @returns Formatted price string
 */
export function formatPrice(price: number): string {
  return price.toLocaleString();
}