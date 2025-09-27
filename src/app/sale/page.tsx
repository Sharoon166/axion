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
import QuickView from '@/components/QuickView';

interface ProductVariant {
  name: string;
  type: 'color' | 'text' | 'size' | 'dropdown';
  required: boolean;
  options: Array<{
    label: string;
    value: string;
    priceModifier: number;
    stockModifier: number;
    specifications: Array<{ name: string; value: string }>;
    _id: string;
    image?: string;
  }>;
  _id: string;
}

// Types
type Product = {
  _id: string;
  name: string;
  description?: string;
  price: number;
  images: string[];
  rating?: number;
  slug: string;
  category?: { name: string; slug: string } | null;
};

type SaleConfig = {
  _id: string;
  name: string;
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
  const [name, setName] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [discountPercent, setDiscountPercent] = useState<number | ''>(0);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);

  const [sale, setSale] = useState<SaleConfig | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickViewProduct, setQuickViewProduct] = useState<{
    slug: string;
    _id: string;
    name: string;
    price: number;
    description?: string;
    images: string[];
    category?: { name: string; slug?: string };
    inStock: boolean;
    rating?: number;
    numReviews?: number;
    saleInfo?: {
      discountPercent: number;
      endsAt: string;
      saleName: string;
    };
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
    saleInfo: sale?.discountPercent
      ? {
          discountPercent: sale.discountPercent,
          endsAt: sale.endsAt,
          saleName: sale.name,
        }
      : undefined,
    discount: sale?.discountPercent,
  });

  // Load products once
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/products');
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) setAllProducts(json.data);
      } catch {}
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

  // Reset form
  const resetForm = () => {
    setSelectedProductIds([]);
    setName('');
    setEndsAt('');
    setDiscountPercent(0);
    setIsEditing(false);
    setEditingSaleId(null);
    setQuery('');
  };

  // Start editing
  const startEdit = () => {
    if (sale) {
      setIsEditing(true);
      setEditingSaleId(sale._id);
      setName(sale.name);
      setSelectedProductIds(sale.productIds || []);
      setEndsAt(sale.endsAt ? new Date(sale.endsAt).toISOString().slice(0, 16) : '');
      setDiscountPercent(sale.discountPercent || 0);
    }
  };

  // Admin submit
  const submitSale = async () => {
    setSubmitting(true);
    try {
      const method = isEditing ? 'PUT' : 'POST';
      const body = isEditing
        ? { _id: editingSaleId, name, productIds: selectedProductIds, endsAt, discountPercent }
        : { name, productIds: selectedProductIds, endsAt, discountPercent };

      const res = await fetch('/api/sale', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      let json: unknown = null;
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        try {
          json = await res.json();
        } catch {}
      }

      const parsed =
        json && typeof json === 'object'
          ? (json as { success?: boolean; error?: string })
          : undefined;

      if (!res.ok || (parsed && parsed.success === false)) {
        throw new Error(
          parsed?.error || `Failed to ${isEditing ? 'update' : 'create'} sale (${res.status})`,
        );
      }

      resetForm();
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
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  className="bg-[var(--color-logo)] hover:bg-[var(--color-logo)]/90 text-white"
                  onClick={() => {
                    setIsEditing(false);
                    resetForm();
                  }}
                >
                  Add Sale
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] w-[95vw] sm:w-full">
                <DialogHeader>
                  <DialogTitle>{isEditing ? 'Edit Sale' : 'Configure Sale'}</DialogTitle>
                </DialogHeader>

                {/* Scrollable Body */}
                <ScrollArea className="h-[60vh] pr-4 sm:h-[70vh]">
                  {/* Product Search */}
                  <div className="space-y-4">
                    {/* Sale Name */}
                    <div>
                      <h3 className="font-semibold mb-2">Sale Name</h3>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2"
                        placeholder="e.g., Summer Mega Sale"
                      />
                    </div>
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
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
                                    <span className="text-xs text-gray-500">
                                      {p.price.toFixed(2)}
                                    </span>
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
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '') {
                            setDiscountPercent(''); // Allow empty string
                          } else {
                            const numValue = Number(value);
                            if (!isNaN(numValue)) {
                              setDiscountPercent(Math.max(0, Math.min(95, numValue)));
                            }
                          }
                        }}
                        className="w-full border rounded-lg px-3 py-2"
                        placeholder="e.g., 15"
                      />
                      <p className="text-xs text-gray-500 mt-1">How much off? (0–95)</p>
                    </div>

                    <div className="flex justify-end gap-3">
                      <Button variant="outline" onClick={resetForm}>
                        Reset
                      </Button>
                      <Button
                        onClick={submitSale}
                        className="bg-[var(--color-logo)] hover:bg-[var(--color-logo)]/90 text-white"
                        disabled={
                          submitting || selectedProductIds.length === 0 || !endsAt || !name.trim()
                        }
                      >
                        {submitting ? 'Saving...' : isEditing ? 'Update Sale' : 'Save Sale'}
                      </Button>
                    </div>
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>

            {sale && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" onClick={startEdit}>
                    Edit Sale
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] w-[95vw] sm:w-full">
                  <DialogHeader>
                    <DialogTitle>Edit Sale</DialogTitle>
                  </DialogHeader>

                  {/* Scrollable Body */}
                  <ScrollArea className="h-[60vh] pr-4 sm:h-[70vh]">
                    {/* Product Search */}
                    <div className="space-y-4">
                      {/* Sale Name */}
                      <div>
                        <h3 className="font-semibold mb-2">Sale Name</h3>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full border rounded-lg px-3 py-2"
                          placeholder="e.g., Summer Mega Sale"
                        />
                      </div>
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
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
                                      <span className="text-xs text-gray-500">
                                        {p.price.toFixed(2)}
                                      </span>
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
                              <Badge
                                key={id}
                                variant="secondary"
                                className="flex items-center gap-1"
                              >
                                {label}
                                <button
                                  aria-label={`Remove ${label}`}
                                  onClick={() =>
                                    setSelectedProductIds((prev) =>
                                      prev.filter((pid) => pid !== id),
                                    )
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
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '') {
                              setDiscountPercent(''); // Allow empty string
                            } else {
                              const numValue = Number(value);
                              if (!isNaN(numValue)) {
                                setDiscountPercent(Math.max(0, Math.min(95, numValue)));
                              }
                            }
                          }}
                          className="w-full border rounded-lg px-3 py-2"
                          placeholder="e.g., 15"
                        />
                        <p className="text-xs text-gray-500 mt-1">How much off? (0–95)</p>
                      </div>

                      <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={resetForm}>
                          Reset
                        </Button>
                        <Button
                          onClick={submitSale}
                          className="bg-[var(--color-logo)] hover:bg-[var(--color-logo)]/90 text-white"
                          disabled={
                            submitting || selectedProductIds.length === 0 || !endsAt || !name.trim()
                          }
                        >
                          {submitting ? 'Saving...' : 'Update Sale'}
                        </Button>
                      </div>
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            )}
          </div>
        )}
      </div>

      {/* Current Sale Info - removed global countdown */}
      <div className="mt-6">
        {sale ? (
          <div className="rounded-xl border p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm text-gray-600">Active Sale</div>
                <div className="text-xl font-bold">{sale.name}</div>
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

      <div className="mt-8">
        {loading ? (
          <Loading />
        ) : products.length === 0 ? (
          <p className="text-gray-500">No products found for the sale</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-10 max-w-[85rem] mx-auto">
            {products.map((product) => (
              <div key={product._id} className="relative">
                <ProductCard
                  id={product._id}
                  name={product.name}
                  price={product.price}
                  img={product.images ?? []}
                  rating={product.rating}
                  href={`/product/${product.slug}`}
                  discount={sale?.discountPercent}
                  saleEndsAt={sale?.endsAt}
                  onQuickView={() => setQuickViewProduct(transformProductForQuickView(product))}
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

      {/* QuickView Modal */}
      <QuickView product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
    </section>
  );
}
