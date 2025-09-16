'use client';

import { Suspense, useEffect, useMemo, useState, type ReactElement } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getImageUrl } from '@/lib/utils';

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
};

type BlogPost = {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  author?: string;
  image?: string;
  tags: string[];
  published: boolean;
  createdAt: string;
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
  const router = useRouter();
  const initialQ = searchParams.get('q') ?? '';

  const [query, setQuery] = useState<string>(initialQ);
  const [loading, setLoading] = useState<boolean>(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);

  useEffect(() => {
    let cancelled = false;
    const fetchAll = async (): Promise<void> => {
      setLoading(true);
      try {
        const [pRes, bRes] = await Promise.all([fetch('/api/products'), fetch('/api/blogs')]);

        const productsJson: { success: boolean; data?: Product[] } = await pRes.json();
        const blogsJson: { success: boolean; data?: BlogPost[] } = await bRes.json();

        if (!cancelled) {
          setProducts(Array.isArray(productsJson.data) ? productsJson.data : []);
          // Only include published blogs
          const blogList = Array.isArray(blogsJson.data)
            ? blogsJson.data.filter((b) => b.published)
            : [];
          setBlogs(blogList);
        }
      } catch {
        if (!cancelled) {
          setProducts([]);
          setBlogs([]);
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { products: products.slice(0, 12), blogs: blogs.slice(0, 6) };

    const p = products.filter((item) => {
      const inName = item.name?.toLowerCase().includes(q);
      const inSlug = item.slug?.toLowerCase().includes(q);
      const inDesc = item.description?.toLowerCase().includes(q);
      const inCat = item.category?.name?.toLowerCase().includes(q);
      return Boolean(inName || inSlug || inDesc || inCat);
    });

    const b = blogs.filter((post) => {
      const inTitle = post.title?.toLowerCase().includes(q);
      const inExcerpt = post.excerpt?.toLowerCase().includes(q);
      const inAuthor = post.author?.toLowerCase().includes(q);
      const inTags = post.tags?.some((t) => t.toLowerCase().includes(q));
      return Boolean(inTitle || inExcerpt || inAuthor || inTags);
    });

    return { products: p, blogs: b };
  }, [query, products, blogs]);

  return (
    <div className="min-h-screen bg-white">
      <section className="max-w-[85rem] mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search products, blogs..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-logo)]"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button
            onClick={() => {
              const q = query.trim();
              const params = new URLSearchParams();
              if (q) params.set('q', q);
              router.replace(`/search?${params.toString()}`);
            }}
            className="bg-[var(--color-logo)] text-white"
          >
            Search
          </Button>
        </div>

        {/* Results */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Products */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold mb-4 text-black">Products</h2>
            {loading ? (
              <p className="text-gray-500">Loading...</p>
            ) : filtered.products.length === 0 ? (
              <p className="text-gray-500">No products found.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                {filtered.products.map((p) => (
                  <Link key={p._id} href={`/product/${p.slug}`} className="group">
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <div className="relative w-full h-40 sm:h-48">
                        <Image
                          src={getImageUrl(p.images?.[0] ?? '')}
                          alt={p.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="p-3">
                        <div className="text-sm sm:text-base font-semibold text-black line-clamp-1">
                          {p.name}
                        </div>
                        <div className="text-[var(--color-logo)] font-bold">
                          Rs. {p.price.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Blogs */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-bold mb-4 text-black">Blog Posts</h2>
            {loading ? (
              <p className="text-gray-500">Loading...</p>
            ) : filtered.blogs.length === 0 ? (
              <p className="text-gray-500">No posts found.</p>
            ) : (
              <div className="space-y-4">
                {filtered.blogs.map((post) => (
                  <Link key={post._id} href={`/blog/${post.slug}`} className="flex gap-3">
                    <div className="relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden">
                      <Image
                        src={getImageUrl(post.image ?? '')}
                        alt={post.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-black line-clamp-2">
                        {post.title}
                      </div>
                      {post.excerpt && (
                        <div className="text-xs text-gray-600 line-clamp-2">{post.excerpt}</div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
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
