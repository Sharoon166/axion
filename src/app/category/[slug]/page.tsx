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
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Product } from '@/types';
import Loading from '@/loading';

type BackendProduct = {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  price?: number;
  images?: string[];
  image?: string;
  category?: string | { name?: string } | null;
  stock?: number;
  slug: string;
  discount?: number;
};

const CategoryPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const params = useParams();
  const slug = params?.slug as string;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('default');

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
          const list = Array.isArray(result?.data) ? result.data : [];
          // Normalize API -> local Product shape
          const normalized = list.map((p: BackendProduct) => ({
            id: p._id ?? p.id,
            name: p.name,
            description: p.description ?? '',
            price: p.price ?? 0,
            // prefer first image in images[], fallback to image
            image: Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : (p.image ?? ''),
            category: typeof p.category === 'string' ? p.category : (p.category?.name ?? ''),
            inStock: typeof p.stock === 'number' ? p.stock > 0 : true,
            slug: p.slug,
          }));
          setProducts(normalized);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [slug]);

  const sortedProducts = React.useMemo(() => {
    // Apply sorting to all products
    switch (sortBy) {
      case 'price-low-high':
        return [...products].sort((a, b) => a.price - b.price);
      case 'price-high-low':
        return [...products].sort((a, b) => b.price - a.price);
      case 'name-a-z':
        return [...products].sort((a, b) => a.name.localeCompare(b.name));
      case 'name-z-a':
        return [...products].sort((a, b) => b.name.localeCompare(a.name));
      case 'newest':
        return [...products].reverse(); // Assuming newer products are at the end
      case 'popularity':
        return [...products].sort((a, b) => (b.discount || 0) - (a.discount || 0)); // Sort by discount as popularity indicator
      default:
        return products;
    }
  }, [products, sortBy]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = sortedProducts.slice(startIndex, startIndex + itemsPerPage);

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
        {/* Sort Controls */}
        <div className="bg-gray-50 p-4 rounded-xl shadow-sm mb-12">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold text-gray-800">Sort Products</h3>
              <div className="text-sm text-gray-600">Showing {sortedProducts.length} products</div>
            </div>

            <div className="flex items-center gap-4">
              {/* Sort By */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Sort by:</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Default" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="price-low-high">Price: Low to High</SelectItem>
                    <SelectItem value="price-high-low">Price: High to Low</SelectItem>
                    <SelectItem value="name-a-z">Name: A to Z</SelectItem>
                    <SelectItem value="name-z-a">Name: Z to A</SelectItem>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="popularity">Most Popular</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {user?.isAdmin && (
                <Button
                  className="bg-(--color-logo) hover:bg-(--color-logo)"
                  onClick={() => router.push('/admin/products/new')}
                >
                  Add Product
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <Loading />
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <Package className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Category not found</h3>
            <p className="mt-1 text-gray-500">
              The category you&apos;re looking for doesn&apos;t exist or has no products.
            </p>
            <div className="mt-6">
              <Link
                href="/category"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[var(--color-logo)] hover:bg-[var(--color-logo)]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-logo)]"
              >
                Browse all categories
              </Link>
            </div>
          </div>
        ) : currentItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {currentItems.map((item, index) => (
              <ProductCard
                key={item.id || index}
                id={item.id}
                name={item.name}
                price={item.price}
                discount={item.discount}
                img={item.image || '/prodcut-1.jpg'}
                href={`/product/${item.slug}`}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="w-12 h-12 mx-auto text-gray-300" />
            <h4 className="mt-4 text-gray-500">No products found</h4>
            <p className="text-sm text-gray-400 mt-1">
              Try adjusting your filters or check back later
            </p>
          </div>
        )}

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(sortedProducts.length / itemsPerPage)}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default CategoryPage;
