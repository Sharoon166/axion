'use client';

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown,
  MoreHorizontal,
  CheckCircle,
  Clock,
  AlertTriangle,
  ShoppingCart
} from 'lucide-react';
import { getImageUrl } from '@/lib/utils';

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
  dashboardData: DashboardData;
  loadingData: boolean;
}

export default function DashboardOverview({ dashboardData, loadingData }: DashboardOverviewProps) {
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
        <Card className="bg-white border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">Orders Per Day</CardTitle>
            </div>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-end justify-between gap-1">
              {loadingData ? (
                <div className="w-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                dashboardData.ordersPerDay.map((value: number, i: number) => (
                  <div
                    key={i}
                    className="flex-1 bg-blue-200 rounded-t-sm transition-all hover:bg-blue-300"
                    style={{ height: `${(value / Math.max(...dashboardData.ordersPerDay)) * 100}%` }}
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>

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
              ) : (
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
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        product.status === 'Low' 
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