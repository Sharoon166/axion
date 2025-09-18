'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { useState, useEffect } from 'react';
import { getImageUrl } from '@/lib/utils';
import Loading from '@/loading';

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  productCount?: number;
}

const ProductsPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const result = await response.json();
          console.log('API Response:', result); // Debug log
          if (result.success) {
            console.log('Categories data:', result.data); // Debug log
            setCategories(result.data || []);
          }
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Page Header */}
      <PageHeader
        title="Our"
        titleHighlight="Products"
        subtitle="Explore our premium lighting collection."
      />

      {/* Product Categories */}
      <section>
        <div className="max-w-[85rem] mx-auto mt-10 px-8 sm:px-6">
          {loading ? (
            <Loading />
          ) : categories.length > 0 ? (
            categories.map((category, index) => (
              <div
                key={category._id || category.slug || index}
                className="relative rounded-xl mb-10 overflow-hidden md:col-span-2 group"
              >
                <Image
                  src={getImageUrl(category.image || '')}
                  alt={category.name || 'Product category'}
                  width={1200}
                  height={400}
                  className="w-full h-72 object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    console.log(
                      'Image failed to load:',
                      category.image,
                      'for category:',
                      category.name,
                    );
                    e.currentTarget.src = '/prodcut-1.jpg';
                  }}
                />

                {/* Dark overlay with gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/30"></div>

                <div className="absolute inset-0 p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-white text-2xl font-bold drop-shadow-md">
                      {category.name.toUpperCase()}
                    </h3>
                    <p className="text-white/90 mt-2 max-w-lg">
                      {category.description || 'Explore our collection'}
                    </p>
                    {category.productCount && (
                      <p className="text-white/80 mt-1">{category.productCount} Items</p>
                    )}
                  </div>

                  {/* Enhanced button with better hover effects */}
                  <Link
                    href={`/category/${category.slug}`}
                    className="inline-flex items-center bg-white/20 text-white px-5 py-2.5 rounded-full mt-4 w-fit backdrop-blur-sm 
                    transition-all duration-300 hover:bg-white/30 hover:px-6 hover:shadow-lg"
                    aria-label={`Explore ${category.name}`}
                  >
                    <span>Explore</span>
                    <ArrowUpRight className="ml-2 w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="w-12 h-12 mx-auto text-gray-300 mb-4">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <h4 className="text-gray-500">No categories found</h4>
              <p className="text-sm text-gray-400 mt-1">Add some categories to get started</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ProductsPage;
