'use client';

import { Suspense, useEffect, useState, type ReactElement } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/ProductCard';
import Loading from '@/loading';

type ProductCategory = {
  name: string;
  slug: string;
};

type Product = {
  _id: string;
  name: string;
  slug: string;
  price: number;
  description?: string;
  images: string[];
  category?: ProductCategory | null;
  discount?: number;
  saleEndsAt?: string;
};

function SearchPageSkeleton(): ReactElement {
  return (
    <div className="min-h-screen bg-white animate-pulse">
      <section className="max-w-[85rem] mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <div className="h-10 bg-gray-200 rounded-lg w-full"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded-lg w-24"></div>
        </div>
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-xl h-60"></div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-20 h-20 bg-gray-200 rounded-md"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function SearchComponent(): ReactElement {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get('q') ?? '';

  const [query, setQuery] = useState<string>(initialQ);
  const [searchQuery, setSearchQuery] = useState<string>(initialQ);
  const [loading, setLoading] = useState<boolean>(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  useEffect(() => {
    let cancelled = false;
    const fetchAll = async (): Promise<void> => {
      setLoading(true);
      try {
        const pRes = await fetch('/api/products');
        const productsJson: { success: boolean; data?: Product[] } = await pRes.json();

        if (!cancelled) {
          const productsData = Array.isArray(productsJson.data) ? productsJson.data : [];
          setProducts(productsData);
          setFilteredProducts(productsData.slice(0, 12));
        }
      } catch {
        if (!cancelled) {
          setProducts([]);
          setFilteredProducts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAll(); 
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSearch = () => {
    const q = query.trim().toLowerCase();
    setSearchQuery(q);
    
    if (!q) {
      setFilteredProducts(products.slice(0, 12));
      return;
    }

    const p = products.filter((item) => {
      const inName = item.name?.toLowerCase().includes(q);
      const inSlug = item.slug?.toLowerCase().includes(q);
      const inDesc = item.description?.toLowerCase().includes(q);
      const inCat = item.category?.name?.toLowerCase().includes(q);
      return Boolean(inName || inSlug || inDesc || inCat);
    });

    setFilteredProducts(p);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <section className="max-w-[85rem] mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-logo)]"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <Button 
            onClick={handleSearch}
            className="bg-[var(--color-logo)] text-white"
          >
            Search
          </Button>
        </div>

        {/* Products */}
        <div className='mt-10'>
          <h2 className="text-xl font-bold mb-4 text-black">Products</h2>
          {loading ? (
            <Loading />
          ) : filteredProducts.length === 0 ? (
            <p className="text-gray-500">No products found. {searchQuery && `for "${searchQuery}"`}</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product._id}
                  id={product._id}
                  name={product.name}
                  price={product.price}
                  img={product.images?.[0] ?? ''}
                  href={`/product/${product.slug}`}
                  description={product.description}
                  discount={product.discount}
                  saleEndsAt={product.saleEndsAt}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default function SearchPage(): ReactElement {
  return (
    <Suspense fallback={<SearchPageSkeleton />}>
      <SearchComponent />
    </Suspense>
  );
}
