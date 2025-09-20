'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { ShoppingCart, Loader2, Star } from 'lucide-react';
import { getImageUrl, calculateSalePrice } from '@/lib/utils';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';
import Link from 'next/link';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  img: string[] | string; // Array for hover image effect
  href: string;
  discount?: number;
  saleEndsAt?: string;
  rating?: number; // Rating value (0-5)
  onAddToCart?: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  name,
  price,
  img,
  href,
  discount,
  saleEndsAt,
  id,
  rating = 4.5, // Default rating if not provided
}) => {
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOrderAdmin, setIsOrderAdmin] = useState(false);
  const { addToCart } = useCart();

  // Normalize images to always be an array
  const images = Array.isArray(img) ? img : [img];

  useEffect(() => {
    // Check if user is admin
    const userData = localStorage.getItem('userData');
    if (userData) {
      const user = JSON.parse(userData);
      setIsAdmin(user.role === 'admin');
      setIsOrderAdmin(user.role === 'order admin');
    }
  }, []);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setLoading(true);
    try {
      await addToCart({
        _id: id,
        name,
        price: discount ? calculateSalePrice(price, discount) : price,
        image: images[0],
        quantity: 1,
        slug: href,
        color: '',
        size: '',
        variants: [],
        addons: [],
      });
      toast.success('Added to cart!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
    } finally {
      setLoading(false);
    }
  };

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
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, '0');
      const seconds = String(Math.floor((diff / 1000) % 60)).padStart(2, '0');
      setTimeLeft(`${hours}:${minutes}:${seconds}`);
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
      </div>

      {/* Content */}
      <div className="px-4 py-2 flex flex-col flex-1">
        <h3 className="text-base font-medium text-black leading-snug mb-1 line-clamp-2">{name}</h3>

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
              {timeLeft && (
                <div className="mt-1">
                  <div className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full inline-flex items-center">
                    <span className="w-2 h-2 bg-red-600 rounded-full mr-1 animate-pulse"></span>
                    <span>Ends in {timeLeft}</span>
                  </div>
                </div>
              )}
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

          {/* Add to Cart Button - Hidden for admin */}
          {!isAdmin || !isOrderAdmin && (
            <div className="flex justify-end">
              <button
                onClick={handleAddToCart}
                disabled={loading}
                className="rounded-full bg-[var(--color-logo)] hover:bg-[var(--color-logo)]/90 p-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 text-white animate-spin" />
                ) : (
                  <ShoppingCart className="h-5 w-5 text-white" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
