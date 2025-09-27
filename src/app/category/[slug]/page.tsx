'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import Pagination from '@/components/Pagination';
import ProductCard from '@/components/ProductCard';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Package, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Product } from '@/types';
import Loading from '@/loading';

interface BackendProduct {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  price?: number;
  images?: string[];
  image?: string;
  category: {
    _id: string;
    name: string;
    slug: string;
  } | null;
  stock?: number;
  slug: string;
  discount?: number;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  productCount?: number;
}

interface PriceRange {
  min: number;
  max: number;
}

interface Filters {
  priceRange: PriceRange;
  selectedCategory: string;
  sortBy: string;
}

const CategoryPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const params = useParams();
  const slug = params?.slug as string;

  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [saleMap, setSaleMap] = useState<Record<string, { percent: number; endsAt: string }>>({});
  console.log(saleMap)
  // Filter state
  const [filters, setFilters] = useState<Filters>({
    priceRange: { min: 0, max: 100000 },
    selectedCategory: '',
    sortBy: 'default',
  });

  const itemsPerPage = 12;


  // Fetch categories
  useEffect(() => {
    const fetchCategories = async (): Promise<void> => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const result = await response.json();
          if (result.success && Array.isArray(result.data)) {
            setCategories(result.data);
          }
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Fetch products and sales
  useEffect(() => {
    const fetchProductsAndSales = async (): Promise<void> => {
      setLoading(true);
      try {
        let apiUrl = '/api/products';
        if (slug === 'sale') {
          apiUrl += '?featured=true';
        } else if (slug !== 'all') {
          apiUrl += `?category=${slug}`;
        }

        // Fetch both products and sales
        const [productsResponse, salesResponse] = await Promise.all([
          fetch(apiUrl),
          fetch('/api/sale?mode=all'),
        ]);

        let normalized: Product[] = [];
        const tmpSaleMap: Record<string, { percent: number; endsAt: string }> = {};

        // Process products
        if (productsResponse.ok) {
          const result = await productsResponse.json();
          const list = Array.isArray(result?.data) ? result.data : [];

          // Normalize API -> local Product shape
          normalized = list.map((p: BackendProduct) => ({
            id: p._id ?? p.id ?? '',
            name: p.name,
            description: p.description ?? '',
            price: p.price ?? 0,
            image: Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : (p.image ?? ''),
            category: typeof p.category === 'string' ? p.category : (p.category?.name ?? ''),
            inStock: typeof p.stock === 'number' ? p.stock > 0 : true,
            slug: p.slug,
            discount: p.discount || 0,
          }));
        }

        // Process sales and apply to products
        if (salesResponse.ok) {
          const salesResult = await salesResponse.json();
          const sales = Array.isArray(salesResult?.data) ? salesResult.data : [];

          for (const sale of sales) {
            if (!sale.active || new Date(sale.endsAt) <= new Date()) continue;

            const salePercent = sale.discountPercent || 0;
            if (salePercent <= 0) continue;

            // Apply to specific products
            if (Array.isArray(sale.productIds)) {
              for (const productId of sale.productIds) {
                tmpSaleMap[productId] = { percent: salePercent, endsAt: sale.endsAt };
              }
            }

            // Apply to category products
            if (Array.isArray(sale.categorySlugs)) {
              for (const product of normalized) {
                const productCategorySlug =
                  typeof product.category === 'string' ? product.category.toLowerCase() : '';

                if (
                  sale.categorySlugs.some((catSlug: string) =>
                    productCategorySlug.includes(catSlug.toLowerCase()),
                  )
                ) {
                  const existing = tmpSaleMap[product.id];
                  if (!existing || salePercent > existing.percent) {
                    tmpSaleMap[product.id] = { percent: salePercent, endsAt: sale.endsAt };
                  }
                }
              }
            }
          }
        }

        // Apply sale discounts to products
        const productsWithSales = normalized.map((product) => {
          const saleInfo = tmpSaleMap[product.id];
          if (saleInfo) {
            // Use the higher discount between product discount and sale discount
            const maxDiscount = Math.max(product.discount || 0, saleInfo.percent);
            return {
              ...product,
              discount: maxDiscount,
              saleEndsAt: saleInfo.endsAt,
            };
          }
          return product;
        });

        setProducts(productsWithSales);
        setSaleMap(tmpSaleMap);
      } catch (error) {
        console.error('Error fetching products and sales:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductsAndSales();
  }, [slug]);

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products];

    // Apply price filter
    filtered = filtered.filter(
      (product) =>
        product.price >= filters.priceRange.min && product.price <= filters.priceRange.max,
    );

    // Apply category filter
    if (filters.selectedCategory && filters.selectedCategory !== 'all') {
      filtered = filtered.filter((product) =>
        product.category.toLowerCase().includes(filters.selectedCategory.toLowerCase()),
      );
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'price-low-high':
        return filtered.sort((a, b) => a.price - b.price);
      case 'price-high-low':
        return filtered.sort((a, b) => b.price - a.price);
      case 'name-a-z':
        return filtered.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-z-a':
        return filtered.sort((a, b) => b.name.localeCompare(a.name));
      case 'newest':
        return filtered.reverse();
      case 'popularity':
        return filtered.sort((a, b) => (b.discount || 0) - (a.discount || 0));
      default:
        return filtered;
    }
  }, [products, filters]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredAndSortedProducts.slice(startIndex, startIndex + itemsPerPage);


  const handlePriceRangeChange = (priceRange: string): void => {
    const [min, max] = priceRange.split('-').map(Number);
    setFilters((prev) => ({
      ...prev,
      priceRange: { min, max },
    }));
    setCurrentPage(1);
  };

  const handleSortChange = (sortValue: string): void => {
    setFilters((prev) => ({
      ...prev,
      sortBy: sortValue,
    }));
    setCurrentPage(1);
  };

  const clearFilters = (): void => {
    setFilters({
      priceRange: { min: 0, max: 100000 },
      selectedCategory: '',
      sortBy: 'default',
    });
    setCurrentPage(1);
  };

  const hasActiveFilters =
    filters.selectedCategory || filters.priceRange.min > 0 || filters.priceRange.max < 100000;

  return (
    <div>
      {/* Header */}
      <PageHeader
        title={slug.charAt(0).toUpperCase() + slug.slice(1)}
        titleHighlight="Lighting"
        subtitle="Illuminate every corner with elegance."
      />

      <div className="max-w-[85rem] mx-auto px-8 sm:px-6 py-6 lg:py-10">
        {/* Filter and Sort Controls */}
        <div className="bg-gray-50 p-4 rounded-xl shadow-sm mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold text-gray-800">Products</h3>
             
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
              {/* Price Range Filter */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Price:
                </label>
                <Select
                  value={`${filters.priceRange.min}-${filters.priceRange.max}`}
                  onValueChange={handlePriceRangeChange}
                >
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue
                      placeholder={
                        filters.priceRange.min === 0 && filters.priceRange.max === 100000
                          ? 'All Prices'
                          : `Rs. ${filters.priceRange.min.toLocaleString()} - Rs. ${filters.priceRange.max.toLocaleString()}`
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-100000">All Prices</SelectItem>
                    <SelectItem value="0-3000">Rs. 0 - Rs. 3,000</SelectItem>
                    <SelectItem value="3000-8000">Rs. 3,000 - Rs. 8,000</SelectItem>
                    <SelectItem value="8000-15000">Rs. 8,000 - Rs. 15,000</SelectItem>
                    <SelectItem value="15000-30000">Rs. 15,000 - Rs. 30,000</SelectItem>
                    <SelectItem value="30000-50000">Rs. 30,000 - Rs. 50,000</SelectItem>
                    <SelectItem value="50000-100000">Rs. 50,000+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Sort by:
                </label>
                <Select value={filters.sortBy} onValueChange={handleSortChange}>
                  <SelectTrigger className="w-full sm:w-[200px]">
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

              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="text-gray-500 hover:text-gray-700 w-full sm:w-auto"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}

              {user?.isAdmin && (
                <Button
                  className="bg-[var(--color-logo)] hover:bg-[var(--color-logo)]/90 w-full sm:w-auto"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {currentItems.map((item) => (
              <ProductCard
                key={item.id}
                id={item.id}
                name={item.name}
                price={item.price}
                discount={item.discount}

                img={item.image || []}
                rating={item.rating}
                href={`/product/${item.slug}`}
                saleEndsAt={(item as Product & { saleEndsAt?: string }).saleEndsAt}
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
        {totalPages > 0 && (
          <div className="mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;
