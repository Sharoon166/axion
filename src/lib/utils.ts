import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a given phone number string into a standard format
 * @param {string} num - The phone number string to format
 * @returns {string} The formatted phone number string
 * @example
 * formatPhoneNumber('0300123456') => '+92 30 0123456'
 * formatPhoneNumber('9230123456789') => '+92 30123456789'
 */
export const formatPhoneNumber = (num: string) => {
  if (num.startsWith('0')) {
    return `+92 ${num.slice(1, 4)} ${num.slice(4)}`;
  } else if (num.length >= 2) {
    return `+${num.slice(0, 2)} ${num.slice(2, 5)} ${num.slice(5)}`;
  }
  return num;
};


/**
 * Converts a relative or absolute image URL to a full URL
 * @param imageUrl - The image URL (can be relative or absolute)
 * @returns Full URL for the image
 */
export function getImageUrl(imageUrl: string): string {
  if (!imageUrl) return '/404-error-page.jpg'; // reliable fallback image that exists in public/
  
  // If it's already a full URL, return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // For relative URLs, normalize to start with '/'
  // Returning a relative path avoids Next/Image remotePatterns restrictions
  const cleanUrl = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  return cleanUrl;
}

/**
 * Formats a price number to a localized string
 * @param price - The price number
 * @returns Formatted price string
 */
export function formatPrice(price: number): string {
  return price.toLocaleString();
}

/**
 * Calculates the sale price based on original price and discount percentage
 * @param originalPrice - The original price
 * @param discountPercentage - The discount percentage (e.g., 20 for 20% off)
 * @returns The calculated sale price
 */
export function calculateSalePrice(originalPrice: number, discountPercentage: number): number {
  if (discountPercentage <= 0 || discountPercentage >= 100) {
    return originalPrice;
  }
  return Math.round(originalPrice * (1 - discountPercentage / 100));
}

/**
 * Checks if a product is on sale based on discount percentage
 * @param discountPercentage - The discount percentage
 * @returns True if the product is on sale
 */
export function isOnSale(discountPercentage?: number): boolean {
  return discountPercentage !== undefined && discountPercentage > 0;
}