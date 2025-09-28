'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, CheckCircle, Clock, AlertTriangle, ShoppingCart, Edit } from 'lucide-react';
import Link from 'next/link';
import LineChartComponent from './LineChartComponent';
import Loading from '@/loading';

import { DashboardData } from '@/lib/actions/dashboard';
import { Badge } from '../ui/badge';
import Pagination from '@/components/Pagination';

interface DashboardOverviewProps {
  dashboardData: DashboardData;
  loadingData?: boolean;
}

export default function DashboardOverview({
  dashboardData,
  loadingData = false,
}: DashboardOverviewProps) {
  // Low stock pagination state
  const [lsPage, setLsPage] = useState(1);
  const lsPageSize = 10;
  const totalLowStock = dashboardData.lowStockProducts.length;
  const totalLsPages = Math.max(1, Math.ceil(totalLowStock / lsPageSize));

  // Ensure current page in bounds when data changes
  const safePage = Math.min(lsPage, totalLsPages);
  if (safePage !== lsPage) {
    // lightweight guard without re-render loops
    setTimeout(() => setLsPage(safePage), 0);
  }

  const paginatedLowStock = useMemo(() => {
    const start = (safePage - 1) * lsPageSize;
    const end = start + lsPageSize;
    return dashboardData.lowStockProducts.slice(start, end);
  }, [dashboardData.lowStockProducts, safePage]);

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
                  Delivered Orders
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
        <div className='col-span-2'>
          <LineChartComponent />
        </div>

        {/* Last 5 Orders */}
        <Card className="bg-white col-span-2 lg:col-span-1 border border-gray-200">
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
        {/* Top Products */}
        <Card className="bg-white col-span-2 lg:col-span-1 border border-gray-200">
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
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1  gap-6">

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
                paginatedLowStock.map((product, idx) => (
                  <div key={idx} className="grid grid-cols-4 gap-2 items-center">
                    <div className="">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {product.name.split("—")[0]}
                      </span>
                      <div className="text-xs font-medium text-muted-foreground ">
                        ({product.name.split("—")[1]})
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">{product.stock} pc(s)</div>
                    <div>
                      <Badge
                        className={`${product.status === 'Low'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-orange-100 text-orange-800'
                          }`}
                      >
                        {product.status}
                      </Badge>
                    </div>
                    <div>
                      <Button asChild variant="outline" size="sm" className="text-xs">
                        <Link href={`/admin/products/${product.slug}/edit`}>
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">No low stock products</div>
              )}

              {/* Pagination Controls */}
              {!loadingData && dashboardData.lowStockProducts.length > 0 && (
                <div className="pt-4 flex items-center justify-end">
                 
                  <Pagination
                    currentPage={safePage}
                    totalPages={totalLsPages}
                    onPageChange={(page) => setLsPage(Math.max(1, Math.min(totalLsPages, page)))}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
