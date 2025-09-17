'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProductCard from '@/components/ProductCard';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  slug: string;
  featured?: boolean;
  discount?: number;
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
      <div className="px-4 sm:px-5 py-6 sm:py-8">
        <div className="max-w-[85rem] mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-white">Featured Products</h2>
            <p className="text-sm sm:text-base text-gray-600">Loading featured products...</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className="bg-[var(--color-primary-dark)] rounded-lg overflow-hidden animate-pulse"
              >
                <div className="w-full h-40 sm:h-48 bg-gray-700"></div>
                <div className="p-4 space-y-3">
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
    <div className="px-4 sm:px-5 py-6 sm:py-8">

      <div className="max-w-[85rem] mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Featured
            <span> Products</span></h2>
          <p className="text-sm sm:text-base text-gray-600">
            Discover our handpicked collection of premium lighting solutions
          </p>
        </div>
        {products.length === 0 ? (
          <div className="text-center py-12 max-w-[85rem] mx-auto">
            <div className=" rounded-lg p-8">
              <h3 className="text-xl font-semibold mb-4">No Featured Products Yet</h3>
              {user?.isAdmin && (
                <Button className='bg-(--color-logo) hover:bg-(--color-logo)/90' onClick={() => router.push('/admin/products/new')}>
                  Add Product
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 max-w-[85rem] mx-auto sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8 sm:mb-10">
              {products.map((product) => (
                <ProductCard
                  key={product._id}
                  id={product._id}
                  name={product.name}
                  price={product.price}
                  discount={product.discount}
                  img={(product.images && product.images[0]) ? product.images[0] : ''}
                  description={product.description}
                  href={`/product/${product.slug}`}
                />
              ))}
            </div>

            <div className="flex justify-center">
              <Link
                href="/category"
               className="inline-flex items-center bg-[var(--color-logo)] text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-medium shadow-md transition-colors group text-sm sm:text-base"
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
