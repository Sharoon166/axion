'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { ShoppingCart, Star } from 'lucide-react';
import { getImageUrl, calculateSalePrice } from '@/lib/utils';
import Link from 'next/link';
import { Button } from './ui/button';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  img: string | string[];
  href: string;
  rating?: number;
  discount?: number;
  stock?: number;
  inStock?: boolean;
  saleEndsAt?: string;
  variants?: Array<{
    name: string;
    options: Array<{
      label: string;
      value: string;
      customProperties?: Record<string, unknown>;
    }>;
  }>;
  onQuickView?: () => void;
  onAddToCart?: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  name,
  price,
  img,
  href,
  discount,
  saleEndsAt,
  rating = 0,
  onQuickView,
}) => {
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);

  // Normalize images to always be an array
  const images = Array.isArray(img) ? img : [img];

  useEffect(() => {
    // Admin check removed as it's not used in this component
  }, []);



  useEffect(() => {
    if (!saleEndsAt) {
      setTimeLeft(null);
      return;
    }
  
    const update = () => {
      const end = new Date(saleEndsAt).getTime();
      const diff = end - Date.now();
  
      if (isNaN(end) || diff <= 0) {
        setTimeLeft('00:00:00');
        return;
      }
  
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, '0');
      const seconds = String(Math.floor((diff / 1000) % 60)).padStart(2, '0');
  
      if (days > 1) {
        // Show in days if more than 1 day left
        setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      } else {
        // If exactly 1 day or less, show full countdown in hours
        const totalHours = Math.floor(diff / (1000 * 60 * 60));
        setTimeLeft(`${totalHours}:${minutes}:${seconds}`);
      }
    };
  
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [saleEndsAt]);
  
  // Check if product is on sale
  const isProductOnSale =
    discount !== undefined && discount > 0 && saleEndsAt && new Date(saleEndsAt) > new Date();

  return (
    <Link
      href={href}
      className="bg-white rounded-xl shadow-sm group border border-gray-200 overflow-hidden flex flex-col  transition-shadow"
    >
      <div
        className="relative overflow-hidden w-full h-76 cursor-pointer"
        onMouseEnter={() => images.length > 1 && setHovered(true)}
        onMouseLeave={() => images.length > 1 && setHovered(false)}
      >
        <Image
          src={getImageUrl(images.length > 1 && hovered ? images[1] : images[0])}
          alt={name}
          fill
          className="object-cover transition-all duration-300 ease-in-out group-hover:scale-105"
        />
        {timeLeft && (
          <div className="mt-1 absolute right-2 top-1 z-10">
            <div className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full inline-flex items-center">
              <span className="w-2 h-2 bg-red-600 rounded-full mr-1 animate-pulse"></span>
              <span>Ends in {timeLeft}</span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 py-2 flex flex-col flex-1">
        <h3 className="text-base font-medium text-black leading-snug mb-1 h-12 line-clamp-2">{name}</h3>
        


        <div className="flex items-center gap-2">
          {isProductOnSale ? (
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <p className="text-black font-bold text-lg">
                  Rs. {calculateSalePrice(price, discount || 0).toLocaleString()}
                </p>
                <p className="text-gray-500 line-through text-sm">Rs. {price.toLocaleString()}</p>
                <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {discount}% OFF
                </span>
              </div>

            </div>
          ) : (
            <p className="text-black font-bold text-lg">Rs. {price.toLocaleString()}</p>
          )}
        </div>

        {/* Rating Display */}
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${star <= Math.round(rating || 0) ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
                />
              ))}
            </div>
            <span className="text-sm font-medium text-gray-600 ml-1">
              {typeof rating === 'number' ? rating.toFixed(1) : 'N/A'}
            </span>
          </div>

          <div className="flex justify-end">
            <div className="flex gap-2">
              {/* <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onQuickView?.();
                }}
              >
                <Eye className="h-4 w-4 mr-2" /> Quick View
              </Button> */}
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onQuickView?.();
                }}
                className="flex-1 bg-[var(--color-logo)] hover:bg-[var(--color-logo)]/90 text-white"
                size="sm"
              >
                <ShoppingCart className="h-7 w-7" /> <span className="sr-only">Quick View</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
