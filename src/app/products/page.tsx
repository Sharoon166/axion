'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
import Loading from '@/loading';
import { Package, X } from 'lucide-react';

interface Category {
  _id: string;
  name: string;
  slug: string;
}



interface Filters {
  selectedCategory: string;
  priceBucket: string;
  sortBy: string;
}

interface Product {
  _id: string;
  id: string;
  rating?: number;
  name: string;
  description: string;
  price: number;
  category: Category;
  image: string;
  inStock: boolean;
  images: string[];
  slug: string;
  discount?: number;
}

const ProductsPage: React.FC = () => {

  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  // Filter state
  const [filters, setFilters] = useState<Filters>({
    selectedCategory: 'all',
    priceBucket: 'all',
    sortBy: 'default',
  });

  // Price buckets - memoized to prevent infinite re-renders
  const priceOptions = useMemo(() => [
    { value: 'all', label: 'All Prices', min: 0, max: Infinity },
    { value: '0-999', label: 'Rs. 0 – 999', min: 0, max: 1000 },
    { value: '1000-2000', label: 'Rs. 1000 – 2000', min: 1000, max: 2000 },
    { value: '2000-5000', label: 'Rs. 2000 – 5000', min: 2000, max: 5000 },
    { value: '5000+', label: 'Rs. 5000+', min: 5000, max: Infinity },
  ], []);

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

  // Fetch products
  useEffect(() => {
    const fetchProducts = async (): Promise<void> => {
      setLoading(true);
      try {
        const response = await fetch('/api/products');
        if (response.ok) {
          const result = await response.json();
          if (result.success && Array.isArray(result.data)) {
            setProducts(result.data);
          }
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filter and sort products when filters or products change
  useEffect(() => {
    let out = [...products];

    // Filter by category
    if (filters.selectedCategory !== 'all') {
      out = out.filter((p) => {
        const slug = p.category.name || '';
        return slug === filters.selectedCategory;
      });
    }

    // Filter by price bucket
    const bucket = priceOptions.find((o) => o.value === filters.priceBucket);
    if (bucket && bucket.value !== 'all') {
      out = out.filter((p) => {
        const price = Number(p.price) || 0;
        return price >= bucket.min && price < bucket.max;
      });
    }

    // Sort products
    switch (filters.sortBy) {
      case 'price-asc':
        out.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
        break;
      case 'price-desc':
        out.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
        break;
      case 'name-asc':
        out.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'name-desc':
        out.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
        break;
      default:
        break;
    }

    setFilteredProducts(out);
    setCurrentPage(1); // Reset to first page when filters change
  }, [products, filters, priceOptions]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const currentProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  // Filter handlers
  const handleCategoryChange = (value: string) =>
    setFilters((f) => ({ ...f, selectedCategory: value }));

  const handlePriceBucketChange = (value: string) =>
    setFilters((f) => ({ ...f, priceBucket: value }));

  const handleSortChange = (value: string) =>
    setFilters((f) => ({ ...f, sortBy: value }));

  const resetFilters = () =>
    setFilters({ selectedCategory: 'all', priceBucket: 'all', sortBy: 'default' });


  return (
    <div>
      <div className="min-h-screen bg-gray-50">
        <PageHeader title="All " titleHighlight="Products" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filters Bar */}
          <div className="bg-white border rounded-2xl shadow-sm mb-6 p-4 lg:p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              {/* Left: title + counts */}
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold tracking-tight">Products</h2>
              </div>

              {/* Right: filters + action */}
              <div className="flex flex-wrap items-center gap-4 md:gap-5 w-full md:w-auto">
                {/* Category */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Category:</span>
                  <Select value={filters.selectedCategory} onValueChange={handleCategoryChange}>
                    <SelectTrigger className="w-56">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category._id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Price:</span>
                  <Select value={filters.priceBucket} onValueChange={handlePriceBucketChange}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="All Prices" />
                    </SelectTrigger>
                    <SelectContent>
                      {priceOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Sort by:</span>
                  <Select value={filters.sortBy} onValueChange={handleSortChange}>
                    <SelectTrigger className="w-56">
                      <SelectValue placeholder="Default" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="price-asc">Price: Low to High</SelectItem>
                      <SelectItem value="price-desc">Price: High to Low</SelectItem>
                      <SelectItem value="name-asc">Name: A to Z</SelectItem>
                      <SelectItem value="name-desc">Name: Z to A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

            
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div>
            {/* Loading State */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loading />
              </div>
            ) : (
              <>
                {/* Products Grid */}
                {currentProducts.length > 0 ? (
                  <>
                    <p className="text-sm text-gray-600 mb-4">
                      Showing {currentProducts.length} of {filteredProducts.length} filtered products
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {currentProducts.map((product) => (
                        <ProductCard
                          key={product._id}
                          id={product._id}
                          name={product.name}
                          price={product.price || 0}
                          rating={product.rating}
                          img={product.images || []}
                          href={`/product/${product.slug}`}
                          discount={product.discount}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <Package className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Try adjusting your filters to find what you&apos;re looking for.
                    </p>
                    <div className="mt-6">
                      <Button onClick={resetFilters} variant="outline" className="inline-flex items-center">
                        <X className="mr-2 h-4 w-4" />
                        Clear all filters
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
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
      </div>
    </div>
  );
};

export default ProductsPage;
