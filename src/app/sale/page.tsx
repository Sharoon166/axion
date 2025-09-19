'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Search } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { ScrollArea } from '@/components/ui/scroll-area';
import Loading from '@/loading';
import ProductCard from '@/components/ProductCard';
import Image from 'next/image';

// Types
type Product = {
  _id: string;
  name: string;
  description?: string;
  price: number;
  images: string[];
  slug: string;
  category?: { name: string; slug: string } | null;
};

type SaleConfig = {
  _id: string;
  categorySlugs?: string[];
  productIds?: string[];
  endsAt: string;
  active: boolean;
  discountPercent?: number;
};

export default function SalePage() {
  const { user } = useAuth();
  const isAdmin = Boolean(user?.isAdmin);

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [endsAt, setEndsAt] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [sale, setSale] = useState<SaleConfig | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Load products once
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/products');
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) setAllProducts(json.data);
      } catch { }
    };
    load();
  }, []);

  // Fetch sale config and products
  const fetchSale = async () => {
    try {
      // setLoading(true);
      const res = await fetch('/api/sale');
      const json = await res.json();
      if (json.success) {
        setSale(json.data);
        if (json.data?.productIds?.length > 0) {
          const ids = json.data.productIds.join(',');
          const r = await fetch(`/api/products?ids=${encodeURIComponent(ids)}`);
          const j = await r.json();
          if (j.success) setProducts(j.data || []);
          else setProducts([]);
        } else if (Array.isArray(json.data?.categorySlugs)) {
          const slugs = json.data.categorySlugs;
          const results = await Promise.all(
            slugs.map((slug: string) =>
              fetch(`/api/products?category=${encodeURIComponent(slug)}`).then((r) => r.json()),
            ),
          );
          const merged: Product[] = results.filter((r) => r?.success).flatMap((r) => r.data ?? []);
          setProducts(merged);
        } else setProducts([]);
      }
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSale();
    const id = setInterval(fetchSale, 30 * 1000); // Refetch after 30s
    return () => clearInterval(id);
  }, []);


  // Filter products based on query
  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allProducts.filter((p) => {
      return (
        p.name?.toLowerCase().includes(q) ||
        p.slug?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.category?.name?.toLowerCase().includes(q)
      );
    });
  }, [query, allProducts]);

  // Admin submit
  const submitSale = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: selectedProductIds, endsAt, discountPercent }),
      });

      let json: unknown = null;
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        try {
          json = await res.json();
        } catch { }
      }

      const parsed =
        json && typeof json === 'object'
          ? (json as { success?: boolean; error?: string })
          : undefined;

      if (!res.ok || (parsed && parsed.success === false)) {
        throw new Error(parsed?.error || `Failed to create sale (${res.status})`);
      }

      setSelectedProductIds([]);
      setEndsAt('');
      setDiscountPercent(0);
      await fetchSale();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <section className="max-w-[85rem] mx-auto px-8 sm:px-6 py-8">
      <PageHeader title="Sale" />
      <div className="flex items-center justify-between">
        {isAdmin && (
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-[var(--color-logo)] hover:bg-[var(--color-logo)]/90 text-white">Add Sale</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Configure Sale</DialogTitle>
              </DialogHeader>

              {/* Scrollable Body */}
              <ScrollArea className="h-[70vh] ">
                {/* Product Search */}
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-logo)]"
                    />
                  </div>

                  {/* Show results only if searching */}
                  {query.trim() && (
                    <ScrollArea className="h-[350px] w-full rounded-md border p-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredProducts.length > 0 ? (
                          filteredProducts.slice(0, 20).map((p) => {
                            const checked = selectedProductIds.includes(p._id);
                            return (
                              <label
                                key={p._id}
                                className="flex flex-col border rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition"
                              >
                                <Image
                                  src={p.images?.[0] ?? '/placeholder.png'}
                                  alt={p.name}
                                  width={200}
                                  height={200}
                                  className="h-28 object-cover w-full"
                                />
                                <div className="p-2 flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() =>
                                        setSelectedProductIds((prev) =>
                                          checked
                                            ? prev.filter((id) => id !== p._id)
                                            : [...prev, p._id],
                                        )
                                      }
                                    />
                                    <span className="text-sm font-medium">{p.name}</span>
                                  </div>
                                  <span className="text-xs text-gray-500">{p.price.toFixed(2)}</span>
                                </div>
                              </label>
                            );
                          })
                        ) : (
                          <p className="text-gray-500 text-sm">No products found.</p>
                        )}
                      </div>
                    </ScrollArea>
                  )}

                  {selectedProductIds.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedProductIds.map((id) => {
                        const prod = allProducts.find((ap) => ap._id === id);
                        const label = prod ? prod.name : id;
                        return (
                          <Badge key={id} variant="secondary" className="flex items-center gap-1">
                            {label}
                            <button
                              aria-label={`Remove ${label}`}

                              onClick={() =>
                                setSelectedProductIds((prev) => prev.filter((pid) => pid !== id))
                              }
                              className="ml-1 hover:text-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  )}

                  <div>
                    <h3 className="font-semibold mb-2">Ends At</h3>
                    <input
                      type="datetime-local"
                      value={endsAt}
                      onChange={(e) => setEndsAt(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Discount (%)</h3>
                    <input
                      type="number"
                      min={0}
                      max={95}
                      step={1}
                      value={discountPercent}
                      onChange={(e) =>
                        setDiscountPercent(Math.max(0, Math.min(95, Number(e.target.value) || 0)))
                      }
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="e.g., 15"
                    />
                    <p className="text-xs text-gray-500 mt-1">How much off? (0–95)</p>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedProductIds([]);
                        setEndsAt('');
                        setDiscountPercent(0);
                      }}
                    >
                      Reset
                    </Button>
                    <Button
                      onClick={submitSale}
                      className="bg-[var(--color-logo)] hover:bg-[var(--color-logo)]/90 text-white"

                      disabled={submitting || selectedProductIds.length === 0 || !endsAt}
                    >
                      {submitting ? 'Saving...' : 'Save Sale'}
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Current Sale Info - removed global countdown */}
      <div className="mt-6">
        {sale ? (
          <div className="rounded-xl border p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm text-gray-600">Active Sale</div>
                {sale.productIds?.length ? (
                  <div className="text-lg font-semibold">
                    Products on Sale: {sale.productIds.length}
                  </div>
                ) : (
                  <div className="text-lg font-semibold">
                    {typeof sale.discountPercent === 'number' && (
                      <div className="text-sm text-green-700 mt-1">
                        Discount: {sale.discountPercent}% OFF
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-gray-600">No active sale.</div>
        )}
      </div>

      {/* Products */}
      <div className="mt-8">
        {loading ? (
          <Loading />
        ) : products.length === 0 ? (
          <p className="text-gray-500">No products found for the sale</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-8 sm:mt-10 max-w-[85rem] mx-auto">
            {products.map((product) => (
              <div key={product._id} className="relative">
                {/* SVG Discount Badge */}
                {typeof sale?.discountPercent === 'number' && sale.discountPercent > 0 && (
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
                      {sale.discountPercent}%<br />
                      OFF
                    </div>
                  </div>
                )}

                <ProductCard
                  id={product._id}
                  name={product.name}
                  price={product.price}
                  img={product.images?.[0] ?? ''}
                  description={product.description}
                  href={`/product/${product.slug}`}
                  discount={sale?.discountPercent}
                  saleEndsAt={sale?.endsAt}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8">
        <Link
          href="/products"
          className="inline-flex items-center px-5 py-2.5 rounded-lg bg-[var(--color-logo)] text-white"
        >
          Browse All Products
        </Link>
      </div>
    </section>
  );
}
