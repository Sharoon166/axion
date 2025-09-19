'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { ShoppingCart, Loader2, Star } from 'lucide-react';
import { getImageUrl, calculateSalePrice, isOnSale } from '@/lib/utils';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import Link from 'next/link';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  img: string[]; // Array for hover image effect
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
  const { addToCart } = useCart();
  const { user } = useAuth();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error('Please login to add items to cart');
      return;
    }

    setLoading(true);
    try {
      await addToCart({
        _id:id,
        name,
        price: discount ? calculateSalePrice(price, discount) : price,
        image: img[0],
        quantity: 1,
        slug: href,
        color: '',
        size: '',
        variants: [],
        addons: []
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

  return (
    <Link href={href} className="bg-white rounded-xl shadow-sm group border border-gray-200 overflow-hidden flex flex-col sm:w-[320px] w-[370px] transition-shadow">
      <div
        className="relative overflow-hidden w-full h-76 cursor-pointer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <Image
          src={getImageUrl(hovered && img[1] ? img[1] : img[0])}
          alt={name}
          fill
          className="object-cover transition-all duration-300 ease-in-out group-hover:scale-105"
        />
      </div>

      {/* Content */}
      <div className="px-4 py-2  flex flex-col flex-1">
        <h3 className="text-base font-medium text-black leading-snug mb-1 line-clamp-2">{name}</h3>

        <div className="flex items-center">
          {isOnSale(discount) ? (
            <>
              <p className="text-black font-semibold text-md">
                Rs. {calculateSalePrice(price, discount || 0).toLocaleString()}
              </p>
              <p className="text-gray-400 line-through text-sm">Rs. {price.toLocaleString()}</p>
              <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-xs font-medium">
                {discount}% OFF
              </span>
            </>
          ) : (
            <p className="text-black font-bold text-lg">
              Rs. {price.toLocaleString()}
            </p>
          )}
        </div>

        {saleEndsAt && timeLeft && (
          <div className="text-xs text-red-600 font-medium mb-2">⏰ Ends in {timeLeft}</div>
        )}

        {/* Rating Display */}
        <div className="flex items-center justify-between mt-1 mb-2">
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

          {/* Add to Cart Button */}
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
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
