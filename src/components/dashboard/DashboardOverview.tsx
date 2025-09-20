'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  TrendingUp,
  CheckCircle,
  Clock,
  AlertTriangle,
  ShoppingCart,
} from 'lucide-react';
import { getImageUrl } from '@/lib/utils';
import LineChartComponent from './LineChartComponent';
import Loading from '@/loading';

type ApiOrder = {
  _id?: string;
  user?: { name?: string } | null;
  totalPrice?: number;
  createdAt: string | Date;
  isPaid?: boolean;
  isDelivered?: boolean;
  isCancelled?: boolean;
  orderItems?: Array<{ name?: string; qty?: number }>;
};

type ApiProduct = {
  name?: string;
  slug?: string;
  stock?: number;
  images?: string[];
};

interface DashboardData {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  recentOrders: Array<{
    id: string;
    customer: string;
    total: number;
  }>;
  topProducts: Array<{
    name: string;
    value: number;
    image?: string;
  }>;
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

interface DashboardOverviewProps {
  dashboardData?: DashboardData;
  loadingData?: boolean;
}

export default function DashboardOverview({
  dashboardData: propData,
  loadingData: propLoading,
}: DashboardOverviewProps) {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    recentOrders: [],
    topProducts: [],
    lowStockProducts: [],
    ordersPerDay: [],
  });
  const [loadingData, setLoadingData] = useState(true);
  // Restock dialog state
  const [restockOpen, setRestockOpen] = useState(false);
  const [restockProduct, setRestockProduct] = useState<{
    name: string;
    slug: string;
    stock: number;
  } | null>(null);
  const [restockQty, setRestockQty] = useState<number>(0);

  useEffect(() => {
    if (propData && !propLoading) {
      setDashboardData(propData);
      setLoadingData(false);
    } else {
      fetchDashboardData();
    }
  }, [propData, propLoading]);

  const fetchDashboardData = async () => {
    try {
      setLoadingData(true);
      // Use a safe base URL: prefer env on server, fallback to window origin or relative paths
      const envBase = process.env.NEXT_PUBLIC_BASE_URL || '';
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const baseUrl = envBase || origin || '';
      const makeUrl = (path: string) => (baseUrl ? `${baseUrl}${path}` : path);

      // Fetch orders
      const ordersRes = await fetch(makeUrl('/api/orders'));
      const ordersData = ordersRes.ok ? await ordersRes.json() : { data: [] };
      const orders: ApiOrder[] = ordersData.data || [];

      // Fetch products
      const productsRes = await fetch(makeUrl('/api/products'));
      const productsData = productsRes.ok ? await productsRes.json() : { data: [] };
      const products: ApiProduct[] = productsData.data || [];

      // Calculate metrics
      const totalOrders = orders.length;
      const pendingOrders = orders.filter((order) => !order.isPaid && !order.isCancelled).length;
      const completedOrders = orders.filter((order) => !!order.isDelivered).length;

      // Get recent orders (last 5)
      const recentOrders = orders
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
        .map((order) => {
          // Safely get user name with better fallback handling
          let customerName = 'Guest User';
          if (order.user) {
            if (typeof order.user === 'object' && order.user !== null) {
              customerName = order.user.name || 'Guest User';
            } else if (typeof order.user === 'string') {
              customerName = 'User ID: ' + order.user;
            }
          }
          
          return {
            id: order._id?.slice(-8) || 'N/A',
            customer: customerName,
            total: order.totalPrice || 0,
          };
        });

      // Calculate top products based on order items
      const productSales: { [key: string]: number } = {};
      orders.forEach((order) => {
        order.orderItems?.forEach((item) => {
          const productName = item.name || 'Unknown Product';
          productSales[productName] = (productSales[productName] || 0) + (item.qty || 0);
        });
      });
      const totalQty = Object.values(productSales).reduce((sum, v) => sum + v, 0);
      const topProducts = Object.entries(productSales)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, sales]) => {
          const product = products.find((p) => p.name === name);
          return {
            name,
            value: (() => {
              const pct = totalQty > 0 ? Math.round((sales / totalQty) * 100) : 0;
              return Math.max(0, Math.min(100, pct));
            })(),
            image: product?.images?.[0],
            exists: !!product,
          };
        });

      // Get low stock products (stock < 10)
      const lowStockProducts = products
        .filter((product) => (product.stock || 0) < 10)
        .slice(0, 5)
        .map((product) => ({
          name: product.name || 'Unknown',
          stock: product.stock || 0,
          status: (product.stock || 0) < 5 ? 'Critical' : 'Low',
          color: (product.stock || 0) < 5 ? 'red' : 'orange',
          image: (product.images && product.images[0]) || '',
          slug: product.slug || '',
        }));

      setDashboardData({
        totalOrders,
        pendingOrders,
        completedOrders,
        recentOrders,
        topProducts,
        lowStockProducts,
        ordersPerDay: [], // This can be calculated if needed
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Restock Dialog */}
      <Dialog open={restockOpen} onOpenChange={setRestockOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restock {restockProduct?.name}</DialogTitle>
            <DialogDescription>Enter the quantity to add to current stock.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">Current Stock</span>
              <span className="text-sm text-gray-600">{restockProduct?.stock ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">Quantity to Add</span>
              <input
                type="number"
                value={restockQty}
                onChange={(e) => setRestockQty(parseInt(e.target.value || '0', 10))}
                className="w-24 pl-2 text-sm text-gray-900 border border-gray-200 rounded"
                min={0}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setRestockOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!restockProduct) return;
                try {
                  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
                  const fd = new FormData();
                  fd.append('stock', String((restockProduct.stock || 0) + (restockQty || 0)));
                  const resp = await fetch(`${baseUrl}/api/products/${restockProduct.slug}`, {
                    method: 'PUT',
                    body: fd,
                  });
                  if (resp.ok) {
                    setRestockOpen(false);
                    setRestockQty(0);
                    setRestockProduct(null);
                    await fetchDashboardData();
                  } else {
                    console.error('Failed to restock product');
                  }
                } catch (e) {
                  console.error('Error restocking product', e);
                }
              }}
            >
              Restock
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Orders */}
        <Card className="bg-white border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm md:text-base font-medium text-gray-600">
                  Total Orders
                </p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                  {loadingData ? '...' : dashboardData.totalOrders}
                </p>

              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Orders */}
        <Card className="bg-white border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm md:text-base font-medium text-gray-600">
                  Pending Orders
                </p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                  {loadingData ? '...' : dashboardData.pendingOrders}
                </p>

              </div>
            </div>
          </CardContent>
        </Card>

        {/* Completed Orders */}
        <Card className="bg-white border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm md:text-base font-medium text-gray-600">
                  Completed Orders
                </p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                  {loadingData ? '...' : dashboardData.completedOrders}
                </p>

              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders Per Day Chart */}
        <LineChartComponent />

        {/* Last 5 Orders */}
        <Card className="bg-white border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">Last 5 Orders</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm font-medium text-gray-500 border-b pb-2">
                <div>Order</div>
                <div>Customer</div>
                <div>Total</div>
              </div>
              {loadingData ? (
                <Loading />
              ) : dashboardData.recentOrders.length > 0 ? (
                dashboardData.recentOrders.map((order) => (
                  <div key={order.id} className="grid grid-cols-3 gap-4 text-sm py-2">
                    <div className="font-medium text-gray-900">{order.id}</div>
                    <div className="text-gray-600">{order.customer}</div>
                    <div className="font-semibold text-green-600">
                      Rs.{order.total.toLocaleString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">No orders yet</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card className="bg-white border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Top Products
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loadingData ? (
                <Loading />
              ) : dashboardData.topProducts.length > 0 ? (
                dashboardData.topProducts.map((product) => (
                  <div key={product.name} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-900 truncate" title={product.name}>
                        {product.name}
                      </span>
                      <span className="text-gray-500 ml-2">{product.value}%</span>
                    </div>
                    <Progress value={product.value} className="h-2" />
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">No product data available</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Products */}
        <Card className="bg-white border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Low Stock Products
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-500 border-b pb-2">
                <div>Product</div>
                <div>Stock</div>
                <div>Status</div>
                <div>Action</div>
              </div>
              {loadingData ? (
                <Loading />
              ) : dashboardData.lowStockProducts.length > 0 ? (
                dashboardData.lowStockProducts.map((product, idx) => (
                  <div key={idx} className="grid grid-cols-4 gap-4 items-center py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-100 rounded overflow-hidden">
                        <Image
                          src={getImageUrl(product.image || '')}
                          alt={product.name}
                          width={32}
                          height={32}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {product.name}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">{product.stock} pcs</div>
                    <div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${product.status === 'Low'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-orange-100 text-orange-800'
                          }`}
                      >
                        {product.status}
                      </span>
                    </div>
                    <div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          setRestockProduct({
                            name: product.name,
                            slug: product.slug,
                            stock: product.stock,
                          });
                          setRestockQty(0);
                          setRestockOpen(true);
                        }}
                      >
                        Restock
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">No low stock products</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
