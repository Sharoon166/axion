'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import Pagination from '@/components/Pagination';
// import Image from 'next/image';

import ProductCard from '@/components/ProductCard';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

const CategoryPage = () => {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Countdown Timer for Sale (HH:MM:SS style)
  const [timeLeft, setTimeLeft] = React.useState('22:13:49');
  React.useEffect(() => {
    if (slug === 'sale') {
      // Set target time to 22:13:49 from now
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
    }
  }, [slug]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch products based on category
  React.useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let apiUrl = '/api/products';
        if (slug === 'sale') {
          apiUrl += '?featured=true';
        } else if (slug !== 'all') {
          apiUrl += `?category=${slug}`;
        }

        const response = await fetch(apiUrl);
        if (response.ok) {
          const result = await response.json();
          const products = result.success ? result.data : [];
          setProducts(products);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [slug]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = products.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div>
      {/* Header */}
      <PageHeader
        title={slug.charAt(0).toUpperCase() + slug.slice(1)}
        titleHighlight="Lighting"
        subtitle="Illuminate every corner with elegance."
      />

      {/* Countdown Timer for Sale (styled like OnSale.tsx) */}
      {slug === 'sale' && (
        <div className="mt-3 text-red-600 font-semibold flex items-center justify-center gap-2 mb-6">
          <span>⏰ Sale Ends in</span>
          <span className="text-red-700 font-bold">{timeLeft}</span>
        </div>
      )}

      <div className="max-w-[85rem] mx-auto px-4 sm:px-6 py-10">
        {/* Filters */}
        <div className="flex flex-wrap justify-between items-center gap-6 mb-12 bg-gray-50 p-5 rounded-xl shadow-sm">
          {/* Category Select */}
          <div className="flex items-center gap-4">
            <Select>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Indoor Lights" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Indoor Lights</SelectItem>
                <SelectItem value="wall">Wall Lamps</SelectItem>
                <SelectItem value="chandelier">Chandeliers</SelectItem>
              </SelectContent>
            </Select>

            {/* Price Select */}
            <Select>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Price Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Rs. 3,000 - Rs. 8,000</SelectItem>
                <SelectItem value="mid">Rs. 8,000 - Rs. 20,000</SelectItem>
                <SelectItem value="high">Above Rs. 20,000</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-x-4">
            <Button variant="ghost" className="ml-auto text-gray-500 hover:text-black">
              Clear Filters
            </Button>
            <Button onClick={() => router.push('/admin/products/new')}>
              Add Product
            </Button>
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading products...</p>
          </div>
        ) : currentItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {currentItems.map((item, index) => (
              <ProductCard
                key={item._id || item.id || item.slug || index}
                id={item._id || item.id}
                name={item.name}
                price={item.price}
                img={item.images?.[0] || item.image || item.img || '/prodcut-1.jpg'}
                href={`/product/${item.slug}`}
                onAddToCart={() => { }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="w-12 h-12 mx-auto text-gray-300" />
            <h4 className="mt-4 text-gray-500">No products found</h4>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or check back later</p>
          </div>
        )}

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(products.length / itemsPerPage)}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default CategoryPage;
