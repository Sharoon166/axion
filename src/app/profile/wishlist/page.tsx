'use client';

import { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import Pagination from '@/components/Pagination';
import { X, HeartOff, ArrowRight } from 'lucide-react';
import useWishlist from '@/contexts/WishlistContext';
import { toast } from 'sonner';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';

export default function WishlistPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const { wishlistItems, removeFromWishlist } = useWishlist();

  const itemsPerPage = 6;
  const totalPages = Math.ceil(wishlistItems.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = wishlistItems.slice(startIndex, startIndex + itemsPerPage);

  const handleRemoveFromWishlist = async (id: string) => {
    try {
      await removeFromWishlist(id);
      toast.success('Item removed from wishlist');
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
    }
  };

  interface WishlistItem {
    _id: string;
    name: string;
    slug: string;
    price: number;
    rating?: number;
    image?: string;
    images?: string[];
    description?: string;
    discount?: number;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="My"
        titleHighlight="Wishlist"
        subtitle="Save the products you love for later"
      />

      <div className="max-w-[85rem] mx-auto px-4 py-8">
        {paginatedItems.length > 0 ? (
          <>
            {/* Wishlist Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
              {paginatedItems.map((item: WishlistItem) => (
                <div key={item._id} className="relative group">
                  {/* Remove Button Overlay */}
                  <button
                    onClick={() => handleRemoveFromWishlist(item._id)}
                    className="absolute top-3 right-3 z-10 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition"
                  >
                    <X className="w-4 h-4 text-gray-600" />
                  </button>

                  <ProductCard
                    id={item._id}
                    name={item.name}
                    price={item.price}
                    img={item?.images|| []}
                    rating={item.rating}
                    href={`/product/${item.slug}`}
                    discount={item.discount}
                  />
                </div>
              ))}
            </div>

            {/* Pagination */}
            {wishlistItems.length > itemsPerPage && (
              <div className="mt-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl shadow-sm">
            <div className="w-20 h-20 flex items-center justify-center rounded-full bg-gray-100 mb-6">
              <HeartOff className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">Your wishlist is empty</h3>
            <p className="text-gray-600 mb-6 max-w-md text-center">
              You haven’t saved any products yet. Browse our catalog and add your favorites!
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center bg-[var(--color-logo)] text-white rounded-lg px-6 py-3 text-lg font-medium hover:opacity-90 transition"
            >
              Start Shopping
            </Link>
          </div>
        )}

        {/* Order History Link */}
        {wishlistItems.length > 0 && (
          <div className="mt-12 text-center">
            <Link
              href="/profile/orders"
              className="inline-flex items-center justify-center border border-[var(--color-logo)] text-[var(--color-logo)] rounded-lg px-6 py-3 font-medium hover:bg-[var(--color-logo)] hover:text-white transition"
            >
             <span>
              View Order History
              </span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
