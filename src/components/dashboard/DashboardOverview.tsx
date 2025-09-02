'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Clock,
  AlertTriangle,
  ShoppingCart
} from 'lucide-react';
import { getImageUrl } from '@/lib/utils';
import LineChartComponent from './LineChartComponent';

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
  }>;
  ordersPerDay: number[];
}

interface DashboardOverviewProps {
  dashboardData?: DashboardData;
  loadingData?: boolean;
}

export default function DashboardOverview({ dashboardData: propData, loadingData: propLoading }: DashboardOverviewProps) {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    recentOrders: [],
    topProducts: [],
    lowStockProducts: [],
    ordersPerDay: []
  });
  const [loadingData, setLoadingData] = useState(true);

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
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      
      // Fetch orders
      const ordersRes = await fetch(`${baseUrl}/api/orders`);
      const ordersData = ordersRes.ok ? await ordersRes.json() : { data: [] };
      const orders = ordersData.data || [];
      
      // Fetch products
      const productsRes = await fetch(`${baseUrl}/api/products`);
      const productsData = productsRes.ok ? await productsRes.json() : { data: [] };
      const products = productsData.data || [];
      
      // Calculate metrics
      const totalOrders = orders.length;
      const pendingOrders = orders.filter((order: any) => !order.isPaid && !order.isCancelled).length;
      const completedOrders = orders.filter((order: any) => order.isDelivered).length;
      
      // Get recent orders (last 5)
      const recentOrders = orders
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
        .map((order: any) => ({
          id: order._id?.slice(-8) || 'N/A',
          customer: order.user?.name || order.shippingAddress?.fullName || 'Unknown',
          total: order.totalPrice || 0
        }));
      
      // Calculate top products based on order items
      const productSales: { [key: string]: number } = {};
      orders.forEach((order: any) => {
        order.orderItems?.forEach((item: any) => {
          const productName = item.name || 'Unknown Product';
          productSales[productName] = (productSales[productName] || 0) + (item.qty || 0);
        });
      });
      
      const topProducts = Object.entries(productSales)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([name, sales]) => {
          const maxSales = Math.max(...Object.values(productSales));
          return {
            name,
            value: maxSales > 0 ? Math.round((sales / maxSales) * 100) : 0,
            image: products.find((p: any) => p.name === name)?.image
          };
        });
      
      // Get low stock products (stock < 10)
      const lowStockProducts = products
        .filter((product: any) => (product.countInStock || 0) < 10)
        .slice(0, 5)
        .map((product: any) => ({
          name: product.name || 'Unknown',
          stock: product.countInStock || 0,
          status: (product.countInStock || 0) < 5 ? 'Critical' : 'Low',
          color: (product.countInStock || 0) < 5 ? 'red' : 'orange',
          image: product.image
        }));
      
      setDashboardData({
        totalOrders,
        pendingOrders,
        completedOrders,
        recentOrders,
        topProducts,
        lowStockProducts,
        ordersPerDay: [] // This can be calculated if needed
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoadingData(false);
    }
  };
  return (
    <div className="space-y-6">
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
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-3xl font-bold text-gray-900">
                  {loadingData ? '...' : dashboardData.totalOrders}
                </p>
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  +20% Last Month
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
                <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                <p className="text-3xl font-bold text-gray-900">
                  {loadingData ? '...' : dashboardData.pendingOrders}
                </p>
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <TrendingDown className="w-4 h-4" />
                  -5% Last Month
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
                <p className="text-sm font-medium text-gray-600">Completed Orders</p>
                <p className="text-3xl font-bold text-gray-900">
                  {loadingData ? '...' : dashboardData.completedOrders}
                </p>
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  +15% Last Month
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
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : dashboardData.recentOrders.length > 0 ? (
                dashboardData.recentOrders.map((order: any) => (
                  <div key={order.id} className="grid grid-cols-3 gap-4 text-sm py-2">
                    <div className="font-medium text-gray-900">{order.id}</div>
                    <div className="text-gray-600">{order.customer}</div>
                    <div className="font-semibold text-green-600">Rs.{order.total.toLocaleString()}</div>
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
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : dashboardData.topProducts.length > 0 ? (
                dashboardData.topProducts.map((product: any) => (
                  <div key={product.name} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-900">{product.name}</span>
                      <span className="text-gray-500">{product.value}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${product.value}%` }}
                      />
                    </div>
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
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : dashboardData.lowStockProducts.length > 0 ? (
                dashboardData.lowStockProducts.map((product: any, idx: number) => (
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
                      <span className="text-sm font-medium text-gray-900 truncate">{product.name}</span>
                    </div>
                    <div className="text-sm text-gray-600">{product.stock} pcs</div>
                    <div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${product.status === 'Low'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-orange-100 text-orange-800'
                        }`}>
                        {product.status}
                      </span>
                    </div>
                    <div>
                      <Button variant="outline" size="sm" className="text-xs">
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