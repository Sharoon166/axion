'use client';
import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import ProductCard from '@/components/ProductCard';

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

type SaleMap = Record<string, { percent: number; endsAt: string; saleId: string }>; // productId -> sale data

const SaleSection = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<SaleConfig[]>([]);
  const [saleMap, setSaleMap] = useState<SaleMap>({});
  console.log('SaleSection render', { products, sales, saleMap });
  // Fetch all active sales and resolve products + per-product mapping
  const fetchSaleProducts = async () => {
    try {
      // setLoading(true);

      // Fetch all active sales
      const saleRes = await fetch('/api/sale?mode=all');
      const saleJson = await saleRes.json();
      if (!saleJson.success) throw new Error('Failed to fetch sale config');
      const activeSales: SaleConfig[] = Array.isArray(saleJson.data) ? saleJson.data : [];
      setSales(activeSales);

      if (!activeSales.length) {
        setProducts([]);
        setSaleMap({});
        return;
      }

      // Collect explicit product IDs
      const explicitIds = Array.from(
        new Set(
          activeSales.flatMap((s) => (Array.isArray(s.productIds) ? s.productIds.filter(Boolean) : [])),
        ),
      );

      // Load explicit products
      let explicitProducts: Product[] = [];
      if (explicitIds.length) {
        const r = await fetch(`/api/products?ids=${encodeURIComponent(explicitIds.join(','))}`);
        const j = await r.json();
        explicitProducts = j?.success ? (j.data ?? []) : [];
      }

      // Load category-based products (limit per category to avoid huge payload)
      const categorySlugs = activeSales.flatMap((s) => s.categorySlugs || []);
      let categoryProducts: Product[] = [];
      if (categorySlugs.length) {
        const results = await Promise.all(
          categorySlugs.map((slug) =>
            fetch(`/api/products?category=${encodeURIComponent(slug)}&limit=12`).then((r) => r.json()),
          ),
        );
        categoryProducts = results.filter((r) => r?.success).flatMap((r) => r.data ?? []);
      }

      // Unique products
      const productMap = new Map<string, Product>();
      [...explicitProducts, ...categoryProducts].forEach((p) => {
        if (p?._id && !productMap.has(p._id)) productMap.set(p._id, p);
      });

      // Build per-product sale map (choose highest discount, tie-break by earliest end)
      const tmpSaleMap: SaleMap = {};
      for (const s of activeSales) {
        const ids = new Set<string>();
        (s.productIds || []).forEach((id) => ids.add(id));
        // include category products for this sale
        if (s.categorySlugs?.length) {
          for (const p of categoryProducts) {
            const catSlug = (p as Product)?.category?.slug;
            if (catSlug && s.categorySlugs.includes(catSlug)) {
              ids.add(p._id);
            }
          }
        }

        ids.forEach((pid) => {
          const existing = tmpSaleMap[pid];
          const next = { percent: s.discountPercent || 0, endsAt: s.endsAt, saleId: s._id };
          if (!existing) {
            tmpSaleMap[pid] = next;
          } else {
            if (next.percent > existing.percent) tmpSaleMap[pid] = next;
            else if (next.percent === existing.percent) {
              if (new Date(next.endsAt).getTime() < new Date(existing.endsAt).getTime()) {
                tmpSaleMap[pid] = next;
              }
            }
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
    const interval = setInterval(fetchSaleProducts, 30 * 1000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);


  return (
    <section className="py-8 sm:py-10 px-4 sm:px-5 bg-gray-50 text-center">
      <h2 className="text-2xl sm:text-3xl font-bold">
        On Sale <span className="text-black">Now</span>
      </h2>
      <p className="text-sm sm:text-base text-gray-600 mt-1 px-4">
        Limited-time deals on our best lights, don&apos;t miss out.
      </p>


      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-10">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="bg-white shadow-md rounded-xl overflow-hidden animate-pulse"
            >
              <div className="w-full h-48 sm:h-56 md:h-64 bg-gray-300"></div>
              <div className="p-4 sm:p-5 space-y-3">
                <div className="h-6 bg-gray-300 rounded"></div>
                <div className="h-4 bg-gray-300 rounded"></div>
                <div className="h-6 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 mt-8">
          <div className="rounded-xl p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">No Active Sale</h3>
            <p className="text-gray-600 mb-6">Check back later</p>
            {user?.isAdmin && (
              <Link
                href="/sale"
                className="inline-flex items-center bg-[var(--color-logo)] text-white px-6 py-3 rounded-lg font-medium"
              >
                Add new Sale
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-8 sm:mt-10 max-w-[85rem] mx-auto">
          {products.map((product) => {
            const mapping = saleMap[product._id];
            const percent = mapping?.percent || 0;
            return (
              <div key={product._id} className="relative">
                {/* SVG Discount Badge */}
                {percent > 0 && (
                  <div className="absolute -top-1 -right-2 z-10 w-20 h-20">
                    <svg
                      width="75"
                      height="80"
                      viewBox="0 0 87 85"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M87 42.4934C87 44.309 83.9237 45.8934 83.694 47.6614C83.4643 49.4294 86.0047 51.7414 85.5384 53.489C85.0721 55.2366 81.6617 56.0118 80.9657 57.637C80.2697 59.2622 82.0932 62.193 81.1884 63.757C80.2836 65.321 76.7827 65.1851 75.6761 66.6131C74.5694 68.0411 75.5717 71.2915 74.2841 72.5631C72.9965 73.8347 69.6487 72.8351 68.1871 73.9231C66.7255 75.0111 66.8647 78.4111 65.2639 79.3087C63.6631 80.2063 60.726 78.4111 58.9999 79.0911C57.2738 79.7711 56.5291 83.0827 54.7543 83.5655C52.9795 84.0483 50.634 81.5255 48.7826 81.7635C46.9313 82.0015 45.3583 84.9867 43.5 84.9867C41.6417 84.9867 40.02 81.9811 38.2034 81.7635C36.3869 81.5459 33.9926 84.0211 32.2387 83.5655C30.4848 83.1099 29.6635 79.7711 27.9931 79.0911C26.3227 78.4111 23.3299 80.1995 21.7291 79.3087C20.1283 78.4179 20.2675 75.0111 18.8059 73.9231C17.3443 72.8351 14.0244 73.8211 12.7229 72.5631C11.4214 71.3051 12.4445 68.0411 11.3309 66.6131C10.2173 65.1851 6.73728 65.321 5.8116 63.757C4.88592 62.193 6.73727 59.3166 6.04127 57.637C5.34527 55.9574 1.9488 55.223 1.4616 53.489C0.974404 51.755 3.5496 49.4634 3.306 47.6614C3.0624 45.8594 0 44.309 0 42.4934C0 40.6778 3.07632 39.0933 3.306 37.3253C3.53568 35.5573 0.995284 33.2453 1.4616 31.4977C1.92792 29.7501 5.34527 28.9749 6.04127 27.3497C6.73727 25.7245 4.9068 22.7937 5.8116 21.2297C6.7164 19.6657 10.2103 19.8017 11.3309 18.3737C12.4514 16.9457 11.4353 13.6953 12.7229 12.4236C14.0105 11.152 17.3513 12.1516 18.8059 11.0636C20.2606 9.97564 20.1283 6.57563 21.7291 5.67803C23.3299 4.78042 26.274 6.57562 27.9931 5.89562C29.7122 5.21562 30.4639 1.90402 32.2387 1.42121C34.0135 0.938411 36.366 3.46122 38.2034 3.22322C40.0409 2.98522 41.6347 0 43.5 0C45.3653 0 46.98 3.00562 48.7826 3.22322C50.5853 3.44082 53.0004 0.965612 54.7543 1.42121C56.5082 1.87681 57.3295 5.21562 58.9999 5.89562C60.6703 6.57562 63.6631 4.78722 65.2639 5.67803C66.8647 6.56883 66.7255 9.97564 68.1871 11.0636C69.6487 12.1516 72.9756 11.1656 74.2841 12.4236C75.5926 13.6817 74.5555 16.9457 75.6761 18.3737C76.7966 19.8017 80.2697 19.6657 81.1884 21.2297C82.1071 22.7937 80.2697 25.6633 80.9657 27.3497C81.6617 29.0361 85.0512 29.7637 85.5384 31.4977C86.0256 33.2317 83.4504 35.5233 83.694 37.3253C83.9376 39.1273 87 40.6778 87 42.4934Z"
                        fill="#0077B6"
                      />
                      <path
                        d="M43.5004 77.2549C63.1504 77.2549 79.0799 61.6915 79.0799 42.4932C79.0799 23.2948 63.1504 7.73145 43.5004 7.73145C23.8504 7.73145 7.9209 23.2948 7.9209 42.4932C7.9209 61.6915 23.8504 77.2549 43.5004 77.2549Z"
                        fill="#0077B6"
                      />
                      <path
                        d="M43.5 77.4463C36.4245 77.4463 29.5079 75.3964 23.6248 71.5558C17.7417 67.7152 13.1564 62.2564 10.4488 55.8697C7.74109 49.4831 7.03263 42.4554 8.413 35.6753C9.79336 28.8953 13.2006 22.6674 18.2037 17.7793C23.2068 12.8911 29.5812 9.56224 36.5208 8.2136C43.4603 6.86497 50.6534 7.55714 57.1903 10.2026C63.7272 12.848 69.3144 17.3279 73.2453 23.0758C77.1763 28.8236 79.2744 35.5813 79.2744 42.4941C79.2652 51.7613 75.4931 60.6462 68.7861 67.1991C62.0791 73.7519 52.9851 77.4373 43.5 77.4463ZM43.5 7.89561C36.4958 7.89426 29.6485 9.9223 23.824 13.7232C17.9995 17.5241 13.4595 22.9272 10.7782 29.2491C8.09683 35.5711 7.39455 42.5279 8.76016 49.2398C10.1258 55.9517 13.4979 62.1172 18.4502 66.9566C23.4024 71.796 29.7123 75.0918 36.5818 76.4274C43.4514 77.7629 50.572 77.0781 57.0432 74.4597C63.5144 71.8412 69.0455 67.4066 72.9369 61.7168C76.8284 56.0269 78.9055 49.3374 78.9055 42.4941C78.8945 33.3225 75.1609 24.5296 68.5237 18.0436C61.8865 11.5577 52.8874 7.90821 43.5 7.89561Z"
                        fill="white"
                      />
                      <path
                        d="M43.3256 11.5742L44.4392 13.4102L46.5829 13.8862L45.1352 15.4774L45.344 17.6262L43.3256 16.7762L41.3281 17.6262L41.516 15.4774L40.0684 13.8862L42.212 13.4102L43.3256 11.5742Z"
                        fill="#FFECEC"
                      />
                      <path
                        d="M31.1456 14.5996L32.2801 16.4356L34.4029 16.9048L32.9761 18.5096L33.164 20.6312L31.1456 19.8016L29.1481 20.6312L29.336 18.5096L27.9092 16.9048L30.032 16.4356L31.1456 14.5996Z"
                        fill="#FFECEC"
                      />
                      <path
                        d="M55.5063 14.5996L56.6199 16.4356L58.7427 16.9048L57.3159 18.5096L57.5108 20.6312L55.5063 19.8016L53.4879 20.6312L53.6758 18.5096L52.249 16.9048L54.3788 16.4356L55.5063 14.5996Z"
                        fill="#FFECEC"
                      />
                      <path
                        d="M43.3256 66.9258L44.4392 68.7618L46.5829 69.231L45.1352 70.8494L45.344 72.971L43.3256 72.121L41.3281 72.971L41.516 70.8494L40.0684 69.231L42.212 68.7618L43.3256 66.9258Z"
                        fill="#FFECEC"
                      />
                      <path
                        d="M55.5063 69.9515L54.3788 68.1155L52.249 67.6395L53.6758 66.0415L53.4879 63.9131L55.5063 64.7495L57.5108 63.9131L57.3159 66.0415L58.7427 67.6395L56.6199 68.1155L55.5063 69.9515Z"
                        fill="#FFECEC"
                      />
                      <path
                        d="M31.1456 69.9515L30.032 68.1155L27.9092 67.6395L29.336 66.0415L29.1481 63.9131L31.1456 64.7495L33.164 63.9131L32.9761 66.0415L34.4029 67.6395L32.2801 68.1155L31.1456 69.9515Z"
                        fill="#FFECEC"
                      />
                    </svg>

                    {/* Centered Discount Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-semibold text-sm leading-tight">
                      {percent}%<br />
                      OFF
                    </div>
                  </div>
                )}

                <ProductCard
                  id={product._id}
                  name={product.name}
                  price={product.price}
                  img={product.images}
                  rating={product.rating}
                  href={`/product/${product.slug}`}
                  discount={percent}
                  saleEndsAt={saleMap[product._id]?.endsAt}
                />
              </div>
            );
          })}
        </div>
      )}

      <Link
        href="/sale"
        className="inline-flex mt-4 sm:mt-6 items-center bg-[var(--color-logo)] text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-medium shadow-md transition-colors group text-sm sm:text-base"
      >
        Explore Sale
        <span className="ml-2 inline-block transform transition-transform duration-300 group-hover:translate-x-2">
          <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
        </span>
      </Link>
    </section>
  );
};

export default SaleSection;
