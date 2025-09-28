'use server';

import { revalidatePath } from 'next/cache';
import dbConnect from '@/lib/db';
import Product from '@/models/Products';

interface ApiOrder {
  _id?: string;
  isPaid?: boolean;
  isDelivered?: boolean;
  isCancelled?: boolean;
  totalPrice?: number;
  user?: { name?: string };
}

interface ApiProduct {
  name?: string;
  stock?: number;
  images?: string[];
}

export interface DashboardData {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  recentOrders: Array<{ id: string; customer: string; total: number }>;
  topProducts: Array<{ name: string; value: number; image?: string }>;
  lowStockProducts: Array<{
    name: string;
    stock: number;
    status: string;
    color: string;
    image?: string;
    slug: string;
  }>;
  ordersPerDay: number[];
}

async function fetchWithRetry(url: string, retries = 2): Promise<Response> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const fullUrl = `${baseUrl}${url}`;
  
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(fullUrl, {
        headers: { 'Cache-Control': 'no-cache' },
        next: { revalidate: 300 } // Revalidate every 5 minutes
      });
      
      return response;
    } catch (error) {
      if (i === retries) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error('Max retries exceeded');
}

export async function getDashboardData(): Promise<DashboardData> {
  try {
    const [ordersResponse, productsResponse] = await Promise.allSettled([
      fetchWithRetry('/api/orders'),
      fetchWithRetry('/api/products')
    ]);

    // Handle orders response
    let orders: ApiOrder[] = [];
    if (ordersResponse.status === 'fulfilled' && ordersResponse.value.ok) {
      const ordersResult = await ordersResponse.value.json();
      orders = ordersResult.success ? ordersResult.data : [];
    }

    // Handle products response
    let products: ApiProduct[] = [];
    if (productsResponse.status === 'fulfilled' && productsResponse.value.ok) {
      const productsResult = await productsResponse.value.json();
      products = productsResult.success ? productsResult.data : [];
    }

    const totalOrders = orders.length;
    const pendingOrders = orders.filter(
      (order) => !order.isPaid && !order.isDelivered && !order.isCancelled
    ).length;
    const completedOrders = orders.filter((order) => !!order.isDelivered).length;

    const recentOrders = orders.slice(0, 5).map((order, index: number) => ({
      id: order._id?.slice(-8) || `#27${641 + index}`,
      customer: order.user?.name || `Customer ${index + 1}`,
      total: order.totalPrice || Math.floor(Math.random() * 50000) + 10000,
    }));

    const topProducts = products.slice(0, 3).map((product) => ({
      name: product.name || 'Unknown Product',
      value: product.stock || Math.floor(Math.random() * 30) + 10,
      image: product.images?.[0] || '/prodcut-1.jpg',
    }));

    // Compute low stock products by inspecting variant-level stocks directly from DB
    const lowThreshold = 5; // critical low
    const warnThreshold = 10; // warning

    await dbConnect();
    const productDocs = await Product.find({}, 'name slug images variants').lean();

    const lowStockEntries: Array<{
      name: string;
      stock: number;
      status: string;
      color: string;
      image?: string;
      slug: string;
    }> = [];

    for (const p of productDocs) {
      const baseName = p.name || 'Unknown';
      const image = p.images?.[0] || '/prodcut-1.jpg';
      const slug = p.slug || (baseName as string).toLowerCase().replace(/\s+/g, '-');

      if (!Array.isArray(p.variants)) continue;
      for (const v of p.variants) {
        const variantName = v?.name;
        if (!Array.isArray(v?.options)) continue;
        for (const opt of v.options) {
          const pathLabel = `${variantName}: ${opt?.label ?? opt?.value}`;
          const stock = typeof opt?.stock === 'number' ? opt.stock : 0;
          if (stock <= warnThreshold) {
            lowStockEntries.push({
              name: `${baseName} — ${pathLabel}`,
              stock,
              status: stock <= lowThreshold ? 'Low' : 'Medium',
              color: stock <= lowThreshold ? 'bg-red-500' : 'bg-orange-500',
              image,
              slug,
            });
          }

          // Sub-variants
          const subVariants = opt?.subVariants;
          if (Array.isArray(subVariants)) {
            for (const sv of subVariants) {
              const subVariantName = sv?.name;
              if (!Array.isArray(sv?.options)) continue;
              for (const svOpt of sv.options) {
                const subPathLabel = `${variantName}: ${opt?.label ?? opt?.value} • ${subVariantName}: ${svOpt?.label ?? svOpt?.value}`;
                const svStock = typeof svOpt?.stock === 'number' ? svOpt.stock : 0;
                if (svStock <= warnThreshold) {
                  lowStockEntries.push({
                    name: `${baseName} — ${subPathLabel}`,
                    stock: svStock,
                    status: svStock <= lowThreshold ? 'Low' : 'Medium',
                    color: svStock <= lowThreshold ? 'bg-red-500' : 'bg-orange-500',
                    image,
                    slug,
                  });
                }

                // Sub-sub-variants
                const ssvs = svOpt?.subSubVariants;
                if (Array.isArray(ssvs)) {
                  for (const ssv of ssvs) {
                    const ssvName = ssv?.name;
                    if (!Array.isArray(ssv?.options)) continue;
                    for (const ssvOpt of ssv.options) {
                      const ssvPathLabel = `${variantName}: ${opt?.label ?? opt?.value} • ${subVariantName}: ${svOpt?.label ?? svOpt?.value} • ${ssvName}: ${ssvOpt?.label ?? ssvOpt?.value}`;
                      const ssvStock = typeof ssvOpt?.stock === 'number' ? ssvOpt.stock : 0;
                      if (ssvStock <= warnThreshold) {
                        lowStockEntries.push({
                          name: `${baseName} — ${ssvPathLabel}`,
                          stock: ssvStock,
                          status: ssvStock <= lowThreshold ? 'Low' : 'Medium',
                          color: ssvStock <= lowThreshold ? 'bg-red-500' : 'bg-orange-500',
                          image,
                          slug,
                        });
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    // Sort by stock ascending; return all and paginate on client
    lowStockEntries.sort((a, b) => a.stock - b.stock);
    const lowStockProducts = lowStockEntries;

    return {
      totalOrders,
      pendingOrders,
      completedOrders,
      recentOrders,
      topProducts,
      lowStockProducts,
      ordersPerDay: Array.from({ length: 30 }, () => Math.floor(Math.random() * 20) + 5),
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    // Return empty data structure on error
    return {
      totalOrders: 0,
      pendingOrders: 0,
      completedOrders: 0,
      recentOrders: [],
      topProducts: [],
      lowStockProducts: [],
      ordersPerDay: [],
    };
  }
}

export async function refreshDashboardData() {
  revalidatePath('/dashboard', "page");
  return getDashboardData();
}