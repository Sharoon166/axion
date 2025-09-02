'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  slug: string;
  featured?: boolean;
  category?: {
    name: string;
    slug: string;
  };
}

const SaleSection = () => {
  const { user } = useAuth();
  const [timeLeft, setTimeLeft] = useState('22:13:49');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSaleProducts = async () => {
    try {
      setLoading(true);
      // Fetch featured products for sale section
      const response = await fetch('/api/products?featured=true&limit=3');
      const result = await response.json();

      if (result.success && result.data) {
        setProducts(result.data as Product[]);
      } else {
        console.error('Failed to fetch sale products:', result.error);
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching sale products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSaleProducts();
  }, []);

  // Calculate discount percentage (mock calculation for display)
  const calculateDiscount = (price: number, index: number) => {
    const discounts = [15, 12, 9]; // Mock discount percentages
    const discount = discounts[index % discounts.length];
    const oldPrice = Math.round(price * (1 + discount / 100));
    return {
      discount: `${discount}% OFF`,
      oldPrice: `$${oldPrice}`,
      newPrice: `$${price}`
    };
  };

  // Countdown timer simulation
  useEffect(() => {
    const targetTime = new Date().getTime() + 22 * 60 * 60 * 1000 + 13 * 60 * 1000 + 49 * 1000;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetTime - now;

      if (distance <= 0) {
        clearInterval(timer);
        setTimeLeft('00:00:00');
        return;
      }

      const hours = String(Math.floor((distance / (1000 * 60 * 60)) % 24)).padStart(2, '0');
      const minutes = String(Math.floor((distance / (1000 * 60)) % 60)).padStart(2, '0');
      const seconds = String(Math.floor((distance / 1000) % 60)).padStart(2, '0');

      setTimeLeft(`${hours}:${minutes}:${seconds}`);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-8 sm:py-10 px-4 sm:px-5 bg-gray-50 text-center">
      <h2 className="text-2xl sm:text-3xl font-bold text-blue-600">
        On Sale <span className="text-black">Now</span>
      </h2>
      <p className="text-sm sm:text-base text-gray-600 mt-1 px-4">
        Limited-time deals on our best lights, don&apos;t miss out.
      </p>

      <div className="mt-3 text-red-600 font-semibold flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
        <span className="text-sm sm:text-base">⏰ Sale Ends in</span>
        <span className="text-red-700 font-bold text-sm sm:text-base">{timeLeft}</span>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-10">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="bg-white shadow-md rounded-xl overflow-hidden animate-pulse"
            >
              <div className="w-full h-48 sm:h-56 md:h-64 bg-gray-300"></div>
              <div className="p-4 sm:p-5 space-y-3">
                <div className="h-6 bg-gray-300 rounded"></div>
                <div className="h-4 bg-gray-300 rounded"></div>
                <div className="h-6 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 mt-8">
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">No Sale Products Yet</h3>
            <p className="text-gray-600 mb-6">
              Add some featured products to showcase in the sale section.
            </p>
            {user?.isAdmin && (
              <Link
                href="/admin"
                className="inline-flex items-center bg-[var(--color-logo)] text-white px-6 py-3 rounded-lg font-medium"
              >
                Add Products
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-10">
          {products.map((product, index) => {
            const priceInfo = calculateDiscount(product.price, index);
            return (
              <Link
                key={product._id}
                href={`/product/${product.slug}`}
                className="bg-white shadow-md rounded-xl overflow-hidden relative flex flex-col hover:shadow-lg transition-shadow duration-300"
              >
                {/* Discount Badge */}
                <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs sm:text-sm font-semibold px-2 py-1 rounded-full z-10">
                  {priceInfo.discount}
                </div>
                
                {/* Product Image */}
                <div className="relative w-full h-48 sm:h-56 md:h-64">
                  {product.images && product.images.length > 0 ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400">No image</span>
                    </div>
                  )}
                </div>
                
                <div className="p-4 sm:p-5 text-left flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold line-clamp-1">{product.name}</h3>
                    <p className="text-gray-600 text-xs sm:text-sm mt-1 line-clamp-2">{product.description}</p>
                    <div className="mt-2 sm:mt-3">
                      <span className="text-[var(--color-primary)] font-bold text-sm sm:text-base">{priceInfo.newPrice}</span>
                      <span className="line-through text-gray-400 text-xs sm:text-sm ml-2">
                        {priceInfo.oldPrice}
                      </span>
                    </div>
                  </div>
                  <span className="border border-primary w-full text-primary px-3 py-2 sm:px-4 sm:py-2 rounded-lg mt-3 sm:mt-4 block text-center bg-white transition-colors duration-300 hover:bg-primary hover:text-white font-medium cursor-pointer text-sm sm:text-base">
                    Shop Now
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <Link
        href="/product"
        className="inline-flex mt-4 sm:mt-6 items-center bg-[var(--color-logo)] text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-medium shadow-md transition-colors group text-sm sm:text-base"
      >
        Explore Sale
        <span className="ml-2 inline-block transform transition-transform duration-300 group-hover:translate-x-2">
          <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
        </span>
      </Link>
    </section>
  );
};

export default SaleSection;
