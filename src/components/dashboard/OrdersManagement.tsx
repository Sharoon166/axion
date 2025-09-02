'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Search
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getImageUrl } from '@/lib/utils';
import { api } from '@/lib/api';

interface Order {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
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
  isDelivered: boolean;
  isCancelled: boolean;
  paidAt?: string;
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
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  // Order status counts
  const [orderStats, setOrderStats] = useState({
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      if (response.ok) {
        const result = await response.json();
        const orders = result.success ? result.data : [];
        setOrders(orders);

        // Calculate stats
        const stats = orders.reduce((acc: any, order: Order) => {
          if (order.isCancelled) acc.cancelled++;
          else if (order.isDelivered) acc.delivered++;
          else if (order.isPaid) acc.shipped++;
          else acc.processing++;
          return acc;
        }, { processing: 0, shipped: 0, delivered: 0, cancelled: 0 });

        setOrderStats(stats);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (order.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    let matchesStatus = true;
    if (statusFilter !== 'all') {
      if (statusFilter === 'processing') matchesStatus = !order.isPaid && !order.isDelivered && !order.isCancelled;
      else if (statusFilter === 'shipped') matchesStatus = order.isPaid && !order.isDelivered && !order.isCancelled;
      else if (statusFilter === 'delivered') matchesStatus = order.isDelivered && !order.isCancelled;
      else if (statusFilter === 'cancelled') matchesStatus = order.isCancelled;
    }

    return matchesSearch && matchesStatus;
  });

  const getOrderStatus = (order: Order) => {
    if (order.isCancelled) return 'cancelled';
    if (order.isDelivered) return 'delivered';
    if (order.isPaid) return 'shipped';
    return 'processing';
  };

  const getStatusColor = (order: Order) => {
    const status = getOrderStatus(order);
    switch (status) {
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
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
      case 'processing':
        return <Package className="w-4 h-4" />;
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
    newStatus: 'processing' | 'paid' | 'delivered' | 'cancelled',
  ) => {
    try {
      await api.orders.updateStatus(orderId, newStatus);
      await fetchOrders(); // Refresh orders list
      setShowOrderDetails(false);
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };
  

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Orders</h2>
      </div>

      {/* Order Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white border border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Processing</p>
                <p className="text-2xl font-bold text-blue-600">{orderStats.processing}</p>
                <p className="text-xs text-gray-500">Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Truck className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Shipped</p>
                <p className="text-2xl font-bold text-blue-600">{orderStats.shipped}</p>
                <p className="text-xs text-gray-500">Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Delivered</p>
                <p className="text-2xl font-bold text-blue-600">{orderStats.delivered}</p>
                <p className="text-xs text-gray-500">Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Cancelled</p>
                <p className="text-2xl font-bold text-blue-600">{orderStats.cancelled}</p>
                <p className="text-xs text-gray-500">Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card className="bg-white border border-gray-200">
        <CardContent className="p-6">
          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
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
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No orders found</p>
                        <p className="text-sm">Orders will appear here when customers place them</p>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr
                        key={order._id}
                        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleOrderClick(order)}
                      >
                        <td className="py-4 px-4 font-medium text-gray-900">#{order._id.slice(-8)}</td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{order.user?.name || 'Unknown User'}</p>
                            <p className="text-sm text-gray-500">{order.user?.email || 'No email'}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge className={`${getStatusColor(order)} flex items-center gap-1 w-fit`}>
                            {getStatusIcon(order)}
                            {getOrderStatus(order)}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 font-semibold text-gray-900">Rs.{order.totalPrice.toLocaleString()}</td>
                        <td className="py-4 px-4 text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td className="py-4 px-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="capitalize">
                                {getOrderStatus(order)}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => updateOrderStatus(order._id, 'processing')}>
                                Processing
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateOrderStatus(order._id, 'paid')}>
                                Shipped
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateOrderStatus(order._id, 'delivered')}>
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}