'use client';

import React, { useState, useEffect, useMemo } from 'react';
import PageHeader from '@/components/PageHeader';
import Pagination from '@/components/Pagination';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import QuickView from '@/components/QuickView';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import Loading from '@/loading';
import { Package } from 'lucide-react';

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

interface SaleData {
  _id: string;
  name: string;
  categorySlugs: string[];
  productIds: string[];
  endsAt: string;
  discountPercent: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
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
  saleInfo?: {
    discountPercent: number;
    endsAt: string;
    saleName: string;
  };
}

const ProductsPage: React.FC = () => {
  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  console.log(totalItems)
  // Removed unused imports and state
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Filter state
  const [filters, setFilters] = useState<Filters>({
    selectedCategory: 'all',
    priceBucket: 'all',
    sortBy: 'default',
  });
  // Removed console.log
  // Price buckets - memoized to prevent infinite re-renders
  const priceOptions = useMemo(
    () => [
      { value: 'all', label: 'All Prices', min: 0, max: Infinity },
      { value: '0-999', label: 'Rs. 0 – 999', min: 0, max: 1000 },
      { value: '1000-2000', label: 'Rs. 1000 – 2000', min: 1000, max: 2000 },
      { value: '2000-5000', label: 'Rs. 2000 – 5000', min: 2000, max: 5000 },
      { value: '5000+', label: 'Rs. 5000+', min: 5000, max: Infinity },
    ],
    [],
  );

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

  // Fetch sale data
  const fetchSale = async (): Promise<SaleData | null> => {
    try {
      const response = await fetch('/api/sale');
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data && result.data.active) {
          return result.data;
        }
      }
      return null;
    } catch (error) {
      console.error('Error fetching sale:', error);
      return null;
    }
  };

  // Fetch products and apply sale data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Build API URL with filters and pagination
        const params = new URLSearchParams();
        params.append('page', currentPage.toString());
        params.append('limit', itemsPerPage.toString());

        if (filters.selectedCategory !== 'all') {
          params.append('category', filters.selectedCategory);
        }

        // Add price filter if not 'all'
        if (filters.priceBucket !== 'all') {
          const bucket = priceOptions.find((o) => o.value === filters.priceBucket);
          console.log('Selected price bucket:', bucket);
          if (bucket) {
            params.append('minPrice', bucket.min.toString());
            if (bucket.max !== Infinity) {
              params.append('maxPrice', bucket.max.toString());
            }
            console.log('Price filter params:', {
              minPrice: bucket.min,
              maxPrice: bucket.max !== Infinity ? bucket.max : 'Infinity',
            });
          }
        }

        // Fetch products and sale data in parallel
        const apiUrl = `/api/products?${params.toString()}`;
        console.log('Fetching products from:', apiUrl);

        const [productsResponse, saleData] = await Promise.all([
          fetch(apiUrl).then(async (res) => {
            const data = await res.json();
            console.log('Products API response:', {
              status: res.status,
              data: data.data ? `Array(${data.data.length})` : 'No data',
              pagination: data.pagination,
            });
            return { response: res, data };
          }),
          fetchSale(),
        ]);

        if (productsResponse.response.ok) {
          const result = productsResponse.data;
          if (result.success && Array.isArray(result.data)) {
            // Set pagination info
            if (result.pagination) {
              setTotalPages(result.pagination.totalPages);
              setTotalItems(result.pagination.totalItems);
            }

            // Apply sale data to products if there's an active sale
            if (saleData && saleData.active) {
              const productsWithSale = result.data.map((product: Product) => {
                if (saleData.productIds.includes(product._id)) {
                  return {
                    ...product,
                    saleInfo: {
                      discountPercent: saleData.discountPercent,
                      endsAt: saleData.endsAt,
                      saleName: saleData.name,
                    },
                  };
                }
                return product;
              });
              setProducts(productsWithSale);
            } else {
              setProducts(result.data);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage, filters, itemsPerPage, priceOptions]);

  // Apply client-side sorting
  const sortedProducts = useMemo(() => {
    const sorted = [...products];

    // Sort products (client-side)
    switch (filters.sortBy) {
      case 'price-asc':
        sorted.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
        break;
      case 'price-desc':
        sorted.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
        break;
      case 'name-asc':
        sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'name-desc':
        sorted.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
        break;
      default:
        break;
    }

    return sorted;
  }, [products, filters.sortBy]);

  // For display, we use the sorted products
  const currentProducts = sortedProducts;

  // Filter handlers
  const handleCategoryChange = (value: string) => {
    setFilters((f) => ({ ...f, selectedCategory: value }));
    setCurrentPage(1); // Reset to first page when category changes
  };

  const handlePriceBucketChange = (value: string) => {
    console.log('Price bucket changed to:', value);
    const bucket = priceOptions.find((opt) => opt.value === value);
    console.log('Selected price bucket details:', bucket);
    setFilters((f) => {
      const newFilters = { ...f, priceBucket: value };
      console.log('Updating filters with:', newFilters);
      return newFilters;
    });
    setCurrentPage(1); // Reset to first page when price filter changes
  };

  const handleSortChange = (value: string) => setFilters((f) => ({ ...f, sortBy: value }));

  const handleQuickView = (product: Product) => {
    setQuickViewProduct(product);
  };

  const resetFilters = () => {
    setFilters({ selectedCategory: 'all', priceBucket: 'all', sortBy: 'default' });
    setCurrentPage(1);
  };

  return (
    <div>
      <div className="min-h-screen">
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
                        <SelectItem key={category._id} value={category.slug}>
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
                    <SelectTrigger className="w-56 ml-6 sm:ml-0">
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
                    <SelectTrigger className="w-56 ml-3 sm:ml-0">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3  gap-6">
                      {currentProducts.map((product) => (
                        <ProductCard
                          key={product._id}
                          id={product._id}
                          name={product.name}
                          price={product.price}
                          img={product.images || '/placeholder-product.jpg'}
                          href={`/product/${product.slug}`}
                          rating={product.rating}
                          discount={product.saleInfo?.discountPercent}
                          saleEndsAt={product.saleInfo?.endsAt}
                          onQuickView={() => handleQuickView(product)}
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
                      <Button
                        onClick={resetFilters}
                        variant="outline"
                        className="inline-flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                        Clear all filters
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Pagination */}
            <div className="mt-8 flex justify-end">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick View Component */}
      <QuickView 
        product={quickViewProduct} 
        onClose={() => setQuickViewProduct(null)} 
      />
    </div>
  );
};


export default ProductsPage;
