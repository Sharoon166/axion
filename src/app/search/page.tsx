'use client';

import { Suspense, useEffect, useState, useMemo, useCallback, type ReactElement } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import ProductCard from '@/components/ProductCard';
import Pagination from '@/components/Pagination';
import Loading from '@/loading';
import QuickView from '@/components/QuickView';

interface ProductVariant {
  name: string;
  type: 'color' | 'text' | 'size' | 'dropdown';
  required: boolean;
  options: Array<{
    label: string;
    value: string;
    priceModifier: number;
    stock: number;
    specifications: Array<{ name: string; value: string }>;
    _id: string;
    image?: string;
  }>;
  _id: string;
}

type ProductCategory = {
  _id: string;
  name: string;
  slug: string;
  productCount?: number;
};

type Product = {
  _id: string;
  name: string;
  slug: string;
  price: number;
  description?: string;
  images: string[];
  rating?: number;
  category?: ProductCategory | null;
  discount?: number;
  saleEndsAt?: string;
  colors?: string[];
  sizes?: string[];
  subcategories?: string[];
  featured?: boolean;
};

type FilterState = {
  category: string;
  priceRange: string;
  featured: boolean;
};

type SortOption = 'newest' | 'price-low' | 'price-high' | 'name' | 'rating';

const ITEMS_PER_PAGE = 12;

