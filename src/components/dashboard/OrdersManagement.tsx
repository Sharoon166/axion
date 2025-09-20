'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { Package, Truck, CheckCircle, XCircle, Search, Filter, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { api } from '@/lib/api';
import Loading from '@/loading';
import Pagination from '@/components/Pagination';

interface Order {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    matchesStatus: boolean | undefined;
  };
  orderItems: Array<{
    name: string;
    qty: number;
    image: string;
    price: number;
    product: {
      _id: string;
      name: string;
      slug: string;
    };
  }>;
  shippingAddress: {
    fullName: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  paymentMethod: string;
  paymentResult?: {
    id: string;
    status: string;
    update_time: string;
    email_address: string;
  };
  itemsPrice: number;
  shippingPrice: number;
  taxPrice: number;
  totalPrice: number;
  isPaid: boolean;
  isConfirmed?: boolean;
  isShipped?: boolean;
  isDelivered: boolean;
  isCancelled: boolean;
  paidAt?: string;
  confirmedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function OrdersManagement() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  console.log(setItemsPerPage);
  // Order status counts
  const [orderStats, setOrderStats] = useState({
    ordered: 0,
    confirmed: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  });

  const fetchOrders = useCallback(async (retryCount = 0) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch('/api/orders', {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const result = await response.json();
        const orders = result.success ? result.data : [];

        // Filter out orders with missing user data if needed
        const validOrders = orders.filter((order: Order) => {
          if (!order.user && order.user !== null) {
            console.warn('Order found with invalid user reference:', order._id);
            return false;
          }
          return true;
        });

        setOrders(validOrders);

        // Calculate stats
        const stats = validOrders.reduce(
          (
            acc: {
              ordered: number;
              confirmed: number;
              shipped: number;
              delivered: number;
              cancelled: number;
            },
            order: Order,
          ) => {
            if (order.isCancelled) acc.cancelled++;
            else if (order.isDelivered) acc.delivered++;
            else if (order.isShipped) acc.shipped++;
            else if (order.isConfirmed) acc.confirmed++;
            else acc.ordered++;
            return acc;
          },
          { ordered: 0, confirmed: 0, shipped: 0, delivered: 0, cancelled: 0 },
        );

        setOrderStats(stats);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);

      // Retry logic for network errors
      if (
        retryCount < 2 &&
        (error instanceof TypeError || // Network error
          (error instanceof Error && error.name === 'AbortError') || // Timeout
          (error instanceof Error && error.message.includes('504'))) // Gateway timeout
      ) {
        console.log(`Retrying orders fetch (attempt ${retryCount + 1}/3)...`);
        setTimeout(() => fetchOrders(retryCount + 1), 1000 * (retryCount + 1)); // Exponential backoff
        return;
      }

      setOrders([]); // Set empty array on final error
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array since fetchOrders doesn't depend on any props or state
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = orders.filter((order: Order) => {
    const matchesSearch =
      order._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (order.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    let matchesStatus = true;
    if (statusFilter !== 'all') {
      if (statusFilter === 'ordered')
        matchesStatus =
          !order.isConfirmed && !order.isShipped && !order.isDelivered && !order.isCancelled;
      else if (statusFilter === 'confirmed')
        matchesStatus =
          !!order.isConfirmed && !order.isShipped && !order.isDelivered && !order.isCancelled;
      else if (statusFilter === 'shipped')
        matchesStatus = !!order.isShipped && !order.isDelivered && !order.isCancelled;
      else if (statusFilter === 'delivered')
        matchesStatus = order.isDelivered && !order.isCancelled;
      else if (statusFilter === 'cancelled') matchesStatus = order.isCancelled;
    }

    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const getOrderStatus = (order: Order) => {
    if (order.isCancelled) return 'cancelled';
    if (order.isDelivered) return 'delivered';
    if (order.isShipped) return 'shipped';
    if (order.isConfirmed) return 'confirmed';
    return 'ordered';
  };

  const getStatusColor = (order: Order) => {
    const status = getOrderStatus(order);
    switch (status) {
      case 'ordered':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-purple-100 text-purple-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (order: Order) => {
    const status = getOrderStatus(order);
    switch (status) {
      case 'ordered':
        return <Package className="w-4 h-4" />;
      case 'confirmed':
        return <CheckCircle className="w-4 h-4" />;
      case 'shipped':
        return <Truck className="w-4 h-4" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const handleOrderClick = (order: Order) => {
    router.push(`/order/${order._id}`);
  };

  const updateOrderStatus = async (
    orderId: string,
    newStatus: 'ordered' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled',
  ) => {
    try {
      if (newStatus === 'cancelled') {
        // Use the dedicated cancel endpoint for better stock restoration
        await api.orders.cancel(orderId, 'Cancelled by admin');
      } else {
        await api.orders.updateStatus(orderId, newStatus);
      }
      await fetchOrders(); // Refresh orders list
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Orders</h2>
          <p className="text-gray-600">Track and manage customer orders</p>
        </div>
      </div>

      {/* Order Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            label: 'Ordered',
            value: orderStats.ordered,
            color: 'text-yellow-600',
            bg: 'bg-yellow-100',
            icon: <Package className="w-5 h-5 text-yellow-600" />,
          },
          {
            label: 'Confirmed',
            value: orderStats.confirmed,
            color: 'text-purple-600',
            bg: 'bg-purple-100',
            icon: <CheckCircle className="w-5 h-5 text-purple-600" />,
          },
          {
            label: 'Shipped',
            value: orderStats.shipped,
            color: 'text-blue-600',
            bg: 'bg-blue-100',
            icon: <Truck className="w-5 h-5 text-blue-600" />,
          },
          {
            label: 'Delivered',
            value: orderStats.delivered,
            color: 'text-green-600',
            bg: 'bg-green-100',
            icon: <CheckCircle className="w-5 h-5 text-green-600" />,
          },
          {
            label: 'Cancelled',
            value: orderStats.cancelled,
            color: 'text-red-600',
            bg: 'bg-red-100',
            icon: <XCircle className="w-5 h-5 text-red-600" />,
          },
        ].map((item, i) => (
          <Card key={i} className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:text-left sm:gap-3">
                <div
                  className={`w-10 h-10 ${item.bg} rounded-lg flex items-center justify-center mb-2 sm:mb-0`}
                >
                  {item.icon}
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">{item.label}</p>
                  <p className={`text-lg sm:text-xl md:text-2xl font-bold ${item.color}`}>
                    {item.value}
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-500">Orders</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mobile Filter Toggle */}
      <div className="lg:hidden">
        <Button
          variant="outline"
          onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
          className="w-full flex items-center justify-center gap-2"
        >
          <Filter className="w-4 h-4" />
          {mobileFiltersOpen ? 'Hide Filters' : 'Show Filters'}
        </Button>
      </div>

      {/* Orders Table */}
      <Card className="bg-white border border-gray-200">
        <CardContent className="p-4 md:p-6">
          {/* Filters */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Orders</h3>
            <div
              className={`${mobileFiltersOpen ? 'flex' : 'hidden'} lg:flex flex-col lg:flex-row gap-4 w-full lg:w-auto`}
            >
              <div className="relative flex-1 lg:flex-none lg:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ordered">Ordered</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <Loading />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full hidden md:table">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Order ID</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Customer</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Price</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No orders found</p>
                        <p className="text-sm">Orders will appear here when customers place them</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedOrders.map((order) => (
                      <tr
                        key={order._id}
                        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleOrderClick(order)}
                      >
                        <td className="py-4 px-4 font-medium text-gray-900">
                          #{order._id.slice(-8)}
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-medium text-gray-900">
                              {order.user?.name || 'Unknown User'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {order.user?.email || 'No email'}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge
                            className={`${getStatusColor(order)} flex items-center gap-1 w-fit`}
                          >
                            {getStatusIcon(order)}
                            {getOrderStatus(order)}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 font-semibold text-gray-900">
                          Rs.{order.totalPrice.toLocaleString()}
                        </td>
                        <td className="py-4 px-4 text-gray-600">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="capitalize"
                                onClick={(e) => e.stopPropagation()}
                                aria-label="Change order status"
                                title="Change order status"
                              >
                                <MoreHorizontal />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenuItem
                                onClick={() => updateOrderStatus(order._id, 'ordered')}
                              >
                                Ordered
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => updateOrderStatus(order._id, 'confirmed')}
                              >
                                Confirmed
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => updateOrderStatus(order._id, 'shipped')}
                              >
                                Shipped
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => updateOrderStatus(order._id, 'delivered')}
                              >
                                Delivered
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => updateOrderStatus(order._id, 'cancelled')}
                                className="text-red-600"
                              >
                                Cancelled
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {/* Mobile Cards */}
              <div className="md:hidden space-y-4">
                {paginatedOrders.length === 0 ? (
                  <div className="py-12 text-center text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No orders found</p>
                    <p className="text-sm">Orders will appear here when customers place them</p>
                  </div>
                ) : (
                  paginatedOrders.map((order) => (
                    <Card key={order._id} className="overflow-hidden">
                      <CardContent>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-gray-900">#{order._id.slice(-8)}</p>
                            <p className="text-sm text-gray-600">
                              {order.user?.name || 'Unknown User'}
                            </p>
                          </div>
                          <Badge className={`${getStatusColor(order)} flex items-center gap-1`}>
                            {getStatusIcon(order)}
                            {getOrderStatus(order)}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                          <span>Rs.{order.totalPrice.toLocaleString()}</span>
                          <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleOrderClick(order)}
                          >
                            View
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="flex-1 capitalize">
                                Status
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => updateOrderStatus(order._id, 'ordered')}
                              >
                                Ordered
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => updateOrderStatus(order._id, 'confirmed')}
                              >
                                Confirmed
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => updateOrderStatus(order._id, 'shipped')}
                              >
                                Shipped
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => updateOrderStatus(order._id, 'delivered')}
                              >
                                Delivered
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => updateOrderStatus(order._id, 'cancelled')}
                                className="text-red-600"
                              >
                                Cancelled
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Pagination Controls */}
          {filteredOrders.length > 0 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-end gap-4 border-t border-gray-200 pt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
