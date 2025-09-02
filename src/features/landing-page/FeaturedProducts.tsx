'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
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

const FeaturedProducts = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeaturedProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products?featured=true&limit=6');
      const result = await response.json();

      if (result.success && result.data) {
        setProducts(result.data as Product[]);
      } else {
        console.error('Failed to fetch featured products:', result.error);
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching featured products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  if (loading) {
    return (
      <div className="bg-[#050B1B] px-4 sm:px-5 py-6 sm:py-8">
        <div className="max-w-[85rem] mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-white">Featured Products</h2>
            <p className="text-sm sm:text-base text-gray-600">Loading featured products...</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className="bg-[var(--color-primary-dark)] rounded-lg overflow-hidden animate-pulse"
              >
                <div className="w-full h-64 bg-gray-700"></div>
                <div className="p-5 space-y-3">
                  <div className="h-6 bg-gray-700 rounded"></div>
                  <div className="h-4 bg-gray-700 rounded"></div>
                  <div className="h-6 bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#050B1B] px-4 sm:px-5 py-6 sm:py-8">

      <div className="max-w-[85rem] mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-white">Featured
            <span className="text-[var(--color-primary-accent)]"> Products</span></h2>
          <p className="text-sm sm:text-base text-gray-600">
            Discover our handpicked collection of premium lighting solutions
          </p>
        </div>
        {user?.isAdmin && (
          <div className="flex justify-end">
            <Button onClick={() => router.push('/admin/products/new')}>
              Add Product
            </Button>
          </div>
        )}

        {products.length === 0 ? (
          <div className="text-center py-12 max-w-[85rem] mx-auto">
            <div className="bg-[var(--color-primary-dark)] rounded-lg p-8">
              <h3 className="text-xl font-semibold text-white mb-4">No Featured Products Yet</h3>
              <p className="text-gray-400 mb-6">
                Get started by adding your first featured product to showcase on the homepage.
              </p>
              {user?.isAdmin && (
                <Button onClick={() => router.push('/admin/products/new')}>
                  Add Product
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 max-w-[85rem] mx-auto sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-10">
              {products.map((product) => (
                <div
                  key={product._id}
                  className="bg-[var(--color-primary-dark)] rounded-lg overflow-hidden group"
                >
                  {/* Product Image */}
                  <div className="relative w-full h-48 sm:h-56 md:h-64">
                    {product.images && product.images.length > 0 ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                        <span className="text-gray-400">No image</span>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-4 sm:p-5">
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-gray-400 text-sm sm:text-base mb-3 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xl sm:text-2xl font-bold text-white">
                        ${product.price}
                      </span>
                      <Link
                        href={`/product/${product.slug}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        View Details
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center">
              <Link
                href="/product"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-logo)] text-white font-medium rounded-lg hover:bg-[var(--color-logo)]/90 transition-colors"
              >
                View All Products
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FeaturedProducts;