function SearchComponent(): ReactElement {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get('q') ?? '';

  const [query, setQuery] = useState<string>(initialQ);
  const [loading, setLoading] = useState<boolean>(true);
  const [initialLoad, setInitialLoad] = useState<boolean>(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [quickViewProduct, setQuickViewProduct] = useState<{
    slug: string;
    _id: string;
    name: string;
    price: number;
    description?: string;
    images: string[];
    category?: {
      name: string;
      slug?: string;
    };
    inStock: boolean;
    stock?: number;
    rating?: number;
    numReviews?: number;
    variants?: ProductVariant[];
    saleInfo?: {
      discountPercent: number;
      endsAt: string;
      saleName: string;
    };
    featured?: boolean;
    discount?: number;
  } | null>(null);

  // Transform product for QuickView
  const transformProductForQuickView = (
    product: Product,
  ): {
    slug: string;
    _id: string;
    name: string;
    price: number;
    description?: string;
    images: string[];
    category?: {
      name: string;
      slug?: string;
    };
    inStock: boolean;
    stock?: number;
    rating?: number;
    numReviews?: number;
    variants?: ProductVariant[];
    saleInfo?: {
      discountPercent: number;
      endsAt: string;
      saleName: string;
    };
    featured?: boolean;
    discount?: number;
  } => ({
    slug: product.slug,
    _id: product._id,
    name: product.name,
    price: product.price,
    description: product.description,
    images: product.images || [],
    category: product.category
      ? {
          name: product.category.name,
          slug: product.category.slug,
        }
      : undefined,
    inStock: true, // Default to true since we don't have stock info
    stock: undefined,
    rating: product.rating,
    numReviews: 0, // Default value
    variants: undefined,
    saleInfo:
      product.discount && product.saleEndsAt
        ? {
            discountPercent: product.discount,
            endsAt: product.saleEndsAt,
            saleName: 'Sale',
          }
        : undefined,
    featured: product.featured,
    discount: product.discount,
  });

  const [filters, setFilters] = useState<FilterState>({
    category: '',
    priceRange: '',
    featured: false,
  });

  // Real-time search with debouncing
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState<string>(initialQ);
  console.log(setSearchTimeout);
  // Fetch initial data
  useEffect(() => {
    let cancelled = false;
    const fetchData = async (): Promise<void> => {
      // Only show loading on initial mount
      if (initialLoad) {
        setLoading(true);
      }

      try {
        const [productsRes, categoriesRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/categories'),
        ]);

        const [productsJson, categoriesJson] = await Promise.all([
          productsRes.json(),
          categoriesRes.json(),
        ]);

        if (!cancelled) {
          const productsData = Array.isArray(productsJson.data) ? productsJson.data : [];
          const categoriesData = Array.isArray(categoriesJson.data) ? categoriesJson.data : [];

          setProducts(productsData);
          setCategories(categoriesData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        if (!cancelled) {
          setProducts([]);
          setCategories([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setInitialLoad(false);
        }
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [initialLoad]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Debounce effect for search query
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(query);

      // Update URL with search query
      const url = new URL(window.location.href);
      if (query.trim()) {
        url.searchParams.set('q', query.trim());
      } else {
        url.searchParams.delete('q');
      }
      window.history.replaceState({}, '', url.toString());
    }, 300); // 300ms debounce delay

    return () => clearTimeout(timeout);
  }, [query]);

  // Real-time search handler
  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
  }, []);

  // Price range options
  const priceRanges = [
    { label: 'All Prices', value: '' },
    { label: 'Under Rs. 1,000', value: '0-1000' },
    { label: 'Rs. 1,000 - Rs. 5,000', value: '1000-5000' },
    { label: 'Rs. 5,000 - Rs. 10,000', value: '5000-10000' },
    { label: 'Over Rs. 10,000', value: '10000-999999' },
  ];

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Text search with improved matching
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.trim().toLowerCase();
      const searchTerms = q.split(' ').filter((term) => term.length > 0);

      filtered = filtered.filter((item) => {
        const searchableText = [
          item.name?.toLowerCase() || '',
          item.slug?.toLowerCase() || '',
          item.description?.toLowerCase() || '',
          item.category?.name?.toLowerCase() || '',
          ...(item.colors?.map((c) => c.toLowerCase()) || []),
          ...(item.sizes?.map((s) => s.toLowerCase()) || []),
          ...(item.subcategories?.map((s) => s.toLowerCase()) || []),
        ].join(' ');

        // Check if all search terms are found
        return searchTerms.every((term) => searchableText.includes(term));
      });
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(
        (product) => product.category && product.category.slug === filters.category,
      );
    }

    // Price range filter
    if (filters.priceRange) {
      const [min, max] = filters.priceRange.split('-').map(Number);
      filtered = filtered.filter((product) => product.price >= min && product.price <= max);
    }

    // Featured filter
    if (filters.featured) {
      filtered = filtered.filter((product) => product.featured === true);
    }

    // Sort products
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'newest':
      default:
        // Keep default order (newest first from API)
        break;
    }

    return filtered;
  }, [products, debouncedQuery, filters, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedQuery, filters, sortBy]);

  // Filter handlers
  const clearAllFilters = () => {
    setFilters({
      category: '',
      priceRange: '',
      featured: false,
    });
  };

  const activeFiltersCount =
    (filters.category ? 1 : 0) + (filters.priceRange ? 1 : 0) + (filters.featured ? 1 : 0);

  return (
    <div className="min-h-screen bg-white">
      <section className="max-w-[85rem] mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Search Bar */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search products by name, category, color, size..."
              className="w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-logo)] transition-all"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
            />
            {query && (
              <button
                onClick={() => handleQueryChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                title="Clear search"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Category:</Label>
            <Select
              value={filters.category}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, category: value === 'All' ? '' : value }))
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category._id} value={category.slug}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price Range Filter */}
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Price:</Label>
            <Select
              value={filters.priceRange}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, priceRange: value === 'all' ? '' : value }))
              }
            >
              <SelectTrigger className="ml-7 sm:ml-0 w-48">
                <SelectValue placeholder="All Prices" />
              </SelectTrigger>
              <SelectContent>
                {priceRanges.map((range) => (
                  <SelectItem key={range.value || 'all'} value={range.value || 'all'}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Clear Filters */}
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-red-600 hidden sm:block hover:text-red-700"
            >
              Clear All ({activeFiltersCount})
            </Button>
          )}

          {/* Sort */}
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Sort:</Label>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="w-40 ml-8 sm:ml-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-black">
              {debouncedQuery ? `Search Results for "${debouncedQuery}"` : 'All Products'}
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              {loading ? (
                'Searching...'
              ) : query !== debouncedQuery ? (
                'Typing...'
              ) : (
                <>
                  {activeFiltersCount > 0 && (
                    <span className="ml-2 text-blue-600">
                      ({activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} applied)
                    </span>
                  )}
                </>
              )}
            </p>
          </div>
        </div>

        {/* Active Filters */}
        {activeFiltersCount > 0 && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-700 mr-2">Active filters:</span>
              {filters.category && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {categories.find((c) => c.slug === filters.category)?.name}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => setFilters((prev) => ({ ...prev, category: '' }))}
                  />
                </Badge>
              )}
              {filters.priceRange && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {priceRanges.find((r) => r.value === filters.priceRange)?.label}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => setFilters((prev) => ({ ...prev, priceRange: '' }))}
                  />
                </Badge>
              )}
              {filters.featured && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Featured
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => setFilters((prev) => ({ ...prev, featured: false }))}
                  />
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Products Grid */}
        {loading ? (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-xl h-80 animate-pulse"></div>
            ))}
          </div>
        ) : paginatedProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500 mb-4">
              {debouncedQuery
                ? `No results for "${debouncedQuery}"`
                : 'No products match your filters'}
            </p>
            {(debouncedQuery || activeFiltersCount > 0) && (
              <div className="space-y-2">
                <p className="text-gray-400 text-sm">Try:</p>
                <ul className="text-gray-400 text-sm space-y-1">
                  <li>• Checking your spelling</li>
                  <li>• Using different keywords</li>
                  <li>• Removing some filters</li>
                </ul>
                <Button
                  variant="outline"
                  onClick={() => {
                    handleQueryChange('');
                    clearAllFilters();
                  }}
                  className="mt-4"
                >
                  Clear all filters and search
                </Button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {paginatedProducts.map((product) => (
                <ProductCard
                  key={product._id}
                  id={product._id}
                  name={product.name}
                  price={product.price}
                  img={product.images ?? []}
                  href={`/product/${product.slug}`}
                  rating={product.rating}
                  discount={product.discount}
                  saleEndsAt={product.saleEndsAt}
                  onQuickView={() => setQuickViewProduct(transformProductForQuickView(product))}
                />
              ))}
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </section>

      {/* QuickView Modal */}
      <QuickView product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
    </div>
  );
}

export default function SearchPage(): ReactElement {
  return (
    <Suspense fallback={<Loading />}>
      <SearchComponent />
    </Suspense>
  );
}