'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getImageUrl, calculateSalePrice, isOnSale } from '@/lib/utils';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  img: string;
  href: string;
  description?: string;
  discount?: number;
  saleEndsAt?: string;
  onAddToCart?: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  name,
  price,
  img,
  href,
  description,
  discount,
  saleEndsAt,
}) => {
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  useEffect(() => {
    if (!saleEndsAt) { setTimeLeft(null); return; }
    const update = () => {
      const end = new Date(saleEndsAt).getTime();
      const diff = end - Date.now();
      if (isNaN(end) || diff <= 0) { setTimeLeft('00:00:00'); return; }
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
    <div className="bg-white rounded-xl shadow-md group border border-gray-200 overflow-hidden flex flex-col h-[390px]">
      {/* Image */}
      <div className="relative w-full h-40 sm:h-48 md:h-52 flex-shrink-0">
        <Image
          src={getImageUrl(img)}
          alt={name}
          fill
          className="object-cover group-hover:scale-105 transition-all duration-200"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
      </div>

      {/* Content */}
      <div className="p-4 bg-[#F4F4F4] flex flex-col flex-1 min-h-0">
        <h3 className="text-base sm:text-md text-black leading-snug mb-1 line-clamp-2 flex-shrink-0">
          {name}
        </h3>
        <div className="flex-1 min-h-0 mb-3">
          {description && !isOnSale(discount) && <p className="text-gray-600 text-sm line-clamp-2">{description}</p>}
        </div>
        <div className="mb-4 flex-shrink-0">
          {isOnSale(discount) ? (
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[var(--color-logo)] font-bold text-lg">
                Rs. {calculateSalePrice(price, discount || 0).toLocaleString()}
              </p>
              <p className="text-gray-400 line-through text-sm">Rs. {price.toLocaleString()}</p>
              <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-xs font-medium">
                {discount}% OFF
              </span>
            </div>
          ) : (
            <p className="text-[var(--color-logo)] font-bold text-lg">
              Rs. {price.toLocaleString()}
            </p>
          )}
        </div>

        {/* Button stays at bottom */}
        {saleEndsAt && timeLeft && (
          <div className="text-xs text-red-600 font-medium mb-2">⏰ Ends in {timeLeft}</div>
        )}
        <Link
          href={href}
          className="inline-flex w-full items-center justify-center bg-white shadow-sm rounded-lg border border-[#0D3361] px-4 py-2.5 text-sm font-medium text-slate-900 hover:bg-slate-50 transition-colors flex-shrink-0"
        >
          View Product
        </Link>
      </div>
    </div>
  );
};

export default ProductCard;
