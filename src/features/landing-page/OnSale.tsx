'use client';

import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
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

interface Product {
  _id: string;
  name: string;
  description?: string;
  price: number;
  images: string[];
  slug: string;
  featured?: boolean;
  discount?: number;
  rating?: number;
  category?: {
    name: string;
    slug: string;
  } | null;
}

interface SaleConfig {
  _id: string;
  categorySlugs?: string[];
  productIds?: string[];
  endsAt: string;
  active: boolean;
  discountPercent?: number;
}

type SaleMap = Record<string, { percent: number; endsAt: string; saleId: string }>;

const SaleSection = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saleMap, setSaleMap] = useState<SaleMap>({});
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
    saleInfo?: { percent: number; endsAt: string; saleId: string },
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
    saleInfo: saleInfo
      ? {
          discountPercent: saleInfo.percent,
          endsAt: saleInfo.endsAt,
          saleName: 'Sale',
        }
      : undefined,
    featured: product.featured,
    discount: saleInfo?.percent,
  });

  const fetchSaleProducts = async () => {
    try {
      const saleRes = await fetch('/api/sale?mode=all');
      const saleJson = await saleRes.json();
      if (!saleJson.success) throw new Error('Failed to fetch sale config');

      const activeSales: SaleConfig[] = Array.isArray(saleJson.data) ? saleJson.data : [];
      if (!activeSales.length) {
        setProducts([]);
        setSaleMap({});
        return;
      }

      // Collect explicit product IDs
      const explicitIds = Array.from(
        new Set(
          activeSales.flatMap((s) =>
            Array.isArray(s.productIds) ? s.productIds.filter(Boolean) : [],
          ),
        ),
      );

      // Load explicit products
      let explicitProducts: Product[] = [];
      if (explicitIds.length) {
        const r = await fetch(`/api/products?ids=${encodeURIComponent(explicitIds.join(','))}`);
        const j = await r.json();
        explicitProducts = j?.success ? (j.data ?? []) : [];
      }

      // Load category-based products
      const categorySlugs = activeSales.flatMap((s) => s.categorySlugs || []);
      let categoryProducts: Product[] = [];
      if (categorySlugs.length) {
        const results = await Promise.all(
          categorySlugs.map((slug) =>
            fetch(`/api/products?category=${encodeURIComponent(slug)}&limit=12`).then((r) =>
              r.json(),
            ),
          ),
        );
        categoryProducts = results.filter((r) => r?.success).flatMap((r) => r.data ?? []);
      }

      // Unique products
      const productMap = new Map<string, Product>();
      [...explicitProducts, ...categoryProducts].forEach((p) => {
        if (p?._id && !productMap.has(p._id)) productMap.set(p._id, p);
      });

      // Build per-product sale map
      const tmpSaleMap: SaleMap = {};
      for (const s of activeSales) {
        const ids = new Set<string>();
        (s.productIds || []).forEach((id) => ids.add(id));

        if (s.categorySlugs?.length) {
          for (const p of categoryProducts) {
            const catSlug = p?.category?.slug;
            if (catSlug && s.categorySlugs.includes(catSlug)) {
              ids.add(p._id);
            }
          }
        }

        ids.forEach((pid) => {
          const existing = tmpSaleMap[pid];
          const next = { percent: s.discountPercent || 0, endsAt: s.endsAt, saleId: s._id };
          if (
            !existing ||
            next.percent > existing.percent ||
            (next.percent === existing.percent &&
              new Date(next.endsAt).getTime() < new Date(existing.endsAt).getTime())
          ) {
            tmpSaleMap[pid] = next;
          }
        });
      }

      setSaleMap(tmpSaleMap);
      setProducts(Array.from(productMap.values()));
    } catch (error) {
      console.error('Error fetching sale products:', error);
      setProducts([]);
      setSaleMap({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSaleProducts();
    const interval = setInterval(fetchSaleProducts, 30 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="px-4 sm:px-5 py-6 sm:py-8">
        <div className="max-w-[85rem] mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              On Sale <span>Now</span>
            </h2>
            <p className="text-sm sm:text-base text-gray-600">Loading sale items...</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg overflow-hidden animate-pulse shadow">
                <div className="w-full h-40 sm:h-48 bg-gray-200"></div>
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-5 py-6 sm:py-8 bg-gray-50">
      <div className="max-w-[85rem] mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            On Sale <span>Now</span>
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            Limited-time deals on our best lights, don&apos;t miss out
          </p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12 max-w-[85rem] mx-auto">
            <div className="rounded-lg p-8">
              <h3 className="text-xl font-semibold mb-4">No Active Sales</h3>
              <p className="text-gray-600 mb-6">Check back later for amazing deals</p>
              {user?.isAdmin && (
                <Button
                  className="bg-[var(--color-logo)] hover:bg-[var(--color-logo)]/90"
                  onClick={() => router.push('/sale')}
                >
                  Create Sale
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8 sm:mb-10">
              {products.map((product) => {
                const mapping = saleMap[product._id];
                const discount = mapping?.percent || 0;

                return (
                  <ProductCard
                    key={product._id}
                    id={product._id}
                    name={product.name}
                    price={product.price}
                    img={product.images}
                    rating={product.rating}
                    href={`/product/${product.slug}`}
                    discount={discount}
                    saleEndsAt={mapping?.endsAt}
                    onQuickView={() =>
                      setQuickViewProduct(transformProductForQuickView(product, mapping))
                    }
                  />
                );
              })}
            </div>

            <div className="flex justify-center">
              <Link
                href="/sale"
                className="inline-flex items-center bg-[var(--color-logo)] text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-medium shadow-md transition-colors group text-sm sm:text-base"
              >
                View All Deals
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </>
        )}

        {/* QuickView Modal */}
        <QuickView product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
      </div>
    </div>
  );
};

export default SaleSection;
